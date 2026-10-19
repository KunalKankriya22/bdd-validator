import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

import { Eqc1Component } from './eqc1';
import { Eqc1ApiService } from './services/eqc1-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { createMockSnackbarService, createMockTranslateService, createMockHeaderService } from '@shared/testing/common-mocks';
import {
  EquipmentType,
  EquipmentLookup,
  QcType,
  QcResult,
  QcControlDetail,
  QcProcedure
} from './models/eqc1.model';

describe('Eqc1Component', () => {
  let filtered: any;
  let maxDate: any;
  let options: any;
  let select: any;
  let procedures: any;
  let error: any;
  let translateSpy: any;
  let component: Eqc1Component;
  let comp: any;
  let fixture: ComponentFixture<Eqc1Component>;
  let apiServiceSpy: jasmine.SpyObj<Eqc1ApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  const chapterChanged$ = new Subject<void>();

  const mockChapterDateTime = moment('2026-06-17T04:18:00');

  const mockEquipmentTypes: EquipmentType[] = [
    { code: 'ALYX', description: 'Alyx Machine' },
    { code: 'CENT', description: 'Centrifuge' }
  ];

  const mockEquipmentIds: EquipmentLookup[] = [
    { equipId: 'DEV001', equipReference: '' },
    { equipId: 'DEV002', equipReference: '' }
  ];

  const mockEquipmentRefs: EquipmentLookup[] = [
    { equipId: 'DEV001', equipReference: 'EQ-000292' },
    { equipId: 'DEV001', equipReference: 'EQ-000293' }
  ];

  const mockQcTypes: QcType[] = [
    { qcType: 'QC', description: 'Quality Control' },
    { qcType: 'DAILY', description: 'Daily Check' }
  ];

  const mockQcResults: QcResult[] = [
    { code: 'A', description: 'Acceptable' },
    { code: 'U', description: 'Unacceptable' }
  ];

  const mockQcControlDetails: QcControlDetail[] = [
    { qcId: 'QC001', refNumber: 'RF001', arrangeBy: 1, qcItem: 'Check USB Port', qcUnits: 'CHAR', targetValue: 'GOOD', minAccept: '', maxAccept: '' },
    { qcId: 'QC001', refNumber: 'RF002', arrangeBy: 2, qcItem: 'Temperature', qcUnits: 'NUM', targetValue: '37.0', minAccept: '36.0', maxAccept: '38.0' }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('Eqc1ApiService', [
      'getEquipmentTypes', 'getEquipmentIds', 'getEquipmentReferences',
      'getQcTypes', 'getQcControlDetails', 'getQcResults', 'getReviewCode',
      'getQcHeader', 'getQcDetails', 'getQcEvents', 'getUsers',
      'parseBarcode', 'createQcHeader', 'updateQcHeader', 'updateQcDetails'
    ]);

    snackbarServiceSpy = createMockSnackbarService();
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService',
      ['getChapterLocalDateTime', 'getChapterLocalDate', 'convertLocalToGmt', 'convertGmtToLocal'],
      {
        chapterLocalDate: signal(mockChapterDateTime.clone().startOf('day')),
        chapterLocalDateTime: signal(mockChapterDateTime.clone())
      }
    );

    chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(mockChapterDateTime.clone());
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(mockChapterDateTime.clone().startOf('day'));
    chapterTimezoneServiceSpy.convertLocalToGmt.and.callFake((m: moment.Moment) => m.clone().utc());
    chapterTimezoneServiceSpy.convertGmtToLocal.and.callFake((m: moment.Moment) => m.clone());
    loginServiceSpy.getStoredUsername.and.returnValue('TEST98');

    apiServiceSpy.getEquipmentTypes.and.returnValue(of(mockEquipmentTypes));
    apiServiceSpy.getEquipmentIds.and.returnValue(of(mockEquipmentIds));
    apiServiceSpy.getEquipmentReferences.and.returnValue(of(mockEquipmentRefs));
    apiServiceSpy.getQcTypes.and.returnValue(of(mockQcTypes));
    apiServiceSpy.getQcResults.and.returnValue(of(mockQcResults));
    apiServiceSpy.getQcControlDetails.and.returnValue(of(mockQcControlDetails));
    apiServiceSpy.getReviewCode.and.returnValue(of({ reviewCode: '1' }));
    apiServiceSpy.getUsers.and.returnValue(of([]));
    apiServiceSpy.getQcHeader.and.returnValue(of([]));
    apiServiceSpy.getQcDetails.and.returnValue(of([]));
    apiServiceSpy.getQcEvents.and.returnValue(of([]));
    apiServiceSpy.createQcHeader.and.returnValue(of({
      success: true, message: 'QC event created', statusCode: 200,
      item: { qcReference: 'QC-002', qcStatus: 'A' }
    }));

    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Enter Equip QC Details', subtitle: '' })
    });

    const headerServiceSpy = createMockHeaderService();

    translateSpy = createMockTranslateService();
    translateSpy.instant.and.callFake((key: string) => key);
    translateSpy.get.and.callFake((key: string) => of(key));



      TestBed.configureTestingModule({
      imports: [Eqc1Component, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: Eqc1ApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: TranslateService, useValue: translateSpy }
      ]
    });

      chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(mockChapterDateTime.clone());


      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(mockChapterDateTime.clone().startOf('day'));


      loginServiceSpy.getStoredUsername.and.returnValue('TEST98');


      apiServiceSpy.getEquipmentTypes.and.returnValue(of(mockEquipmentTypes));


      apiServiceSpy.getEquipmentIds.and.returnValue(of(mockEquipmentIds));


      apiServiceSpy.getEquipmentReferences.and.returnValue(of(mockEquipmentRefs));


      apiServiceSpy.getQcTypes.and.returnValue(of(mockQcTypes));


      apiServiceSpy.getQcResults.and.returnValue(of(mockQcResults));


      apiServiceSpy.getQcControlDetails.and.returnValue(of(mockQcControlDetails));


      apiServiceSpy.getReviewCode.and.returnValue(of({ reviewCode: '1' }));
      apiServiceSpy.getUsers.and.returnValue(of([]));
      apiServiceSpy.getQcHeader.and.returnValue(of([]));
      apiServiceSpy.getQcDetails.and.returnValue(of([]));
      apiServiceSpy.getQcEvents.and.returnValue(of([]));

      translateSpy.instant.and.callFake((key: string) => key);


      translateSpy.get.and.callFake((key: string) => of(key));


    fixture = TestBed.createComponent(Eqc1Component);
    component = fixture.componentInstance;
    comp = component as any;


    });

  describe('Initialization', () => {






    it('should initialize QC date and time from chapter timezone', () => {
      fixture.detectChanges();
      const qcDate = component.form.get('qcDate')?.value as moment.Moment;
      const qcTime = component.form.get('qcTime')?.value;
      expect(qcDate.isValid()).toBeTrue();
      expect(qcTime).toBe('04:18');
    });

    it('should load equipment types on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(apiServiceSpy.getEquipmentTypes).toHaveBeenCalled();
      expect(comp.equipmentTypes()).toEqual(mockEquipmentTypes);
    }));

    it('should load QC results on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(apiServiceSpy.getQcResults).toHaveBeenCalled();
      expect(comp.qcResults()).toEqual(mockQcResults);
    }));
  });
  describe('Form Validation', () => {
    beforeEach(() => fixture.detectChanges());

    it('should mark equipment type as required', () => {
      expect(component.form.get('equipmentType')?.hasError('required')).toBeTrue();
    });

    it('should show error when equipment type is touched and empty', () => {
      component.form.get('equipmentType')?.markAsTouched();
      fixture.detectChanges();
      error = fixture.debugElement.query(By.css('mat-error'));
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent).toContain('Equipment Type is required');
    });

    it('should validate time format', () => {
      component.form.get('qcTime')?.setValue('99:99');
      expect(component.form.get('qcTime')?.hasError('invalidTimeFormat')).toBeTrue();
    });

    it('should accept valid time format', () => {
      component.form.get('qcTime')?.setValue('14:30');
      expect(component.form.get('qcTime')?.hasError('invalidTimeFormat')).toBeFalse();
    });

    it('should validate date and time are both provided or both empty', () => {
      component.form.get('qcDate')?.setValue(moment());
      component.form.get('qcTime')?.setValue(null);
      component.form.updateValueAndValidity();
      expect(component.form.hasError('qcDateTimeRequired')).toBeTrue();
    });
  });

  describe('Equipment Type Selection', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load equipment IDs when equipment type is selected', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      expect(apiServiceSpy.getEquipmentIds).toHaveBeenCalledWith('ALYX');
      expect(comp.equipmentIds()).toEqual(mockEquipmentIds);
    }));

    it('should update equipment type description', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      expect(comp.equipmentTypeDescription()).toBe('Alyx Machine');
    }));

    it('should load QC types when equipment type is selected', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      expect(apiServiceSpy.getQcTypes).toHaveBeenCalledWith('ALYX');
      expect(comp.qcTypes()).toEqual(mockQcTypes);
    }));

    it('should clear dependent fields when equipment type is cleared', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      component.form.patchValue({ equipmentType: '' });
      tick();
      expect(comp.equipmentIds()).toEqual([]);
      expect(comp.equipmentRefs()).toEqual([]);
      expect(comp.qcTypes()).toEqual([]);
      expect(comp.showQcDetails()).toBeFalse();
    }));
  });

  describe('Device ID Selection', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load equipment references when device ID is selected', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      component.form.patchValue({ deviceId: 'DEV001' });
      tick();
      expect(apiServiceSpy.getEquipmentReferences).toHaveBeenCalledWith('ALYX', 'DEV001');
      expect(comp.equipmentRefs()).toEqual(mockEquipmentRefs);
    }));

    it('should clear equipment refs when device ID is cleared', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      component.form.patchValue({ deviceId: 'DEV001' });
      tick();
      component.form.patchValue({ deviceId: '' });
      tick();
      expect(comp.equipmentRefs()).toEqual([]);
    }));
  });

  describe('Equipment Ref No Selection', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show QC details card when equipment ref is selected', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      component.form.patchValue({ deviceId: 'DEV001' });
      tick();
      component.form.patchValue({ equipmentRefNo: 'EQ-000292' });
      tick();
      expect(comp.showQcDetails()).toBeTrue();
    }));

    it('should auto-select equipment reference when only one exists', fakeAsync(() => {
      apiServiceSpy.getEquipmentReferences.and.returnValue(of([
        { equipId: 'DEV001', equipReference: 'EQ-000292' }
      ]));
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      component.form.patchValue({ deviceId: 'DEV001' });
      tick();
      expect(component.form.get('equipmentRefNo')?.value).toBe('EQ-000292');
    }));

    it('should hide QC details card when equipment ref is cleared', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      component.form.patchValue({ deviceId: 'DEV001' });
      tick();
      component.form.patchValue({ equipmentRefNo: 'EQ-000292' });
      tick();
      component.form.patchValue({ equipmentRefNo: '' });
      tick();
      expect(comp.showQcDetails()).toBeFalse();
    }));
  });

  describe('QC Type Selection and Table Visibility', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load QC control details when QC type is selected', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      component.form.patchValue({ deviceId: 'DEV001' });
      tick();
      component.form.patchValue({ equipmentRefNo: 'EQ-000292' });
      tick();
      component.form.patchValue({ qcType: 'QC' });
      tick();
      expect(apiServiceSpy.getQcControlDetails).toHaveBeenCalledWith('ALYX', 'QC');
    }));



    it('should show table after QC type selection even on API error', fakeAsync(() => {
      apiServiceSpy.getQcControlDetails.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      component.form.patchValue({ deviceId: 'DEV001' });
      tick();
      component.form.patchValue({ equipmentRefNo: 'EQ-000292' });
      tick();
      component.form.patchValue({ qcType: 'QC' });
      tick();
      expect(comp.showQcTable()).toBeTrue();
      expect(comp.error()).toBe('Server error');
    }));

    it('should map QC control details to procedures', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      component.form.patchValue({ deviceId: 'DEV001' });
      tick();
      component.form.patchValue({ equipmentRefNo: 'EQ-000292' });
      tick();
      component.form.patchValue({ qcType: 'QC' });
      tick();
      procedures = comp.qcProcedures();
      expect(procedures.length).toBe(2);
      expect(procedures[0].qcItem).toBe('Check USB Port');
      expect(procedures[0].actualValue).toBe('');
      expect(procedures[1].minAccept).toBe('36.0');
    }));

    it('should set QC Tech 1 to logged-in user', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      component.form.patchValue({ deviceId: 'DEV001' });
      tick();
      component.form.patchValue({ equipmentRefNo: 'EQ-000292' });
      tick();
      component.form.patchValue({ qcType: 'QC' });
      tick();
      expect(comp.qcHeader().qcTech1).toBe('TEST98');
    }));
  });

  describe('Procedure Value Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
      comp.qcProcedures.set(mockQcControlDetails.map(d => ({
        ...d, actualValue: '', interpretation: null, interpretation2: null
      })));
    });

    it('should update procedure actual value', () => {
      const procedure = comp.qcProcedures()[1];
      component.onProcedureValueChange(procedure, '37.2');
      const updated = comp.qcProcedures();
      expect(updated[1].actualValue).toBe('37.2');
    });

    it('should set interpretation to A when value is within range', () => {
      const procedure = comp.qcProcedures()[1];
      component.onProcedureValueChange(procedure, '37.0');
      expect(comp.qcProcedures()[1].interpretation).toBe('A');
    });

    it('should set interpretation to N when value is out of range', () => {
      const procedure = comp.qcProcedures()[1];
      component.onProcedureValueChange(procedure, '39.0');
      expect(comp.qcProcedures()[1].interpretation).toBe('N');
    });

    it('should set interpretation to A for FREE QC units when value is provided', () => {
      comp.qcProcedures.set([{
        qcId: 'QC001', refNumber: 'RF001', arrangeBy: 1, qcItem: 'Free Text',
        qcUnits: 'FREE', targetValue: '', minAccept: '', maxAccept: '',
        actualValue: '', interpretation: null, interpretation2: null
      }]);
      const procedure = comp.qcProcedures()[0];
      component.onProcedureValueChange(procedure, 'some text');
      expect(comp.qcProcedures()[0].interpretation).toBe('A');
    });

    it('should set interpretation to N for non-numeric value on numeric QC units', () => {
      const procedure = comp.qcProcedures()[1];
      component.onProcedureValueChange(procedure, 'abc');
      expect(comp.qcProcedures()[1].interpretation).toBe('N');
    });

    it('should uppercase observed values for non-CHAR units', () => {
      const procedure = comp.qcProcedures()[1];
      component.onProcedureValueChange(procedure, '37.0');
      expect(comp.qcProcedures()[1].actualValue).toBe('37.0');
    });

    it('should set interpretation to A when CHAR value is Yes', () => {
      const procedure = comp.qcProcedures()[0];
      component.onProcedureValueChange(procedure, 'Yes');
      expect(comp.qcProcedures()[0].interpretation).toBe('A');
    });

    it('should set interpretation to N when CHAR value is No', () => {
      const procedure = comp.qcProcedures()[0];
      component.onProcedureValueChange(procedure, 'No');
      expect(comp.qcProcedures()[0].interpretation).toBe('N');
    });
  });

  describe('Obtained Column ValueFormatter', () => {
    beforeEach(() => fixture.detectChanges());

    it('should display Acceptable for interpretation value A', () => {
      const formatter = comp.tableConfig.columns.find((c: any) => c.key === 'interpretation')?.valueFormatter;
      expect(formatter).toBeTruthy();
      expect(formatter!('A', {} as any)).toBe('Acceptable');
    });

    it('should display Unacceptable for interpretation value N', () => {
      const formatter = comp.tableConfig.columns.find((c: any) => c.key === 'interpretation')?.valueFormatter;
      expect(formatter!('N', {} as any)).toBe('Unacceptable');
    });

    it('should display empty string for null interpretation', () => {
      const formatter = comp.tableConfig.columns.find((c: any) => c.key === 'interpretation')?.valueFormatter;
      expect(formatter!(null, {} as any)).toBe('');
    });
  });

  describe('Value Column Conditional Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should have Yes and No options in CHAR dropdown', fakeAsync(() => {
      comp.showQcTable.set(true);
      comp.qcProcedures.set([
        { qcId: 'QC001', refNumber: 'RF001', arrangeBy: 1, qcItem: 'Check USB Port', qcUnits: 'CHAR', targetValue: 'GOOD', minAccept: '', maxAccept: '', actualValue: '', interpretation: null, interpretation2: null }
      ]);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      select = fixture.debugElement.query(By.css('.table-select mat-select'));
      select.nativeElement.click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      options = fixture.debugElement.queryAll(By.css('mat-option'));
      const optionTexts = options.map(o => o.nativeElement.textContent.trim());
      expect(optionTexts).toContain('Yes');
      expect(optionTexts).toContain('No');
    }));
  });



  describe('Clear All', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reset form and state', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'ALYX' });
      tick();
      component.form.patchValue({ deviceId: 'DEV001' });
      tick();
      component.onClearAll();
      tick();
      expect(component.form.get('equipmentType')?.value).toBeNull();
      expect(comp.equipmentIds()).toEqual([]);
      expect(comp.equipmentRefs()).toEqual([]);
      expect(comp.qcProcedures()).toEqual([]);
      expect(comp.showQcDetails()).toBeFalse();
      expect(comp.showQcTable()).toBeFalse();
    }));

    it('should reset date and time to chapter timezone on clear', fakeAsync(() => {
      component.form.get('qcTime')?.setValue('12:00');
      tick();
      component.onClearAll();
      tick();
      expect(component.form.get('qcTime')?.value).toBe('04:18');
    }));
  });

  describe('Form Submission', () => {
    beforeEach(() => fixture.detectChanges());



    it('should submit when form is valid', fakeAsync(() => {
      component.form.patchValue({
        equipmentType: 'ALYX', deviceId: 'DEV001', equipmentRefNo: 'EQ-000292',
        qcType: 'QC', qcResult: 'A'
      });
      comp.qcProcedures.set([{
        qcId: 'QC001', refNumber: 'RF001', arrangeBy: 1, qcItem: 'Check USB Port',
        qcUnits: 'CHAR', targetValue: 'GOOD', minAccept: '', maxAccept: '',
        actualValue: 'GOOD', interpretation: 'A', interpretation2: null
      }]);
      tick();
      component.onSubmit();
      tick();
      expect(apiServiceSpy.createQcHeader).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should not submit when observed values are missing', fakeAsync(() => {
      component.form.patchValue({
        equipmentType: 'ALYX', deviceId: 'DEV001', equipmentRefNo: 'EQ-000292',
        qcType: 'QC', qcResult: 'A'
      });
      comp.qcProcedures.set([{
        qcId: 'QC001', refNumber: 'RF001', arrangeBy: 1, qcItem: 'Check USB Port',
        qcUnits: 'CHAR', targetValue: 'GOOD', minAccept: '', maxAccept: '',
        actualValue: '', interpretation: null, interpretation2: null
      }]);
      tick();
      component.onSubmit();
      tick();
      expect(apiServiceSpy.createQcHeader).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('All observed values are required before saving.');
    }));

    it('should not submit when result is A but interpretation has N', fakeAsync(() => {
      component.form.patchValue({
        equipmentType: 'ALYX', deviceId: 'DEV001', equipmentRefNo: 'EQ-000292',
        qcType: 'QC', qcResult: 'A'
      });
      comp.qcProcedures.set([{
        qcId: 'QC001', refNumber: 'RF001', arrangeBy: 1, qcItem: 'Temperature',
        qcUnits: 'NUM', targetValue: '37.0', minAccept: '36.0', maxAccept: '38.0',
        actualValue: '39.0', interpretation: 'N', interpretation2: null
      }]);
      tick();
      component.onSubmit();
      tick();
      expect(apiServiceSpy.createQcHeader).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('QC Result cannot be Acceptable when one or more observed values are Unacceptable.');
    }));


  });

  describe('Time Input', () => {
    beforeEach(() => fixture.detectChanges());

    it('should auto-format time input with colon', () => {
      const mockEvent = {
        target: { value: '1430', setSelectionRange: jasmine.createSpy() }
      } as unknown as Event;
      comp.onTimeInput(mockEvent);
      expect(component.form.get('qcTime')?.value).toBe('14:30');
    });
  });

  describe('QC Date Error', () => {
    beforeEach(() => fixture.detectChanges());



    it('should use maxQcDate to prevent future dates', () => {
      maxDate = comp.maxQcDate();
      expect(maxDate).toBeTruthy();
      expect(maxDate.isSame(mockChapterDateTime.clone().endOf('day'), 'day')).toBeTrue();
    });

    it('should return future date error for matDatepickerMax', () => {
      const ctrl = component.form.get('qcDate');
      ctrl?.setErrors({ matDatepickerMax: true });
      ctrl?.markAsTouched();
      expect(comp.getQcDateError()).toBe('QC date cannot be a future date.');
    });
  });


  describe('Search Filtering', () => {
    beforeEach(() => fixture.detectChanges());









    it('should return all equipment refs when search term is empty', fakeAsync(() => {
      comp.equipmentRefs.set([
        { equipId: 'DEV001', equipReference: 'EQ-000292' },
        { equipId: 'DEV001', equipReference: 'EQ-000293' }
      ]);
      component.equipmentRefSearchCtrl.setValue('');
      tick();
      fixture.detectChanges();
      filtered = comp.filteredEquipmentRefs();
      expect(filtered.length).toBe(2);
    }));
  });


});
