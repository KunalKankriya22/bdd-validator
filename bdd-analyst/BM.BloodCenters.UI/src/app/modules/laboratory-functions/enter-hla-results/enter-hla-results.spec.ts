import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';

import { EnterHlaResults } from './enter-hla-results';
import { HlaResultsService } from './services/hla-results.service';
import { DonorHlaInfo, ValidHlaAntigen } from './models/hla-results.model';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { HeaderService } from '@shared/services/header.service';

describe('EnterHlaResults', () => {
  let mockPageHeaderService: any;
  let component: EnterHlaResults;
  let fixture: ComponentFixture<EnterHlaResults>;
  let hlaResultsServiceSpy: jasmine.SpyObj<HlaResultsService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChangedSubject: Subject<void>;

  const mockDonorInfo: DonorHlaInfo = {
    donorId: 'DN30132192',
    lastName: 'ROGERS',
    firstName: 'SHELIA',
    dateOfBirth: '2002-01-31T00:00:00Z',
    gender: 'Female',
    aboType: 'O Pos',
    collectionDate: '2024-12-08T00:00:00Z',
    prevA1: '2',
    prevA2: '30',
    prevB1: '12',
    prevB2: '54'
  };

  const mockNewDonorInfo: DonorHlaInfo = {
    donorId: 'DN30132193',
    lastName: 'SMITH',
    firstName: 'JOHN',
    dateOfBirth: '1990-05-15T00:00:00Z',
    gender: 'Male',
    aboType: 'A Neg',
    collectionDate: '2024-12-10T00:00:00Z',
    prevA1: null,
    prevA2: null,
    prevB1: null,
    prevB2: null
  };

  const mockAAntigens: ValidHlaAntigen[] = [
    { epitopeId: '01', locus: 'A' },
    { epitopeId: '02', locus: 'A' },
    { epitopeId: '03', locus: 'A' },
    { epitopeId: '30', locus: 'A' }
  ];

  const mockBAntigens: ValidHlaAntigen[] = [
    { epitopeId: '07', locus: 'B' },
    { epitopeId: '08', locus: 'B' },
    { epitopeId: '12', locus: 'B' },
    { epitopeId: '54', locus: 'B' }
  ];

  const pageHeaderDataSignal = signal<{ title: string; subtitle?: string } | null>(null);

  function makeMockValidationResponse(parsedUnitId: string = 'W123456'): UnitValidationResponse {
    return {
      parsedUnitId,
      checkDigit: null,
      codeScheme: 'C',
      manualUnitId: parsedUnitId,
      codabarUnitScheme: 'N',
      entryMode: 'M',
      barcodeType: 'CODABAR',
      chapterScheme: 'C'
    };
  }

  function triggerRetrieve(unitId: string = 'W123456'): void {
    component.onUnitValidated(makeMockValidationResponse(unitId));
  }

  function mockUnitIdField(valid: boolean = true, parsedUnitId: string = 'W123456'): void {
    const mock = {
      isValid: valid,
      parsedUnitId,
      clear: jasmine.createSpy('clear')
    };
    Object.defineProperty(component, 'unitIdField', {
      get: () => mock,
      set: () => {},
      configurable: true
    });
  }

  beforeEach(async () => {
    chapterChangedSubject = new Subject<void>();

    hlaResultsServiceSpy = jasmine.createSpyObj('HlaResultsService', [
      'retrieveDonorByUnitId',
      'retrieveDonorByDonorId',
      'saveHlaResults',
      'updateHlaResults',
      'getValidAntigens'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: pageHeaderDataSignal
    });
    mockPageHeaderService.getTitle.and.returnValue('');
    mockPageHeaderService.getSubtitle.and.returnValue('');

    const mockHeaderService = {
      chapterChanged$: chapterChangedSubject.asObservable()
    };

    hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(of(mockDonorInfo));
    hlaResultsServiceSpy.retrieveDonorByDonorId.and.returnValue(of(mockDonorInfo));
    hlaResultsServiceSpy.getValidAntigens.and.returnValue(of([]));
    hlaResultsServiceSpy.saveHlaResults.and.returnValue(of({
      success: true,
      statusCode: 200,
      message: 'Transaction committed',
      data: [{
        donorId: 'DN30132192',
        chapterId: 'ALL',
        success: true,
        message: 'Transaction committed'
      }],
      total: 1
    }));
    hlaResultsServiceSpy.updateHlaResults.and.returnValue(of({
      success: true,
      statusCode: 200,
      message: 'Transaction committed',
      data: [{
        donorId: 'DN30132192',
        chapterId: 'ALL',
        success: true,
        message: 'Transaction committed'
      }],
      total: 1
    }));

      TestBed.configureTestingModule({
      imports: [EnterHlaResults, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HlaResultsService, useValue: hlaResultsServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
      ]
    });

    

      hlaResultsServiceSpy.retrieveDonorByUnitId.calls.reset();

      hlaResultsServiceSpy.retrieveDonorByDonorId.calls.reset();

      hlaResultsServiceSpy.saveHlaResults.calls.reset();

      hlaResultsServiceSpy.updateHlaResults.calls.reset();

      hlaResultsServiceSpy.getValidAntigens.calls.reset();

      mockPageHeaderService.getTitle.calls.reset();

      mockPageHeaderService.getSubtitle.calls.reset();

      mockPageHeaderService.getTitle.and.returnValue('');

      mockPageHeaderService.getSubtitle.and.returnValue('');

      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(of(mockDonorInfo));

      hlaResultsServiceSpy.retrieveDonorByDonorId.and.returnValue(of(mockDonorInfo));

      hlaResultsServiceSpy.getValidAntigens.and.returnValue(of([]));

    fixture = TestBed.createComponent(EnterHlaResults);
    component = fixture.componentInstance;
    dialogSpy = component['dialog'] as jasmine.SpyObj<MatDialog>;
    spyOn(dialogSpy, 'open');
    mockUnitIdField(false);

    });

  describe('Search / Retrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not retrieve when parsedUnitId is empty', () => {
      component.onUnitValidated(makeMockValidationResponse(''));

      expect(hlaResultsServiceSpy.retrieveDonorByUnitId).not.toHaveBeenCalled();
    });

    it('should auto-retrieve donor when unit is validated', fakeAsync(() => {
      triggerRetrieve('W123456');
      tick();

      expect(hlaResultsServiceSpy.retrieveDonorByUnitId).toHaveBeenCalledWith({ unitId: 'W123456' });
    }));

    it('should set donor info on successful retrieve', fakeAsync(() => {
      triggerRetrieve('W123456');
      tick();

      expect((component as any).donorInfo()).toEqual(mockDonorInfo);
      expect((component as any).hasDonorInfo()).toBeTrue();
    }));

    it('should detect existing record from previous values', fakeAsync(() => {
      triggerRetrieve('W123456');
      tick();

      expect((component as any).isExistingRecord()).toBeTrue();
    }));

    it('should detect new record when no previous values', fakeAsync(() => {
      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(of(mockNewDonorInfo));

      triggerRetrieve('W123456');
      tick();

      expect((component as any).isExistingRecord()).toBeFalse();
    }));

    it('should load valid antigens after successful retrieve', fakeAsync(() => {
      hlaResultsServiceSpy.getValidAntigens.and.callFake((locus: 'A' | 'B') => {
        return of(locus === 'A' ? mockAAntigens : mockBAntigens);
      });

      triggerRetrieve('W123456');
      tick();

      expect(hlaResultsServiceSpy.getValidAntigens).toHaveBeenCalledWith('A');
      expect(hlaResultsServiceSpy.getValidAntigens).toHaveBeenCalledWith('B');
      expect((component as any).validAAntigens().length).toBe(4);
      expect((component as any).validBAntigens().length).toBe(4);
    }));

    it('should reset hla form on new retrieve', fakeAsync(() => {
      component.hlaForm.patchValue({ a1: '01', b1: '07' });

      triggerRetrieve('W123456');
      tick();

      expect(component.hlaForm.get('a1')?.value).toBeNull();
      expect(component.hlaForm.get('b1')?.value).toBeNull();
    }));
  });

  describe('Collection Date Disambiguation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show collection date input when API returns error 9715', fakeAsync(() => {
      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(
        throwError(() => ({
          error: {
            errorCode: '9715',
            errorResponse: { error: 'Multiple donations found' },
            message: 'Multiple donations found'
          }
        }))
      );

      triggerRetrieve('W123456');
      tick();

      expect((component as any).needsCollDate()).toBeTrue();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should re-retrieve with collection date on submit', fakeAsync(() => {
      (component as any).needsCollDate.set(true);
      (component as any).pendingUnitId = 'W123456';
      component.collDateControl.setValue('12082024');

      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(of(mockDonorInfo));

      component.onCollDateSubmit();
      tick();

      expect(hlaResultsServiceSpy.retrieveDonorByUnitId).toHaveBeenCalledWith({
        unitId: 'W123456',
        collDate: '2024-12-08'
      });
      expect((component as any).needsCollDate()).toBeFalse();
    }));

    it('should show error for invalid collection date format', () => {
      (component as any).needsCollDate.set(true);
      (component as any).pendingUnitId = 'W123456';
      // Use digits that form an invalid date (month 99) to bypass auto-formatter
      component.collDateControl.setValue('99991234', { emitEvent: false });

      component.onCollDateSubmit();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid date. Enter collection date as MMDDYYYY.');
    });
  });

  describe('Donor Search Fallback', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open donor search dialog on empty enter', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ action: 'cancel' }) } as any);

      component.onEmptyEnter();

      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should retrieve donor by ID when selected from search dialog', fakeAsync(() => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({ action: 'select', donor: { donorId: 'DN30132192' } })
      } as any);

      hlaResultsServiceSpy.retrieveDonorByDonorId.and.returnValue(of(mockDonorInfo));

      component.openDonorSearch();
      tick();

      expect(hlaResultsServiceSpy.retrieveDonorByDonorId).toHaveBeenCalledWith('DN30132192');
    }));
  });

  describe('HLA Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require A1 and B1 fields', () => {
      component.hlaForm.patchValue({ a1: null, a2: null, b1: null, b2: null });
      expect(component.hlaForm.get('a1')?.hasError('required')).toBeTrue();
      expect(component.hlaForm.get('b1')?.hasError('required')).toBeTrue();

      component.hlaForm.patchValue({ a1: '01', b1: '07' });
      expect(component.hlaForm.valid).toBeTrue();
    });

    it('should validate A2 > A1 using numeric comparison', () => {
      component.hlaForm.patchValue({ a1: '9', a2: '10', b1: '07', b2: null });
      expect(component.hlaForm.get('a2')?.hasError('a2NotGreaterThanA1')).toBeFalse();

      component.hlaForm.patchValue({ a1: '02', a2: '01', b1: '07', b2: null });
      expect(component.hlaForm.get('a2')?.hasError('a2NotGreaterThanA1')).toBeTrue();
    });

    it('should validate B2 > B1 using numeric comparison', () => {
      component.hlaForm.patchValue({ a1: '01', a2: null, b1: '9', b2: '10' });
      expect(component.hlaForm.get('b2')?.hasError('b2NotGreaterThanB1')).toBeFalse();

      component.hlaForm.patchValue({ a1: '01', a2: null, b1: '08', b2: '07' });
      expect(component.hlaForm.get('b2')?.hasError('b2NotGreaterThanB1')).toBeTrue();
    });

    it('should allow valid form with only required fields', () => {
      component.hlaForm.patchValue({ a1: '01', a2: null, b1: '07', b2: null });
      expect(component.hlaForm.valid).toBeTrue();
    });
  });

  describe('Save Functionality', () => {
    beforeEach(fakeAsync(() => {
      mockUnitIdField(true, 'W123456');
      fixture.detectChanges();
      triggerRetrieve('W123456');
      tick();
      fixture.detectChanges();
    }));

    it('should not save when form is invalid', () => {
      component.hlaForm.patchValue({ a1: null, b1: null });
      component.onSave();

      expect(hlaResultsServiceSpy.saveHlaResults).not.toHaveBeenCalled();
      expect(hlaResultsServiceSpy.updateHlaResults).not.toHaveBeenCalled();
    });

    it('should call updateHlaResults for existing records', fakeAsync(() => {
      component.hlaForm.patchValue({ a1: '01', a2: '02', b1: '07', b2: '08' });
      component.onSave();
      tick();

      expect(hlaResultsServiceSpy.updateHlaResults).toHaveBeenCalledWith(
        'DN30132192',
        jasmine.objectContaining({ donorId: 'DN30132192', a1: '01', b1: '07' })
      );
      expect(hlaResultsServiceSpy.saveHlaResults).not.toHaveBeenCalled();
    }));

    it('should call saveHlaResults for new records', fakeAsync(() => {
      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(of(mockNewDonorInfo));
      triggerRetrieve('W999999');
      tick();

      component.hlaForm.patchValue({ a1: '01', a2: '02', b1: '07', b2: '08' });
      component.onSave();
      tick();

      expect(hlaResultsServiceSpy.saveHlaResults).toHaveBeenCalledWith(jasmine.objectContaining({
        donorId: 'DN30132193',
        a1: '01',
        a2: '02',
        b1: '07',
        b2: '08'
      }));
      expect(hlaResultsServiceSpy.updateHlaResults).not.toHaveBeenCalled();
    }));

    it('should show success snackbar after save', fakeAsync(() => {
      component.hlaForm.patchValue({ a1: '01', a2: '02', b1: '07', b2: '08' });
      component.onSave();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('New HLA results saved successfully');
    }));

    it('should show error snackbar on save failure', fakeAsync(() => {
      hlaResultsServiceSpy.updateHlaResults.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { error: 'Validation failed' }, message: 'Validation failed' }
        }))
      );

      component.hlaForm.patchValue({ a1: '01', a2: '02', b1: '07', b2: '08' });
      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Validation failed');
    }));

    it('should clear form after successful save', fakeAsync(() => {
      component.hlaForm.patchValue({ a1: '01', a2: '02', b1: '07', b2: '08' });
      component.onSave();
      tick();

      expect((component as any).donorInfo()).toBeNull();
      expect((component as any).unitIdField.clear).toHaveBeenCalled();
      expect(component.hlaForm.get('a1')?.value).toBeNull();
    }));

    it('should send null for optional empty fields', fakeAsync(() => {
      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(of(mockNewDonorInfo));
      triggerRetrieve('W999999');
      tick();

      component.hlaForm.patchValue({ a1: '01', a2: '', b1: '07', b2: '' });
      component.onSave();
      tick();

      expect(hlaResultsServiceSpy.saveHlaResults).toHaveBeenCalledWith(jasmine.objectContaining({
        a2: null,
        b2: null
      }));
    }));
  });

  describe('Cancel Functionality', () => {
    it('should clear form on cancel', fakeAsync(() => {
      mockUnitIdField(true, 'W123456');
      fixture.detectChanges();
      triggerRetrieve('W123456');
      tick();

      component.onCancel();

      expect((component as any).donorInfo()).toBeNull();
      expect((component as any).unitIdField.clear).toHaveBeenCalled();
    }));
  });

  describe('Date Formatting', () => {
    it('should format dates as DD-MMM-YYYY', () => {
      const formatted = (component as any).formatDate('2024-12-08T00:00:00Z');
      expect(formatted).toMatch(/^\d{2}-[A-Z][a-z]{2}-\d{4}$/);
      expect(formatted).toBe('08-Dec-2024');
    });
  });

  describe('Donor Info Display', () => {
    beforeEach(fakeAsync(() => {
      mockUnitIdField(true, 'W123456');
      fixture.detectChanges();
      triggerRetrieve('W123456');
      tick();
      fixture.detectChanges();
    }));

    it('should display donor information', () => {
      const donorInfo = fixture.debugElement.query(By.css('.donor-info'));
      expect(donorInfo).toBeTruthy();
      expect(donorInfo.nativeElement.textContent).toContain('ROGERS');
      expect(donorInfo.nativeElement.textContent).toContain('SHELIA');
    });

    it('should display previous HLA phenotypes', () => {
      const hlaSections = fixture.debugElement.queryAll(By.css('.hla-section'));
      expect(hlaSections.length).toBeGreaterThanOrEqual(1);

      const prevSection = hlaSections[0];
      expect(prevSection.nativeElement.textContent).toContain('Previous HLA Phenotypes');
      expect(prevSection.nativeElement.textContent).toContain('2');
      expect(prevSection.nativeElement.textContent).toContain('30');
    });

    it('should display current HLA form', () => {
      const hlaSections = fixture.debugElement.queryAll(By.css('.hla-section'));
      expect(hlaSections.length).toBe(2);

      const currentSection = hlaSections[1];
      expect(currentSection.nativeElement.textContent).toContain('Current HLA Phenotypes');
    });

    it('should always show Save button label', () => {
      const saveBtn = fixture.debugElement.query(By.css('.btn-save'));
      expect(saveBtn.nativeElement.textContent.trim()).toContain('Save');
    });

    it('should show dash for missing ABO type', fakeAsync(() => {
      const donorNoAbo: DonorHlaInfo = { ...mockDonorInfo, aboType: null };
      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(of(donorNoAbo));

      component.onCancel();
      mockUnitIdField(true, 'W123456');
      triggerRetrieve('W123456');
      tick();
      fixture.detectChanges();

      const donorInfoEl = fixture.debugElement.query(By.css('.donor-info'));
      expect(donorInfoEl.nativeElement.textContent).toContain('-');
    }));
  });

  describe('Save Button State', () => {
    beforeEach(fakeAsync(() => {
      mockUnitIdField(true, 'W123456');
      fixture.detectChanges();
      triggerRetrieve('W123456');
      tick();
      fixture.detectChanges();
    }));

    it('should disable save when form is not dirty', () => {
      expect((component as any).canSave()).toBeFalse();
    });

    it('should disable save when mandatory fields not filled', () => {
      component.hlaForm.patchValue({ a1: '01', b1: '' });
      expect((component as any).canSave()).toBeFalse();
    });

    it('should enable save when form is dirty and mandatory filled', () => {
      component.hlaForm.patchValue({ a1: '01', b1: '07' });
      expect((component as any).canSave()).toBeTrue();
    });
  });

  describe('Error Message Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error message on retrieve failure', fakeAsync(() => {
      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { error: 'Unit ID does not exist' }, message: 'Unit not found' }
        }))
      );

      triggerRetrieve('INVALID');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Unit ID does not exist');
    }));

    it('should show fallback message when no error details available', fakeAsync(() => {
      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      triggerRetrieve('INVALID');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to retrieve donor information');
    }));
  });

  describe('Form Reset', () => {
    it('should have empty hla form values after cancel on fresh component', () => {
      fixture.detectChanges();
      component.onCancel();

      expect(component.hlaForm.get('a1')?.value).toBeNull();
      expect(component.hlaForm.get('a2')?.value).toBeNull();
      expect(component.hlaForm.get('b1')?.value).toBeNull();
      expect(component.hlaForm.get('b2')?.value).toBeNull();
    });
  });

  describe('Double-Entry Validation', () => {
    beforeEach(fakeAsync(() => {
      mockUnitIdField(true, 'W123456');
      fixture.detectChanges();
      triggerRetrieve('W123456');
      tick();
      fixture.detectChanges();
    }));

    it('should clear A1 field after first entry and prompt for re-entry', fakeAsync(() => {
      component.hlaForm.patchValue({ a1: '01' });
      tick(150); // Wait for setTimeout in handleDoubleEntry

      expect(component.hlaForm.get('a1')?.value).toBe('');
      expect((component as any).doubleEntryState.a1.firstEntry).toBe('01');
      expect((component as any).doubleEntryState.a1.needsSecondEntry).toBeTrue();
      expect(snackbarServiceSpy.showInfo).toHaveBeenCalledWith('Please re-enter A1 for confirmation');
    }));

    it('should accept A1 when second entry matches first entry', fakeAsync(() => {
      component.hlaForm.patchValue({ a1: '01' });
      tick(150);
      component.hlaForm.patchValue({ a1: '01' });
      tick(150);

      expect(component.hlaForm.get('a1')?.value).toBe('01');
      expect((component as any).doubleEntryState.a1.firstEntry).toBeNull();
      expect((component as any).doubleEntryState.a1.needsSecondEntry).toBeFalse();
    }));

    it('should show error and clear A1 when second entry does not match', fakeAsync(() => {
      component.hlaForm.patchValue({ a1: '01' });
      tick(150);
      component.hlaForm.patchValue({ a1: '02' });
      tick(150);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Values do not match. Please re-enter.');
      expect(component.hlaForm.get('a1')?.value).toBe('');
      expect((component as any).doubleEntryState.a1.firstEntry).toBeNull();
      expect((component as any).doubleEntryState.a1.needsSecondEntry).toBeFalse();
    }));

    it('should apply double-entry validation to B1 (required field)', fakeAsync(() => {
      component.hlaForm.patchValue({ b1: '07' });
      tick(150);

      expect(component.hlaForm.get('b1')?.value).toBe('');
      expect((component as any).doubleEntryState.b1.firstEntry).toBe('07');
      expect((component as any).doubleEntryState.b1.needsSecondEntry).toBeTrue();

      component.hlaForm.patchValue({ b1: '07' });
      tick(150);

      expect(component.hlaForm.get('b1')?.value).toBe('07');
    }));

    it('should apply double-entry validation to A2 (optional field)', fakeAsync(() => {
      component.hlaForm.patchValue({ a2: '30' });
      tick(150);

      expect(component.hlaForm.get('a2')?.value).toBe('');
      expect((component as any).doubleEntryState.a2.firstEntry).toBe('30');

      component.hlaForm.patchValue({ a2: '30' });
      tick(150);

      expect(component.hlaForm.get('a2')?.value).toBe('30');
    }));

    it('should apply double-entry validation to B2 (optional field)', fakeAsync(() => {
      component.hlaForm.patchValue({ b2: '54' });
      tick(150);

      expect(component.hlaForm.get('b2')?.value).toBe('');
      expect((component as any).doubleEntryState.b2.firstEntry).toBe('54');

      component.hlaForm.patchValue({ b2: '54' });
      tick(150);

      expect(component.hlaForm.get('b2')?.value).toBe('54');
    }));

    it('should not trigger double-entry if A2 is left empty (optional field)', fakeAsync(() => {
      component.hlaForm.patchValue({ a2: '' });
      tick(150);

      expect((component as any).doubleEntryState.a2.firstEntry).toBeNull();
      expect((component as any).doubleEntryState.a2.needsSecondEntry).toBeFalse();
    }));
  });

  describe('Collection Date Formatting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should auto-format "12252024" to "12/25/2024"', fakeAsync(() => {
      (component as any).needsCollDate.set(true);
      fixture.detectChanges();

      component.collDateControl.setValue('12252024');
      tick();

      expect(component.collDateControl.value).toBe('12/25/2024');
    }));

    it('should format "1225" to "12/25"', fakeAsync(() => {
      (component as any).needsCollDate.set(true);
      fixture.detectChanges();

      component.collDateControl.setValue('1225');
      tick();

      expect(component.collDateControl.value).toBe('12/25');
    }));

    it('should format "12" to "12"', fakeAsync(() => {
      (component as any).needsCollDate.set(true);
      fixture.detectChanges();

      component.collDateControl.setValue('12');
      tick();

      expect(component.collDateControl.value).toBe('12');
    }));

    it('should format "1" to "1"', fakeAsync(() => {
      (component as any).needsCollDate.set(true);
      fixture.detectChanges();

      component.collDateControl.setValue('1');
      tick();

      expect(component.collDateControl.value).toBe('1');
    }));

    it('should strip non-numeric characters during formatting', fakeAsync(() => {
      (component as any).needsCollDate.set(true);
      fixture.detectChanges();

      component.collDateControl.setValue('12/25/2024');
      tick();

      expect(component.collDateControl.value).toBe('12/25/2024');
    }));

    it('should format maximum 8 digits to MM/DD/YYYY', fakeAsync(() => {
      (component as any).needsCollDate.set(true);
      fixture.detectChanges();

      component.collDateControl.setValue('12252024');
      tick();

      expect(component.collDateControl.value).toBe('12/25/2024');
      expect(component.collDateControl.value?.length).toBe(10);
    }));
  });

  describe('Collection Date Staleness Check', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should detect stale pendingUnitId when user changes unit ID while coll date prompt is visible', fakeAsync(() => {
      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(
        throwError(() => ({
          error: {
            errorCode: '9715',
            errorResponse: { error: 'Multiple donations found' },
            message: 'Multiple donations found'
          }
        }))
      );

      triggerRetrieve('W123456');
      tick();

      expect((component as any).needsCollDate()).toBeTrue();
      expect((component as any).pendingUnitId).toBe('W123456');

      mockUnitIdField(true, 'W999999');
      component.collDateControl.setValue('12/25/2024');

      component.onCollDateSubmit();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Unit ID has changed. Please re-enter the collection date.');
      expect((component as any).needsCollDate()).toBeFalse();
    }));

    it('should clear pendingUnitId after successful collection date submit', fakeAsync(() => {
      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(
        throwError(() => ({
          error: {
            errorCode: '9715',
            errorResponse: { error: 'Multiple donations found' }
          }
        }))
      );

      triggerRetrieve('W123456');
      tick();

      expect((component as any).pendingUnitId).toBe('W123456');

      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(of(mockDonorInfo));
      component.collDateControl.setValue('12/08/2024');
      component.onCollDateSubmit();
      tick();

      expect((component as any).pendingUnitId).toBeNull();
    }));

    it('should clear pendingUnitId on successful retrieve', fakeAsync(() => {
      triggerRetrieve('W123456');
      tick();

      expect((component as any).pendingUnitId).toBeNull();
    }));

    it('should clear pendingUnitId on non-9715 error', fakeAsync(() => {
      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(
        throwError(() => ({
          error: {
            errorCode: '9999',
            errorResponse: { error: 'Some other error' }
          }
        }))
      );

      triggerRetrieve('W123456');
      tick();

      expect((component as any).pendingUnitId).toBeNull();
    }));
  });

  describe('Collection Date Parsing', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should parse formatted date "12/25/2024" correctly', fakeAsync(() => {
      (component as any).needsCollDate.set(true);
      (component as any).pendingUnitId = 'W123456';
      mockUnitIdField(true, 'W123456');
      component.collDateControl.setValue('12/25/2024');

      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(of(mockDonorInfo));

      component.onCollDateSubmit();
      tick();

      expect(hlaResultsServiceSpy.retrieveDonorByUnitId).toHaveBeenCalledWith({
        unitId: 'W123456',
        collDate: '2024-12-25'
      });
    }));

    it('should parse unformatted date "12252024" correctly', fakeAsync(() => {
      (component as any).needsCollDate.set(true);
      (component as any).pendingUnitId = 'W123456';
      mockUnitIdField(true, 'W123456');
      component.collDateControl.setValue('12252024');

      hlaResultsServiceSpy.retrieveDonorByUnitId.and.returnValue(of(mockDonorInfo));

      component.onCollDateSubmit();
      tick();

      expect(hlaResultsServiceSpy.retrieveDonorByUnitId).toHaveBeenCalledWith({
        unitId: 'W123456',
        collDate: '2024-12-25'
      });
    }));
  });

  describe('Chapter Change Subscription', () => {
    beforeEach(fakeAsync(() => {
      mockUnitIdField(true, 'W123456');
      fixture.detectChanges();
      triggerRetrieve('W123456');
      tick();
      fixture.detectChanges();
    }));

    it('should clear form when chapter changes', fakeAsync(() => {
      component.hlaForm.patchValue({ a1: '01', b1: '07' });
      expect((component as any).donorInfo()).not.toBeNull();

      chapterChangedSubject.next();
      tick();

      expect((component as any).donorInfo()).toBeNull();
      expect((component as any).unitIdField.clear).toHaveBeenCalled();
      expect(component.hlaForm.get('a1')?.value).toBeNull();
      expect(component.hlaForm.get('b1')?.value).toBeNull();
    }));
  });
});
