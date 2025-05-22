import { Location } from '../types/common';

interface CheckPoint {
  timestamp: Date;
  location: Location;
  type: 'check-in' | 'check-out';
  photoUrl?: string;
  notes?: string;
}

interface MaterialUsed {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface Signature {
  imageUrl: string;
  signedBy: string;
  timestamp: Date;
  role: 'contractor' | 'customer';
}

export interface JobSheet {
  id: string;
  jobId: string;
  contractorId: string;
  customerId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'disputed';
  checkPoints: CheckPoint[];
  materialsUsed: MaterialUsed[];
  workDescription: string;
  photosBeforeWork: string[];
  photosAfterWork: string[];
  signatures: Signature[];
  totalDuration: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export class JobSheetService {
  /**
   * Create a new job sheet
   */
  async createJobSheet(
    jobId: string,
    contractorId: string,
    customerId: string
  ): Promise<JobSheet> {
    const jobSheet: JobSheet = {
      id: this.generateId(),
      jobId,
      contractorId,
      customerId,
      status: 'pending',
      checkPoints: [],
      materialsUsed: [],
      workDescription: '',
      photosBeforeWork: [],
      photosAfterWork: [],
      signatures: [],
      totalDuration: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    return jobSheet;
  }

  /**
   * Record contractor check-in/check-out
   */
  async recordCheckPoint(
    jobSheetId: string,
    type: 'check-in' | 'check-out',
    location: Location,
    photo?: string,
    notes?: string
  ): Promise<CheckPoint> {
    const checkPoint: CheckPoint = {
      timestamp: new Date(),
      location,
      type,
      photoUrl: photo,
      notes,
    };

    // Update job sheet in database
    return checkPoint;
  }

  /**
   * Add work photos
   */
  async addPhotos(
    jobSheetId: string,
    photos: string[],
    stage: 'before' | 'after'
  ): Promise<string[]> {
    // Upload photos to cloud storage
    // Update job sheet with photo URLs
    return photos;
  }

  /**
   * Add digital signature
   */
  async addSignature(
    jobSheetId: string,
    signatureImage: string,
    signedBy: string,
    role: 'contractor' | 'customer'
  ): Promise<Signature> {
    const signature: Signature = {
      imageUrl: signatureImage,
      signedBy,
      timestamp: new Date(),
      role,
    };

    // Update job sheet in database
    return signature;
  }

  /**
   * Calculate total work duration
   */
  calculateDuration(checkPoints: CheckPoint[]): number {
    let totalMinutes = 0;
    const pairs: { in: Date; out: Date }[] = [];
    
    // Group check-ins with check-outs
    let currentCheckIn: Date | null = null;
    
    checkPoints.forEach(point => {
      if (point.type === 'check-in') {
        currentCheckIn = point.timestamp;
      } else if (point.type === 'check-out' && currentCheckIn) {
        pairs.push({
          in: currentCheckIn,
          out: point.timestamp,
        });
        currentCheckIn = null;
      }
    });

    // Calculate total duration
    pairs.forEach(pair => {
      const duration = (pair.out.getTime() - pair.in.getTime()) / 60000; // Convert to minutes
      totalMinutes += duration;
    });

    return totalMinutes;
  }

  /**
   * Validate job sheet completion
   */
  validateCompletion(jobSheet: JobSheet): {
    isValid: boolean;
    missingItems: string[];
  } {
    const missingItems: string[] = [];

    if (jobSheet.checkPoints.length < 2) {
      missingItems.push('check-in/check-out records');
    }

    if (jobSheet.workDescription.trim().length === 0) {
      missingItems.push('work description');
    }

    if (jobSheet.photosAfterWork.length === 0) {
      missingItems.push('completion photos');
    }

    if (!jobSheet.signatures.some(s => s.role === 'customer')) {
      missingItems.push('customer signature');
    }

    if (!jobSheet.signatures.some(s => s.role === 'contractor')) {
      missingItems.push('contractor signature');
    }

    return {
      isValid: missingItems.length === 0,
      missingItems,
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
} 