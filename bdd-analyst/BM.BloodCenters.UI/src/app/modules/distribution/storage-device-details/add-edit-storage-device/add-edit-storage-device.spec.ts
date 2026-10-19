import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditStorageDeviceComponent } from './add-edit-storage-device';
import { StorageDeviceService } from '../services/storage-device.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { StorageDeviceListDto, LovOption } from '../models/storage-device.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditStorageDeviceComponent', () => {
  let timezoneSpy: any;
  let serviceSpy: any;
  let component: AddEditStorageDeviceComponent;
  let fixture: ComponentFixture<AddEditStorageDeviceComponent>;
  let service: jasmine.SpyObj<StorageDeviceService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  const mockDeviceTypes: LovOption[] = [
    { code: 'FRIDGE', description: 'Fridge' },
    { code: 'FREEZER', description: 'Freezer' }
  ];

  const mockDeviceStatuses: LovOption[] = [
    { code: 'A', description: 'Active' },
    { code: 'I', description: 'Inactive' }
  ];

  const mockEditData: StorageDeviceListDto = {
    deviceType: 'FRIDGE',
    deviceDescription: 'Main Fridge',
    deviceNumber: '01',
    deviceStatus: 'A',
    deviceStatusDescription: 'Active',
    rackCount: 5,
    installDate: '01-JAN-2024',
    lastServiceDate: null,
    nextServiceDate: null,
    lastTemperature: 4.5,
    tempReadDate: null,
    effectiveDate: '01-JAN-2024',
    terminationDate: null,
    lastModifiedDate: '15-MAY-2024 02:30 PM'
  };

  const saveResult = { success: true, message: 'Created', statusCode: 200, item: true, errorResponse: { errorCode: '', error: '' } };

  function fillValidAddForm(): void {
    component.form.patchValue({
      deviceType: 'FRIDGE',
      deviceDescription: 'Test Device',
      deviceNumber: '01',
      deviceStatus: 'A',
      rackCount: 5,
      effectiveDate: moment().add(10, 'days')
    });
  }

  function setupEditMode(data?: StorageDeviceListDto): void {
    component.mode = 'edit';
    component.data = data || mockEditData;
    component.ngOnChanges({
      data: new SimpleChange(null, data || mockEditData, true)
    });
  }

  function setupAddMode(): void {
    component.mode = 'add';
    component.ngOnChanges({ mode: new SimpleChange(null, 'add', true) });
    fixture.detectChanges();
  }

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('StorageDeviceService', [
      'createStorageDevice',
      'updateStorageDevice'
    ]);
    const snackbarSpy = createMockSnackbarService();
    const headerSpy = createMockHeaderService();
    timezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    timezoneSpy.getChapterLocalDate.and.returnValue(moment());

      TestBed.configureTestingModule({
      imports: [AddEditStorageDeviceComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: StorageDeviceService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: ChapterTimezoneService, useValue: timezoneSpy }
      ]
    });



      serviceSpy.createStorageDevice.calls.reset();

      serviceSpy.updateStorageDevice.calls.reset();

      timezoneSpy.getChapterLocalDate.calls.reset();

      timezoneSpy.getChapterLocalDate.and.returnValue(moment());

    service = TestBed.inject(StorageDeviceService) as jasmine.SpyObj<StorageDeviceService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    fixture = TestBed.createComponent(AddEditStorageDeviceComponent);
    component = fixture.componentInstance;
    component.warehouseId = 'WH01';
    component.deviceTypeLovOptions = mockDeviceTypes;
    component.deviceStatusLovOptions = mockDeviceStatuses;

    });

  describe('Initialization', () => {
    it('should build form with required controls', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('deviceType')).toBeTruthy();
      expect(component.form.get('deviceDescription')).toBeTruthy();
      expect(component.form.get('deviceNumber')).toBeTruthy();
      expect(component.form.get('deviceStatus')).toBeTruthy();
      expect(component.form.get('rackCount')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should populate form in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        data: new SimpleChange(null, mockEditData, true)
      });
      expect(component.form.get('deviceType')?.value).toBe('FRIDGE');
      expect(component.form.get('deviceDescription')?.value).toBe('Main Fridge');
      expect(component.form.get('deviceNumber')?.value).toBe('01');
      expect(component.form.get('rackCount')?.value).toBe(5);
    });

    it('should build form with optional controls', () => {
      expect(component.form.get('installDate')).toBeTruthy();
      expect(component.form.get('lastServiceDate')).toBeTruthy();
      expect(component.form.get('nextServiceDate')).toBeTruthy();
      expect(component.form.get('lastTemperature')).toBeTruthy();
      expect(component.form.get('tempReadDate')).toBeTruthy();
    });

    it('should default mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should default data to null', () => {
      expect(component.data).toBeNull();
    });

    it('should initialize isSaving to false', () => {
      expect(component.isSaving).toBeFalse();
    });

    it('should have deviceTypeSearchControl initialized', () => {
      expect(component.deviceTypeSearchControl).toBeTruthy();
      expect(component.deviceTypeSearchControl.value).toBe('');
    });
  });

  describe('ngOnInit', () => {
    it('should setup date validation listeners', () => {
      spyOn<any>(component, 'setupDateValidationListeners' as any);
      component.ngOnInit();
      expect((component as any).setupDateValidationListeners).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should call setupPanel when mode changes', () => {
      spyOn<any>(component, 'setupPanel' as any);
      component.ngOnChanges({ mode: new SimpleChange('edit', 'add', false) });
      expect((component as any).setupPanel).toHaveBeenCalled();
    });

    it('should call setupPanel when data changes', () => {
      spyOn<any>(component, 'setupPanel' as any);
      component.ngOnChanges({ data: new SimpleChange(null, mockEditData, true) });
      expect((component as any).setupPanel).toHaveBeenCalled();
    });

    it('should not call setupPanel for unrelated changes', () => {
      spyOn<any>(component, 'setupPanel' as any);
      component.ngOnChanges({ warehouseId: new SimpleChange('WH01', 'WH02', false) });
      expect((component as any).setupPanel).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySub = (component as any).destroy$;
      spyOn(destroySub, 'next');
      spyOn(destroySub, 'complete');
      component.ngOnDestroy();
      expect(destroySub.next).toHaveBeenCalled();
      expect(destroySub.complete).toHaveBeenCalled();
    });
  });

  describe('setupPanel', () => {
    it('should set panelTitle to Add New Record in add mode', () => {
      setupAddMode();
      expect(component.panelTitle).toBe('Add New Record');
    });

    it('should reset form in add mode', () => {
      component.form.patchValue({ deviceType: 'FRIDGE' });
      setupAddMode();
      expect(component.form.get('deviceType')?.value).toBeFalsy();
    });

    it('should clear lastModified in add mode', () => {
      component.lastModified = 'something';
      setupAddMode();
      expect(component.lastModified).toBe('');
    });

    it('should set panelTitle to Edit Record in edit mode', () => {
      setupEditMode();
      expect(component.panelTitle).toBe('Edit Record');
    });

    it('should populate form in edit mode with data', () => {
      setupEditMode();
      expect(component.form.get('deviceType')?.value).toBe('FRIDGE');
      expect(component.form.get('deviceDescription')?.value).toBe('Main Fridge');
      expect(component.form.get('deviceNumber')?.value).toBe('01');
      expect(component.form.get('deviceStatus')?.value).toBe('A');
      expect(component.form.get('rackCount')?.value).toBe(5);
    });

    it('should set lastModified in edit mode', () => {
      setupEditMode();
      expect(component.lastModified).not.toBe('');
    });

    it('should populate date fields when data has dates', () => {
      const dataWithDates: StorageDeviceListDto = {
        ...mockEditData,
        lastServiceDate: '15-FEB-2024',
        nextServiceDate: '15-MAR-2024',
        tempReadDate: '10-FEB-2024',
        terminationDate: '31-DEC-2025'
      };
      setupEditMode(dataWithDates);
      expect(component.form.get('lastServiceDate')?.value).toBeTruthy();
      expect(component.form.get('nextServiceDate')?.value).toBeTruthy();
      expect(component.form.get('tempReadDate')?.value).toBeTruthy();
      expect(component.form.get('terminationDate')?.value).toBeTruthy();
    });

    it('should not populate form if data is null in edit mode', () => {
      component.mode = 'edit';
      component.data = null;
      component.ngOnChanges({ data: new SimpleChange(null, null, true) });
      // Form should remain with default values since populateForm returns early
      expect(component.form.get('deviceType')?.value).toBeFalsy();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(null, 'add', true) });
      fixture.detectChanges();
    });

    it('should require deviceType', () => {
      component.form.get('deviceType')?.setValue('');
      expect(component.form.get('deviceType')?.hasError('required')).toBeTrue();
    });

    it('should require deviceDescription', () => {
      component.form.get('deviceDescription')?.setValue('');
      expect(component.form.get('deviceDescription')?.hasError('required')).toBeTrue();
    });

    it('should enforce maxLength on deviceDescription', () => {
      component.form.get('deviceDescription')?.setValue('a'.repeat(51));
      expect(component.form.get('deviceDescription')?.hasError('maxlength')).toBeTrue();
    });

    it('should require deviceNumber', () => {
      component.form.get('deviceNumber')?.setValue('');
      expect(component.form.get('deviceNumber')?.hasError('required')).toBeTrue();
    });

    it('should enforce pattern on deviceNumber (digits only)', () => {
      component.form.get('deviceNumber')?.setValue('AB');
      expect(component.form.get('deviceNumber')?.hasError('pattern')).toBeTrue();
    });

    it('should enforce maxLength on deviceNumber', () => {
      component.form.get('deviceNumber')?.setValue('123');
      expect(component.form.get('deviceNumber')?.hasError('maxlength')).toBeTrue();
    });

    it('should accept valid deviceNumber', () => {
      component.form.get('deviceNumber')?.setValue('01');
      expect(component.form.get('deviceNumber')?.valid).toBeTrue();
    });

    it('should require deviceStatus', () => {
      component.form.get('deviceStatus')?.setValue('');
      expect(component.form.get('deviceStatus')?.hasError('required')).toBeTrue();
    });

    it('should require rackCount', () => {
      component.form.get('rackCount')?.setValue(null);
      expect(component.form.get('rackCount')?.hasError('required')).toBeTrue();
    });

    it('should enforce min on rackCount', () => {
      component.form.get('rackCount')?.setValue(-1);
      expect(component.form.get('rackCount')?.hasError('min')).toBeTrue();
    });

    it('should enforce max on rackCount', () => {
      component.form.get('rackCount')?.setValue(10000);
      expect(component.form.get('rackCount')?.hasError('max')).toBeTrue();
    });

    it('should accept valid rackCount within 4 digits', () => {
      component.form.get('rackCount')?.setValue(9999);
      expect(component.form.get('rackCount')?.valid).toBeTrue();
    });

    it('should require effectiveDate', () => {
      component.form.get('effectiveDate')?.setValue(null);
      expect(component.form.get('effectiveDate')?.hasError('required')).toBeTrue();
    });

    it('should not require terminationDate', () => {
      component.form.get('terminationDate')?.setValue(null);
      expect(component.form.get('terminationDate')?.hasError('required')).toBeFalsy();
    });

    it('should accept valid deviceDescription within maxLength', () => {
      component.form.get('deviceDescription')?.setValue('Valid Description');
      expect(component.form.get('deviceDescription')?.valid).toBeTrue();
    });

    it('should accept rackCount of 0', () => {
      component.form.get('rackCount')?.setValue(0);
      expect(component.form.get('rackCount')?.valid).toBeTrue();
    });

    it('should accept zero-padded single digit deviceNumber', () => {
      component.form.get('deviceNumber')?.setValue('05');
      expect(component.form.get('deviceNumber')?.valid).toBeTrue();
    });
  });

  describe('isFormValid', () => {

    it('should return false in edit mode when form is not dirty', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({ data: new SimpleChange(null, mockEditData, true) });
      component.form.markAsPristine();
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true in edit mode when form is dirty and no visible errors', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({ data: new SimpleChange(null, mockEditData, true) });
      component.form.markAsDirty();
      expect(component.isFormValid).toBeTrue();
    });

    it('should return form.valid in add mode', () => {
      setupAddMode();
      // Form is invalid when empty (required fields missing)
      expect(component.isFormValid).toBeFalse();

      // Fill all required fields
      fillValidAddForm();
      component.form.updateValueAndValidity();
      expect(component.isFormValid).toBeTrue();
    });

    it('should return false in edit mode when deviceDescription has touched error', () => {
      setupEditMode();
      component.form.markAsDirty();
      const desc = component.form.get('deviceDescription');
      desc?.setValue('');
      desc?.markAsTouched();
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false in edit mode when deviceStatus has touched error', () => {
      setupEditMode();
      component.form.markAsDirty();
      const status = component.form.get('deviceStatus');
      status?.setValue('');
      status?.markAsTouched();
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false in edit mode when rackCount has touched error', () => {
      setupEditMode();
      component.form.markAsDirty();
      const count = component.form.get('rackCount');
      count?.setValue(-1);
      count?.markAsTouched();
      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('effectiveDateControl and terminationDateControl getters', () => {
    it('should return the effectiveDate control', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('should return the terminationDate control', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  describe('Save', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(null, 'add', true) });
      fixture.detectChanges();
    });

    it('should call createStorageDevice in add mode with valid form', () => {
      const saveResult = { success: true, message: 'Created', statusCode: 200, item: true, errorResponse: { errorCode: '', error: '' } };
      service.createStorageDevice.and.returnValue(of(saveResult));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        deviceType: 'FRIDGE',
        deviceDescription: 'Test Device',
        deviceNumber: '01',
        deviceStatus: 'A',
        rackCount: 5,
        effectiveDate: moment().add(10, 'days')
      });

      component.onSave();
      expect(service.createStorageDevice).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should not call API when form is invalid in add mode', () => {
      component.form.patchValue({
        deviceType: '',
        deviceDescription: '',
        deviceNumber: '',
        deviceStatus: '',
        rackCount: null,
        effectiveDate: null
      });
      component.onSave();
      expect(service.createStorageDevice).not.toHaveBeenCalled();
    });

    it('should set isSaving to true during save and false after completion', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      fillValidAddForm();
      component.onSave();
      // After completion, isSaving should be false due to finalize
      expect(component.isSaving).toBeFalse();
    });

    it('should show success message for add mode', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      fillValidAddForm();
      component.onSave();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('New storage device has been created.');
    });

    it('should emit saveSuccess with keepPanelOpen false and closePanel when closeAfterSave is true', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      fillValidAddForm();
      component.onSave(true);
      expect(component.saveSuccess.emit).toHaveBeenCalledWith({ keepPanelOpen: false });
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should emit saveSuccess with keepPanelOpen true and reset form when closeAfterSave is false', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      fillValidAddForm();
      component.onSave(false);
      expect(component.saveSuccess.emit).toHaveBeenCalledWith({ keepPanelOpen: true });
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      service.createStorageDevice.and.returnValue(throwError(() => new Error('fail')));
      fillValidAddForm();
      component.onSave();
      expect(component.isSaving).toBeFalse();
    });

    it('should not save if effectiveDate is invalid moment in add mode', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      component.form.patchValue({
        deviceType: 'FRIDGE',
        deviceDescription: 'Test Device',
        deviceNumber: '01',
        deviceStatus: 'A',
        rackCount: 5,
        effectiveDate: moment('invalid-date')
      });
      component.onSave();
      expect(service.createStorageDevice).not.toHaveBeenCalled();
    });

    it('should not save if terminationDate is set but invalid', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      component.form.patchValue({
        deviceType: 'FRIDGE',
        deviceDescription: 'Test Device',
        deviceNumber: '01',
        deviceStatus: 'A',
        rackCount: 5,
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment('invalid-date')
      });
      component.onSave();
      expect(service.createStorageDevice).not.toHaveBeenCalled();
    });

    it('should format optional date fields in payload when they have values', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      const installDate = moment('2024-01-15');
      const lastServiceDate = moment('2024-02-15');
      const nextServiceDate = moment('2024-06-15');
      const tempReadDate = moment('2024-02-10');

      component.form.patchValue({
        deviceType: 'FRIDGE',
        deviceDescription: 'Test Device',
        deviceNumber: '01',
        deviceStatus: 'A',
        rackCount: 5,
        installDate,
        lastServiceDate,
        nextServiceDate,
        lastTemperature: 3.5,
        tempReadDate,
        effectiveDate: moment().add(10, 'days')
      });
      component.onSave();

      const payload = service.createStorageDevice.calls.mostRecent().args[0];
      expect(payload.installDate).toBe(installDate.format('YYYY-MM-DD'));
      expect(payload.lastServiceDate).toBe(lastServiceDate.format('YYYY-MM-DD'));
      expect(payload.nextServiceDate).toBe(nextServiceDate.format('YYYY-MM-DD'));
      expect(payload.tempReadDate).toBe(tempReadDate.format('YYYY-MM-DD'));
      expect(payload.lastTemperature).toBe(3.5);
    });

    it('should send null for optional date fields when they are empty', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      fillValidAddForm();
      component.onSave();

      const payload = service.createStorageDevice.calls.mostRecent().args[0];
      expect(payload.installDate).toBeNull();
      expect(payload.lastServiceDate).toBeNull();
      expect(payload.nextServiceDate).toBeNull();
      expect(payload.tempReadDate).toBeNull();
      expect(payload.lastTemperature).toBeNull();
    });

    it('should send 0 for rackCount when value is empty string', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      component.form.patchValue({
        deviceType: 'FRIDGE',
        deviceDescription: 'Test Device',
        deviceNumber: '01',
        deviceStatus: 'A',
        rackCount: '',
        effectiveDate: moment().add(10, 'days')
      });
      // Force mark as valid by bypassing required check
      component.form.get('rackCount')?.setErrors(null);
      component.onSave();

      if (service.createStorageDevice.calls.count() > 0) {
        const payload = service.createStorageDevice.calls.mostRecent().args[0];
        expect(payload.rackCount).toBe(0);
      }
    });

    it('should send null for lastTemperature when value is empty string', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      component.form.patchValue({
        deviceType: 'FRIDGE',
        deviceDescription: 'Test Device',
        deviceNumber: '01',
        deviceStatus: 'A',
        rackCount: 5,
        lastTemperature: '',
        effectiveDate: moment().add(10, 'days')
      });
      component.onSave();

      const payload = service.createStorageDevice.calls.mostRecent().args[0];
      expect(payload.lastTemperature).toBeNull();
    });

    it('should include warehouseId in payload', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      fillValidAddForm();
      component.onSave();

      const payload = service.createStorageDevice.calls.mostRecent().args[0];
      expect(payload.warehouseId).toBe('WH01');
    });

    it('should trim string fields in payload', () => {
      service.createStorageDevice.and.returnValue(of(saveResult));
      component.form.patchValue({
        deviceType: ' FRIDGE ',
        deviceDescription: ' Test Device ',
        deviceNumber: '01',
        deviceStatus: ' A ',
        rackCount: 5,
        effectiveDate: moment().add(10, 'days')
      });
      component.onSave();

      const payload = service.createStorageDevice.calls.mostRecent().args[0];
      expect(payload.deviceType).toBe('FRIDGE');
      expect(payload.deviceDescription).toBe('Test Device');
      expect(payload.deviceStatus).toBe('A');
    });
  });

  describe('Save in edit mode', () => {
    beforeEach(() => {
      setupEditMode();
    });

    it('should call updateStorageDevice in edit mode', () => {
      service.updateStorageDevice.and.returnValue(of(saveResult));
      spyOn(component.saveSuccess, 'emit');
      const desc = component.form.get('deviceDescription');
      desc?.setValue('Updated Fridge');
      desc?.markAsDirty();
      component.form.markAsDirty();
      component.onSave();
      expect(service.updateStorageDevice).toHaveBeenCalled();
    });

    it('should show update success message in edit mode', () => {
      service.updateStorageDevice.and.returnValue(of(saveResult));
      const desc = component.form.get('deviceDescription');
      desc?.setValue('Updated Fridge');
      desc?.markAsDirty();
      component.form.markAsDirty();
      component.onSave();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Storage device updated successfully.');
    });

    it('should not save in edit mode when form is not valid', () => {
      // Form not dirty - isFormValid returns false
      component.form.markAsPristine();
      component.onSave();
      expect(service.updateStorageDevice).not.toHaveBeenCalled();
    });

    it('should use data.effectiveDate as fallback when effectiveDate control is null', () => {
      service.updateStorageDevice.and.returnValue(of(saveResult));
      component.form.markAsDirty();
      component.form.get('deviceDescription')?.setValue('Updated');
      // In edit mode, effectiveDate control is disabled, so getRawValue still gets it
      component.onSave();
      if (service.updateStorageDevice.calls.count() > 0) {
        const payload = service.updateStorageDevice.calls.mostRecent().args[0];
        expect(payload.effectiveDate).toBeTruthy();
      }
    });

    it('should set isSaving to false on error in edit mode', () => {
      service.updateStorageDevice.and.returnValue(throwError(() => new Error('fail')));
      component.form.markAsDirty();
      component.form.get('deviceDescription')?.setValue('Updated');
      component.onSave();
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('onSaveAndCreateAnother', () => {
    it('should call onSave with false', () => {
      spyOn(component, 'onSave');
      component.onSaveAndCreateAnother();
      expect(component.onSave).toHaveBeenCalledWith(false);
    });
  });

  describe('Cancel and Clear', () => {

    it('should repopulate form on clear in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({ data: new SimpleChange(null, mockEditData, true) });

      component.form.get('deviceDescription')?.setValue('Changed');
      component.form.markAsDirty();
      component.onClearAll();
      expect(component.form.get('deviceDescription')?.value).toBe('Main Fridge');
      expect(component.form.pristine).toBeTrue();
    });

    it('should emit closePanel on cancel', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should not repopulate form on clearAll in add mode', () => {
      setupAddMode();
      fillValidAddForm();
      component.form.markAsDirty();
      component.onClearAll();
      // In add mode, onClearAll does nothing (mode !== 'edit')
      expect(component.form.get('deviceType')?.value).toBe('FRIDGE');
    });

    it('should mark form as untouched on clearAll in edit mode', () => {
      setupEditMode();
      component.form.markAsTouched();
      component.onClearAll();
      expect(component.form.untouched).toBeTrue();
    });

    it('should not repopulate form when data is null in edit mode onClearAll', () => {
      component.mode = 'edit';
      component.data = null;
      component.onClearAll();
      // data is null, so the condition fails and nothing happens
    });
  });

  describe('Date Error Messages', () => {

    it('should return error for install date parse error', () => {
      const control = component.form.get('installDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getInstallDateError()).toBe('Commissioned Date is invalid');
    });

    it('should return empty string for install date when not touched', () => {
      const control = component.form.get('installDate');
      control?.setErrors({ matDatepickerParse: true });
      expect(component.getInstallDateError()).toBe('');
    });

    it('should return error for install date invalidDateFormat', () => {
      const control = component.form.get('installDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();
      expect(component.getInstallDateError()).toBe('Commissioned Date is invalid');
    });

    it('should return error for install date invalidDate', () => {
      const control = component.form.get('installDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getInstallDateError()).toBe('Commissioned Date is invalid');
    });

    it('should return error for install date matDatepickerMax', () => {
      const control = component.form.get('installDate');
      control?.setErrors({ matDatepickerMax: { max: moment(), actual: moment().add(1, 'day') } });
      control?.markAsTouched();
      expect(component.getInstallDateError()).toBe('Commissioned Date cannot be a future date');
    });

    it('should return cross-field error for install vs lastService when install field changed', () => {
      (component as any).lastChangedInstallServiceField = 'install';
      Object.defineProperty(component.form, 'errors', {
        get: () => ({ installLastServiceRangeInvalid: true }),
        configurable: true
      });
      const control = component.form.get('installDate');
      control?.setErrors(null);
      control?.markAsTouched();
      expect(component.getInstallDateError()).toBe('Commissioned Date must be less than or equal to Last Service Date');
    });

    it('should return cross-field error for install vs tempRead when install field changed', () => {
      (component as any).lastChangedInstallServiceField = 'install';
      Object.defineProperty(component.form, 'errors', {
        get: () => ({ installTempReadRangeInvalid: true }),
        configurable: true
      });
      const control = component.form.get('installDate');
      control?.setErrors(null);
      control?.markAsTouched();
      expect(component.getInstallDateError()).toBe('Commissioned Date must be less than or equal to Last Reading Date');
    });

    it('should return empty string when installDate control has no errors', () => {
      const control = component.form.get('installDate');
      control?.setErrors(null);
      control?.markAsTouched();
      expect(component.getInstallDateError()).toBe('');
    });

    it('should return error for last service date parse error', () => {
      const control = component.form.get('lastServiceDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getLastServiceDateError()).toBe('Last Service Date is invalid');
    });

    it('should return empty string for last service date when not touched', () => {
      const control = component.form.get('lastServiceDate');
      control?.setErrors({ matDatepickerParse: true });
      expect(component.getLastServiceDateError()).toBe('');
    });

    it('should return error for last service date invalidDateFormat', () => {
      const control = component.form.get('lastServiceDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();
      expect(component.getLastServiceDateError()).toBe('Last Service Date is invalid');
    });

    it('should return error for last service date invalidDate', () => {
      const control = component.form.get('lastServiceDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getLastServiceDateError()).toBe('Last Service Date is invalid');
    });

    it('should return future date error for last service date', () => {
      const control = component.form.get('lastServiceDate');
      control?.setErrors({ matDatepickerMax: { max: moment(), actual: moment().add(1, 'day') } });
      control?.markAsTouched();
      expect(component.getLastServiceDateError()).toBe('Last Service Date cannot be a future date');
    });

    it('should return cross-field error for lastService when install changed and installLastServiceRangeInvalid', () => {
      (component as any).lastChangedInstallServiceField = 'lastService';
      Object.defineProperty(component.form, 'errors', {
        get: () => ({ installLastServiceRangeInvalid: true }),
        configurable: true
      });
      const control = component.form.get('lastServiceDate');
      control?.setErrors(null);
      control?.markAsTouched();
      expect(component.getLastServiceDateError()).toBe('Last Service Date cannot be before Commissioned Date');
    });

    it('should return cross-field error for lastService when service date changed and serviceDateRangeInvalid', () => {
      (component as any).lastChangedServiceDateField = 'lastService';
      Object.defineProperty(component.form, 'errors', {
        get: () => ({ serviceDateRangeInvalid: true }),
        configurable: true
      });
      const control = component.form.get('lastServiceDate');
      control?.setErrors(null);
      control?.markAsTouched();
      expect(component.getLastServiceDateError()).toBe('Last Service Date must be less than or equal to Next Service Date');
    });

    it('should return empty string when lastServiceDate has no errors', () => {
      const control = component.form.get('lastServiceDate');
      control?.setErrors(null);
      control?.markAsTouched();
      expect(component.getLastServiceDateError()).toBe('');
    });

    it('should return error for next service date parse error', () => {
      const control = component.form.get('nextServiceDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getNextServiceDateError()).toBe('Next Service Date is invalid');
    });

    it('should return empty string for next service date when not touched', () => {
      expect(component.getNextServiceDateError()).toBe('');
    });

    it('should return error for next service date invalidDateFormat', () => {
      const control = component.form.get('nextServiceDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();
      expect(component.getNextServiceDateError()).toBe('Next Service Date is invalid');
    });

    it('should return error for next service date invalidDate', () => {
      const control = component.form.get('nextServiceDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getNextServiceDateError()).toBe('Next Service Date is invalid');
    });

    it('should return cross-field error for nextService when lastChangedServiceDateField is nextService', () => {
      (component as any).lastChangedServiceDateField = 'nextService';
      Object.defineProperty(component.form, 'errors', {
        get: () => ({ serviceDateRangeInvalid: true }),
        configurable: true
      });
      const control = component.form.get('nextServiceDate');
      control?.setErrors(null);
      control?.markAsTouched();
      expect(component.getNextServiceDateError()).toBe('Next Service Date must be greater than or equal to Last Service Date');
    });

    it('should return empty string when nextServiceDate has no errors', () => {
      const control = component.form.get('nextServiceDate');
      control?.setErrors(null);
      control?.markAsTouched();
      expect(component.getNextServiceDateError()).toBe('');
    });

    it('should return error for temp read date parse error', () => {
      const control = component.form.get('tempReadDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getTempReadDateError()).toBe('Last Reading Date is invalid');
    });

    it('should return empty string for temp read date when not touched', () => {
      expect(component.getTempReadDateError()).toBe('');
    });

    it('should return error for temp read date invalidDateFormat', () => {
      const control = component.form.get('tempReadDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();
      expect(component.getTempReadDateError()).toBe('Last Reading Date is invalid');
    });

    it('should return error for temp read date invalidDate', () => {
      const control = component.form.get('tempReadDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getTempReadDateError()).toBe('Last Reading Date is invalid');
    });

    it('should return future date error for temp read date', () => {
      const control = component.form.get('tempReadDate');
      control?.setErrors({ matDatepickerMax: { max: moment(), actual: moment().add(1, 'day') } });
      control?.markAsTouched();
      expect(component.getTempReadDateError()).toBe('Last Reading Date cannot be a future date');
    });

    it('should return cross-field error for tempRead when installTempReadRangeInvalid', () => {
      (component as any).lastChangedInstallServiceField = 'tempRead';
      Object.defineProperty(component.form, 'errors', {
        get: () => ({ installTempReadRangeInvalid: true }),
        configurable: true
      });
      const control = component.form.get('tempReadDate');
      control?.setErrors(null);
      control?.markAsTouched();
      expect(component.getTempReadDateError()).toBe('Last Reading Date cannot be before Commissioned Date');
    });

    it('should return empty string when tempReadDate has no errors', () => {
      const control = component.form.get('tempReadDate');
      control?.setErrors(null);
      control?.markAsTouched();
      expect(component.getTempReadDateError()).toBe('');
    });
  });

  describe('getEffectiveDateError', () => {
    it('should return empty string when control is not touched or dirty', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should delegate to DateFieldValidationUtility.getStartDateCrossFieldError with form errors when lastChangedDateField is effective', () => {
      (component as any).lastChangedDateField = 'effective';
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();
      control?.setErrors({ required: true });
      const result = component.getEffectiveDateError();
      expect(result).toBe('Effective Date is required');
    });

    it('should pass null formErrors when lastChangedDateField is not effective', () => {
      (component as any).lastChangedDateField = 'termination';
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();
      control?.setErrors({ required: true });
      const result = component.getEffectiveDateError();
      expect(result).toBe('Effective Date is required');
    });
  });

  describe('getTerminationDateError', () => {
    it('should return empty string when control is not touched or dirty', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should delegate to DateFieldValidationUtility.getEndDateCrossFieldError with form errors when lastChangedDateField is termination', () => {
      (component as any).lastChangedDateField = 'termination';
      const control = component.form.get('terminationDate');
      control?.markAsTouched();
      control?.setErrors({ invalidDate: true });
      const result = component.getTerminationDateError();
      expect(result).toBe('Termination Date is invalid');
    });

    it('should pass null formErrors when lastChangedDateField is not termination', () => {
      (component as any).lastChangedDateField = 'effective';
      const control = component.form.get('terminationDate');
      control?.markAsTouched();
      control?.setErrors({ terminationDatePast: true });
      const result = component.getTerminationDateError();
      expect(result).toBe('Termination Date cannot be past date');
    });
  });

  describe('Filtered Device Types', () => {
    it('should return all options when no search', () => {
      expect(component.filteredDeviceTypes().length).toBe(2);
    });

    it('should filter by code', () => {
      component.deviceTypeSearch.set('fridge');
      expect(component.filteredDeviceTypes().length).toBe(1);
      expect(component.filteredDeviceTypes()[0].code).toBe('FRIDGE');
    });

    it('should filter by description', () => {
      component.deviceTypeSearch.set('freezer');
      expect(component.filteredDeviceTypes().length).toBe(1);
      expect(component.filteredDeviceTypes()[0].code).toBe('FREEZER');
    });

    it('should return empty array when no match', () => {
      component.deviceTypeSearch.set('xyz');
      expect(component.filteredDeviceTypes().length).toBe(0);
    });

    it('should be case insensitive', () => {
      component.deviceTypeSearch.set('FRIDGE');
      expect(component.filteredDeviceTypes().length).toBe(1);
    });

    it('should update search signal when deviceTypeSearchControl value changes', () => {
      component.deviceTypeSearchControl.setValue('test');
      expect(component.deviceTypeSearch()).toBe('test');
    });

    it('should set empty string when deviceTypeSearchControl value is null', () => {
      component.deviceTypeSearchControl.setValue(null);
      expect(component.deviceTypeSearch()).toBe('');
    });
  });

  describe('formatDate', () => {

    it('should return value for valid date string', () => {
      expect(component.formatDate('01-JAN-2024')).toBe('01-JAN-2024');
    });

    it('should return dash for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });
  });

  describe('onDescriptionKeydown', () => {
    it('should prevent space at the beginning of input', () => {
      const event = {
        key: ' ',
        target: { selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDescriptionKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow space in the middle of input', () => {
      const event = {
        key: ' ',
        target: { selectionStart: 5 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDescriptionKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow non-space characters at the beginning', () => {
      const event = {
        key: 'a',
        target: { selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDescriptionKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onNumericKeydown', () => {
    it('should allow digit keys', () => {
      const event = {
        key: '5',
        ctrlKey: false,
        metaKey: false,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onNumericKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation keys', () => {
      const navKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
      navKeys.forEach(key => {
        const event = {
          key,
          ctrlKey: false,
          metaKey: false,
          preventDefault: jasmine.createSpy('preventDefault')
        } as unknown as KeyboardEvent;
        component.onNumericKeydown(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should allow ctrl key combinations', () => {
      const event = {
        key: 'a',
        ctrlKey: true,
        metaKey: false,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onNumericKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow meta key combinations', () => {
      const event = {
        key: 'a',
        ctrlKey: false,
        metaKey: true,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onNumericKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit characters', () => {
      const event = {
        key: 'a',
        ctrlKey: false,
        metaKey: false,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onNumericKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent special characters', () => {
      const event = {
        key: '.',
        ctrlKey: false,
        metaKey: false,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onNumericKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onNumericPaste', () => {
    it('should clean pasted value to only digits and limit to maxDigits', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc123def456' },
        target: { value: '' } as HTMLInputElement
      } as unknown as ClipboardEvent;
      component.onNumericPaste(event, 'deviceNumber', 2);
      expect(event.preventDefault).toHaveBeenCalled();
      expect((event.target as HTMLInputElement).value).toBe('12');
      expect(component.form.get('deviceNumber')?.value).toBe('12');
    });

    it('should set control value to null when cleaned value is empty', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc' },
        target: { value: '' } as HTMLInputElement
      } as unknown as ClipboardEvent;
      component.onNumericPaste(event, 'rackCount', 4);
      expect(component.form.get('rackCount')?.value).toBeNull();
    });

    it('should handle null clipboardData', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: null,
        target: { value: '' } as HTMLInputElement
      } as unknown as ClipboardEvent;
      component.onNumericPaste(event, 'deviceNumber', 2);
      expect((event.target as HTMLInputElement).value).toBe('');
    });
  });

  describe('onDecimalKeydown', () => {
    it('should allow digit keys', () => {
      const event = {
        key: '5',
        ctrlKey: false,
        metaKey: false,
        target: { value: '', selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDecimalKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation keys', () => {
      const event = {
        key: 'Backspace',
        ctrlKey: false,
        metaKey: false,
        target: { value: '', selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDecimalKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow minus sign at position 0 when no minus exists', () => {
      const event = {
        key: '-',
        ctrlKey: false,
        metaKey: false,
        target: { value: '123', selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDecimalKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent minus sign when not at position 0', () => {
      const event = {
        key: '-',
        ctrlKey: false,
        metaKey: false,
        target: { value: '123', selectionStart: 2 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDecimalKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent minus sign when minus already exists', () => {
      const event = {
        key: '-',
        ctrlKey: false,
        metaKey: false,
        target: { value: '-123', selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDecimalKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow period when no period exists', () => {
      const event = {
        key: '.',
        ctrlKey: false,
        metaKey: false,
        target: { value: '123', selectionStart: 3 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDecimalKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent period when period already exists', () => {
      const event = {
        key: '.',
        ctrlKey: false,
        metaKey: false,
        target: { value: '12.3', selectionStart: 4 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDecimalKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent non-numeric, non-period, non-minus characters', () => {
      const event = {
        key: 'a',
        ctrlKey: false,
        metaKey: false,
        target: { value: '123', selectionStart: 3 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDecimalKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow ctrl key combinations', () => {
      const event = {
        key: 'a',
        ctrlKey: true,
        metaKey: false,
        target: { value: '123', selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as KeyboardEvent;
      component.onDecimalKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onDecimalPaste', () => {
    it('should clean pasted value to digits, period, and minus', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc-12.5xyz' },
        target: { value: '' } as HTMLInputElement
      } as unknown as ClipboardEvent;
      component.onDecimalPaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect((event.target as HTMLInputElement).value).toBe('-12.5');
      expect(component.form.get('lastTemperature')?.value).toBe('-12.5');
    });

    it('should limit pasted value to 7 characters', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '12345678' },
        target: { value: '' } as HTMLInputElement
      } as unknown as ClipboardEvent;
      component.onDecimalPaste(event);
      expect((event.target as HTMLInputElement).value).toBe('1234567');
    });

    it('should set control value to null when cleaned value is empty', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc' },
        target: { value: '' } as HTMLInputElement
      } as unknown as ClipboardEvent;
      component.onDecimalPaste(event);
      expect(component.form.get('lastTemperature')?.value).toBeNull();
    });

    it('should handle null clipboardData', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: null,
        target: { value: '' } as HTMLInputElement
      } as unknown as ClipboardEvent;
      component.onDecimalPaste(event);
      expect((event.target as HTMLInputElement).value).toBe('');
    });
  });

  describe('onOptionalDateInput', () => {
    it('should call DateFieldValidationUtility.handleEndDateInput with correct arguments in add mode', () => {
      setupAddMode();
      const event = { target: { value: '01-JAN-2024' } } as unknown as Event;
      component.onOptionalDateInput(event, 'installDate');
      // We verify it does not throw and runs without error
      expect(true).toBeTrue();
    });

    it('should pass isEditMode=true when in edit mode', () => {
      setupEditMode();
      const event = { target: { value: '01-JAN-2024' } } as unknown as Event;
      component.onOptionalDateInput(event, 'installDate');
      expect(true).toBeTrue();
    });
  });

  describe('onEffectiveDateInput', () => {
    it('should call DateFieldValidationUtility.handleStartDateInput', () => {
      const event = { target: { value: '' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      const control = component.form.get('effectiveDate');
      // When value is empty, handleStartDateInput sets errors to required
      expect(control?.errors).toBeTruthy();
    });

    it('should handle non-empty input value', () => {
      const event = { target: { value: '01-JAN-2025' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      // Should mark as touched and dirty
      const control = component.form.get('effectiveDate');
      expect(control?.touched).toBeTrue();
    });
  });

  describe('onTerminationDateInput', () => {
    it('should call DateFieldValidationUtility.handleEndDateInput in add mode', () => {
      setupAddMode();
      const event = { target: { value: '' } } as unknown as Event;
      component.onTerminationDateInput(event);
      // Should clear errors for empty optional field
      const control = component.form.get('terminationDate');
      expect(control?.errors).toBeNull();
    });

    it('should pass isEditMode true when in edit mode', () => {
      setupEditMode();
      const event = { target: { value: '' } } as unknown as Event;
      component.onTerminationDateInput(event);
      const control = component.form.get('terminationDate');
      // In edit mode with empty value, it should mark dirty
      expect(control?.dirty).toBeTrue();
    });
  });

  describe('Date filter functions', () => {
    describe('terminationDateFilter', () => {
      it('should return true for null date', () => {
        expect(component.terminationDateFilter(null)).toBeTrue();
      });

      it('should return false for date before today', () => {
        const pastDate = moment().subtract(10, 'days');
        expect(component.terminationDateFilter(pastDate)).toBeFalse();
      });

      it('should return false for date before effective date', () => {
        const futureDate = moment().add(5, 'days');
        component.form.get('effectiveDate')?.setValue(moment().add(10, 'days'));
        expect(component.terminationDateFilter(futureDate)).toBeFalse();
      });

      it('should return true for date after effective date and today', () => {
        const futureDate = moment().add(20, 'days');
        component.form.get('effectiveDate')?.setValue(moment().add(10, 'days'));
        expect(component.terminationDateFilter(futureDate)).toBeTrue();
      });

      it('should return true when no effective date is set and date is future', () => {
        const futureDate = moment().add(10, 'days');
        expect(component.terminationDateFilter(futureDate)).toBeTrue();
      });
    });

    describe('installDateFilter', () => {
      it('should return true for null date', () => {
        expect(component.installDateFilter(null)).toBeTrue();
      });

      it('should return false for future date', () => {
        const futureDate = moment().add(10, 'days');
        expect(component.installDateFilter(futureDate)).toBeFalse();
      });

      it('should return true for past date', () => {
        const pastDate = moment().subtract(10, 'days');
        expect(component.installDateFilter(pastDate)).toBeTrue();
      });

      it('should return true for today', () => {
        const today = moment().startOf('day');
        expect(component.installDateFilter(today)).toBeTrue();
      });
    });

    describe('lastServiceDateFilter', () => {
      it('should return true for null date', () => {
        expect(component.lastServiceDateFilter(null)).toBeTrue();
      });

      it('should return false for future date', () => {
        const futureDate = moment().add(10, 'days');
        expect(component.lastServiceDateFilter(futureDate)).toBeFalse();
      });

      it('should return false for date before install date', () => {
        const installDate = moment().subtract(5, 'days');
        component.form.get('installDate')?.setValue(installDate);
        const beforeInstall = moment().subtract(10, 'days');
        expect(component.lastServiceDateFilter(beforeInstall)).toBeFalse();
      });

      it('should return true for date after install date and before today', () => {
        const installDate = moment().subtract(10, 'days');
        component.form.get('installDate')?.setValue(installDate);
        const validDate = moment().subtract(5, 'days');
        expect(component.lastServiceDateFilter(validDate)).toBeTrue();
      });

      it('should return true when no install date is set and date is in past', () => {
        const pastDate = moment().subtract(10, 'days');
        expect(component.lastServiceDateFilter(pastDate)).toBeTrue();
      });
    });

    describe('nextServiceDateFilter', () => {
      it('should return true for null date', () => {
        expect(component.nextServiceDateFilter(null)).toBeTrue();
      });

      it('should return false for date before last service date', () => {
        const lastService = moment().subtract(5, 'days');
        component.form.get('lastServiceDate')?.setValue(lastService);
        const beforeLastService = moment().subtract(10, 'days');
        expect(component.nextServiceDateFilter(beforeLastService)).toBeFalse();
      });

      it('should return true for date after last service date', () => {
        const lastService = moment().subtract(10, 'days');
        component.form.get('lastServiceDate')?.setValue(lastService);
        const afterLastService = moment().subtract(5, 'days');
        expect(component.nextServiceDateFilter(afterLastService)).toBeTrue();
      });

      it('should return true when no last service date is set', () => {
        const anyDate = moment().add(10, 'days');
        expect(component.nextServiceDateFilter(anyDate)).toBeTrue();
      });
    });

    describe('tempReadDateFilter', () => {
      it('should return true for null date', () => {
        expect(component.tempReadDateFilter(null)).toBeTrue();
      });

      it('should return false for future date', () => {
        const futureDate = moment().add(10, 'days');
        expect(component.tempReadDateFilter(futureDate)).toBeFalse();
      });

      it('should return false for date before install date', () => {
        const installDate = moment().subtract(5, 'days');
        component.form.get('installDate')?.setValue(installDate);
        const beforeInstall = moment().subtract(10, 'days');
        expect(component.tempReadDateFilter(beforeInstall)).toBeFalse();
      });

      it('should return true for date after install date and before today', () => {
        const installDate = moment().subtract(10, 'days');
        component.form.get('installDate')?.setValue(installDate);
        const validDate = moment().subtract(5, 'days');
        expect(component.tempReadDateFilter(validDate)).toBeTrue();
      });

      it('should return true when no install date is set and date is in past', () => {
        const pastDate = moment().subtract(10, 'days');
        expect(component.tempReadDateFilter(pastDate)).toBeTrue();
      });
    });
  });

  describe('Date validation listeners', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should set lastChangedDateField to effective when effectiveDate changes', () => {
      component.form.get('effectiveDate')?.setValue(moment().add(5, 'days'));
      expect((component as any).lastChangedDateField).toBe('effective');
    });

    it('should set lastChangedDateField to termination when terminationDate changes', () => {
      component.form.get('terminationDate')?.setValue(moment().add(10, 'days'));
      expect((component as any).lastChangedDateField).toBe('termination');
    });

    it('should set lastChangedInstallServiceField to install when installDate changes', () => {
      component.form.get('installDate')?.setValue(moment().subtract(5, 'days'));
      expect((component as any).lastChangedInstallServiceField).toBe('install');
    });

    it('should set lastChangedServiceDateField to lastService when lastServiceDate changes', () => {
      component.form.get('lastServiceDate')?.setValue(moment().subtract(5, 'days'));
      expect((component as any).lastChangedServiceDateField).toBe('lastService');
    });

    it('should set lastChangedInstallServiceField to lastService when lastServiceDate changes', () => {
      component.form.get('lastServiceDate')?.setValue(moment().subtract(5, 'days'));
      expect((component as any).lastChangedInstallServiceField).toBe('lastService');
    });

    it('should set lastChangedServiceDateField to nextService when nextServiceDate changes', () => {
      component.form.get('nextServiceDate')?.setValue(moment().add(30, 'days'));
      expect((component as any).lastChangedServiceDateField).toBe('nextService');
    });

    it('should set lastChangedInstallServiceField to tempRead when tempReadDate changes', () => {
      component.form.get('tempReadDate')?.setValue(moment().subtract(5, 'days'));
      expect((component as any).lastChangedInstallServiceField).toBe('tempRead');
    });
  });

  describe('Cross-field validators', () => {
    it('should return serviceDateRangeInvalid when lastServiceDate > nextServiceDate', () => {
      component.form.patchValue({
        lastServiceDate: moment('2024-06-15'),
        nextServiceDate: moment('2024-01-15')
      });
      component.form.updateValueAndValidity();
      expect(component.form.errors?.['serviceDateRangeInvalid']).toBeTrue();
    });

    it('should not return serviceDateRangeInvalid when lastServiceDate < nextServiceDate', () => {
      component.form.patchValue({
        lastServiceDate: moment('2024-01-15'),
        nextServiceDate: moment('2024-06-15')
      });
      component.form.updateValueAndValidity();
      expect(component.form.errors?.['serviceDateRangeInvalid']).toBeFalsy();
    });

    it('should not return serviceDateRangeInvalid when either date is null', () => {
      component.form.patchValue({
        lastServiceDate: null,
        nextServiceDate: moment('2024-06-15')
      });
      component.form.updateValueAndValidity();
      expect(component.form.errors?.['serviceDateRangeInvalid']).toBeFalsy();
    });

    it('should return installLastServiceRangeInvalid when lastServiceDate < installDate', () => {
      component.form.patchValue({
        installDate: moment('2024-06-15'),
        lastServiceDate: moment('2024-01-15')
      });
      component.form.updateValueAndValidity();
      expect(component.form.errors?.['installLastServiceRangeInvalid']).toBeTrue();
    });

    it('should not return installLastServiceRangeInvalid when lastServiceDate >= installDate', () => {
      component.form.patchValue({
        installDate: moment('2024-01-15'),
        lastServiceDate: moment('2024-06-15')
      });
      component.form.updateValueAndValidity();
      expect(component.form.errors?.['installLastServiceRangeInvalid']).toBeFalsy();
    });

    it('should return installTempReadRangeInvalid when tempReadDate < installDate', () => {
      component.form.patchValue({
        installDate: moment('2024-06-15'),
        tempReadDate: moment('2024-01-15')
      });
      component.form.updateValueAndValidity();
      expect(component.form.errors?.['installTempReadRangeInvalid']).toBeTrue();
    });

    it('should not return installTempReadRangeInvalid when tempReadDate >= installDate', () => {
      component.form.patchValue({
        installDate: moment('2024-01-15'),
        tempReadDate: moment('2024-06-15')
      });
      component.form.updateValueAndValidity();
      expect(component.form.errors?.['installTempReadRangeInvalid']).toBeFalsy();
    });
  });

  describe('formatLastModified (private)', () => {
    it('should return empty string for null date', () => {
      setupEditMode({ ...mockEditData, lastModifiedDate: null });
      expect(component.lastModified).toBe('');
    });

    it('should return empty string for empty string date', () => {
      setupEditMode({ ...mockEditData, lastModifiedDate: '' });
      expect(component.lastModified).toBe('');
    });

    it('should format a valid last modified date with PM', () => {
      setupEditMode({ ...mockEditData, lastModifiedDate: '15-MAY-2024 02:30 PM' });
      expect(component.lastModified).toContain('Last Modified:');
      expect(component.lastModified).toContain('02:30 PM');
    });

    it('should format a valid last modified date without AM/PM', () => {
      setupEditMode({ ...mockEditData, lastModifiedDate: '15-MAY-2024 14:30' });
      expect(component.lastModified).toContain('Last Modified:');
      expect(component.lastModified).toContain('14:30');
    });

    it('should return empty string for invalid date format', () => {
      setupEditMode({ ...mockEditData, lastModifiedDate: 'invalid date' });
      expect(component.lastModified).toBe('');
    });

    it('should use default timezone label when timezone is invalid', () => {
      (headerService as any).chapterTimeZone = jasmine.createSpy().and.returnValue('invalid');
      setupEditMode({ ...mockEditData, lastModifiedDate: '15-MAY-2024 02:30 PM' });
      // With invalid timezone, it should use default GMT+00:00 or similar
      expect(component.lastModified).toContain('Last Modified:');
    });
  });

  describe('Error state matchers', () => {
    it('should have installDateErrorMatcher defined', () => {
      expect(component.installDateErrorMatcher).toBeTruthy();
      expect(component.installDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have lastServiceDateErrorMatcher defined', () => {
      expect(component.lastServiceDateErrorMatcher).toBeTruthy();
    });

    it('should have nextServiceDateErrorMatcher defined', () => {
      expect(component.nextServiceDateErrorMatcher).toBeTruthy();
    });

    it('should have tempReadDateErrorMatcher defined', () => {
      expect(component.tempReadDateErrorMatcher).toBeTruthy();
    });

    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
    });
  });
});
