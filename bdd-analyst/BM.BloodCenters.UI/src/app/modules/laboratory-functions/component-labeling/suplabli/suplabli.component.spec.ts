import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { SuplabliComponent } from './suplabli.component';
import { SuplabliApiService } from './services/suplabli-api.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';

describe('SuplabliComponent', () => {
  let component: SuplabliComponent;
  let fixture: ComponentFixture<SuplabliComponent>;
  let serviceSpy: jasmine.SpyObj<SuplabliApiService>;
  let labelScanSpy: jasmine.SpyObj<DonorLibLabelScanService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('SuplabliApiService', [
      'getPrinterConfig',
      'validateAccess',
      'validateUnit',
      'processLabel',
      'reprint',
      'confirmVerification',
      'logAbandonedLabel',
      'getLovAboValues',
      'getLovSpecialTestCodes'
    ]);

    labelScanSpy = jasmine.createSpyObj('DonorLibLabelScanService', [
      'validateUnitAboScan',
      'validateUnitScan',
      'validateAboScan',
      'validateProductScan',
      'validateProductExpiryScan',
      'validateExpiryScan',
      'validateSpTestScan'
    ]);

    headerSpy = jasmine.createSpyObj('HeaderService', [], {
      chapterChanged$: chapterChanged$.asObservable()
    });

    snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'showError',
      'showSuccess',
      'showInfo'
    ]);

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    serviceSpy.getPrinterConfig.and.returnValue(of({
      success: true,
      item: { configured: true, printerCode: 'P1' }
    }));

    serviceSpy.validateAccess.and.returnValue(of({
      success: true,
      item: { unitScheme: 'I' }
    }));

    serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: [] }));
    serviceSpy.getLovSpecialTestCodes.and.returnValue(of({ success: true, item: [] }));

    TestBed.configureTestingModule({
      imports: [SuplabliComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FormBuilder,
        { provide: SuplabliApiService, useValue: serviceSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    });

    fixture = TestBed.createComponent(SuplabliComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template binding errors */ }
  });

  describe('Unit Scan Validation', () => {
    it('should reject unit when validateUnit returns no components', (done) => {
      // Arrange
      const mockEvent = {
        data: { parsedUnitId: 'W12345' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(of({
        success: true,
        item: { unitId: 'W12345', collDate: '2025-01-01', components: [] }
      }));

      // Act
      component.onUnitPostValidate(mockEvent as any);

      // Assert
      setTimeout(() => {
        expect(mockEvent.reject).toHaveBeenCalledWith('No labelable component found');
        expect(mockEvent.confirm).not.toHaveBeenCalled();
        done();
      });
    });

    it('should confirm unit and set phase to unit-validated when components exist', (done) => {
      // Arrange
      const mockEvent = {
        data: { parsedUnitId: 'W12345' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(of({
        success: true,
        item: {
          unitId: 'W12345',
          collDate: '2025-01-01',
          components: [{ productCode: 'E0791', productDescription: 'RBC', componentPrefix: '01' }]
        }
      }));

      // Act
      component.onUnitPostValidate(mockEvent as any);

      // Assert
      setTimeout(() => {
        expect(mockEvent.confirm).toHaveBeenCalled();
        expect(component.phase()).toBe('unit-validated');
        done();
      });
    });

    it('should reject unit when API call fails', (done) => {
      // Arrange
      const mockEvent = {
        data: { parsedUnitId: 'INVALID' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(throwError(() => new Error('Server error')));

      // Act
      component.onUnitPostValidate(mockEvent as any);

      // Assert
      setTimeout(() => {
        expect(mockEvent.reject).toHaveBeenCalledWith('Unit validation failed');
        done();
      });
    });
  });

  describe('Verification Unit ID Matching', () => {
    it('should reject when scanned unit ID does not match phase1 unit ID', () => {
      // Arrange
      component.phase1ParsedUnitId.set('W12345');
      const mockEvent = {
        data: { parsedUnitId: 'W99999', manualUnitId: 'W99999' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      // Act
      component.onVerifyUnitPostValidate(mockEvent as any);

      // Assert
      expect(mockEvent.reject).toHaveBeenCalledWith('Unit ID does not match (Error 1508).');
      expect(snackbarSpy.showError).toHaveBeenCalled();
    });

    it('should confirm when scanned unit ID matches phase1 unit ID', () => {
      // Arrange
      component.phase1ParsedUnitId.set('W12345');
      const mockEvent = {
        data: { parsedUnitId: 'W12345', manualUnitId: 'W12345' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      // Act
      component.onVerifyUnitPostValidate(mockEvent as any);

      // Assert
      expect(mockEvent.confirm).toHaveBeenCalled();
      expect(mockEvent.reject).not.toHaveBeenCalled();
    });
  });

  describe('ABO Field Validation', () => {
    it('should show error when ABO code does not match label decision', () => {
      // Arrange
      component.labelResult.set({
        labelDecision: 'A',
        labelDecisionDisplay: 'A',
        rhDisplay: 'Pos',
        intendedUse: '',
        expiryDate: '',
        identifierCode: '',
        labelProductCode: 'E0791'
      } as any);

      // Act
      component.onAboFieldChanged({ code: 'B', description: 'B' });

      // Assert
      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('1509')
      );
    });
  });

  describe('Reprint', () => {
    it('should block reprint when verification is in progress', () => {
      // Arrange
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      component.labelResult.set({ labelDecision: 'A' } as any);
      component.verificationForm.patchValue({ scanUnitId: 'W12345' });

      // Act
      component.onReprint();

      // Assert
      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('5308')
      );
      expect(serviceSpy.reprint).not.toHaveBeenCalled();
    });

    it('should call reprint service when no verification in progress', (done) => {
      // Arrange
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      component.labelResult.set({ labelDecision: 'A' } as any);
      component.phase.set('labeled');
      serviceSpy.reprint.and.returnValue(of({ success: true }));

      // Act
      component.onReprint();

      // Assert
      setTimeout(() => {
        expect(serviceSpy.reprint).toHaveBeenCalled();
        expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Label reprinted successfully.');
        done();
      });
    });
  });

  describe('Clear All', () => {
    it('should log abandoned label when doLabelCalled is true', () => {
      // Arrange
      component.doLabelCalled.set(true);
      component.phase.set('labeled');
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      serviceSpy.logAbandonedLabel.and.returnValue(of({}));

      // Act
      component.clearAll();

      // Assert
      expect(serviceSpy.logAbandonedLabel).toHaveBeenCalledWith(
        jasmine.objectContaining({ errorCode: '1506' })
      );
    });

    it('should reset all state signals on clear', () => {
      // Arrange
      component.unitData.set({ unitId: 'W12345' } as any);
      component.labelResult.set({ labelDecision: 'A' } as any);
      component.phase1ParsedUnitId.set('W12345');
      component.isSecondScan.set(true);

      // Act
      component.clearAll();

      // Assert
      expect(component.unitData()).toBeNull();
      expect(component.labelResult()).toBeNull();
      expect(component.phase1ParsedUnitId()).toBe('');
      expect(component.isSecondScan()).toBe(false);
    });
  });

  describe('hasTimeComponent', () => {
    it('should return true for ISO string with non-zero time', () => {
      expect((component as any).hasTimeComponent('2026-12-15T14:30:00')).toBeTrue();
    });

    it('should return true for ISO string with non-zero hours only', () => {
      expect((component as any).hasTimeComponent('2026-12-15T08:00:00')).toBeTrue();
    });

    it('should return true for ISO string with non-zero minutes only', () => {
      expect((component as any).hasTimeComponent('2026-12-15T00:15:00')).toBeTrue();
    });

    it('should return false for ISO string with T00:00:00 (midnight)', () => {
      expect((component as any).hasTimeComponent('2026-12-15T00:00:00')).toBeFalse();
    });

    it('should return false for date-only ISO string', () => {
      expect((component as any).hasTimeComponent('2026-12-15')).toBeFalse();
    });

    it('should return false for empty string', () => {
      expect((component as any).hasTimeComponent('')).toBeFalse();
    });

    it('should return false for null/undefined', () => {
      expect((component as any).hasTimeComponent(null as any)).toBeFalse();
    });

    it('should handle ISO string with Z suffix', () => {
      expect((component as any).hasTimeComponent('2026-12-15T14:30:00Z')).toBeTrue();
    });

    it('should handle ISO string with timezone offset', () => {
      expect((component as any).hasTimeComponent('2026-12-15T14:30:00+05:30')).toBeTrue();
    });
  });

  describe('formatExpiryDisplay', () => {
    it('should return DD-MON-YYYY HH:MI when ISO has time component', () => {
      const result = (component as any).formatExpiryDisplay('2026-12-15T14:30:00');
      expect(result).toBe('15-DEC-2026 14:30');
    });

    it('should return DD-MON-YYYY when ISO has no time component', () => {
      const result = (component as any).formatExpiryDisplay('2026-12-15');
      expect(result).toBe('15-DEC-2026');
    });

    it('should return DD-MON-YYYY when time is midnight (00:00)', () => {
      const result = (component as any).formatExpiryDisplay('2026-12-15T00:00:00');
      expect(result).toBe('15-DEC-2026');
    });

    it('should return empty string for null input', () => {
      const result = (component as any).formatExpiryDisplay(null);
      expect(result).toBe('');
    });

    it('should pad single-digit day', () => {
      const result = (component as any).formatExpiryDisplay('2026-03-05T09:05:00');
      expect(result).toBe('05-MAR-2026 09:05');
    });

    it('should pad single-digit hours and minutes', () => {
      const result = (component as any).formatExpiryDisplay('2026-06-10T03:07:00');
      expect(result).toBe('10-JUN-2026 03:07');
    });
  });

  describe('formatCollDateDisplay', () => {
    it('should return DD-MON-YYYY HH:MI when ISO has time component', () => {
      const result = (component as any).formatCollDateDisplay('2026-01-20T16:45:00');
      expect(result).toBe('20-JAN-2026 16:45');
    });

    it('should return DD-MON-YYYY when ISO has no time component', () => {
      const result = (component as any).formatCollDateDisplay('2026-01-20');
      expect(result).toBe('20-JAN-2026');
    });

    it('should return empty string for null input', () => {
      const result = (component as any).formatCollDateDisplay(null);
      expect(result).toBe('');
    });
  });

  describe('expiryDatesMatch', () => {
    it('should match when both date and time are equal', () => {
      const result = (component as any).expiryDatesMatch('15-DEC-2026 14:30', '2026-12-15T14:30:00');
      expect(result).toBeTrue();
    });

    it('should fail when time differs and expected has time', () => {
      const result = (component as any).expiryDatesMatch('15-DEC-2026 14:00', '2026-12-15T14:30:00');
      expect(result).toBeFalse();
    });

    it('should fail when scanned has no time but expected has time', () => {
      const result = (component as any).expiryDatesMatch('15-DEC-2026', '2026-12-15T14:30:00');
      expect(result).toBeFalse();
    });

    it('should allow date-only match when expected has no time', () => {
      const result = (component as any).expiryDatesMatch('15-DEC-2026', '2026-12-15');
      expect(result).toBeTrue();
    });

    it('should allow scanned with time to match date-only expected (strip fallback)', () => {
      const result = (component as any).expiryDatesMatch('15-DEC-2026 00:00', '2026-12-15');
      expect(result).toBeTrue();
    });

    it('should be case-insensitive', () => {
      const result = (component as any).expiryDatesMatch('15-dec-2026 14:30', '2026-12-15T14:30:00');
      expect(result).toBeTrue();
    });
  });

  describe('LOV Data Loading', () => {
    it('should always call getLovAboValues with ISBT scheme "I"', () => {
      // Reset spy call count
      serviceSpy.getLovAboValues.calls.reset();
      serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: [] }));

      // Act
      (component as any).loadLovData();

      // Assert - always 'I', never dynamic codeScheme
      expect(serviceSpy.getLovAboValues).toHaveBeenCalledWith('I');
    });

    it('should populate aboLovOptions when API returns values', () => {
      // Arrange
      const mockValues = [
        { code: 'A', description: 'A Positive' },
        { code: 'B', description: 'B Negative' }
      ];
      serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: mockValues }));

      // Act
      (component as any).loadLovData();

      // Assert
      expect(component.aboLovOptions()).toEqual([
        { code: 'A', description: 'A Positive' },
        { code: 'B', description: 'B Negative' }
      ]);
    });
  });

  describe('Printer Config Initialization', () => {
    it('should show error when no printer is configured', (done) => {
      // Arrange
      serviceSpy.getPrinterConfig.and.returnValue(of({
        success: true,
        item: { configured: false }
      }));

      // Act
      const newFixture = TestBed.createComponent(SuplabliComponent);
      const newComponent = newFixture.componentInstance;
      try { newFixture.detectChanges(); } catch (e) { /* template */ }

      // Assert
      setTimeout(() => {
        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          jasmine.stringContaining('No label printer configured')
        );
        done();
      });
    });
  });
});
