import React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { useImageUploadMutation } from '../helpers/useImageUploadMutation';
import styles from './ImageUpload.module.css';
import { Button } from './Button';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  initialImageUrl?: string | null;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  initialImageUrl,
  className,
}) => {
  const [preview, setPreview] = useState<string | null>(initialImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useImageUploadMutation();

  useEffect(() => {
    setPreview(initialImageUrl || null);
  }, [initialImageUrl]);

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;

    // Basic client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please select a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('File is too large. Maximum size is 5MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        onUploadComplete(data.imageUrl);
        // The preview is already set, no need to update it again unless we want to use the Cloudinary URL
      },
      onError: () => {
        // On error, revert to the initial image if it exists
        setPreview(initialImageUrl || null);
        URL.revokeObjectURL(previewUrl); // Clean up memory
      }
    });
  }, [uploadMutation, onUploadComplete, initialImageUrl]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (preview) {
      // If it's a blob URL, revoke it
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    }
    setPreview(null);
    onUploadComplete(''); // Notify parent that image is removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    uploadMutation.reset();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${preview ? styles.hasPreview : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && triggerFileSelect()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileSelect}
          className={styles.fileInput}
          disabled={uploadMutation.isPending}
        />

        {preview ? (
          <>
            <img src={preview} alt="Preview" className={styles.previewImage} />
            <Button
              variant="destructive"
              size="icon-sm"
              className={styles.removeButton}
              onClick={handleRemoveImage}
              aria-label="Remove image"
            >
              <X size={16} />
            </Button>
          </>
        ) : (
          <div className={styles.placeholder}>
            <UploadCloud size={32} className={styles.placeholderIcon} />
            <p className={styles.placeholderText}>
              <span className={styles.link}>Click to upload</span> or drag and drop
            </p>
            <p className={styles.placeholderSubtext}>PNG, JPG, or WebP (max 5MB)</p>
          </div>
        )}

        {uploadMutation.isPending && (
          <div className={styles.overlay}>
            <div className={styles.spinner}></div>
            <p>Uploading...</p>
          </div>
        )}
      </div>
    </div>
  );
};