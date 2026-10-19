import { TemplateVariable } from '../models/notification-letter.model';

/**
 * Utility class for handling template variables in letter messages
 * Template variables are placeholders in the format: &&VARIABLE_NAME&&
 */
export class TemplateVariableUtil {
  /**
   * Regular expression to match template variables
   * Matches: &&VARIABLE_NAME&& where VARIABLE_NAME can contain A-Z, 0-9, and underscore
   */
  private static readonly VARIABLE_REGEX = /&&([A-Z0-9_]+)&&/g;

  /**
   * Extract all template variables from a letter message
   *
   * @param letterMessage The letter message text
   * @returns Array of variable names (without && delimiters)
   *
   * @example
   * extractVariables("Dear &&DONOR_NAME&&, your appointment is &&APPOINTMENT_DATE&&")
   * // Returns: ["DONOR_NAME", "APPOINTMENT_DATE"]
   */
  static extractVariables(letterMessage: string): string[] {
    if (!letterMessage) {
      return [];
    }

    const matches = letterMessage.match(this.VARIABLE_REGEX);
    if (!matches) {
      return [];
    }

    // Extract variable names without && delimiters
    return matches.map(match => match.replace(/&&/g, ''));
  }

  /**
   * Validate template variables against allowed list
   *
   * @param letterMessage The letter message text
   * @param allowedVariables Array of allowed template variables
   * @returns Validation result with flag and list of invalid variables
   *
   * @example
   * validateVariables("Dear &&DONOR_NAME&& &&INVALID&&", allowedVars)
   * // Returns: { valid: false, invalidVariables: ["INVALID"] }
   */
  static validateVariables(
    letterMessage: string,
    allowedVariables: TemplateVariable[]
  ): { valid: boolean; invalidVariables: string[] } {
    const extractedVars = this.extractVariables(letterMessage);

    if (extractedVars.length === 0) {
      return { valid: true, invalidVariables: [] };
    }

    // Create set of allowed variable names for fast lookup
    const allowedSet = new Set(allowedVariables.map(v => v.name.toUpperCase()));

    // Find variables that are not in the allowed list
    const invalidVars = extractedVars.filter(
      varName => !allowedSet.has(varName.toUpperCase())
    );

    return {
      valid: invalidVars.length === 0,
      invalidVariables: invalidVars
    };
  }

  /**
   * Replace template variables with actual values
   *
   * @param letterMessage The letter message text
   * @param values Object mapping variable names to replacement values
   * @returns Letter message with variables replaced
   *
   * @example
   * replaceVariables("Dear &&DONOR_NAME&&", { DONOR_NAME: "John Doe" })
   * // Returns: "Dear John Doe"
   */
  static replaceVariables(
    letterMessage: string,
    values: Record<string, string>
  ): string {
    if (!letterMessage) {
      return '';
    }

    return letterMessage.replace(this.VARIABLE_REGEX, (match, varName) => {
      const replacement = values[varName] || values[varName.toUpperCase()];
      // If no replacement value found, keep the original placeholder
      return replacement !== undefined ? replacement : match;
    });
  }

  /**
   * Get list of unique template variables used in letter message
   *
   * @param letterMessage The letter message text
   * @returns Array of unique variable names
   */
  static getUniqueVariables(letterMessage: string): string[] {
    const variables = this.extractVariables(letterMessage);
    return [...new Set(variables)];
  }

  /**
   * Check if a letter message contains any template variables
   *
   * @param letterMessage The letter message text
   * @returns True if message contains at least one template variable
   */
  static hasTemplateVariables(letterMessage: string): boolean {
    return this.VARIABLE_REGEX.test(letterMessage);
  }

  /**
   * Format a variable name as a template placeholder
   *
   * @param variableName The variable name (e.g., "DONOR_NAME")
   * @returns Formatted placeholder (e.g., "&&DONOR_NAME&&")
   */
  static formatAsPlaceholder(variableName: string): string {
    return `&&${variableName.toUpperCase()}&&`;
  }

  /**
   * Get sample data for preview purposes
   *
   * @param allowedVariables Array of allowed template variables
   * @returns Object mapping variable names to example values
   */
  static getSampleData(allowedVariables: TemplateVariable[]): Record<string, string> {
    const sampleData: Record<string, string> = {};

    allowedVariables.forEach(variable => {
      sampleData[variable.name] = variable.example || `[${variable.name}]`;
    });

    return sampleData;
  }

  /**
   * Generate preview text by replacing variables with sample data
   *
   * @param letterMessage The letter message text
   * @param allowedVariables Array of allowed template variables with examples
   * @returns Letter message with variables replaced by sample data
   */
  static generatePreview(
    letterMessage: string,
    allowedVariables: TemplateVariable[]
  ): string {
    const sampleData = this.getSampleData(allowedVariables);
    return this.replaceVariables(letterMessage, sampleData);
  }

  /**
   * Count occurrences of each template variable in message
   *
   * @param letterMessage The letter message text
   * @returns Object mapping variable names to occurrence counts
   */
  static countVariableUsage(letterMessage: string): Record<string, number> {
    const variables = this.extractVariables(letterMessage);
    const counts: Record<string, number> = {};

    variables.forEach(varName => {
      counts[varName] = (counts[varName] || 0) + 1;
    });

    return counts;
  }
}
