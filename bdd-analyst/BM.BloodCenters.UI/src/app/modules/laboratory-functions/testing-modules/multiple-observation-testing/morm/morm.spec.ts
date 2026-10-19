import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Morm } from './morm';
import { MormApiService } from './services/morm-api.service';
import { MaterialModule } from '@shared/material/material.module';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MormRow } from './models/morm.model';
import moment from 'moment';

describe('Morm Component - Gap Analysis Tests', () => {
  let component: Morm;
  let fixture: ComponentFixture<Morm>;
  let mockApiService: jasmine.SpyObj<MormApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  beforeEach(async () => {
    // Create spies for services
    mockApiService = jasmine.createSpyObj('MormApiService', [
      'getMatrix',
      'getTestsLov',
      'getTestTypesLov',
      'getInterpretationsLov',
      'saveMatrix'
    ]);
    mockSnackbarService = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);

    // Default mock returns
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment('2024-06-15'));
    mockApiService.getTestsLov.and.returnValue(of({ success: true, data: [] }));
    mockApiService.getTestTypesLov.and.returnValue(of({ success: true, data: [] }));
    mockApiService.getInterpretationsLov.and.returnValue(of({ success: true, data: [] }));

    await TestBed.configureTestingModule({
      declarations: [Morm],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        MaterialModule
      ],
      providers: [
        { provide: MormApiService, useValue: mockApiService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Morm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with chapter local date', () => {
      expect(mockChapterTimezoneService.getChapterLocalDate).toHaveBeenCalled();
    });
  });

  describe('Gap #5: Termination Date Past Check (High)', () => {
    it('should show error when termination date is in the past', () => {
      const row: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: {},
        effDate: moment('2024-06-10'),
        termDate: moment('2024-06-14'), // Yesterday (chapter local date is 2024-06-15)
        isNew: false,
        isDirty: true,
        isDeleted: false,
        errors: {},
        termDateTouched: true
      };

      const error = component['getTermDateError'](row);

      expect(error).toContain('cannot be past date');
    });

    it('should not show error when termination date is today', () => {
      const row: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: {},
        effDate: moment('2024-06-10'),
        termDate: moment('2024-06-15'), // Today
        isNew: false,
        isDirty: true,
        isDeleted: false,
        errors: {},
        termDateTouched: true
      };

      const error = component['getTermDateError'](row);

      expect(error).toBe('');
    });

    it('should not show error when termination date is in the future', () => {
      const row: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: {},
        effDate: moment('2024-06-10'),
        termDate: moment('2024-06-20'), // Future
        isNew: false,
        isDirty: true,
        isDeleted: false,
        errors: {},
        termDateTouched: true
      };

      const error = component['getTermDateError'](row);

      expect(error).toBe('');
    });

    it('should use chapter local date for past date check, not system date', () => {
      // Set chapter local date to specific value
      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment('2024-07-01'));
      component.ngOnInit();

      const row: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: {},
        effDate: moment('2024-06-10'),
        termDate: moment('2024-06-30'), // Past in chapter timezone
        isNew: false,
        isDirty: true,
        isDeleted: false,
        errors: {},
        termDateTouched: true
      };

      const error = component['getTermDateError'](row);

      expect(error).toContain('cannot be past date');
    });
  });

  describe('Gap #6: Client-Side Duplicate Record Check (High)', () => {
    beforeEach(() => {
      component['selectedTestId'].set('TEST001');
      component['selectedTestType'].set('TYPE1');
    });

    it('should detect duplicate records with same test interpretation and band values', () => {
      const existingRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        setNumber: 1,
        results: { 'Band 1': 'P', 'Band 2': 'N', 'Band 3': 'P' },
        effDate: moment('2024-01-01'),
        termDate: null,
        isNew: false,
        isDirty: false,
        isDeleted: false,
        errors: {}
      };

      const newRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: { 'Band 1': 'P', 'Band 2': 'N', 'Band 3': 'P' }, // Same values
        effDate: moment('2024-06-01'),
        termDate: null,
        isNew: true,
        isDirty: true,
        isDeleted: false,
        errors: {}
      };

      component['resultRows'].set([existingRow, newRow]);

      const duplicateError = component['checkForDuplicates']();

      expect(duplicateError).toContain('already exists');
    });

    it('should not flag duplicate when test interpretation differs', () => {
      const existingRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        setNumber: 1,
        results: { 'Band 1': 'P', 'Band 2': 'N' },
        effDate: moment('2024-01-01'),
        termDate: null,
        isNew: false,
        isDirty: false,
        isDeleted: false,
        errors: {}
      };

      const newRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'NEG', // Different interpretation
        results: { 'Band 1': 'P', 'Band 2': 'N' },
        effDate: moment('2024-06-01'),
        termDate: null,
        isNew: true,
        isDirty: true,
        isDeleted: false,
        errors: {}
      };

      component['resultRows'].set([existingRow, newRow]);

      const duplicateError = component['checkForDuplicates']();

      expect(duplicateError).toBeNull();
    });

    it('should not flag duplicate when band values differ', () => {
      const existingRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        setNumber: 1,
        results: { 'Band 1': 'P', 'Band 2': 'N' },
        effDate: moment('2024-01-01'),
        termDate: null,
        isNew: false,
        isDirty: false,
        isDeleted: false,
        errors: {}
      };

      const newRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: { 'Band 1': 'P', 'Band 2': 'P' }, // Different Band 2 value
        effDate: moment('2024-06-01'),
        termDate: null,
        isNew: true,
        isDirty: true,
        isDeleted: false,
        errors: {}
      };

      component['resultRows'].set([existingRow, newRow]);

      const duplicateError = component['checkForDuplicates']();

      expect(duplicateError).toBeNull();
    });

    it('should ignore deleted rows when checking for duplicates', () => {
      const deletedRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        setNumber: 1,
        results: { 'Band 1': 'P', 'Band 2': 'N' },
        effDate: moment('2024-01-01'),
        termDate: null,
        isNew: false,
        isDirty: false,
        isDeleted: true, // Deleted
        errors: {}
      };

      const newRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: { 'Band 1': 'P', 'Band 2': 'N' },
        effDate: moment('2024-06-01'),
        termDate: null,
        isNew: true,
        isDirty: true,
        isDeleted: false,
        errors: {}
      };

      component['resultRows'].set([deletedRow, newRow]);

      const duplicateError = component['checkForDuplicates']();

      expect(duplicateError).toBeNull();
    });

    it('should handle case-insensitive band value comparison', () => {
      const existingRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        setNumber: 1,
        results: { 'Band 1': 'p', 'Band 2': 'n' }, // lowercase
        effDate: moment('2024-01-01'),
        termDate: null,
        isNew: false,
        isDirty: false,
        isDeleted: false,
        errors: {}
      };

      const newRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: { 'Band 1': 'P', 'Band 2': 'N' }, // uppercase
        effDate: moment('2024-06-01'),
        termDate: null,
        isNew: true,
        isDirty: true,
        isDeleted: false,
        errors: {}
      };

      component['resultRows'].set([existingRow, newRow]);

      const duplicateError = component['checkForDuplicates']();

      expect(duplicateError).toContain('already exists');
    });

    it('should prevent save when duplicate is detected', () => {
      const existingRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        setNumber: 1,
        results: { 'Band 1': 'P' },
        effDate: moment('2024-01-01'),
        termDate: null,
        isNew: false,
        isDirty: false,
        isDeleted: false,
        errors: {}
      };

      const duplicateRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: { 'Band 1': 'P' },
        effDate: moment('2024-06-01'),
        termDate: null,
        isNew: true,
        isDirty: true,
        isDeleted: false,
        errors: {}
      };

      component['resultRows'].set([existingRow, duplicateRow]);
      component['selectedTestId'].set('TEST001');
      component['selectedTestType'].set('TYPE1');

      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('already exists')
      );
      expect(mockApiService.saveMatrix).not.toHaveBeenCalled();
    });
  });

  describe('Gap #9: Effective Date Field Disable Logic (Low)', () => {
    it('should allow editing effective date for new records', () => {
      const newRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: {},
        effDate: moment('2024-06-20'),
        termDate: null,
        isNew: true,
        isDirty: true,
        isDeleted: false,
        errors: {}
      };

      const isEditable = component['isEffDateEditable'](newRow);

      expect(isEditable).toBe(true);
    });

    it('should disable effective date field when date is in the past', () => {
      const pastRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: {},
        effDate: moment('2024-06-10'), // Past date (chapter local is 2024-06-15)
        termDate: null,
        isNew: false,
        isDirty: false,
        isDeleted: false,
        errors: {}
      };

      const isEditable = component['isEffDateEditable'](pastRow);

      expect(isEditable).toBe(false);
    });

    it('should allow editing effective date when date is today', () => {
      const todayRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: {},
        effDate: moment('2024-06-15'), // Today
        termDate: null,
        isNew: false,
        isDirty: false,
        isDeleted: false,
        errors: {}
      };

      const isEditable = component['isEffDateEditable'](todayRow);

      expect(isEditable).toBe(true);
    });

    it('should allow editing effective date when date is in the future', () => {
      const futureRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: {},
        effDate: moment('2024-06-20'), // Future
        termDate: null,
        isNew: false,
        isDirty: false,
        isDeleted: false,
        errors: {}
      };

      const isEditable = component['isEffDateEditable'](futureRow);

      expect(isEditable).toBe(true);
    });

    it('should allow editing when effective date is null', () => {
      const nullDateRow: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: {},
        effDate: null,
        termDate: null,
        isNew: false,
        isDirty: false,
        isDeleted: false,
        errors: {}
      };

      const isEditable = component['isEffDateEditable'](nullDateRow);

      expect(isEditable).toBe(true);
    });
  });

  describe('Chapter Timezone Integration', () => {
    it('should use ChapterTimezoneService for all date validations', () => {
      // Verify service is called during initialization
      expect(mockChapterTimezoneService.getChapterLocalDate).toHaveBeenCalled();
    });

    it('should apply chapter local date to effective date validation', () => {
      const testDate = moment('2024-08-01');
      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(testDate);
      component.ngOnInit();

      const row: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: {},
        effDate: moment('2024-07-31'), // Past
        termDate: null,
        isNew: false,
        isDirty: true,
        isDeleted: false,
        errors: {},
        effDateTouched: true
      };

      const error = component['getEffDateError'](row);

      expect(error).toContain('cannot be past date');
    });
  });

  describe('Band Value Normalization', () => {
    it('should normalize empty string band values to null before save', () => {
      const row: MormRow = {
        testId: 'TEST001',
        testType: 'TYPE1',
        testIntp: 'POS',
        results: {
          'Band 1': 'P',
          'Band 2': '', // Empty string (Not Tested)
          'Band 3': 'N'
        },
        effDate: moment('2024-06-15'),
        termDate: null,
        isNew: true,
        isDirty: true,
        isDeleted: false,
        errors: {}
      };

      component['resultRows'].set([row]);
      component['selectedTestId'].set('TEST001');
      component['selectedTestType'].set('TYPE1');

      mockApiService.saveMatrix.and.returnValue(of({
        success: true,
        message: 'Saved',
        statusCode: 200,
        data: true
      }));

      component.onSave();

      expect(mockApiService.saveMatrix).toHaveBeenCalledWith(
        jasmine.objectContaining({
          matrixResults: jasmine.arrayContaining([
            jasmine.objectContaining({
              results: jasmine.objectContaining({
                'Band 2': null // Empty string normalized to null
              })
            })
          ])
        })
      );
    });
  });
});
