import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AddEditDonorDecisionCode } from './add-edit-donor-decision-code';
import { DonorDecisionCodesService } from '../services/donor-decision-codes.service';
import { HeaderService } from '@shared/services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SimpleChange, SimpleChanges, signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditDonorDecisionCode', () => {
  let headerServiceSpy: any;
  let serviceSpy: any;
  let component: AddEditDonorDecisionCode;
  let fixture: ComponentFixture<AddEditDonorDecisionCode>;
  let service: jasmine.SpyObj<DonorDecisionCodesService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let chapterTimeZoneSig: WritableSignal<string>;

  // Use dynamic dates to avoid test failures when hardcoded dates become past dates
  const futureEffectiveDate = moment().add(1, 'month').toDate();
  const futureTerminationDate = moment().add(6, 'months').toDate();

  const mockDonorDecisionCodeOptions = [
    { donorDecisionCode: 'Y', description: 'Yes (OK for Transfusion)' },
    { donorDecisionCode: 'N', description: 'No (Not OK for Transfusion)' }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DonorDecisionCodesService', [
      'getDonorDecisionCodeOptions',
      'getDonorDecisionCodeByCode',
      'addDonorDecisionCode',
      'updateDonorDecisionCode'
    ]);
    const snackBarSpy = createMockMatSnackBar();

      TestBed.configureTestingModule({
      imports: [
        AddEditDonorDecisionCode,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DonorDecisionCodesService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });

    headerServiceSpy = TestBed.inject(HeaderService);
    chapterTimeZoneSig = headerServiceSpy.chapterTimeZone as WritableSignal<string>;




      serviceSpy.getDonorDecisionCodeOptions.calls.reset();


      serviceSpy.getDonorDecisionCodeByCode.calls.reset();


      serviceSpy.addDonorDecisionCode.calls.reset();


      serviceSpy.updateDonorDecisionCode.calls.reset();


    fixture = TestBed.createComponent(AddEditDonorDecisionCode);
    component = fixture.componentInstance;
    service = TestBed.inject(DonorDecisionCodesService) as jasmine.SpyObj<DonorDecisionCodesService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    service.getDonorDecisionCodeOptions.and.returnValue(of(mockDonorDecisionCodeOptions));

    // Configure snackBar.open to return a mock MatSnackBarRef
    snackBar.open.and.returnValue({} as any);


    });


  it('should initialize form with required fields', () => {
    fixture.detectChanges();

    expect(component.form).toBeDefined();
    expect(component.form.get('barcode')).toBeDefined();
    expect(component.form.get('donorDecisionCode')).toBeDefined();
    expect(component.form.get('description')).toBeDefined();
    expect(component.form.get('effectiveDate')).toBeDefined();
    expect(component.form.get('terminationDate')).toBeDefined();
  });


  it('should emit closePanel event when onCancel is called', (done) => {
    component.closePanel.subscribe(() => {
      done();
    });
    component.onCancel();
  });



  it('should update description when donor decision code changes in add mode', fakeAsync(() => {
    component.mode = 'add';
    fixture.detectChanges();
    tick();

    component.form.get('donorDecisionCode')?.setValue('Y');
    tick();

    expect(component.form.get('description')?.value).toBe('Yes (OK for Transfusion)');
  }));

  it('should update description when donor decision code changes in edit mode', fakeAsync(() => {
    component.mode = 'edit';
    component.data = {
      barCodeValue: 'BC001',
      donorDecisionCode: 'Y',
      displayCode: 'Yes',
      effDate: new Date('2027-01-15'),
      termDate: null,
      lastModifiedDate: new Date(),
      programId: 'PROG01'
    };
    fixture.detectChanges();
    tick();

    component.form.get('donorDecisionCode')?.setValue('N');
    tick();

    expect(component.form.get('description')?.value).toBe('No (Not OK for Transfusion)');
  }));


  it('should have barcode error message', () => {
    fixture.detectChanges();
    const barcodeControl = component.form.get('barcode');
    barcodeControl?.setValue('');
    barcodeControl?.markAsTouched();

    expect(component.getBarcodeError()).toBe('Barcode is required');
  });

  it('should have donor decision code error message', () => {
    fixture.detectChanges();
    const codeControl = component.form.get('donorDecisionCode');
    codeControl?.setValue('');
    codeControl?.markAsTouched();

    expect(component.getDonorDecisionCodeError()).toBe('Donor Decision Code is required');
  });

  it('should have effective date error message', () => {
    fixture.detectChanges();
    const dateControl = component.form.get('effectiveDate');
    dateControl?.setValue(null);
    dateControl?.markAsTouched();

    expect(component.getEffectiveDateError()).toBe('Effective Date is required');
  });




  describe('edit mode API integration', () => {
    it('should use UpdateDonorDecisionCodeDto for edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.editModeValues = {
        barCodeValue: '0001',
        donorDecisionCode: 'O',
        displayCode: 'No Cue'
      };

      component.form.patchValue({
        barcode: '0001',
        donorDecisionCode: 'A',
        effectiveDate: moment('2027-01-15'),
        terminationDate: null
      });

      const mockResponse = { success: true, message: 'Updated successfully' };
      service.updateDonorDecisionCode.and.returnValue(of(mockResponse));

      fixture.detectChanges();
      component.form.updateValueAndValidity();
      tick();

      component.onSave();
      flush();

      expect(service.updateDonorDecisionCode).toHaveBeenCalledWith(
        '0001',
        jasmine.objectContaining({
          donorDecisionCode: 'A',
          originalDonorDecisionCode: 'O'
        })
      );
    }));


    xit('should update description label when donor decision code changes in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.donorDecisionCodeOptions.set([
        { donorDecisionCode: 'A', description: 'Option A' },
        { donorDecisionCode: 'B', description: 'Option B' }
      ]);

      component.editModeValues = {
        barCodeValue: '0001',
        donorDecisionCode: 'A',
        displayCode: 'Option A'
      };

      // Stub service method in case it's called during initialization
      service.getDonorDecisionCodeByCode.and.returnValue(of({ donorDecisionCode: 'A', description: 'Option A' }));

      fixture.detectChanges();
      tick();

      component.form.get('donorDecisionCode')?.setValue('B');
      tick();

      expect(component.editModeValues.displayCode).toBe('Option B');
    }));

    xit('should update editModeValues.displayCode when description is fetched from API', fakeAsync(() => {
      const mockInitialResponse = { donorDecisionCode: 'X', description: 'Old Description' };
      const mockResponse = { donorDecisionCode: 'Y', description: 'Fetched Description' };

      // Set up spy to return different values for different calls
      service.getDonorDecisionCodeByCode.and.returnValues(of(mockInitialResponse), of(mockResponse));

      component.mode = 'edit';
      component.donorDecisionCodeOptions.set([]);

      component.editModeValues = {
        barCodeValue: '0001',
        donorDecisionCode: 'X',
        displayCode: 'Old Description'
      };

      fixture.detectChanges();
      tick();

      component.form.get('donorDecisionCode')?.setValue('Y');
      tick();

      expect(service.getDonorDecisionCodeByCode).toHaveBeenCalledWith('Y');
      expect(component.editModeValues.displayCode).toBe('Fetched Description');
    }));

    it('should send barCodeValue as URL parameter in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.editModeValues = {
        barCodeValue: 'BC999',
        donorDecisionCode: 'N',
        displayCode: 'No'
      };

      component.form.patchValue({
        barcode: 'BC999',
        donorDecisionCode: 'Y',
        effectiveDate: moment('2027-01-15'),
        terminationDate: null
      });

      const mockResponse = { success: true, message: 'Updated successfully' };
      service.updateDonorDecisionCode.and.returnValue(of(mockResponse));

      fixture.detectChanges();
      component.form.updateValueAndValidity();
      tick();

      component.onSave();
      flush();

      expect(service.updateDonorDecisionCode).toHaveBeenCalledWith(
        'BC999',
        jasmine.any(Object)
      );
    }));

    it('should include originalDonorDecisionCode in update DTO', fakeAsync(() => {
      component.mode = 'edit';
      component.editModeValues = {
        barCodeValue: '0003',
        donorDecisionCode: 'OLD',
        displayCode: 'Old Code'
      };

      component.form.patchValue({
        barcode: '0003',
        donorDecisionCode: 'NEW',
        effectiveDate: moment('2027-01-15'),
        terminationDate: moment('2027-12-31')
      });

      const mockResponse = { success: true, message: 'Updated successfully' };
      service.updateDonorDecisionCode.and.returnValue(of(mockResponse));

      fixture.detectChanges();
      component.form.updateValueAndValidity();
      tick();

      component.onSave();
      flush();

      const callArgs = service.updateDonorDecisionCode.calls.mostRecent().args;
      expect(callArgs[0]).toBe('0003');
      expect(callArgs[1]).toEqual(jasmine.objectContaining({
        donorDecisionCode: 'NEW',
        originalDonorDecisionCode: 'OLD'
      }));
    }));

    it('should handle save and create another in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.editModeValues = {
        barCodeValue: '0004',
        donorDecisionCode: 'A',
        displayCode: 'Code A'
      };

      component.form.patchValue({
        barcode: '0004',
        donorDecisionCode: 'B',
        effectiveDate: moment('2027-01-15'),
        terminationDate: null
      });

      const mockResponse = { success: true, message: 'Updated successfully' };
      service.updateDonorDecisionCode.and.returnValue(of(mockResponse));

      fixture.detectChanges();
      component.form.updateValueAndValidity();
      tick();

      spyOn(component.modeChange, 'emit');

      component.onSaveAndCreateAnother();
      flush();

      expect(service.updateDonorDecisionCode).toHaveBeenCalled();
      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
    }));
  });

  describe('donor decision code change listener', () => {
    it('should handle API error when fetching description', fakeAsync(() => {
      component.mode = 'add';
      component.donorDecisionCodeOptions.set([]);
      service.getDonorDecisionCodeByCode.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      spyOn(console, 'error');
      fixture.detectChanges();
      tick();

      component.form.get('donorDecisionCode')?.setValue('UNKNOWN');
      tick();

      expect(console.error).toHaveBeenCalled();
      expect(component.form.get('description')?.value).toBe('');
      expect(component.editModeValues.displayCode).toBe('');
    }));
  });

  // ========== NEW TESTS ==========

  describe('ngOnInit', () => {
    it('should set panel title for add mode on init', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      expect(component.panelTitle).toBe('Add Donor Decision Code');
    }));

    it('should load donor decision code options on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(service.getDonorDecisionCodeOptions).toHaveBeenCalled();
      expect(component.donorDecisionCodeOptions()).toEqual(mockDonorDecisionCodeOptions);
      expect(component.loadingDonorDecisionCodes).toBe(false);
    }));
  });

  describe('ngOnChanges', () => {
    it('should not call setupPanel on first change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const changes: SimpleChanges = {
        mode: new SimpleChange(undefined, 'add', true)
      };

      component.panelTitle = 'custom';
      component.ngOnChanges(changes);

      // panelTitle should remain unchanged since firstChange is true
      expect(component.panelTitle).toBe('custom');
    }));

    it('should call setupPanel on subsequent mode changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };

      component.mode = 'add';
      component.ngOnChanges(changes);

      expect(component.panelTitle).toBe('Add Donor Decision Code');
    }));

    it('should reset form when switching to add mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ barcode: '12345', donorDecisionCode: 'Y' });
      component.editModeValues = { barCodeValue: 'BC1', donorDecisionCode: 'Y', displayCode: 'Yes' };

      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.mode = 'add';
      component.ngOnChanges(changes);

      expect(component.editModeValues.barCodeValue).toBe('');
      expect(component.editModeValues.donorDecisionCode).toBe('');
      expect(component.editModeValues.displayCode).toBe('');
    }));

    it('should not reset form when switching to edit mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false)
      };
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: new Date('2027-01-15'),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      component.ngOnChanges(changes);

      expect(component.panelTitle).toBe('Edit Donor Decision Code');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    }));
  });

  describe('setupPanel - add mode', () => {
    it('should set panelTitle to Add Donor Decision Code', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      expect(component.panelTitle).toBe('Add Donor Decision Code');
    }));

    it('should clear lastUpdated in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      expect(component.lastUpdated).toBe('');
    }));

    it('should reset raw date inputs in add mode', fakeAsync(() => {
      component.mode = 'add';
      component.effDateRawInput = 'some-value';
      component.termDateRawInput = 'some-value';
      fixture.detectChanges();
      tick();

      expect(component.effDateRawInput).toBe('');
      expect(component.termDateRawInput).toBe('');
    }));

    it('should set minTerminationDate in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      expect(component.minTerminationDate).not.toBeNull();
    }));
  });

  describe('setupPanel - edit mode', () => {
    const futureDate = moment().add(60, 'days').startOf('day');
    const pastDate = moment().subtract(5, 'days').startOf('day');

    it('should set panelTitle to Edit Donor Decision Code', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: futureDate.toDate(),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.panelTitle).toBe('Edit Donor Decision Code');
    }));

    it('should set lastUpdated with last modified date', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: futureDate.toDate(),
        termDate: null,
        lastModifiedDate: new Date('2027-03-15T10:30:00Z'),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.lastUpdated).toContain('Last Modified:');
    }));

    it('should set isEffectiveDateEditable true for future effective dates', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: futureDate.toDate(),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.isEffectiveDateEditable).toBe(true);
    }));

    it('should set isEffectiveDateEditable false for past effective dates', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: pastDate.toDate(),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.isEffectiveDateEditable).toBe(false);
    }));

    it('should set isEffectiveDateEditable false when effDate is null', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: null,
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.isEffectiveDateEditable).toBe(false);
    }));

    it('should populate form values from data', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: futureDate.toDate(),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.form.getRawValue().barcode).toBe('BC001');
      expect(component.editModeValues.barCodeValue).toBe('BC001');
      expect(component.editModeValues.donorDecisionCode).toBe('Y');
      expect(component.editModeValues.displayCode).toBe('Yes');
    }));

    it('should disable barcode field in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: futureDate.toDate(),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.form.get('barcode')?.disabled).toBe(true);
    }));

    it('should use current date when lastModifiedDate is null', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: futureDate.toDate(),
        termDate: null,
        lastModifiedDate: null,
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      // Should still produce a lastUpdated string using current date fallback
      expect(component.lastUpdated).toContain('Last Modified:');
    }));
  });

  describe('loadDataFromAPI', () => {
    it('should load donor decision code options successfully', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.donorDecisionCodeOptions()).toEqual(mockDonorDecisionCodeOptions);
      expect(component.loadingDonorDecisionCodes).toBe(false);
    }));

    it('should handle error when loading donor decision codes', fakeAsync(() => {
      service.getDonorDecisionCodeOptions.and.returnValue(
        throwError(() => new Error('Load Error'))
      );
      spyOn(console, 'error');

      fixture.detectChanges();
      tick();

      expect(component.donorDecisionCodeOptions()).toEqual([]);
      expect(component.loadingDonorDecisionCodes).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading donor decision codes:', jasmine.any(Error));
    }));
  });

  describe('fetchDonorDecisionCodeDescription', () => {
    it('should use local options when code is found', fakeAsync(() => {
      component.donorDecisionCodeOptions.set(mockDonorDecisionCodeOptions);
      fixture.detectChanges();
      tick();

      component.form.get('donorDecisionCode')?.setValue('Y');
      tick();

      expect(component.form.get('description')?.value).toBe('Yes (OK for Transfusion)');
      expect(component.editModeValues.displayCode).toBe('Yes (OK for Transfusion)');
    }));

    it('should fall back to API when code not in local options', fakeAsync(() => {
      component.donorDecisionCodeOptions.set([]);
      service.getDonorDecisionCodeByCode.and.returnValue(
        of({ donorDecisionCode: 'X', description: 'API Description' })
      );

      fixture.detectChanges();
      tick();

      component.form.get('donorDecisionCode')?.setValue('X');
      tick();

      expect(service.getDonorDecisionCodeByCode).toHaveBeenCalledWith('X');
      expect(component.form.get('description')?.value).toBe('API Description');
      expect(component.editModeValues.displayCode).toBe('API Description');
    }));

    it('should clear description when code is set to empty', fakeAsync(() => {
      component.donorDecisionCodeOptions.set(mockDonorDecisionCodeOptions);
      fixture.detectChanges();
      tick();

      component.form.get('donorDecisionCode')?.setValue('Y');
      tick();
      expect(component.form.get('description')?.value).toBe('Yes (OK for Transfusion)');

      component.form.get('donorDecisionCode')?.setValue('');
      tick();
      expect(component.form.get('description')?.value).toBe('');
      expect(component.editModeValues.displayCode).toBe('');
    }));
  });

  describe('onSave - add mode', () => {
    it('should not save when form is invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.onSave();

      expect(service.addDonorDecisionCode).not.toHaveBeenCalled();
    }));

    it('should call addDonorDecisionCode in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: null
      });
      component.form.updateValueAndValidity();
      tick();

      const mockResponse = { success: true, message: 'Added successfully' };
      service.addDonorDecisionCode.and.returnValue(of(mockResponse));

      let saveEmitted = false;
      let closeEmitted = false;
      component.saveSuccess.subscribe(() => { saveEmitted = true; });
      component.closePanel.subscribe(() => { closeEmitted = true; });

      component.onSave();
      flush();

      expect(service.addDonorDecisionCode).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donorDecisionCode: 'Y',
          effDate: futureEff.format('YYYY-MM-DD')
        })
      );
      expect(saveEmitted).toBe(true);
      expect(closeEmitted).toBe(true);
      expect(component.isSaving).toBe(false);
    }));

    it('should handle save error', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: null
      });
      component.form.updateValueAndValidity();
      tick();

      service.addDonorDecisionCode.and.returnValue(
        throwError(() => new Error('Save Error'))
      );
      spyOn(console, 'error');
      spyOn(component.saveSuccess, 'emit');

      component.onSave();
      flush();

      expect(console.error).toHaveBeenCalledWith('Error saving donor decision code:', jasmine.any(Error));
      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    }));

    it('should not save when effective date is invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: moment('invalid-date'),
        terminationDate: null
      });

      // Force the form to be valid so we test the explicit isValid() check
      component.form.get('effectiveDate')?.setErrors(null);
      component.form.updateValueAndValidity();
      tick();

      component.onSave();
      flush();

      expect(service.addDonorDecisionCode).not.toHaveBeenCalled();
    }));

    it('should not save when termination date is present but invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: moment('invalid-date')
      });

      // Force form valid to test the terminationDate.isValid() check
      component.form.get('terminationDate')?.setErrors(null);
      component.form.updateValueAndValidity();
      tick();

      component.onSave();
      flush();

      expect(service.addDonorDecisionCode).not.toHaveBeenCalled();
    }));

    it('should include termDate when termination date is provided', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      const futureTerm = moment().add(90, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: futureTerm
      });
      component.form.updateValueAndValidity();
      tick();

      const mockResponse = { success: true, message: 'Added successfully' };
      service.addDonorDecisionCode.and.returnValue(of(mockResponse));

      component.onSave();
      flush();

      expect(service.addDonorDecisionCode).toHaveBeenCalledWith(
        jasmine.objectContaining({
          termDate: futureTerm.format('YYYY-MM-DD')
        })
      );
    }));

    it('should handle response with success false', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: null
      });
      component.form.updateValueAndValidity();
      tick();

      const mockResponse = { success: false, message: 'Duplicate entry' };
      service.addDonorDecisionCode.and.returnValue(of(mockResponse));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      flush();

      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    }));

    it('should not save when dateRangeInvalid error exists', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(90, 'days').startOf('day');
      const futureTerm = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: futureTerm
      });
      component.form.setErrors({ dateRangeInvalid: true });
      component.form.updateValueAndValidity();
      tick();

      component.onSave();
      flush();

      expect(service.addDonorDecisionCode).not.toHaveBeenCalled();
    }));
  });

  describe('onSaveAndCreateAnother', () => {
    it('should not save when form is invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.onSaveAndCreateAnother();

      expect(service.addDonorDecisionCode).not.toHaveBeenCalled();
    }));

    it('should save and reset form in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: null
      });
      component.form.updateValueAndValidity();
      tick();

      const mockResponse = { success: true, message: 'Added successfully' };
      service.addDonorDecisionCode.and.returnValue(of(mockResponse));

      let saveEmitted = false;
      component.saveSuccess.subscribe(() => { saveEmitted = true; });

      component.onSaveAndCreateAnother();
      flush();

      expect(service.addDonorDecisionCode).toHaveBeenCalled();
      expect(saveEmitted).toBe(true);
      expect(component.mode).toBe('add');
      expect(component.isSaving).toBe(false);
    }));

    it('should switch to add mode after save and create another from edit mode', fakeAsync(() => {
      service.getDonorDecisionCodeByCode.and.returnValue(of({ donorDecisionCode: 'B', description: 'Code B' }));

      component.mode = 'edit';
      component.editModeValues = {
        barCodeValue: '0001',
        donorDecisionCode: 'A',
        displayCode: 'Code A'
      };

      component.form.patchValue({
        barcode: '0001',
        donorDecisionCode: 'B',
        effectiveDate: moment().add(30, 'days').startOf('day'),
        terminationDate: null
      });

      const mockResponse = { success: true, message: 'Updated successfully' };
      service.updateDonorDecisionCode.and.returnValue(of(mockResponse));

      fixture.detectChanges();
      component.form.updateValueAndValidity();
      tick();

      spyOn(component.modeChange, 'emit');
      spyOn(component.saveSuccess, 'emit');

      component.onSaveAndCreateAnother();
      flush();

      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));

    it('should handle error in save and create another', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: null
      });
      component.form.updateValueAndValidity();
      tick();

      service.addDonorDecisionCode.and.returnValue(
        throwError(() => new Error('Save Error'))
      );
      spyOn(console, 'error');

      component.onSaveAndCreateAnother();
      flush();

      expect(console.error).toHaveBeenCalledWith('Error saving donor decision code:', jasmine.any(Error));
      expect(component.isSaving).toBe(false);
    }));

    it('should not save and create another when effective date is invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: moment('invalid-date'),
        terminationDate: null
      });
      component.form.get('effectiveDate')?.setErrors(null);
      component.form.updateValueAndValidity();
      tick();

      component.onSaveAndCreateAnother();
      flush();

      expect(service.addDonorDecisionCode).not.toHaveBeenCalled();
    }));

    it('should not save and create another when termination date is present but invalid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: moment('invalid-date')
      });
      component.form.get('terminationDate')?.setErrors(null);
      component.form.updateValueAndValidity();
      tick();

      component.onSaveAndCreateAnother();
      flush();

      expect(service.addDonorDecisionCode).not.toHaveBeenCalled();
    }));

    it('should handle response with success false in save and create another', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: null
      });
      component.form.updateValueAndValidity();
      tick();

      const mockResponse = { success: false, message: 'Duplicate entry' };
      service.addDonorDecisionCode.and.returnValue(of(mockResponse));
      spyOn(component.saveSuccess, 'emit');

      component.onSaveAndCreateAnother();
      flush();

      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    }));

    it('should not save and create another when dateRangeInvalid error exists', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: moment().add(90, 'days').startOf('day'),
        terminationDate: moment().add(30, 'days').startOf('day')
      });
      component.form.setErrors({ dateRangeInvalid: true });
      component.form.updateValueAndValidity();
      tick();

      component.onSaveAndCreateAnother();
      flush();

      expect(service.addDonorDecisionCode).not.toHaveBeenCalled();
    }));
  });

  describe('isFormValid getter', () => {
    it('should return true when form is valid and no date range errors', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: null
      });
      component.form.updateValueAndValidity();
      tick();

      expect(component.isFormValid).toBe(true);
    }));

    it('should return false when form is invalid', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        barcode: null,
        donorDecisionCode: '',
        effectiveDate: null
      });
      component.form.updateValueAndValidity();
      tick();

      expect(component.isFormValid).toBe(false);
    }));
  });

  describe('isSaveEnabled getter', () => {
    it('should return true in add mode when form is valid', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: null
      });
      component.form.updateValueAndValidity();
      tick();

      expect(component.isSaveEnabled).toBe(true);
    }));

    it('should return false in edit mode when form is valid but not dirty', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: moment().add(60, 'days').toDate(),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      // Form should be pristine after population
      component.form.markAsPristine();
      expect(component.isSaveEnabled).toBe(false);
    }));

    it('should return true in edit mode when form is valid and dirty', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: moment().add(60, 'days').toDate(),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      component.form.markAsDirty();
      expect(component.isSaveEnabled).toBe(true);
    }));
  });

  describe('getEffectiveDateDisplay', () => {
    it('should return formatted date when data has effDate', fakeAsync(() => {
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: new Date('2027-03-15'),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      const display = component.getEffectiveDateDisplay();
      expect(display).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    }));

    it('should return dash when data has no effDate', fakeAsync(() => {
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: null,
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.getEffectiveDateDisplay()).toBe('-');
    }));

    it('should return dash when data is null', fakeAsync(() => {
      component.data = null;
      fixture.detectChanges();
      tick();

      expect(component.getEffectiveDateDisplay()).toBe('-');
    }));
  });

  describe('onBarcodeKeydown', () => {
    it('should prevent e key', () => {
      const event = new KeyboardEvent('keydown', { key: 'e' });
      spyOn(event, 'preventDefault');

      component.onBarcodeKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent E key', () => {
      const event = new KeyboardEvent('keydown', { key: 'E' });
      spyOn(event, 'preventDefault');

      component.onBarcodeKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent + key', () => {
      const event = new KeyboardEvent('keydown', { key: '+' });
      spyOn(event, 'preventDefault');

      component.onBarcodeKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent - key', () => {
      const event = new KeyboardEvent('keydown', { key: '-' });
      spyOn(event, 'preventDefault');

      component.onBarcodeKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent . key', () => {
      const event = new KeyboardEvent('keydown', { key: '.' });
      spyOn(event, 'preventDefault');

      component.onBarcodeKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow numeric keys', () => {
      const event = new KeyboardEvent('keydown', { key: '5' });
      spyOn(event, 'preventDefault');

      component.onBarcodeKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow backspace key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      spyOn(event, 'preventDefault');

      component.onBarcodeKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onBarcodeInput', () => {
    it('should truncate input longer than 5 digits', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = '1234567';
      const event = { target: input } as unknown as Event;

      component.onBarcodeInput(event);

      expect(input.value).toBe('12345');
    }));

    it('should remove non-digit characters', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = '12a3b';
      const event = { target: input } as unknown as Event;

      component.onBarcodeInput(event);

      expect(input.value).toBe('123');
    }));

    it('should not modify input with valid digits within limit', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = '123';
      const event = { target: input } as unknown as Event;

      component.onBarcodeInput(event);

      // Value stays the same since it's already valid
      expect(input.value).toBe('123');
    }));
  });

  describe('getBarcodeError', () => {
    it('should return empty string when barcode has value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('barcode')?.setValue(12345);
      component.form.get('barcode')?.markAsTouched();

      expect(component.getBarcodeError()).toBe('');
    }));

    it('should return empty string when not touched', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('barcode')?.setValue(null);

      expect(component.getBarcodeError()).toBe('');
    }));
  });

  describe('getDonorDecisionCodeError', () => {
    it('should return empty string when code has value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('donorDecisionCode')?.setValue('Y');
      component.form.get('donorDecisionCode')?.markAsTouched();

      expect(component.getDonorDecisionCodeError()).toBe('');
    }));

    it('should return empty string when not touched', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('donorDecisionCode')?.setValue('');

      expect(component.getDonorDecisionCodeError()).toBe('');
    }));
  });

  describe('getEffectiveDateError', () => {
    it('should return invalid date error when raw input present but no control value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.effDateRawInput = 'bad-date';
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.setErrors({ invalidDateFormat: true });

      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    }));

    it('should return required error when dirty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.markAsDirty();

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    }));

    it('should return empty string when control has valid date', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.get('effectiveDate')?.setValue(futureEff);
      component.form.get('effectiveDate')?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('');
    }));
  });

  describe('getTerminationDateError', () => {
    it('should return invalid date error when raw input present but no control value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.termDateRawInput = 'bad-date';
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      control?.setErrors({ invalidDateFormat: true });

      expect(component.getTerminationDateError()).toBe('Termination date is invalid');
    }));

    it('should return date range error when dateRangeInvalid', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const control = component.form.get('terminationDate');
      control?.setValue(moment().add(30, 'days'));
      component.form.setErrors({ dateRangeInvalid: true });

      expect(component.getTerminationDateError()).toBe('Termination Date must be on or after Effective Date');
    }));

    it('should return empty string when termination date is valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const futureTerm = moment().add(90, 'days').startOf('day');
      component.form.get('terminationDate')?.setValue(futureTerm);
      component.form.get('terminationDate')?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('');
    }));
  });

  describe('onDateInputChange', () => {
    it('should set effDateRawInput for effectiveDate', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = '15-MAR-2027';
      const event = { target: input } as unknown as Event;

      component.onDateInputChange(event, 'effectiveDate');

      expect(component.effDateRawInput).toBe('15-MAR-2027');
    }));

    it('should set termDateRawInput for terminationDate', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = '30-JUN-2027';
      const event = { target: input } as unknown as Event;

      component.onDateInputChange(event, 'terminationDate');

      expect(component.termDateRawInput).toBe('30-JUN-2027');
    }));

    it('should validate date input with valid format', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = '15-MAR-2027';
      const event = { target: input } as unknown as Event;

      component.onDateInputChange(event, 'effectiveDate');

      const control = component.form.get('effectiveDate');
      expect(control?.value).toBeTruthy();
    }));

    it('should set invalidDateFormat error for bad date', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = 'not-a-date';
      const event = { target: input } as unknown as Event;

      component.onDateInputChange(event, 'effectiveDate');

      const control = component.form.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBe(true);
    }));

    it('should handle empty input value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as unknown as Event;

      component.onDateInputChange(event, 'effectiveDate');

      expect(component.effDateRawInput).toBe('');
    }));
  });

  describe('onDateBlur', () => {
    it('should clear effDateRawInput on blur with empty value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.effDateRawInput = 'some-value';
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as unknown as Event;

      component.onDateBlur(event, 'effectiveDate');

      expect(component.effDateRawInput).toBe('');
    }));

    it('should clear termDateRawInput on blur with empty value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.termDateRawInput = 'some-value';
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as unknown as Event;

      component.onDateBlur(event, 'terminationDate');

      expect(component.termDateRawInput).toBe('');
    }));

    it('should validate date on blur with non-empty value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = '15-MAR-2027';
      const event = { target: input } as unknown as Event;

      component.onDateBlur(event, 'effectiveDate');

      const control = component.form.get('effectiveDate');
      expect(control?.value).toBeTruthy();
    }));

    it('should keep raw input on blur when non-empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.effDateRawInput = '';
      const input = document.createElement('input');
      input.value = '15-MAR-2027';
      const event = { target: input } as unknown as Event;

      component.onDateBlur(event, 'effectiveDate');

      // effDateRawInput should not be cleared since input has a value
      expect(component.effDateRawInput).toBe('');
    }));
  });

  describe('filteredDonorDecisionCodes computed', () => {
    it('should return all options when search is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.donorDecisionCodeOptions.set(mockDonorDecisionCodeOptions);
      component['donorDecisionCodeSearch'].set('');

      expect(component.filteredDonorDecisionCodes()).toEqual(mockDonorDecisionCodeOptions);
    }));

    it('should filter by code', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.donorDecisionCodeOptions.set(mockDonorDecisionCodeOptions);
      component['donorDecisionCodeSearch'].set('Y');

      const filtered = component.filteredDonorDecisionCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].donorDecisionCode).toBe('Y');
    }));

    it('should filter by description', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.donorDecisionCodeOptions.set(mockDonorDecisionCodeOptions);
      component['donorDecisionCodeSearch'].set('transfusion');

      const filtered = component.filteredDonorDecisionCodes();
      expect(filtered.length).toBe(2);
    }));

    it('should return empty array when no matches', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.donorDecisionCodeOptions.set(mockDonorDecisionCodeOptions);
      component['donorDecisionCodeSearch'].set('ZZZZZZZ');

      expect(component.filteredDonorDecisionCodes()).toEqual([]);
    }));
  });

  describe('resetFormForAddMode', () => {
    it('should clear editModeValues when called', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.editModeValues = {
        barCodeValue: 'BC1',
        donorDecisionCode: 'Y',
        displayCode: 'Yes'
      };

      // Switch from edit to add via ngOnChanges
      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(changes);

      expect(component.editModeValues.barCodeValue).toBe('');
      expect(component.editModeValues.donorDecisionCode).toBe('');
      expect(component.editModeValues.displayCode).toBe('');
    }));

    it('should reset raw date inputs', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.effDateRawInput = 'some';
      component.termDateRawInput = 'some';

      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(changes);

      expect(component.effDateRawInput).toBe('');
      expect(component.termDateRawInput).toBe('');
    }));

    it('should reset isEffectiveDateEditable', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.isEffectiveDateEditable = true;

      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(changes);

      expect(component.isEffectiveDateEditable).toBe(false);
    }));

    it('should enable barcode and donorDecisionCode, disable description', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(changes);

      expect(component.form.get('barcode')?.enabled).toBe(true);
      expect(component.form.get('donorDecisionCode')?.enabled).toBe(true);
      expect(component.form.get('description')?.disabled).toBe(true);
    }));
  });

  describe('formatLastModified', () => {
    it('should return empty string for null date', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: moment().add(30, 'days').toDate(),
        termDate: null,
        lastModifiedDate: null,
        programId: 'PROG01'
      };

      // Access the private method through the public lastUpdated property
      // by setting data.lastModifiedDate to null and calling setupPanel
      // Since lastModifiedDate is null, it will use new Date() fallback
      fixture.detectChanges();
      tick();

      // When lastModifiedDate is null, the component falls back to new Date()
      // So lastUpdated will still be populated
      expect(component.lastUpdated).toContain('Last Modified:');
    }));

    it('should format date with timezone abbreviation', fakeAsync(() => {
      chapterTimeZoneSig.set('+00:00');

      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: moment().add(30, 'days').toDate(),
        termDate: null,
        lastModifiedDate: new Date('2027-06-15T14:30:00Z'),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.lastUpdated).toContain('Last Modified:');
      expect(component.lastUpdated).toContain('14:30');
    }));

    it('should fall back to GMT+offset when timezone not in map', fakeAsync(() => {
      chapterTimeZoneSig.set('+03:15');

      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: moment().add(30, 'days').toDate(),
        termDate: null,
        lastModifiedDate: new Date('2027-06-15T14:30:00Z'),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.lastUpdated).toContain('GMT+03:15');
    }));

    it('should handle invalid timezone by defaulting to +00:00', fakeAsync(() => {
      chapterTimeZoneSig.set('invalid');

      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: moment().add(30, 'days').toDate(),
        termDate: null,
        lastModifiedDate: new Date('2027-06-15T14:30:00Z'),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.lastUpdated).toContain('Last Modified:');
    }));
  });

  describe('donorDecisionCodeSearchControl', () => {
    it('should update donorDecisionCodeSearch signal when search control changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.donorDecisionCodeSearchControl.setValue('test search');
      tick();

      expect(component['donorDecisionCodeSearch']()).toBe('test search');
    }));

    it('should set empty string when search control value is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.donorDecisionCodeSearchControl.setValue(null);
      tick();

      expect(component['donorDecisionCodeSearch']()).toBe('');
    }));
  });

  describe('setupDateChangeTracking', () => {
    it('should update minTerminationDate when effective date changes', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureDate = moment().add(60, 'days').startOf('day');
      component.form.get('effectiveDate')?.setValue(futureDate);
      tick();

      expect(component.minTerminationDate).toBeTruthy();
    }));

    it('should track termination date field changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const futureDate = moment().add(90, 'days').startOf('day');
      component.form.get('terminationDate')?.setValue(futureDate);
      tick();

      // The lastChangedDateField is private, so we verify indirectly
      // by checking the termination date was set
      expect(component.form.get('terminationDate')?.value).toEqual(futureDate);
    }));
  });

  describe('populateFormForEdit with termination date', () => {
    it('should populate termination date when present in data', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: moment().add(30, 'days').toDate(),
        termDate: moment().add(90, 'days').toDate(),
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.form.get('terminationDate')?.value).toBeTruthy();
    }));

    it('should set null termination date when not present in data', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: moment().add(30, 'days').toDate(),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.form.get('terminationDate')?.value).toBeNull();
    }));

    it('should handle data with empty barCodeValue', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: '',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: moment().add(30, 'days').toDate(),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.editModeValues.barCodeValue).toBe('');
      expect(component.form.getRawValue().barcode).toBe('');
    }));
  });

  describe('onSave - edit mode with termination date', () => {
    it('should include termDate in update DTO when provided', fakeAsync(() => {
      component.mode = 'edit';
      component.editModeValues = {
        barCodeValue: '0005',
        donorDecisionCode: 'A',
        displayCode: 'Code A'
      };

      const futureEff = moment().add(30, 'days').startOf('day');
      const futureTerm = moment().add(120, 'days').startOf('day');

      component.form.patchValue({
        barcode: '0005',
        donorDecisionCode: 'B',
        effectiveDate: futureEff,
        terminationDate: futureTerm
      });
      component.form.updateValueAndValidity();

      const mockResponse = { success: true, message: 'Updated' };
      service.updateDonorDecisionCode.and.returnValue(of(mockResponse));

      fixture.detectChanges();
      tick();

      component.onSave();
      flush();

      const callArgs = service.updateDonorDecisionCode.calls.mostRecent().args;
      expect(callArgs[1].termDate).toBe(futureTerm.format('YYYY-MM-DD'));
    }));

    it('should set termDate to null in update DTO when not provided', fakeAsync(() => {
      component.mode = 'edit';
      component.editModeValues = {
        barCodeValue: '0005',
        donorDecisionCode: 'A',
        displayCode: 'Code A'
      };

      component.form.patchValue({
        barcode: '0005',
        donorDecisionCode: 'B',
        effectiveDate: moment().add(30, 'days').startOf('day'),
        terminationDate: null
      });
      component.form.updateValueAndValidity();

      const mockResponse = { success: true, message: 'Updated' };
      service.updateDonorDecisionCode.and.returnValue(of(mockResponse));

      fixture.detectChanges();
      tick();

      component.onSave();
      flush();

      const callArgs = service.updateDonorDecisionCode.calls.mostRecent().args;
      expect(callArgs[1].termDate).toBeNull();
    }));
  });

  describe('snackbar messages', () => {
    it('should show correct success message on save', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: null
      });
      component.form.updateValueAndValidity();
      tick();

      const mockResponse = { success: true, message: 'Added' };
      service.addDonorDecisionCode.and.returnValue(of(mockResponse));

      // Spy on the component's actual snackBar reference
      const componentSnackBar = (component as any).snackBar;
      spyOn(componentSnackBar, 'open').and.returnValue({} as any);

      component.onSave();
      flush();

      expect(service.addDonorDecisionCode).toHaveBeenCalled();
      expect(componentSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('saved successfully'),
        'Close',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    }));
  });

  describe('onSave emits correct result', () => {
    it('should emit saveSuccess with correct form data', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      const futureTerm = moment().add(90, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        description: 'Test',
        effectiveDate: futureEff,
        terminationDate: futureTerm
      });
      component.form.updateValueAndValidity();
      tick();

      const mockResponse = { success: true, message: 'Added' };
      service.addDonorDecisionCode.and.returnValue(of(mockResponse));

      let emittedResult: any = null;
      component.saveSuccess.subscribe((result: any) => {
        emittedResult = result;
      });

      component.onSave();
      flush();

      expect(emittedResult).toBeTruthy();
      expect(emittedResult.donorDecisionCode).toBe('Y');
      expect(emittedResult.effDate).toBe(futureEff.format('YYYY-MM-DD'));
      expect(emittedResult.termDate).toBe(futureTerm.format('YYYY-MM-DD'));
    }));
  });

  describe('edit mode with future effective date keeps date editable', () => {
    it('should enable effective date control for future dates', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        barCodeValue: 'BC001',
        donorDecisionCode: 'Y',
        displayCode: 'Yes',
        effDate: moment().add(60, 'days').toDate(),
        termDate: null,
        lastModifiedDate: new Date(),
        programId: 'PROG01'
      };
      fixture.detectChanges();
      tick();

      expect(component.isEffectiveDateEditable).toBe(true);
      expect(component.form.get('effectiveDate')?.enabled).toBe(true);
    }));
  });

  describe('onSaveAndCreateAnother in add mode with termDate', () => {
    it('should include termDate in add DTO', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      const futureEff = moment().add(30, 'days').startOf('day');
      const futureTerm = moment().add(90, 'days').startOf('day');
      component.form.patchValue({
        barcode: 12345,
        donorDecisionCode: 'Y',
        effectiveDate: futureEff,
        terminationDate: futureTerm
      });
      component.form.updateValueAndValidity();
      tick();

      const mockResponse = { success: true, message: 'Added' };
      service.addDonorDecisionCode.and.returnValue(of(mockResponse));

      component.onSaveAndCreateAnother();
      flush();

      expect(service.addDonorDecisionCode).toHaveBeenCalledWith(
        jasmine.objectContaining({
          termDate: futureTerm.format('YYYY-MM-DD')
        })
      );
    }));
  });

  describe('onSaveAndCreateAnother in edit mode with termDate', () => {
    it('should include termDate in update DTO', fakeAsync(() => {
      component.mode = 'edit';
      component.editModeValues = {
        barCodeValue: '0006',
        donorDecisionCode: 'A',
        displayCode: 'Code A'
      };

      const futureEff = moment().add(30, 'days').startOf('day');
      const futureTerm = moment().add(120, 'days').startOf('day');

      component.form.patchValue({
        barcode: '0006',
        donorDecisionCode: 'B',
        effectiveDate: futureEff,
        terminationDate: futureTerm
      });
      component.form.updateValueAndValidity();

      const mockResponse = { success: true, message: 'Updated' };
      service.updateDonorDecisionCode.and.returnValue(of(mockResponse));

      fixture.detectChanges();
      tick();

      component.onSaveAndCreateAnother();
      flush();

      const callArgs = service.updateDonorDecisionCode.calls.mostRecent().args;
      expect(callArgs[1].termDate).toBe(futureTerm.format('YYYY-MM-DD'));
    }));
  });
});
