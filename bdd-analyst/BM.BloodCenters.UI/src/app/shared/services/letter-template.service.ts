import { Injectable } from '@angular/core';

/**
 * Letter Template Service
 * Provides utility methods for processing letter templates with variable placeholders
 * Handles replacement of &&VariableName&& format variables with actual data
 */
@Injectable({
  providedIn: 'root'
})
export class LetterTemplateService {

  /**
   * Generic method to replace template placeholders with actual data
   * Replaces variables in format &&VariableName&& with corresponding values from data object
   *
   * @param template - Template string containing placeholders in format &&VariableName&&
   * @param data - Data object containing values to replace placeholders
   * @param customMapping - Optional custom variable mapping for additional/override variables
   * @returns Processed template with placeholders replaced
   *
   * @example
   * const template = "Dear &&Name&&, Your appointment is on &&Date&&.";
   * const data = { name: "John Doe", appointmentDate: "2024-01-15" };
   * const result = service.replaceTemplatePlaceholders(template, data);
   * // Result: "Dear John Doe, Your appointment is on 01/15/2024."
   */
  replaceTemplatePlaceholders(
    template: string,
    data: Record<string, any> | null,
    customMapping?: Record<string, () => string>
  ): string {
    if (!template) {
      return '';
    }

    let processedTemplate = template;

    // Build variable mapping from data object
    const variableMapping: Record<string, () => string> = {
      // Date variables
      'PrintDate': () => this.formatDate(new Date()),
      'CurrentDate': () => this.formatDate(new Date()),
      'TodayDate': () => this.formatDate(new Date()),
      'Today': () => this.formatDate(new Date()),

      // Common donor information fields (case-insensitive mapping)
      'DonorName': () => this.getValue(data, ['name', 'donorName', 'fullName']) || '[Donor Name]',
      'Name': () => this.getValue(data, ['name', 'donorName', 'fullName']) || '[Name]',
      'DonorId': () => this.getValue(data, ['donorId', 'id']) || '[Donor ID]',
      'Id': () => this.getValue(data, ['donorId', 'id']) || '[ID]',

      // Date of birth
      'DateOfBirth': () => this.getValue(data, ['dateOfBirth', 'dob']) || '[Date of Birth]',
      'DOB': () => this.getValue(data, ['dateOfBirth', 'dob']) || '[DOB]',

      // Gender/Sex
      'Sex': () => this.getValue(data, ['sex', 'gender']) || '[Sex]',
      'Gender': () => this.getValue(data, ['sex', 'gender']) || '[Gender]',

      // Address fields
      'DonorAddress': () => this.getValue(data, ['address']) || '[Address]',
      'Address': () => this.getValue(data, ['address']) || '[Address]',
      'DonorAddress1': () => this.getValue(data, ['addressLine1']) || this.getAddressLine(this.getValue(data, ['address']), 0) || '[Address Line 1]',
      'DonorAddress2': () => this.buildAddressLine2(data) || this.getAddressLine(this.getValue(data, ['address']), 1) || '[Address Line 2]',
      'Address1': () => this.getValue(data, ['addressLine1']) || this.getAddressLine(this.getValue(data, ['address']), 0) || '[Address Line 1]',
      'Address2': () => this.buildAddressLine2(data) || this.getAddressLine(this.getValue(data, ['address']), 1) || '[Address Line 2]',
      'City': () => this.getValue(data, ['city']) || this.extractCityFromAddress(this.getValue(data, ['address'])) || '[City]',
      'State': () => this.getValue(data, ['state']) || this.extractStateFromAddress(this.getValue(data, ['address'])) || '[State]',
      'ZipCode': () => this.getValue(data, ['zipCode', 'zip', 'postalCode']) || this.extractZipFromAddress(this.getValue(data, ['address'])) || '[Zip Code]',
      'Zip': () => this.getValue(data, ['zipCode', 'zip', 'postalCode']) || this.extractZipFromAddress(this.getValue(data, ['address'])) || '[Zip]',
      'Country': () => this.getValue(data, ['country']) || '[Country]',

      // Contact information
      'HomePhone': () => this.getValue(data, ['homePhone', 'phone']) || '[Home Phone]',
      'WorkPhone': () => this.getValue(data, ['workPhone', 'businessPhone']) || '[Work Phone]',
      'Phone': () => this.getValue(data, ['homePhone', 'phone', 'workPhone']) || '[Phone]',
      'Email': () => this.getValue(data, ['email', 'emailAddress']) || '[Email]',

      // Blood and donation information
      'ABO': () => this.getValue(data, ['aboType', 'bloodType', 'abo']) || '[Blood Type]',
      'BloodType': () => this.getValue(data, ['aboType', 'bloodType']) || '[Blood Type]',
      'DonationType': () => this.getValue(data, ['donationType', 'procedureType']) || '[Donation Type]',
      'ProcedureCode': () => this.getValue(data, ['procedureCode', 'procedure']) || '[Procedure Code]',
      'DonationDate': () => this.getValue(data, ['donationDate']) || '[Donation Date]',

      // Test results (generic placeholders)
      'HBC': () => this.getValue(data, ['hbc', 'antiHBC']) || '[Test Result]',
      'AntiHBC': () => this.getValue(data, ['antiHBC', 'hbc']) || '[Test Result]',
      'TestResult': () => this.getValue(data, ['testResult']) || '[Test Result]',
      'Result': () => this.getValue(data, ['result', 'testResult']) || '[Result]',
    };

    // Merge with custom mapping (custom mapping takes precedence)
    if (customMapping) {
      Object.assign(variableMapping, customMapping);
    }

    // Replace all placeholders using regex
    // Pattern matches &&VariableName&& (case-insensitive)
    const placeholderPattern = /&&([A-Za-z0-9_]+)&&/g;

    processedTemplate = processedTemplate.replace(placeholderPattern, (match, variableName) => {
      // Try exact match first
      if (variableMapping[variableName]) {
        return variableMapping[variableName]();
      }

      // Try case-insensitive match
      const matchedKey = Object.keys(variableMapping).find(
        key => key.toLowerCase() === variableName.toLowerCase()
      );

      if (matchedKey && variableMapping[matchedKey]) {
        return variableMapping[matchedKey]();
      }

      // Try to get value directly from data object (case-insensitive)
      if (data) {
        const value = this.getValue(data, [variableName]);
        if (value) {
          return value;
        }
      }

      // If no mapping found, keep the placeholder as is
      return match;
    });

    return processedTemplate;
  }

