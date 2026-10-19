import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import moment from 'moment';

import { AssociateStrongReactivityComponent } from './associate-strong-reactivity.component';
import { StrongReactivityService } from './services/strong-reactivity.service';
import { StrongReactivityModel, StrongReactivityEditRow } from './models/strong-reactivity.model';
import { provideRouter } from '@angular/router';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('AssociateStrongReactivityComponent', () => {
  let component: AssociateStrongReactivityComponent;
  let fixture: ComponentFixture<AssociateStrongReactivityComponent>;
  let mockService: jasmine.SpyObj<StrongReactivityService>;
  let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  function toISODateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const mockData: StrongReactivityModel[] = [
    {
      epitopeId1: '11',
      epitopeId2: '1',
      bound: 'S',
      effectiveDate: '2026-05-16',
      terminationDate: null
    },
    {
      epitopeId1: '63',
      epitopeId2: '77',
      bound: 'S',
      effectiveDate: '1997-10-06',
      terminationDate: null
    }
  ];

  const mockEpitopes = [
    { epitopeId: '1', locus: 'A' },
    { epitopeId: '11', locus: 'B' },
    { epitopeId: '63', locus: 'C' },
    { epitopeId: '77', locus: 'DQ' }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('StrongReactivityService', [
      'getStrongReactivities',
      'getEpitopesDropdown',
      'batchUpdate'
    ]);

    mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges', 'markForCheck']);

    mockTranslateService = createMockTranslateService();
    mockService.getStrongReactivities.and.returnValue(
      of({ data: mockData, total: 2 })
    );
    mockService.getEpitopesDropdown.and.returnValue(of(mockEpitopes));



      TestBed.configureTestingModule({
imports: [
        AssociateStrongReactivityComponent,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        provideRouter([])
      ]
    })
    .overrideComponent(AssociateStrongReactivityComponent, {
      set: {
        providers: [
          { provide: StrongReactivityService, useValue: mockService },
          { provide: TranslateService, useValue: mockTranslateService }
        ]
      }
    });


    });



  beforeEach(() => {




      mockService.getEpitopesDropdown.and.returnValue(of(mockEpitopes));


    fixture = TestBed.createComponent(AssociateStrongReactivityComponent);
    component = fixture.componentInstance;


    });

  describe('ngOnInit', () => {


    it('should set correct column widths', () => {
      fixture.detectChanges();
      expect(component.tableConfig.columns[0].width).toBe('100px');
      expect(component.tableConfig.columns[1].width).toBe('100px');
      expect(component.tableConfig.columns[2].width).toBe('80px');
      expect(component.tableConfig.columns[3].width).toBe('130px');
      expect(component.tableConfig.columns[4].width).toBe('130px');
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call API with searchKeyword when searching', () => {
      component.onSearch('test search');

      expect(mockService.getStrongReactivities).toHaveBeenCalledWith(
        100,
        0,
        jasmine.objectContaining({ searchKeyword: 'test search' })
      );
    });

    it('should remove searchKeyword from request when search is empty', () => {
      component.onSearch('');
      expect((component.requestState as any).searchKeyword).toBeUndefined();
    });
  });


  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should apply bond filter', () => {
      component.applyFilters({
        epitopeId1: null,
        epitopeId2: null,
        bound: 'S',
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      });

      expect((component.requestState as any).bond).toBe('S');
      expect(mockService.getStrongReactivities).toHaveBeenCalled();
    });

    it('should apply effective date filter with period', () => {
      const testDate = yesterday;
      component.applyFilters({
        epitopeId1: null,
        epitopeId2: null,
        bound: null,
        effectivePeriod: 'After',
        effectiveDate: testDate,
        terminationPeriod: null,
        terminationDate: null
      });

      expect((component.requestState as any).effDate).toBe(toISODateString(yesterday));
      expect((component.requestState as any).effDatePeriod).toBe('After');
    });

    it('should apply termination date filter with period', () => {
      const testDate = today;
      component.applyFilters({
        epitopeId1: null,
        epitopeId2: null,
        bound: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'Before',
        terminationDate: testDate
      });

      expect((component.requestState as any).termDate).toBe(toISODateString(today));
      expect((component.requestState as any).termDatePeriod).toBe('Before');
    });


    it('should preserve search and sort when clearing filters', () => {
      (component.requestState as any).searchKeyword = 'test';
      (component.requestState as any).sortColumn = 'epitopeId1';
      (component.requestState as any).sortDirection = 'ASC';

      component.clearAllFilters();

      expect((component.requestState as any).searchKeyword).toBe('test');
      expect((component.requestState as any).sortColumn).toBe('epitopeId1');
      expect((component.requestState as any).sortDirection).toBe('ASC');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should enter edit mode and load epitope options', fakeAsync(() => {
      component.enterEditMode();
      tick();

      expect(mockService.getEpitopesDropdown).toHaveBeenCalled();
      expect(component.isEditMode).toBe(true);
    }));

    it('should add new row to dataSource', () => {
      component.isEditMode = true;
      const initialLength = component.dataSource.length;

      component.addNewRow();

      expect(component.dataSource.length).toBe(initialLength + 1);
      expect(component.dataSource[component.dataSource.length - 1]._isNew).toBe(true);
    });


    it('should mark row as modified', () => {
      const row: StrongReactivityEditRow = {
        epitopeId1: '11',
        epitopeId2: '1',
        _isNew: false
      };

      component.markRowAsModified(row);

      expect(row._isModified).toBe(true);
    });


  });

  describe('Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.isEditMode = true;
    });


    it('should validate that epitopeId1 and epitopeId2 are different', () => {
      const formGroup = new FormGroup({
        epitopeId1: new FormControl('11', [Validators.required]),
        epitopeId2: new FormControl('11', [Validators.required]),
        bound: new FormControl('S', [Validators.required]),
        effDate: new FormControl(new Date(), [Validators.required]),
        termDate: new FormControl(null)
      }, {
        validators: [(component as any).epitopeIdsDifferentValidator()]
      });

      const row: StrongReactivityEditRow = {
        epitopeId1: '11',
        epitopeId2: '11',
        bound: 'S',
        effectiveDate: new Date(),
        _isNew: true,
        _formGroup: formGroup
      };

      component.dataSource = [row];

      // Mock snackBar
      spyOn(component['snackBar'], 'open');

      component.saveChanges();

      // Check for epitopeIdsDifferent error at form level
      expect(row._formGroup?.hasError('epitopeIdsDifferent')).toBe(true);
    });



    xit('should detect duplicate rows', () => {
      const testDate = yesterday;
      component.isEditMode = true;

      const row1: StrongReactivityEditRow = {
        epitopeId1: '11',
        epitopeId2: '1',
        bound: 'S',
        effectiveDate: testDate,
        _isNew: true,
        _formGroup: new FormGroup({
          epitopeId1: new FormControl('11'),
          epitopeId2: new FormControl('1'),
          bound: new FormControl('S'),
          effDate: new FormControl(testDate),
          termDate: new FormControl(null)
        })
      };

      const row2: StrongReactivityEditRow = {
        epitopeId1: '11',
        epitopeId2: '1',
        bound: 'C',
        effectiveDate: testDate,
        _isNew: true,
        _formGroup: new FormGroup({
          epitopeId1: new FormControl('11'),
          epitopeId2: new FormControl('1'),
          bound: new FormControl('C'),
          effDate: new FormControl(testDate),
          termDate: new FormControl(null)
        })
      };

      component.dataSource = [row1, row2];

      // Mock batchUpdate to return success (though it won't be called due to validation failure)
      mockService.batchUpdate.and.returnValue(of({ success: true }));

      component.saveChanges();

      const hasError = component.dataSource.some(row =>
        row._formGroup?.hasError('duplicate')
      );
      expect(hasError).toBe(true);
    });
  });

  describe('Save Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.isEditMode = true;
    });



    it('should handle save errors', fakeAsync(() => {
      mockService.batchUpdate.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      const formGroup = new FormGroup({
        epitopeId1: new FormControl('11', [Validators.required]),
        epitopeId2: new FormControl('1', [Validators.required]),
        bound: new FormControl('S', [Validators.required]),
        effDate: new FormControl(tomorrow, [Validators.required]),
        termDate: new FormControl(null)
      }, {
        validators: [
          DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate'),
          (component as any).epitopeIdsDifferentValidator()
        ]
      });

      const row: StrongReactivityEditRow = {
        epitopeId1: '11',
        epitopeId2: '1',
        bound: 'S',
        effectiveDate: tomorrow,
        _isNew: true,
        _formGroup: formGroup
      };

      component.dataSource = [row];

      // Mock snackBar
      spyOn(component['snackBar'], 'open');

      component.saveChanges();
      tick();

      expect(component.isEditMode).toBe(true);
    }));


  });
});
