import React from 'react';
import { Download, FileText, Image, Users, Folder, CreditCard, Camera, User } from 'lucide-react';
import { GroupedImages } from '../types';

interface ResultsViewProps {
  groups: GroupedImages;
  onDownload: () => void;
  isGeneratingZip: boolean;
}

export function ResultsView({ groups, onDownload, isGeneratingZip }: ResultsViewProps) {
  const totalImages = Object.values(groups).reduce((sum, group) => sum + group.images.length, 0);
  const totalGroups = Object.keys(groups).length;

  const getImageTypeIcon = (imageType: string) => {
    switch (imageType) {
      case 'dl_front':
        return <CreditCard className="w-3 h-3 text-blue-500" />;
      case 'dl_back':
        return <CreditCard className="w-3 h-3 text-gray-500" />;
      case 'selfie':
        return <User className="w-3 h-3 text-green-500" />;
      default:
        return <Camera className="w-3 h-3 text-gray-400" />;
    }
  };

  const getImageTypeLabel = (imageType: string) => {
    switch (imageType) {
      case 'dl_front':
        return 'DL Front';
      case 'dl_back':
        return 'DL Back';
      case 'selfie':
        return 'Selfie';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Organization Complete</h2>
          <button
            onClick={onDownload}
            disabled={isGeneratingZip}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingZip ? 'Generating...' : 'Download All'}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Image className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-lg font-semibold text-gray-800">{totalImages}</div>
              <div className="text-sm text-gray-600">Total Images</div>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Folder className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-lg font-semibold text-gray-800">{totalGroups}</div>
              <div className="text-sm text-gray-600">Groups Created</div>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Users className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-lg font-semibold text-gray-800">
                {Object.values(groups).filter(g => g.textData).length}
              </div>
              <div className="text-sm text-gray-600">With Data Extracted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="grid gap-6">
        {Object.entries(groups).map(([groupId, group]) => (
          <div key={groupId} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Folder className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{group.images.length} images</span>
                    <div className="flex items-center space-x-2">
                      {['dl_front', 'dl_back', 'selfie'].map(type => {
                        const count = group.images.filter(img => img.imageType === type).length;
                        if (count > 0) {
                          return (
                            <div key={type} className="flex items-center space-x-1">
                              {getImageTypeIcon(type)}
                              <span>{count}</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
              {group.textData && (
                <div className="flex items-center space-x-1 text-green-600">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Data Extracted</span>
                </div>
              )}
            </div>

            {/* Images Preview */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {group.images.slice(0, 6).map((image, index) => (
                <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={image.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 right-1 bg-black bg-opacity-70 rounded px-1 py-0.5">
                    <div className="flex items-center space-x-1">
                      {getImageTypeIcon(image.imageType)}
                      <span className="text-xs text-white">
                        {getImageTypeLabel(image.imageType)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {group.images.length > 6 && (
                <div className="aspect-square rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                  <span className="text-xs text-gray-500">+{group.images.length - 6}</span>
                </div>
              )}
            </div>

            {/* Extracted Data Preview */}
            {group.textData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Information:</h4>
                <div className="text-xs text-gray-600 font-mono whitespace-pre-line">
                  {group.textData.split('\n').slice(0, 8).join('\n')}
                  {group.textData.split('\n').length > 8 && '\n...'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}