  /**
   * Get value from object using multiple possible field names (case-insensitive)
   * @param data - Data object
   * @param fieldNames - Array of possible field names to try
   * @returns Value if found, null otherwise
   */
  private getValue(data: Record<string, any> | null, fieldNames: string[]): string | null {
    if (!data) {
      return null;
    }

    for (const fieldName of fieldNames) {
      // Try exact match
      if (data[fieldName] !== undefined && data[fieldName] !== null) {
        return String(data[fieldName]);
      }

      // Try case-insensitive match
      const matchedKey = Object.keys(data).find(
        key => key.toLowerCase() === fieldName.toLowerCase()
      );

      if (matchedKey && data[matchedKey] !== undefined && data[matchedKey] !== null) {
        return String(data[matchedKey]);
      }
    }

    return null;
  }

  /**
   * Format date for display in letters
   * @param date - Date to format (Date object or string)
   * @param format - Format string (default: 'MM/DD/YYYY')
   * @returns Formatted date string
   */
  formatDate(date: Date | string, format: string = 'MM/DD/YYYY'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '[Invalid Date]';
    }

    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();

    // Support different format patterns
    switch (format.toUpperCase()) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MMMM DD, YYYY':
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[dateObj.getMonth()]} ${day}, ${year}`;
      default:
        return `${month}/${day}/${year}`;
    }
  }

  /**
   * Extract specific line from multi-line address
   * @param address - Full address string (multi-line or comma-separated)
   * @param lineIndex - Line index to extract (0-based)
   * @returns Address line or empty string
   */
  private getAddressLine(address: string | null, lineIndex: number): string {
    if (!address) {
      return '';
    }

    // Split by newlines first, then by commas if no newlines
    let lines = address.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length === 1 && lines[0].includes(',')) {
      lines = lines[0].split(',').map(line => line.trim()).filter(line => line);
    }

    return lines[lineIndex] || '';
  }

  /**
   * Extract city from a formatted address string like "123 Street, City, ST 12345"
   */
  private buildAddressLine2(data: Record<string, any> | null): string {
    const line2 = this.getValue(data, ['addressLine2']);
    if (!line2) return '';
    const country = this.getValue(data, ['country']);
    if (!country) return line2;
    const zip = this.getValue(data, ['zipCode', 'zip', 'postalCode']);
    let result = line2 + ', ' + country;
    if (zip) result += ' ' + zip;
    return result;
  }

  private extractCityFromAddress(address: string | null): string {
    if (!address) return '';
    const parts = address.split(',').map(p => p.trim()).filter(p => p);
    if (parts.length >= 3) {
      return parts[parts.length - 2];
    }
    return '';
  }

  /**
   * Extract state from a formatted address string like "123 Street, City, ST 12345"
   */
  private extractStateFromAddress(address: string | null): string {
    if (!address) return '';
    const parts = address.split(',').map(p => p.trim()).filter(p => p);
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const stateZip = lastPart.match(/^([A-Z]{2})\s+\d/);
      if (stateZip) return stateZip[1];
    }
    return '';
  }

  /**
   * Extract zip code from a formatted address string like "123 Street, City, ST 12345"
   */
  private extractZipFromAddress(address: string | null): string {
    if (!address) return '';
    const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\s*$/);
    if (zipMatch) return zipMatch[1];
    const parts = address.split(',').map(p => p.trim()).filter(p => p);
    if (parts.length >= 1) {
      const lastPart = parts[parts.length - 1];
      const match = lastPart.match(/\b([A-Z0-9]{3,}\s*[A-Z0-9]*)\s*$/);
      if (match) return match[1].trim();
    }
    return '';
  }

  /**
   * Validate template for missing or invalid placeholders
   * @param template - Template string to validate
   * @returns Array of unresolved placeholders (still in &&Variable&& format)
   */
  validateTemplate(template: string): string[] {
    const placeholderPattern = /&&([A-Za-z0-9_]+)&&/g;
    const matches = template.matchAll(placeholderPattern);
    return Array.from(matches).map(match => match[0]);
  }

  /**
   * Extract all placeholder variable names from template
   * @param template - Template string
   * @returns Array of variable names (without && delimiters)
   */
  extractPlaceholders(template: string): string[] {
    const placeholderPattern = /&&([A-Za-z0-9_]+)&&/g;
    const matches = template.matchAll(placeholderPattern);
    return Array.from(matches).map(match => match[1]);
  }
}
