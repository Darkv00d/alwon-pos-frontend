import React, { useState, useRef, useCallback } from 'react';
import { useCloudinaryUpload } from '../helpers/useCloudinaryUpload';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { UploadCloud, XCircle, CheckCircle2, FileImage } from 'lucide-react';
import styles from './ImageUploader.module.css';

export interface ImageUploaderProps {
  onUploaded: (url: string) => void;
  folder?: string;
  buttonLabel?: string;
  accept?: string;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploaded,
  folder,
  buttonLabel = 'Upload Image',
  accept = 'image/*',
  className,
}) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useCloudinaryUpload({
    onSuccess: (data) => {
      console.log('Upload successful:', data);
      onUploaded(data.secure_url);
      // Reset state after a short delay to show success message
      setTimeout(() => {
        setProgress(0);
        setFileName(null);
        setError(null);
      }, 2000);
    },
    onError: (err) => {
      console.error('Upload failed:', err);
      setError(err.message || 'An unknown error occurred during upload.');
      setProgress(0);
    },
    onProgress: (p) => {
      setProgress(p);
    },
  });

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    // Reset states for new upload
    setError(null);
    setProgress(0);
    setFileName(file.name);

    uploadMutation.mutate({ file, folder });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    if (!uploadMutation.isPending) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (uploadMutation.isPending) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const isUploading = uploadMutation.isPending;
  const isSuccess = uploadMutation.isSuccess;

  const containerClasses = [
    styles.container,
    isDragging ? styles.dragging : '',
    isUploading ? styles.uploading : '',
    error ? styles.error : '',
    isSuccess ? styles.success : '',
    className || '',
  ].join(' ');

  return (
    <div
      className={containerClasses}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragEvents}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept={accept}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      {isUploading && (
        <div className={styles.statusContainer}>
          <Spinner size="md" />
          <p className={styles.statusText}>Uploading {fileName}...</p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={styles.progressText}>{progress}%</p>
        </div>
      )}

      {isSuccess && (
        <div className={styles.statusContainer}>
          <CheckCircle2 size={48} className={styles.successIcon} />
          <p className={styles.statusText}>Upload Complete!</p>
          <p className={styles.fileName}>{fileName}</p>
        </div>
      )}

      {error && (
        <div className={styles.statusContainer}>
          <XCircle size={48} className={styles.errorIcon} />
          <p className={styles.statusText}>Upload Failed</p>
          <p className={styles.errorMessage}>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              setFileName(null);
            }}
          >
            Try Again
          </Button>
        </div>
      )}

      {!isUploading && !isSuccess && !error && (
        <div className={styles.idleContainer}>
          <UploadCloud size={48} className={styles.idleIcon} />
          <p className={styles.idleText}>
            Drag & drop an image here, or
          </p>
          <Button
            variant="secondary"
            onClick={handleButtonClick}
            disabled={isUploading}
          >
            {buttonLabel}
          </Button>
        </div>
      )}
    </div>
  );
};