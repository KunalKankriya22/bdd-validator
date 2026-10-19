import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { ChangeLabelPrinterComponent } from './change-label-printer';
import { ChangeLabelPrinterService } from './change-label-printer.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  LabelPrinter,
  ProcessingFacility,
  ProcessingFacilityDetail,
  CurrentSettings,
  LabelPrinterContext,
} from './change-label-printer.model';

const STORAGE_KEY = 'labelPrinterContext';

const mockPrinters: LabelPrinter[] = [
  { code: 'LP001', description: 'Label Printer 1', sequence: 1 },
  { code: 'LP002', description: 'Label Printer 2', sequence: 2 },
  { code: 'LP003', description: 'Label Printer 3', sequence: 3 },
];

const mockTieTagPrinters: LabelPrinter[] = [
  { code: 'TT001', description: 'Tie Tag 1', sequence: 1 },
  { code: 'TT002', description: 'Tie Tag 2', sequence: 2 },
];

const mockFacilities: ProcessingFacility[] = [
  { auditKey: 100, collectionId: 'COLL1', registrationNo: 'REG001', name: 'Facility A', licenseNo: 'LIC001', licenseDetails: null },
  { auditKey: 200, collectionId: 'COLL2', registrationNo: 'REG002', name: 'Facility B', licenseNo: 'LIC002', licenseDetails: null },
];

const mockFacilityDetail: ProcessingFacilityDetail = {
  name: 'Facility A',
  address1: '123 Main St',
  cityStateZip: 'Austin TX 78701',
};

const mockCurrentSettings: CurrentSettings = {
  labelPrinterCode: 'LP001',
  tieTagPrinterCode: 'TT001',
  processingFacilityAuditKey: 100,
  serverTimeUtc: '2026-06-20T10:00:00Z',
};

function apiSuccess<T>(data: T) {
  return of({ success: true, message: 'Success', data });
}

function apiError(message: string) {
  return throwError(() => ({ error: { message } }));
}

