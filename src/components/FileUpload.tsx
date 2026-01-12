import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  existingFiles: UploadedFile[];
  onRemoveFile: (index: number) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export interface UploadedFile {
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  description?: string;
}

export function FileUpload({
  onFilesSelected,
  existingFiles,
  onRemoveFile,
  maxFiles = 10,
  maxSizeMB = 5
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setError('');
    const fileArray = Array.from(files);

    if (existingFiles.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    const uploadedFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      if (file.size > maxSize) {
        setError(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        uploadedFiles.push({
          file_name: file.name,
          file_url: base64,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
        });
      } catch (err) {
        setError(`Failed to upload ${file.name}`);
      }
    }

    if (uploadedFiles.length > 0) {
      onFilesSelected(uploadedFiles);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600 mb-1">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-slate-500">
          Max {maxFiles} files, up to {maxSizeMB}MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          {existingFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="text-slate-600 flex-shrink-0">
                  {getFileIcon(file.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.file_size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemoveFile(index)}
                className="flex-shrink-0 text-slate-400 hover:text-red-600 transition ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
