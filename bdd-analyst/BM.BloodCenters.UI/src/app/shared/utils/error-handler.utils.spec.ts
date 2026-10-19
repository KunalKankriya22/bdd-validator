import { HttpErrorHandler } from './error-handler.utils';

describe('HttpErrorHandler', () => {
  describe('extractErrorMessage', () => {
    const defaultMessage = 'Default error message';

    it('should return default message when error is null', () => {
      // Arrange & Act
      const result = HttpErrorHandler.extractErrorMessage(null, defaultMessage);

      // Assert
      expect(result).toBe(defaultMessage);
    });

    it('should return default message when error is undefined', () => {
      // Arrange & Act
      const result = HttpErrorHandler.extractErrorMessage(undefined, defaultMessage);

      // Assert
      expect(result).toBe(defaultMessage);
    });

    it('should extract error with code (Priority 1)', () => {
      // Arrange
      const error = {
        error: {
          errorResponse: {
            error: 'Invalid drive date',
            errorCode: 'DRV001'
          }
        }
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe('Error DRV001: Invalid drive date');
    });

    it('should extract error response message without code (Priority 2)', () => {
      // Arrange
      const error = {
        error: {
          errorResponse: {
            error: 'Resource not found'
          }
        }
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe('Resource not found');
    });

    it('should extract error object error property (Priority 3)', () => {
      // Arrange
      const error = {
        error: {
          error: 'Validation failed'
        }
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe('Validation failed');
    });

    it('should extract error object message property (Priority 4)', () => {
      // Arrange
      const error = {
        error: {
          message: 'Server error occurred'
        }
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe('Server error occurred');
    });

    it('should extract top-level message property (Priority 5)', () => {
      // Arrange
      const error = {
        message: 'Network error'
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe('Network error');
    });

    it('should return default message when no error properties found', () => {
      // Arrange
      const error = {
        someOtherProperty: 'value'
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe(defaultMessage);
    });

    it('should prioritize error with code over other error formats', () => {
      // Arrange
      const error = {
        error: {
          errorResponse: {
            error: 'Primary error',
            errorCode: 'ERR001'
          },
          error: 'Secondary error',
          message: 'Tertiary message'
        },
        message: 'Top level message'
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe('Error ERR001: Primary error');
    });

    it('should handle error with code but no message', () => {
      // Arrange
      const error = {
        error: {
          errorResponse: {
            errorCode: 'ERR002'
          }
        }
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe(defaultMessage);
    });

    it('should handle error with message but no code', () => {
      // Arrange
      const error = {
        error: {
          errorResponse: {
            error: 'Error without code'
          }
        }
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe('Error without code');
    });

    it('should handle empty error object', () => {
      // Arrange
      const error = {};

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe(defaultMessage);
    });

    it('should handle string error', () => {
      // Arrange
      const error = 'Simple string error';

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe(defaultMessage);
    });

    it('should handle deeply nested error structure', () => {
      // Arrange
      const error = {
        error: {
          errorResponse: {
            error: 'Drive ID is required',
            errorCode: 'VAL001'
          },
          error: 'Should not use this',
          message: 'Should not use this either'
        }
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe('Error VAL001: Drive ID is required');
    });

    it('should extract error message with special characters', () => {
      // Arrange
      const error = {
        error: {
          errorResponse: {
            error: 'Invalid format: expected "YYYY-MM-DD"',
            errorCode: 'FMT001'
          }
        }
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe('Error FMT001: Invalid format: expected "YYYY-MM-DD"');
    });

    it('should handle numeric error code', () => {
      // Arrange
      const error = {
        error: {
          errorResponse: {
            error: 'Database constraint violation',
            errorCode: 500
          }
        }
      };

      // Act
      const result = HttpErrorHandler.extractErrorMessage(error, defaultMessage);

      // Assert
      expect(result).toBe('Error 500: Database constraint violation');
    });
  });
});