describe('ChangeLabelPrinterComponent', () => {
  let pageHeaderSpy: any;
  let component: ChangeLabelPrinterComponent;
  let fixture: ComponentFixture<ChangeLabelPrinterComponent>;
  let serviceSpy: jasmine.SpyObj<ChangeLabelPrinterService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let router: Router;
  let navigateSpy: jasmine.Spy;
  let chapterChangedSubject: Subject<void>;
  let activatedRouteStub: { snapshot: { queryParams: Record<string, string> } };

  function createComponent(queryParams: Record<string, string> = {}) {
    activatedRouteStub.snapshot.queryParams = queryParams;
    fixture = TestBed.createComponent(ChangeLabelPrinterComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();
    activatedRouteStub = { snapshot: { queryParams: {} } };

    serviceSpy = jasmine.createSpyObj('ChangeLabelPrinterService', [
      'getLabelPrinters',
      'getTieTagPrinters',
      'getProcessingFacilities',
      'getProcessingFacilityDetails',
      'saveSettings',
    ]);

    snackbarSpy = createMockSnackbarService();

    pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], {
      pageHeaderData: signal(undefined),
    });

    serviceSpy.getLabelPrinters.and.returnValue(apiSuccess(mockPrinters));
    serviceSpy.getTieTagPrinters.and.returnValue(apiSuccess(mockTieTagPrinters));
    serviceSpy.getProcessingFacilities.and.returnValue(apiSuccess(mockFacilities));
    serviceSpy.getProcessingFacilityDetails.and.returnValue(apiSuccess(mockFacilityDetail));
    serviceSpy.saveSettings.and.returnValue(apiSuccess(mockCurrentSettings));

    sessionStorage.removeItem(STORAGE_KEY);



      TestBed.configureTestingModule({
      imports: [ChangeLabelPrinterComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ChangeLabelPrinterService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    });


    


      serviceSpy.getLabelPrinters.calls.reset();


      serviceSpy.getTieTagPrinters.calls.reset();


      serviceSpy.getProcessingFacilities.calls.reset();


      serviceSpy.getProcessingFacilityDetails.calls.reset();


      serviceSpy.saveSettings.calls.reset();


      pageHeaderSpy.getTitle.calls.reset();


      pageHeaderSpy.getSubtitle.calls.reset();


      pageHeaderSpy.getCurrentMenuItem.calls.reset();


      serviceSpy.getLabelPrinters.and.returnValue(apiSuccess(mockPrinters));


      serviceSpy.getTieTagPrinters.and.returnValue(apiSuccess(mockTieTagPrinters));


      serviceSpy.getProcessingFacilities.and.returnValue(apiSuccess(mockFacilities));


      serviceSpy.getProcessingFacilityDetails.and.returnValue(apiSuccess(mockFacilityDetail));


      serviceSpy.saveSettings.and.returnValue(apiSuccess(mockCurrentSettings));


    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    createComponent();


    });

  afterEach(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  });


  // ── Initialization ──────────────────────────────────────────────────────────

  describe('Initialization', () => {
    it('should load label printers on init', () => {
      fixture.detectChanges();
      expect(serviceSpy.getLabelPrinters).toHaveBeenCalled();
      expect(component.labelPrinters()).toEqual(mockPrinters);
    });

    it('should initialize all signals to default values before API response', () => {
      expect(component.currentLabelPrinter()).toBeNull();
      expect(component.currentTieTagPrinter()).toBeNull();
      expect(component.currentProcessingFacility()).toBeNull();
      expect(component.currentProcessingFacilityAuditKey()).toBeNull();
      expect(component.selectedPrinter()).toBeNull();
      expect(component.labelPrinters()).toEqual([]);
      expect(component.tieTagPrinters()).toEqual([]);
      expect(component.showProcessingFacilityDialog()).toBeFalse();
      expect(component.showTieTagPrinterDialog()).toBeFalse();
      expect(component.showConfirmationDialog()).toBeFalse();
    });



    it('should read returnUrl from query params', () => {
      createComponent({ returnUrl: '/some-screen' });
      fixture.detectChanges();
      expect((component as any).returnUrl).toBe('/some-screen');
    });

    it('should set returnUrl to null when not provided', () => {
      fixture.detectChanges();
      expect((component as any).returnUrl).toBeNull();
    });

    it('should reject returnUrl that does not start with /', () => {
      createComponent({ returnUrl: 'https://evil.com' });
      fixture.detectChanges();
      expect((component as any).returnUrl).toBeNull();
    });

    it('should reject protocol-relative returnUrl', () => {
      createComponent({ returnUrl: '//evil.com' });
      fixture.detectChanges();
      expect((component as any).returnUrl).toBeNull();
    });
  });

  // ── Label Printers Loading ──────────────────────────────────────────────────

  describe('Label Printers Loading', () => {
    it('should show info message when no printers are configured', fakeAsync(() => {
      serviceSpy.getLabelPrinters.and.returnValue(
        of({ success: true, message: 'No label printers configured for this warehouse', data: [] }),
      );
      fixture.detectChanges();
      tick();

      expect(component.labelPrinters()).toEqual([]);
      expect(component.currentLabelPrinter()).toBeNull();
      expect(snackbarSpy.showInfo).toHaveBeenCalledWith('No label printers configured for this warehouse');
    }));

    it('should auto-select and save when only one printer exists', fakeAsync(() => {
      const singlePrinter: LabelPrinter[] = [{ code: 'LP001', description: 'Only Printer', sequence: 1 }];
      serviceSpy.getLabelPrinters.and.returnValue(apiSuccess(singlePrinter));
      fixture.detectChanges();
      tick();

      expect(component.selectedPrinter()).toBe('LP001');
      expect(serviceSpy.saveSettings).toHaveBeenCalledWith(
        jasmine.objectContaining({ labelPrinterCode: 'LP001' }),
      );
    }));

    it('should show printer table when multiple printers exist', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.labelPrinters().length).toBe(3);
      expect(component.loading()).toBeFalse();
    }));

    it('should pre-select current printer from sessionStorage when multiple printers exist', fakeAsync(() => {
      const ctx: LabelPrinterContext = { labelPrinterCode: 'LP002', tieTagPrinterCode: null, processingFacilityAuditKey: null };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));

      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.selectedPrinter()).toBe('LP002');
    }));

    it('should not pre-select if stored printer code does not match any loaded printer', fakeAsync(() => {
      const ctx: LabelPrinterContext = { labelPrinterCode: 'INVALID', tieTagPrinterCode: null, processingFacilityAuditKey: null };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));

      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.selectedPrinter()).toBeNull();
    }));



    it('should not show component-level error when API error has no message', fakeAsync(() => {
      serviceSpy.getLabelPrinters.and.returnValue(throwError(() => ({})));
      fixture.detectChanges();
      tick();

      expect(component.loading()).toBeFalse();
      expect(snackbarSpy.showError).not.toHaveBeenCalled();
    }));
  });

  // ── Printer Selection ─────────────────────────────────────────────────────

  describe('Printer Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set selectedPrinter when a printer row is selected', () => {
      component.selectedPrinter.set('LP002');
      expect(component.selectedPrinter()).toBe('LP002');
    });

    it('should do nothing on onSelectPrinter when no printer is selected', () => {
      component.selectedPrinter.set(null);
      component.onSelectPrinter();
      expect(component.showConfirmationDialog()).toBeFalse();
    });

    it('should show confirmation dialog on onSelectPrinter', () => {
      component.selectedPrinter.set('LP001');
      component.onSelectPrinter();

      expect(component.showConfirmationDialog()).toBeTrue();
      expect(component.confirmationMessage()).toContain('LP001');
    });



    it('should save settings on confirm', fakeAsync(() => {
      component.selectedPrinter.set('LP001');
      component.onConfirmSelect();
      tick();

      expect(component.showConfirmationDialog()).toBeFalse();
      expect(serviceSpy.saveSettings).toHaveBeenCalled();
    }));
  });

  // ── Save Settings ─────────────────────────────────────────────────────────

  describe('Save Settings', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call saveSettings API with correct payload', fakeAsync(() => {
      component.selectedPrinter.set('LP002');
      component.currentTieTagPrinter.set('TT001');
      component.currentProcessingFacilityAuditKey.set(100);

      component.onConfirmSelect();
      tick();

      expect(serviceSpy.saveSettings).toHaveBeenCalledWith({
        labelPrinterCode: 'LP002',
        tieTagPrinterCode: 'TT001',
        processingFacilityAuditKey: 100,
      });
    }));

    it('should update current signals from API response on save success', fakeAsync(() => {
      component.selectedPrinter.set('LP001');
      component.onConfirmSelect();
      tick();

      expect(component.currentLabelPrinter()).toBe('LP001');
      expect(component.currentTieTagPrinter()).toBe('TT001');
      expect(component.currentProcessingFacilityAuditKey()).toBe(100);
    }));

    it('should persist settings to sessionStorage on save success', fakeAsync(() => {
      component.selectedPrinter.set('LP001');
      component.onConfirmSelect();
      tick();

      const stored = sessionStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const ctx: LabelPrinterContext = JSON.parse(stored!);
      expect(ctx.labelPrinterCode).toBe('LP001');
      expect(ctx.tieTagPrinterCode).toBe('TT001');
      expect(ctx.processingFacilityAuditKey).toBe(100);
    }));





    it('should not show component-level error on save failure without message', fakeAsync(() => {
      serviceSpy.saveSettings.and.returnValue(throwError(() => ({})));
      component.selectedPrinter.set('LP001');
      component.onConfirmSelect();
      tick();

      expect(component.loading()).toBeFalse();
      expect(snackbarSpy.showError).not.toHaveBeenCalled();
    }));



    it('should send tieTagPrinterCode as undefined when not set', fakeAsync(() => {
      component.selectedPrinter.set('LP001');
      component.currentTieTagPrinter.set(null);
      component.currentProcessingFacilityAuditKey.set(null);
      component.onConfirmSelect();
      tick();

      expect(serviceSpy.saveSettings).toHaveBeenCalledWith({
        labelPrinterCode: 'LP001',
        tieTagPrinterCode: undefined,
        processingFacilityAuditKey: undefined,
      });
    }));
  });

  // ── returnUrl Navigation ──────────────────────────────────────────────────
  // ── sessionStorage (labelPrinterContext) ─────────────────────────────────

  describe('SessionStorage — labelPrinterContext', () => {
    it('should restore all settings from sessionStorage on init', fakeAsync(() => {
      const ctx: LabelPrinterContext = {
        labelPrinterCode: 'LP002',
        tieTagPrinterCode: 'TT001',
        processingFacilityAuditKey: 100,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));

      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.currentLabelPrinter()).toBe('LP002');
      expect(component.currentTieTagPrinter()).toBe('TT001');
      expect(component.currentProcessingFacilityAuditKey()).toBe(100);
      expect(serviceSpy.getProcessingFacilityDetails).toHaveBeenCalledWith(100);
    }));

    it('should not restore when sessionStorage is empty', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.currentLabelPrinter()).toBeNull();
      expect(component.currentTieTagPrinter()).toBeNull();
      expect(component.currentProcessingFacilityAuditKey()).toBeNull();
    }));

    it('should handle corrupted sessionStorage gracefully', fakeAsync(() => {
      sessionStorage.setItem(STORAGE_KEY, 'invalid-json');
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.currentLabelPrinter()).toBeNull();
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    }));

    it('should store as single JSON object with correct shape', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedPrinter.set('LP001');
      component.onConfirmSelect();
      tick();

      const stored = sessionStorage.getItem(STORAGE_KEY);
      const ctx: LabelPrinterContext = JSON.parse(stored!);
      expect(Object.keys(ctx).sort()).toEqual([
        'labelPrinterCode',
        'processingFacilityAuditKey',
        'tieTagPrinterCode',
      ]);
    }));

    it('should load processing facility details when auditKey is in storage', fakeAsync(() => {
      const ctx: LabelPrinterContext = { labelPrinterCode: null, tieTagPrinterCode: null, processingFacilityAuditKey: 100 };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));

      createComponent();
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getProcessingFacilityDetails).toHaveBeenCalledWith(100);
      expect(component.currentProcessingFacility()).toBe('Facility A 123 Main St Austin TX 78701');
    }));


  });

  // ── Chapter Change ────────────────────────────────────────────────────────

  describe('Chapter Change', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear sessionStorage on chapter change', fakeAsync(() => {
      component.selectedPrinter.set('LP001');
      component.onConfirmSelect();
      tick();
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeTruthy();

      serviceSpy.getLabelPrinters.calls.reset();
      chapterChangedSubject.next();
      tick();

      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    }));

    it('should reset all signals on chapter change', fakeAsync(() => {
      component.currentLabelPrinter.set('LP001');
      component.currentTieTagPrinter.set('TT001');
      component.currentProcessingFacilityAuditKey.set(100);
      component.selectedPrinter.set('LP001');
      component.showProcessingFacilityDialog.set(true);

      chapterChangedSubject.next();
      tick();

      expect(component.currentLabelPrinter()).toBeNull();
      expect(component.currentTieTagPrinter()).toBeNull();
      expect(component.currentProcessingFacilityAuditKey()).toBeNull();
      expect(component.currentProcessingFacility()).toBeNull();
      expect(component.selectedPrinter()).toBeNull();
      expect(component.tieTagPrinters()).toEqual([]);
      expect(component.facilityDialogData()).toEqual([]);
      expect(component.showProcessingFacilityDialog()).toBeFalse();
      expect(component.showTieTagPrinterDialog()).toBeFalse();
      expect(component.showConfirmationDialog()).toBeFalse();
      expect(component.showFacilityConfirmDialog()).toBeFalse();
    }));

    it('should reload label printers after chapter change', fakeAsync(() => {
      serviceSpy.getLabelPrinters.calls.reset();
      chapterChangedSubject.next();
      tick();

      expect(serviceSpy.getLabelPrinters).toHaveBeenCalledTimes(1);
    }));
  });

  // ── Processing Facility Dialog ────────────────────────────────────────────

  describe('Processing Facility Dialog', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open dialog and load facilities', fakeAsync(() => {
      component.openProcessingFacilityDialog();
      tick();

      expect(component.showProcessingFacilityDialog()).toBeTrue();
      expect(component.selectedFacility()).toBeNull();
      expect(serviceSpy.getProcessingFacilities).toHaveBeenCalled();
      expect(component.facilityDialogData()).toEqual(mockFacilities);
    }));





    it('should reload facilities on Find click', fakeAsync(() => {
      component.openProcessingFacilityDialog();
      tick();
      serviceSpy.getProcessingFacilities.calls.reset();

      component.onFacilityFind();
      tick();

      expect(serviceSpy.getProcessingFacilities).toHaveBeenCalledTimes(1);
    }));

    it('should set pending facility and show confirm dialog on OK', () => {
      component.selectedFacility.set(mockFacilities[0]);
      component.onFacilityOk();

      expect(component.pendingFacility()).toEqual(mockFacilities[0]);
      expect(component.showProcessingFacilityDialog()).toBeFalse();
      expect(component.showFacilityConfirmDialog()).toBeTrue();
    });

    it('should not set pending facility when none selected', () => {
      component.selectedFacility.set(null);
      component.onFacilityOk();
      expect(component.pendingFacility()).toBeNull();
    });

    it('should confirm facility selection on EXIT', () => {
      component.pendingFacility.set(mockFacilities[0]);
      component.onFacilityConfirmExit();

      expect(component.currentProcessingFacility()).toBe('Facility A');
      expect(component.currentProcessingFacilityAuditKey()).toBe(100);
      expect(component.showFacilityConfirmDialog()).toBeFalse();
      expect(component.pendingFacility()).toBeNull();
    });

    it('should go back to facility dialog on No', () => {
      component.showFacilityConfirmDialog.set(true);
      component.pendingFacility.set(mockFacilities[0]);

      component.onFacilityConfirmNo();

      expect(component.showFacilityConfirmDialog()).toBeFalse();
      expect(component.pendingFacility()).toBeNull();
      expect(component.showProcessingFacilityDialog()).toBeTrue();
    });
  });

  // ── Tie Tag Printer Dialog ────────────────────────────────────────────────

  describe('Tie Tag Printer Dialog', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open dialog and load tie tag printers', fakeAsync(() => {
      component.openTieTagPrinterDialog();
      tick();

      expect(component.showTieTagPrinterDialog()).toBeTrue();
      expect(component.selectedTieTagPrinter()).toBeNull();
      expect(serviceSpy.getTieTagPrinters).toHaveBeenCalled();
      expect(component.tieTagPrinters()).toEqual(mockTieTagPrinters);
    }));





    it('should reload printers on Find click', fakeAsync(() => {
      component.openTieTagPrinterDialog();
      tick();
      serviceSpy.getTieTagPrinters.calls.reset();

      component.onTieTagFind();
      tick();

      expect(serviceSpy.getTieTagPrinters).toHaveBeenCalledTimes(1);
    }));

    it('should set current tie tag printer on OK and close dialog', () => {
      component.selectedTieTagPrinter.set(mockTieTagPrinters[0]);
      component.onTieTagOk();

      expect(component.currentTieTagPrinter()).toBe('TT001');
      expect(component.showTieTagPrinterDialog()).toBeFalse();
    });


  });

  // ── Processing Facility Detail Formatting ─────────────────────────────────

  describe('Facility Address Formatting', () => {
    it('should format full address with all parts', fakeAsync(() => {
      const ctx: LabelPrinterContext = { labelPrinterCode: null, tieTagPrinterCode: null, processingFacilityAuditKey: 100 };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));

      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.currentProcessingFacility()).toBe('Facility A 123 Main St Austin TX 78701');
    }));

    it('should handle null address parts gracefully', fakeAsync(() => {
      const partialDetail: ProcessingFacilityDetail = { name: 'Facility X', address1: null, cityStateZip: null };
      serviceSpy.getProcessingFacilityDetails.and.returnValue(apiSuccess(partialDetail));

      const ctx: LabelPrinterContext = { labelPrinterCode: null, tieTagPrinterCode: null, processingFacilityAuditKey: 100 };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));

      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.currentProcessingFacility()).toBe('Facility X');
    }));
  });

  // ── Component Cleanup ─────────────────────────────────────────────────────
  // ── Auto-Select Single Printer + returnUrl Combined Flow ──────────────────

  describe('Auto-Select with returnUrl', () => {
    it('should auto-select single printer and navigate to returnUrl', fakeAsync(() => {
      const singlePrinter: LabelPrinter[] = [{ code: 'LP001', description: 'Only Printer', sequence: 1 }];
      serviceSpy.getLabelPrinters.and.returnValue(apiSuccess(singlePrinter));

      createComponent({ returnUrl: '/lab/abo-labeling' });
      fixture.detectChanges();
      tick();

      expect(serviceSpy.saveSettings).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/lab/abo-labeling']);
    }));

    it('should not navigate when zero printers and returnUrl is set', fakeAsync(() => {
      serviceSpy.getLabelPrinters.and.returnValue(
        of({ success: true, message: 'No label printers configured for this warehouse', data: [] }),
      );
      createComponent({ returnUrl: '/lab/abo-labeling' });
      fixture.detectChanges();
      tick();

      expect(navigateSpy).not.toHaveBeenCalled();
      expect(snackbarSpy.showInfo).toHaveBeenCalled();
    }));
  });

  // ── Header Config ─────────────────────────────────────────────────────────
});
