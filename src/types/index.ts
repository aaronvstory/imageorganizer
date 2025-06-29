export interface ProcessedImage {
  id: string;
  file: File;
  url: string;
  extractedData?: DriverLicenseData;
  groupId?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  imageType: 'dl_front' | 'dl_back' | 'selfie' | 'unknown';
}

export interface DriverLicenseData {
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  issuedDate: string;
  expirationDate: string;
  licenseNumber: string;
  address: string;
  rawText: string;
}

export interface GroupedImages {
  [groupId: string]: {
    name: string;
    images: ProcessedImage[];
    textData: string;
  };
}