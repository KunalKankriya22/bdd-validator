import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import moment from 'moment';

import { CheckInDetailsComponent } from './check-in-details';
import { CheckInDetailsService } from './services/check-in-details.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DropdownOption, AttributeCodeOption, MachineOption, UnitDetail } from './models/check-in-details.model';

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockDriveDesc = { siteName: 'Main Center', groupSiteId: 'GS-001' };

const mockAboOptions: DropdownOption[] = [
  { value: 'O+', label: 'O+ — O Positive' },
  { value: 'A+', label: 'A+ — A Positive' },
];

const mockAttributeGroups: DropdownOption[] = [
  { value: 'GRP1', label: 'GRP1 — General Attributes' },
];

const mockAttributeCodes: AttributeCodeOption[] = [
  { value: 'ATR1', label: 'ATR1 — Attribute One', requiresEquipment: false, parmCode: '' },
  { value: 'ATR2', label: 'ATR2 — Attribute Two', requiresEquipment: true, parmCode: 'P001' },
];

const mockMachines: MachineOption[] = [
  { value: 'EQ-001', label: 'SN001 — Centrifuge', donorCue: 'Centrifuge', serialNumber: 'SN001', equipType: 'CENT' },
];

const mockUnitDetail: UnitDetail = {
  unitId: 'U-0001',
  bleedStartTime: '2026-05-21T08:00:00',
  bleedEndTime: '2026-05-21T08:10:00',
  donorFormAbo: 'O+',
  bagCode: 'SGL',
  bagDescription: 'Single',
  donorDecisionCode: 'D',
  siteName: 'Main Center',
  isPheresis: false,
  attributes: [],
  hasComponents: false,
};

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('CheckInDetailsComponent', () => {
  let component: CheckInDetailsComponent;
  let fixture: ComponentFixture<CheckInDetailsComponent>;
  let serviceSpy: jasmine.SpyObj<CheckInDetailsService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj<CheckInDetailsService>('CheckInDetailsService', [
      'getDrives',
      'getDriveDescription',
      'validateUnit',
      'getUnitDetails',
      'getAttributeGroups',
      'getAttributeCodes',
      'getMachines',
      'getAboValues',
      'getChapterConfig',
      'getFirstSeparationTime',
      'save',
    ]);
    serviceSpy.getDrives.and.returnValue(of([]));
    serviceSpy.getDriveDescription.and.returnValue(of(mockDriveDesc));
    serviceSpy.validateUnit.and.returnValue(of({
      unitId: 'U-0001', parsedUnitId: 'U-0001', alreadyCheckedIn: false, hasTubeData: false,
    }));
    serviceSpy.getUnitDetails.and.returnValue(of(mockUnitDetail));
    serviceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
    serviceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
    serviceSpy.getMachines.and.returnValue(of(mockMachines));
    serviceSpy.getAboValues.and.returnValue(of(mockAboOptions));
    serviceSpy.getChapterConfig.and.returnValue(of({ maxBleedTime: 30, slowBleedTime: 20, cueScanFlag: '', timeLimitDays: 30 }));
    serviceSpy.getFirstSeparationTime.and.returnValue(of(null));
    serviceSpy.save.and.returnValue(of({ success: true }));

    snackbarServiceSpy = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['showError', 'showSuccess', 'showInfo']);

    headerServiceSpy = jasmine.createSpyObj<HeaderService>('HeaderService', ['getCurrentChapterId']);
    (headerServiceSpy as any).chapterTimeZone = jasmine.createSpy('chapterTimeZone').and.returnValue('+00:00');
    (headerServiceSpy as any).chapterId = jasmine.createSpy('chapterId').and.returnValue('CH01');



      TestBed.configureTestingModule({
      imports: [CheckInDetailsComponent, NoopAnimationsModule],
      providers: [
        { provide: CheckInDetailsService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        {
          provide: PageHeaderService,
          useValue: jasmine.createSpyObj('PageHeaderService', [], {
            pageHeaderData: signal({ title: 'Check-In Details', subtitle: '' }),
          }),
        },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });


    



    fixture = TestBed.createComponent(CheckInDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ── Initialization ──────────────────────────────────────────────────────────

  describe('Initialization', () => {


    it('should load attribute groups on init', fakeAsync(() => {
      tick();
      expect(serviceSpy.getAttributeGroups).toHaveBeenCalled();
      expect(component.attributeGroupOptions().length).toBe(1);
    }));

    it('should initialize filterForm with collectionDate and driveId', () => {
      expect(component.filterForm.get('collectionDate')).toBeTruthy();
      expect(component.filterForm.get('driveId')).toBeTruthy();
    });

    it('should initialize unitForm with bleedStartTime, bleedEndTime, donorFormAbo, machine (unitId is handled by UnitIdFieldComponent)', () => {
      expect(component.unitForm.get('unitId')).toBeNull();
      expect(component.unitForm.get('bleedStartTime')).toBeTruthy();
      expect(component.unitForm.get('bleedEndTime')).toBeTruthy();
      expect(component.unitForm.get('donorFormAbo')).toBeTruthy();
      expect(component.unitForm.get('machine')).toBeTruthy();
    });

    it('should initialize driveDescription as empty string', () => {
      expect(component.driveDescription()).toBe('');
    });

    it('should initialize isLoading as false', () => {
      expect(component.isLoading()).toBeFalse();
    });

    it('should initialize hasData as false', () => {
      expect(component.hasData()).toBeFalse();
    });

    it('should initialize attributeRows as empty array', () => {
      expect(component.attributeRows()).toEqual([]);
    });

    it('should initialize aboOptions as empty array', () => {
      expect(component.aboOptions()).toEqual([]);
    });
  });

  // ── Page Header ─────────────────────────────────────────────────────────────
  // ── onRetrieve ──────────────────────────────────────────────────────────────

  describe('onRetrieve', () => {


    it('should set hasData true on success', fakeAsync(() => {
      component.filterForm.get('collectionDate')?.setValue(new Date());
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onRetrieve();
      tick();
      expect(component.hasData()).toBeTrue();
    }));

    it('should clear attributeRows on retrieve', fakeAsync(() => {
      component.onAddAttribute();
      component.filterForm.get('collectionDate')?.setValue(new Date());
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onRetrieve();
      tick();
      expect(component.attributeRows()).toEqual([]);
    }));

    it('should clear bagConfig on retrieve', fakeAsync(() => {
      component.bagConfig.set('SGL');
      component.filterForm.get('collectionDate')?.setValue(new Date());
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onRetrieve();
      tick();
      expect(component.bagConfig()).toBe('');
    }));




  });

  // ── onDriveChange ───────────────────────────────────────────────────────────

  describe('onDriveChange', () => {
    it('should clear driveDescription when driveId is empty', () => {
      component.driveDescription.set('Some Site');
      component.onDriveChange('');
      expect(component.driveDescription()).toBe('');
    });
  });

  // ── onUnitPostValidate / onUnitValidated (UnitIdFieldComponent integration) ─

  describe('onUnitPostValidate', () => {
    function makeEvent(parsedUnitId: string): { event: any; confirmSpy: jasmine.Spy; rejectSpy: jasmine.Spy } {
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      return {
        event: { data: { parsedUnitId } as any, confirm: confirmSpy, reject: rejectSpy },
        confirmSpy,
        rejectSpy,
      };
    }

    it('should call validateUnit with parsedUnitId', fakeAsync(() => {
      component.filterForm.get('collectionDate')?.setValue(new Date());
      component.filterForm.get('driveId')?.setValue('DRV-001');
      const { event } = makeEvent('U-0001');
      component.onUnitPostValidate(event);
      tick();
      expect(serviceSpy.validateUnit).toHaveBeenCalledWith('U-0001', jasmine.any(String), 'DRV-001');
    }));

    it('should allow and confirm when unit is already checked in (loads existing data for editing)', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({
        unitId: 'U-0002', parsedUnitId: 'U-0002', alreadyCheckedIn: true, hasTubeData: false,
      }));
      component.filterForm.get('collectionDate')?.setValue(new Date());
      component.filterForm.get('driveId')?.setValue('DRV-001');
      const { event, confirmSpy, rejectSpy } = makeEvent('U-0002');
      component.onUnitPostValidate(event);
      tick();
      expect(confirmSpy).toHaveBeenCalled();
      expect(rejectSpy).not.toHaveBeenCalled();
    }));





    it('should update collectionDate form field when validateUnit returns collDate', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({
        unitId: 'U-0001', parsedUnitId: 'U-0001', alreadyCheckedIn: false, hasTubeData: false,
        collDate: '2026-06-06',
      }));
      const { event } = makeEvent('U-0001');
      component.filterForm.get('collectionDate')?.setValue(new Date());
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onUnitPostValidate(event);
      tick();
      const collDate = component.filterForm.get('collectionDate')?.value as Date;
      expect(collDate instanceof Date).toBeTrue();
      expect(collDate.getFullYear()).toBe(2026);
      expect(collDate.getMonth()).toBe(5);
      expect(collDate.getDate()).toBe(6);
    }));

    it('should not change collectionDate when validateUnit returns no collDate', fakeAsync(() => {
      const originalDate = component.filterForm.get('collectionDate')?.value;
      const { event } = makeEvent('U-0001');
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onUnitPostValidate(event);
      tick();
      expect(component.filterForm.get('collectionDate')?.value).toEqual(originalDate);
    }));
  });

  describe('onUnitValidated', () => {


    it('should populate bagConfig from unit details', fakeAsync(() => {
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onUnitValidated({ parsedUnitId: 'U-0001' } as any);
      tick();
      expect(component.bagConfig()).toBe('SGL');
    }));

    it('should set isPheresisDonation from unit details (false)', fakeAsync(() => {
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onUnitValidated({ parsedUnitId: 'U-0001' } as any);
      tick();
      expect(component.isPheresisDonation()).toBeFalse();
    }));

    it('should set isPheresisDonation to true when unit is pheresis', fakeAsync(() => {
      serviceSpy.getUnitDetails.and.returnValue(of({ ...mockUnitDetail, isPheresis: true }));
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onUnitValidated({ parsedUnitId: 'U-0001' } as any);
      tick();
      expect(component.isPheresisDonation()).toBeTrue();
    }));

    it('should format bleedStartTime as HH:mm and bleedStartDate as a Date', fakeAsync(() => {
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onUnitValidated({ parsedUnitId: 'U-0001' } as any);
      tick();
      expect(component.unitForm.get('bleedStartTime')?.value).toBe('08:00');
      const startDate = component.unitForm.get('bleedStartDate')?.value as Date;
      expect(startDate instanceof Date).toBeTrue();
    }));

    it('should format bleedEndTime as HH:mm and bleedEndDate as a Date', fakeAsync(() => {
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onUnitValidated({ parsedUnitId: 'U-0001' } as any);
      tick();
      expect(component.unitForm.get('bleedEndTime')?.value).toBe('08:10');
      const endDate = component.unitForm.get('bleedEndDate')?.value as Date;
      expect(endDate instanceof Date).toBeTrue();
    }));

    it('should set empty string for bleedStartTime when API returns null', fakeAsync(() => {
      serviceSpy.getUnitDetails.and.returnValue(of({ ...mockUnitDetail, bleedStartTime: null }));
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onUnitValidated({ parsedUnitId: 'U-0001' } as any);
      tick();
      expect(component.unitForm.get('bleedStartTime')?.value).toBe('');
    }));



    it('should update donorInfo signal when donorFormAbo is set via patchValue (emitEvent:false path)', fakeAsync(() => {
      component.aboOptions.set(mockAboOptions);
      component.filterForm.get('driveId')?.setValue('DRV-001');
      serviceSpy.getUnitDetails.and.returnValue(of({ ...mockUnitDetail, donorFormAbo: 'O+' }));
      component.onUnitValidated({ parsedUnitId: 'U-0001' } as any);
      tick();
      expect(component.donorInfo()).toContain('O+');
    }));

    it('should deduplicate attributes with same group+code when loading unit details', fakeAsync(() => {
      const dupAttributes = [
        { attribGroup: 'DON', attribCode: 'A1', groupDesc: 'Donation', codeDesc: 'Attr 1', requiresEquipment: 'N', parmCode: '' },
        { attribGroup: 'DON', attribCode: 'A1', groupDesc: 'Donation', codeDesc: 'Attr 1', requiresEquipment: 'N', parmCode: '' },
      ];
      serviceSpy.getUnitDetails.and.returnValue(of({ ...mockUnitDetail, attributes: dupAttributes as any }));
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onUnitValidated({ parsedUnitId: 'U-0001' } as any);
      tick();
      expect(component.attributeRows().length).toBe(1);
    }));

    it('should use equipReference fallback when equipment is absent (GAP 10)', fakeAsync(() => {
      const attrWithEquip = [
        { attribGroup: 'PHER', attribCode: 'P1', groupDesc: 'Pheresis', codeDesc: 'Machine', requiresEquipment: 'Y', parmCode: 'PARM1' },
      ];
      serviceSpy.getUnitDetails.and.returnValue(of({
        ...mockUnitDetail, attributes: attrWithEquip as any, equipment: undefined, equipReference: 'EQ-001',
      }));
      serviceSpy.getMachines.and.returnValue(of(mockMachines));
      component.filterForm.get('driveId')?.setValue('DRV-001');
      component.onUnitValidated({ parsedUnitId: 'U-0001' } as any);
      tick();
      expect(serviceSpy.getMachines).toHaveBeenCalled();
      expect(component.unitForm.get('machine')?.value).toBe('EQ-001');
    }));
  });

  // ── Attribute Rows ──────────────────────────────────────────────────────────

  describe('Attribute Rows', () => {




    it('canAddAttribute should always be true (no row cap)', () => {
      for (let i = 0; i < 5; i++) component.onAddAttribute();
      expect(component.canAddAttribute()).toBeTrue();
    });



    it('should load attribute codes on onGroupChange', fakeAsync(() => {
      component.onAddAttribute();
      const row = component.attributeRows()[0];
      component.onGroupChange(row, 'GRP1');
      tick();
      expect(serviceSpy.getAttributeCodes).toHaveBeenCalledWith('GRP1', jasmine.anything());
    }));

    it('should update group description on onGroupChange', fakeAsync(() => {
      component.onAddAttribute();
      const row = component.attributeRows()[0];
      component.onGroupChange(row, 'GRP1');
      tick();
      const updated = component.attributeRows()[0];
      expect(updated.groupDesc).toContain('General Attributes');
    }));

    it('should set requiresEquipment on onCodeChange with equipment code', fakeAsync(() => {
      component.onAddAttribute();
      const row = component.attributeRows()[0];
      component.onGroupChange(row, 'GRP1');
      tick();
      const updatedRow = component.attributeRows()[0];
      updatedRow.filteredCodes.set(mockAttributeCodes);
      component.onCodeChange(updatedRow, 'ATR2');
      expect(component.attributeRows()[0].requiresEquipment).toBeTrue();
    }));

    it('should show machine section when attribute requires equipment', fakeAsync(() => {
      component.onAddAttribute();
      const row = component.attributeRows()[0];
      component.onGroupChange(row, 'GRP1');
      tick();
      const updatedRow = component.attributeRows()[0];
      updatedRow.filteredCodes.set(mockAttributeCodes);
      component.onCodeChange(updatedRow, 'ATR2');
      expect(component.showMachine()).toBeTrue();
    }));

    it('should hide machine section when no equipment-requiring attribute', () => {
      expect(component.showMachine()).toBeFalse();
    });
  });

  // ── Machine Selection ───────────────────────────────────────────────────────

  describe('Machine Selection', () => {
    it('should set donorCue on onMachineChange', fakeAsync(() => {
      component.machineOptions.set(mockMachines);
      component.onMachineChange('EQ-001');
      tick();
      expect(component.donorCue()).toBe('Centrifuge');
    }));

    it('should set serialNumber on onMachineChange', fakeAsync(() => {
      component.machineOptions.set(mockMachines);
      component.onMachineChange('EQ-001');
      tick();
      expect(component.serialNumber()).toBe('SN001');
    }));

    it('should clear donorCue for unknown machine', () => {
      component.machineOptions.set(mockMachines);
      component.onMachineChange('UNKNOWN');
      expect(component.donorCue()).toBe('');
    });
  });

  // ── onSave ──────────────────────────────────────────────────────────────────

  function setUnitIdFieldValid(parsedUnitId: string): void {
    Object.defineProperty(component, 'unitIdField', {
      get: () => ({ isValid: true, parsedUnitId, clear: jasmine.createSpy('clear') }),
      configurable: true,
    });
  }

  describe('onSave', () => {
    const pastDate = new Date(2026, 0, 1);

    function setupBleedFields(): void {
      component.filterForm.patchValue({ collectionDate: pastDate });
      component.unitForm.patchValue({
        bleedStartDate: pastDate,
        bleedStartTime: '08:00',
        bleedEndDate:   pastDate,
        bleedEndTime:   '08:10',
      });
    }







    it('should fall back to default success message when result.message is absent', fakeAsync(() => {
      setUnitIdFieldValid('U-0001');
      serviceSpy.save.and.returnValue(of({ success: true }));
      component.filterForm.get('driveId')?.setValue('DRV-001');
      setupBleedFields();
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Unit checked in successfully.');
    }));





    it('should reset unit fields after successful save', fakeAsync(() => {
      setUnitIdFieldValid('U-0001');
      component.filterForm.get('driveId')?.setValue('DRV-001');
      setupBleedFields();
      component.bagConfig.set('SGL');
      component.onSave();
      tick();
      expect(component.bagConfig()).toBe('');
    }));
  });

  // ── onCancel ────────────────────────────────────────────────────────────────

  describe('onCancel', () => {


    it('should reset attributeRows to empty on cancel', () => {
      component.onAddAttribute();
      component.onCancel();
      expect(component.attributeRows()).toEqual([]);
    });
  });

  // ── Bleed Time Validation ───────────────────────────────────────────────────

  describe('validateBleedStart', () => {
    it('should clear errors when date and time are both empty', () => {
      component.bleedStartDateError.set('some error');
      component.bleedStartFutureError.set(true);
      component.unitForm.get('bleedStartDate')?.setValue(null);
      component.unitForm.get('bleedStartTime')?.setValue('');
      component.validateBleedStart();
      expect(component.bleedStartDateError()).toBe('');
      expect(component.bleedStartFutureError()).toBeFalse();
    });

    it('should set bleedStartDateError when date part does not match collection date', () => {
      component.filterForm.get('collectionDate')?.setValue(new Date());
      component.unitForm.get('bleedStartDate')?.setValue(new Date(2020, 0, 1));
      component.unitForm.get('bleedStartTime')?.setValue('08:00');
      component.validateBleedStart();
      expect(component.bleedStartDateError()).toContain('must match');
    });

    it('should set bleedStartFutureError when time is in the future', () => {
      const d = new Date(Date.now() + 3_600_000);
      const pad = (n: number) => String(n).padStart(2, '0');
      const futureTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      component.filterForm.get('collectionDate')?.setValue(null);
      component.unitForm.get('bleedStartDate')?.setValue(d);
      component.unitForm.get('bleedStartTime')?.setValue(futureTime);
      component.validateBleedStart();
      expect(component.bleedStartFutureError()).toBeTrue();
    });

    it('should clear errors for a valid past time matching collection date', () => {
      component.filterForm.get('collectionDate')?.setValue(new Date(2020, 5, 15));
      component.unitForm.get('bleedStartDate')?.setValue(new Date(2020, 5, 15));
      component.unitForm.get('bleedStartTime')?.setValue('08:00');
      component.validateBleedStart();
      expect(component.bleedStartDateError()).toBe('');
      expect(component.bleedStartFutureError()).toBeFalse();
    });
  });

  describe('validateBleedEnd', () => {
    it('should clear errors when date and time are both empty', () => {
      component.bleedEndFutureError.set(true);
      component.unitForm.get('bleedEndDate')?.setValue(null);
      component.unitForm.get('bleedEndTime')?.setValue('');
      component.validateBleedEnd();
      expect(component.bleedEndFutureError()).toBeFalse();
    });

    it('should set bleedEndFutureError when time is in the future', () => {
      const d = new Date(Date.now() + 3_600_000);
      const pad = (n: number) => String(n).padStart(2, '0');
      const futureTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      component.unitForm.get('bleedEndDate')?.setValue(d);
      component.unitForm.get('bleedEndTime')?.setValue(futureTime);
      component.validateBleedEnd();
      expect(component.bleedEndFutureError()).toBeTrue();
    });

    it('should clear errors for a valid past end time', () => {
      component.unitForm.get('bleedStartDate')?.setValue(new Date(2020, 5, 15));
      component.unitForm.get('bleedStartTime')?.setValue('08:00');
      component.unitForm.get('bleedEndDate')?.setValue(new Date(2020, 5, 15));
      component.unitForm.get('bleedEndTime')?.setValue('09:00');
      component.validateBleedEnd();
      expect(component.bleedEndFutureError()).toBeFalse();
      expect(component.unitForm.get('bleedEndTime')?.errors).toBeNull();
    });
  });

  // ── Chapter Config ──────────────────────────────────────────────────────────

  describe('loadChapterConfig', () => {
    it('should set maxBleedTimeMinutes from service response', fakeAsync(() => {
      tick();
      expect(component.maxBleedTimeMinutes()).toBe(30);
    }));

    it('should set slowBleedTimeMinutes from service response', fakeAsync(() => {
      tick();
      expect(component.slowBleedTimeMinutes()).toBe(20);
    }));

    it('should keep maxBleedTimeMinutes at 0 when service returns 0', fakeAsync(() => {
      serviceSpy.getChapterConfig.and.returnValue(of({ maxBleedTime: 0, slowBleedTime: 0, cueScanFlag: '', timeLimitDays: 0 }));
      component.ngOnInit();
      tick();
      expect(component.maxBleedTimeMinutes()).toBe(0);
    }));

    it('should keep slowBleedTimeMinutes at 0 when service returns 0', fakeAsync(() => {
      serviceSpy.getChapterConfig.and.returnValue(of({ maxBleedTime: 0, slowBleedTime: 0, cueScanFlag: '', timeLimitDays: 0 }));
      component.ngOnInit();
      tick();
      expect(component.slowBleedTimeMinutes()).toBe(0);
    }));
  });

  // ── PHER/DON Duplicate Check (Gaps 9 & 10) ─────────────────────────────────

  describe('onGroupChange — PHER/DON duplicate check', () => {




    it('should allow other groups to be added multiple times', fakeAsync(() => {
      component.onAddAttribute();
      component.onAddAttribute();
      const [row1, row2] = component.attributeRows();

      component.onGroupChange(row1, 'GRP1');
      tick();
      component.onGroupChange(row2, 'GRP1');
      tick();

      // No error for non-PHER/DON groups
      expect(component.attributeRows()[1].group).toBe('GRP1');
    }));
  });

  // ── Duplicate Group+Code Check (Gap 11) ────────────────────────────────────

  describe('onCodeChange — duplicate group+code check', () => {


    it('should allow same code in different groups', fakeAsync(() => {
      component.onAddAttribute();
      component.onAddAttribute();
      const rows = component.attributeRows();

      component.onGroupChange(rows[0], 'GRP1');
      tick();
      component.onGroupChange(rows[1], 'GRP2');
      tick();

      // Set ATR1 on both rows (different groups)
      const row0 = component.attributeRows()[0];
      row0.filteredCodes.set(mockAttributeCodes);
      component.onCodeChange(row0, 'ATR1');

      const row1 = component.attributeRows()[1];
      row1.filteredCodes.set(mockAttributeCodes);
      component.onCodeChange(row1, 'ATR1');

      // No error — different groups
      expect(component.attributeRows()[1].code).toBe('ATR1');
    }));
  });

  // ── filterDriveId getter ────────────────────────────────────────────────────

  describe('filterDriveId', () => {
    it('should return trimmed driveId from filterForm', () => {
      component.filterForm.get('driveId')?.setValue('  DRV-001  ');
      expect(component.filterDriveId).toBe('DRV-001');
    });


  });

  // ── donorInfo signal updates from ABO select ────────────────────────────────

  describe('ABO selection → donorInfo signal', () => {
    it('should update donorInfo when donorFormAbo is set and aboOptions are loaded', fakeAsync(() => {
      component.aboOptions.set(mockAboOptions);
      component.unitForm.get('donorFormAbo')?.setValue('O+');
      tick();
      expect(component.donorInfo()).toContain('O+');
    }));


  });

  // ── Machine search filtering ────────────────────────────────────────────────

  describe('Machine Search Filtering', () => {
    beforeEach(() => {
      component.machineOptions.set(mockMachines);
      component.filteredMachines.set([...mockMachines]);
    });

    it('should filter machines based on search term', fakeAsync(() => {
      component.machineSearchCtrl.setValue('centrifuge');
      tick();
      expect(component.filteredMachines().length).toBe(1);
    }));

    it('should show all machines when search is cleared', fakeAsync(() => {
      component.machineSearchCtrl.setValue('xxx');
      tick();
      component.machineSearchCtrl.setValue('');
      tick();
      expect(component.filteredMachines().length).toBe(1);
    }));
  });

  // ── Lifecycle ───────────────────────────────────────────────────────────────
});
