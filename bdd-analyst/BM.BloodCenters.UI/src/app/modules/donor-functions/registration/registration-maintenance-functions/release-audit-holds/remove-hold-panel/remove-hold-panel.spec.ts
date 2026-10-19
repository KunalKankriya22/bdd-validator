import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SimpleChange } from '@angular/core';

import { of, Subject } from 'rxjs';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { RemoveHoldPanel } from './remove-hold-panel';
import { AuditHoldRecord, DeferDonorConfig, DropdownOption } from '../models/release-audit-holds.model';
import { ReleaseAuditHoldsService } from '../services/release-audit-holds.service';
import { HeaderService } from '@shared/services/header.service';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';

describe('RemoveHoldPanel', () => {
  let component: RemoveHoldPanel;
  let fixture: ComponentFixture<RemoveHoldPanel>;
  let serviceSpy: jasmine.SpyObj<ReleaseAuditHoldsService>;
  let mockHeaderService: { chapterChanged$: Subject<void> };

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const mockDeferDonorConfig: DeferDonorConfig = {
    isDeferDonorEnabled: true,
    options: [
      { value: 'I', label: 'Indefinite' },
      { value: 'T', label: 'Temporary' },
      { value: 'N', label: 'No Deferral' }
    ],
    defaultTermDate: moment(tomorrow).format('YYYY-MM-DD'),
    defaultEffDateOk: moment(today).format('YYYY-MM-DD'),
    defaultEffDateNft: moment(today).format('YYYY-MM-DD')
  };

  const mockRecord: AuditHoldRecord = {
    unitId: 'W633225031610-P',
    collectionDate: moment(today).format('DD-MMM-YYYY').toUpperCase(),
    name: 'Poole, Deborah',
    dateOfBirth: '18-FEB-1988',
    sex: 'M',
    donorId: 'DN00008855',
    donationType: 'AL',
    donationProcedure: 'PP',
    hold: 'BHOLD',
    origin: 'BPSY',
    reason: '10',
    removed: null,
    transactionId: 'TXN001',
    interDescription: 'Blood hold description',
    groupId: 'GRP01',
    groupMode: 'A',
    sourceCode: 'SRC01',
    holdSource: 'UNIT',
    effectiveDate: moment(today).format('DD-MMM-YYYY').toUpperCase(),
    insertDate: moment(today).format('DD-MMM-YYYY').toUpperCase(),
    termDate: null,
    releaseUser: null
  };

  const mockReasonOptions: DropdownOption[] = [
    { value: '10', label: 'Blood pressure out of range' },
    { value: '20', label: 'Temperature out of range' }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ReleaseAuditHoldsService', [
      'getInterdictionCodes',
      'getDeferDonorConfig'
    ]);
    serviceSpy.getInterdictionCodes.and.returnValue(of(mockReasonOptions));
    serviceSpy.getDeferDonorConfig.and.returnValue(of(mockDeferDonorConfig));

    mockHeaderService = {
      chapterChanged$: new Subject<void>()
    };



      TestBed.configureTestingModule({
      imports: [
        RemoveHoldPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatCheckboxModule,
        MatNativeDateModule,
        MatProgressSpinnerModule,
        SidePanelBase
      ],
      providers: [
        { provide: ReleaseAuditHoldsService, useValue: serviceSpy },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      serviceSpy.getInterdictionCodes.calls.reset();


      serviceSpy.getDeferDonorConfig.calls.reset();


      serviceSpy.getInterdictionCodes.and.returnValue(of(mockReasonOptions));


      serviceSpy.getDeferDonorConfig.and.returnValue(of(mockDeferDonorConfig));


    fixture = TestBed.createComponent(RemoveHoldPanel);
    component = fixture.componentInstance;
    component.record = mockRecord;
    component.mode = 'ok';
    fixture.detectChanges();


    });


  /* -------------------------------- INITIALIZATION -------------------------------- */

  describe('Initialization', () => {






    it('should always disable effective date (read-only)', () => {
      expect(component.form.get('effectiveDate')?.disabled).toBe(true);
    });

    it('should populate default dates from defer donor config', () => {
      expect(component.form.get('terminationDate')?.value).toBeTruthy();
      expect(component.form.get('effectiveDate')?.value).toBeTruthy();
    });

    it('should populate defer donor options from config', () => {
      expect(component.deferDonorOptions.length).toBe(3);
      expect(component.deferDonorOptions[0].value).toBe('I');
      expect(component.deferDonorOptions[1].value).toBe('T');
      expect(component.deferDonorOptions[2].value).toBe('N');
    });

    it('should load reason options from getInterdictionCodes', () => {
      expect(component.reasonOptions.length).toBe(2);
      expect(component.reasonOptions[0].value).toBe('10');
      expect(component.reasonOptions[0].label).toBe('Blood pressure out of range');
    });

    it('should initialize footer buttons', () => {
      expect(component.footerButtons.length).toBe(2);
      expect(component.footerButtons[0].label).toBe('CANCEL');
      expect(component.footerButtons[1].label).toBe('REMOVE');
    });
  });

  /* -------------------------------- DEFER DONOR -------------------------------- */

  describe('Defer Donor', () => {
    it('should enable defer through only when defer donor is Temporary', () => {
      expect(component.form.get('deferThrough')?.disabled).toBe(true);

      component.form.patchValue({ deferDonor: 'T' });
      expect(component.form.get('deferThrough')?.enabled).toBe(true);
      expect(component.isDeferThroughEnabled).toBe(true);

      component.form.patchValue({ deferDonor: 'I' });
      expect(component.form.get('deferThrough')?.disabled).toBe(true);
      expect(component.isDeferThroughEnabled).toBe(false);
    });









    it('should require defer through date when defer donor is Temporary', () => {
      component.form.patchValue({ deferDonor: 'T' });
      const deferThrough = component.form.get('deferThrough');

      deferThrough?.setValue(null);
      deferThrough?.markAsTouched();
      expect(deferThrough?.hasError('required')).toBe(true);
    });


  });

  /* -------------------------------- REASON -------------------------------- */
  /* -------------------------------- BUTTON STATES -------------------------------- */
  /* -------------------------------- SUBMIT -------------------------------- */

  describe('Submit', () => {






    it('should include correct fields in submit request', () => {
      spyOn(component.submit, 'emit');

      component.form.patchValue({
        reason: '10',
        deferDonor: 'T',
        comments: 'Test comment',
        acknowledged: true
      });
      component.form.get('deferThrough')?.setValue(nextWeek);

      component.onButtonClick('remove');

      const emittedRequest = (component.submit.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedRequest.unitId).toBe(mockRecord.unitId);
      expect(emittedRequest.code).toBe(mockRecord.hold);
      expect(emittedRequest.reason).toBe('10');
      expect(emittedRequest.deferDonor).toBe('T');
      expect(emittedRequest.comments).toBe('Test comment');
      expect(emittedRequest.acknowledged).toBe(true);
    });






  });

  /* -------------------------------- DATE ERROR MESSAGES -------------------------------- */

  describe('Date Error Messages', () => {










    it('should return required error for defer through when Temporary and empty', () => {
      component.form.patchValue({ deferDonor: 'T' });
      const control = component.form.get('deferThrough');
      control?.setValue(null);
      control?.markAsTouched();
      expect(component.getDeferThroughError()).toBe('Defer Through is required');
    });

    it('should return invalid error for defer through with parse error', () => {
      component.form.patchValue({ deferDonor: 'T' });
      const control = component.form.get('deferThrough');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getDeferThroughError()).toBe('Defer Through is invalid');
    });
  });

  /* -------------------------------- DATE INPUT BLUR -------------------------------- */

  describe('Date Input Blur', () => {
    it('should handle date input blur without error', () => {
      component.form.get('terminationDate')?.setValue(today);
      expect(() => component.onDateInputBlur('terminationDate')).not.toThrow();
    });

    it('should not throw when control does not exist', () => {
      expect(() => component.onDateInputBlur('nonExistent')).not.toThrow();
    });


  });

  /* -------------------------------- FORMATTED EFFECTIVE DATE -------------------------------- */

  describe('Formatted Effective Date', () => {
    it('should return formatted effective date string', () => {
      const result = component.formattedEffectiveDate;
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  /* -------------------------------- CHAPTER CHANGES -------------------------------- */
  /* -------------------------------- DESTROY -------------------------------- */

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
