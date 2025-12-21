import { detectDelimiter, splitCSVRow, parseCSV, validateCSVStructure } from './csvUtils';

describe('csvUtils', () => {
  describe('detectDelimiter', () => {
    it('should detect comma delimiter', () => {
      const csv = 'name,age,city\nJohn,25,NYC\nJane,30,LA';
      expect(detectDelimiter(csv)).toBe(',');
    });

    it('should detect semicolon delimiter', () => {
      const csv = 'name;age;city\nJohn;25;NYC\nJane;30;LA';
      expect(detectDelimiter(csv)).toBe(';');
    });

    it('should detect tab delimiter', () => {
      const csv = 'name\tage\tcity\nJohn\t25\tNYC\nJane\t30\tLA';
      expect(detectDelimiter(csv)).toBe('\t');
    });

    it('should default to comma for ambiguous cases', () => {
      const csv = 'singlefield\nvalue1\nvalue2';
      expect(detectDelimiter(csv)).toBe(',');
    });
  });

  describe('splitCSVRow', () => {
    it('should split simple comma-separated values', () => {
      const row = 'name,age,city';
      expect(splitCSVRow(row, ',')).toEqual(['name', 'age', 'city']);
    });

    it('should handle quoted fields with delimiters', () => {
      const row = '"Product, Special",25,"New York, NY"';
      expect(splitCSVRow(row, ',')).toEqual(['Product, Special', '25', 'New York, NY']);
    });

    it('should handle escaped quotes', () => {
      const row = '"Product with ""quotes""",25,city';
      expect(splitCSVRow(row, ',')).toEqual(['Product with "quotes"', '25', 'city']);
    });

    it('should handle mixed quoted and unquoted fields', () => {
      const row = 'simple,"quoted field",another';
      expect(splitCSVRow(row, ',')).toEqual(['simple', 'quoted field', 'another']);
    });

    it('should handle empty fields', () => {
      const row = 'name,,city';
      expect(splitCSVRow(row, ',')).toEqual(['name', '', 'city']);
    });

    it('should handle empty quoted fields', () => {
      const row = 'name,"",city';
      expect(splitCSVRow(row, ',')).toEqual(['name', '', 'city']);
    });
  });

  describe('parseCSV', () => {
    it('should parse simple CSV with auto-detected delimiter', () => {
      const csv = 'name,age\nJohn,25\nJane,30';
      const result = parseCSV(csv);
      expect(result).toEqual([
        { name: 'John', age: '25' },
        { name: 'Jane', age: '30' }
      ]);
    });

    it('should parse CSV with quoted fields containing delimiters', () => {
      const csv = 'name,description\n"John Doe","Product, Special"\n"Jane Smith","Regular Item"';
      const result = parseCSV(csv);
      expect(result).toEqual([
        { name: 'John Doe', description: 'Product, Special' },
        { name: 'Jane Smith', description: 'Regular Item' }
      ]);
    });

    it('should handle different line break formats', () => {
      const csvCRLF = 'name,age\r\nJohn,25\r\nJane,30';
      const csvCR = 'name,age\rJohn,25\rJane,30';
      const csvLF = 'name,age\nJohn,25\nJane,30';
      
      const expected = [
        { name: 'John', age: '25' },
        { name: 'Jane', age: '30' }
      ];
      
      expect(parseCSV(csvCRLF)).toEqual(expected);
      expect(parseCSV(csvCR)).toEqual(expected);
      expect(parseCSV(csvLF)).toEqual(expected);
    });

    it('should handle escaped quotes correctly', () => {
      const csv = 'name,quote\n"John","He said ""Hello"""\n"Jane","Simple text"';
      const result = parseCSV(csv);
      expect(result).toEqual([
        { name: 'John', quote: 'He said "Hello"' },
        { name: 'Jane', quote: 'Simple text' }
      ]);
    });

    it('should skip empty lines', () => {
      const csv = 'name,age\nJohn,25\n\nJane,30\n';
      const result = parseCSV(csv);
      expect(result).toEqual([
        { name: 'John', age: '25' },
        { name: 'Jane', age: '30' }
      ]);
    });

    it('should return empty array for invalid input', () => {
      expect(parseCSV('')).toEqual([]);
      expect(parseCSV('just-header')).toEqual([]);
    });
  });

  describe('validateCSVStructure', () => {
    it('should validate correct CSV structure', () => {
      const csv = 'name,age\nJohn,25\nJane,30';
      const result = validateCSVStructure(csv, ['name', 'age']);
      expect(result.isValid).toBe(true);
    });

    it('should detect missing headers', () => {
      const csv = 'name,city\nJohn,NYC\nJane,LA';
      const result = validateCSVStructure(csv, ['name', 'age']);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Missing required columns: age');
    });

    it('should detect incorrect column count', () => {
      const csv = 'name\nJohn\nJane';
      const result = validateCSVStructure(csv, ['name', 'age']);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid column count');
    });

    it('should detect inconsistent row lengths', () => {
      const csv = 'name,age\nJohn,25\nJane,30,extra';
      const result = validateCSVStructure(csv, ['name', 'age']);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('incorrect number of columns');
    });

    it('should handle quoted fields in validation', () => {
      const csv = 'name,description\n"John Doe","Product, Special"\n"Jane Smith","Regular Item"';
      const result = validateCSVStructure(csv, ['name', 'description']);
      expect(result.isValid).toBe(true);
    });

    it('should auto-detect delimiter in validation', () => {
      const csv = 'name;age\nJohn;25\nJane;30';
      const result = validateCSVStructure(csv, ['name', 'age']);
      expect(result.isValid).toBe(true);
    });

    it('should handle empty CSV', () => {
      const result = validateCSVStructure('', ['name']);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('CSV content is empty or invalid.');
    });
  });
});