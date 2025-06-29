import React from 'react';
import { Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';

interface ProcessingProgressProps {
  total: number;
  completed: number;
  failed: number;
  currentFile?: string;
}

export function ProcessingProgress({ total, completed, failed, currentFile }: ProcessingProgressProps) {
  const progress = (completed + failed) / total * 100;
  const successful = completed - failed;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        <h3 className="text-lg font-semibold text-gray-800">Processing Images</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress: {completed + failed} / {total} images</span>
          <span>{Math.round(progress)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Total: {total}</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">Success: {successful}</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">Failed: {failed}</span>
          </div>
        </div>

        {currentFile && (
          <div className="text-sm text-gray-500 text-center">
            Currently processing: <span className="font-medium">{currentFile}</span>
          </div>
        )}
      </div>
    </div>
  );
}