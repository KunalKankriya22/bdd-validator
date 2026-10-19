import { TemplateVariableUtil } from './template-variable.util';
import { TemplateVariable } from '../models/notification-letter.model';

describe('TemplateVariableUtil', () => {
  // Shared test fixtures
  const allowedVariables: TemplateVariable[] = [
    {
      name: 'DONOR_NAME',
      placeholder: '&&DONOR_NAME&&',
      description: 'Full name of the donor',
      example: 'John Doe'
    },
    {
      name: 'APPOINTMENT_DATE',
      placeholder: '&&APPOINTMENT_DATE&&',
      description: 'Scheduled appointment date',
      example: '01-JAN-2025'
    },
    {
      name: 'CENTER_NAME',
      placeholder: '&&CENTER_NAME&&',
      description: 'Blood center name',
      example: 'Downtown Blood Center'
    }
  ];

  describe('extractVariables', () => {
    it('should extract multiple variables from a message', () => {
      const message = 'Dear &&DONOR_NAME&&, your appointment is &&APPOINTMENT_DATE&& at &&CENTER_NAME&&.';

      const result = TemplateVariableUtil.extractVariables(message);

      expect(result).toEqual(['DONOR_NAME', 'APPOINTMENT_DATE', 'CENTER_NAME']);
    });

    it('should return an empty array when no variables are present', () => {
      const message = 'Dear donor, thank you for your donation.';

      const result = TemplateVariableUtil.extractVariables(message);

      expect(result).toEqual([]);
    });

    it('should return an empty array for null input', () => {
      const result = TemplateVariableUtil.extractVariables(null as any);

      expect(result).toEqual([]);
    });

    it('should return an empty array for undefined input', () => {
      const result = TemplateVariableUtil.extractVariables(undefined as any);

      expect(result).toEqual([]);
    });

    it('should return an empty array for empty string', () => {
      const result = TemplateVariableUtil.extractVariables('');

      expect(result).toEqual([]);
    });

    it('should not match nested or malformed delimiters', () => {
      const message = '&SINGLE& and &&& and &&&& and &missing&';

      const result = TemplateVariableUtil.extractVariables(message);

      expect(result).toEqual([]);
    });

    it('should extract a single variable', () => {
      const message = 'Hello &&DONOR_NAME&&!';

      const result = TemplateVariableUtil.extractVariables(message);

      expect(result).toEqual(['DONOR_NAME']);
    });

    it('should extract variables with numbers and underscores', () => {
      const message = '&&VAR_1&& and &&ITEM_2B&&';

      const result = TemplateVariableUtil.extractVariables(message);

      expect(result).toEqual(['VAR_1', 'ITEM_2B']);
    });

    it('should include duplicate variables', () => {
      const message = '&&DONOR_NAME&& is &&DONOR_NAME&&';

      const result = TemplateVariableUtil.extractVariables(message);

      expect(result).toEqual(['DONOR_NAME', 'DONOR_NAME']);
    });

    it('should not match lowercase variable names', () => {
      const message = '&&donor_name&&';

      const result = TemplateVariableUtil.extractVariables(message);

      expect(result).toEqual([]);
    });
  });

  describe('validateVariables', () => {
    it('should return valid when all variables are in the allowed list', () => {
      const message = 'Dear &&DONOR_NAME&&, your appointment is &&APPOINTMENT_DATE&&.';

      const result = TemplateVariableUtil.validateVariables(message, allowedVariables);

      expect(result.valid).toBe(true);
      expect(result.invalidVariables).toEqual([]);
    });

    it('should return invalid with list of unrecognized variables', () => {
      const message = 'Dear &&DONOR_NAME&&, ref: &&UNKNOWN_VAR&&, id: &&ANOTHER_BAD&&';

      const result = TemplateVariableUtil.validateVariables(message, allowedVariables);

      expect(result.valid).toBe(false);
      expect(result.invalidVariables).toContain('UNKNOWN_VAR');
      expect(result.invalidVariables).toContain('ANOTHER_BAD');
    });

    it('should return valid when message has no variables', () => {
      const message = 'Dear donor, thank you.';

      const result = TemplateVariableUtil.validateVariables(message, allowedVariables);

      expect(result.valid).toBe(true);
      expect(result.invalidVariables).toEqual([]);
    });

    it('should perform case-insensitive matching against allowed variables', () => {
      const lowerCaseAllowed: TemplateVariable[] = [
        {
          name: 'donor_name',
          placeholder: '&&donor_name&&',
          description: 'Donor name',
          example: 'John Doe'
        }
      ];
      const message = '&&DONOR_NAME&&';

      const result = TemplateVariableUtil.validateVariables(message, lowerCaseAllowed);

      expect(result.valid).toBe(true);
      expect(result.invalidVariables).toEqual([]);
    });

    it('should identify only the invalid variables in a mixed message', () => {
      const message = '&&DONOR_NAME&& and &&INVALID_ONE&& and &&CENTER_NAME&&';

      const result = TemplateVariableUtil.validateVariables(message, allowedVariables);

      expect(result.valid).toBe(false);
      expect(result.invalidVariables).toEqual(['INVALID_ONE']);
    });
  });

  describe('replaceVariables', () => {
    it('should replace all variables with their values', () => {
      const message = 'Dear &&DONOR_NAME&&, your appointment is &&APPOINTMENT_DATE&&.';
      const values = { DONOR_NAME: 'Jane Smith', APPOINTMENT_DATE: '15-MAR-2025' };

      const result = TemplateVariableUtil.replaceVariables(message, values);

      expect(result).toBe('Dear Jane Smith, your appointment is 15-MAR-2025.');
    });

    it('should replace only matched variables and keep unmatched placeholders', () => {
      const message = '&&DONOR_NAME&& at &&CENTER_NAME&&';
      const values = { DONOR_NAME: 'Jane Smith' };

      const result = TemplateVariableUtil.replaceVariables(message, values);

      expect(result).toBe('Jane Smith at &&CENTER_NAME&&');
    });

    it('should keep all placeholders when no values match', () => {
      const message = '&&DONOR_NAME&& at &&CENTER_NAME&&';
      const values = { UNRELATED: 'value' };

      const result = TemplateVariableUtil.replaceVariables(message, values);

      expect(result).toBe('&&DONOR_NAME&& at &&CENTER_NAME&&');
    });

    it('should return empty string for null message', () => {
      const result = TemplateVariableUtil.replaceVariables(null as any, { DONOR_NAME: 'Test' });

      expect(result).toBe('');
    });

    it('should return empty string for empty message', () => {
      const result = TemplateVariableUtil.replaceVariables('', { DONOR_NAME: 'Test' });

      expect(result).toBe('');
    });

    it('should handle uppercase key lookup fallback', () => {
      const message = '&&DONOR_NAME&&';
      const values = { DONOR_NAME: 'Via Uppercase' };

      const result = TemplateVariableUtil.replaceVariables(message, values);

      expect(result).toBe('Via Uppercase');
    });

    it('should return message unchanged when it has no variables', () => {
      const message = 'No variables here.';

      const result = TemplateVariableUtil.replaceVariables(message, { DONOR_NAME: 'Test' });

      expect(result).toBe('No variables here.');
    });
  });

  describe('getUniqueVariables', () => {
    it('should remove duplicate variable names', () => {
      const message = '&&DONOR_NAME&& and &&DONOR_NAME&& and &&CENTER_NAME&&';

      const result = TemplateVariableUtil.getUniqueVariables(message);

      expect(result).toEqual(['DONOR_NAME', 'CENTER_NAME']);
    });

    it('should return all variables when there are no duplicates', () => {
      const message = '&&DONOR_NAME&& and &&CENTER_NAME&&';

      const result = TemplateVariableUtil.getUniqueVariables(message);

      expect(result).toEqual(['DONOR_NAME', 'CENTER_NAME']);
    });

    it('should return an empty array for message without variables', () => {
      const result = TemplateVariableUtil.getUniqueVariables('No variables.');

      expect(result).toEqual([]);
    });

    it('should return single entry when same variable appears many times', () => {
      const message = '&&DONOR_NAME&& &&DONOR_NAME&& &&DONOR_NAME&&';

      const result = TemplateVariableUtil.getUniqueVariables(message);

      expect(result).toEqual(['DONOR_NAME']);
    });
  });

  describe('hasTemplateVariables', () => {
    it('should return true when message contains a template variable', () => {
      const result = TemplateVariableUtil.hasTemplateVariables('Hello &&DONOR_NAME&&!');

      expect(result).toBe(true);
    });

    it('should return false when message contains no template variables', () => {
      const result = TemplateVariableUtil.hasTemplateVariables('Hello donor!');

      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = TemplateVariableUtil.hasTemplateVariables('');

      expect(result).toBe(false);
    });

    it('should return true when message contains multiple variables', () => {
      const result = TemplateVariableUtil.hasTemplateVariables('&&DONOR_NAME&& &&CENTER_NAME&&');

      expect(result).toBe(true);
    });
  });

  describe('formatAsPlaceholder', () => {
    it('should wrap variable name in && delimiters', () => {
      const result = TemplateVariableUtil.formatAsPlaceholder('DONOR_NAME');

      expect(result).toBe('&&DONOR_NAME&&');
    });

    it('should convert lowercase input to uppercase', () => {
      const result = TemplateVariableUtil.formatAsPlaceholder('donor_name');

      expect(result).toBe('&&DONOR_NAME&&');
    });

    it('should convert mixed case input to uppercase', () => {
      const result = TemplateVariableUtil.formatAsPlaceholder('Donor_Name');

      expect(result).toBe('&&DONOR_NAME&&');
    });
  });

  describe('getSampleData', () => {
    it('should map variable names to their example values', () => {
      const result = TemplateVariableUtil.getSampleData(allowedVariables);

      expect(result['DONOR_NAME']).toBe('John Doe');
      expect(result['APPOINTMENT_DATE']).toBe('01-JAN-2025');
      expect(result['CENTER_NAME']).toBe('Downtown Blood Center');
    });

    it('should fall back to [name] when example is not provided', () => {
      const varsWithoutExamples: TemplateVariable[] = [
        {
          name: 'DONOR_ID',
          placeholder: '&&DONOR_ID&&',
          description: 'Donor identifier'
        }
      ];

      const result = TemplateVariableUtil.getSampleData(varsWithoutExamples);

      expect(result['DONOR_ID']).toBe('[DONOR_ID]');
    });

    it('should return an empty object for empty allowed variables', () => {
      const result = TemplateVariableUtil.getSampleData([]);

      expect(result).toEqual({});
    });

    it('should use example when present and fallback when absent in same set', () => {
      const mixedVars: TemplateVariable[] = [
        {
          name: 'WITH_EXAMPLE',
          placeholder: '&&WITH_EXAMPLE&&',
          description: 'Has example',
          example: 'Sample Value'
        },
        {
          name: 'WITHOUT_EXAMPLE',
          placeholder: '&&WITHOUT_EXAMPLE&&',
          description: 'No example'
        }
      ];

      const result = TemplateVariableUtil.getSampleData(mixedVars);

      expect(result['WITH_EXAMPLE']).toBe('Sample Value');
      expect(result['WITHOUT_EXAMPLE']).toBe('[WITHOUT_EXAMPLE]');
    });
  });

  describe('generatePreview', () => {
    it('should replace variables with sample data for a complete preview', () => {
      const message = 'Dear &&DONOR_NAME&&, your appointment is &&APPOINTMENT_DATE&& at &&CENTER_NAME&&.';

      const result = TemplateVariableUtil.generatePreview(message, allowedVariables);

      expect(result).toBe('Dear John Doe, your appointment is 01-JAN-2025 at Downtown Blood Center.');
    });

    it('should use fallback values for variables without examples', () => {
      const varsNoExample: TemplateVariable[] = [
        {
          name: 'DONOR_NAME',
          placeholder: '&&DONOR_NAME&&',
          description: 'Donor name'
        }
      ];
      const message = 'Hello &&DONOR_NAME&&!';

      const result = TemplateVariableUtil.generatePreview(message, varsNoExample);

      expect(result).toBe('Hello [DONOR_NAME]!');
    });

    it('should keep placeholders for variables not in the allowed list', () => {
      const message = '&&DONOR_NAME&& and &&UNKNOWN_VAR&&';

      const result = TemplateVariableUtil.generatePreview(message, allowedVariables);

      expect(result).toBe('John Doe and &&UNKNOWN_VAR&&');
    });

    it('should return message unchanged when it has no variables', () => {
      const message = 'No variables here.';

      const result = TemplateVariableUtil.generatePreview(message, allowedVariables);

      expect(result).toBe('No variables here.');
    });
  });

  describe('countVariableUsage', () => {
    it('should count single occurrences of each variable', () => {
      const message = '&&DONOR_NAME&& and &&CENTER_NAME&&';

      const result = TemplateVariableUtil.countVariableUsage(message);

      expect(result).toEqual({ DONOR_NAME: 1, CENTER_NAME: 1 });
    });

    it('should count multiple occurrences of the same variable', () => {
      const message = '&&DONOR_NAME&& is &&DONOR_NAME&& at &&CENTER_NAME&&';

      const result = TemplateVariableUtil.countVariableUsage(message);

      expect(result).toEqual({ DONOR_NAME: 2, CENTER_NAME: 1 });
    });

    it('should return an empty object for message without variables', () => {
      const result = TemplateVariableUtil.countVariableUsage('No variables.');

      expect(result).toEqual({});
    });

    it('should return an empty object for empty string', () => {
      const result = TemplateVariableUtil.countVariableUsage('');

      expect(result).toEqual({});
    });

    it('should handle a variable used many times', () => {
      const message = '&&X&& &&X&& &&X&& &&Y&&';

      const result = TemplateVariableUtil.countVariableUsage(message);

      expect(result).toEqual({ X: 3, Y: 1 });
    });
  });
});
