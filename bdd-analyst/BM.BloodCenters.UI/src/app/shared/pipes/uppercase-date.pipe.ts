import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

/**
 * Custom date pipe that formats dates with UPPERCASE month abbreviations
 *
 * Usage:
 *   {{ date | uppercaseDate }}                    // Default: 'dd-MMM-yyyy' → '16-APR-2026'
 *   {{ date | uppercaseDate:'dd-MMM-yyyy HH:mm' }} // Custom format → '16-APR-2026 14:30'
 *
 * Transforms Angular's default 'MMM' format (which gives 'Apr') to uppercase ('APR')
 * to match Oracle Forms display format.
 */
@Pipe({
  name: 'uppercaseDate',
  standalone: true
})
export class UppercaseDatePipe implements PipeTransform {
  private datePipe: DatePipe;

  constructor() {
    this.datePipe = new DatePipe('en-US');
  }

  transform(value: Date | string | number | null | undefined, format: string = 'dd-MMM-yyyy'): string | null {
    if (!value) {
      return null;
    }

    // Use Angular's DatePipe to format the date
    const formatted = this.datePipe.transform(value, format);

    if (!formatted) {
      return null;
    }

    // Convert month abbreviations to uppercase
    // Matches 3-letter month abbreviations (Jan, Feb, Mar, etc.)
    return formatted.replace(/\b([A-Z][a-z]{2})\b/g, (match) => match.toUpperCase());
  }
}
