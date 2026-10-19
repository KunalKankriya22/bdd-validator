import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { VistaLifeTrakConversionTableComponent } from './vista-lifetrak-conversion-table';
import { VistaLifeTrakConversionTableService, ApiResponse } from './services/vista-lifetrak-conversion-table.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ValidMasterCodesService } from '@shared/services/valid-master-codes.service';
import { IdpConvRefValueDto } from './models/vista-lifetrak-conversion-table.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('VistaLifeTrakConversionTableComponent', () => {
  let component: VistaLifeTrakConversionTableComponent;
  let fixture: ComponentFixture<VistaLifeTrakConversionTableComponent>;
  let serviceSpy: jasmine.SpyObj<VistaLifeTrakConversionTableService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let lookupServiceSpy: jasmine.SpyObj<ValidMasterCodesService>;

  const mockData: IdpConvRefValueDto[] = [
    {
      convRefId: 1, sourceId: 'DRM', targetId: 'LFTRK',
      sourceCodeType: 'DRCAT', sourceValue: '123',
      sourceTable: null, sourceColumn: null,
      targetCodeType: 'CONTY', targetValue: '123',
      targetTable: null, targetColumn: null,
      convProcCall: 123, effDate: '2025-01-11T00:00:00', termDate: '2025-01-11T00:00:00'
    },
    {
      convRefId: 2, sourceId: 'DRM', targetId: 'LFTRK',
      sourceCodeType: 'DRVTY', sourceValue: 'DRIVE1',
      sourceTable: null, sourceColumn: null,
      targetCodeType: 'DRVTY', targetValue: 'DRIVE',
      targetTable: null, targetColumn: null,
      convProcCall: 1, effDate: '2025-01-11T00:00:00', termDate: '2025-01-11T00:00:00'
    }
  ];

  const mockLookupItems = [
    { code: 'DRM', description: 'DRM System' },
    { code: 'LFTRK', description: 'LifeTrak' }
  ];

  const tomorrow = moment().add(1, 'day').startOf('day');
  const nextYear = moment().add(1, 'year').startOf('day');

  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('VistaLifeTrakConversionTableService', [
      'getById', 'getConversionCodes', 'create', 'update',
      'getSourceIdLookup', 'getTargetIdLookup',
      'getSourceTypeLookup', 'getTargetTypeLookup', 'getTargetValueLookups'
    ]);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({
        title: 'Vista-LifeTrak Conversion Table',
        subtitle: 'Define available time slots and capacity for donor appointments at a site.'
      })
    });
    headerServiceSpy = createMockHeaderService();
    lookupServiceSpy = jasmine.createSpyObj('ValidMasterCodesService', ['clearCache']);

    serviceSpy.getById.and.returnValue(of(mockData[0]));
    serviceSpy.getSourceIdLookup.and.returnValue(of(mockLookupItems));
    serviceSpy.getTargetIdLookup.and.returnValue(of(mockLookupItems));
    serviceSpy.getSourceTypeLookup.and.returnValue(of(mockLookupItems));
    serviceSpy.getTargetTypeLookup.and.returnValue(of(mockLookupItems));
    serviceSpy.getTargetValueLookups.and.returnValue(of([
      { code: 'WHOLE', description: 'Whole Blood' },
      { code: '123', description: 'Test Value' },
      { code: 'DRIVE', description: 'Drive Type' }
    ]));
    serviceSpy.getConversionCodes.and.returnValue(of({ data: mockData, totalCount: 2 }));
    serviceSpy.create.and.returnValue(of({ success: true, data: mockData[0] } as ApiResponse<IdpConvRefValueDto>));
    serviceSpy.update.and.returnValue(of({ success: true, data: mockData[0] } as ApiResponse<IdpConvRefValueDto>));



      TestBed.configureTestingModule({
      imports: [
        VistaLifeTrakConversionTableComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: VistaLifeTrakConversionTableService, useValue: serviceSpy },
        { provide: ValidMasterCodesService, useValue: lookupServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    });
      serviceSpy.getById.and.returnValue(of(mockData[0]));


      serviceSpy.getSourceIdLookup.and.returnValue(of(mockLookupItems));


      serviceSpy.getTargetIdLookup.and.returnValue(of(mockLookupItems));


      serviceSpy.getSourceTypeLookup.and.returnValue(of(mockLookupItems));


      serviceSpy.getTargetTypeLookup.and.returnValue(of(mockLookupItems));


      serviceSpy.getConversionCodes.and.returnValue(of({ data: mockData, totalCount: 2 }));


      serviceSpy.create.and.returnValue(of({ success: true, data: mockData[0] } as ApiResponse<IdpConvRefValueDto>));


      serviceSpy.update.and.returnValue(of({ success: true, data: mockData[0] } as ApiResponse<IdpConvRefValueDto>));


    fixture = TestBed.createComponent(VistaLifeTrakConversionTableComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should load lookup values on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getSourceIdLookup).toHaveBeenCalled();
      expect(serviceSpy.getTargetIdLookup).toHaveBeenCalled();
      expect(component.sourceIdOptions.length).toBe(2);
      expect(component.targetIdOptions.length).toBe(2);
    }));



    it('should start in view mode with no data', () => {
      expect(component.isEditOrAddMode).toBeFalse();
      expect(component.dataSource.length).toBe(0);
      expect(component.hasRetrieved).toBeFalse();
    });
  });

  describe('Retrieve', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should disable retrieve when source or target not selected', () => {
      component.selectedSourceId = '';
      component.selectedTargetId = '';
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should enable retrieve when both source and target selected', () => {
      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';
      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should load data on retrieve', fakeAsync(() => {
      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';

      component.retrieve();
      tick();

      expect(serviceSpy.getConversionCodes).toHaveBeenCalledWith(1000, 0, {
        sourceId: 'DRM',
        targetId: 'LFTRK',
      });
      expect(component.dataSource.length).toBe(2);
      expect(component.totalCount).toBe(2);
      expect(component.hasRetrieved).toBeTrue();
      expect(component.isLoading).toBeFalse();
    }));


  });

  describe('Search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';
      component.hasRetrieved = true;
    }));





    it('should not filter by non-source columns', fakeAsync(() => {
      component.retrieve();
      tick();

      component.onSearch('CONTY');
      expect(component.dataSource.length).toBe(0);
    }));
  });

  describe('Clear All', () => {
    it('should reset all state on clear', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';
      component.dataSource = mockData;
      component.hasRetrieved = true;

      component.clearAll();

      expect(component.selectedSourceId).toBe('');
      expect(component.selectedTargetId).toBe('');
      expect(component.dataSource.length).toBe(0);
      expect(component.totalCount).toBe(0);
      expect(component.hasRetrieved).toBeFalse();
      expect(component.isEditOrAddMode).toBeFalse();
    }));
  });

  describe('Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should enter edit mode', () => {
      component.enterEditMode();

      expect(component.isEditOrAddMode).toBeTrue();
      expect(component.editableRows.length).toBe(2);
    });

    it('should cancel edit mode', () => {
      component.enterEditMode();
      component.cancelEdit();

      expect(component.isEditOrAddMode).toBeFalse();
      expect(component.editableRows.length).toBe(0);
    });







    it('should exit edit mode on retrieve', fakeAsync(() => {
      component.enterEditMode();
      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';

      component.retrieve();
      tick();

      expect(component.isEditOrAddMode).toBeFalse();
    }));
  });

  describe('Date Formatting', () => {
    it('should format ISO date correctly', () => {
      expect(component.formatDate('2025-01-11T00:00:00')).toBe('11-JAN-2025');
    });

    it('should format YYYY-MM-DD date correctly', () => {
      expect(component.formatDate('2025-01-11')).toBe('11-JAN-2025');
    });




  });

  describe('Date Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));







    it('should return today as termination min date when effDate is in the past', () => {
      component.enterEditMode();
      const form = component.editableRows[0];
      form.get('effDate')?.setValue(moment('2020-01-01'));

      const termMin = component.getTerminationMinDate(form);
      const expectedToday = DateFieldValidationUtility.getMinDate(headerServiceSpy.chapterTimeZone());
      expect(termMin).toBeTruthy();
      expect(termMin!.format('YYYY-MM-DD')).toBe(expectedToday.format('YYYY-MM-DD'));
    });

    it('should return effDate as termination min date when effDate is in the future', () => {
      component.enterEditMode();
      const form = component.editableRows[0];
      const futureDate = moment().add(30, 'days').startOf('day');
      form.get('effDate')?.setValue(futureDate);

      const termMin = component.getTerminationMinDate(form);
      expect(termMin).toBeTruthy();
      expect(termMin!.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    });


  });

  describe('Chapter Changes', () => {
    it('should reset and reload on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';
      component.dataSource = mockData;
      component.hasRetrieved = true;

      chapterChanged$.next();
      tick();

      expect(component.selectedSourceId).toBe('DRM');
      expect(component.selectedTargetId).toBe('LFTRK');
      expect(component.dataSource.length).toBe(2);
      expect(component.hasRetrieved).toBeTrue();
    }));
  });

  describe('ConvProcCall Conditional Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should make convProcCall required when target code type is PROC', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      component.onTargetTypeChange('PROC', newRow);
      tick();

      const convProcCtrl = newRow.form.get('convProcCall');
      convProcCtrl?.setValue(null);
      convProcCtrl?.markAsTouched();
      expect(convProcCtrl?.hasError('required')).toBeTrue();
    }));

    it('should not require convProcCall when target code type is not PROC', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      component.onTargetTypeChange('DRVTY', newRow);
      tick();

      const convProcCtrl = newRow.form.get('convProcCall');
      convProcCtrl?.setValue(null);
      convProcCtrl?.markAsTouched();
      expect(convProcCtrl?.hasError('required')).toBeFalse();
    }));

    it('should reject negative convProcCall when target code type is PROC', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      component.onTargetTypeChange('PROC', newRow);
      tick();

      const convProcCtrl = newRow.form.get('convProcCall');
      convProcCtrl?.setValue('-1');
      expect(convProcCtrl?.hasError('pattern')).toBeTrue();
    }));

    it('should clear convProcCall required when switching from PROC to another type', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      component.onTargetTypeChange('PROC', newRow);
      tick();

      component.onTargetTypeChange('DRVTY', newRow);
      tick();

      const convProcCtrl = newRow.form.get('convProcCall');
      convProcCtrl?.setValue(null);
      convProcCtrl?.markAsTouched();
      expect(convProcCtrl?.hasError('required')).toBeFalse();
    }));



    it('should load target value options when target type changes', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      component.onTargetTypeChange('DRVTY', newRow);
      tick();

      expect(serviceSpy.getTargetValueLookups).toHaveBeenCalledWith('DRVTY');
      expect(newRow.targetValueOptions.length).toBe(3);
      expect(newRow.targetValueOptions[0].code).toBe('WHOLE');
    }));


  });

  describe('Edit Mode - Existing Row Target Value Loading', () => {
    it('should load target value options for existing rows on edit mode entry', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [{
        ...mockData[0],
        targetCodeType: 'DRVTY'
      }];

      component.enterEditMode();
      tick();

      expect(serviceSpy.getTargetValueLookups).toHaveBeenCalledWith('DRVTY');
    }));

    it('should set initial convProcCall validators for PROC rows in edit mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [{
        ...mockData[0],
        targetCodeType: 'PROC',
        convProcCall: 1
      }];

      component.enterEditMode();
      tick();

      const form = component.editableRows[0];
      const convProcCtrl = form.get('convProcCall');
      convProcCtrl?.setValue(null);
      convProcCtrl?.markAsTouched();
      expect(convProcCtrl?.hasError('required')).toBeTrue();
    }));
  });

  describe('Save - Payload and Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';
      component.dataSource = [...mockData];
    }));

    it('should skip pristine existing rows on save', fakeAsync(() => {
      component.enterEditMode();
      tick();

      component.saveAll();
      tick();

      expect(serviceSpy.update).not.toHaveBeenCalled();
      expect(component.isEditOrAddMode).toBeFalse();
    }));

    it('should only send update for dirty existing rows', fakeAsync(() => {
      component.enterEditMode();
      tick();

      const editMeta = component.editableRowsMeta[0];
      editMeta.targetValueOptions = [{ code: '123', description: 'Test' }];
      editMeta.filteredTargetValueOptions = [{ code: '123', description: 'Test' }];
      editMeta.form.get('sourceValue')?.markAsDirty();
      editMeta.form.markAsDirty();
      editMeta.form.get('sourceValue')?.setValue('CHANGED');
      editMeta.form.get('termDate')?.setValue(moment().add(1, 'year'));
      tick();

      component.saveAll();
      tick();

      expect(serviceSpy.update).toHaveBeenCalledTimes(1);
      const updateArgs = serviceSpy.update.calls.mostRecent().args;
      expect(updateArgs[0]).toBe(mockData[0].convRefId);
      expect(updateArgs[1].sourceValue).toBe('CHANGED');
    }));

    it('should format dates as YYYY-MM-DD in create payload', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      tick();

      const futureDate = moment().add(5, 'days');
      const farFutureDate = moment().add(1, 'year');

      const newRow = component.newRows[0];
      newRow.form.patchValue({
        sourceCodeType: 'DRVTY',
        sourceValue: 'TEST',
        targetCodeType: 'DRVTY',
        targetValue: 'WHOLE',
        effDate: futureDate,
        termDate: farFutureDate
      });
      newRow.form.markAsDirty();

      component.saveAll();
      tick();

      const createArgs = serviceSpy.create.calls.mostRecent().args[0];
      expect(createArgs.effDate).toBe(futureDate.format('YYYY-MM-DD'));
      expect(createArgs.termDate).toBe(farFutureDate.format('YYYY-MM-DD'));
      expect(createArgs.sourceId).toBe('DRM');
      expect(createArgs.targetId).toBe('LFTRK');
    }));

    it('should stay in edit mode and show error on save error', fakeAsync(() => {
      serviceSpy.create.and.returnValue(
        throwError(() => ({ error: { errorCode: '0319', errorResponse: { errorCode: '0319', error: 'Duplicate entry' } } }))
      );

      component.enterEditMode();
      component.addNewRow();
      tick();

      const newRow = component.newRows[0];
      newRow.form.patchValue({
        sourceCodeType: 'DRVTY',
        sourceValue: 'TEST',
        targetCodeType: 'DRVTY',
        targetValue: 'WHOLE',
        effDate: tomorrow.clone()
      });
      newRow.form.markAsDirty();

      component.saveAll();
      tick();

      expect(component.isSaving).toBeFalse();
      expect(component.isEditOrAddMode).toBeTrue();
    }));
  });

  describe('Date Input Blur Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should set parse error on invalid date input blur', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      const mockEvent = {
        target: { value: '99-XXX-9999' }
      } as unknown as Event;

      component.onDateInputBlur(mockEvent, newRow, 'effDate');

      expect(newRow.form.get('effDate')?.hasError('matDatepickerParse')).toBeTrue();
      expect(newRow.errors['effDate']).toBe('Invalid date format');
    }));

    it('should clear parse error on valid date input blur', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      const mockEvent = {
        target: { value: '15-JUN-2026' }
      } as unknown as Event;

      component.onDateInputBlur(mockEvent, newRow, 'effDate');

      expect(newRow.form.get('effDate')?.hasError('matDatepickerParse')).toBeFalsy();
    }));

    it('should handle empty date input on blur', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      const mockEvent = {
        target: { value: '' }
      } as unknown as Event;

      component.onDateInputBlur(mockEvent, newRow, 'termDate');

      expect(newRow.form.get('termDate')?.value).toBeNull();
    }));
  });



  describe('Terminated Record Save Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';
      component.dataSource = [{
        ...mockData[0],
        termDate: '2025-01-11T00:00:00'
      }];
    }));

    it('should show validation error when saving dirty row with past termDate', fakeAsync(() => {
      component.enterEditMode();
      tick();

      const meta = component.editableRowsMeta[0];
      meta.form.get('sourceValue')?.setValue('CHANGED');
      meta.form.get('sourceValue')?.markAsDirty();
      meta.form.markAsDirty();

      component.saveAll();
      tick();

      expect(component.showValidationError).toBeTrue();
      expect(serviceSpy.update).not.toHaveBeenCalled();
    }));

    it('should not block save when terminated row is not dirty', fakeAsync(() => {
      component.enterEditMode();
      tick();

      component.saveAll();
      tick();

      expect(component.showValidationError).toBeFalse();
      expect(component.isEditOrAddMode).toBeFalse();
    }));
  });

  describe('Validation State Tracking', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should set showValidationError to false initially', () => {
      expect(component.showValidationError).toBeFalse();
    });

    it('should set hasAnyDirtyForms when existing row is modified', fakeAsync(() => {
      component.enterEditMode();
      tick();

      component.editableRowsMeta[0].form.get('sourceValue')?.markAsDirty();
      component.editableRowsMeta[0].form.markAsDirty();
      component.editableRowsMeta[0].form.get('sourceValue')?.setValue('X');
      tick();

      expect(component.hasAnyDirtyForms).toBeTrue();
    }));

    it('should reset validation state on exitEditMode', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      newRow.form.get('sourceCodeType')?.markAsTouched();
      newRow.form.get('sourceCodeType')?.markAsDirty();

      component.exitEditMode();

      expect(component.showValidationError).toBeFalse();
      expect(component.hasAnyDirtyForms).toBeFalse();
      expect(component.hasAnyInvalidForms).toBeFalse();
      expect(component.isEditOrAddMode).toBeFalse();
    });
  });

  describe('Source Value Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should enforce maxLength of 20 on source value', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      const ctrl = newRow.form.get('sourceValue');
      ctrl?.setValue('123456789012345678901');
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });

    it('should allow 20 characters on source value', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      const ctrl = newRow.form.get('sourceValue');
      ctrl?.setValue('12345678901234567890');
      expect(ctrl?.hasError('maxlength')).toBeFalse();
    });
  });

  describe('Procedure Count Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should only allow digits in procedure count', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      const ctrl = newRow.form.get('convProcCall');
      ctrl?.setValue('abc');
      expect(ctrl?.hasError('pattern')).toBeTrue();
    });

    it('should allow valid digit values 0-999', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      const ctrl = newRow.form.get('convProcCall');
      ctrl?.setValue('999');
      expect(ctrl?.valid).toBeTrue();
    });

    it('should reject more than 3 digits via pattern', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      const ctrl = newRow.form.get('convProcCall');
      ctrl?.setValue('1000');
      expect(ctrl?.hasError('pattern')).toBeTrue();
    });




  });

  describe('Date Field Invalid Helper', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should show error on effective date when lastChanged is effective', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      const form = newRow.form;

      form.get('effDate')?.setValue(moment().add(10, 'days'));
      form.get('termDate')?.setValue(moment().add(5, 'days'));
      form.get('effDate')?.markAsTouched();

      const result = component.isDateFieldInvalid(form, 'effDate', 'effective');
      expect(result).toBeTrue();
    });

    it('should not show error on termDate when lastChanged is effective', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      const form = newRow.form;

      form.get('effDate')?.setValue(moment().add(10, 'days'));
      form.get('termDate')?.setValue(moment().add(5, 'days'));
      form.get('termDate')?.markAsTouched();

      const result = component.isDateFieldInvalid(form, 'termDate', 'effective');
      expect(result).toBeFalse();
    });
  });

  describe('Effective Date Min', () => {
    it('should return chapter-aware min date', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const minDate = component.getEffectiveDateMin();
      expect(minDate).toBeTruthy();
      expect(moment.isMoment(minDate)).toBeTrue();
    }));
  });



  describe('onDateChange sets lastChangedDateField', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should set lastChangedDateField to effective on effDate change', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      component.onDateChange(newRow, 'effDate');

      expect(newRow.lastChangedDateField).toBe('effective');
    });

    it('should set lastChangedDateField to termination on termDate change', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      component.onDateChange(newRow, 'termDate');

      expect(newRow.lastChangedDateField).toBe('termination');
    });
  });

  describe('onSort', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';
      component.retrieve();
      tick();
    }));

    it('should cycle from empty to A', () => {
      component.sortDirection = '';
      component.onSort();
      expect(component.sortDirection).toBe('A');
    });

    it('should cycle from A to D', () => {
      component.sortDirection = 'A';
      component.onSort();
      expect(component.sortDirection).toBe('D');
    });

    it('should cycle from D to empty', () => {
      component.sortDirection = 'D';
      component.onSort();
      expect(component.sortDirection).toBe('');
    });
  });

  describe('getSortIcon', () => {
    it('should return unfold_more when no sort', () => {
      component.sortDirection = '';
      expect(component.getSortIcon()).toBe('unfold_more');
    });

    it('should return arrow_upward for ascending', () => {
      component.sortDirection = 'A';
      expect(component.getSortIcon()).toBe('arrow_upward');
    });

    it('should return arrow_downward for descending', () => {
      component.sortDirection = 'D';
      expect(component.getSortIcon()).toBe('arrow_downward');
    });
  });

  describe('onDigitOnly', () => {
    it('should allow digit keys', () => {
      const event = { key: '5', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onDigitOnly(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit keys', () => {
      const event = { key: 'a', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onDigitOnly(event);
      expect((event as any).preventDefault).toHaveBeenCalled();
    });

    it('should prevent special character keys', () => {
      const event = { key: '.', preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onDigitOnly(event);
      expect((event as any).preventDefault).toHaveBeenCalled();
    });
  });

  describe('formatDate null and undefined', () => {
    it('should return dash for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });
  });

  describe('getFieldErrorTooltip', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should return empty string when control is valid', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('sourceCodeType')?.setValue('DRCAT');
      form.get('sourceCodeType')?.markAsTouched();
      expect(component.getFieldErrorTooltip(form, 'sourceCodeType', 'Source Code Type')).toBe('');
    });

    it('should return required message for empty required field', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('sourceCodeType')?.setValue('');
      form.get('sourceCodeType')?.markAsTouched();
      expect(component.getFieldErrorTooltip(form, 'sourceCodeType', 'Source Code Type')).toBe('Source Code Type is required');
    });

    it('should return invalidOption message', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const ctrl = form.get('targetValue');
      ctrl?.setValue('BAD');
      ctrl?.setErrors({ invalidOption: true });
      ctrl?.markAsTouched();
      expect(component.getFieldErrorTooltip(form, 'targetValue', 'Target Value')).toBe('Target Value has an invalid selection');
    });

    it('should return min error message', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const ctrl = form.get('convProcCall');
      ctrl?.setValue('-1');
      ctrl?.setErrors({ min: true });
      ctrl?.markAsTouched();
      expect(component.getFieldErrorTooltip(form, 'convProcCall', 'Procedure Count')).toBe('Procedure Count must be 0 or greater');
    });

    it('should return empty when control is not touched', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('sourceCodeType')?.setValue('');
      expect(component.getFieldErrorTooltip(form, 'sourceCodeType', 'Source Code Type')).toBe('');
    });
  });

  describe('getEffectiveDateTooltipMessage', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should return parse error message', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const ctrl = form.get('effDate');
      ctrl?.setErrors({ matDatepickerParse: true });
      ctrl?.markAsTouched();
      expect(component.getEffectiveDateTooltipMessage(form, null)).toBe('Effective Date is invalid');
    });

    it('should return past date error message', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const ctrl = form.get('effDate');
      ctrl?.setErrors({ effectiveDatePast: true });
      ctrl?.markAsTouched();
      expect(component.getEffectiveDateTooltipMessage(form, null)).toBe('Effective Date cannot be past date');
    });

    it('should return invalidDate error message', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const ctrl = form.get('effDate');
      ctrl?.setErrors({ invalidDate: true });
      ctrl?.markAsTouched();
      expect(component.getEffectiveDateTooltipMessage(form, null)).toBe('Effective Date is invalid');
    });

    it('should return range error when lastChanged is effective', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('effDate')?.setValue(moment().add(10, 'days'));
      form.get('effDate')?.markAsTouched();
      form.get('termDate')?.setValue(moment().add(5, 'days'));
      form.updateValueAndValidity();
      expect(component.getEffectiveDateTooltipMessage(form, 'effective')).toBe('Effective Date must be less than or equal to Termination Date');
    });

    it('should return optional hint when no value and no errors', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('effDate')?.setValue(null);
      expect(component.getEffectiveDateTooltipMessage(form, null)).toBe('Optional. Use format DD-MMM-YYYY (e.g., 12-MAR-2025)');
    });

    it('should return empty string when has value and no errors', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('effDate')?.setValue(moment().add(5, 'days'));
      expect(component.getEffectiveDateTooltipMessage(form, null)).toBe('');
    });
  });

  describe('getTerminationDateTooltipMessage', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should return parse error message', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const ctrl = form.get('termDate');
      ctrl?.setErrors({ matDatepickerParse: true });
      ctrl?.markAsTouched();
      expect(component.getTerminationDateTooltipMessage(form, null)).toBe('Termination Date is invalid');
    });

    it('should return past date error message', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const ctrl = form.get('termDate');
      ctrl?.setErrors({ terminationDatePast: true });
      ctrl?.markAsTouched();
      expect(component.getTerminationDateTooltipMessage(form, null)).toBe('Termination Date cannot be past date');
    });

    it('should return invalidDate error message', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const ctrl = form.get('termDate');
      ctrl?.setErrors({ invalidDate: true });
      ctrl?.markAsTouched();
      expect(component.getTerminationDateTooltipMessage(form, null)).toBe('Termination Date is invalid');
    });

    it('should return min error when lastChanged is termination', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const ctrl = form.get('termDate');
      ctrl?.setErrors({ matDatepickerMin: true });
      ctrl?.markAsTouched();
      expect(component.getTerminationDateTooltipMessage(form, 'termination')).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should return range error when lastChanged is termination', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('effDate')?.setValue(moment().add(10, 'days'));
      form.get('termDate')?.setValue(moment().add(5, 'days'));
      form.get('termDate')?.markAsTouched();
      form.updateValueAndValidity();
      expect(component.getTerminationDateTooltipMessage(form, 'termination')).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should return optional hint when no value and no errors', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('termDate')?.setValue(null);
      expect(component.getTerminationDateTooltipMessage(form, null)).toBe('Optional. Use format DD-MMM-YYYY (e.g., 12-MAR-2025)');
    });
  });

  describe('addNewRow and removeNewRow', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should add a new row entry with form and defaults', () => {
      component.enterEditMode();
      component.addNewRow();
      expect(component.newRows.length).toBe(1);
      expect(component.newRows[0].form).toBeTruthy();
      expect(component.newRows[0].lastChangedDateField).toBeNull();
      expect(component.newRows[0].targetValueOptions.length).toBe(0);
    });

    it('should add multiple new rows', () => {
      component.enterEditMode();
      component.addNewRow();
      component.addNewRow();
      expect(component.newRows.length).toBe(2);
    });

    it('should prepend new rows (unshift)', () => {
      component.enterEditMode();
      component.addNewRow();
      const firstRowId = component.newRows[0].id;
      component.addNewRow();
      expect(component.newRows[0].id).not.toBe(firstRowId);
    });

    it('should remove new row by index', () => {
      component.enterEditMode();
      component.addNewRow();
      component.addNewRow();
      const remainingId = component.newRows[1].id;
      component.removeNewRow(0);
      expect(component.newRows.length).toBe(1);
      expect(component.newRows[0].id).toBe(remainingId);
    });
  });

  describe('startEdit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should enter edit mode when called', () => {
      component.startEdit(0);
      expect(component.isEditOrAddMode).toBeTrue();
      expect(component.editableRows.length).toBe(2);
    });
  });

  describe('retrieve error path', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set hasError and stop loading on retrieve error', fakeAsync(() => {
      serviceSpy.getConversionCodes.and.returnValue(throwError(() => new Error('Server error')));
      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';

      component.retrieve();
      tick();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('loadLookups error path', () => {
    it('should handle lookup load error gracefully', fakeAsync(() => {
      serviceSpy.getSourceIdLookup.and.returnValue(throwError(() => new Error('Lookup error')));
      fixture.detectChanges();
      tick();

      expect(component.sourceIdOptions.length).toBe(0);
    }));
  });

  describe('applyClientSearch with sort and keyword', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';
      component.retrieve();
      tick();
    }));

    it('should sort ascending by sourceCodeType', () => {
      component.sortDirection = 'A';
      component.onSearch('');

      const types = component.dataSource.map(d => d.sourceCodeType);
      expect(types).toEqual(['DRCAT', 'DRVTY']);
    });

    it('should sort descending by sourceCodeType', () => {
      component.sortDirection = 'D';
      component.onSearch('');

      const types = component.dataSource.map(d => d.sourceCodeType);
      expect(types).toEqual(['DRVTY', 'DRCAT']);
    });

    it('should filter by keyword matching sourceCodeType', () => {
      component.onSearch('DRCAT');
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].sourceCodeType).toBe('DRCAT');
    });

    it('should filter by keyword matching sourceValue', () => {
      component.onSearch('DRIVE1');
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].sourceValue).toBe('DRIVE1');
    });

    it('should update totalCount after filtering', () => {
      component.onSearch('DRCAT');
      expect(component.totalCount).toBe(1);
    });
  });

  describe('getTerminationMinDate with no effDate', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should return today when effDate is null', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('effDate')?.setValue(null);

      const result = component.getTerminationMinDate(form);
      const today = DateFieldValidationUtility.getMinDate(headerServiceSpy.chapterTimeZone());
      expect(result).toBeTruthy();
      expect(result!.format('YYYY-MM-DD')).toBe(today.format('YYYY-MM-DD'));
    });
  });

  describe('onEffectiveDateInput and onTerminationDateInput', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should set lastChangedDateField to effective on long enough input', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      const event = { target: { value: '15-JUN-2026' } } as unknown as Event;
      component.onEffectiveDateInput(event, newRow);

      expect(newRow.lastChangedDateField).toBe('effective');
    });

    it('should not set lastChangedDateField for short input', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      const event = { target: { value: '15' } } as unknown as Event;
      component.onEffectiveDateInput(event, newRow);

      expect(newRow.lastChangedDateField).toBeNull();
    });

    it('should set lastChangedDateField to termination on termination date input', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      const event = { target: { value: '15-JUN-2026' } } as unknown as Event;
      component.onTerminationDateInput(event, newRow, false);

      expect(newRow.lastChangedDateField).toBe('termination');
    });

    it('should handle termination date input in edit mode', () => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];

      const event = { target: { value: '15-JUN-2026' } } as unknown as Event;
      component.onTerminationDateInput(event, newRow, true);

      expect(newRow.lastChangedDateField).toBe('termination');
    });
  });

  describe('hasAnyDirtyForms and hasAnyInvalidForms with new rows', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should detect dirty new rows', () => {
      component.enterEditMode();
      component.addNewRow();
      component.newRows[0].form.get('sourceCodeType')?.markAsDirty();
      component.newRows[0].form.get('sourceCodeType')?.setValue('TEST');
      expect(component.hasAnyDirtyForms).toBeTrue();
    });

    it('should detect touched new rows as dirty', () => {
      component.enterEditMode();
      component.addNewRow();
      component.newRows[0].form.get('sourceCodeType')?.markAsTouched();
      expect(component.hasAnyDirtyForms).toBeTrue();
    });

    it('should detect invalid touched new rows', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('sourceCodeType')?.setValue('');
      form.markAsTouched();
      form.get('sourceCodeType')?.markAsTouched();
      expect(component.hasAnyInvalidForms).toBeTrue();
    });

    it('should not flag untouched new rows as invalid', () => {
      component.enterEditMode();
      component.addNewRow();
      expect(component.hasAnyInvalidForms).toBeFalse();
    });
  });

  describe('showValidationError with new rows', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.dataSource = [...mockData];
    }));

    it('should show validation error for dirty invalid new row', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('sourceCodeType')?.setValue('');
      form.get('sourceCodeType')?.markAsDirty();
      form.markAsDirty();
      expect(component.showValidationError).toBeTrue();
    });

    it('should not show validation error for untouched new row', () => {
      component.enterEditMode();
      component.addNewRow();
      expect(component.showValidationError).toBeFalse();
    });
  });

  describe('saveAll with new rows created', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedSourceId = 'DRM';
      component.selectedTargetId = 'LFTRK';
      component.dataSource = [...mockData];
    }));

    it('should call create for dirty new rows on save', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      tick();

      const newRow = component.newRows[0];
      newRow.form.patchValue({
        sourceCodeType: 'DRCAT',
        sourceValue: 'NEWVAL',
        targetCodeType: 'CONTY',
        targetValue: '123',
        effDate: moment().add(5, 'days'),
        termDate: moment().add(1, 'year')
      });
      newRow.form.markAsDirty();

      component.saveAll();
      tick();

      expect(serviceSpy.create).toHaveBeenCalledTimes(1);
    }));

    it('should not submit untouched new rows', fakeAsync(() => {
      serviceSpy.create.calls.reset();
      component.enterEditMode();
      component.addNewRow();
      tick();

      component.saveAll();
      tick();

      expect(serviceSpy.create).not.toHaveBeenCalled();
    }));

    it('should exit edit mode and show success on successful save', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      tick();

      const newRow = component.newRows[0];
      newRow.form.patchValue({
        sourceCodeType: 'DRCAT',
        sourceValue: 'NEWVAL',
        targetCodeType: 'CONTY',
        targetValue: '123'
      });
      newRow.form.markAsDirty();

      component.saveAll();
      tick();

      expect(component.isSaving).toBeFalse();
    }));
  });
});
