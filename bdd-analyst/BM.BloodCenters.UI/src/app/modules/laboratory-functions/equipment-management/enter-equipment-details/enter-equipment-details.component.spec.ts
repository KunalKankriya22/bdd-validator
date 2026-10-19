import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import moment from 'moment';

import { EnterEquipmentDetailsComponent } from './enter-equipment-details.component';
import { EquipmentApiService } from './services/equipment-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DropdownOption, EquipmentDto } from './models/equipment.models';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('EnterEquipmentDetailsComponent', () => {
  let component: EnterEquipmentDetailsComponent;
  let fixture: ComponentFixture<EnterEquipmentDetailsComponent>;
  let equipmentApiServiceSpy: jasmine.SpyObj<EquipmentApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let chapterTimezoneServiceMock: any;

  const mockEquipmentTypes: DropdownOption[] = [
    { value: 'SCAN', label: 'SCAN', description: 'Barcode Scanner' },
    { value: 'CENT', label: 'CENT', description: 'Centrifuge Equipment' }
  ];

  // No description — prevents auto-populate from interfering with retrieve-path tests
  const mockEquipmentIds: DropdownOption[] = [
    { value: '0001', label: '0001' },
    { value: '0002', label: '0002' }
  ];

  const mockLocations: DropdownOption[] = [
    { value: 'LABA', label: 'LABA', description: 'Laboratory A - Room 101' },
    { value: 'LABB', label: 'LABB', description: 'Laboratory B - Room 202' }
  ];

  const mockStatuses: DropdownOption[] = [
    { value: 'IN', label: 'In Service', description: 'In Service Description' },
    { value: 'OUT', label: 'Out of Service', description: 'Out of Service Description' }
  ];

  const mockEquipmentDto: EquipmentDto = {
    equipType: 'SCAN',
    equipId: '0001',
    equipReference: 'EQ-000042',
    instId: null,
    chapterId: 'CH001',
    serialNumber: 'SN123456',
    location: 'LABA',
    status: 'IN',
    inServiceDate: '2024-01-01',
    outServiceDate: null,
    manufacturer: 'Manufacturer A',
    osokFlag: 'Y',
    firstProductionDate: '2024-01-15',
    lastProductionDate: null,
    serviceContact: 'John Doe',
    servicePhone: '555-1234',
    serviceStartDate: null,
    serviceEndDate: null,
    lastModifiedDate: '2024-06-01',
    modifiedBy: 'admin',
    auditKey: 99,
    programId: 'PROG01'
  };

  beforeEach(async () => {
    const todayMoment = moment().startOf('day');
    chapterTimezoneServiceMock = {
      chapterLocalDate: () => todayMoment
    };

    equipmentApiServiceSpy = jasmine.createSpyObj('EquipmentApiService', [
      'getEquipmentTypes',
      'getEquipmentIds',
      'getLocations',
      'getStatuses',
      'getAll',
      'getByKey',
      'create',
      'update',
      'delete'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['findMenuItemByPath']);
    (menuServiceSpy as any).getMenuItemsSignal = jasmine.createSpy().and.returnValue(() => []);

    equipmentApiServiceSpy.getEquipmentTypes.and.returnValue(of(mockEquipmentTypes));
    equipmentApiServiceSpy.getEquipmentIds.and.returnValue(of(mockEquipmentIds));
    equipmentApiServiceSpy.getLocations.and.returnValue(of(mockLocations));
    equipmentApiServiceSpy.getStatuses.and.returnValue(of(mockStatuses));
    equipmentApiServiceSpy.create.and.returnValue(of({
      success: true,
      statusCode: 201,
      message: '',
      data: { equipReference: 'EQ-000042' }
    }));
    equipmentApiServiceSpy.update.and.returnValue(of({
      success: true,
      statusCode: 200,
      message: 'Updated successfully'
    }));
    equipmentApiServiceSpy.getByKey.and.returnValue(of({
      success: true,
      statusCode: 200,
      message: '',
      data: mockEquipmentDto
    }));
    equipmentApiServiceSpy.getAll.and.returnValue(of({
      success: true,
      statusCode: 200,
      message: '',
      data: [mockEquipmentDto]
    }));

    await TestBed.configureTestingModule({
      imports: [
        EnterEquipmentDetailsComponent,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: EquipmentApiService, useValue: equipmentApiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: { chapterId: jasmine.createSpy().and.returnValue('CH001') } },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnterEquipmentDetailsComponent);
    component = fixture.componentInstance;
  });

  // ── Initialization ──────────────────────────────────────────────────────────

  describe('Initialization', () => {
    it('should initialize form with correct structure', () => {
      fixture.detectChanges();

      const controls = [
        'equipType', 'equipId', 'equipRef', 'instId',
        'status', 'serialNumber', 'location',
        'inServiceDate', 'outServiceDate',
        'firstProductionDate', 'lastProductionDate',
        'manufacturer', 'exportFlag',
        'serviceContact', 'servicePhone',
        'serviceStartDate', 'serviceEndDate'
      ];
      controls.forEach(ctrl => expect(component.form.get(ctrl)).withContext(ctrl).toBeTruthy());
    });

    it('should load dropdown data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(equipmentApiServiceSpy.getEquipmentTypes).toHaveBeenCalled();
      expect(equipmentApiServiceSpy.getLocations).toHaveBeenCalled();
      expect(equipmentApiServiceSpy.getStatuses).toHaveBeenCalled();
      expect((component as any).equipmentTypes()).toEqual(mockEquipmentTypes);
      expect((component as any).locations()).toEqual(mockLocations);
      expect((component as any).statuses()).toEqual(mockStatuses);
    }));

    it('should expose Y/N export flag options', () => {
      expect(component.exportFlagOptions).toEqual([
        { value: 'Y', label: 'Y' },
        { value: 'N', label: 'N' }
      ]);
    });
  });

  // ── Loading State ───────────────────────────────────────────────────────────
  // ── Empty State ─────────────────────────────────────────────────────────────

  describe('Empty State', () => {
    it('should display empty state when no equipment selected', () => {
      fixture.detectChanges();

      const stateContainer = fixture.debugElement.query(By.css('.state-container'));
      expect(stateContainer).toBeTruthy();
      expect(stateContainer.nativeElement.textContent).toContain('No Results to Display');
      expect(stateContainer.nativeElement.textContent).toContain('Enter details to begin.');
    });
  });

  // ── Form Validation ─────────────────────────────────────────────────────────

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require Equipment Type', () => {
      const ctrl = component.form.get('equipType');
      ctrl?.setValue('');
      expect(ctrl?.hasError('required')).toBe(true);
    });

    it('should require Equipment ID', () => {
      const ctrl = component.form.get('equipId');
      ctrl?.setValue('');
      expect(ctrl?.hasError('required')).toBe(true);
    });

    it('should require Status', () => {
      const ctrl = component.form.get('status');
      ctrl?.setValue(null);
      expect(ctrl?.hasError('required')).toBe(true);
    });

    it('should require First Production Date', () => {
      const ctrl = component.form.get('firstProductionDate');
      ctrl?.setValue(null);
      expect(ctrl?.hasError('required')).toBe(true);
    });

    it('should validate Equipment Type max length (5 chars)', () => {
      component.form.get('equipType')?.setValue('TOOLONG');
      expect(component.form.get('equipType')?.hasError('maxlength')).toBe(true);
    });

    it('should validate Equipment ID max length (4 chars)', () => {
      component.form.get('equipId')?.setValue('12345');
      expect(component.form.get('equipId')?.hasError('maxlength')).toBe(true);
    });

    it('should validate Equip Ref max length (9 chars)', () => {
      component.form.get('equipRef')?.setValue('A'.repeat(10));
      expect(component.form.get('equipRef')?.hasError('maxlength')).toBe(true);
    });

    it('should validate Institution ID max length (4 chars)', () => {
      component.form.get('instId')?.setValue('12345');
      expect(component.form.get('instId')?.hasError('maxlength')).toBe(true);
    });

    it('should validate Serial Number max length (12 chars)', () => {
      component.form.get('serialNumber')?.setValue('A'.repeat(13));
      expect(component.form.get('serialNumber')?.hasError('maxlength')).toBe(true);
    });

    it('should validate Manufacturer max length (50 chars)', () => {
      component.form.get('manufacturer')?.setValue('A'.repeat(51));
      expect(component.form.get('manufacturer')?.hasError('maxlength')).toBe(true);
    });

    it('should validate Service Contact max length (50 chars)', () => {
      component.form.get('serviceContact')?.setValue('A'.repeat(51));
      expect(component.form.get('serviceContact')?.hasError('maxlength')).toBe(true);
    });

    it('should validate Service Phone max length (20 chars)', () => {
      component.form.get('servicePhone')?.setValue('A'.repeat(21));
      expect(component.form.get('servicePhone')?.hasError('maxlength')).toBe(true);
    });
  });

  // ── Future Date Validation (noFutureDateValidatorFactory) ───────────────────

  describe('Future Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    const futureDate = () => moment().add(1, 'day').toDate();
    const pastDate   = () => moment().subtract(1, 'day').toDate();

    it('should reject a future inServiceDate', () => {
      const ctrl = component.form.get('inServiceDate');
      ctrl?.setValue(futureDate());
      expect(ctrl?.hasError('futureDate')).toBe(true);
    });

    it('should accept a past inServiceDate', () => {
      const ctrl = component.form.get('inServiceDate');
      ctrl?.setValue(pastDate());
      expect(ctrl?.hasError('futureDate')).toBeFalsy();
    });

    it('should accept a future outServiceDate (can schedule future decommission)', () => {
      const ctrl = component.form.get('outServiceDate');
      ctrl?.setValue(futureDate());
      expect(ctrl?.hasError('futureDate')).toBeFalsy();
    });

    it('should accept a future firstProductionDate (only pastDate blocked, not future)', () => {
      const ctrl = component.form.get('firstProductionDate');
      ctrl?.setValue(futureDate());
      expect(ctrl?.hasError('pastDate')).toBeFalsy();
    });

    it('should reject a past firstProductionDate', () => {
      const ctrl = component.form.get('firstProductionDate');
      ctrl?.setValue(pastDate());
      expect(ctrl?.hasError('pastDate')).toBe(true);
    });

    it('should accept a past firstProductionDate (only futureDate blocked, not past)', () => {
      const ctrl = component.form.get('firstProductionDate');
      ctrl?.setValue(pastDate());
      expect(ctrl?.hasError('futureDate')).toBeFalsy();
    });

    it('should reject a past lastProductionDate', () => {
      const ctrl = component.form.get('lastProductionDate');
      ctrl?.setValue(pastDate());
      expect(ctrl?.hasError('pastDate')).toBe(true);
    });

    it('should accept a future lastProductionDate', () => {
      const ctrl = component.form.get('lastProductionDate');
      ctrl?.setValue(futureDate());
      expect(ctrl?.hasError('pastDate')).toBeFalsy();
    });

    it('should reject a future serviceStartDate', () => {
      const ctrl = component.form.get('serviceStartDate');
      ctrl?.setValue(futureDate());
      expect(ctrl?.hasError('futureDate')).toBe(true);
    });

    it('should accept a future serviceEndDate (service contracts can end in the future)', () => {
      const ctrl = component.form.get('serviceEndDate');
      ctrl?.setValue(futureDate());
      expect(ctrl?.hasError('futureDate')).toBeFalsy();
    });


    it('maxDate computed should use chapter local date from service', async () => {
      const chapDate = moment('2026-06-15').startOf('day');
      chapterTimezoneServiceMock.chapterLocalDate = () => chapDate;
      const freshFixture = TestBed.createComponent(EnterEquipmentDetailsComponent);
      freshFixture.detectChanges();

      const maxDate = (freshFixture.componentInstance as any).maxDate();
      expect(maxDate.format('YYYY-MM-DD')).toBe('2026-06-15');
      freshFixture.destroy();
    });

    it('maxDate computed should fall back to today when chapter date is null', () => {
      chapterTimezoneServiceMock.chapterLocalDate = () => null;
      fixture.detectChanges();

      const maxDate = (component as any).maxDate();
      expect(maxDate.format('YYYY-MM-DD')).toBe(moment().startOf('day').format('YYYY-MM-DD'));
    });
  });

  // ── Cascading Dropdowns ─────────────────────────────────────────────────────

  describe('Cascading Dropdowns', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load Equipment IDs when Equipment Type changes', fakeAsync(() => {
      component.form.get('equipType')?.setValue('SCAN');
      tick();

      expect(equipmentApiServiceSpy.getEquipmentIds).toHaveBeenCalledWith('SCAN');
      expect((component as any).equipmentIds()).toEqual(mockEquipmentIds);
    }));

    it('should clear Equipment ID when Equipment Type changes', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();

      component.form.get('equipType')?.setValue('CENT');
      tick();

      expect(component.form.get('equipId')?.value).toBeNull();
    }));

    it('should clear Equipment IDs list when Equipment Type is cleared', fakeAsync(() => {
      component.form.get('equipType')?.setValue('SCAN');
      tick();

      component.form.get('equipType')?.setValue(null);
      tick();

      expect((component as any).equipmentIds()).toEqual([]);
    }));

    it('should NOT auto-populate equipRef on Equipment ID selection (loaded only on retrieve)', fakeAsync(() => {
      component.form.get('equipType')?.setValue('SCAN');
      tick();

      component.form.get('equipId')?.setValue('0001');
      tick();

      expect(component.form.get('equipRef')?.value).toBeNull();
    }));

  });

  // ── Search / Filter ─────────────────────────────────────────────────────────

  describe('Search / Filter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return all equipment types when type search is empty', () => {
      component.equipTypeSearchCtrl.setValue('');
      expect((component as any).filteredEquipmentTypes()).toEqual(mockEquipmentTypes);
    });

    it('should return all equipment IDs when ID input is empty', fakeAsync(() => {
      component.form.get('equipType')?.setValue('SCAN');
      tick();

      component.form.get('equipId')?.setValue('');
      tick();
      expect((component as any).filteredEquipmentIds()).toEqual(mockEquipmentIds);
    }));

    it('should return all locations when location search is empty', () => {
      component.locationSearchCtrl.setValue('');
      expect((component as any).filteredLocations()).toEqual(mockLocations);
    });

    it('should filter equipment types by description', () => {
      component.equipTypeSearchCtrl.setValue('Barcode');
      const filtered = (component as any).filteredEquipmentTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('SCAN');
    });

    it('should return empty array when no equipment type or ID matches search', () => {
      component.equipTypeSearchCtrl.setValue('ZZZZZ');
      expect((component as any).filteredEquipmentTypes()).toEqual([]);
    });
  });

  // ── Computed Values ─────────────────────────────────────────────────────────

  describe('Computed Values', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should compute Equipment Type Name from selected type', () => {
      component.form.get('equipType')?.setValue('SCAN');
      fixture.detectChanges();

      expect((component as any).equipmentTypeName()).toBe('Barcode Scanner');
    });

    it('should compute Location Description from selected location', () => {
      component.form.get('location')?.setValue('LABA');
      fixture.detectChanges();

      expect((component as any).locationDescription()).toBe('Laboratory A - Room 101');
    });

    it('should compute description from retrieved equipment type', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.onRetrieve();
      tick();

      expect((component as any).description()).toBe('Barcode Scanner');
    }));

    it('should compute equipmentReference from retrieved data', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.onRetrieve();
      tick();

      expect((component as any).equipmentReference()).toBe('EQ-000042');
    }));

    it('instName should always return empty string (placeholder until API adds field)', () => {
      expect((component as any).instName()).toBe('');
    });

    it('should compute statusDescription from selected status', fakeAsync(() => {
      component.form.get('status')?.setValue('IN');
      tick();
      fixture.detectChanges();

      expect((component as any).statusDescription()).toBe('In Service Description');
    }));

  });

  // ── Status Value Signal ─────────────────────────────────────────────────────

  describe('Status Value Signal', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update statusValue signal when status form control changes', fakeAsync(() => {
      component.form.get('status')?.setValue('OUT');
      tick();

      expect((component as any).statusValue()).toBe('OUT');
    }));

    it('should set statusValue to null when status is cleared', fakeAsync(() => {
      component.form.get('status')?.setValue('IN');
      tick();

      component.form.get('status')?.setValue(null);
      tick();

      expect((component as any).statusValue()).toBeNull();
    }));

  });

  // ── Retrieve Functionality ──────────────────────────────────────────────────

  describe('Retrieve Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error when retrieving without Equipment Type or ID', () => {
      component.onRetrieve();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please select Equipment Type and ID before retrieving.'
      );
      expect(equipmentApiServiceSpy.getAll).not.toHaveBeenCalled();
      expect(equipmentApiServiceSpy.getByKey).not.toHaveBeenCalled();
    });

    it('should call getByKey when equipRef is provided', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.form.get('equipRef')?.setValue('EQ-000042', { emitEvent: false });

      component.onRetrieve();
      tick();

      expect(equipmentApiServiceSpy.getByKey).toHaveBeenCalledWith('SCAN', '0001', 'EQ-000042');
      expect(equipmentApiServiceSpy.getAll).not.toHaveBeenCalled();
    }));

    it('should call getAll when equipRef is empty', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      // Ensure equipRef is null (default when mockEquipmentIds has no description)
      component.form.get('equipRef')?.setValue(null, { emitEvent: false });

      component.onRetrieve();
      tick();

      expect(equipmentApiServiceSpy.getAll).toHaveBeenCalledWith(1, 0, {
        equipType: 'SCAN',
        equipId: '0001',
        chapterId: 'CH001'
      });
      expect(equipmentApiServiceSpy.getByKey).not.toHaveBeenCalled();
    }));

    it('should populate form after successful getByKey retrieve', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.form.get('equipRef')?.setValue('EQ-000042', { emitEvent: false });

      component.onRetrieve();
      tick();

      expect(component.form.get('serialNumber')?.value).toBe('SN123456');
      expect(component.form.get('manufacturer')?.value).toBe('Manufacturer A');
      expect(component.form.get('status')?.value).toBe('IN');
    }));

    it('should update locationValue signal after retrieve', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.onRetrieve();
      tick();

      expect((component as any).locationValue()).toBe('LABA');
    }));

    it('should populate configurableDetails after retrieve', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.form.get('equipRef')?.setValue(null, { emitEvent: false });
      component.onRetrieve();
      tick();

      const details = (component as any).configurableDetails();
      expect(details.length).toBe(5);
      expect(details[0]).toEqual(jasmine.objectContaining({ sequence: 1, detail: 'Chapter', value: 'CH001' }));
      expect(details[1]).toEqual(jasmine.objectContaining({ sequence: 2, detail: 'Last Modified Date', value: '2024-06-01' }));
      expect(details[2]).toEqual(jasmine.objectContaining({ sequence: 3, detail: 'Modified By', value: 'admin' }));
      expect(details[3]).toEqual(jasmine.objectContaining({ sequence: 4, detail: 'Audit Key', value: '99' }));
      expect(details[4]).toEqual(jasmine.objectContaining({ sequence: 5, detail: 'Program ID', value: 'PROG01' }));
    }));

    it('should clear configurableDetails when retrieved equipment is null', fakeAsync(() => {
      equipmentApiServiceSpy.getAll.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: []
      }));

      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.form.get('equipRef')?.setValue(null, { emitEvent: false });
      component.onRetrieve();
      tick();

      expect((component as any).configurableDetails()).toEqual([]);
    }));

    it('should inject fallback location option when retrieved location is not in dropdown', fakeAsync(() => {
      const dtoWithRareLocation: EquipmentDto = { ...mockEquipmentDto, location: 'LABC' };
      equipmentApiServiceSpy.getAll.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [dtoWithRareLocation]
      }));

      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.form.get('equipRef')?.setValue(null, { emitEvent: false });
      component.onRetrieve();
      tick();

      expect((component as any).locations().some((l: DropdownOption) => l.value === 'LABC')).toBe(true);
    }));

    it('should handle retrieve error from getByKey and reset loading', fakeAsync(() => {
      equipmentApiServiceSpy.getByKey.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Record not found' } } }))
      );

      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.form.get('equipRef')?.setValue('EQ-999999', { emitEvent: false });

      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Record not found');
      expect((component as any).loading()).toBe(false);
    }));

    it('should handle retrieve error from getAll and reset loading', fakeAsync(() => {
      equipmentApiServiceSpy.getAll.and.returnValue(
        throwError(() => ({ message: 'Server error' }))
      );

      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.form.get('equipRef')?.setValue(null, { emitEvent: false });

      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect((component as any).loading()).toBe(false);
    }));
  });

  // ── GAP-15: Auto Status on Out-of-Service Date ──────────────────────────────

  describe('GAP-15: Auto Status on Out-of-Service Date', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not change status when today is before in-service date', fakeAsync(() => {
      const tomorrow        = moment().add(1, 'day').toDate();
      const dayAfterTomorrow = moment().add(2, 'day').toDate();

      component.form.get('status')?.setValue('IN', { emitEvent: false });
      component.form.get('inServiceDate')?.setValue(tomorrow, { emitEvent: false });
      component.form.get('outServiceDate')?.setValue(dayAfterTomorrow);
      tick();

      expect(component.form.get('status')?.value).toBe('IN');
    }));

    it('should not change status when outServiceDate is null', fakeAsync(() => {
      component.form.get('status')?.setValue('IN', { emitEvent: false });
      component.form.get('outServiceDate')?.setValue(null);
      tick();

      expect(component.form.get('status')?.value).toBe('IN');
    }));

    it('should not change status when inServiceDate is null', fakeAsync(() => {
      component.form.get('status')?.setValue('IN', { emitEvent: false });
      component.form.get('inServiceDate')?.setValue(null, { emitEvent: false });
      component.form.get('outServiceDate')?.setValue(new Date());
      tick();

      expect(component.form.get('status')?.value).toBe('IN');
    }));

    it('should not change status when it is already OUT', fakeAsync(() => {
      const yesterday = moment().subtract(1, 'day').toDate();
      const tomorrow  = moment().add(1, 'day').toDate();

      component.form.get('status')?.setValue('OUT', { emitEvent: false });
      component.form.get('inServiceDate')?.setValue(yesterday, { emitEvent: false });
      component.form.get('outServiceDate')?.setValue(tomorrow);
      tick();

      expect(component.form.get('status')?.value).toBe('OUT');
    }));
  });

  // ── Form Submission ─────────────────────────────────────────────────────────

  describe('Form Submission', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should mark as submitted when onSubmit is called', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      fixture.detectChanges();

      component.onSubmit();
      tick();

      expect(component.submitted()).toBe(true);
    }));

    it('should call create when not in edit mode and show success message', fakeAsync(() => {
      component.form.patchValue({
        equipType: 'SCAN',
        equipId: '0001',
        status: 'IN',
        firstProductionDate: moment().startOf('day'),
        serialNumber: 'SN123456',
        manufacturer: 'Manufacturer A',
        exportFlag: 'Y'
      });
      fixture.detectChanges();

      component.onSubmit();
      tick();

      expect(equipmentApiServiceSpy.create).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Equipment EQ-000042 created successfully.');
    }));

    it('should map form values to API create request correctly', fakeAsync(() => {
      const today = moment().startOf('day');
      component.form.patchValue({
        equipType: 'SCAN',
        equipId: '0001',
        status: 'IN',
        firstProductionDate: today,
        serialNumber: 'SN123456',
        location: 'LABA',
        manufacturer: 'Manufacturer A',
        exportFlag: 'Y'
      });
      fixture.detectChanges();

      component.onSubmit();
      tick();

      const request = equipmentApiServiceSpy.create.calls.mostRecent().args[0];
      expect(request.equipType).toBe('SCAN');
      expect(request.equipId).toBe('0001');
      expect(request.serialNumber).toBe('SN123456');
      expect(request.location).toBe('LABA');
      expect(request.manufacturer).toBe('Manufacturer A');
      expect(request.osokFlag).toBe('Y');
      expect(request.status).toBe('IN');
    }));

    it('should call update when in edit mode after retrieve', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.form.get('equipRef')?.setValue(null, { emitEvent: false });
      component.onRetrieve();
      tick();

      component.form.get('manufacturer')?.setValue('New Manufacturer');
      component.form.get('firstProductionDate')?.setValue(moment().startOf('day'));
      component.onSubmit();
      tick();

      expect(equipmentApiServiceSpy.update).toHaveBeenCalledWith(
        'SCAN', '0001', 'EQ-000042', jasmine.any(Object)
      );
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Equipment EQ-000042 updated successfully.');
    }));

    it('should handle submission error', fakeAsync(() => {
      equipmentApiServiceSpy.create.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Failed to create equipment' } } }))
      );

      component.form.patchValue({
        equipType: 'SCAN',
        equipId: '0001',
        status: 'IN',
        firstProductionDate: moment().startOf('day')
      });

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to create equipment');
    }));

    it('should clear form after successful create submission', fakeAsync(() => {
      component.form.patchValue({
        equipType: 'SCAN',
        equipId: '0001',
        status: 'IN',
        firstProductionDate: moment().startOf('day'),
        serialNumber: 'SN123456'
      });

      component.onSubmit();
      tick();

      expect(component.form.get('equipType')?.value).toBeNull();
      expect(component.form.get('equipId')?.value).toBeNull();
      expect(component.form.get('serialNumber')?.value).toBeNull();
      expect((component as any).showEmptyState()).toBe(true);
    }));
  });

  // ── Clear All / Cancel ──────────────────────────────────────────────────────

  describe('Clear All / Cancel Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset entire form when Clear All is clicked', fakeAsync(() => {
      component.form.patchValue({
        equipType: 'SCAN',
        equipId: '0001',
        serialNumber: 'SN123456',
        manufacturer: 'Test'
      });
      (component as any).showEmptyState.set(false);

      component.onClearAll();
      fixture.detectChanges();

      expect(component.form.get('equipType')?.value).toBeNull();
      expect(component.form.get('equipId')?.value).toBeNull();
      expect(component.form.get('serialNumber')?.value).toBeNull();
      expect(component.form.get('manufacturer')?.value).toBeNull();
      expect((component as any).showEmptyState()).toBe(true);
    }));

    it('should reset equipTypeValue, locationValue and statusValue signals on Clear All', fakeAsync(() => {
      component.form.get('equipType')?.setValue('SCAN');
      tick();
      component.form.get('location')?.setValue('LABA');
      component.form.get('status')?.setValue('IN');

      component.onClearAll();

      expect((component as any).equipTypeValue()).toBeNull();
      expect((component as any).locationValue()).toBeNull();
      expect((component as any).statusValue()).toBeNull();
    }));

    it('should reset equipmentIds list on Clear All', fakeAsync(() => {
      component.form.get('equipType')?.setValue('SCAN');
      tick();

      component.onClearAll();

      expect((component as any).equipmentIds()).toEqual([]);
    }));

    it('onClearDetails should clear only detail fields and preserve equipType/equipId', fakeAsync(() => {
      component.form.patchValue({
        equipType: 'SCAN',
        equipId: '0001',
        status: 'IN',
        serialNumber: 'SN123456',
        manufacturer: 'Test',
        location: 'LABA'
      });
      tick();

      component.onClearDetails();
      fixture.detectChanges();

      expect(component.form.get('equipType')?.value).toBe('SCAN');
      expect(component.form.get('equipId')?.value).toBe('0001');
      expect(component.form.get('status')?.value).toBeNull();
      expect(component.form.get('serialNumber')?.value).toBeNull();
      expect(component.form.get('manufacturer')?.value).toBeNull();
      expect((component as any).configurableDetails()).toEqual([]);
    }));

    it('onCancel should behave identically to Clear All', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      (component as any).showEmptyState.set(false);

      component.onCancel();

      expect(component.form.get('equipType')?.value).toBeNull();
      expect((component as any).showEmptyState()).toBe(true);
      expect(component.submitted()).toBe(false);
    }));
  });

  // ── Edit Mode Validator Behavior ─────────────────────────────────────────────

  describe('Edit Mode — firstProductionDate validator', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have pastDate validator on new record (create mode)', () => {
      const ctrl = component.form.get('firstProductionDate');
      ctrl?.setValue(moment().subtract(1, 'day'));
      expect(ctrl?.hasError('pastDate')).toBe(true);
    });

    it('should remove pastDate validator in edit mode after retrieve', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.form.get('equipRef')?.setValue(null, { emitEvent: false });
      component.onRetrieve();
      tick();

      const ctrl = component.form.get('firstProductionDate');
      expect(ctrl?.hasError('pastDate')).toBeFalsy();
    }));

    it('should restore pastDate validator after reset for next new record', fakeAsync(() => {
      component.form.patchValue({ equipType: 'SCAN', equipId: '0001' });
      tick();
      component.form.get('equipRef')?.setValue(null, { emitEvent: false });
      component.onRetrieve();
      tick();

      component.onClearAll();
      tick();

      component.form.get('equipType')?.setValue('SCAN');
      tick();

      const ctrl = component.form.get('firstProductionDate');
      ctrl?.setValue(moment().subtract(1, 'day'));
      expect(ctrl?.hasError('pastDate')).toBe(true);
    }));
  });

  // ── Institution ID Trimming ─────────────────────────────────────────────────

  describe('Institution ID Trimming', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should trim whitespace from instId before submitting', fakeAsync(() => {
      component.form.patchValue({
        equipType: 'SCAN',
        equipId: '0001',
        status: 'IN',
        firstProductionDate: moment().add(1, 'day'),
        instId: ' AB '
      });

      component.onSubmit();
      tick();

      expect(equipmentApiServiceSpy.create).toHaveBeenCalled();
      const request = equipmentApiServiceSpy.create.calls.mostRecent().args[0];
      expect(request.instId).toBe('AB');
    }));

    it('should set instId to null when it is only whitespace', fakeAsync(() => {
      component.form.patchValue({
        equipType: 'SCAN',
        equipId: '0001',
        status: 'IN',
        firstProductionDate: moment().add(1, 'day'),
        instId: '   '
      });

      component.onSubmit();
      tick();

      expect(equipmentApiServiceSpy.create).toHaveBeenCalled();
      const request = equipmentApiServiceSpy.create.calls.mostRecent().args[0];
      expect(request.instId).toBeNull();
    }));
  });

  // ── Barcode Scan ────────────────────────────────────────────────────────────
  // ── Serial Number Uppercase (GAP-18) ────────────────────────────────────────

  describe('Serial Number Uppercase (GAP-18)', () => {
    it('should uppercase serial number on input', () => {
      fixture.detectChanges();

      const mockInput = document.createElement('input');
      mockInput.value = 'sn123abc';
      Object.defineProperty(mockInput, 'selectionStart', { value: 8, writable: true });
      const mockEvent = { target: mockInput } as unknown as Event;

      component.form.get('serialNumber')?.setValue('sn123abc', { emitEvent: false });
      component.onSerialNumberInput(mockEvent);

      expect(component.form.get('serialNumber')?.value).toBe('SN123ABC');
    });

    it('should preserve cursor position after uppercasing', () => {
      fixture.detectChanges();

      const mockInput = document.createElement('input');
      mockInput.value = 'abc';
      const selectionSpy = spyOn(mockInput, 'setSelectionRange');
      Object.defineProperty(mockInput, 'selectionStart', { value: 2, writable: true });
      const mockEvent = { target: mockInput } as unknown as Event;

      component.onSerialNumberInput(mockEvent);

      expect(selectionSpy).toHaveBeenCalledWith(2, 2);
    });
  });

  // ── Numeric Input Validation ────────────────────────────────────────────────

  describe('Numeric Input Validation', () => {
    it('should block non-numeric keys in onlyNumbers', () => {
      const mockEvent = { which: 65, keyCode: 65, preventDefault: jasmine.createSpy('preventDefault') };

      const result = component.onlyNumbers(mockEvent as any);

      expect(result).toBe(false);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should allow numeric keys in onlyNumbers', () => {
      const mockEvent = { which: 53, keyCode: 53, preventDefault: jasmine.createSpy('preventDefault') };

      const result = component.onlyNumbers(mockEvent as any);

      expect(result).toBe(true);
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  // ── Date Input Handlers ─────────────────────────────────────────────────────

  describe('Date Input Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    const makeInputEvent = (value: string): Event => {
      const input = document.createElement('input');
      input.value = value;
      return { target: input } as unknown as Event;
    };

    it('onFirstProdDateInput — sets required error when input is empty', () => {
      const ctrl = component.form.get('firstProductionDate');
      ctrl?.setValue(null);
      component.onFirstProdDateInput(makeInputEvent(''));
      expect(ctrl?.hasError('required')).toBe(true);
    });

    it('onFirstProdDateInput — sets invalidDate error when text entered but value null', () => {
      const ctrl = component.form.get('firstProductionDate');
      ctrl?.setValue(null);
      component.onFirstProdDateInput(makeInputEvent('bad-date'));
      expect(ctrl?.hasError('invalidDate')).toBe(true);
    });
  });

  // ── Date Change Handlers ────────────────────────────────────────────────────

  // ── Date Error Getters ──────────────────────────────────────────────────────

  describe('Date Error Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('getInServiceDateError — returns empty string before touch', () => {
      expect(component.getInServiceDateError()).toBe('');
    });

    it('getInServiceDateError — returns futureDate message when future date set and touched', () => {
      const ctrl = component.form.get('inServiceDate')!;
      ctrl.setValue(moment().add(1, 'day'));
      ctrl.markAsTouched();
      expect(component.getInServiceDateError()).toBe('In Service Date cannot be a future date');
    });

    it('getInServiceDateError — returns invalid message for invalidDate error', () => {
      const ctrl = component.form.get('inServiceDate')!;
      ctrl.setErrors({ invalidDate: true });
      ctrl.markAsTouched();
      expect(component.getInServiceDateError()).toBe('In Service Date is invalid');
    });

    it('getOutServiceDateError — returns empty string before touch', () => {
      expect(component.getOutServiceDateError()).toBe('');
    });

    it('getOutServiceDateError — returns empty when future date set and touched (future allowed)', () => {
      const ctrl = component.form.get('outServiceDate')!;
      ctrl.setValue(moment().add(1, 'day'));
      ctrl.markAsTouched();
      expect(component.getOutServiceDateError()).toBe('');
    });

    it('getFirstProdDateError — returns empty string before touch', () => {
      expect(component.getFirstProdDateError()).toBe('');
    });

    it('getFirstProdDateError — returns required message when empty and touched', () => {
      const ctrl = component.form.get('firstProductionDate')!;
      ctrl.setValue(null);
      ctrl.markAsTouched();
      expect(component.getFirstProdDateError()).toBe('First Prod Date is required');
    });

    it('getFirstProdDateError — returns pastDate message when past date set and touched', () => {
      const ctrl = component.form.get('firstProductionDate')!;
      ctrl.setValue(moment().subtract(1, 'day'));
      ctrl.markAsTouched();
      expect(component.getFirstProdDateError()).toBe('First Prod Date cannot be a past date');
    });

    it('getFirstProdDateError — returns empty when future date set and touched', () => {
      const ctrl = component.form.get('firstProductionDate')!;
      ctrl.setValue(moment().add(1, 'day'));
      ctrl.markAsTouched();
      expect(component.getFirstProdDateError()).toBe('');
    });

    it('getLastProdDateError — returns empty string before touch', () => {
      expect(component.getLastProdDateError()).toBe('');
    });

    it('getLastProdDateError — returns pastDate message when past date set and touched', () => {
      const ctrl = component.form.get('lastProductionDate')!;
      ctrl.setValue(moment().subtract(1, 'day'));
      ctrl.markAsTouched();
      expect(component.getLastProdDateError()).toBe('Last Prod Date cannot be a past date');
    });

    it('getLastProdDateError — returns empty when future date set and touched', () => {
      const ctrl = component.form.get('lastProductionDate')!;
      ctrl.setValue(moment().add(1, 'day'));
      ctrl.markAsTouched();
      expect(component.getLastProdDateError()).toBe('');
    });

    it('getServiceStartDateError — returns empty string before touch', () => {
      expect(component.getServiceStartDateError()).toBe('');
    });

    it('getServiceStartDateError — returns futureDate message when future date set and touched', () => {
      const ctrl = component.form.get('serviceStartDate')!;
      ctrl.setValue(moment().add(1, 'day'));
      ctrl.markAsTouched();
      expect(component.getServiceStartDateError()).toBe('Service Contract Start Date cannot be a future date');
    });

    it('getServiceEndDateError — returns empty string before touch', () => {
      expect(component.getServiceEndDateError()).toBe('');
    });

    it('getServiceEndDateError — returns empty when future date set and touched (future dates allowed)', () => {
      const ctrl = component.form.get('serviceEndDate')!;
      ctrl.setValue(moment().add(1, 'day'));
      ctrl.markAsTouched();
      expect(component.getServiceEndDateError()).toBe('');
    });
  });

  // ── Date Picker Closed ──────────────────────────────────────────────────────
  // ── Accessibility ───────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate unique error IDs for accessibility', () => {
      const errorId = (component as any).errorId('equipType');
      expect(errorId).toContain('enter-equipment-details-');
      expect(errorId).toContain('equipType-error');
    });

  });

  // ── Error Handling ──────────────────────────────────────────────────────────
});
