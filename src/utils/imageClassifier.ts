export class ImageClassifier {
  static classifyImage(filename: string): 'dl_front' | 'dl_back' | 'selfie' | 'unknown' {
    const lowerFilename = filename.toLowerCase();
    
    console.log('Classifying image:', filename);
    
    // First check for explicit back indicators
    if (this.isDriverLicenseBack(lowerFilename)) {
      console.log('Classified as DL Back:', filename);
      return 'dl_back';
    }
    
    // Then check for explicit selfie indicators
    if (this.isSelfie(lowerFilename)) {
      console.log('Classified as Selfie:', filename);
      return 'selfie';
    }
    
    // Check for driver license front indicators
    if (this.isDriverLicenseFront(lowerFilename)) {
      console.log('Classified as DL Front:', filename);
      return 'dl_front';
    }
    
    // Default classification based on common patterns
    // If it looks like a document/card image, assume DL front for OCR processing
    if (this.looksLikeDocument(lowerFilename)) {
      console.log('Classified as DL Front (document-like):', filename);
      return 'dl_front';
    }
    
    console.log('Classified as Unknown:', filename);
    return 'unknown';
  }

  private static isDriverLicenseBack(filename: string): boolean {
    const backIndicators = [
      'back', 'rear', 'reverse', 'dl_back', 'license_back', 'id_back'
    ];
    
    return backIndicators.some(indicator => filename.includes(indicator));
  }

  private static isSelfie(filename: string): boolean {
    const selfieIndicators = [
      'selfie', 'portrait', 'headshot', 'profile', 'face_',
      'person_', 'me_', 'self_', 'pic_of_', 'photo_of_me'
    ];
    
    // Strong selfie indicators
    if (selfieIndicators.some(indicator => filename.includes(indicator))) {
      return true;
    }
    
    // Weak selfie indicators - only if no document indicators present
    const weakSelfieIndicators = ['photo', 'pic', 'shot'];
    const hasWeakSelfieIndicator = weakSelfieIndicators.some(indicator => filename.includes(indicator));
    const hasDocumentIndicator = this.containsDriverLicensePatterns(filename);
    
    return hasWeakSelfieIndicator && !hasDocumentIndicator;
  }

  private static isDriverLicenseFront(filename: string): boolean {
    const frontIndicators = [
      'front', 'dl_front', 'license_front', 'id_front'
    ];
    
    if (frontIndicators.some(indicator => filename.includes(indicator))) {
      return true;
    }
    
    // Check for driver license patterns
    return this.containsDriverLicensePatterns(filename);
  }

  private static looksLikeDocument(filename: string): boolean {
    // If filename suggests it's some kind of document or ID
    const documentPatterns = [
      'doc', 'document', 'card', 'scan', 'copy', 'image'
    ];
    
    return documentPatterns.some(pattern => filename.includes(pattern));
  }

  private static containsDriverLicensePatterns(filename: string): boolean {
    const dlPatterns = [
      'dl', 'license', 'licence', 'id', 'driver', 'identification',
      'state', 'gov', 'official', 'permit', 'card'
    ];
    
    return dlPatterns.some(pattern => filename.includes(pattern));
  }

  static extractPersonIdentifier(filename: string): string | null {
    const lowerFilename = filename.toLowerCase().replace(/\.(jpg|jpeg|png|gif|bmp|webp)$/i, '');
    
    // Remove common prefixes/suffixes more aggressively
    let cleanName = lowerFilename
      .replace(/(front|back|selfie|photo|dl|license|id|driver|card|document|scan|copy|image)_?/gi, '')
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .replace(/^\d+_?|_?\d+$/g, ''); // Remove leading/trailing numbers
    
    // Try to extract name patterns from filename
    // Pattern 1: firstname_lastname
    const namePattern1 = cleanName.match(/^([a-z]{2,})_([a-z]{2,})$/);
    if (namePattern1) {
      return `${namePattern1[1]}_${namePattern1[2]}`;
    }
    
    // Pattern 2: firstnamelastname (no underscore, but reasonable length)
    if (cleanName.length >= 6 && cleanName.length <= 20 && /^[a-z]+$/.test(cleanName)) {
      // Try to split at likely boundary
      for (let i = 2; i <= Math.min(8, cleanName.length - 2); i++) {
        const firstName = cleanName.substring(0, i);
        const lastName = cleanName.substring(i);
        if (lastName.length >= 2) {
          return `${firstName}_${lastName}`;
        }
      }
    }
    
    // Pattern 3: any meaningful text that could be a name (but not too short/long)
    if (cleanName.length >= 3 && cleanName.length <= 25 && /^[a-z]+$/.test(cleanName)) {
      return cleanName;
    }
    
    return null;
  }
}