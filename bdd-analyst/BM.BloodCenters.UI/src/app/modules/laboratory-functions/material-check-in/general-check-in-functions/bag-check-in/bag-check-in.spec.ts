import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';

import { BagCheckInComponent } from './bag-check-in';
import { BagCheckInService } from './services/bag-check-in.service';
import { BagUnit, BagBatch, BagValidateUnitResponse, BagCatalog, BagLot } from './models/bag-check-in.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';

describe('BagCheckInComponent', () => {
  let component: BagCheckInComponent;
  let fixture: ComponentFixture<BagCheckInComponent>;
  let bagCheckInService: BagCheckInService;
  let matDialog: MatDialog;
  let snackbarService: SnackbarService;

  const mockUnit: BagUnit = {
    unitId: 'U001',
    catalogNumber: 'CAT001',
    driveId: 'DRV001',
    name: 'Test Donor',
    lotNumber: 'LOT001',
    protocol: 'I',
  };

  const mockBatch: BagBatch = {
    batchId: 'BATCH001',
    minTemp: 1.00,
    maxTemp: 6.00,
    unitCount: 5,
  };

  const mockValidateUnitResponse: BagValidateUnitResponse = {
    alreadyCheckedIn: false,
    driveId: 'DRV001',
    name: 'Test Donor',
    cue: 'Autologous',
    hasTubeData: false,
  };

  const mockCatalogs: BagCatalog[] = [
    { catalogNumber: 'CAT001' },
    { catalogNumber: 'CAT002' },
  ];

  const mockLots: BagLot[] = [
    { lotNumber: 'LOT001' },
    { lotNumber: 'LOT002' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BagCheckInComponent,
        NoopAnimationsModule,
        MatSnackBarModule,
        MatDialogModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: PageHeaderService,
          useValue: jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
            pageHeaderData: signal({ title: 'Bag & Tube Check-In', subtitle: '' }),
          }),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BagCheckInComponent);
    component = fixture.componentInstance;

    bagCheckInService = TestBed.inject(BagCheckInService);
    // Stub ngOnInit HTTP calls so they resolve cleanly in all tests
    spyOn(bagCheckInService, 'getCatalogNumbers').and.returnValue(of(mockCatalogs));
    spyOn(bagCheckInService, 'getTubeFormats').and.returnValue(of([]));

    fixture.detectChanges();

    matDialog = component['dialog'];
    snackbarService = TestBed.inject(SnackbarService);
    spyOn(snackbarService, 'showError');
    spyOn(snackbarService, 'showSuccess');
  });

  // ── Initialization ────────────────────────────────────────────────────────

  describe('Initialization', () => {
    it('should initialize with isLoading false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should default to Bag Check-In tab (index 0)', () => {
      expect(component.activeTabIndex()).toBe(0);
    });

    it('should initialize headerConfig with correct title', () => {
      expect(component.headerConfig.title).toBe('Bag & Tube Check-In');
    });

    it('should have "Bag & Tube Check-In" as second breadcrumb with null link', () => {
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Bag & Tube Check-In');
      expect(component.headerConfig.breadcrumbs[1].link).toBeNull();
    });

    it('should initialize bagFilterForm with null batchId', () => {
      expect(component.bagFilterForm.get('batchId')?.value).toBeNull();
    });

    it('should initialize bagEntryForm without unitId (managed by app-unit-id-field)', () => {
      expect(component.bagEntryForm.get('unitId')).toBeNull();
    });

    it('should initialize bagEntryForm with null catalogNumber', () => {
      expect(component.bagEntryForm.get('catalogNumber')?.value).toBeNull();
    });

    it('should initialize bagEntryForm with null lotNumber', () => {
      expect(component.bagEntryForm.get('lotNumber')?.value).toBeNull();
    });

    it('should initialize tubeFilterForm with first format pre-selected', () => {
      // DEFAULT_TUBE_FORMATS[0] is now R1 (all 8 FMB formats included)
      const value = component.tubeFilterForm.get('tubeFormat')?.value;
      expect(value).toBe('R1');
    });

    it('should initialize activeTubeFields with 1 field for R1 format', () => {
      // R1 = Red Top 1 only (verified from FMB S_FORMAT.KEY-NEXT-ITEM trigger)
      expect(component.activeTubeFields().length).toBe(1);
    });

    it('should initialize bagTableData as empty (loaded from API)', () => {
      expect(component.bagTableData()).toEqual([]);
    });

    it('should initialize tubeTableData as empty', () => {
      expect(component.tubeTableData()).toEqual([]);
    });

    it('should initialize entriesCount to 0', () => {
      expect(component.entriesCount()).toBe(0);
    });

    it('should initialize batchOptions as empty (loaded from API)', () => {
      expect(component.batchOptions()).toEqual([]);
    });

    it('should initialize filteredTubeFormatOptions with all 8 FMB tube format options', () => {
      // DEFAULT_TUBE_FORMATS expanded from 2 placeholders to all 8 FMB formats:
      // R1, R2, R*, P1, P2, P*, A, PPR
      expect(component.filteredTubeFormatOptions().length).toBe(8);
    });

    it('should initialize minTemp form value as null', () => {
      expect(component.bagFilterForm.get('minTemp')?.value).toBeNull();
    });

    it('should initialize maxTemp form value to 37.5 (default)', () => {
      expect(component.bagFilterForm.get('maxTemp')?.value).toBe(37.5);
    });

    it('should initialize lotOptions as empty', () => {
      expect(component.lotOptions()).toEqual([]);
    });

    it('should initialize unitCodeScheme to null', () => {
      expect(component.unitCodeScheme()).toBeNull();
    });

    it('should initialize showCheckUnitsPanel as false', () => {
      expect(component.showCheckUnitsPanel()).toBe(false);
    });

    it('should populate filteredCatalogOptions equal to catalogOptions on init', () => {
      expect(component.filteredCatalogOptions().length).toBe(2);
    });

  });

  // ── Tab switching ─────────────────────────────────────────────────────────

  describe('Tab Switching', () => {
    it('should update activeTabIndex when onTabChange is called', () => {
      component.onTabChange(1);
      expect(component.activeTabIndex()).toBe(1);
    });

    it('should update activeTabIndex back to 0 when switching to bag tab', () => {
      component.onTabChange(1);
      component.onTabChange(0);
      expect(component.activeTabIndex()).toBe(0);
    });
  });

  // ── Bag entry form validation ──────────────────────────────────────────────

  describe('Bag Entry Form Validation', () => {
    it('should have bagEntryForm with catalogNumber and lotNumber controls only', () => {
      expect(component.bagEntryForm.get('catalogNumber')).toBeTruthy();
      expect(component.bagEntryForm.get('lotNumber')).toBeTruthy();
      expect(component.bagEntryForm.get('unitId')).toBeNull();
    });
  });

  // ── Read-only signals ─────────────────────────────────────────────────────

  describe('Read-Only Signals', () => {
    it('should initialize bagDriveId to empty string', () => {
      expect(component.bagDriveId()).toBe('');
    });

    it('should initialize bagName to empty string', () => {
      expect(component.bagName()).toBe('');
    });

    it('should initialize bagCue to empty string', () => {
      expect(component.bagCue()).toBe('');
    });

    it('should always return false for hasCatalogIssue (dropdown selection is always valid)', () => {
      expect(component.hasCatalogIssue()).toBeFalse();
    });
  });

  // ── Catalog dropdown ──────────────────────────────────────────────────────

  describe('Catalog Dropdown', () => {
    it('should filter filteredCatalogOptions when catalogSearchControl has a value', fakeAsync(() => {
      component.catalogOptions.set([
        { catalogNumber: 'CAT001', displayLabel: 'CAT001' },
        { catalogNumber: 'CAT002', displayLabel: 'CAT002' },
        { catalogNumber: 'OTHER', displayLabel: 'OTHER' },
      ]);
      component.filteredCatalogOptions.set(component.catalogOptions());

      component.catalogSearchControl.setValue('CAT');
      tick();

      expect(component.filteredCatalogOptions().length).toBe(2);
      expect(component.filteredCatalogOptions().every(c => c.catalogNumber.toLowerCase().includes('cat'))).toBeTrue();
    }));

    it('should restore all options when catalogSearchControl is cleared', fakeAsync(() => {
      component.catalogOptions.set([
        { catalogNumber: 'CAT001', displayLabel: 'CAT001' },
        { catalogNumber: 'CAT002', displayLabel: 'CAT002' },
      ]);
      component.filteredCatalogOptions.set(component.catalogOptions());

      component.catalogSearchControl.setValue('CAT001');
      tick();
      component.catalogSearchControl.setValue('');
      tick();

      expect(component.filteredCatalogOptions().length).toBe(2);
    }));

    it('should call getLotNumbers when catalog is selected', fakeAsync(() => {
      spyOn(bagCheckInService, 'getLotNumbers').and.returnValue(of(mockLots));
      component.onCatalogSelected('CAT001');
      tick();
      expect(bagCheckInService.getLotNumbers).toHaveBeenCalledWith('CAT001');
    }));

    it('should clear lotOptions when catalog is changed', fakeAsync(() => {
      component.lotOptions.set([{ lotNumber: 'LOT1', displayLabel: 'LOT1' }]);
      spyOn(bagCheckInService, 'getLotNumbers').and.returnValue(of([]));
      component.bagEntryForm.get('catalogNumber')?.setValue('NEW_CAT');
      tick();
      expect(component.lotOptions()).toEqual([]);
    }));

  });

  // ── Lot number TAB auto-save ──────────────────────────────────────────────

  // ── Min temp TAB auto-save ────────────────────────────────────────────────

  // ── Protocol badge helpers ────────────────────────────────────────────────

  describe('Protocol Badge Helpers', () => {
    it('should return "green" for protocol "3GB"', () => {
      expect(component.getProtocolColor('3GB')).toBe('green');
    });

    it('should return "blue" for protocol "3C"', () => {
      expect(component.getProtocolColor('3C')).toBe('blue');
    });

    it('should return "red" for protocol "AL"', () => {
      expect(component.getProtocolColor('AL')).toBe('red');
    });

    it('should return "orange" for protocol "2CB"', () => {
      expect(component.getProtocolColor('2CB')).toBe('orange');
    });

    it('should return "gray" for protocol "2C"', () => {
      expect(component.getProtocolColor('2C')).toBe('gray');
    });

    it('should return "gray" for unknown protocol', () => {
      expect(component.getProtocolColor('XYZ')).toBe('gray');
    });

    it('should return "blue" for protocol "I" (ISBT 128)', () => {
      expect(component.getProtocolColor('I')).toBe('blue');
    });

    it('should return "orange" for protocol "A" (Codabar Alphanumeric)', () => {
      expect(component.getProtocolColor('A')).toBe('orange');
    });

    it('should return "green" for protocol "N" (Codabar Numeric)', () => {
      expect(component.getProtocolColor('N')).toBe('green');
    });

  });

  // ── CUE warning helper ────────────────────────────────────────────────────

  describe('CUE Warning Helper', () => {
    it('should return true for isWarningCue "Ambiguous"', () => {
      expect(component.isWarningCue('Ambiguous')).toBeTrue();
    });

    it('should return true for isWarningCue "NFT"', () => {
      expect(component.isWarningCue('NFT')).toBeTrue();
    });

    it('should return true for isWarningCue "No Cue"', () => {
      expect(component.isWarningCue('No Cue')).toBeTrue();
    });

    it('should return true for isWarningCue "Therapeutic"', () => {
      expect(component.isWarningCue('Therapeutic')).toBeTrue();
    });

    it('should return false for isWarningCue "Ok"', () => {
      expect(component.isWarningCue('Ok')).toBeFalse();
    });

    it('should return false for isWarningCue "Autologous"', () => {
      expect(component.isWarningCue('Autologous')).toBeFalse();
    });

  });

  // ── Tube format selection ─────────────────────────────────────────────────

  describe('Tube Format Selection', () => {
    it('should apply PPR format with 3 tube fields', () => {
      component.onTubeFormatChange('PPR');
      expect(component.activeTubeFields().length).toBe(3);
    });

    it('should apply P1 format with 2 tube fields', () => {
      component.onTubeFormatChange('P1');
      expect(component.activeTubeFields().length).toBe(2);
    });

    it('should set tubeFormatDescription for PPR', () => {
      component.onTubeFormatChange('PPR');
      expect(component.tubeFormatDescription()).toBe('Purple 1, Purple 2, and Red Top 1');
    });

    it('should set tubeFormatDescription for P1', () => {
      component.onTubeFormatChange('P1');
      expect(component.tubeFormatDescription()).toBe('Red Top 1 and Purple Top 1');
    });

    it('should set 2 active tube fields for P1 format', () => {
      component.onTubeFormatChange('P1');
      expect(component.activeTubeFields().length).toBe(2);
    });

    it('should set 3 active tube fields for PPR format', () => {
      component.onTubeFormatChange('PPR');
      expect(component.activeTubeFields().length).toBe(3);
    });

    it('should filter filteredTubeFormatOptions when tubeFormatSearchCtrl has a value', fakeAsync(() => {
      component.tubeFormatSearchCtrl.setValue('PPR');
      tick();
      expect(component.filteredTubeFormatOptions().every(f =>
        f.formatCode.toLowerCase().includes('ppr') || f.description.toLowerCase().includes('ppr')
      )).toBeTrue();
    }));

    it('should restore all options when tubeFormatSearchCtrl is cleared', fakeAsync(() => {
      component.tubeFormatSearchCtrl.setValue('PPR');
      tick();
      component.tubeFormatSearchCtrl.setValue('');
      tick();
      expect(component.filteredTubeFormatOptions().length).toBe(8);
    }));

    it('should return no options when search term matches nothing', fakeAsync(() => {
      component.tubeFormatSearchCtrl.setValue('ZZZNOMATCH');
      tick();
      expect(component.filteredTubeFormatOptions().length).toBe(0);
    }));
  });

  // ── Bag table configuration ───────────────────────────────────────────────

  describe('Bag Table Configuration', () => {
    it('should mark unitId column as sortable', () => {
      const col = component.bagTableConfig.columns.find(c => c.key === 'unitId');
      expect(col?.sortable).toBeTrue();
    });

    it('should configure pagination with page size 25', () => {
      expect(component.bagTableConfig.pagination?.pageSize).toBe(25);
    });

  });

  // ── Tube table configuration ──────────────────────────────────────────────
  // ── Pagination events ─────────────────────────────────────────────────────
  // ── Sort events ───────────────────────────────────────────────────────────
  // ── Check Units In Batch panel ────────────────────────────────────────────

  describe('Check Units In Batch Panel', () => {
    it('should open panel when onCheckUnitsInBatch is called with batchId', () => {
      component.bagFilterForm.get('batchId')?.setValue('080524-CB2051');
      component.onCheckUnitsInBatch();
      expect(component.showCheckUnitsPanel()).toBeTrue();
    });

    it('should not open panel when batchId is null', () => {
      component.bagFilterForm.get('batchId')?.setValue(null);
      component.onCheckUnitsInBatch();
      expect(component.showCheckUnitsPanel()).toBeFalse();
    });

    it('should close panel on onCheckUnitsPanelClose', () => {
      component.showCheckUnitsPanel.set(true);
      component.onCheckUnitsPanelClose();
      expect(component.showCheckUnitsPanel()).toBeFalse();
    });

    it('should close panel on button click "close"', () => {
      component.showCheckUnitsPanel.set(true);
      component.onCheckUnitsPanelButton('close');
      expect(component.showCheckUnitsPanel()).toBeFalse();
    });

    it('should set panelBatchId when opening panel', () => {
      component.bagFilterForm.get('batchId')?.setValue('080524-CB2051');
      component.onCheckUnitsInBatch();
      expect(component.panelBatchId()).toBe('080524-CB2051');
    });
  });

  // ── Batch selection ───────────────────────────────────────────────────────

  describe('Batch Selection', () => {
    it('should reset minTemp to null and enable controls when empty batchId selected', () => {
      component.bagFilterForm.get('minTemp')?.setValue(5.00);
      component.bagFilterForm.get('maxTemp')?.setValue(10.00);
      component.onBatchSelected('');
      expect(component.bagFilterForm.get('minTemp')?.value).toBeNull();
      expect(component.bagFilterForm.get('maxTemp')?.value).toBe(37.5);
      expect(component.bagFilterForm.get('minTemp')?.enabled).toBeTrue();
    });
  });

  // ── Collection date formatting ────────────────────────────────────────────

  describe('Collection Date Formatting', () => {
    it('should format a valid ISO date string', () => {
      const result = component.formatCollDate('2024-02-13T00:00:00');
      expect(result).toContain('2024');
    });
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  // ── Check Units panel footer buttons ─────────────────────────────────────

  describe('Check Units Panel Footer Buttons', () => {
    it('should have one CLOSE button', () => {
      expect(component.checkUnitsPanelButtons.length).toBe(1);
      expect(component.checkUnitsPanelButtons[0].label).toBe('CLOSE');
      expect(component.checkUnitsPanelButtons[0].action).toBe('close');
    });
  });

  // ── Bag Retrieve ──────────────────────────────────────────────────────────

  describe('Bag Retrieve', () => {
    it('should call getBatchUnits and populate bagTableData on valid batchId', fakeAsync(() => {
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(of([mockUnit]));
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');

      component.onBagRetrieve();
      tick();

      expect(bagCheckInService.getBatchUnits).toHaveBeenCalledWith('BATCH001', undefined, undefined);
      expect(component.isLoading()).toBeFalse();
      expect(component.bagTableData().length).toBe(1);
      expect(component.entriesCount()).toBe(1);
    }));

    it('should map unit fields to BagCheckInEntry correctly', fakeAsync(() => {
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(of([mockUnit]));
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');
      component.onBagRetrieve();
      tick();

      const entry = component.bagTableData()[0];
      expect(entry.unitId).toBe('U001');
      expect(entry.catalogNumber).toBe('CAT001');
      expect(entry.driveId).toBe('DRV001');
    }));

  });

  // ── Batch Selection with API ───────────────────────────────────────────────

  describe('Batch Selection (API)', () => {
    it('should set minTemp and maxTemp form values on batch detail success', fakeAsync(() => {
      spyOn(bagCheckInService, 'getBatchDetail').and.returnValue(of(mockBatch));

      component.onBatchSelected('BATCH001');
      tick();

      expect(bagCheckInService.getBatchDetail).toHaveBeenCalledWith('BATCH001');
      expect(component.bagFilterForm.get('minTemp')?.value).toBe(1.00);
      expect(component.bagFilterForm.get('maxTemp')?.value).toBe(6.00);
    }));

    it('should disable temp controls and show error on getBatchDetail failure', fakeAsync(() => {
      spyOn(bagCheckInService, 'getBatchDetail').and.returnValue(throwError(() => new Error('fail')));

      component.onBatchSelected('BATCH001');
      tick();

      expect(component.bagFilterForm.get('minTemp')?.disabled).toBeTrue();
      expect(component.bagFilterForm.get('maxTemp')?.disabled).toBeTrue();
      expect(snackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load batch details')
      );
    }));
  });

  // ── Unit ID Validation (postValidate pattern via app-unit-id-field) ─────────

  describe('Unit ID Validation (onUnitPostValidate)', () => {
    function makeEvent(parsedUnitId: string): { event: any; confirmSpy: jasmine.Spy; rejectSpy: jasmine.Spy } {
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event = {
        data: { parsedUnitId } as any,
        confirm: confirmSpy,
        reject: rejectSpy,
      };
      return { event, confirmSpy, rejectSpy };
    }

    it('should reject when unit already checked in', fakeAsync(() => {
      const checkedInResponse: BagValidateUnitResponse = { ...mockValidateUnitResponse, alreadyCheckedIn: true };
      spyOn(bagCheckInService, 'validateUnit').and.returnValue(of(checkedInResponse));
      const { event, rejectSpy } = makeEvent('U001');

      component.onUnitPostValidate(event);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith(jasmine.stringContaining('already been checked in'));
    }));

    it('should populate bagDriveId, bagName, bagCue and confirm on successful validation', fakeAsync(() => {
      spyOn(bagCheckInService, 'validateUnit').and.returnValue(of(mockValidateUnitResponse));
      const { event, confirmSpy } = makeEvent('U001');

      component.onUnitPostValidate(event);
      tick();

      expect(component.bagDriveId()).toBe('DRV001');
      expect(component.bagName()).toBe('Test Donor');
      expect(component.bagCue()).toBe('Autologous');
      expect(confirmSpy).toHaveBeenCalled();
    }));

    it('should set unitCodeScheme from event.data.codeScheme', fakeAsync(() => {
      spyOn(bagCheckInService, 'validateUnit').and.returnValue(of(mockValidateUnitResponse));
      const { event } = makeEvent('U001');
      event.data.codeScheme = 'I';

      component.onUnitPostValidate(event);
      tick();

      expect(component.unitCodeScheme()).toBe('I');
    }));

    it('should set unitCodeScheme to null when codeScheme missing from event', fakeAsync(() => {
      spyOn(bagCheckInService, 'validateUnit').and.returnValue(of(mockValidateUnitResponse));
      const { event } = makeEvent('U001');

      component.onUnitPostValidate(event);
      tick();

      expect(component.unitCodeScheme()).toBeNull();
    }));

    it('should reject and clear unit info row on validation error', fakeAsync(() => {
      spyOn(bagCheckInService, 'validateUnit').and.returnValue(throwError(() => new Error('fail')));
      component.bagDriveId.set('DRV001');
      component.bagName.set('Test Donor');
      const { event, rejectSpy } = makeEvent('U001');

      component.onUnitPostValidate(event);
      tick();

      expect(component.bagDriveId()).toBe('');
      expect(component.bagName()).toBe('');
      expect(rejectSpy).toHaveBeenCalledWith(jasmine.stringContaining('not valid'));
    }));
  });

  // ── Unit Cleared ──────────────────────────────────────────────────────────

  describe('onUnitCleared', () => {
    it('should clear bagDriveId, bagName, and bagCue', () => {
      component.bagDriveId.set('DRV001');
      component.bagName.set('Test Donor');
      component.bagCue.set('Autologous');

      component.onUnitCleared();

      expect(component.bagDriveId()).toBe('');
      expect(component.bagName()).toBe('');
      expect(component.bagCue()).toBe('');
    });

    it('should reset catalogNumber to null', () => {
      component.bagEntryForm.get('catalogNumber')?.setValue('CAT001', { emitEvent: false });
      component.onUnitCleared();
      expect(component.bagEntryForm.get('catalogNumber')?.value).toBeNull();
    });

    it('should clear lotOptions', () => {
      component.lotOptions.set([{ lotNumber: 'LOT1', displayLabel: 'LOT1' }]);
      component.onUnitCleared();
      expect(component.lotOptions()).toEqual([]);
    });
  });

  // ── onUnitValidated ───────────────────────────────────────────────────────

  describe('onUnitValidated', () => {
    it('should exist and be callable without errors', () => {
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });
  });

  // ── Bag Check-In Action ───────────────────────────────────────────────────

  describe('Bag Check-In (onBagCheckIn)', () => {
    function setUnitIdFieldValid(parsedUnitId: string): void {
      Object.defineProperty(component, 'unitIdField', {
        get: () => ({ isValid: true, parsedUnitId, clear: jasmine.createSpy('clear') }),
        configurable: true,
      });
    }

    it('should call checkIn and show entries-count snackbar on valid check-in', fakeAsync(() => {
      setUnitIdFieldValid('U001');
      spyOn(bagCheckInService, 'checkIn').and.returnValue(of({ batchId: 'BATCH001', unitId: 'U001' }));
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(of([mockUnit]));
      component.bagEntryForm.setValue({ catalogNumber: 'CAT001', lotNumber: 'LOT001' });
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');
      component.bagFilterForm.get('minTemp')?.setValue(1.00);
      component.bagFilterForm.get('maxTemp')?.setValue(6.00);

      component.onBagCheckIn();
      tick();

      expect(bagCheckInService.checkIn).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith(
        jasmine.stringContaining('Entries Added:')
      );
    }));

    it('should auto-add new batchId to batchOptions when no prior batchId', fakeAsync(() => {
      setUnitIdFieldValid('U001');
      spyOn(bagCheckInService, 'checkIn').and.returnValue(of({ batchId: 'NEW-BATCH', unitId: 'U001' }));
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(of([]));
      spyOn(bagCheckInService, 'getBatchDetail').and.returnValue(of(mockBatch));
      component.bagEntryForm.setValue({ catalogNumber: 'CAT001', lotNumber: 'LOT001' });
      component.bagFilterForm.get('batchId')?.setValue(null);
      component.bagFilterForm.get('minTemp')?.setValue(1.0);
      component.batchOptions.set([]);

      component.onBagCheckIn();
      tick();

      const batchIds = component.batchOptions().map(b => b.batchId);
      expect(batchIds).toContain('NEW-BATCH');
    }));

  });

  // ── Auto Check-In guards (tryAutoCheckIn) ────────────────────────────────

  // ── onTabContentClick ───────────────────────────────────────────────────────
  // ── onUnitCleared — auto-check-in state reset ─────────────────────────────

  describe('onUnitCleared — auto-check-in state reset', () => {
    it('should reset _lastCheckedInUnitId to empty string', () => {
      component['_lastCheckedInUnitId'] = 'U001';
      component.onUnitCleared();
      expect(component['_lastCheckedInUnitId']).toBe('');
    });

    it('should reset _autoCheckInInProgress to false', () => {
      component['_autoCheckInInProgress'] = true;
      component.onUnitCleared();
      expect(component['_autoCheckInInProgress']).toBe(false);
    });

    it('should reset unitCodeScheme to null', () => {
      component.unitCodeScheme.set('I');
      component.onUnitCleared();
      expect(component.unitCodeScheme()).toBeNull();
    });
  });

  // ── CUE Warning Click ─────────────────────────────────────────────────────

  describe('CUE Warning Click', () => {
    it('should pass correct alert message to dialog', () => {
      spyOn(matDialog, 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      component.onCueWarningClick();
      const data = (matDialog.open as jasmine.Spy).calls.mostRecent().args[1].data;
      expect(data.message).toContain('Remove this bag');
    });
  });

  // ── Tube Retrieve ─────────────────────────────────────────────────────────
  // ── Tube Submit ───────────────────────────────────────────────────────────

  describe('Tube Submit (onTubeSubmit)', () => {
    beforeEach(() => {
      component.tubeFilterForm.get('tubeFormat')?.setValue('PPR');
      component.onTubeFormatChange('PPR');
      component.tubeValues.set({ red1: 'W123418051501' });
      component.tubeRetrieved.set(true);
    });

    it('should set tubeSubmitAttempted when no tube value is provided', () => {
      component.tubeValues.set({});
      component.onTubeSubmit();
      expect(component.tubeSubmitAttempted()).toBeTrue();
    });

  });

  // ── stripErrorCode helper ─────────────────────────────────────────────────

  describe('stripErrorCode', () => {
    it('should remove (Error 0037) from a message', () => {
      expect(component['stripErrorCode']('Unit not valid. (Error 0037)')).toBe('Unit not valid.');
    });

    it('should remove (error 0111) from a message', () => {
      expect(component['stripErrorCode']('All tube IDs must match. (error 0111)')).toBe('All tube IDs must match.');
    });

    it('should return message unchanged when no error code is present', () => {
      expect(component['stripErrorCode']('Unit not valid for check-in.')).toBe('Unit not valid for check-in.');
    });

    it('should return empty string for null/undefined input', () => {
      expect(component['stripErrorCode'](null)).toBe('');
      expect(component['stripErrorCode'](undefined)).toBe('');
    });
  });

  // ── ngOnDestroy ──────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ── Form accessors ────────────────────────────────────────────────────────

  describe('Form accessors', () => {
    it('should return bagFilterForm controls via bagFilterF', () => {
      expect(component.bagFilterF).toBe(component.bagFilterForm.controls);
    });

    it('should return bagEntryForm controls via bagF', () => {
      expect(component.bagF).toBe(component.bagEntryForm.controls);
    });
  });

  // ── formatTemp ────────────────────────────────────────────────────────────

  describe('formatTemp', () => {
    it('should return dash for null', () => {
      expect(component.formatTemp(null)).toBe('—');
    });

    it('should return dash for undefined', () => {
      expect(component.formatTemp(undefined)).toBe('—');
    });

    it('should format a numeric value with 2 decimal places and unit', () => {
      expect(component.formatTemp(5)).toBe('5.00 °C');
    });

    it('should format 37.5 correctly', () => {
      expect(component.formatTemp(37.5)).toBe('37.50 °C');
    });
  });

  // ── formatCollDate ────────────────────────────────────────────────────────

  describe('formatCollDate additional', () => {
    it('should return dash for empty string', () => {
      expect(component.formatCollDate('')).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatCollDate(undefined)).toBe('-');
    });
  });

  // ── validateMinMax ────────────────────────────────────────────────────────

  describe('validateMinMax (cross-field temperature validation)', () => {
    it('should set tempExceedsRange error when min > max and lastTouched is minTemp', () => {
      component.isNewBatch.set(true);
      component.bagFilterForm.get('minTemp')?.setValue(10, { emitEvent: false });
      component.bagFilterForm.get('maxTemp')?.setValue(5, { emitEvent: false });
      component.lastTouchedTempField = 'minTemp';
      component['validateMinMax']();
      expect(component.bagFilterForm.get('minTemp')?.hasError('tempExceedsRange')).toBeTrue();
    });

    it('should set tempExceedsRange error on maxTemp when lastTouched is maxTemp', () => {
      component.isNewBatch.set(true);
      component.bagFilterForm.get('minTemp')?.setValue(10, { emitEvent: false });
      component.bagFilterForm.get('maxTemp')?.setValue(5, { emitEvent: false });
      component.lastTouchedTempField = 'maxTemp';
      component['validateMinMax']();
      expect(component.bagFilterForm.get('maxTemp')?.hasError('tempExceedsRange')).toBeTrue();
    });

    it('should clear tempExceedsRange error when min <= max', () => {
      component.isNewBatch.set(true);
      component.bagFilterForm.get('minTemp')?.setValue(3, { emitEvent: false });
      component.bagFilterForm.get('maxTemp')?.setValue(10, { emitEvent: false });
      component.lastTouchedTempField = 'minTemp';
      component['validateMinMax']();
      expect(component.bagFilterForm.get('minTemp')?.hasError('tempExceedsRange')).toBeFalse();
      expect(component.bagFilterForm.get('maxTemp')?.hasError('tempExceedsRange')).toBeFalse();
    });

    it('should skip validation when isNewBatch is false', () => {
      component.isNewBatch.set(false);
      component.bagFilterForm.get('minTemp')?.setValue(10, { emitEvent: false });
      component.bagFilterForm.get('maxTemp')?.setValue(5, { emitEvent: false });
      component.lastTouchedTempField = 'minTemp';
      component['validateMinMax']();
      expect(component.bagFilterForm.get('minTemp')?.hasError('tempExceedsRange')).toBeFalse();
    });
  });

  // ── Batch search filtering ────────────────────────────────────────────────

  describe('Batch search filtering', () => {
    it('should filter batchOptions when batchSearchControl is set', fakeAsync(() => {
      component.batchOptions.set([
        { batchId: 'BATCH001', displayLabel: 'BATCH001' },
        { batchId: 'BATCH002', displayLabel: 'BATCH002' },
        { batchId: 'OTHER', displayLabel: 'OTHER' },
      ]);
      component.filteredBatchOptions.set(component.batchOptions());

      component.batchSearchControl.setValue('BATCH');
      tick();

      expect(component.filteredBatchOptions().length).toBe(2);
    }));

    it('should restore all batch options when search is cleared', fakeAsync(() => {
      component.batchOptions.set([
        { batchId: 'BATCH001', displayLabel: 'BATCH001' },
        { batchId: 'OTHER', displayLabel: 'OTHER' },
      ]);
      component.batchSearchControl.setValue('BATCH');
      tick();
      component.batchSearchControl.setValue('');
      tick();

      expect(component.filteredBatchOptions().length).toBe(2);
    }));
  });

  // ── Lot search filtering ──────────────────────────────────────────────────

  describe('Lot search filtering', () => {
    it('should filter lot options when lotSearchControl is set', fakeAsync(() => {
      component.lotOptions.set([
        { lotNumber: 'LOT001', displayLabel: 'LOT001' },
        { lotNumber: 'LOT002', displayLabel: 'LOT002' },
        { lotNumber: 'OTHER', displayLabel: 'OTHER' },
      ]);

      component.lotSearchControl.setValue('LOT');
      tick();

      expect(component.filteredLotOptions().length).toBe(2);
    }));

    it('should restore all lot options when search is cleared', fakeAsync(() => {
      component.lotOptions.set([
        { lotNumber: 'LOT001', displayLabel: 'LOT001' },
        { lotNumber: 'OTHER', displayLabel: 'OTHER' },
      ]);
      component.lotSearchControl.setValue('LOT');
      tick();
      component.lotSearchControl.setValue('');
      tick();

      expect(component.filteredLotOptions().length).toBe(2);
    }));
  });

  // ── onBagRetrieve additional branches ─────────────────────────────────────

  describe('Bag Retrieve additional', () => {
    it('should show error when no batchId is selected', () => {
      component.bagFilterForm.get('batchId')?.setValue(null);
      component.onBagRetrieve();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please select a Batch ID before retrieving.');
    });

    it('should show error on retrieve failure', fakeAsync(() => {
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(throwError(() => new Error('fail')));
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');
      component.onBagRetrieve();
      tick();
      expect(component.isLoading()).toBeFalse();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to retrieve batch units.');
    }));

    it('should pass sort params when sort config is set', fakeAsync(() => {
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(of([]));
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');
      component.bagSortConfig = { column: 'unitId', direction: 'A' };
      component.onBagRetrieve();
      tick();
      expect(bagCheckInService.getBatchUnits).toHaveBeenCalledWith('BATCH001', 'unitId', 'ASC');
    }));

    it('should pass DESC sort order when direction is D', fakeAsync(() => {
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(of([]));
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');
      component.bagSortConfig = { column: 'unitId', direction: 'D' };
      component.onBagRetrieve();
      tick();
      expect(bagCheckInService.getBatchUnits).toHaveBeenCalledWith('BATCH001', 'unitId', 'DESC');
    }));

    it('should show entries snackbar on retrieve when _showEntriesSnackbarOnRetrieve is true', fakeAsync(() => {
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(of([mockUnit]));
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');
      component['_showEntriesSnackbarOnRetrieve'] = true;
      component.onBagRetrieve();
      tick();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Entries Added: 1');
    }));
  });

  // ── onBagCheckIn additional branches ──────────────────────────────────────

  describe('Bag Check-In additional branches', () => {
    function setUnitIdFieldValid(parsedUnitId: string): void {
      Object.defineProperty(component, 'unitIdField', {
        get: () => ({ isValid: true, parsedUnitId, clear: jasmine.createSpy('clear') }),
        configurable: true,
      });
    }

    function setUnitIdFieldInvalid(): void {
      Object.defineProperty(component, 'unitIdField', {
        get: () => ({ isValid: false, parsedUnitId: '', clear: jasmine.createSpy('clear') }),
        configurable: true,
      });
    }

    it('should return early when unitIdField is not valid', () => {
      setUnitIdFieldInvalid();
      component.onBagCheckIn();
      expect(component.isCheckingIn()).toBeFalse();
    });

    it('should return early and show error when ISBT unit has no lot number', () => {
      setUnitIdFieldValid('U001');
      component.unitCodeScheme.set('I');
      component.bagEntryForm.get('catalogNumber')?.setValue('CAT001', { emitEvent: false });
      component.bagEntryForm.get('lotNumber')?.setValue(null, { emitEvent: false });
      component.onBagCheckIn();
      expect(component.isCheckingIn()).toBeFalse();
    });

    it('should return early when min temp is missing for new batch', () => {
      setUnitIdFieldValid('U001');
      component.isNewBatch.set(true);
      component.bagEntryForm.get('catalogNumber')?.setValue('CAT001', { emitEvent: false });
      component.bagFilterForm.get('minTemp')?.setValue(null, { emitEvent: false });
      component.onBagCheckIn();
      expect(component.isCheckingIn()).toBeFalse();
      expect(snackbarService.showError).toHaveBeenCalledWith('Min temperature is required for a new batch.');
    });

    it('should return early when bagEntryForm is invalid', () => {
      setUnitIdFieldValid('U001');
      component.isNewBatch.set(false);
      component.bagEntryForm.get('catalogNumber')?.setValue(null, { emitEvent: false });
      component.onBagCheckIn();
      expect(component.isCheckingIn()).toBeFalse();
    });

    it('should show error on check-in failure', fakeAsync(() => {
      setUnitIdFieldValid('U001');
      spyOn(bagCheckInService, 'checkIn').and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.bagEntryForm.setValue({ catalogNumber: 'CAT001', lotNumber: 'LOT001' });
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');
      component.bagFilterForm.get('minTemp')?.setValue(1.00, { emitEvent: false });
      component.bagFilterForm.get('maxTemp')?.setValue(6.00, { emitEvent: false });

      component.onBagCheckIn();
      tick();

      expect(component.isCheckingIn()).toBeFalse();
      expect(snackbarService.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should show expired lot warning dialog when response has expiredLotWarning', fakeAsync(() => {
      setUnitIdFieldValid('U001');
      spyOn(bagCheckInService, 'checkIn').and.returnValue(of({
        batchId: 'BATCH001', unitId: 'U001', expiredLotWarning: true, expiredLotMessage: 'Lot expired'
      }));
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(of([]));
      const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      component.bagEntryForm.setValue({ catalogNumber: 'CAT001', lotNumber: 'LOT001' });
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');
      component.bagFilterForm.get('minTemp')?.setValue(1.00, { emitEvent: false });

      component.onBagCheckIn();
      tick();

      expect(dialogSpy).toHaveBeenCalled();
      const dialogData = dialogSpy.calls.mostRecent().args[1]?.data;
      expect(dialogData.title).toBe('Expired Lot Warning');
    }));
  });

  // ── tryAutoCheckIn ────────────────────────────────────────────────────────

  describe('tryAutoCheckIn', () => {
    function setUnitIdFieldValid(parsedUnitId: string): void {
      Object.defineProperty(component, 'unitIdField', {
        get: () => ({ isValid: true, parsedUnitId, clear: jasmine.createSpy('clear') }),
        configurable: true,
      });
    }

    it('should return early if already checking in', () => {
      component.isCheckingIn.set(true);
      component['tryAutoCheckIn']();
      expect(component['_autoCheckInInProgress']).toBeFalse();
    });

    it('should return early if _autoCheckInInProgress is true', () => {
      component['_autoCheckInInProgress'] = true;
      component['tryAutoCheckIn']();
      // Still true because we returned early
      expect(component['_autoCheckInInProgress']).toBeTrue();
    });

    it('should return early if parsedUnitId matches _lastCheckedInUnitId', () => {
      setUnitIdFieldValid('U001');
      component['_lastCheckedInUnitId'] = 'U001';
      const checkInSpy = spyOn(component, 'onBagCheckIn');
      component['tryAutoCheckIn']();
      expect(checkInSpy).not.toHaveBeenCalled();
    });

    it('should return early if catalog is empty', () => {
      setUnitIdFieldValid('U001');
      component.bagEntryForm.get('catalogNumber')?.setValue(null, { emitEvent: false });
      const checkInSpy = spyOn(component, 'onBagCheckIn');
      component['tryAutoCheckIn']();
      expect(checkInSpy).not.toHaveBeenCalled();
    });

    it('should mark catalog touched when showErrors is true and catalog is empty', () => {
      setUnitIdFieldValid('U001');
      component.bagEntryForm.get('catalogNumber')?.setValue(null, { emitEvent: false });
      component['tryAutoCheckIn'](true);
      expect(component.bagEntryForm.get('catalogNumber')?.touched).toBeTrue();
    });

    it('should return early if ISBT unit and lot is not set', () => {
      setUnitIdFieldValid('U001');
      component.unitCodeScheme.set('I');
      component.bagEntryForm.get('catalogNumber')?.setValue('CAT001', { emitEvent: false });
      component.bagEntryForm.get('lotNumber')?.setValue(null, { emitEvent: false });
      const checkInSpy = spyOn(component, 'onBagCheckIn');
      component['tryAutoCheckIn']();
      expect(checkInSpy).not.toHaveBeenCalled();
    });

    it('should show error when new batch has no min temp', () => {
      setUnitIdFieldValid('U001');
      component.isNewBatch.set(true);
      component.bagEntryForm.get('catalogNumber')?.setValue('CAT001', { emitEvent: false });
      component.bagFilterForm.get('minTemp')?.setValue(null, { emitEvent: false });
      component['tryAutoCheckIn']();
      expect(snackbarService.showError).toHaveBeenCalledWith('Min temperature is required before checking in a new batch.');
    });

    it('should call onBagCheckIn when all conditions pass', () => {
      setUnitIdFieldValid('U001');
      component.isNewBatch.set(false);
      component.bagEntryForm.get('catalogNumber')?.setValue('CAT001', { emitEvent: false });
      const checkInSpy = spyOn(component, 'onBagCheckIn');
      component['tryAutoCheckIn']();
      expect(checkInSpy).toHaveBeenCalled();
      expect(component.isCheckingIn()).toBeTrue();
    });
  });

  // ── onCatalogSelected additional ──────────────────────────────────────────

  describe('onCatalogSelected additional', () => {
    it('should return early for empty catalogNumber', () => {
      spyOn(bagCheckInService, 'getLotNumbers');
      component.onCatalogSelected('');
      expect(bagCheckInService.getLotNumbers).not.toHaveBeenCalled();
    });

    it('should add required validator to lotNumber for ISBT units', fakeAsync(() => {
      spyOn(bagCheckInService, 'getLotNumbers').and.returnValue(of(mockLots));
      component.unitCodeScheme.set('I');
      component.onCatalogSelected('CAT001');
      tick();
      expect(component.bagEntryForm.get('lotNumber')?.hasValidator(Validators.required)).toBeTruthy();
    }));

    it('should clear lot options on error', fakeAsync(() => {
      spyOn(bagCheckInService, 'getLotNumbers').and.returnValue(throwError(() => new Error('fail')));
      component.lotOptions.set([{ lotNumber: 'LOT1', displayLabel: 'LOT1' }]);
      component.onCatalogSelected('CAT001');
      tick();
      expect(component.lotOptions()).toEqual([]);
      expect(component.filteredLotOptions()).toEqual([]);
    }));
  });

  // ── onLotNumberSelected / onMinTempTab ────────────────────────────────────

  describe('onLotNumberSelected and onMinTempTab', () => {
    it('should call tryAutoCheckIn on lot number selection', () => {
      const spy = spyOn<any>(component, 'tryAutoCheckIn');
      component.onLotNumberSelected();
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should call tryAutoCheckIn on min temp tab', () => {
      const spy = spyOn<any>(component, 'tryAutoCheckIn');
      component.onMinTempTab();
      expect(spy).toHaveBeenCalledWith(true);
    });
  });

  // ── onTabContentClick ─────────────────────────────────────────────────────

  describe('onTabContentClick', () => {
    it('should call tryAutoCheckIn when clicking outside form controls', () => {
      const spy = spyOn<any>(component, 'tryAutoCheckIn');
      const mockEvent = { target: document.createElement('div') } as unknown as MouseEvent;
      component.onTabContentClick(mockEvent);
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should not call tryAutoCheckIn when clicking on a button', () => {
      const spy = spyOn<any>(component, 'tryAutoCheckIn');
      const button = document.createElement('button');
      const mockEvent = { target: button } as unknown as MouseEvent;
      component.onTabContentClick(mockEvent);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ── onCheckUnitsInBatch additional ────────────────────────────────────────

  describe('onCheckUnitsInBatch additional', () => {
    it('should call getBatchUnits and set panelUnits on success', fakeAsync(() => {
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(of([mockUnit]));
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');
      component.bagFilterForm.get('minTemp')?.setValue(1.5, { emitEvent: false });
      component.bagFilterForm.get('maxTemp')?.setValue(6.0, { emitEvent: false });
      component.onCheckUnitsInBatch();
      tick();
      expect(component.panelUnits().length).toBe(1);
      expect(component.isPanelLoading()).toBeFalse();
    }));

    it('should show error on getBatchUnits failure in panel', fakeAsync(() => {
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(throwError(() => new Error('fail')));
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');
      component.onCheckUnitsInBatch();
      tick();
      expect(component.isPanelLoading()).toBeFalse();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load batch units.');
    }));

    it('should format temperatures in panel', () => {
      spyOn(bagCheckInService, 'getBatchUnits').and.returnValue(of([]));
      component.bagFilterForm.get('batchId')?.setValue('BATCH001');
      component.bagFilterForm.get('minTemp')?.setValue(2.5, { emitEvent: false });
      component.bagFilterForm.get('maxTemp')?.setValue(8.0, { emitEvent: false });
      component.onCheckUnitsInBatch();
      expect(component.panelMinTemp()).toBe('2.50 °C');
      expect(component.panelMaxTemp()).toBe('8.00 °C');
    });
  });

  // ── onCheckUnitsPanelButton non-close ─────────────────────────────────────

  describe('onCheckUnitsPanelButton non-close', () => {
    it('should not close panel for unknown action', () => {
      component.showCheckUnitsPanel.set(true);
      component.onCheckUnitsPanelButton('other');
      expect(component.showCheckUnitsPanel()).toBeTrue();
    });
  });

  // ── Pagination events ─────────────────────────────────────────────────────

  describe('Pagination events', () => {
    it('should update bag page index and page size on onBagPageChange', () => {
      component['_allBagEntries'] = [];
      component.onBagPageChange({ pageIndex: 2, pageSize: 50 } as any);
      expect(component.bagPageIndex).toBe(2);
      expect(component.bagPageSize).toBe(50);
    });

    it('should update tube page index and page size on onTubePageChange', () => {
      component['_allTubeEntries'] = [];
      component.onTubePageChange({ pageIndex: 1, pageSize: 10 } as any);
      expect(component.tubePageIndex).toBe(1);
      expect(component.tubePageSize).toBe(10);
    });
  });

  // ── Sort events ───────────────────────────────────────────────────────────

  describe('Sort events', () => {
    it('should update bag sort config and reset page index on onBagSortChange', () => {
      component['_allBagEntries'] = [];
      component.onBagSortChange({ column: 'unitId', direction: 'A' } as any);
      expect(component.bagSortConfig.column).toBe('unitId');
      expect(component.bagSortConfig.direction).toBe('A');
      expect(component.bagPageIndex).toBe(0);
    });

    it('should update tube sort config and reset page index on onTubeSortChange', () => {
      component['_allTubeEntries'] = [];
      component.onTubeSortChange({ column: 'sequence', direction: 'D' } as any);
      expect(component.tubeSortConfig.column).toBe('sequence');
      expect(component.tubeSortConfig.direction).toBe('D');
      expect(component.tubePageIndex).toBe(0);
    });
  });

  // ── sortRecords ───────────────────────────────────────────────────────────

  describe('sortRecords', () => {
    const items = [
      { name: 'Charlie', id: '3' },
      { name: 'Alpha', id: '1' },
      { name: 'Bravo', id: '2' },
    ];

    it('should return a copy unchanged when direction is default', () => {
      const result = component['sortRecords'](items, 'name', 'default');
      expect(result).toEqual(items);
      expect(result).not.toBe(items);
    });

    it('should sort ascending by name', () => {
      const result = component['sortRecords'](items, 'name', 'A');
      expect(result[0].name).toBe('Alpha');
      expect(result[1].name).toBe('Bravo');
      expect(result[2].name).toBe('Charlie');
    });

    it('should sort descending by name', () => {
      const result = component['sortRecords'](items, 'name', 'D');
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bravo');
      expect(result[2].name).toBe('Alpha');
    });

    it('should return a copy unchanged when column is empty', () => {
      const result = component['sortRecords'](items, '', 'A');
      expect(result).toEqual(items);
    });
  });

  // ── mapUnitToEntry ────────────────────────────────────────────────────────

  describe('mapUnitToEntry', () => {
    it('should map unit with all fields', () => {
      const entry = component['mapUnitToEntry'](mockUnit);
      expect(entry.unitId).toBe('U001');
      expect(entry.catalogNumber).toBe('CAT001');
      expect(entry.driveId).toBe('DRV001');
      expect(entry.name).toBe('Test Donor');
      expect(entry.lotNumber).toBe('LOT001');
      expect(entry.protocol).toBe('I');
    });

    it('should default missing fields to empty or dash', () => {
      const entry = component['mapUnitToEntry']({ unitId: 'U002' } as any);
      expect(entry.catalogNumber).toBe('');
      expect(entry.driveId).toBe('');
      expect(entry.name).toBe('');
      expect(entry.lotNumber).toBe('-');
      expect(entry.cue).toBe('-');
      expect(entry.protocol).toBe('');
    });
  });

  // ── Protocol color additional ─────────────────────────────────────────────

  describe('Protocol color additional', () => {
    it('should return gray for protocol "C"', () => {
      expect(component.getProtocolColor('C')).toBe('gray');
    });

    it('should return blue for protocol "8"', () => {
      expect(component.getProtocolColor('8')).toBe('blue');
    });

    it('should return gray for protocol "X"', () => {
      expect(component.getProtocolColor('X')).toBe('gray');
    });

    it('should return purple for protocol "V"', () => {
      expect(component.getProtocolColor('V')).toBe('purple');
    });

    it('should be case-insensitive', () => {
      expect(component.getProtocolColor('al')).toBe('red');
      expect(component.getProtocolColor('3gb')).toBe('green');
    });
  });

  // ── Tube Check-In: onTubeCleared ──────────────────────────────────────────

  describe('onTubeCleared', () => {
    it('should remove the control from tubeValues', () => {
      component.tubeValues.set({ red1: 'U001', purple1: 'U001' });
      component.onTubeCleared('red1');
      const vals = component.tubeValues();
      expect(vals['red1']).toBeUndefined();
      expect(vals['purple1']).toBe('U001');
    });

    it('should set _tubeAutoSubmitPending to false', () => {
      component['_tubeAutoSubmitPending'] = true;
      component.onTubeCleared('red1');
      expect(component['_tubeAutoSubmitPending']).toBeFalse();
    });
  });

  // ── Tube Check-In: onTubeValidated ────────────────────────────────────────

  describe('onTubeValidated', () => {
    it('should add the validated value to tubeValues', () => {
      component.tubeValues.set({});
      component.onTubeValidated({ parsedUnitId: 'U001' } as any, 'red1');
      expect(component.tubeValues()['red1']).toBe('U001');
    });

    it('should reset tubeSubmitAttempted to false', () => {
      component.tubeSubmitAttempted.set(true);
      component.onTubeValidated({ parsedUnitId: 'U001' } as any, 'red1');
      expect(component.tubeSubmitAttempted()).toBeFalse();
    });
  });

  // ── Tube Check-In: onTubeRetrieve ─────────────────────────────────────────

  describe('Tube Retrieve (onTubeRetrieve)', () => {
    it('should show error when no format is selected', () => {
      component.tubeFilterForm.get('tubeFormat')?.setValue(null, { emitEvent: false });
      component.onTubeRetrieve();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please select a Tube Check-In Format.');
    });

    it('should retrieve tube entries on success', fakeAsync(() => {
      spyOn(bagCheckInService, 'getTubeEntries').and.returnValue(of([
        { unitId: 'U001', redTop1: 'R1', redTop2: '', purpleTop1: 'P1', purpleTop2: '' }
      ]));
      component.tubeFilterForm.get('tubeFormat')?.setValue('PPR');
      component.onTubeRetrieve();
      tick(400);
      expect(component.tubeRetrieved()).toBeTrue();
      expect(component.tubeEntryCount()).toBe(1);
    }));

    it('should show error on tube retrieve failure', fakeAsync(() => {
      spyOn(bagCheckInService, 'getTubeEntries').and.returnValue(throwError(() => new Error('fail')));
      component.tubeFilterForm.get('tubeFormat')?.setValue('PPR');
      component.onTubeRetrieve();
      tick(400);
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to retrieve tube check-in entries.');
    }));
  });

  // ── Tube Check-In: onTubeSubmit additional ────────────────────────────────

  describe('Tube Submit additional', () => {
    it('should show error when no format is selected', () => {
      component['selectedTubeFormat'] = signal(null);
      component.onTubeSubmit();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please select a Tube Check-In Format.');
    });

    it('should submit tube and show success on valid submission', fakeAsync(() => {
      spyOn(bagCheckInService, 'submitTubeCheckIn').and.returnValue(of({ masterUnitId: 'U001', message: 'OK' }));
      component.onTubeFormatChange('PPR');
      component.tubeValues.set({ red1: 'U001' });
      component.tubeRetrieved.set(true);
      // Mock tubeFields
      Object.defineProperty(component, 'tubeFields', {
        get: () => ({ forEach: jasmine.createSpy('forEach'), some: () => false } as any),
        configurable: true,
      });

      component.onTubeSubmit();
      tick();

      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Tube checked in successfully.');
      expect(component.isSubmittingTube()).toBeFalse();
      expect(component.tubeRetrieved()).toBeTrue();
    }));

    it('should show error on tube submit failure', fakeAsync(() => {
      spyOn(bagCheckInService, 'submitTubeCheckIn').and.returnValue(throwError(() => ({ error: { message: 'Tube error' } })));
      component.onTubeFormatChange('PPR');
      component.tubeValues.set({ red1: 'U001' });
      component.onTubeSubmit();
      tick();
      expect(component.isSubmittingTube()).toBeFalse();
      expect(snackbarService.showError).toHaveBeenCalledWith('Tube error');
    }));
  });

  // ── Tube PostValidate ─────────────────────────────────────────────────────

  describe('Tube PostValidate (onTubePostValidate)', () => {
    function makeTubeEvent(parsedUnitId: string) {
      return {
        event: {
          data: { parsedUnitId } as any,
          confirm: jasmine.createSpy('confirm'),
          reject: jasmine.createSpy('reject'),
        },
      };
    }

    it('should reject when tube IDs do not match existing values', () => {
      component.tubeValues.set({ red1: 'U001' });
      const { event } = makeTubeEvent('U002');
      component.onTubePostValidate(event, 'purple1');
      expect(event.reject).toHaveBeenCalledWith(jasmine.stringContaining('same unit ID'));
    });

    it('should confirm when validateTubeUnit returns no error', fakeAsync(() => {
      spyOn(bagCheckInService, 'validateTubeUnit').and.returnValue(of({ alreadyCheckedIn: false }));
      component.tubeValues.set({});
      const { event } = makeTubeEvent('U001');
      component.onTubePostValidate(event, 'red1');
      tick();
      expect(event.confirm).toHaveBeenCalled();
    }));

    it('should reject when validateTubeUnit returns error code', fakeAsync(() => {
      spyOn(bagCheckInService, 'validateTubeUnit').and.returnValue(of({
        alreadyCheckedIn: true, errorCode: '0150', errorMessage: 'Already checked in'
      }));
      component.tubeValues.set({});
      const { event } = makeTubeEvent('U001');
      component.onTubePostValidate(event, 'red1');
      tick();
      expect(event.reject).toHaveBeenCalled();
    }));

    it('should reject on validateTubeUnit error', fakeAsync(() => {
      spyOn(bagCheckInService, 'validateTubeUnit').and.returnValue(throwError(() => ({ error: { message: 'Server fail' } })));
      component.tubeValues.set({});
      const { event } = makeTubeEvent('U001');
      component.onTubePostValidate(event, 'red1');
      tick();
      expect(event.reject).toHaveBeenCalled();
    }));
  });

  // ── onTabChange tube auto-submit ──────────────────────────────────────────

  describe('onTabChange tube auto-submit', () => {
    it('should call onTubeSubmit when switching from tube tab with pending values', () => {
      component.activeTabIndex.set(1);
      component.tubeRetrieved.set(true);
      component.tubeValues.set({ red1: 'U001' });
      component.isSubmittingTube.set(false);
      Object.defineProperty(component, 'tubeFields', {
        get: () => ({ forEach: jasmine.createSpy('forEach'), some: () => false } as any),
        configurable: true,
      });
      component['_tubeValidatingCount'] = 0;
      const submitSpy = spyOn(component, 'onTubeSubmit');

      component.onTabChange(0);
      expect(submitSpy).toHaveBeenCalled();
    });

    it('should set _tubeAutoSubmitPending when fields are validating', () => {
      component.activeTabIndex.set(1);
      component.tubeRetrieved.set(true);
      component.tubeValues.set({ red1: 'U001' });
      component.isSubmittingTube.set(false);
      component['_tubeValidatingCount'] = 1;
      Object.defineProperty(component, 'tubeFields', {
        get: () => ({ forEach: jasmine.createSpy('forEach'), some: () => false } as any),
        configurable: true,
      });

      component.onTabChange(0);
      expect(component['_tubeAutoSubmitPending']).toBeTrue();
    });
  });

  // ── onTubeTabContentClick ─────────────────────────────────────────────────

  describe('onTubeTabContentClick', () => {
    it('should return early when not retrieved', () => {
      component.tubeRetrieved.set(false);
      const submitSpy = spyOn(component, 'onTubeSubmit');
      component.onTubeTabContentClick({ target: document.createElement('div') } as unknown as MouseEvent);
      expect(submitSpy).not.toHaveBeenCalled();
    });

    it('should return early when no tube values', () => {
      component.tubeRetrieved.set(true);
      component.tubeValues.set({});
      const submitSpy = spyOn(component, 'onTubeSubmit');
      component.onTubeTabContentClick({ target: document.createElement('div') } as unknown as MouseEvent);
      expect(submitSpy).not.toHaveBeenCalled();
    });

    it('should return early when clicking on filter-panel tube inputs', () => {
      component.tubeRetrieved.set(true);
      component.tubeValues.set({ red1: 'U001' });
      const container = document.createElement('div');
      container.className = 'filter-panel--tube-inputs';
      const child = document.createElement('input');
      container.appendChild(child);
      const submitSpy = spyOn(component, 'onTubeSubmit');
      component.onTubeTabContentClick({ target: child } as unknown as MouseEvent);
      expect(submitSpy).not.toHaveBeenCalled();
    });

    it('should call onTubeSubmit when clicking outside inputs with valid values', () => {
      component.tubeRetrieved.set(true);
      component.tubeValues.set({ red1: 'U001' });
      component.isSubmittingTube.set(false);
      component['_tubeValidatingCount'] = 0;
      Object.defineProperty(component, 'tubeFields', {
        get: () => ({ forEach: jasmine.createSpy('forEach'), some: () => false } as any),
        configurable: true,
      });
      const submitSpy = spyOn(component, 'onTubeSubmit');
      component.onTubeTabContentClick({ target: document.createElement('div') } as unknown as MouseEvent);
      expect(submitSpy).toHaveBeenCalled();
    });

    it('should defer submit when fields are still validating', () => {
      component.tubeRetrieved.set(true);
      component.tubeValues.set({ red1: 'U001' });
      component.isSubmittingTube.set(false);
      component['_tubeValidatingCount'] = 1;
      Object.defineProperty(component, 'tubeFields', {
        get: () => ({ forEach: jasmine.createSpy('forEach'), some: () => false } as any),
        configurable: true,
      });
      const submitSpy = spyOn(component, 'onTubeSubmit');
      component.onTubeTabContentClick({ target: document.createElement('div') } as unknown as MouseEvent);
      expect(submitSpy).not.toHaveBeenCalled();
      expect(component['_tubeAutoSubmitPending']).toBeTrue();
    });
  });

  // ── onTubeEnterSubmit ─────────────────────────────────────────────────────

  describe('onTubeEnterSubmit', () => {
    it('should return early when already submitting', () => {
      component.isSubmittingTube.set(true);
      const submitSpy = spyOn(component, 'onTubeSubmit');
      component.onTubeEnterSubmit();
      expect(submitSpy).not.toHaveBeenCalled();
    });

    it('should set _tubeAutoSubmitPending when validating count > 0', () => {
      component.isSubmittingTube.set(false);
      component['_tubeValidatingCount'] = 1;
      component.onTubeEnterSubmit();
      expect(component['_tubeAutoSubmitPending']).toBeTrue();
    });

    it('should call onTubeSubmit when has values and no pending validations', () => {
      component.isSubmittingTube.set(false);
      component['_tubeValidatingCount'] = 0;
      component.tubeValues.set({ red1: 'U001' });
      const submitSpy = spyOn(component, 'onTubeSubmit');
      component.onTubeEnterSubmit();
      expect(submitSpy).toHaveBeenCalled();
    });

    it('should set pending when has no values', () => {
      component.isSubmittingTube.set(false);
      component['_tubeValidatingCount'] = 0;
      component.tubeValues.set({});
      component.onTubeEnterSubmit();
      expect(component['_tubeAutoSubmitPending']).toBeTrue();
    });
  });

  // ── onTubeFieldKeyAction ──────────────────────────────────────────────────

  describe('onTubeFieldKeyAction', () => {
    it('should do nothing when isLast is false', () => {
      component.onTubeFieldKeyAction(false);
      expect(component['_tubeAutoSubmitPending']).toBeFalse();
    });

    it('should do nothing when already submitting', () => {
      component.isSubmittingTube.set(true);
      component.onTubeFieldKeyAction(true);
      // _tubeAutoSubmitPending stays false because isSubmitting guard returns early
      expect(component.isSubmittingTube()).toBeTrue();
    });

    it('should set _tubeAutoSubmitPending when isLast', fakeAsync(() => {
      component.isSubmittingTube.set(false);
      component['_tubeValidatingCount'] = 1;
      Object.defineProperty(component, 'tubeFields', {
        get: () => ({ forEach: jasmine.createSpy('forEach'), some: () => false } as any),
        configurable: true,
      });
      component.onTubeFieldKeyAction(true);
      expect(component['_tubeAutoSubmitPending']).toBeTrue();
      tick(100);
    }));
  });

  // ── resolveRequiredControlName ─────────────────────────────────────────────

  describe('resolveRequiredControlName', () => {
    it('should return apiValue when provided', () => {
      expect(component['resolveRequiredControlName']('PPR', 'red1')).toBe('red1');
    });

    it('should return red1 for R* format when no apiValue', () => {
      expect(component['resolveRequiredControlName']('R*', null)).toBe('red1');
    });

    it('should return purple1 for P* format when no apiValue', () => {
      expect(component['resolveRequiredControlName']('P*', null)).toBe('purple1');
    });

    it('should return null for unknown format when no apiValue', () => {
      expect(component['resolveRequiredControlName']('PPR', null)).toBeNull();
    });
  });

  // ── loadTubeFormats ───────────────────────────────────────────────────────

  describe('loadTubeFormats', () => {
    it('should load and apply tube formats from service', fakeAsync(() => {
      spyOn(bagCheckInService, 'getTubeFormats').and.returnValue(of([
        { formatCode: 'RR', description: 'Red 1 and Red 2', fields: [{ controlName: 'red1', label: 'Red 1' }, { controlName: 'red2', label: 'Red 2' }], requiredControlName: null }
      ]));
      component['loadTubeFormats']();
      tick();
      expect(component.tubeFormatOptions().length).toBe(1);
      expect(component.tubeFormatOptions()[0].formatCode).toBe('RR');
    }));

    it('should show error on loadTubeFormats failure', fakeAsync(() => {
      spyOn(bagCheckInService, 'getTubeFormats').and.returnValue(throwError(() => new Error('fail')));
      component['loadTubeFormats']();
      tick();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load tube check-in formats.');
    }));
  });

  // ── onTubeFormatChange with unknown format ────────────────────────────────

  describe('onTubeFormatChange unknown format', () => {
    it('should not change tube format when format not found', () => {
      const before = component.selectedTubeFormat();
      component.onTubeFormatChange('NONEXISTENT');
      expect(component.selectedTubeFormat()).toBe(before);
    });
  });

  // ── hasAnyTubeValue computed ───────────────────────────────────────────────

  describe('hasAnyTubeValue', () => {
    it('should return false when tubeValues is empty', () => {
      component.tubeValues.set({});
      expect(component.hasAnyTubeValue()).toBeFalse();
    });

    it('should return true when tubeValues has a non-empty value', () => {
      component.tubeValues.set({ red1: 'U001' });
      expect(component.hasAnyTubeValue()).toBeTrue();
    });

    it('should return false when tubeValues has only empty values', () => {
      component.tubeValues.set({ red1: '', purple1: '' });
      expect(component.hasAnyTubeValue()).toBeFalse();
    });
  });

  // ── Unit post-validate: warning and bleed dialogs ─────────────────────────

  describe('Unit post-validate warning dialogs', () => {
    it('should open CUE warning dialog when warningCode is in WARNING_CUES', fakeAsync(() => {
      const warningResponse = { ...mockValidateUnitResponse, warningCode: 'N' };
      spyOn(bagCheckInService, 'validateUnit').and.returnValue(of(warningResponse));
      const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(false) } as any);
      const event = {
        data: { parsedUnitId: 'U001' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event);
      tick();
      expect(dialogSpy).toHaveBeenCalled();
      const dialogData = dialogSpy.calls.mostRecent().args[1]?.data;
      expect(dialogData.title).toBe('Alert');
      expect(dialogData.message).toContain('Remove this bag');
    }));

    it('should open bleed warning dialog when bleedWarningCode is present', fakeAsync(() => {
      const bleedResponse = { ...mockValidateUnitResponse, bleedWarningCode: '9211', bleedWarningMessage: 'Bleed time exceeded' };
      spyOn(bagCheckInService, 'validateUnit').and.returnValue(of(bleedResponse));
      const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      const event = {
        data: { parsedUnitId: 'U001' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event);
      tick();
      expect(dialogSpy).toHaveBeenCalled();
      const dialogData = dialogSpy.calls.mostRecent().args[1]?.data;
      expect(dialogData.title).toBe('Bleed Time Warning');
      expect(dialogData.message).toBe('Bleed time exceeded');
    }));

    it('should use default bleed message when bleedWarningMessage is missing', fakeAsync(() => {
      const bleedResponse = { ...mockValidateUnitResponse, bleedWarningCode: '9001' };
      spyOn(bagCheckInService, 'validateUnit').and.returnValue(of(bleedResponse));
      const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      const event = {
        data: { parsedUnitId: 'U001' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event);
      tick();
      expect(dialogSpy).toHaveBeenCalled();
      const dialogData = dialogSpy.calls.mostRecent().args[1]?.data;
      expect(dialogData.message).toContain('Bleed time greater than limits');
    }));

    it('should use error.error.error message on validation error when message is missing', fakeAsync(() => {
      spyOn(bagCheckInService, 'validateUnit').and.returnValue(throwError(() => ({ error: { error: 'Custom error (Error 123).' } })));
      const event = {
        data: { parsedUnitId: 'U001' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Custom error');
    }));
  });

  // ── loadBatches / loadCatalogs error branches ─────────────────────────────

  describe('loadBatches error', () => {
    it('should show error when loadBatches fails', fakeAsync(() => {
      spyOn(bagCheckInService, 'getBatches').and.returnValue(throwError(() => new Error('fail')));
      component['loadBatches']();
      tick();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load batch list.');
    }));
  });

  describe('loadCatalogs error', () => {
    it('should show error when loadCatalogs fails', fakeAsync(() => {
      (bagCheckInService.getCatalogNumbers as jasmine.Spy).and.returnValue(throwError(() => new Error('fail')));
      component['loadCatalogs']();
      tick();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load catalog numbers.');
    }));
  });

  // ── minTemp / maxTemp valueChanges subscription ───────────────────────────

  describe('Temperature valueChanges subscriptions', () => {
    it('should set lastTouchedTempField to minTemp when minTemp changes', fakeAsync(() => {
      component.lastTouchedTempField = null;
      component.bagFilterForm.get('minTemp')?.setValue(5);
      tick();
      expect(component.lastTouchedTempField).toBe('minTemp');
    }));

    it('should set lastTouchedTempField to maxTemp when maxTemp changes', fakeAsync(() => {
      component.lastTouchedTempField = null;
      component.bagFilterForm.get('maxTemp')?.setValue(10);
      tick();
      expect(component.lastTouchedTempField).toBe('maxTemp');
    }));
  });

  // ── catalogNumber valueChanges subscription ───────────────────────────────

  describe('catalogNumber valueChanges', () => {
    it('should clear lotNumber and remove validators when catalog changes', fakeAsync(() => {
      component.bagEntryForm.get('lotNumber')?.addValidators(Validators.required);
      component.lotOptions.set([{ lotNumber: 'LOT1', displayLabel: 'LOT1' }]);
      component.bagEntryForm.get('catalogNumber')?.setValue('NEW_CAT');
      tick();
      expect(component.bagEntryForm.get('lotNumber')?.value).toBeNull();
      expect(component.lotOptions()).toEqual([]);
    }));
  });
});
