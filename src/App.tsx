import React from 'react';
import { FileImage, RefreshCw } from 'lucide-react';
import { UploadZone } from './components/UploadZone';
import { ProcessingProgress } from './components/ProcessingProgress';
import { ResultsView } from './components/ResultsView';
import { useImageProcessor } from './hooks/useImageProcessor';

function App() {
  const {
    processImages,
    downloadOrganizedFiles,
    reset,
    groups,
    isProcessing,
    isGeneratingZip,
    currentFile,
    stats
  } = useImageProcessor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <FileImage className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
              Smart Image Organizer
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your images and let AI organize them automatically. 
            Perfect for driver licenses, IDs, and document management.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {!stats.hasResults && !isProcessing && (
            <UploadZone 
              onFilesSelected={processImages}
              isProcessing={isProcessing}
            />
          )}

          {isProcessing && (
            <ProcessingProgress
              total={stats.total}
              completed={stats.completed}
              failed={stats.failed}
              currentFile={currentFile}
            />
          )}

          {stats.hasResults && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <button
                  onClick={reset}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Process New Images</span>
                </button>
              </div>
              
              <ResultsView
                groups={groups}
                onDownload={downloadOrganizedFiles}
                isGeneratingZip={isGeneratingZip}
              />
            </div>
          )}
        </div>

        {/* Features Section */}
        {!stats.hasResults && !isProcessing && (
          <div className="max-w-4xl mx-auto mt-16">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileImage className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Smart Recognition</h3>
                <p className="text-gray-600">
                  Advanced OCR technology extracts information from driver licenses and IDs automatically.
                </p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileImage className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Auto Organization</h3>
                <p className="text-gray-600">
                  Images are automatically grouped into folders named after the person on the ID.
                </p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileImage className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Extraction</h3>
                <p className="text-gray-600">
                  Creates text files with extracted information: names, dates, addresses, and more.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;