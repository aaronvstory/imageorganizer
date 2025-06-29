import JSZip from 'jszip';
import { ProcessedImage, GroupedImages, DriverLicenseData } from '../types';
import { ImageClassifier } from './imageClassifier';

export class FileOrganizer {
  static groupImagesByPattern(images: ProcessedImage[]): GroupedImages {
    const groups: GroupedImages = {};
    console.log('Starting to group', images.length, 'images');

    images.forEach(image => {
      let groupId = 'ungrouped';
      let groupName = 'Ungrouped Images';

      // First, try to group by OCR extracted data (only from DL fronts)
      if (image.extractedData && image.imageType === 'dl_front') {
        const { firstName, lastName } = image.extractedData;
        groupId = `${firstName}_${lastName}`.toLowerCase().replace(/\s+/g, '_');
        groupName = `${firstName} ${lastName}`;
        console.log(`Grouped by OCR data: ${image.file.name} -> ${groupName}`);
      } else {
        // Try to group by filename patterns
        const personId = ImageClassifier.extractPersonIdentifier(image.file.name);
        if (personId) {
          groupId = personId.toLowerCase();
          groupName = personId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          console.log(`Grouped by filename pattern: ${image.file.name} -> ${groupName}`);
        } else {
          // Try to match with existing groups based on similar filenames
          const baseName = image.file.name.toLowerCase().replace(/\.(jpg|jpeg|png|gif)$/i, '');
          const existingGroup = Object.keys(groups).find(gId => {
            if (gId === 'ungrouped') return false;
            const groupImages = groups[gId].images;
            return groupImages.some(img => {
              const imgBaseName = img.file.name.toLowerCase().replace(/\.(jpg|jpeg|png|gif)$/i, '');
              return this.areFilenamesSimilar(baseName, imgBaseName);
            });
          });
          
          if (existingGroup) {
            groupId = existingGroup;
            groupName = groups[existingGroup].name;
            console.log(`Grouped by similarity: ${image.file.name} -> ${groupName}`);
          } else {
            console.log(`No group found for: ${image.file.name}, adding to ungrouped`);
          }
        }
      }

      if (!groups[groupId]) {
        groups[groupId] = {
          name: groupName,
          images: [],
          textData: ''
        };
      }

      groups[groupId].images.push(image);
    });

    // Post-process: try to merge groups that should be together
    this.mergeRelatedGroups(groups);

    // Generate text data for each group
    Object.keys(groups).forEach(groupId => {
      const group = groups[groupId];
      const dlFrontImage = group.images.find(img => img.imageType === 'dl_front' && img.extractedData);
      
      if (dlFrontImage?.extractedData) {
        group.textData = this.generateTextData(dlFrontImage.extractedData);
        
        // Update group name if we have better data from OCR
        const { firstName, lastName } = dlFrontImage.extractedData;
        if (firstName && lastName) {
          group.name = `${firstName} ${lastName}`;
        }
      }
    });

    console.log('Final groups:', Object.keys(groups).map(k => `${k}: ${groups[k].images.length} images`));
    return groups;
  }

  private static areFilenamesSimilar(name1: string, name2: string): boolean {
    // Remove common suffixes and prefixes
    const clean1 = name1.replace(/(front|back|selfie|photo|dl|license|id)_?/gi, '').replace(/[^a-z]/g, '');
    const clean2 = name2.replace(/(front|back|selfie|photo|dl|license|id)_?/gi, '').replace(/[^a-z]/g, '');
    
    // Check if they share a common base (at least 3 characters)
    if (clean1.length >= 3 && clean2.length >= 3) {
      const similarity = this.calculateSimilarity(clean1, clean2);
      return similarity > 0.6; // 60% similarity threshold
    }
    
    return false;
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private static mergeRelatedGroups(groups: GroupedImages): void {
    const groupIds = Object.keys(groups).filter(id => id !== 'ungrouped');
    
    for (let i = 0; i < groupIds.length; i++) {
      for (let j = i + 1; j < groupIds.length; j++) {
        const group1Id = groupIds[i];
        const group2Id = groupIds[j];
        
        if (!groups[group1Id] || !groups[group2Id]) continue;
        
        const group1 = groups[group1Id];
        const group2 = groups[group2Id];
        
        // Check if groups should be merged based on OCR data
        const group1DL = group1.images.find(img => img.extractedData);
        const group2DL = group2.images.find(img => img.extractedData);
        
        if (group1DL?.extractedData && group2DL?.extractedData) {
          const data1 = group1DL.extractedData;
          const data2 = group2DL.extractedData;
          
          if (data1.firstName === data2.firstName && data1.lastName === data2.lastName) {
            // Merge group2 into group1
            group1.images.push(...group2.images);
            delete groups[group2Id];
            groupIds.splice(j, 1);
            j--; // Adjust index after removal
            console.log(`Merged groups: ${group1Id} and ${group2Id}`);
          }
        }
      }
    }
  }

  private static generateTextData(data: DriverLicenseData): string {
    return `Driver License Information
========================

Full Name: ${data.fullName}
First Name: ${data.firstName}
Last Name: ${data.lastName}
Date of Birth: ${data.dateOfBirth}
License Number: ${data.licenseNumber}
Issued Date: ${data.issuedDate}
Expiration Date: ${data.expirationDate}
Address: ${data.address}

Raw OCR Text:
${data.rawText}

Generated on: ${new Date().toLocaleString()}
`;
  }

  static async createDownloadableZip(groups: GroupedImages): Promise<Blob> {
    const zip = new JSZip();

    for (const [groupId, group] of Object.entries(groups)) {
      const folderName = group.name.replace(/[^\w\s-]/g, '').trim();
      const folder = zip.folder(folderName);

      if (!folder) continue;

      // Sort images by type for better organization
      const sortedImages = group.images.sort((a, b) => {
        const typeOrder = { 'dl_front': 0, 'dl_back': 1, 'selfie': 2, 'unknown': 3 };
        return typeOrder[a.imageType] - typeOrder[b.imageType];
      });

      // Add images with descriptive names
      for (const image of sortedImages) {
        const imageBlob = await this.fileToBlob(image.file);
        const extension = image.file.name.split('.').pop();
        let newFileName = image.file.name;
        
        // Rename files for better organization
        if (image.imageType === 'dl_front') {
          newFileName = `${folderName.replace(/\s+/g, '_')}_DL_Front.${extension}`;
        } else if (image.imageType === 'dl_back') {
          newFileName = `${folderName.replace(/\s+/g, '_')}_DL_Back.${extension}`;
        } else if (image.imageType === 'selfie') {
          newFileName = `${folderName.replace(/\s+/g, '_')}_Selfie.${extension}`;
        }
        
        folder.file(newFileName, imageBlob);
      }

      // Add text data if available
      if (group.textData) {
        folder.file(`${folderName.replace(/\s+/g, '_')}_info.txt`, group.textData);
      }
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  private static fileToBlob(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(new Blob([reader.result as ArrayBuffer], { type: file.type }));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}