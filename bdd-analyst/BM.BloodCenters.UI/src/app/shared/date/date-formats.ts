import { MatDateFormats } from '@angular/material/core';
import { Injectable } from '@angular/core';
import { UppercaseMomentDateAdapter } from './uppercase-date-adapter';

// Re-export for backwards compatibility with existing imports
export { UppercaseMomentDateAdapter };

export const DD_MON_YYYY_FORMATS: MatDateFormats = {
  parse: {
    dateInput: [
      'DD-MMM-YYYY',     // Preferred display format (unambiguous — uses month name)
      'DD.MMM.YYYY',     // Dot separator with month abbreviation
      'DD/MMM/YYYY',     // Slash separator with month abbreviation
      'DD MMM YYYY',     // Space separator with month abbreviation
      'DDMMMYYYY',       // Compact with month abbreviation (e.g., 01JAN2026)
      'YYYY-MMM-DD',
      'MMM DD, YYYY',    // Month name first (unambiguous)
      'MMMM DD, YYYY',   // Full month name (unambiguous)
      'MMDDYYYY',        // 8-digit keyboard input (US format) - high priority for typing
      'MM/DD/YYYY',      // Month-first numeric (US format) - PRIORITY for slash input
      'MM-DD-YYYY',      // Month-first with dash
      'MM.DD.YYYY',      // Month-first with dot
      'YYYY-MM-DD',      // ISO format
      'YYYY/MM/DD',
      'YYYY.MM.DD',
      'YYYYMMDD',
    ],
  },
  display: {
    dateInput: 'DD-MMM-YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD-MMM-YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
