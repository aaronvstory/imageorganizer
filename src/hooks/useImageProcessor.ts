import { useState, useCallback } from 'react';
import { ProcessedImage, GroupedImages } from '../types';
import { OCRProcessor } from '../utils/ocrProcessor';
import { FileOrganizer } from '../utils/fileOrganizer';
import { ImageClassifier } from '../utils/imageClassifier';

export function useImageProcessor() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [groups, setGroups] = useState<GroupedImages>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>('');

  const processImages = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setCurrentFile('');
    
    const initialImages: ProcessedImage[] = files.map(file => {
      const imageType = ImageClassifier.classifyImage(file.name);
      console.log(`Classified ${file.name} as:`, imageType);
      
      return {
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        status: 'pending',
        imageType
      };
    });

    setImages(initialImages);

    const ocrProcessor = new OCRProcessor();
    const processedImages: ProcessedImage[] = [];

    for (let i = 0; i < initialImages.length; i++) {
      const image = initialImages[i];
      setCurrentFile(image.file.name);
      
      try {
        // Update status to processing
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'processing' } : img
        ));

        let processedImage: ProcessedImage = {
          ...image,
          status: 'completed'
        };

        // Only process OCR for driver license fronts
        if (image.imageType === 'dl_front') {
          console.log(`Processing OCR for DL front: ${image.file.name}`);
          try {
            const text = await ocrProcessor.extractText(image.file);
            const extractedData = ocrProcessor.parseDriverLicense(text);
            
            if (extractedData && extractedData.firstName && extractedData.lastName) {
              processedImage.extractedData = extractedData;
              console.log(`Successfully extracted data for ${image.file.name}:`, extractedData.fullName);
            } else {
              console.warn(`No valid data extracted from ${image.file.name}`);
            }
          } catch (ocrError) {
            console.warn('OCR failed for image:', image.file.name, ocrError);
            // Continue processing even if OCR fails
          }
        } else {
          console.log(`Skipping OCR for ${image.imageType}: ${image.file.name}`);
        }

        processedImages.push(processedImage);

        // Update the image in state
        setImages(prev => prev.map(img => 
          img.id === image.id ? processedImage : img
        ));

      } catch (error) {
        console.error('Error processing image:', error);
        const errorImage: ProcessedImage = {
          ...image,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        processedImages.push(errorImage);
        
        setImages(prev => prev.map(img => 
          img.id === image.id ? errorImage : img
        ));
      }
    }

    await ocrProcessor.terminate();
    
    // Group the images using improved logic
    console.log('Grouping images...');
    const groupedImages = FileOrganizer.groupImagesByPattern(processedImages);
    console.log('Grouped images:', Object.keys(groupedImages));
    setGroups(groupedImages);
    
    setIsProcessing(false);
    setCurrentFile('');
  }, []);

  const downloadOrganizedFiles = useCallback(async () => {
    if (Object.keys(groups).length === 0) return;
    
    setIsGeneratingZip(true);
    try {
      const zipBlob = await FileOrganizer.createDownloadableZip(groups);
      FileOrganizer.downloadBlob(zipBlob, 'organized_images.zip');
    } catch (error) {
      console.error('Error creating zip:', error);
    } finally {
      setIsGeneratingZip(false);
    }
  }, [groups]);

  const reset = useCallback(() => {
    // Clean up URLs
    images.forEach(image => URL.revokeObjectURL(image.url));
    
    setImages([]);
    setGroups({});
    setIsProcessing(false);
    setIsGeneratingZip(false);
    setCurrentFile('');
  }, [images]);

  const stats = {
    total: images.length,
    completed: images.filter(img => img.status === 'completed').length,
    failed: images.filter(img => img.status === 'error').length,
    hasResults: Object.keys(groups).length > 0
  };

  return {
    processImages,
    downloadOrganizedFiles,
    reset,
    images,
    groups,
    isProcessing,
    isGeneratingZip,
    currentFile,
    stats
  };
}