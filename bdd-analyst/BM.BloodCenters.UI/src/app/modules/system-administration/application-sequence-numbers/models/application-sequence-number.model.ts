import { ApplicationSequenceNumber } from '../interfaces/application-sequence-number.interface';

/**
 * Application Sequence Number Model
 * Provides additional utility methods for sequence number data
 */
export class ApplicationSequenceNumberModel implements ApplicationSequenceNumber {
  chapterId: string;
  chapterName: string;
  numberType: string;
  maxNumber: number;
  startingNumber: number | null;
  resetCycle: string | null;
  lastResetDate: Date | null;

  constructor(data: ApplicationSequenceNumber) {
    this.chapterId = data.chapterId;
    this.chapterName = data.chapterName;
    this.numberType = data.numberType;
    this.maxNumber = data.maxNumber;
    this.startingNumber = data.startingNumber;
    this.resetCycle = data.resetCycle;
    this.lastResetDate = data.lastResetDate;
  }

  /**
   * Check if sequence has a reset cycle configured
   */
  hasResetCycle(): boolean {
    return this.resetCycle !== null;
  }

  /**
   * Check if sequence has been reset before
   */
  hasBeenReset(): boolean {
    return this.lastResetDate !== null;
  }

  /**
   * Get formatted last reset date (or '-' if null)
   */
  getFormattedResetDate(format: string = 'dd-MMM-yyyy'): string {
    return this.lastResetDate ? this.lastResetDate.toString() : '-';
  }
}
