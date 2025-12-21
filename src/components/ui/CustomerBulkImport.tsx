import React, { useState, useMemo, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileDropzone } from './FileDropzone';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';
import { parseCSV, validateCSVStructure } from '../helpers/csvUtils';
import { validateCustomerRow, ValidationResult } from '../helpers/csvImport';
import { postCustomersBulkImport } from '../endpoints/customers/bulk-import_POST.schema';
import { getCustomersDownloadTemplate } from '../endpoints/customers/download-template_GET.schema';
import { Download, UploadCloud, FileCheck2, FileX2, ChevronsRight, RotateCw } from 'lucide-react';
import styles from './CustomerBulkImport.module.css';

const EXPECTED_HEADERS = ['firstName', 'lastName', 'email', 'idType', 'idNumber', 'mobile', 'locationId', 'apartment', 'birthDate'];

type ImportStep = 'upload' | 'preview' | 'processing' | 'results';

interface ImportResult {
  customerNumber: string;
  name: string;
  pin: string | null;
}

export const CustomerBulkImport = ({ className }: { className?: string }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [generatePins, setGeneratePins] = useState(true);
  const [importResults, setImportResults] = useState<{ imported: number; failed: number; customers: ImportResult[] }>({ imported: 0, failed: 0, customers: [] });

  const handleFileSelect = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const validation = validateCSVStructure(text, EXPECTED_HEADERS);
      if (!validation.isValid) {
        toast.error('CSV Validation Failed', { description: validation.message });
        return;
      }
      setFileContent(text);
      setFileName(file.name);
      processAndValidateCsv(text);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const processAndValidateCsv = (text: string) => {
    const parsedData = parseCSV(text);
    const existingEmails = new Set<string>();
    const existingMobiles = new Set<string>();
    const existingIdNumbers = new Set<string>();
    
    const results = parsedData.map(row => 
      validateCustomerRow(row, existingEmails, existingMobiles, existingIdNumbers)
    );
    setValidationResults(results);
  };

  const { validRows, invalidRows } = useMemo(() => {
    const valid = validationResults.filter(r => r.isValid);
    const invalid = validationResults.filter(r => !r.isValid);
    return { validRows: valid, invalidRows: invalid };
  }, [validationResults]);

  const importMutation = useMutation({
    mutationFn: postCustomersBulkImport,
    onSuccess: (data) => {
      setImportResults(data);
      setStep('results');
      toast.success('Import completed!', {
        description: `${data.imported} customers imported, ${data.failed} failed.`,
      });
    },
    onError: (error) => {
      toast.error('Import Failed', { description: error instanceof Error ? error.message : 'An unknown error occurred.' });
      setStep('preview'); // Go back to preview on error
    },
  });

  const handleImport = () => {
    const customersToImport = validRows.map(row => {
        const data = row.data;
        return {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email || null,
            idType: data.idType as 'CC' | 'CE' | 'NIT',
            idNumber: data.idNumber,
            mobile: data.mobile || null,
            locationId: parseInt(data.locationId, 10),
            apartment: data.apartment || null,
            dateOfBirth: data.birthDate ? new Date(data.birthDate) : null,
        };
    });

    if (customersToImport.length === 0) {
      toast.warning('No valid customers to import.');
      return;
    }

    setStep('processing');
    importMutation.mutate({ customers: customersToImport, generatePin: generatePins });
  };

  const handleDownloadTemplate = async () => {
    try {
      const csvString = await getCustomersDownloadTemplate();
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "customer_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Failed to download template.');
    }
  };

  const handleDownloadResults = () => {
    const headers = ['customerNumber', 'name', 'pin'];
    const csvContent = [
      headers.join(','),
      ...importResults.customers.map(c => `${c.customerNumber},"${c.name}",${c.pin ?? ''}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "import_results.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startNewImport = () => {
    setFileContent('');
    setFileName('');
    setValidationResults([]);
    setImportResults({ imported: 0, failed: 0, customers: [] });
    setStep('upload');
  };

  const renderUploadStep = () => (
    <div className={styles.stepContainer}>
      <h2>Step 1: Upload CSV File</h2>
      <p>Select a CSV file with customer data. You can download a template to see the required format.</p>
      <FileDropzone
        onFilesSelected={handleFileSelect}
        accept=".csv"
        maxFiles={1}
        title="Drag & drop a .csv file here, or click to select"
        icon={<UploadCloud size={48} />}
      />
      <Button variant="link" onClick={handleDownloadTemplate} className={styles.templateButton}>
        <Download size={16} />
        Download Template
      </Button>
    </div>
  );

  const renderPreviewStep = () => (
    <div className={styles.stepContainer}>
      <h2>Step 2: Preview & Validate</h2>
      <p>Review the validation results for <strong>{fileName}</strong>. Only valid rows will be imported.</p>
      <div className={styles.summary}>
        <Badge variant="success"><FileCheck2 size={16} /> {validRows.length} Valid</Badge>
        <Badge variant="destructive"><FileX2 size={16} /> {invalidRows.length} Errors</Badge>
      </div>
      <div className={styles.previewTableContainer}>
        <table className={styles.previewTable}>
          <thead>
            <tr>
              <th>Status</th>
              {EXPECTED_HEADERS.map(h => <th key={h}>{h}</th>)}
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            {validationResults.slice(0, 100).map((result, index) => (
              <tr key={index} className={result.isValid ? styles.validRow : styles.invalidRow}>
                <td>{result.isValid ? <Badge variant="success">Valid</Badge> : <Badge variant="destructive">Invalid</Badge>}</td>
                {EXPECTED_HEADERS.map(h => <td key={h}>{result.data[h]}</td>)}
                <td>{result.errors.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {validationResults.length > 100 && <p className={styles.tableFooter}>Showing first 100 rows...</p>}
      </div>
      <div className={styles.actions}>
        <Button variant="outline" onClick={startNewImport}>
          <RotateCw size={16} />
          Start Over
        </Button>
        <div className={styles.importActions}>
          <div className={styles.checkboxContainer}>
            <Checkbox id="generatePins" checked={generatePins} onChange={(e) => setGeneratePins(e.target.checked)} />
            <label htmlFor="generatePins">Generate PINs automatically</label>
          </div>
          <Button onClick={handleImport} disabled={validRows.length === 0}>
            Import {validRows.length} Customers <ChevronsRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className={styles.stepContainer}>
      <h2>Step 3: Processing Import</h2>
      <p>Please wait while we import your customers. This may take a few moments for large files.</p>
      <div className={styles.processing}>
        <Skeleton className={styles.progressBar} />
        <p>Importing {validRows.length} customers...</p>
      </div>
    </div>
  );

  const renderResultsStep = () => (
    <div className={styles.stepContainer}>
      <h2>Step 4: Import Complete</h2>
      <p>The import process has finished. Here is a summary of the results.</p>
      <div className={styles.summary}>
        <Badge variant="success"><FileCheck2 size={16} /> {importResults.imported} Imported</Badge>
        <Badge variant="destructive"><FileX2 size={16} /> {importResults.failed} Failed</Badge>
      </div>
      {importResults.customers.length > 0 && (
        <p>Download the results file to get the generated customer numbers and PINs.</p>
      )}
      <div className={styles.actions}>
        <Button variant="outline" onClick={startNewImport}>
          <RotateCw size={16} />
          Start New Import
        </Button>
        {importResults.customers.length > 0 && (
          <Button onClick={handleDownloadResults}>
            <Download size={16} />
            Download Results
          </Button>
        )}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'upload': return renderUploadStep();
      case 'preview': return renderPreviewStep();
      case 'processing': return renderProcessingStep();
      case 'results': return renderResultsStep();
      default: return renderUploadStep();
    }
  };

  return <div className={`${styles.container} ${className}`}>{renderStep()}</div>;
};