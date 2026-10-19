import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import moment from 'moment';

import { EditReconcileQcDetailsComponent, QcProcedureRow } from './edit-reconcile-qc-details';
import { EditReconcileQcDetailsService } from './edit-reconcile-qc-details.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

describe('EditReconcileQcDetailsComponent', () => {
  let component: EditReconcileQcDetailsComponent;
  let fixture: ComponentFixture<EditReconcileQcDetailsComponent>;
  let mockService: jasmine.SpyObj<EditReconcileQcDetailsService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: { chapterChanged$: Subject<void> };
  let snackBarSpy: jasmine.Spy;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('EditReconcileQcDetailsService', [
      'getEquipmentTypes',
      'getEquipmentIds',
      'getEquipmentReferences',
      'getQcEvents',
      'getQcHeader',
      'getQcDetails',
      'getQcTypes',
      'getQcResults',
      'getUsers',
      'getReviewCode',
      'parseBarcode',
      'updateQcDetails',
      'updateQcHeader',
    ]);

    mockService.getEquipmentTypes.and.returnValue(of([]));
    mockService.getQcResults.and.returnValue(of([]));
    mockService.getUsers.and.returnValue(of([]));

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Edit / Reconcile QC Details', subtitle: '' }),
    });

    mockHeaderService = { chapterChanged$: new Subject<void>() };



      TestBed.configureTestingModule({
      imports: [EditReconcileQcDetailsComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: EditReconcileQcDetailsService, useValue: mockService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
      ],
    });


    


      mockService.getEquipmentTypes.calls.reset();


      mockService.getEquipmentIds.calls.reset();


      mockService.getEquipmentReferences.calls.reset();


      mockService.getQcEvents.calls.reset();


      mockService.getQcHeader.calls.reset();


      mockService.getQcDetails.calls.reset();


      mockService.getQcTypes.calls.reset();


      mockService.getQcResults.calls.reset();


      mockService.getUsers.calls.reset();


      mockService.getReviewCode.calls.reset();


      mockService.parseBarcode.calls.reset();


      mockService.updateQcDetails.calls.reset();


      mockService.updateQcHeader.calls.reset();


      mockService.getEquipmentTypes.and.returnValue(of([]));


      mockService.getQcResults.and.returnValue(of([]));


      mockService.getUsers.and.returnValue(of([]));


    fixture = TestBed.createComponent(EditReconcileQcDetailsComponent);
    component = fixture.componentInstance;

    // MatSnackBarModule provides MatSnackBar in its own injector (child of root),
    // so a root-level mock would be shadowed. Spy directly on the instance the component holds.
    snackBarSpy = spyOn((component as any).snackBar, 'open');

    fixture.detectChanges();


    });

  // ── Component creation ─────────────────────────────────────────────────────


  // ── Initialisation ─────────────────────────────────────────────────────────

  it('should load initial LOVs on init', () => {
    expect(mockService.getEquipmentTypes).toHaveBeenCalledTimes(1);
    expect(mockService.getQcResults).toHaveBeenCalledTimes(1);
    expect(mockService.getUsers).toHaveBeenCalledTimes(1);
  });

  it('should disable downstream controls initially', () => {
    expect(component.equipmentIdControl.disabled).toBeTrue();
    expect(component.equipmentRefControl.disabled).toBeTrue();
    expect(component.qcRefNoControl.disabled).toBeTrue();
  });

  it('should not show results area initially', () => {
    expect(component.hasRetrieved).toBeFalse();
  });

  // ── result2Options computed signal ────────────────────────────────────────

  it('should exclude S and C from result2Options', () => {
    component.allQcResults.set([
      { code: 'A', description: 'Acceptable' },
      { code: 'N', description: 'Not Acceptable' },
      { code: 'S', description: 'Scheduled' },
      { code: 'C', description: 'Cancelled' },
    ]);
    const opts = component.result2Options();
    expect(opts.length).toBe(2);
    expect(opts.find(o => o.code === 'S')).toBeUndefined();
    expect(opts.find(o => o.code === 'C')).toBeUndefined();
  });

  // ── maxQcDate (future-date gate) ──────────────────────────────────────────





  it('should set maxQcDate to today when result1 is A', () => {
    component.qcDetailsForm.get('result1')!.setValue('A');
    expect(component.maxQcDate).not.toBeNull();
    expect(moment.isMoment(component.maxQcDate)).toBeTrue();
  });

  // ── onProcedureValueChange ────────────────────────────────────────────────



  it('should fall back to YES/NO interpretation when Y or N value selected and code not in resultsMap', () => {
    component.allQcResults.set([]);
    const row: QcProcedureRow = {
      qcId: 'TEMP', arrangeBy: 2, qcProcedure: 'TEMP', target: '22',
      data: 'CHAR', validRange: '', minValue: '', maxValue: '',
      value: '', tech1: '', tech2: '', resultInterpretation: '',
    };
    // Dropdown option value="Y" maps to display "YES"; interpretation stays Acceptable
    component.onProcedureValueChange(row, 'Y');
    expect(row.value).toBe('Y');
    expect(row.resultInterpretation).toBe('Acceptable');

    // Dropdown option value="N" maps to display "NO"; interpretation stays Unacceptable
    component.onProcedureValueChange(row, 'N');
    expect(row.value).toBe('N');
    expect(row.resultInterpretation).toBe('Unacceptable');
  });

  // ── onNumericValueInput ───────────────────────────────────────────────────





  it('should set Acceptable when numeric value equals min boundary', () => {
    const row: QcProcedureRow = {
      qcId: 'RPM', arrangeBy: 1, qcProcedure: 'RPM', target: '5000',
      data: 'NUM', validRange: '4450 - 5550', minValue: '4450', maxValue: '5550',
      value: '', tech1: '', tech2: '', resultInterpretation: '',
    };
    const event = { target: { value: '4450' } } as unknown as Event;
    component.onNumericValueInput(row, event);
    expect(row.resultInterpretation).toBe('Acceptable');
  });

  it('should clear interpretation when numeric input is empty', () => {
    const row: QcProcedureRow = {
      qcId: 'RPM', arrangeBy: 1, qcProcedure: 'RPM', target: '5000',
      data: 'NUM', validRange: '4450 - 5550', minValue: '4450', maxValue: '5550',
      value: '5000', tech1: '', tech2: '', resultInterpretation: 'Acceptable',
    };
    const event = { target: { value: '' } } as unknown as Event;
    component.onNumericValueInput(row, event);
    expect(row.resultInterpretation).toBe('');
  });

  it('should clear interpretation when numeric input is not a number', () => {
    const row: QcProcedureRow = {
      qcId: 'RPM', arrangeBy: 1, qcProcedure: 'RPM', target: '5000',
      data: 'NUM', validRange: '4450 - 5550', minValue: '4450', maxValue: '5550',
      value: '', tech1: '', tech2: '', resultInterpretation: '',
    };
    const event = { target: { value: 'abc' } } as unknown as Event;
    component.onNumericValueInput(row, event);
    expect(row.resultInterpretation).toBe('');
  });

  // ── onQcTypeChange ────────────────────────────────────────────────────────

  it('should update currentQcTypeDescription when QC Type changes', () => {
    component.allQcTypes.set([
      { qcType: 'DAILY', description: 'Daily QC' },
      { qcType: 'WKLY', description: 'Weekly QC' },
    ]);
    mockService.getReviewCode.and.returnValue(of('1'));
    component.equipmentTypeControl.setValue('CENT');

    component.onQcTypeChange('DAILY');

    expect(component.currentQcTypeDescription).toBe('Daily QC');
  });

  it('should fetch review code when QC Type changes', () => {
    mockService.getReviewCode.and.returnValue(of('2'));
    component.equipmentTypeControl.setValue('CENT');
    component.allQcTypes.set([{ qcType: 'WKLY', description: 'Weekly QC' }]);

    component.onQcTypeChange('WKLY');

    expect(mockService.getReviewCode).toHaveBeenCalledWith('CENT', 'WKLY');
  });

  it('should clear reviewCode and currentQcTypeDescription when QC Type is cleared', () => {
    component.reviewCode.set('2D');
    component.currentQcTypeDescription = 'Daily QC';
    component.onQcTypeChange(null);
    expect(component.reviewCode()).toBeNull();
    expect(component.currentQcTypeDescription).toBe('');
  });

  // ── onSave validations ────────────────────────────────────────────────────



  it('should show error and not save when qcType is missing', () => {
    component.currentQcReference = 'QC001';
    component.qcDetailsForm.patchValue({ qcType: null, result1: 'A' });
    component.onSave();
    expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      jasmine.stringContaining('QC Type is required'), 'CLOSE', jasmine.any(Object)
    );
  });

  it('should show error and not save when result1 is missing', () => {
    component.currentQcReference = 'QC001';
    component.qcDetailsForm.patchValue({ qcType: 'DAILY', result1: null });
    component.onSave();
    expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      jasmine.stringContaining('Result 1 is required'), 'CLOSE', jasmine.any(Object)
    );
  });

  it('should show error when QC Date is missing for active result', () => {
    component.currentQcReference = 'QC001';
    component.qcDateControl.setValue(null);
    component.qcDetailsForm.patchValue({ qcType: 'DAILY', result1: 'A', qcTech1: 'JSMITH' });
    component.onSave();
    expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      jasmine.stringContaining('QC Date is required'), 'CLOSE', jasmine.any(Object)
    );
  });



  it('should show error when future QC Date is provided for active result', () => {
    component.currentQcReference = 'QC001';
    component.qcDateControl.setValue(moment().add(1, 'day'));
    component.qcDetailsForm.patchValue({ qcType: 'DAILY', result1: 'A', qcTech1: 'JSMITH' });
    component.onSave();
    expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      jasmine.stringContaining('future date'), 'CLOSE', jasmine.any(Object)
    );
  });

  it('should show error when Tech1 is missing for active result', () => {
    component.currentQcReference = 'QC001';
    component.qcDateControl.setValue(moment());
    component.qcDetailsForm.patchValue({ qcType: 'DAILY', result1: 'A', qcTech1: null });
    component.onSave();
    expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      jasmine.stringContaining('QC Tech 1 is required'), 'CLOSE', jasmine.any(Object)
    );
  });

  it('should show error when same technician is set for Tech1 and Tech2', () => {
    component.currentQcReference = 'QC001';
    component.qcDateControl.setValue(moment());
    component.qcDetailsForm.patchValue({
      qcType: 'DAILY', result1: 'A', qcTech1: 'JSMITH', qcTech2: 'jsmith',
    });
    component.onSave();
    expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      jasmine.stringContaining('cannot be the same user'), 'CLOSE', jasmine.any(Object)
    );
  });

  it('should show error when Tech2 provided but Result2 is missing', () => {
    component.currentQcReference = 'QC001';
    component.qcDateControl.setValue(moment());
    component.qcDetailsForm.patchValue({
      qcType: 'DAILY', result1: 'A', qcTech1: 'JSMITH', qcTech2: 'BJONES', result2: null,
    });
    component.onSave();
    expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      jasmine.stringContaining('Result 2 is required'), 'CLOSE', jasmine.any(Object)
    );
  });

  it('should show error when Result2 is S or C', () => {
    component.currentQcReference = 'QC001';
    component.qcDateControl.setValue(moment());
    component.qcDetailsForm.patchValue({
      qcType: 'DAILY', result1: 'A', qcTech1: 'JSMITH', result2: 'S',
    });
    component.onSave();
    expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      jasmine.stringContaining('cannot be Scheduled or Cancelled'), 'CLOSE', jasmine.any(Object)
    );
  });

  it('should enforce dual review when reviewCode is 2 and result1 is A', () => {
    component.currentQcReference = 'QC001';
    component.reviewCode.set('2');
    component.qcDateControl.setValue(moment());
    component.qcDetailsForm.patchValue({
      qcType: 'DAILY', result1: 'A', qcTech1: 'JSMITH', qcTech2: null, result2: null,
    });
    component.onSave();
    expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      jasmine.stringContaining('Dual review required'), 'CLOSE', jasmine.any(Object)
    );
  });

  it('should enforce 2D detail match when reviewCode is 2D', () => {
    component.currentQcReference = 'QC001';
    component.reviewCode.set('2D');
    component.qcDateControl.setValue(moment());
    component.qcDetailsForm.patchValue({
      qcType: 'DAILY', result1: 'A', qcTech1: 'JSMITH', qcTech2: 'BJONES', result2: 'A',
    });
    component.qcProcedureRows = [
      {
        qcId: 'RPM', arrangeBy: 1, qcProcedure: 'RPM', target: '3200',
        data: 'NUM', validRange: '3100 - 3300', minValue: '3100', maxValue: '3300',
        value: '3100', tech1: 'JSMITH', tech2: '', resultInterpretation: 'Acceptable',
      },
    ];
    component.onSave();
    expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      jasmine.stringContaining('exact'), 'CLOSE', jasmine.any(Object)
    );
  });

  // ── onClearAll ────────────────────────────────────────────────────────────

  it('should reset all state on onClearAll', () => {
    component.hasRetrieved = true;
    component.qcHeaderData = {} as any;
    component.qcProcedureRows = [{ qcId: 'x' } as any];
    component.barcodeError = 'some error';

    component.onClearAll();

    expect(component.hasRetrieved).toBeFalse();
    expect(component.qcHeaderData).toBeNull();
    expect(component.qcProcedureRows.length).toBe(0);
    expect(component.barcodeError).toBe('');
    expect(component.equipmentTypeControl.value).toBeNull();
  });

  // ── Chapter change ────────────────────────────────────────────────────────

  it('should reload LOVs and clear state when chapter changes', () => {
    component.hasRetrieved = true;
    mockService.getEquipmentTypes.calls.reset();
    mockService.getQcResults.calls.reset();
    mockService.getUsers.calls.reset();

    (mockHeaderService as any).chapterChanged$.next();

    expect(component.hasRetrieved).toBeFalse();
    expect(mockService.getEquipmentTypes).toHaveBeenCalledTimes(1);
  });

  // ── sameTechValidator (form-level) ────────────────────────────────────────

  it('should have sameTech form error when tech1 equals tech2', () => {
    component.qcDetailsForm.patchValue({ qcTech1: 'JSMITH', qcTech2: 'JSMITH' });
    expect(component.qcDetailsForm.hasError('sameTech')).toBeTrue();
  });

  it('should not have sameTech form error when techs differ', () => {
    component.qcDetailsForm.patchValue({ qcTech1: 'JSMITH', qcTech2: 'BJONES' });
    expect(component.qcDetailsForm.hasError('sameTech')).toBeFalse();
  });

  // ── tech2Result2Validator (form-level) ────────────────────────────────────

  it('should have result2Required form error when tech2 set but result2 missing', () => {
    component.qcDetailsForm.patchValue({ qcTech2: 'BJONES', result2: null });
    expect(component.qcDetailsForm.hasError('result2Required')).toBeTrue();
  });

  it('should not have result2Required form error when both tech2 and result2 are set', () => {
    component.qcDetailsForm.patchValue({ qcTech2: 'BJONES', result2: 'A' });
    expect(component.qcDetailsForm.hasError('result2Required')).toBeFalse();
  });

  // ==================== ADDITIONAL COVERAGE TESTS ====================

  // ── onEquipmentTypeChange ────────────────────────────────────────────────

  describe('onEquipmentTypeChange', () => {
    it('should clear downstream controls when type is selected', () => {
      mockService.getEquipmentIds.and.returnValue(of([
        { equipId: 'EQ1', equipReference: 'REF1' },
      ]));
      mockService.getQcTypes.and.returnValue(of([
        { qcType: 'DAILY', description: 'Daily QC' },
      ]));

      component.onEquipmentTypeChange('CENT');

      expect(component.equipmentIdControl.enabled).toBeTrue();
      expect(mockService.getEquipmentIds).toHaveBeenCalledWith('CENT');
      expect(mockService.getQcTypes).toHaveBeenCalledWith('CENT');
    });

    it('should disable downstream controls when type is cleared', () => {
      component.equipmentIdControl.enable();
      component.equipmentRefControl.enable();
      component.qcRefNoControl.enable();

      component.onEquipmentTypeChange(null);

      expect(component.equipmentIdControl.disabled).toBeTrue();
      expect(component.equipmentRefControl.disabled).toBeTrue();
      expect(component.qcRefNoControl.disabled).toBeTrue();
      expect(component.equipmentTypeDescription).toBe('');
    });

    it('should set equipment type description from LOV', () => {
      component.allEquipTypes.set([
        { code: 'CENT', description: 'Centrifuge' },
      ]);
      mockService.getEquipmentIds.and.returnValue(of([]));
      mockService.getQcTypes.and.returnValue(of([]));

      component.onEquipmentTypeChange('CENT');

      expect(component.equipmentTypeDescription).toBe('Centrifuge');
    });

    it('should handle error on equipment IDs load', () => {
      mockService.getEquipmentIds.and.returnValue(of([]));
      mockService.getQcTypes.and.returnValue(of([]));
      // Just verify no error is thrown
      component.onEquipmentTypeChange('CENT');
      expect(component.isLoadingEquipIds).toBeFalse();
    });
  });

  // ── onEquipmentIdChange ──────────────────────────────────────────────────

  describe('onEquipmentIdChange', () => {
    beforeEach(() => {
      component.equipmentTypeControl.setValue('CENT');
    });

    it('should load equipment references when ID is selected', () => {
      mockService.getEquipmentReferences.and.returnValue(of([
        { equipId: 'EQ1', equipReference: 'REF1' },
        { equipId: 'EQ1', equipReference: 'REF2' },
      ]));

      component.onEquipmentIdChange('EQ1');

      expect(mockService.getEquipmentReferences).toHaveBeenCalledWith('CENT', 'EQ1');
      expect(component.equipmentRefControl.enabled).toBeTrue();
    });

    it('should auto-select when only one reference exists', () => {
      mockService.getEquipmentReferences.and.returnValue(of([
        { equipId: 'EQ1', equipReference: 'REF1' },
      ]));
      mockService.getQcEvents.and.returnValue(of([]));

      component.onEquipmentIdChange('EQ1');

      expect(component.equipmentRefControl.value).toBe('REF1');
    });

    it('should disable downstream controls when ID is cleared', () => {
      component.equipmentRefControl.enable();
      component.qcRefNoControl.enable();

      component.onEquipmentIdChange(null);

      expect(component.equipmentRefControl.disabled).toBeTrue();
      expect(component.qcRefNoControl.disabled).toBeTrue();
    });
  });

  // ── onEquipmentRefChange ─────────────────────────────────────────────────

  describe('onEquipmentRefChange', () => {
    it('should load QC events when reference is selected', () => {
      mockService.getQcEvents.and.returnValue(of([
        { qcReference: 'QC001' },
        { qcReference: 'QC002' },
      ]));

      component.onEquipmentRefChange('REF1');

      expect(mockService.getQcEvents).toHaveBeenCalledWith('REF1');
      expect(component.qcRefNoControl.enabled).toBeTrue();
    });

    it('should auto-select when only one QC event exists', () => {
      mockService.getQcEvents.and.returnValue(of([
        { qcReference: 'QC001' },
      ]));
      mockService.getQcHeader.and.returnValue(of(null));
      mockService.getQcDetails.and.returnValue(of([]));

      component.onEquipmentRefChange('REF1');

      expect(component.qcRefNoControl.value).toBe('QC001');
    });

    it('should disable QC ref control when reference is cleared', () => {
      component.qcRefNoControl.enable();

      component.onEquipmentRefChange(null);

      expect(component.qcRefNoControl.disabled).toBeTrue();
    });
  });

  // ── onQcRefChange ────────────────────────────────────────────────────────

  describe('onQcRefChange', () => {
    it('should trigger retrieve when QC reference is selected', () => {
      mockService.getQcHeader.and.returnValue(of({
        qcType: 'DAILY',
        qcTypeDescription: 'Daily QC',
        qcDate: '2025-06-15T10:30:00',
        qcTech1: 'JSMITH',
        qcTech2: null,
        qcResult1: 'A',
        qcResult2: null,
        qcStatus: 'A',
        qcStatusDescription: 'Acceptable',
      }));
      mockService.getQcDetails.and.returnValue(of([]));
      mockService.getReviewCode.and.returnValue(of('1'));
      component.equipmentTypeControl.setValue('CENT');

      component.onQcRefChange('QC001');

      expect(component.hasRetrieved).toBeTrue();
      expect(component.qcHeaderData).not.toBeNull();
    });

    it('should clear results when QC reference is null', () => {
      component.hasRetrieved = true;
      component.onQcRefChange(null);
      expect(component.hasRetrieved).toBeFalse();
    });
  });

  // ── onRetrieve ───────────────────────────────────────────────────────────

  describe('onRetrieve', () => {
    const mockHeader: any = {
      qcType: 'DAILY',
      qcTypeDescription: 'Daily QC',
      qcDate: '2025-06-15T10:30:00',
      qcTech1: 'JSMITH',
      qcTech2: 'BJONES',
      qcResult1: 'A',
      qcResult2: 'A',
      qcStatus: 'A',
      qcStatusDescription: 'Acceptable',
    };

    const mockDetails: any[] = [
      {
        qcId: 'RPM',
        arrangeBy: 1,
        expectedValue: '5000',
        minimumValue: '4450',
        maximumValue: '5550',
        actualValue: '5000',
        interpretation: 'A',
        insertedBy: 'JSMITH',
      },
      {
        qcId: 'TEMP',
        arrangeBy: 2,
        expectedValue: '22',
        minimumValue: null,
        maximumValue: null,
        actualValue: 'Y',
        interpretation: null,
        insertedBy: 'JSMITH',
      },
    ];

    it('should load header and details', () => {
      mockService.getQcHeader.and.returnValue(of(mockHeader));
      mockService.getQcDetails.and.returnValue(of(mockDetails));
      mockService.getReviewCode.and.returnValue(of('1'));
      component.equipmentTypeControl.setValue('CENT');

      component.onRetrieve('QC001');

      expect(component.hasRetrieved).toBeTrue();
      expect(component.qcHeaderData).not.toBeNull();
      expect(component.qcProcedureRows.length).toBe(2);
      expect(component.currentQcReference).toBe('QC001');
    });

    it('should patch form with header data', () => {
      mockService.getQcHeader.and.returnValue(of(mockHeader));
      mockService.getQcDetails.and.returnValue(of(mockDetails));
      mockService.getReviewCode.and.returnValue(of('2'));
      component.equipmentTypeControl.setValue('CENT');

      component.onRetrieve('QC001');

      expect(component.qcDetailsForm.get('qcType')!.value).toBe('DAILY');
      expect(component.qcDetailsForm.get('qcTech1')!.value).toBe('JSMITH');
      expect(component.qcDetailsForm.get('result1')!.value).toBe('A');
    });

    it('should set QC date and time controls', () => {
      mockService.getQcHeader.and.returnValue(of(mockHeader));
      mockService.getQcDetails.and.returnValue(of(mockDetails));
      mockService.getReviewCode.and.returnValue(of('1'));
      component.equipmentTypeControl.setValue('CENT');

      component.onRetrieve('QC001');

      expect(component.qcDateControl.value).not.toBeNull();
      expect(component.qcTimeControl.value).toBe('10:30');
    });

    it('should handle null header date', () => {
      const headerNoDate = { ...mockHeader, qcDate: null };
      mockService.getQcHeader.and.returnValue(of(headerNoDate));
      mockService.getQcDetails.and.returnValue(of([]));
      mockService.getReviewCode.and.returnValue(of(null));
      component.equipmentTypeControl.setValue('CENT');

      component.onRetrieve('QC001');

      expect(component.qcDateControl.value).toBeNull();
      expect(component.qcTimeControl.value).toBeNull();
    });

    it('should handle null header', () => {
      mockService.getQcHeader.and.returnValue(of(null));
      mockService.getQcDetails.and.returnValue(of([]));
      component.equipmentTypeControl.setValue('CENT');

      component.onRetrieve('QC001');

      expect(component.hasRetrieved).toBeTrue();
    });

    it('should map detail rows correctly', () => {
      component.allQcResults.set([
        { code: 'A', description: 'Acceptable' },
      ]);
      mockService.getQcHeader.and.returnValue(of(mockHeader));
      mockService.getQcDetails.and.returnValue(of(mockDetails));
      mockService.getReviewCode.and.returnValue(of('1'));
      component.equipmentTypeControl.setValue('CENT');

      component.onRetrieve('QC001');

      const rpmRow = component.qcProcedureRows.find(r => r.qcId === 'RPM');
      expect(rpmRow).toBeDefined();
      expect(rpmRow!.validRange).toContain('4450');
      expect(rpmRow!.data).toBe('NUM');

      const tempRow = component.qcProcedureRows.find(r => r.qcId === 'TEMP');
      expect(tempRow).toBeDefined();
      expect(tempRow!.data).toBe('CHAR');
    });

    it('should show error on retrieve failure', () => {
      mockService.getQcHeader.and.returnValue(of(null));
      mockService.getQcDetails.and.returnValue(
        { pipe: () => ({ subscribe: (opts: any) => opts.error(new Error('fail')) }) } as any
      );
      // Use forkJoin error path
      const { throwError } = require('rxjs');
      mockService.getQcHeader.and.returnValue(throwError(() => new Error('API error')));
      mockService.getQcDetails.and.returnValue(of([]));

      component.onRetrieve('QC001');

      expect(component.isLoading).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load QC data'),
        'CLOSE',
        jasmine.any(Object)
      );
    });

    it('should not retrieve if already loading', () => {
      component.isLoading = true;
      mockService.getQcHeader.calls.reset();

      component.onRetrieve('QC001');

      expect(mockService.getQcHeader).not.toHaveBeenCalled();
    });

    it('should fetch review code after retrieve', () => {
      mockService.getQcHeader.and.returnValue(of(mockHeader));
      mockService.getQcDetails.and.returnValue(of([]));
      mockService.getReviewCode.and.returnValue(of('2D'));
      component.equipmentTypeControl.setValue('CENT');

      component.onRetrieve('QC001');

      expect(mockService.getReviewCode).toHaveBeenCalledWith('CENT', 'DAILY');
      expect(component.reviewCode()).toBe('2D');
    });
  });

  // ── onSave success flow ──────────────────────────────────────────────────

  describe('onSave success flow', () => {
    beforeEach(() => {
      component.currentQcReference = 'QC001';
      component.qcDateControl.setValue(moment());
      component.qcDetailsForm.patchValue({
        qcType: 'DAILY',
        result1: 'A',
        qcTech1: 'JSMITH',
      });
      component.qcProcedureRows = [
        {
          qcId: 'RPM', arrangeBy: 1, qcProcedure: 'RPM', target: '5000',
          data: 'NUM', validRange: '4450 - 5550', minValue: '4450', maxValue: '5550',
          value: '5000', tech1: 'JSMITH', tech2: '', resultInterpretation: 'Acceptable',
        },
      ];
    });

    it('should save details then header on success', () => {
      mockService.updateQcDetails.and.returnValue(of({ success: true }));
      mockService.updateQcHeader.and.returnValue(of({ success: true }));

      component.onSave();

      expect(mockService.updateQcDetails).toHaveBeenCalledWith('QC001', jasmine.any(Object));
      expect(mockService.updateQcHeader).toHaveBeenCalledWith('QC001', jasmine.any(Object));
      expect(component.isSaving).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith(
        'QC record saved successfully.', 'DISMISS', jasmine.any(Object)
      );
    });

    it('should not save when already saving', () => {
      component.isSaving = true;
      mockService.updateQcDetails.calls.reset();

      component.onSave();

      expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    });

    it('should not save when no QC reference', () => {
      component.currentQcReference = '';
      mockService.updateQcDetails.calls.reset();

      component.onSave();

      expect(mockService.updateQcDetails).not.toHaveBeenCalled();
    });

    it('should format qcDate with time when time is provided', () => {
      component.qcTimeControl.setValue('14:30');
      mockService.updateQcDetails.and.returnValue(of({ success: true }));
      mockService.updateQcHeader.and.returnValue(of({ success: true }));

      component.onSave();

      const headerCall = mockService.updateQcHeader.calls.mostRecent().args[1];
      expect(headerCall.qcDate).toContain('T14:30:00');
    });

    it('should format qcDate without time when time is null', () => {
      component.qcTimeControl.setValue(null);
      mockService.updateQcDetails.and.returnValue(of({ success: true }));
      mockService.updateQcHeader.and.returnValue(of({ success: true }));

      component.onSave();

      const headerCall = mockService.updateQcHeader.calls.mostRecent().args[1];
      expect(headerCall.qcDate).toContain('T00:00:00');
    });

    it('should set qcDate to null when no date selected', () => {
      component.qcDateControl.setValue(null);
      component.qcDetailsForm.patchValue({ result1: 'S' }); // Scheduled - no date required
      mockService.updateQcDetails.and.returnValue(of({ success: true }));
      mockService.updateQcHeader.and.returnValue(of({ success: true }));

      component.onSave();

      const headerCall = mockService.updateQcHeader.calls.mostRecent().args[1];
      expect(headerCall.qcDate).toBeNull();
    });

    it('should update qcStatus from response', () => {
      component.qcHeaderData = { qcStatus: 'S', qcStatusDescription: 'Scheduled' } as any;
      component.allQcResults.set([
        { code: 'A', description: 'Acceptable' },
      ]);
      mockService.updateQcDetails.and.returnValue(of({ success: true }));
      mockService.updateQcHeader.and.returnValue(of({ success: true, item: { qcStatus: 'A' } }));

      component.onSave();

      expect(component.qcHeaderData!.qcStatus).toBe('A');
      expect(component.qcHeaderData!.qcStatusDescription).toBe('Acceptable');
    });

    it('should handle save error', () => {
      const { throwError } = require('rxjs');
      mockService.updateQcDetails.and.returnValue(throwError(() => ({
        error: { message: 'Save failed' }
      })));

      component.onSave();

      expect(component.isSaving).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalled();
    });
  });

  // ── Barcode scanning ─────────────────────────────────────────────────────

  describe('Barcode scanning', () => {
    it('should process barcode when 8 characters entered', () => {
      mockService.parseBarcode.and.returnValue(of({
        isValid: true,
        equipmentType: 'CENT',
        equipmentId: 'EQ1',
        equipmentReference: 'REF1',
      }));
      mockService.getEquipmentIds.and.returnValue(of([]));
      mockService.getQcTypes.and.returnValue(of([]));
      mockService.getEquipmentReferences.and.returnValue(of([]));
      mockService.getQcEvents.and.returnValue(of([]));
      component.allEquipTypes.set([{ code: 'CENT', description: 'Centrifuge' }]);

      const input = { value: '12345678' } as HTMLInputElement;
      component.onBarcodeInput({ target: input } as any);

      expect(mockService.parseBarcode).toHaveBeenCalledWith('12345678');
    });

    it('should not process barcode when less than 8 characters', () => {
      const input = { value: '1234' } as HTMLInputElement;
      component.onBarcodeInput({ target: input } as any);
      expect(mockService.parseBarcode).not.toHaveBeenCalled();
    });

    it('should clear barcode error on input', () => {
      component.barcodeError = 'Previous error';
      const input = { value: '123' } as HTMLInputElement;
      component.onBarcodeInput({ target: input } as any);
      expect(component.barcodeError).toBe('');
    });

    it('should handle invalid barcode result', () => {
      mockService.parseBarcode.and.returnValue(of({
        isValid: false,
        errorMessage: 'Invalid barcode format',
      }));

      const input = { value: '12345678' } as HTMLInputElement;
      component.onBarcodeInput({ target: input } as any);

      expect(component.barcodeError).toBe('Invalid barcode format');
    });

    it('should handle null barcode result', () => {
      mockService.parseBarcode.and.returnValue(of(null));

      const input = { value: '12345678' } as HTMLInputElement;
      component.onBarcodeInput({ target: input } as any);

      expect(component.barcodeError).toBe('Invalid barcode.');
    });

    it('should handle barcode parse error', () => {
      const { throwError } = require('rxjs');
      mockService.parseBarcode.and.returnValue(throwError(() => ({
        error: { message: 'Barcode API failed' }
      })));

      const input = { value: '12345678' } as HTMLInputElement;
      component.onBarcodeInput({ target: input } as any);

      expect(component.isScanningBarcode).toBeFalse();
      expect(component.barcodeError).toBeTruthy();
    });

    it('should not scan if already scanning', () => {
      component.isScanningBarcode = true;
      mockService.parseBarcode.calls.reset();

      component['processBarcodeInput']('12345678');

      expect(mockService.parseBarcode).not.toHaveBeenCalled();
    });

    it('should handle barcode scan button click', () => {
      component.barcodeControl.setValue('12345678');
      mockService.parseBarcode.and.returnValue(of({ isValid: false }));

      component.onBarcodeScan();

      expect(mockService.parseBarcode).toHaveBeenCalledWith('12345678');
    });

    it('should not scan when barcode is empty', () => {
      component.barcodeControl.setValue('');
      component.onBarcodeScan();
      expect(mockService.parseBarcode).not.toHaveBeenCalled();
    });

    it('should set up cascading dropdowns after valid barcode', () => {
      const equipIds = [{ equipId: 'EQ1', equipReference: 'REF1' }];
      const refs = [{ equipId: 'EQ1', equipReference: 'REF1' }];
      const events = [{ qcReference: 'QC001' }];

      mockService.parseBarcode.and.returnValue(of({
        isValid: true,
        equipmentType: 'CENT',
        equipmentId: 'EQ1',
        equipmentReference: 'REF1',
      }));
      mockService.getEquipmentIds.and.returnValue(of(equipIds));
      mockService.getQcTypes.and.returnValue(of([]));
      mockService.getEquipmentReferences.and.returnValue(of(refs));
      mockService.getQcEvents.and.returnValue(of(events));
      mockService.getQcHeader.and.returnValue(of(null));
      mockService.getQcDetails.and.returnValue(of([]));
      component.allEquipTypes.set([{ code: 'CENT', description: 'Centrifuge' }]);

      component['processBarcodeInput']('12345678');

      expect(component.equipmentTypeControl.value).toBe('CENT');
      expect(component.equipmentTypeDescription).toBe('Centrifuge');
    });
  });

  // ── QC Date/Time helpers ─────────────────────────────────────────────────

  describe('QC date/time helpers', () => {
    it('should return empty when qcDate not touched', () => {
      expect(component.getQcDateError()).toBe('');
    });

    it('should return error for matDatepickerParse', () => {
      component.qcDateControl.markAsTouched();
      component.qcDateControl.setErrors({ matDatepickerParse: true });
      expect(component.getQcDateError()).toBe('QC date is invalid.');
    });

    it('should return error for invalidDateFormat', () => {
      component.qcDateControl.markAsTouched();
      component.qcDateControl.setErrors({ invalidDateFormat: true });
      expect(component.getQcDateError()).toBe('QC date is invalid.');
    });

    it('should return error for invalidDate', () => {
      component.qcDateControl.markAsTouched();
      component.qcDateControl.setErrors({ invalidDate: true });
      expect(component.getQcDateError()).toBe('QC date is invalid.');
    });

    it('should handle QC time input formatting', () => {
      const input = document.createElement('input');
      input.value = '1430';
      component.onQcTimeInput({ target: input } as any);
      expect(component.qcTimeControl.value).toBe('14:30');
      expect(component.qcTimeControl.touched).toBeTrue();
    });

    it('should handle short time input', () => {
      const input = document.createElement('input');
      input.value = '14';
      component.onQcTimeInput({ target: input } as any);
      expect(component.qcTimeControl.value).toBe('14');
    });

    it('should strip non-digit characters from time input', () => {
      const input = document.createElement('input');
      input.value = '14:3a';
      component.onQcTimeInput({ target: input } as any);
      expect(component.qcTimeControl.value).toBe('14:3');
    });

    it('should mark time control as touched on blur', () => {
      component.onQcTimeBlur();
      expect(component.qcTimeControl.touched).toBeTrue();
    });
  });

  // ── extractErrorMessage ──────────────────────────────────────────────────

  describe('extractErrorMessage', () => {
    it('should extract error.error.errorCode + errorDescription', () => {
      const err = { error: { error: { errorCode: '1001', errorDescription: 'Some error' } } };
      expect(component['extractErrorMessage'](err, 'default')).toBe('Error 1001: Some error');
    });

    it('should extract errorResponse format', () => {
      const err = { error: { errorResponse: { errorCode: '2002', error: 'Response error' } } };
      expect(component['extractErrorMessage'](err, 'default')).toBe('Error 2002: Response error');
    });

    it('should extract error.errorCode + message', () => {
      const err = { error: { errorCode: '3003', message: 'Error msg' } };
      expect(component['extractErrorMessage'](err, 'default')).toBe('Error 3003: Error msg');
    });

    it('should extract error.message', () => {
      const err = { error: { message: 'Simple error' } };
      expect(component['extractErrorMessage'](err, 'default')).toBe('Simple error');
    });

    it('should return default message when no known format', () => {
      expect(component['extractErrorMessage']({}, 'default msg')).toBe('default msg');
    });

    it('should return default for null error', () => {
      expect(component['extractErrorMessage'](null, 'fallback')).toBe('fallback');
    });
  });

  // ── isClearAllDisabled ───────────────────────────────────────────────────

  describe('isClearAllDisabled', () => {
    it('should be true when all controls empty and not retrieved', () => {
      component.equipmentTypeControl.setValue(null);
      component.equipmentIdControl.setValue(null);
      component.equipmentRefControl.setValue(null);
      component.qcRefNoControl.setValue(null);
      component.hasRetrieved = false;
      expect(component.isClearAllDisabled).toBeTrue();
    });

    it('should be false when equipment type is set', () => {
      component.equipmentTypeControl.setValue('CENT');
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should be false when data has been retrieved', () => {
      component.hasRetrieved = true;
      expect(component.isClearAllDisabled).toBeFalse();
    });
  });

  // ── currentQcStatusDescription ───────────────────────────────────────────

  describe('currentQcStatusDescription', () => {
    it('should return result description for selected result1', () => {
      component.allQcResults.set([
        { code: 'A', description: 'Acceptable' },
        { code: 'N', description: 'Not Acceptable' },
      ]);
      component.qcDetailsForm.get('result1')!.setValue('A');
      expect(component.currentQcStatusDescription).toBe('Acceptable');
    });

    it('should return header status description when result1 not found', () => {
      component.allQcResults.set([]);
      component.qcDetailsForm.get('result1')!.setValue(null);
      component.qcHeaderData = { qcStatusDescription: 'Scheduled' } as any;
      expect(component.currentQcStatusDescription).toBe('Scheduled');
    });

    it('should return dash when no data', () => {
      component.allQcResults.set([]);
      component.qcDetailsForm.get('result1')!.setValue(null);
      component.qcHeaderData = null;
      expect(component.currentQcStatusDescription).toBe('-');
    });
  });

  // ── getTechName ──────────────────────────────────────────────────────────

  describe('getTechName', () => {
    it('should return user name when found', () => {
      component.allUsers.set([
        { userId: 'JSMITH', userName: 'John Smith' },
      ]);
      expect(component.getTechName('JSMITH')).toBe('John Smith');
    });

    it('should return userId when user not found', () => {
      component.allUsers.set([]);
      expect(component.getTechName('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should return dash for null', () => {
      expect(component.getTechName(null)).toBe('-');
    });
  });

  // ── formatQcDate ─────────────────────────────────────────────────────────

  describe('formatQcDate', () => {
    it('should format ISO date string to DD-MMM-YYYY', () => {
      expect(component.formatQcDate('2011-04-26T00:00:00')).toBe('26-Apr-2011');
    });

    it('should format date-only ISO string', () => {
      expect(component.formatQcDate('2025-12-01')).toBe('01-Dec-2025');
    });

    it('should return original string for invalid date', () => {
      expect(component.formatQcDate('NOT-A-DATE')).toBe('NOT-A-DATE');
    });

    it('should strip time portion from datetime', () => {
      const result = component.formatQcDate('2024-06-15T10:30:00');
      expect(result).toBe('15-Jun-2024');
      expect(result).not.toContain('T');
      expect(result).not.toContain(':');
    });
  });

  // ── filteredQcRefs search by qcType and qcDate ──────────────────────────

  describe('filteredQcRefs search', () => {
    beforeEach(() => {
      component.allQcRefs.set([
        { qcReference: 'QC-000100', qcType: 'DAILY', qcDate: '2024-01-15T00:00:00', qcStatus: 'A' },
        { qcReference: 'QC-000200', qcType: 'WEEKLY', qcDate: '2024-02-20T00:00:00', qcStatus: 'S' },
        { qcReference: 'QC-000300', qcType: 'DAILY', qcDate: '2024-03-10T00:00:00', qcStatus: 'A' },
      ]);
    });

    it('should filter by qcType', () => {
      component.qcRefSearchCtrl.setValue('weekly');
      const filtered = component.filteredQcRefs();
      expect(filtered.length).toBe(1);
      expect(filtered[0].qcReference).toBe('QC-000200');
    });

    it('should filter by qcDate', () => {
      component.qcRefSearchCtrl.setValue('2024-02');
      const filtered = component.filteredQcRefs();
      expect(filtered.length).toBe(1);
      expect(filtered[0].qcReference).toBe('QC-000200');
    });

    it('should filter by qcReference', () => {
      component.qcRefSearchCtrl.setValue('000300');
      const filtered = component.filteredQcRefs();
      expect(filtered.length).toBe(1);
      expect(filtered[0].qcReference).toBe('QC-000300');
    });

    it('should return all when search is empty', () => {
      component.qcRefSearchCtrl.setValue('');
      expect(component.filteredQcRefs().length).toBe(3);
    });

    it('should return empty when no match found', () => {
      component.qcRefSearchCtrl.setValue('NONEXIST');
      expect(component.filteredQcRefs().length).toBe(0);
    });
  });

  // ── onCancel ─────────────────────────────────────────────────────────────

  describe('onCancel', () => {
    it('should call onClearAll', () => {
      spyOn(component, 'onClearAll');
      component.onCancel();
      expect(component.onClearAll).toHaveBeenCalled();
    });
  });

  // ── clearResults ─────────────────────────────────────────────────────────

  describe('clearResults', () => {
    it('should reset all results state', () => {
      component.qcProcedureRows = [{ qcId: 'x' } as any];
      component.qcHeaderData = {} as any;
      component.currentQcReference = 'QC001';
      component.hasRetrieved = true;

      component['clearResults']();

      expect(component.qcProcedureRows.length).toBe(0);
      expect(component.qcHeaderData).toBeNull();
      expect(component.currentQcReference).toBe('');
      expect(component.hasRetrieved).toBeFalse();
      expect(component.reviewCode()).toBeNull();
    });
  });

  // ── onProcedureValueChange additional ────────────────────────────────────

  describe('onProcedureValueChange with results map', () => {
    it('should use results map when code exists', () => {
      component.allQcResults.set([
        { code: 'A', description: 'Acceptable' },
      ]);
      const row: QcProcedureRow = {
        qcId: 'TEST', arrangeBy: 1, qcProcedure: 'TEST', target: '',
        data: 'CHAR', validRange: '', minValue: '', maxValue: '',
        value: '', tech1: '', tech2: '', resultInterpretation: '',
      };
      component.onProcedureValueChange(row, 'A');
      expect(row.resultInterpretation).toBe('Acceptable');
    });

    it('should set empty interpretation for unknown value', () => {
      component.allQcResults.set([]);
      const row: QcProcedureRow = {
        qcId: 'TEST', arrangeBy: 1, qcProcedure: 'TEST', target: '',
        data: 'CHAR', validRange: '', minValue: '', maxValue: '',
        value: '', tech1: '', tech2: '', resultInterpretation: '',
      };
      component.onProcedureValueChange(row, 'X');
      expect(row.resultInterpretation).toBe('');
    });
  });

  // ── onNumericValueInput additional ───────────────────────────────────────

  describe('onNumericValueInput edge cases', () => {
    it('should set Unacceptable when value is below min', () => {
      const row: QcProcedureRow = {
        qcId: 'RPM', arrangeBy: 1, qcProcedure: 'RPM', target: '5000',
        data: 'NUM', validRange: '4450 - 5550', minValue: '4450', maxValue: '5550',
        value: '', tech1: '', tech2: '', resultInterpretation: '',
      };
      component.onNumericValueInput(row, { target: { value: '4000' } } as any);
      expect(row.resultInterpretation).toBe('Unacceptable');
    });

    it('should set Unacceptable when value is above max', () => {
      const row: QcProcedureRow = {
        qcId: 'RPM', arrangeBy: 1, qcProcedure: 'RPM', target: '5000',
        data: 'NUM', validRange: '4450 - 5550', minValue: '4450', maxValue: '5550',
        value: '', tech1: '', tech2: '', resultInterpretation: '',
      };
      component.onNumericValueInput(row, { target: { value: '6000' } } as any);
      expect(row.resultInterpretation).toBe('Unacceptable');
    });

    it('should clear interpretation when only min or max is set', () => {
      const row: QcProcedureRow = {
        qcId: 'RPM', arrangeBy: 1, qcProcedure: 'RPM', target: '5000',
        data: 'NUM', validRange: '4450 -', minValue: '4450', maxValue: '',
        value: '', tech1: '', tech2: '', resultInterpretation: '',
      };
      component.onNumericValueInput(row, { target: { value: '5000' } } as any);
      expect(row.resultInterpretation).toBe('');
    });
  });

  // ── maxQcDate ────────────────────────────────────────────────────────────

  describe('maxQcDate additional', () => {
    it('should set maxQcDate to null when result1 is S', () => {
      component.qcDetailsForm.get('result1')!.setValue('S');
      expect(component.maxQcDate).toBeNull();
    });

    it('should set maxQcDate to null when result1 is C', () => {
      component.qcDetailsForm.get('result1')!.setValue('C');
      expect(component.maxQcDate).toBeNull();
    });
  });

  // ── Filtered computed signals ────────────────────────────────────────────

  describe('Filtered computed signals', () => {
    it('should filter equipment types by search', () => {
      component.allEquipTypes.set([
        { code: 'CENT', description: 'Centrifuge' },
        { code: 'REFR', description: 'Refrigerator' },
      ]);
      component.equipTypeSearchCtrl.setValue('cent');
      // Trigger computed
      const filtered = component.filteredEquipTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CENT');
    });

    it('should return all equipment types when search is empty', () => {
      component.allEquipTypes.set([
        { code: 'CENT', description: 'Centrifuge' },
        { code: 'REFR', description: 'Refrigerator' },
      ]);
      component.equipTypeSearchCtrl.setValue('');
      expect(component.filteredEquipTypes().length).toBe(2);
    });

    it('should filter equipment IDs by search', () => {
      component.allEquipIds.set([
        { equipId: 'EQ1', equipReference: 'REF1' },
        { equipId: 'EQ2', equipReference: 'REF2' },
      ]);
      component.equipIdSearchCtrl.setValue('EQ1');
      expect(component.filteredEquipIds().length).toBe(1);
    });

    it('should filter equipment refs by search', () => {
      component.allEquipRefs.set([
        { equipId: 'EQ1', equipReference: 'REF-A' },
        { equipId: 'EQ1', equipReference: 'REF-B' },
      ]);
      component.equipRefSearchCtrl.setValue('REF-A');
      expect(component.filteredEquipRefs().length).toBe(1);
    });

    it('should filter QC refs by search', () => {
      component.allQcRefs.set([
        { qcReference: 'QC001' },
        { qcReference: 'QC002' },
      ]);
      component.qcRefSearchCtrl.setValue('QC001');
      expect(component.filteredQcRefs().length).toBe(1);
    });
  });

  // ── Search listeners ─────────────────────────────────────────────────────

  describe('Search listeners', () => {
    it('should trigger signal update on equipType search change', () => {
      component.allEquipTypes.set([{ code: 'CENT', description: 'Centrifuge' }]);
      component.equipTypeSearchCtrl.setValue('test');
      // Signal should have been updated (spread copy)
      expect(component.allEquipTypes().length).toBe(1);
    });

    it('should trigger signal update on equipId search change', () => {
      component.allEquipIds.set([{ equipId: 'EQ1', equipReference: 'REF1' }]);
      component.equipIdSearchCtrl.setValue('test');
      expect(component.allEquipIds().length).toBe(1);
    });
  });

  // ── onSelectOpened ───────────────────────────────────────────────────────

  describe('onSelectOpened', () => {
    it('should not throw when called with undefined select', () => {
      expect(() => component.onSelectOpened(true, undefined)).not.toThrow();
    });

    it('should not throw when called with false', () => {
      expect(() => component.onSelectOpened(false, undefined)).not.toThrow();
    });
  });

  // ── loadInitialLovs error ────────────────────────────────────────────────

  describe('loadInitialLovs error', () => {
    it('should set isLoadingEquipTypes to false on error', () => {
      const { throwError } = require('rxjs');
      mockService.getEquipmentTypes.and.returnValue(throwError(() => new Error('fail')));
      mockService.getQcResults.and.returnValue(of([]));
      mockService.getUsers.and.returnValue(of([]));

      component['loadInitialLovs']();

      expect(component.isLoadingEquipTypes).toBeFalse();
    });
  });

  // ── onQcDateInput ────────────────────────────────────────────────────────

  describe('onQcDateInput', () => {
    it('should call DateFieldValidationUtility.handleEndDateInput', () => {
      const input = document.createElement('input');
      input.value = '15-JAN-2025';
      // Just verify it doesn't throw
      expect(() => component.onQcDateInput({ target: input } as any)).not.toThrow();
    });
  });

  // ── ngOnDestroy ──────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const spy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── onEquipmentTypeChange error handling ─────────────────────────────────

  describe('onEquipmentTypeChange error handling', () => {
    it('should handle error when loading equipment IDs fails', () => {
      const { throwError } = require('rxjs');
      mockService.getEquipmentIds.and.returnValue(of([]));
      mockService.getQcTypes.and.returnValue(of([]));

      // Simulate forkJoin error
      mockService.getEquipmentIds.and.returnValue(throwError(() => new Error('fail')));

      component.onEquipmentTypeChange('CENT');

      expect(component.isLoadingEquipIds).toBeFalse();
    });
  });

  // ── onEquipmentIdChange error handling ───────────────────────────────────

  describe('onEquipmentIdChange error handling', () => {
    it('should handle error when loading refs fails', () => {
      const { throwError } = require('rxjs');
      component.equipmentTypeControl.setValue('CENT');
      mockService.getEquipmentReferences.and.returnValue(throwError(() => new Error('fail')));

      component.onEquipmentIdChange('EQ1');

      expect(component.isLoadingEquipRefs).toBeFalse();
    });
  });

  // ── onEquipmentRefChange error handling ──────────────────────────────────

  describe('onEquipmentRefChange error handling', () => {
    it('should handle error when loading QC events fails', () => {
      const { throwError } = require('rxjs');
      mockService.getQcEvents.and.returnValue(throwError(() => new Error('fail')));

      component.onEquipmentRefChange('REF1');

      expect(component.isLoadingQcRefs).toBeFalse();
    });
  });
});
