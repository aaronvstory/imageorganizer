import React, { useCallback } from 'react';
import { Upload, Image } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export function UploadZone({ onFilesSelected, isProcessing }: UploadZoneProps) {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <div
      className={`border-2 border-dashed border-gray-300 rounded-xl p-12 text-center transition-all duration-300 ${
        isProcessing ? 'opacity-50 pointer-events-none' : 'hover:border-blue-400 hover:bg-blue-50'
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-blue-100 rounded-full">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Upload Images for Organization
          </h3>
          <p className="text-gray-500 mb-4">
            Drag and drop up to 100 images here, or click to browse
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Supports JPG, PNG, GIF • Optimized for driver licenses and ID documents
          </p>
        </div>
        <label className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium cursor-pointer hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2">
          <Image className="w-4 h-4" />
          <span>Choose Images</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />
        </label>
      </div>
    </div>
  );
}