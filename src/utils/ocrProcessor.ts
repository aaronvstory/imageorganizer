import Tesseract from 'tesseract.js';
import { DriverLicenseData } from '../types';

export class OCRProcessor {
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    if (!this.worker) {
      try {
        console.log('Initializing OCR worker...');
        this.worker = await Tesseract.createWorker('eng');
        
        // Optimize for driver license text recognition
        await this.worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-.,:()',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1',
        });
        
        console.log('OCR worker initialized successfully');
      } catch (error) {
        console.error('Failed to initialize OCR worker:', error);
        throw new Error('OCR initialization failed. Please try again.');
      }
    }
  }

  async extractText(imageFile: File): Promise<string> {
    try {
      await this.initialize();
      if (!this.worker) throw new Error('OCR worker not initialized');

      console.log('Starting OCR processing for:', imageFile.name);
      
      // Process the image with enhanced options
      const { data: { text, confidence } } = await this.worker.recognize(imageFile);
      
      console.log(`OCR completed for: ${imageFile.name}, Confidence: ${confidence}%, Text length: ${text.length}`);
      console.log('OCR Text preview:', text.substring(0, 300));
      
      // Only return text if confidence is reasonable
      if (confidence && confidence < 30) {
        console.warn(`Low confidence OCR result (${confidence}%) for ${imageFile.name}`);
      }
      
      return text;
    } catch (error) {
      console.error('OCR extraction failed for', imageFile.name, ':', error);
      throw new Error('Failed to extract text from image. Please ensure the image is clear and try again.');
    }
  }

  parseDriverLicense(text: string): DriverLicenseData | null {
    if (!text || text.trim().length < 20) {
      console.warn('OCR text too short or empty for parsing:', text.length, 'characters');
      return null;
    }

    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('Parsing OCR text (first 400 chars):', cleanText.substring(0, 400));
    
    // Enhanced patterns for driver license data with more variations
    const patterns = {
      // Name patterns - comprehensive approach
      commaName: /([A-Z]{2,25}),\s*([A-Z]{2,20})/g, // LASTNAME, FIRSTNAME
      fullName: /(?:Name|FULL NAME|LN FN)[:\s]*([A-Z][A-Z\s]{5,40})/i,
      firstName: /(?:FIRST NAME|FN|Given Name|FIRST)[:\s]*([A-Z][A-Z]{1,20})/i,
      lastName: /(?:LAST NAME|LN|Surname|LAST)[:\s]*([A-Z][A-Z]{1,25})/i,
      // Look for name-like patterns in the text
      namePattern: /\b([A-Z]{2,20})\s+([A-Z]{2,25})\b/g,
      // Date patterns
      dob: /(?:DOB|Date of Birth|Birth|D\.?O\.?B\.?)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      issued: /(?:ISS|Issued|Issue Date|ISS\s*DATE)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      expires: /(?:EXP|Expires|Expiration|EXP\s*DATE)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      // ID patterns
      license: /(?:DL|License|ID|LIC)[:\s#]*([A-Z0-9]{4,25})/i,
      // Address patterns
      address: /(?:Address|ADDR|ADD)[:\s]*([A-Z0-9\s,.-]{10,100})(?=\s*(?:Class|Sex|Height|DOB|EXP|ISS|$))/i
    };

    try {
      let firstName = '';
      let lastName = '';
      let fullName = '';

      // Strategy 1: Look for comma-separated names (most reliable)
      const commaMatches = Array.from(cleanText.matchAll(patterns.commaName));
      if (commaMatches.length > 0) {
        // Take the first reasonable match
        for (const match of commaMatches) {
          const potentialLastName = match[1].trim();
          const potentialFirstName = match[2].trim();
          
          if (potentialLastName.length >= 2 && potentialFirstName.length >= 2 &&
              potentialLastName.length <= 25 && potentialFirstName.length <= 20) {
            lastName = potentialLastName;
            firstName = potentialFirstName;
            fullName = `${firstName} ${lastName}`;
            console.log('Found comma-separated name:', fullName);
            break;
          }
        }
      }

      // Strategy 2: Look for labeled first/last names
      if (!firstName || !lastName) {
        const firstNameMatch = cleanText.match(patterns.firstName);
        const lastNameMatch = cleanText.match(patterns.lastName);
        
        if (firstNameMatch && lastNameMatch) {
          firstName = firstNameMatch[1].trim();
          lastName = lastNameMatch[1].trim();
          fullName = `${firstName} ${lastName}`;
          console.log('Found labeled first/last names:', fullName);
        }
      }

      // Strategy 3: Look for full name pattern
      if (!firstName || !lastName) {
        const nameMatch = cleanText.match(patterns.fullName);
        if (nameMatch) {
          fullName = nameMatch[1].trim();
          const nameParts = fullName.split(/\s+/);
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
            console.log('Found full name pattern:', fullName);
          }
        }
      }

      // Strategy 4: Look for any two capitalized words that could be names
      if (!firstName || !lastName) {
        const nameMatches = Array.from(cleanText.matchAll(patterns.namePattern));
        for (const match of nameMatches) {
          const word1 = match[1];
          const word2 = match[2];
          
          // Skip common non-name words
          const skipWords = ['CLASS', 'STATE', 'DRIVER', 'LICENSE', 'EXPIRES', 'ISSUED', 'HEIGHT', 'WEIGHT', 'EYES', 'HAIR', 'SEX', 'ORGAN', 'DONOR', 'VETERAN'];
          if (!skipWords.includes(word1) && !skipWords.includes(word2) &&
              word1.length >= 2 && word2.length >= 2) {
            firstName = word1;
            lastName = word2;
            fullName = `${firstName} ${lastName}`;
            console.log('Found potential name match:', fullName);
            break;
          }
        }
      }

      // Validate that we have reasonable names
      if (!firstName || !lastName || firstName.length < 2 || lastName.length < 2 ||
          firstName.length > 20 || lastName.length > 25) {
        console.warn('Could not extract valid names from OCR text. First:', firstName, 'Last:', lastName);
        console.warn('OCR text sample:', cleanText.substring(0, 200));
        return null;
      }

      // Extract other data
      const dobMatch = cleanText.match(patterns.dob);
      const issuedMatch = cleanText.match(patterns.issued);
      const expiresMatch = cleanText.match(patterns.expires);
      const licenseMatch = cleanText.match(patterns.license);
      const addressMatch = cleanText.match(patterns.address);

      const result = {
        firstName,
        lastName,
        fullName,
        dateOfBirth: dobMatch ? dobMatch[1] : '',
        issuedDate: issuedMatch ? issuedMatch[1] : '',
        expirationDate: expiresMatch ? expiresMatch[1] : '',
        licenseNumber: licenseMatch ? licenseMatch[1] : '',
        address: addressMatch ? addressMatch[1].trim() : '',
        rawText: cleanText
      };

      console.log('Successfully parsed driver license data:', { firstName, lastName, fullName });
      return result;
    } catch (error) {
      console.error('Error parsing driver license:', error);
      return null;
    }
  }

  async terminate() {
    if (this.worker) {
      try {
        await this.worker.terminate();
        console.log('OCR worker terminated');
      } catch (error) {
        console.error('Error terminating OCR worker:', error);
      } finally {
        this.worker = null;
      }
    }
  }
}