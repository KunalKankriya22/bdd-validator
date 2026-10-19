import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { NotificationLettersService } from './notification-letters.service';
import { ApiService } from '@shared/services/api.service';
import {
  LetterView,
  LetterCodeOption,
  TemplateVariable,
  CreateLetterDto,
  ReviseLetterDto,
  LetterFilterCriteria,
  SendEmailRequest,
  ApiResponse,
  ValidLetterApiResponse
} from '../models/notification-letter.model';

describe('NotificationLettersService', () => {
  let service: NotificationLettersService;
  let apiService: jasmine.SpyObj<ApiService>;

  // --- Mock data ---

  const mockApiLetter: ValidLetterApiResponse = {
    letterId: 'LTR-001',
    letterCode: '09.18',
    letterTitle: 'Birthday Letter',
    letterContent: '<p>Dear &&DONOR_NAME&&, Happy Birthday!</p>',
    versionNo: 2,
    versionDate: '2025-01-15T10:30:00',
    documentType: 'N',
    effectiveDate: '2025-01-01T00:00:00',
    modificationDate: '2025-01-15T10:30:00',
    terminationDate: null
  };

  const mockApiLetterTerminated: ValidLetterApiResponse = {
    letterId: 'LTR-002',
    letterCode: '10.05',
    letterTitle: 'Thank You Letter',
    letterContent: '<p>Thank you for donating.</p>',
    versionNo: 1,
    versionDate: '2024-06-01T08:00:00',
    documentType: 'N',
    effectiveDate: '2024-06-01T00:00:00',
    modificationDate: '2024-06-01T08:00:00',
    terminationDate: '2024-12-31T00:00:00'
  };

  const mockFilter: LetterFilterCriteria = {
    showTerminated: false,
    letterCode: '09.18'
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        NotificationLettersService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(NotificationLettersService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // =========================================================================
  // getLetters
  // =========================================================================
  describe('getLetters', () => {
    it('should map API response to LetterView array with transformed dates', (done) => {
      const mockResponse: ApiResponse<ValidLetterApiResponse[]> = {
        data: [mockApiLetter],
        success: true
      };
      apiService.post.and.returnValue(of(mockResponse));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters.length).toBe(1);

          const letter = letters[0];
          expect(letter.letterCode).toBe('09.18');
          expect(letter.title).toBe('Birthday Letter');
          expect(letter.fileName).toBe('09.18_v2.html');
          expect(letter.currentVersion).toBeDefined();
          expect(letter.currentVersion!.letterId).toBe('LTR-001');
          expect(letter.currentVersion!.versionNo).toBe(2);
          expect(letter.currentVersion!.letterMessage).toBe('<p>Dear &&DONOR_NAME&&, Happy Birthday!</p>');
          // Date should be transformed to DD-MMM-YYYY uppercase
          expect(letter.currentVersion!.effectiveDate).toBe('01-JAN-2025');
          // No termination date
          expect(letter.currentVersion!.terminationDate).toBeUndefined();
          expect(letter.currentVersion!.isCurrent).toBe(true);
          done();
        },
        error: done.fail
      });
    });

    it('should handle multiple letters in response', (done) => {
      const mockResponse: ApiResponse<ValidLetterApiResponse[]> = {
        data: [mockApiLetter, mockApiLetterTerminated],
        success: true
      };
      apiService.post.and.returnValue(of(mockResponse));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters.length).toBe(2);
          expect(letters[0].letterCode).toBe('09.18');
          expect(letters[1].letterCode).toBe('10.05');
          done();
        },
        error: done.fail
      });
    });

    it('should handle empty data in response', (done) => {
      const mockResponse: ApiResponse<ValidLetterApiResponse[]> = {
        data: [],
        success: true
      };
      apiService.post.and.returnValue(of(mockResponse));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters).toEqual([]);
          expect(letters.length).toBe(0);
          done();
        },
        error: done.fail
      });
    });

    it('should handle null data in response', (done) => {
      const mockResponse = { data: null, success: true } as any;
      apiService.post.and.returnValue(of(mockResponse));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should use default take=100 and skip=0 when not provided', (done) => {
      apiService.post.and.returnValue(of({ data: [], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: () => {
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('/100/0'),
            jasmine.any(Object)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should use custom take and skip values', (done) => {
      apiService.post.and.returnValue(of({ data: [], success: true }));

      service.getLetters(mockFilter, 50, 10).subscribe({
        next: () => {
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('/50/10'),
            jasmine.any(Object)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error after retry exhaustion', (done) => {
      apiService.post.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      service.getLetters(mockFilter).subscribe({
        next: () => done.fail('should have errored'),
        error: (err) => {
          expect(err.message).toBeDefined();
          done();
        }
      });
    });

    it('should build request body from filter criteria', (done) => {
      apiService.post.and.returnValue(of({ data: [], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: () => {
          const callArgs = apiService.post.calls.mostRecent().args;
          const body = callArgs[1];
          expect(body.letterCode).toBe('09.18');
          expect(body.showTerminated).toBe(false);
          expect(body.sort).toBe('A');
          done();
        },
        error: done.fail
      });
    });
  });

  // =========================================================================
  // getLetterCodes
  // =========================================================================
  describe('getLetterCodes', () => {
    it('should map letterCodes array to LetterCodeOption objects', (done) => {
      const mockResponse = {
        data: [{ letterCodes: ['09.18', '10.05', '12.01'] }],
        success: true
      };
      apiService.get.and.returnValue(of(mockResponse));

      service.getLetterCodes().subscribe({
        next: (options) => {
          expect(options.length).toBe(3);
          expect(options[0]).toEqual({ code: '09.18', description: '' });
          expect(options[1]).toEqual({ code: '10.05', description: '' });
          expect(options[2]).toEqual({ code: '12.01', description: '' });
          done();
        },
        error: done.fail
      });
    });

    it('should handle null data in response', (done) => {
      const mockResponse = { data: null, success: true } as any;
      apiService.get.and.returnValue(of(mockResponse));

      service.getLetterCodes().subscribe({
        next: (options) => {
          expect(options).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should handle undefined letterCodes', (done) => {
      const mockResponse = { data: [{}], success: true } as any;
      apiService.get.and.returnValue(of(mockResponse));

      service.getLetterCodes().subscribe({
        next: (options) => {
          expect(options).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should handle empty data array', (done) => {
      const mockResponse = { data: [], success: true };
      apiService.get.and.returnValue(of(mockResponse));

      service.getLetterCodes().subscribe({
        next: (options) => {
          expect(options).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should call the correct API endpoint', (done) => {
      apiService.get.and.returnValue(of({ data: [{ letterCodes: [] }], success: true }));

      service.getLetterCodes().subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            jasmine.stringContaining('valid-letters-filters')
          );
          done();
        },
        error: done.fail
      });
    });
  });

  // =========================================================================
  // getTemplateVariables
  // =========================================================================
  describe('getTemplateVariables', () => {
    it('should strip && delimiters from variable names', (done) => {
      const mockResponse = {
        data: [
          { variable: '&&CurrentDate&&', description: 'Current date', example: '01/15/2025', category: 'Date' },
          { variable: '&&DONOR_NAME&&', description: 'Donor full name', example: 'John Doe', category: 'Donor' }
        ],
        success: true
      };
      apiService.get.and.returnValue(of(mockResponse));

      service.getTemplateVariables().subscribe({
        next: (variables) => {
          expect(variables.length).toBe(2);
          expect(variables[0].name).toBe('CurrentDate');
          expect(variables[0].placeholder).toBe('&&CurrentDate&&');
          expect(variables[0].description).toBe('Current date');
          expect(variables[0].example).toBe('01/15/2025');
          expect(variables[0].dataType).toBe('Date');

          expect(variables[1].name).toBe('DONOR_NAME');
          expect(variables[1].placeholder).toBe('&&DONOR_NAME&&');
          done();
        },
        error: done.fail
      });
    });

    it('should handle empty data', (done) => {
      apiService.get.and.returnValue(of({ data: [], success: true }));

      service.getTemplateVariables().subscribe({
        next: (variables) => {
          expect(variables).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should handle null data', (done) => {
      apiService.get.and.returnValue(of({ data: null, success: true } as any));

      service.getTemplateVariables().subscribe({
        next: (variables) => {
          expect(variables).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should default description and example to empty strings when missing', (done) => {
      const mockResponse = {
        data: [{ variable: '&&TestVar&&' }],
        success: true
      };
      apiService.get.and.returnValue(of(mockResponse));

      service.getTemplateVariables().subscribe({
        next: (variables) => {
          expect(variables[0].description).toBe('');
          expect(variables[0].example).toBe('');
          expect(variables[0].dataType).toBe('');
          done();
        },
        error: done.fail
      });
    });

    it('should call the correct API endpoint', (done) => {
      apiService.get.and.returnValue(of({ data: [], success: true }));

      service.getTemplateVariables().subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            jasmine.stringContaining('template-variables')
          );
          done();
        },
        error: done.fail
      });
    });
  });

  // =========================================================================
  // createLetter
  // =========================================================================
  describe('createLetter', () => {
    it('should post DTO and return letter with transformed dates', (done) => {
      const dto: CreateLetterDto = {
        letterCode: '09.18',
        letterTitle: 'New Letter',
        letterContent: '<p>Content</p>',
        documentType: 'N',
        effectiveDate: '2025-03-01'
      };

      const mockLetterView: LetterView = {
        letterCode: '09.18',
        title: 'New Letter',
        description: 'New Letter',
        fileName: '09.18_v1.html',
        currentVersion: {
          letterId: 'LTR-NEW',
          letterCode: '09.18',
          versionNo: 1,
          effectiveDate: '2025-03-01',
          letterMessage: '<p>Content</p>',
          isCurrent: true
        }
      };

      const mockResponse: ApiResponse<LetterView> = {
        data: mockLetterView,
        success: true
      };
      apiService.post.and.returnValue(of(mockResponse));

      service.createLetter(dto).subscribe({
        next: (letter) => {
          expect(letter.letterCode).toBe('09.18');
          expect(letter.currentVersion!.effectiveDate).toBe('01-MAR-2025');
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('valid-letters'),
            dto
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error through handleError', (done) => {
      const dto: CreateLetterDto = {
        letterCode: '09.18',
        letterTitle: 'New Letter',
        letterContent: '<p>Content</p>',
        documentType: 'N',
        effectiveDate: '2025-03-01'
      };

      apiService.post.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate letter code' } }))
      );

      service.createLetter(dto).subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Duplicate letter code');
          done();
        }
      });
    });
  });

  // =========================================================================
  // reviseLetter
  // =========================================================================
  describe('reviseLetter', () => {
    it('should post DTO and return mapped letter with transformed dates', (done) => {
      const dto: ReviseLetterDto = {
        letterId: 'LTR-001',
        letterTitle: 'Revised Letter',
        effectiveDate: '2025-06-01',
        letterContent: '<p>Updated content</p>'
      };

      const apiResponse: ValidLetterApiResponse = {
        letterId: 'LTR-003',
        letterCode: '09.18',
        letterTitle: 'Revised Letter',
        letterContent: '<p>Updated content</p>',
        versionNo: 3,
        versionDate: '2025-06-01T10:00:00',
        documentType: 'N',
        effectiveDate: '2025-06-01T00:00:00',
        modificationDate: '2025-06-01T10:00:00',
        terminationDate: null
      };

      apiService.post.and.returnValue(of({ data: apiResponse, success: true }));

      service.reviseLetter(dto).subscribe({
        next: (letter) => {
          expect(letter.letterCode).toBe('09.18');
          expect(letter.title).toBe('Revised Letter');
          expect(letter.currentVersion!.versionNo).toBe(3);
          expect(letter.currentVersion!.effectiveDate).toBe('01-JUN-2025');
          expect(letter.currentVersion!.isCurrent).toBe(true);
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('revise'),
            dto
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return empty LetterView when response data is null', (done) => {
      const dto: ReviseLetterDto = {
        letterId: 'LTR-001',
        letterTitle: 'Revised Letter',
        effectiveDate: '2025-06-01',
        letterContent: '<p>Updated content</p>'
      };

      apiService.post.and.returnValue(of({ data: null, success: true }));

      service.reviseLetter(dto).subscribe({
        next: (result) => {
          expect(result).toEqual({} as any);
          done();
        },
        error: done.fail
      });
    });
  });

  // =========================================================================
  // getLetterDetail
  // =========================================================================
  describe('getLetterDetail', () => {
    it('should return mapped letter for successful response', (done) => {
      const mockResponse: ApiResponse<ValidLetterApiResponse[]> = {
        data: [mockApiLetter],
        success: true
      };
      apiService.get.and.returnValue(of(mockResponse));

      service.getLetterDetail('09.18').subscribe({
        next: (letter) => {
          expect(letter.letterCode).toBe('09.18');
          expect(letter.title).toBe('Birthday Letter');
          expect(letter.currentVersion!.effectiveDate).toBe('01-JAN-2025');
          expect(apiService.get).toHaveBeenCalledWith(
            jasmine.stringContaining('09.18')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should throw "Letter not found" when data is empty', (done) => {
      const mockResponse: ApiResponse<ValidLetterApiResponse[]> = {
        data: [],
        success: true
      };
      apiService.get.and.returnValue(of(mockResponse));

      service.getLetterDetail('INVALID').subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Letter not found');
          done();
        }
      });
    });

    it('should throw "Letter not found" when data is null', (done) => {
      apiService.get.and.returnValue(of({ data: null, success: true } as any));

      service.getLetterDetail('INVALID').subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Letter not found');
          done();
        }
      });
    });

    it('should use default documentType "N"', (done) => {
      apiService.get.and.returnValue(of({ data: [mockApiLetter], success: true }));

      service.getLetterDetail('09.18').subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            jasmine.stringContaining('documentType=N')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should pass custom documentType', (done) => {
      apiService.get.and.returnValue(of({ data: [mockApiLetter], success: true }));

      service.getLetterDetail('09.18', 'E').subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            jasmine.stringContaining('documentType=E')
          );
          done();
        },
        error: done.fail
      });
    });

    describe('versionNo filtering', () => {
      const mockApiResponses: ValidLetterApiResponse[] = [
        {
          letterId: 'BDAY-003',
          letterCode: 'BDAY',
          letterTitle: 'Happy Birthday',
          letterContent: 'Version 3 message',
          versionNo: 3,
          versionDate: '2025-06-01T00:00:00',
          documentType: 'N',
          effectiveDate: '2025-06-01T00:00:00',
          modificationDate: '2025-06-01T00:00:00',
          terminationDate: null
        },
        {
          letterId: 'BDAY-002',
          letterCode: 'BDAY',
          letterTitle: 'Happy Birthday',
          letterContent: 'Version 2 message',
          versionNo: 2,
          versionDate: '2024-01-01T00:00:00',
          documentType: 'N',
          effectiveDate: '2024-01-01T00:00:00',
          modificationDate: '2024-01-01T00:00:00',
          terminationDate: '2025-05-31T00:00:00'
        },
        {
          letterId: 'BDAY-001',
          letterCode: 'BDAY',
          letterTitle: 'Happy Birthday',
          letterContent: 'Version 1 message',
          versionNo: 1,
          versionDate: '2023-01-01T00:00:00',
          documentType: 'N',
          effectiveDate: '2023-01-01T00:00:00',
          modificationDate: '2023-01-01T00:00:00',
          terminationDate: '2023-12-31T00:00:00'
        }
      ];

      it('should return the matching version when versionNo is specified', (done) => {
        apiService.get.and.returnValue(of({ data: mockApiResponses, success: true }));

        service.getLetterDetail('BDAY', 'N', 2).subscribe({
          next: (result) => {
            expect(result.currentVersion?.versionNo).toBe(2);
            expect(result.currentVersion?.letterMessage).toBe('Version 2 message');
            expect(result.currentVersion?.letterId).toBe('BDAY-002');
            done();
          },
          error: done.fail
        });
      });

      it('should return first version when versionNo is not specified', (done) => {
        apiService.get.and.returnValue(of({ data: mockApiResponses, success: true }));

        service.getLetterDetail('BDAY', 'N').subscribe({
          next: (result) => {
            expect(result.currentVersion?.versionNo).toBe(3);
            expect(result.currentVersion?.letterMessage).toBe('Version 3 message');
            done();
          },
          error: done.fail
        });
      });

      it('should fall back to first version when specified versionNo not found', (done) => {
        apiService.get.and.returnValue(of({ data: mockApiResponses, success: true }));

        service.getLetterDetail('BDAY', 'N', 99).subscribe({
          next: (result) => {
            expect(result.currentVersion?.versionNo).toBe(3);
            done();
          },
          error: done.fail
        });
      });
    });
  });

  // =========================================================================
  // previewLetter
  // =========================================================================
  describe('previewLetter', () => {
    it('should return mapped letter for successful response', (done) => {
      const mockResponse: ApiResponse<ValidLetterApiResponse[]> = {
        data: [mockApiLetter],
        success: true
      };
      apiService.get.and.returnValue(of(mockResponse));

      service.previewLetter('09.18', 2).subscribe({
        next: (letter) => {
          expect(letter.letterCode).toBe('09.18');
          expect(letter.currentVersion!.versionNo).toBe(2);
          expect(letter.currentVersion!.letterMessage).toBe('<p>Dear &&DONOR_NAME&&, Happy Birthday!</p>');
          expect(apiService.get).toHaveBeenCalledWith(
            jasmine.stringContaining('preview')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should throw "Letter version not found" when data is empty', (done) => {
      const mockResponse: ApiResponse<ValidLetterApiResponse[]> = {
        data: [],
        success: true
      };
      apiService.get.and.returnValue(of(mockResponse));

      service.previewLetter('INVALID', 1).subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Letter version not found');
          done();
        }
      });
    });

    it('should throw "Letter version not found" when data is null', (done) => {
      apiService.get.and.returnValue(of({ data: null, success: true } as any));

      service.previewLetter('INVALID', 1).subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Letter version not found');
          done();
        }
      });
    });

    it('should use default documentType "N"', (done) => {
      apiService.get.and.returnValue(of({ data: [mockApiLetter], success: true }));

      service.previewLetter('09.18', 2).subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            jasmine.stringContaining('documentType=N')
          );
          done();
        },
        error: done.fail
      });
    });
  });

  // =========================================================================
  // sendEmailPreview
  // =========================================================================
  describe('sendEmailPreview', () => {
    it('should post request and map response to undefined', (done) => {
      const request: SendEmailRequest = {
        letterCode: '09.18',
        versionNo: 2,
        recipients: ['[REDACTED_EMAIL_ADDRESS_1]'],
        subject: 'Preview'
      };

      apiService.post.and.returnValue(of({ data: null, success: true }));

      service.sendEmailPreview(request).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('send-preview'),
            request
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error through handleError', (done) => {
      const request: SendEmailRequest = {
        letterCode: '09.18',
        versionNo: 2,
        recipients: ['[REDACTED_EMAIL_ADDRESS_1]']
      };

      apiService.post.and.returnValue(
        throwError(() => ({ error: { message: 'Email send failed' } }))
      );

      service.sendEmailPreview(request).subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Email send failed');
          done();
        }
      });
    });
  });

  // =========================================================================
  // formatDateForUI
  // =========================================================================
  describe('formatDateForUI', () => {
    it('should format valid ISO date to DD-MMM-YYYY uppercase', () => {
      expect(service.formatDateForUI('2025-03-07')).toBe('07-MAR-2025');
    });

    it('should format ISO datetime to DD-MMM-YYYY uppercase', () => {
      expect(service.formatDateForUI('2025-01-15T10:30:00')).toBe('15-JAN-2025');
    });

    it('should return empty string for null', () => {
      expect(service.formatDateForUI(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(service.formatDateForUI(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(service.formatDateForUI('')).toBe('');
    });

    it('should return empty string for whitespace-only string', () => {
      expect(service.formatDateForUI('   ')).toBe('');
    });

    it('should return original value for invalid date string', () => {
      expect(service.formatDateForUI('not-a-date')).toBe('not-a-date');
    });

    it('should handle different months correctly', () => {
      expect(service.formatDateForUI('2025-12-25')).toBe('25-DEC-2025');
      expect(service.formatDateForUI('2025-06-15')).toBe('15-JUN-2025');
      expect(service.formatDateForUI('2025-09-01')).toBe('01-SEP-2025');
    });
  });

  // =========================================================================
  // formatDateForApi
  // =========================================================================
  describe('formatDateForApi', () => {
    it('should format date string to YYYY-MM-DD', () => {
      expect(service.formatDateForApi('07-MAR-2025')).toBe('2025-03-07');
    });

    it('should format ISO date to YYYY-MM-DD', () => {
      expect(service.formatDateForApi('2025-01-15T10:30:00')).toBe('2025-01-15');
    });

    it('should return empty string for null', () => {
      expect(service.formatDateForApi(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(service.formatDateForApi(undefined)).toBe('');
    });

    it('should handle Date object', () => {
      const date = new Date(2025, 2, 7); // March 7, 2025
      const result = service.formatDateForApi(date);
      expect(result).toBe('2025-03-07');
    });

    it('should return empty string for invalid date', () => {
      expect(service.formatDateForApi('not-a-date')).toBe('');
    });
  });

  // =========================================================================
  // handleError (tested indirectly through public methods)
  // =========================================================================
  describe('handleError', () => {
    it('should extract error.error.message', (done) => {
      apiService.get.and.returnValue(
        throwError(() => ({ error: { message: 'Specific API error' } }))
      );

      service.getLetterCodes().subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Specific API error');
          done();
        }
      });
    });

    it('should join error.error.errors array', (done) => {
      apiService.get.and.returnValue(
        throwError(() => ({
          error: { errors: ['Field A is required', 'Field B is invalid'] }
        }))
      );

      service.getLetterCodes().subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Field A is required, Field B is invalid');
          done();
        }
      });
    });

    it('should fall back to error.message', (done) => {
      apiService.get.and.returnValue(
        throwError(() => ({ message: 'Network failure' }))
      );

      service.getLetterCodes().subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Network failure');
          done();
        }
      });
    });

    it('should use default message when no error info is available', (done) => {
      apiService.get.and.returnValue(
        throwError(() => ({}))
      );

      service.getLetterCodes().subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('An error occurred while processing your request.');
          done();
        }
      });
    });

    it('should prefer error.error.message over error.error.errors', (done) => {
      apiService.get.and.returnValue(
        throwError(() => ({
          error: {
            message: 'Primary message',
            errors: ['Secondary error']
          }
        }))
      );

      service.getLetterCodes().subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Primary message');
          done();
        }
      });
    });

    it('should skip empty errors array and fall back to error.message', (done) => {
      apiService.get.and.returnValue(
        throwError(() => ({
          error: { errors: [] },
          message: 'Fallback message'
        }))
      );

      service.getLetterCodes().subscribe({
        next: () => done.fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Fallback message');
          done();
        }
      });
    });
  });

  // =========================================================================
  // mapApiResponseToLetterView (tested indirectly through getLetters)
  // =========================================================================
  describe('mapApiResponseToLetterView', () => {
    it('should set isCurrent=true when terminationDate is null', (done) => {
      const apiLetter: ValidLetterApiResponse = {
        ...mockApiLetter,
        terminationDate: null
      };
      apiService.post.and.returnValue(of({ data: [apiLetter], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters[0].currentVersion!.isCurrent).toBe(true);
          done();
        },
        error: done.fail
      });
    });

    it('should set isCurrent=true when terminationDate is in the future', (done) => {
      const futureDate = moment().add(1, 'year').format('YYYY-MM-DDTHH:mm:ss');
      const apiLetter: ValidLetterApiResponse = {
        ...mockApiLetter,
        terminationDate: futureDate
      };
      apiService.post.and.returnValue(of({ data: [apiLetter], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters[0].currentVersion!.isCurrent).toBe(true);
          done();
        },
        error: done.fail
      });
    });

    it('should set isCurrent=false when terminationDate is in the past', (done) => {
      const apiLetter: ValidLetterApiResponse = {
        ...mockApiLetter,
        terminationDate: '2020-01-01T00:00:00'
      };
      apiService.post.and.returnValue(of({ data: [apiLetter], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters[0].currentVersion!.isCurrent).toBe(false);
          done();
        },
        error: done.fail
      });
    });

    it('should map fileName as letterCode_vVersionNo.html', (done) => {
      apiService.post.and.returnValue(of({ data: [mockApiLetter], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters[0].fileName).toBe('09.18_v2.html');
          done();
        },
        error: done.fail
      });
    });

    it('should use letterTitle for both title and description', (done) => {
      apiService.post.and.returnValue(of({ data: [mockApiLetter], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters[0].title).toBe('Birthday Letter');
          expect(letters[0].description).toBe('Birthday Letter');
          done();
        },
        error: done.fail
      });
    });

    it('should map letterContent to letterMessage', (done) => {
      apiService.post.and.returnValue(of({ data: [mockApiLetter], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters[0].currentVersion!.letterMessage).toBe('<p>Dear &&DONOR_NAME&&, Happy Birthday!</p>');
          done();
        },
        error: done.fail
      });
    });

    it('should default letterMessage to empty string when letterContent is undefined', (done) => {
      const apiLetter: ValidLetterApiResponse = {
        ...mockApiLetter,
        letterContent: undefined
      };
      apiService.post.and.returnValue(of({ data: [apiLetter], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters[0].currentVersion!.letterMessage).toBe('');
          done();
        },
        error: done.fail
      });
    });

    it('should map versionDate to createdDate and modificationDate to modifiedDate', (done) => {
      apiService.post.and.returnValue(of({ data: [mockApiLetter], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          // createdDate is transformed by transformLetterDates via formatDateForUI
          expect(letters[0].currentVersion!.createdDate).toBe('15-JAN-2025');
          expect(letters[0].currentVersion!.modifiedDate).toBe('2025-01-15T10:30:00');
          done();
        },
        error: done.fail
      });
    });
  });

  // =========================================================================
  // transformLetterDates (tested indirectly)
  // =========================================================================
  describe('transformLetterDates', () => {
    it('should transform effectiveDate to DD-MMM-YYYY uppercase', (done) => {
      apiService.post.and.returnValue(of({ data: [mockApiLetter], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters[0].currentVersion!.effectiveDate).toBe('01-JAN-2025');
          done();
        },
        error: done.fail
      });
    });

    it('should transform terminationDate when present', (done) => {
      apiService.post.and.returnValue(of({ data: [mockApiLetterTerminated], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters[0].currentVersion!.terminationDate).toBe('31-DEC-2024');
          done();
        },
        error: done.fail
      });
    });

    it('should leave terminationDate as undefined when not present', (done) => {
      apiService.post.and.returnValue(of({ data: [mockApiLetter], success: true }));

      service.getLetters(mockFilter).subscribe({
        next: (letters) => {
          expect(letters[0].currentVersion!.terminationDate).toBeUndefined();
          done();
        },
        error: done.fail
      });
    });
  });
});
