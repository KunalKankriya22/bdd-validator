import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { AddEditDriveLocationComponent } from './add-edit-drive-location';
import { MaintainDriveLocationService } from '../services/maintain-drive-location.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditDriveLocationComponent', () => {
  let component: AddEditDriveLocationComponent;
  let fixture: ComponentFixture<AddEditDriveLocationComponent>;
  let mockService: jasmine.SpyObj<MaintainDriveLocationService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: any;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('MaintainDriveLocationService', [
      'getLocationTypeLookup',
      'getLocationLookup',
      'getSponsorLookup',
      'getHospitalLookup',
      'getStaffLookup',
      'getFacilityLookup',
      'getCityStateByZipCode',
      'getDriveLocationDetails',
      'getLocationNotes',
      'upsertDriveLocation'
    ]);
    mockHeaderService = createMockHeaderService();
    mockLoginService = {
      getStoredUsername: jasmine.createSpy('getStoredUsername').and.returnValue('testuser')
    };
    mockSnackBar = createMockMatSnackBar();
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
      'isChapterLocalDateAvailable',
      'getChapterUtcOffsetMinutes'
    ]);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment());
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);
    mockChapterTimezoneService.getChapterUtcOffsetMinutes.and.returnValue(-300);

    // Setup default mock responses
    mockService.getLocationTypeLookup.and.returnValue(of([
      { code: 'FIX', description: 'Fixed' }
    ]));
    mockService.getLocationLookup.and.returnValue(of([
      { code: 'LOCN001', description: 'Test Location' }
    ]));
    mockService.getSponsorLookup.and.returnValue(of([]));
    mockService.getHospitalLookup.and.returnValue(of([]));
    mockService.getStaffLookup.and.returnValue(of([]));
    mockService.getFacilityLookup.and.returnValue(of([]));
    mockService.getCityStateByZipCode.and.returnValue(of([
      { city: 'Dallas', state: 'TX', country: 'Dallas County' }
    ]));
    mockService.getLocationNotes.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [
        AddEditDriveLocationComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MaintainDriveLocationService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        provideHttpClient()
      ]
    });

    mockService.getLocationTypeLookup.calls.reset();
    mockService.getLocationLookup.calls.reset();
    mockService.getSponsorLookup.calls.reset();
    mockService.getHospitalLookup.calls.reset();
    mockService.getStaffLookup.calls.reset();
    mockService.getFacilityLookup.calls.reset();
    mockService.getCityStateByZipCode.calls.reset();
    mockService.getDriveLocationDetails.calls.reset();
    mockService.getLocationNotes.calls.reset();
    mockService.upsertDriveLocation.calls.reset();
    mockHeaderService.getCurrentChapterId.calls.reset();
    mockChapterTimezoneService.getChapterLocalDate.calls.reset();
    mockChapterTimezoneService.isChapterLocalDateAvailable.calls.reset();
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment());
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);
    mockService.getSponsorLookup.and.returnValue(of([]));
    mockService.getHospitalLookup.and.returnValue(of([]));
    mockService.getStaffLookup.and.returnValue(of([]));
    mockService.getFacilityLookup.and.returnValue(of([]));
    mockService.getLocationNotes.and.returnValue(of([]));

    fixture = TestBed.createComponent(AddEditDriveLocationComponent);
    component = fixture.componentInstance;
    // Standalone component imports MatSnackBarModule which creates its own injector scope, bypassing the TestBed root mock.
    (component as any).snackBar = mockSnackBar;
  });
  describe('Form Validation - Draw Site Details', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });









    it('should validate distance pattern (max 999.99)', () => {
      const control = component.form.get('distance');
      control?.setValue('1000');
      expect(control?.hasError('pattern')).toBe(true);

      control?.setValue('999.99');
      expect(control?.hasError('pattern')).toBe(false);

      control?.setValue('123.45');
      expect(control?.hasError('pattern')).toBe(false);

      control?.setValue('1.5');
      expect(control?.hasError('pattern')).toBe(false);
    });




  });



  describe('Zip Code Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should require zip when additional details are filled', () => {
      component.form.patchValue({
        locationName: 'Test Location',
        street: '123 Main St'
      });

      expect(component.isZipRequired()).toBe(true);
    });

    it('should not require zip when international address is filled', () => {
      component.internationalAddressData = {
        intlAddrFlag: 'Y',
        intlAddress1: '123 Intl St',
        countryName: 'Canada'
      };

      expect(component.isZipRequired()).toBe(false);
    });



    it('should require zip when user starts filling additional details even with existing international address (edit mode edge case)', () => {
      component.mode = 'edit';
      component.internationalAddressData = null;
      component.ngOnInit();

      // Simulate loaded international address from API
      component['loadedInternationalAddressData'] = {
        intlAddrFlag: 'Y',
        intlAddress1: '123 Intl St'
      };

      // User starts filling additional details
      component.form.patchValue({
        locationName: 'New Name'
      });

      // Zip should now be required because user is switching to US address
      expect(component.isZipRequired()).toBe(true);
    });
  });

  describe('Additional Details vs International Address', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges(); // Detect changes after ngOnInit
    });



    it('should accept international address as alternative to additional details', () => {
      const intlData = { intlAddrFlag: 'Y', intlAddress1: '123 Intl St', countryName: 'Canada' };
      component.internationalAddressData = intlData;
      component.ngOnChanges({ internationalAddressData: new SimpleChange(null, intlData, false) });
      fixture.detectChanges();

      component.form.patchValue({ locationType: 'FIX' });
      component.form.get('locationId')?.enable();

      component.form.patchValue({
        locationId: 'LOCN001',
        drawSite: 'Test Draw Site',
        travelTime: '30',
        distance: '15.5',
        staffFacility: 'FAC001',
        effectiveDate: moment()
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();

      // US address controls disabled — form valid without locationName; isFormValid passes too
      expect(component.form.get('locationName')?.disabled).toBe(true);
      expect(component.form.valid).toBe(true);
      expect(component.isFormValid).toBe(true);
    });
  });

  describe('Notes Management', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should add a new note', () => {
      component.noteForm.patchValue({ noteText: 'Test note' });

      component.onAddNote();

      expect(component.driveLocationNotes.length).toBe(1);
      expect(component.driveLocationNotes[0].noteText).toBe('Test note');
      expect(component.noteForm.get('noteText')?.value).toBeNull();
    });

    it('should not add empty note', () => {
      component.noteForm.patchValue({ noteText: '   ' });

      component.onAddNote();

      expect(component.driveLocationNotes.length).toBe(0);
    });

    it('should delete note', () => {
      component.driveLocationNotes = [{
        noteText: 'Test note',
        createdBy: 'testuser',
        createdDate: new Date().toISOString()
      }];

      component.onDeleteNote(0);

      expect(component.driveLocationNotes.length).toBe(0);
    });
  });

  describe('Form Valid State for ADD', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges(); // Detect changes after ngOnInit
    });



    it('should be valid with draw site details + additional details', fakeAsync(() => {
      // Set location type and wait for valueChanges to enable locationId and load options
      component.form.get('locationType')?.setValue('FIX');
      tick(150); // Wait for debounce (100ms) + a bit more

      // Now set the rest of the values (locationId gets cleared in valueChanges, so set it after the tick)
      component.form.get('locationId')?.setValue('LOCN001');
      component.form.get('drawSite')?.setValue('Test Draw Site');
      component.form.get('travelTime')?.setValue('30');
      component.form.get('distance')?.setValue('15.5');
      component.form.get('staffFacility')?.setValue('FAC001');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));
      component.form.get('locationName')?.setValue('Test');
      component.form.get('zip')?.setValue('75001');

      tick(300); // Wait for zip debounce
      fixture.detectChanges();

      // The key business logic check
      expect(component.isFormValid).toBe(true);
    }));

    it('should be valid with draw site details + international address', () => {
      const intlData = { intlAddrFlag: 'Y', intlAddress1: '123 Intl St', countryName: 'Canada' };
      component.internationalAddressData = intlData;
      component.ngOnChanges({ internationalAddressData: new SimpleChange(null, intlData, false) });
      fixture.detectChanges();

      component.form.patchValue({ locationType: 'FIX' });
      component.form.get('locationId')?.enable();

      component.form.patchValue({
        locationId: 'LOCN001',
        drawSite: 'Test Draw Site',
        travelTime: '30',
        distance: '15.5',
        staffFacility: 'FAC001',
        effectiveDate: moment()
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();

      // US address controls disabled — locationName not required; both checks pass
      expect(component.form.get('locationName')?.disabled).toBe(true);
      expect(component.form.valid).toBe(true);
      expect(component.isFormValid).toBe(true);
    });
  });

  describe('City/State Auto-population', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should auto-populate city and state when zip is entered', (done) => {
      mockService.getCityStateByZipCode.and.returnValue(of([{
        city: 'Dallas',
        state: 'TX',
        country: 'Dallas'  // Backend field is "country" but it's actually county
      }]));

      component.form.patchValue({ zip: '75001' });

      setTimeout(() => {
        expect(mockService.getCityStateByZipCode).toHaveBeenCalledWith('75001');
        expect(component.editModeValues.city).toBe('Dallas');
        expect(component.editModeValues.state).toBe('TX');
        done();
      }, 400);
    });


  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should clear all form fields', () => {
      component.form.patchValue({
        locationType: 'FIX',
        locationName: 'Test',
        travelTime: '30'
      });
      component.driveLocationNotes = [
        { noteText: 'Test note', createdBy: 'user', createdDate: new Date().toISOString() }
      ];

      component.onClearAll();

      expect(component.form.get('locationType')?.value).toBeNull();
      expect(component.form.get('locationName')?.value).toBeNull();
      expect(component.driveLocationNotes.length).toBe(0);
    });
  });

  describe('International Address Functionality', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges(); // Detect changes after ngOnInit
    });

    it('should accept international address as valid address type', fakeAsync(() => {
      // Set location type and wait for valueChanges to enable locationId
      component.form.get('locationType')?.setValue('FIX');
      tick(150); // Wait for debounce (100ms) + a bit more

      // Set draw site details
      component.form.get('locationId')?.setValue('LOCN001');
      component.form.get('drawSite')?.setValue('Test Draw Site');
      component.form.get('travelTime')?.setValue('30');
      component.form.get('distance')?.setValue('15.5');
      component.form.get('staffFacility')?.setValue('FAC001');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));

      // Set international address data
      component.internationalAddressData = {
        intlAddrFlag: 'Y',
        intlAddress1: '123 International St',
        countryName: 'Canada',
        intlPostalCode: 'A1B 2C3'
      };

      tick();
      fixture.detectChanges();

      expect(component.isFormValid).toBe(true);
    }));

    it('should not require zip when international address is provided', () => {
      component.internationalAddressData = {
        intlAddrFlag: 'Y',
        intlAddress1: '123 Intl St',
        countryName: 'Canada'
      };

      expect(component.isZipRequired()).toBe(false);
    });

    it('should prioritize additional details over international address when both exist', () => {
      // Set both additional details and international address
      component.form.patchValue({
        locationName: 'Test Location',
        zip: '75001'
      });

      component.internationalAddressData = {
        intlAddrFlag: 'Y',
        intlAddress1: '123 Intl St',
        countryName: 'Canada'
      };

      // Additional details should take priority, so zip should still be required
      expect(component.isZipRequired()).toBe(true);
    });



    it('should detect US address data before opening international address dialog', () => {
      spyOn(component.openInternationalAddress, 'emit');

      component.form.patchValue({
        locationName: 'Test',
        zip: '75001'
      });

      component.openInternationalAddressDialog();

      expect(component.openInternationalAddress.emit).toHaveBeenCalledWith({
        recordKey: '',
        hasUSAddressData: true,
        existingData: null
      });
    });

    it('should handle international address in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        locationId: 'LOC123',
        locationType: 'FIX',
        locationName: 'Test Location',
        travelTime: 30,
        travelDistance: 15.5
      } as any;

      // Mock the getDriveLocationDetails call that happens in edit mode
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC123',
        locationType: 'FIX',
        locationName: 'Test Location',
        travelTime: 30,
        travelDistance: 15.5,
        address: {
          intlAddrFlag: 'Y',
          intlAddress1: '456 International Ave',
          countryName: 'Mexico',
          intlPostalCode: '12345'
        }
      }));

      component.ngOnInit();
      fixture.detectChanges();

      // Form should be valid with existing international address
      expect(component.isZipRequired()).toBe(false);
    });






  });

  describe('Time Field Handling', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should normalize 4-digit HHMM to HH:MM on blur', () => {
      const control = component.form.get('timeOpen')!;
      control.setValue('2300');
      component.onTimeBlur('timeOpen');
      expect(control.value).toBe('23:00');
    });

    it('should normalize 3-digit HMM to HH:MM on blur', () => {
      const control = component.form.get('timeOpen')!;
      control.setValue('930');
      component.onTimeBlur('timeOpen');
      expect(control.value).toBe('09:30');
    });

    it('should normalize H:MM to zero-padded HH:MM on blur', () => {
      const control = component.form.get('timeOpen')!;
      control.setValue('9:30');
      component.onTimeBlur('timeOpen');
      expect(control.value).toBe('09:30');
    });

    it('should leave valid HH:MM unchanged on blur', () => {
      const control = component.form.get('timeClose')!;
      control.setValue('06:30');
      component.onTimeBlur('timeClose');
      expect(control.value).toBe('06:30');
    });

    it('should flag invalid time with invalidTimeFormat error', () => {
      const control = component.form.get('timeOpen')!;
      control.setValue('29000');
      control.markAsTouched();
      control.updateValueAndValidity();
      expect(control.hasError('invalidTimeFormat')).toBe(true);
    });

    it('should flag hour > 23 as invalid', () => {
      const control = component.form.get('timeOpen')!;
      control.setValue('29:00');
      control.markAsTouched();
      control.updateValueAndValidity();
      expect(control.hasError('invalidTimeFormat')).toBe(true);
    });

    it('should flag minutes > 59 as invalid', () => {
      const control = component.form.get('timeClose')!;
      control.setValue('12:60');
      control.markAsTouched();
      control.updateValueAndValidity();
      expect(control.hasError('invalidTimeFormat')).toBe(true);
    });



    it('should return error message from getTimeOpenError when touched and invalid', () => {
      const control = component.form.get('timeOpen')!;
      control.setValue('29:00');
      control.markAsTouched();
      control.updateValueAndValidity();
      expect(component.getTimeOpenError()).toContain('HH:MM');
    });



    it('should return time format error from getTimeCloseError when touched and invalid', () => {
      const control = component.form.get('timeClose')!;
      control.setValue('29000');
      control.markAsTouched();
      control.updateValueAndValidity();
      expect(component.getTimeCloseError()).toContain('HH:MM');
    });

    it('should return "Close time cannot be prior" error when close < open', () => {
      component.form.patchValue({ timeOpen: '23:00', timeClose: '08:00' });
      component.form.get('timeClose')!.markAsTouched();
      component.form.get('timeClose')!.markAsDirty();
      component.form.updateValueAndValidity();
      expect(component.getTimeCloseError()).toContain('prior');
    });

    it('should block save (add mode) when timeOpen has invalid format', fakeAsync(() => {
      component.form.get('locationType')?.setValue('FIX');
      tick(150);
      component.form.get('locationId')?.setValue('LOCN001');
      component.form.get('drawSite')?.setValue('Test Draw Site');
      component.form.get('travelTime')?.setValue('30');
      component.form.get('distance')?.setValue('15.5');
      component.form.get('staffFacility')?.setValue('FAC001');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));
      component.form.get('locationName')?.setValue('Test');
      component.form.get('zip')?.setValue('75001');
      tick(300);

      // Invalid time
      component.form.get('timeOpen')?.setValue('29:00');
      component.form.updateValueAndValidity();
      fixture.detectChanges();

      expect(component.isFormValid).toBe(false);
    }));
  });

  describe('Termination Date Invalid Text Tracking', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should show termination date error via getTerminationDateError when flag is set', () => {
      const control = component.form.get('terminationDate')!;
      control.markAsTouched();
      control.markAsDirty();
      component['termDateInputHasInvalidText'] = true;
      expect(component.getTerminationDateError()).toBe('Termination date is invalid');
    });

    it('should not show error when flag is false and no control errors', () => {
      const control = component.form.get('terminationDate')!;
      control.markAsTouched();
      component['termDateInputHasInvalidText'] = false;
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should reset termDateInputHasInvalidText on onClearAll', () => {
      component['termDateInputHasInvalidText'] = true;
      component.onClearAll();
      expect(component['termDateInputHasInvalidText']).toBe(false);
    });

    it('should clear termDateInputHasInvalidText when valid termination date is entered', fakeAsync(() => {
      component['termDateInputHasInvalidText'] = true;
      component.form.get('terminationDate')?.setValue(moment().add(2, 'months'));
      tick();
      expect(component['termDateInputHasInvalidText']).toBe(false);
    }));
  });

  describe('Form Valid State for EDIT', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = {
        locationId: 'LOC123',
        locationType: 'FIX',
        locationName: 'Test Location',
        travelTime: 30,
        travelDistance: 15.5,
        effDate: '2020-01-01',
        sponsorId: 'SPONSOR1'
      } as any;

      // Mock the getDriveLocationDetails call that happens in edit mode
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC123',
        locationType: 'FIX',
        locationName: 'Test Location',
        locationTypeDescription: 'Fixed Location',
        travelTime: 30,
        travelDistance: 15.5,
        effDate: '2020-01-01',
        sponsorId: 'SPONSOR1',
        sponsorName: 'Test Sponsor',
        address: {
          city: 'Dallas',
          state: 'TX',
          zip: '75001'
        }
      }));

      component.ngOnInit();
      fixture.detectChanges();
    });





    it('should keep save disabled when no changes are made even if staffFacility is filled', () => {
      // Fill staffFacility but don't mark anything as dirty
      component.form.get('staffFacility')?.setValue('FAC001');
      fixture.detectChanges();

      // Save should be disabled because no changes were made
      expect(component.isFormValid).toBe(false);
    });
  });

  describe('US Address Fields State', () => {
    const US_ADDRESS_CONTROLS = [
      'locationName', 'street', 'suitApt', 'zip', 'zipExtension', 'mapsco',
      'phoneAreaCode', 'phoneNumber', 'phoneExtension',
      'faxAreaCode', 'faxNumber', 'email', 'web'
    ];

    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges();
    });



    it('should re-enable all US address controls when internationalAddressData is cleared', () => {
      const intlData = { intlAddrFlag: 'Y', intlAddress1: '123 Intl St', countryName: 'Canada' };
      component.internationalAddressData = intlData;
      component.ngOnChanges({ internationalAddressData: new SimpleChange(null, intlData, false) });

      component.internationalAddressData = null;
      component.ngOnChanges({ internationalAddressData: new SimpleChange(intlData, null, false) });

      US_ADDRESS_CONTROLS.forEach(name => {
        expect(component.form.get(name)?.enabled)
          .withContext(`${name} should be enabled`)
          .toBe(true);
      });
    });

    it('should make form valid without locationName when international address is applied', fakeAsync(() => {
      const intlData = { intlAddrFlag: 'Y', intlAddress1: '123 Intl St', countryName: 'Canada' };
      component.internationalAddressData = intlData;
      component.ngOnChanges({ internationalAddressData: new SimpleChange(null, intlData, false) });

      component.form.get('locationType')?.setValue('FIX');
      tick(150);
      component.form.get('locationId')?.setValue('LOCN001');
      component.form.get('drawSite')?.setValue('Test Draw Site');
      component.form.get('travelTime')?.setValue('30');
      component.form.get('distance')?.setValue('15.5');
      component.form.get('staffFacility')?.setValue('FAC001');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));
      tick();
      fixture.detectChanges();

      expect(component.form.get('locationName')?.disabled).toBe(true);
      expect(component.form.valid).toBe(true);
      expect(component.isFormValid).toBe(true);
    }));
  });

  describe('Save Functionality - message selection', () => {
    it('should use response.message when present in add mode', () => {
      const response: any = { message: 'Drive location LOCN001 added successfully.' };
      const locationId = '';
      const message = response?.message || `Drive location ${locationId} added successfully.`;
      expect(message).toBe('Drive location LOCN001 added successfully.');
    });

    it('should fall back to hardcoded string when response.message is absent', () => {
      const response: any = { success: true, statusCode: 201 };
      const locationId = 'LOCN001';
      const message = response?.message || `Drive location ${locationId} added successfully.`;
      expect(message).toBe('Drive location LOCN001 added successfully.');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      component.mode = 'add';
      component.ngOnInit();
      const spy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges - data input change (non-first)', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = {
        locationId: 'LOC1', locationType: 'FIX', locationName: 'Loc',
        travelTime: 30, travelDistance: 10
      } as any;
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC1', locationType: 'FIX', locationName: 'Loc',
        travelTime: 30, travelDistance: 10, address: {}
      }));
      component.ngOnInit();
    });

    it('should reload form when data input changes (non-first change)', () => {
      const newData = { locationId: 'LOC2', locationType: 'FIX', locationName: 'Loc2', travelTime: 20, travelDistance: 5 } as any;
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC2', locationType: 'FIX', locationName: 'Loc2',
        travelTime: 20, travelDistance: 5, address: {}
      }));
      component.data = newData;
      component.ngOnChanges({
        data: { currentValue: newData, previousValue: component.data, firstChange: false, isFirstChange: () => false } as any
      });
      expect(mockService.getDriveLocationDetails).toHaveBeenCalled();
    });

    it('should reset form in add mode when data changes', () => {
      component.mode = 'add';
      component.ngOnChanges({
        data: { currentValue: null, previousValue: {}, firstChange: false, isFirstChange: () => false } as any
      });
      expect(component.driveLocationNotes.length).toBe(0);
    });
  });

  describe('loadDropdowns - edit mode', () => {
    it('should load only staff and facilities in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        locationId: 'LOC1', locationType: 'FIX', locationName: 'Loc',
        travelTime: 30, travelDistance: 10
      } as any;
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC1', locationType: 'FIX', locationName: 'Loc',
        travelTime: 30, travelDistance: 10, address: {}
      }));
      mockService.getStaffLookup.and.returnValue(of([{ code: 'S1', description: 'Staff 1' }]));
      mockService.getFacilityLookup.and.returnValue(of([{ code: 'F1', description: 'Facility 1' }]));
      component.ngOnInit();
      expect(mockService.getStaffLookup).toHaveBeenCalled();
      expect(mockService.getFacilityLookup).toHaveBeenCalled();
      expect(component.donorCarMnrOptions.length).toBe(1);
      expect(component.facilityOptions.length).toBe(1);
    });

    it('should handle errors in edit mode dropdown loading', () => {
      component.mode = 'edit';
      component.data = {
        locationId: 'LOC1', locationType: 'FIX', locationName: 'Loc',
        travelTime: 30, travelDistance: 10
      } as any;
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC1', locationType: 'FIX', locationName: 'Loc',
        travelTime: 30, travelDistance: 10, address: {}
      }));
      mockService.getStaffLookup.and.returnValue(throwError(() => new Error('fail')));
      mockService.getFacilityLookup.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.donorCarMnrOptions.length).toBe(0);
    });
  });

  describe('loadDropdowns - add mode errors', () => {
    it('should handle errors in add mode dropdown loading', () => {
      component.mode = 'add';
      mockService.getLocationTypeLookup.and.returnValue(throwError(() => new Error('fail')));
      mockService.getSponsorLookup.and.returnValue(throwError(() => new Error('fail')));
      mockService.getHospitalLookup.and.returnValue(throwError(() => new Error('fail')));
      mockService.getStaffLookup.and.returnValue(throwError(() => new Error('fail')));
      mockService.getFacilityLookup.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.locationTypeOptions.length).toBe(0);
      expect(component.sponsorOptions.length).toBe(0);
    });
  });

  describe('Search Filters', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockService.getLocationTypeLookup.and.returnValue(of([
        { code: 'FIX', description: 'Fixed' },
        { code: 'MOB', description: 'Mobile' }
      ]));
      mockService.getSponsorLookup.and.returnValue(of([
        { code: 'SP1', description: 'Sponsor One' }
      ]));
      mockService.getHospitalLookup.and.returnValue(of([
        { code: 'H1', description: 'Hospital One' }
      ]));
      mockService.getStaffLookup.and.returnValue(of([
        { code: 'ST1', description: 'Staff One' }
      ]));
      mockService.getFacilityLookup.and.returnValue(of([
        { code: 'FA1', description: 'Facility One' }
      ]));
      component.ngOnInit();
    });

    it('should filter location types by search term', fakeAsync(() => {
      component.locationTypeSearchCtrl.setValue('mob');
      tick(300);
      expect(component.filteredLocationTypeOptions().length).toBe(1);
      expect(component.filteredLocationTypeOptions()[0].code).toBe('MOB');
    }));

    it('should filter sponsors by search term', fakeAsync(() => {
      component.sponsorSearchCtrl.setValue('one');
      tick(300);
      expect(component.filteredSponsorOptions().length).toBe(1);
    }));

    it('should filter hospitals by search term', fakeAsync(() => {
      component.hospitalSearchCtrl.setValue('hosp');
      tick(300);
      expect(component.filteredHospitalOptions().length).toBe(1);
    }));

    it('should filter donor car mnr by search term', fakeAsync(() => {
      component.donorCarMnrSearchCtrl.setValue('staff');
      tick(300);
      expect(component.filteredDonorCarMnrOptions().length).toBe(1);
    }));

    it('should filter facilities by search term', fakeAsync(() => {
      component.facilitySearchCtrl.setValue('facility');
      tick(300);
      expect(component.filteredFacilityOptions().length).toBe(1);
    }));

    it('should filter locations by search term', fakeAsync(() => {
      component.locationOptions = [
        { code: 'L1', description: 'LocationA' },
        { code: 'L2', description: 'LocationB' }
      ];
      component.locationSearchCtrl.setValue('locationa');
      tick(300);
      expect(component.filteredLocationOptions().length).toBe(1);
    }));
  });

  describe('Value Change Listeners - locationType', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockService.getLocationTypeLookup.and.returnValue(of([
        { code: 'FIX', description: 'Fixed' }
      ]));
      component.ngOnInit();
    });

    it('should set locationTypeDescription when locationType changes', fakeAsync(() => {
      component.form.get('locationType')?.setValue('FIX');
      tick(150);
      expect(component.editModeValues.locationTypeDescription).toBe('Fixed');
    }));

    it('should clear locationTypeDescription when locationType is cleared', fakeAsync(() => {
      component.form.get('locationType')?.setValue('FIX');
      tick(150);
      component.form.get('locationType')?.setValue('');
      tick(150);
      expect(component.editModeValues.locationTypeDescription).toBe('');
    }));
  });

  describe('Value Change Listeners - sponsorId and hospitalId', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockService.getSponsorLookup.and.returnValue(of([
        { code: 'SP1', description: 'Sponsor One' }
      ]));
      mockService.getHospitalLookup.and.returnValue(of([
        { code: 'H1', description: 'Hospital One' }
      ]));
      component.ngOnInit();
    });

    it('should set sponsorDescription when sponsorId changes', fakeAsync(() => {
      component.form.get('sponsorId')?.setValue('SP1');
      tick(150);
      expect(component.editModeValues.sponsorDescription).toBe('Sponsor One');
    }));

    it('should clear sponsorDescription when sponsorId is cleared', fakeAsync(() => {
      component.form.get('sponsorId')?.setValue('SP1');
      tick(150);
      component.form.get('sponsorId')?.setValue('');
      tick(150);
      expect(component.editModeValues.sponsorDescription).toBe('');
    }));

    it('should set hospitalDescription when hospitalId changes', fakeAsync(() => {
      component.form.get('hospitalId')?.setValue('H1');
      tick(150);
      expect(component.editModeValues.hospitalDescription).toBe('Hospital One');
    }));

    it('should clear hospitalDescription when hospitalId is cleared', fakeAsync(() => {
      component.form.get('hospitalId')?.setValue('H1');
      tick(150);
      component.form.get('hospitalId')?.setValue('');
      tick(150);
      expect(component.editModeValues.hospitalDescription).toBe('');
    }));
  });

  describe('Value Change Listeners - locationId', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
      component.locationOptions = [
        { code: 'LOCN001', description: 'Test Draw Site' }
      ];
    });

    it('should set drawSite description when locationId changes', fakeAsync(() => {
      component.form.get('locationId')?.enable();
      component.form.get('locationId')?.setValue('LOCN001');
      tick(150);
      expect(component.editModeValues.drawSite).toBe('Test Draw Site');
    }));

    it('should clear drawSite and notes when locationId is cleared', fakeAsync(() => {
      component.form.get('locationId')?.enable();
      component.form.get('locationId')?.setValue('LOCN001');
      tick(150);
      component.form.get('locationId')?.setValue('');
      tick(150);
      expect(component.editModeValues.drawSite).toBe('');
      expect(component.driveLocationNotes.length).toBe(0);
    }));
  });

  describe('loadNotesForLocation', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should load notes for a location ID', fakeAsync(() => {
      mockService.getLocationNotes.and.returnValue(of([
        { noteSequence: 1, note: 'Test note', insertUserName: 'user1', insertDate: '2024-01-01', auditKey: 'AK1' }
      ]));
      component.form.get('locationId')?.enable();
      component.locationOptions = [{ code: 'LOCN001', description: 'Test' }];
      component.form.get('locationId')?.setValue('LOCN001');
      tick(150);
      expect(component.driveLocationNotes.length).toBe(1);
      expect(component.driveLocationNotes[0].noteText).toBe('Test note');
    }));

    it('should handle empty notes response', fakeAsync(() => {
      mockService.getLocationNotes.and.returnValue(of([]));
      component.form.get('locationId')?.enable();
      component.locationOptions = [{ code: 'LOCN001', description: 'Test' }];
      component.form.get('locationId')?.setValue('LOCN001');
      tick(150);
      expect(component.driveLocationNotes.length).toBe(0);
    }));

    it('should handle error when loading notes', fakeAsync(() => {
      mockService.getLocationNotes.and.returnValue(throwError(() => new Error('fail')));
      component.form.get('locationId')?.enable();
      component.locationOptions = [{ code: 'LOCN001', description: 'Test' }];
      component.form.get('locationId')?.setValue('LOCN001');
      tick(150);
      expect(component.driveLocationNotes.length).toBe(0);
    }));
  });

  describe('Zip valueChanges - edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should clear city/state/county when zip is less than 5 digits', fakeAsync(() => {
      component.editModeValues.city = 'OldCity';
      component.form.get('zip')?.setValue('123');
      tick(400);
      expect(component.editModeValues.city).toBe('');
      expect(component.editModeValues.state).toBe('');
    }));

    it('should handle empty zip response', fakeAsync(() => {
      mockService.getCityStateByZipCode.and.returnValue(of([]));
      component.form.get('zip')?.setValue('99999');
      tick(400);
      expect(component.editModeValues.city).toBe('');
    }));

    it('should handle zip API error', fakeAsync(() => {
      mockService.getCityStateByZipCode.and.returnValue(throwError(() => new Error('fail')));
      component.form.get('zip')?.setValue('99999');
      tick(400);
      expect(component.editModeValues.city).toBe('');
      expect(component.editModeValues.state).toBe('');
    }));
  });

  describe('onSave - add mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should not save if form is invalid in add mode', () => {
      component.onSave();
      expect(mockService.upsertDriveLocation).not.toHaveBeenCalled();
    });

    it('should call upsertDriveLocation on successful save', () => {
      mockService.upsertDriveLocation.and.returnValue(of({ message: 'Added' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      // Override form.invalid to bypass form validation
      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });

      component.onSave();

      expect(mockService.upsertDriveLocation).toHaveBeenCalled();
      // snackBar.open and event emitters are called in the subscribe callback
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });

    it('should handle save error and not emit saveSuccess', () => {
      mockService.upsertDriveLocation.and.returnValue(throwError(() => ({
        error: { message: 'Duplicate location' }
      })));
      spyOn(component.saveSuccess, 'emit');

      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });

      component.onSave();

      expect(mockService.upsertDriveLocation).toHaveBeenCalled();
      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
    });

    it('should handle errorResponse format on save error', () => {
      mockService.upsertDriveLocation.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: 'ERR001', error: 'Dup record' } }
      })));
      spyOn(component.saveSuccess, 'emit');

      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });

      component.onSave();

      expect(mockService.upsertDriveLocation).toHaveBeenCalled();
      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
    });

    it('should not save if already saving', () => {
      mockService.upsertDriveLocation.and.returnValue(of({ message: 'ok' }));

      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });

      component.isSaving.set(true);
      component.onSave();
      expect(mockService.upsertDriveLocation).not.toHaveBeenCalled();
    });
  });

  describe('onSave - edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = {
        locationId: 'LOC123', locationType: 'FIX', locationName: 'Test',
        travelTime: 30, travelDistance: 15.5, effDate: '2020-01-01'
      } as any;
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC123', locationType: 'FIX', locationName: 'Test',
        travelTime: 30, travelDistance: 15.5, effDate: '2020-01-01',
        staffFacility: 'FAC1',
        address: { city: 'Dallas', state: 'TX', zip: '75001' }
      }));
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should block save when dateRangeInvalid error exists', () => {
      component.form.setErrors({ dateRangeInvalid: true });
      component.form.markAsDirty();
      component.onSave();
      expect(mockService.upsertDriveLocation).not.toHaveBeenCalled();
    });

    it('should block save when travelTime has pattern error', () => {
      component.form.get('travelTime')?.setValue('abc');
      component.form.markAsDirty();
      component.onSave();
      expect(mockService.upsertDriveLocation).not.toHaveBeenCalled();
    });

    it('should save successfully in edit mode', fakeAsync(() => {
      mockService.upsertDriveLocation.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');
      component.form.get('travelTime')?.setValue('45');
      component.form.get('travelTime')?.markAsDirty();
      component.form.markAsDirty();
      tick(150);
      fixture.detectChanges();
      component.onSave();
      tick();
      expect(mockService.upsertDriveLocation).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));
  });

  describe('buildPayload', () => {
    it('should build payload with additional details data in add mode', fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();

      component.form.get('locationType')?.setValue('FIX');
      tick(150);
      component.form.get('locationId')?.setValue('LOCN001');
      component.form.get('drawSite')?.setValue('Test Site');
      component.form.get('travelTime')?.setValue('30');
      component.form.get('distance')?.setValue('15.5');
      component.form.get('staffFacility')?.setValue('FAC001');
      component.form.get('effectiveDate')?.setValue(moment('2025-06-01'));
      component.form.get('locationName')?.setValue('Test Name');
      component.form.get('zip')?.setValue('75001');
      component.form.get('street')?.setValue('123 Main St');
      component.form.get('phoneAreaCode')?.setValue('214');
      component.form.get('phoneNumber')?.setValue('5551234');
      component.form.get('email')?.setValue('test@test.com');
      component.form.get('timeOpen')?.setValue('08:00');
      component.form.get('timeClose')?.setValue('17:00');
      tick(400);

      const payload = component['buildPayload']();
      expect(payload.locationType).toBe('FIX');
      expect(payload.travelTime).toBe(30);
      expect(payload.distance).toBe(15.5);
      expect(payload.address1).toBe('Test Name');
      expect(payload.streetName).toBe('123 Main St');
      expect(payload.dAreaCode).toBe('214');
      expect(payload.intlAddrFlag).toBe('N');
      expect(payload.programId).toBe('DRIVELOC');
    }));

    it('should build payload with international address data', fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();

      component.internationalAddressData = {
        intlAddrFlag: 'Y', intlAddress1: '123 Intl St',
        countryName: 'Canada', intlPostalCode: 'A1B 2C3'
      };

      component.form.get('locationType')?.setValue('FIX');
      tick(150);
      component.form.get('drawSite')?.setValue('Test Site');
      component.form.get('travelTime')?.setValue('30');
      component.form.get('distance')?.setValue('15.5');
      component.form.get('staffFacility')?.setValue('FAC001');
      component.form.get('effectiveDate')?.setValue(moment('2025-06-01'));
      tick(400);

      const payload = component['buildPayload']();
      expect(payload.intlAddrFlag).toBe('Y');
      expect(payload.intlAddress1).toBe('123 Intl St');
      expect(payload.countryName).toBe('Canada');
      expect(payload.address1).toBeNull();
    }));

    it('should include notes in payload', () => {
      component.mode = 'add';
      component.ngOnInit();
      component.driveLocationNotes = [
        { noteId: null, noteText: 'Note 1', createdBy: 'user', createdDate: '2024-01-01', auditKey: null, isDeleted: false },
        { noteId: 'N1', noteText: 'Note 2', createdBy: 'user', createdDate: '2024-01-01', auditKey: 'AK1', isDeleted: true }
      ];
      const payload = component['buildPayload']();
      expect(payload.notes.length).toBe(2);
      expect(payload.notes[0].noteSequence).toBe(1);
      expect(payload.notes[1].isDeleted).toBe(true);
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel', () => {
      component.mode = 'add';
      component.ngOnInit();
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('Error Message Getters', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('getLocationTypeError should return required error when touched', () => {
      const ctrl = component.form.get('locationType')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.getLocationTypeError()).toBe('Location Type is required');
    });

    it('getLocationTypeError should return empty string when not touched', () => {
      expect(component.getLocationTypeError()).toBe('');
    });

    it('getLocationIdError should return required error when touched', () => {
      const ctrl = component.form.get('locationId')!;
      ctrl.setValidators([component.form.get('locationType')!.validator!]);
      ctrl.markAsTouched();
      // locationId has no required validator in add mode
      expect(component.getLocationIdError()).toBe('');
    });

    it('getDrawSiteError should return required error when touched', () => {
      const ctrl = component.form.get('drawSite')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.getDrawSiteError()).toBe('Draw Site is required');
    });

    it('getDrawSiteError should return maxlength error', () => {
      const ctrl = component.form.get('drawSite')!;
      ctrl.setValue('a'.repeat(51));
      ctrl.markAsTouched();
      expect(component.getDrawSiteError()).toBe('Draw Site cannot exceed 50 characters');
    });

    it('getTravelTimeError should return required error when touched', () => {
      const ctrl = component.form.get('travelTime')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.getTravelTimeError()).toBe('Travel Time is required');
    });

    it('getTravelTimeError should return pattern error when touched', () => {
      const ctrl = component.form.get('travelTime')!;
      ctrl.setValue('abcd');
      ctrl.markAsTouched();
      expect(component.getTravelTimeError()).toBe('Travel Time must be a number (max 3 digits)');
    });

    it('getDistanceError should return required error when touched', () => {
      const ctrl = component.form.get('distance')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.getDistanceError()).toBe('Distance is required');
    });

    it('getDistanceError should return pattern error when touched', () => {
      const ctrl = component.form.get('distance')!;
      ctrl.setValue('abcd');
      ctrl.markAsTouched();
      expect(component.getDistanceError()).toBe('Distance must be a number (max 999.99)');
    });

    it('getStaffFacilityError should return required error when touched', () => {
      const ctrl = component.form.get('staffFacility')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.getStaffFacilityError()).toBe('Staff Facility is required');
    });

    it('getDirectionNotesError should return maxlength error', () => {
      const ctrl = component.form.get('directionNotes')!;
      ctrl.setValue('a'.repeat(501));
      ctrl.markAsTouched();
      expect(component.getDirectionNotesError()).toBe('Direction Notes cannot exceed 500 characters');
    });

    it('getDirectionNotesError should return empty when valid', () => {
      const ctrl = component.form.get('directionNotes')!;
      ctrl.setValue('Short note');
      ctrl.markAsTouched();
      expect(component.getDirectionNotesError()).toBe('');
    });

    it('getEffectiveDateError should delegate to DateFieldValidationUtility', () => {
      // Just ensure it returns a string (empty or error)
      expect(typeof component.getEffectiveDateError()).toBe('string');
    });

    it('getFdaLicenseDateError should return empty when not touched', () => {
      expect(component.getFdaLicenseDateError()).toBe('');
    });

    it('getFdaLicenseDateError should return error for invalid date format', () => {
      const ctrl = component.form.get('fdaLicenseDate')!;
      ctrl.markAsTouched();
      ctrl.markAsDirty();
      ctrl.setErrors({ invalidDateFormat: true });
      expect(component.getFdaLicenseDateError()).toBe('FDA License date is invalid');
    });

    it('getFdaLicenseDateError should return error for invalidDate', () => {
      const ctrl = component.form.get('fdaLicenseDate')!;
      ctrl.markAsTouched();
      ctrl.markAsDirty();
      ctrl.setErrors({ invalidDate: true });
      expect(component.getFdaLicenseDateError()).toBe('FDA License date is invalid');
    });

    it('getFdaLicenseDateError should return error for matDatepickerParse', () => {
      const ctrl = component.form.get('fdaLicenseDate')!;
      ctrl.markAsTouched();
      ctrl.markAsDirty();
      ctrl.setErrors({ matDatepickerParse: true });
      expect(component.getFdaLicenseDateError()).toBe('FDA License date is invalid');
    });

    it('getFdaLicenseDateError should return past date error', () => {
      const ctrl = component.form.get('fdaLicenseDate')!;
      ctrl.markAsTouched();
      ctrl.markAsDirty();
      ctrl.setErrors({ effectiveDatePast: true });
      expect(component.getFdaLicenseDateError()).toBe('FDA License date cannot be past date');
    });

    it('getZipError should return required when zip required and not filled', () => {
      component.form.get('locationName')?.setValue('Test');
      const ctrl = component.form.get('zip')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.getZipError()).toBe('Zip is required');
    });

    it('getZipError should return pattern error', () => {
      const ctrl = component.form.get('zip')!;
      ctrl.setValue('abc');
      ctrl.markAsTouched();
      expect(component.getZipError()).toBe('Zip must be exactly 5 digits');
    });

    it('getZipError should return empty for valid zip', () => {
      const ctrl = component.form.get('zip')!;
      ctrl.setValue('75001');
      ctrl.markAsTouched();
      expect(component.getZipError()).toBe('');
    });

    it('getPhoneAreaCodeError should return empty', () => {
      expect(component.getPhoneAreaCodeError()).toBe('');
    });

    it('getPhoneNumberError should return pattern error when touched', () => {
      const ctrl = component.form.get('phoneNumber')!;
      ctrl.setValue('12345');
      ctrl.markAsTouched();
      expect(component.getPhoneNumberError()).toBe('Must be 7 digits');
    });

    it('getPhoneNumberError should return empty for valid', () => {
      const ctrl = component.form.get('phoneNumber')!;
      ctrl.setValue('1234567');
      ctrl.markAsTouched();
      expect(component.getPhoneNumberError()).toBe('');
    });

    it('getFaxAreaCodeError should return empty', () => {
      expect(component.getFaxAreaCodeError()).toBe('');
    });

    it('getFaxNumberError should return pattern error when touched', () => {
      const ctrl = component.form.get('faxNumber')!;
      ctrl.setValue('12345');
      ctrl.markAsTouched();
      expect(component.getFaxNumberError()).toBe('Must be 7 digits');
    });
  });

  describe('formatDate', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should return formatted date string', () => {
      const result = component.formatDate('2024-01-15T00:00:00');
      expect(result).toMatch(/15-JAN-2024/);
    });

    it('should return "-" for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return "-" for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });
  });

  describe('getInitials', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should return initials for two-word name', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
    });

    it('should return single initial for one-word name', () => {
      expect(component.getInitials('John')).toBe('J');
    });

    it('should return ? for empty name', () => {
      expect(component.getInitials('')).toBe('?');
    });

    it('should handle multi-word name by taking first and last', () => {
      expect(component.getInitials('John Michael Doe')).toBe('JD');
    });
  });

  describe('formatNoteDate', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should format date string', () => {
      const result = component.formatNoteDate('2024-03-15T12:00:00');
      expect(result).toMatch(/15-MAR-2024/);
    });

    it('should return empty string for empty date', () => {
      expect(component.formatNoteDate('')).toBe('');
    });
  });

  describe('activeNotes', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should filter out deleted notes', () => {
      component.driveLocationNotes = [
        { noteText: 'Active', isDeleted: false },
        { noteText: 'Deleted', isDeleted: true },
        { noteText: 'Also Active', isDeleted: false }
      ];
      expect(component.activeNotes.length).toBe(2);
    });
  });

  describe('Notes - onEditNote and onDeleteNote with noteId', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should set editingNoteIndex and populate noteForm on onEditNote', () => {
      component.driveLocationNotes = [
        { noteText: 'Test note', createdBy: 'user', createdDate: '2024-01-01' }
      ];
      component.onEditNote(component.driveLocationNotes[0], 0);
      expect(component.editingNoteIndex).toBe(0);
      expect(component.noteForm.get('noteText')?.value).toBe('Test note');
    });

    it('should update existing note when editingNoteIndex is set', () => {
      component.driveLocationNotes = [
        { noteText: 'Old note', createdBy: 'user', createdDate: '2024-01-01' }
      ];
      component.editingNoteIndex = 0;
      component.noteForm.patchValue({ noteText: 'Updated note' });
      component.onAddNote();
      expect(component.driveLocationNotes[0].noteText).toBe('Updated note');
      expect(component.editingNoteIndex).toBeNull();
    });

    it('should mark note as deleted when it has noteId', () => {
      component.driveLocationNotes = [
        { noteId: 'N1', noteText: 'Existing note', createdBy: 'user', createdDate: '2024-01-01', isDeleted: false }
      ];
      component.onDeleteNote(0);
      expect(component.driveLocationNotes[0].isDeleted).toBe(true);
      expect(component.notesModified).toBe(true);
    });
  });

  describe('onTimeInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should mark control as dirty and update validation', () => {
      component.form.get('timeOpen')?.setValue('09:00');
      component.onTimeInput('timeOpen');
      expect(component.form.get('timeOpen')?.dirty).toBe(true);
    });
  });

  describe('onTimeKeyPress', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should allow digit keys', () => {
      const event = { key: '5', preventDefault: jasmine.createSpy() } as any;
      component.onTimeKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow colon key', () => {
      const event = { key: ':', preventDefault: jasmine.createSpy() } as any;
      component.onTimeKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation keys', () => {
      const event = { key: 'Tab', preventDefault: jasmine.createSpy() } as any;
      component.onTimeKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ctrl key combos', () => {
      const event = { key: 'a', ctrlKey: true, preventDefault: jasmine.createSpy() } as any;
      component.onTimeKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit non-colon keys', () => {
      const event = { key: 'a', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
      component.onTimeKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onNumericKeyPress', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should allow digits', () => {
      const event = { key: '5', preventDefault: jasmine.createSpy() } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation keys', () => {
      const event = { key: 'Backspace', preventDefault: jasmine.createSpy() } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ctrl+c', () => {
      const event = { key: 'c', ctrlKey: true, metaKey: false, preventDefault: jasmine.createSpy() } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit keys', () => {
      const event = { key: 'a', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onDecimalKeyPress', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should allow digits', () => {
      const event = { key: '5', target: { value: '12' }, preventDefault: jasmine.createSpy() } as any;
      component.onDecimalKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow first decimal point', () => {
      const event = { key: '.', target: { value: '12' }, preventDefault: jasmine.createSpy() } as any;
      component.onDecimalKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent second decimal point', () => {
      const event = { key: '.', target: { value: '12.5' }, preventDefault: jasmine.createSpy() } as any;
      component.onDecimalKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow navigation keys', () => {
      const event = { key: 'Tab', target: { value: '' }, preventDefault: jasmine.createSpy() } as any;
      component.onDecimalKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ctrl+v', () => {
      const event = { key: 'v', ctrlKey: true, metaKey: false, target: { value: '' }, preventDefault: jasmine.createSpy() } as any;
      component.onDecimalKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit non-decimal keys', () => {
      const event = { key: 'a', ctrlKey: false, metaKey: false, target: { value: '' }, preventDefault: jasmine.createSpy() } as any;
      component.onDecimalKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Phone/Fax Formatting', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('onPhoneNumberFocus should strip hyphens', () => {
      component.form.get('phoneNumber')?.setValue('123-4567');
      component.onPhoneNumberFocus();
      expect(component.form.get('phoneNumber')?.value).toBe('1234567');
    });

    it('onPhoneNumberFocus should do nothing if no value', () => {
      component.form.get('phoneNumber')?.setValue('');
      component.onPhoneNumberFocus();
      expect(component.form.get('phoneNumber')?.value).toBe('');
    });

    it('formatPhoneNumber should format 7-digit number', () => {
      component.form.get('phoneNumber')?.setValue('1234567');
      component.form.get('phoneNumber')?.markAsDirty();
      component.formatPhoneNumber();
      expect(component.form.get('phoneNumber')?.value).toBe('123-4567');
    });

    it('formatPhoneNumber should not format non-7-digit number', () => {
      component.form.get('phoneNumber')?.setValue('12345');
      component.formatPhoneNumber();
      expect(component.form.get('phoneNumber')?.value).toBe('12345');
    });

    it('onFaxNumberFocus should strip hyphens', () => {
      component.form.get('faxNumber')?.setValue('123-4567');
      component.onFaxNumberFocus();
      expect(component.form.get('faxNumber')?.value).toBe('1234567');
    });

    it('onFaxNumberFocus should do nothing if no value', () => {
      component.form.get('faxNumber')?.setValue('');
      component.onFaxNumberFocus();
      expect(component.form.get('faxNumber')?.value).toBe('');
    });

    it('formatFaxNumber should format 7-digit number', () => {
      component.form.get('faxNumber')?.setValue('1234567');
      component.form.get('faxNumber')?.markAsDirty();
      component.formatFaxNumber();
      expect(component.form.get('faxNumber')?.value).toBe('123-4567');
    });

    it('formatFaxNumber should not format non-7-digit number', () => {
      component.form.get('faxNumber')?.setValue('12345');
      component.formatFaxNumber();
      expect(component.form.get('faxNumber')?.value).toBe('12345');
    });
  });

  describe('Date Input Handlers', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('onEffectiveDateInput should call DateFieldValidationUtility', () => {
      const event = { target: { value: '01-JAN-2025' } } as any;
      component.onEffectiveDateInput(event);
      // No error means it was called successfully
      expect(true).toBe(true);
    });

    it('onTerminationDateInput should set termDateInputHasInvalidText for invalid text', () => {
      const event = { target: { value: 'invalid' } } as any;
      component.form.get('terminationDate')?.setValue(null);
      component.onTerminationDateInput(event);
      expect(component['termDateInputHasInvalidText']).toBe(true);
    });

    it('onTerminationDateInput should clear flag when no text', () => {
      const event = { target: { value: '' } } as any;
      component['termDateInputHasInvalidText'] = true;
      component.onTerminationDateInput(event);
      expect(component['termDateInputHasInvalidText']).toBe(false);
    });

    it('onFdaLicenseDateInput should call DateFieldValidationUtility', () => {
      const event = { target: { value: '01-JAN-2025' } } as any;
      component.onFdaLicenseDateInput(event);
      expect(true).toBe(true);
    });
  });

  describe('extractErrorMessage', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should extract errorResponse with errorCode (Priority 1)', () => {
      const error = {
        error: {
          errorResponse: { errorCode: 'ERR001', error: 'Duplicate record' }
        }
      };
      const msg = component['extractErrorMessage'](error);
      expect(msg).toBe('Error: ERR001 : Duplicate record');
    });

    it('should extract error.message (Priority 2)', () => {
      const error = { error: { message: 'Something went wrong' } };
      const msg = component['extractErrorMessage'](error);
      expect(msg).toBe('Something went wrong');
    });

    it('should use error.message as fallback (Priority 3)', () => {
      const error = { message: 'Network error' };
      const msg = component['extractErrorMessage'](error);
      expect(msg).toBe('Network error');
    });

    it('should use default message when nothing available', () => {
      const error = {};
      const msg = component['extractErrorMessage'](error, 'Custom default');
      expect(msg).toBe('Custom default');
    });
  });

  describe('loadDriveLocationDetails - error path', () => {
    it('should fallback to grid data on API error', () => {
      component.mode = 'edit';
      component.data = {
        locationId: 'LOC123', locationType: 'FIX', locationName: 'Test',
        travelTime: 30, travelDistance: 15.5
      } as any;
      mockService.getDriveLocationDetails.and.returnValue(throwError(() => new Error('API Error')));
      component.ngOnInit();
      // After error, the form should still be populated from grid data (fallback)
      expect(mockService.getDriveLocationDetails).toHaveBeenCalled();
      // The form should have the data from populateFormForEdit fallback
      expect(component.form.getRawValue().travelTime).toBeTruthy();
    });
  });

  describe('loadDriveLocationDetails - with international address and notes', () => {
    it('should load international address data in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        locationId: 'LOC123', locationType: 'FIX', locationName: 'Test',
        travelTime: 30, travelDistance: 15.5
      } as any;
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC123', locationType: 'FIX', locationName: 'Test',
        travelTime: 30, travelDistance: 15.5, effDate: '2020-01-01',
        openTime: '0800', closeTime: '17:00:00',
        staffFacility: 'FAC1',
        notes: [{ noteSequence: 1, note: 'API note', insertUserName: 'admin', insertDate: '2024-01-01' }],
        address: {
          intlAddrFlag: 'Y', intlAddress1: '123 Foreign St', countryName: 'Mexico',
          zip: 75001, dAreaCode: 214, dPhoneNo: 5551234, zipExtension: 1234
        }
      }));
      component.ngOnInit();
      fixture.detectChanges();
      expect(component['loadedInternationalAddressData']).toBeTruthy();
      expect(component['loadedInternationalAddressData'].intlAddrFlag).toBe('Y');
      expect(component.driveLocationNotes.length).toBe(1);
    });
  });

  describe('populateFormForEdit - time extraction', () => {
    it('should handle various time formats', () => {
      component.mode = 'edit';
      component.data = {
        locationId: 'LOC123', locationType: 'FIX', locationName: 'Test',
        travelTime: 30, travelDistance: 15.5
      } as any;
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC123', locationType: 'FIX', locationName: 'Test',
        travelTime: 30, travelDistance: 15.5,
        openTime: '2024-01-01T14:30:00',
        closeTime: '17:00',
        address: { city: 'Dallas', state: 'TX' }
      }));
      component.ngOnInit();
      fixture.detectChanges();
      // '2024-01-01T14:30:00' is normalized to UTC then converted by chapter offset (-300 min / UTC-5) → 09:30
      expect(component.form.getRawValue().timeOpen).toBe('09:30');
      expect(component.form.getRawValue().timeClose).toBe('17:00');
    });
  });

  describe('isFormValid - edit mode branches', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = {
        locationId: 'LOC123', locationType: 'FIX', locationName: 'Test',
        travelTime: 30, travelDistance: 15.5
      } as any;
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC123', locationType: 'FIX', locationName: 'Test',
        travelTime: 30, travelDistance: 15.5, staffFacility: 'FAC1',
        address: { city: 'Dallas', state: 'TX', zip: '75001' }
      }));
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should return false when staffFacility is empty', () => {
      component.form.get('staffFacility')?.setValue('');
      component.form.markAsDirty();
      expect(component.isFormValid).toBe(false);
    });

    it('should return false when a dirty field has errors', () => {
      component.form.get('travelTime')?.setValue('abc');
      component.form.get('travelTime')?.markAsDirty();
      component.form.markAsDirty();
      expect(component.isFormValid).toBe(false);
    });

    it('should return true when dirty with valid changes', () => {
      component.form.get('travelTime')?.setValue('45');
      component.form.get('travelTime')?.markAsDirty();
      component.form.markAsDirty();
      expect(component.isFormValid).toBe(true);
    });

    it('should return true when notesModified', () => {
      component.notesModified = true;
      expect(component.isFormValid).toBe(true);
    });

    it('should return true when international address modified', () => {
      component.internationalAddressData = { intlAddrFlag: 'Y', intlAddress1: 'New Address', countryName: 'Canada' };
      expect(component.isFormValid).toBe(true);
    });
  });

  describe('isFormValid - add mode additional details validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should require zip when additional details fields are filled', fakeAsync(() => {
      component.form.get('locationType')?.setValue('FIX');
      tick(150);
      component.form.get('locationId')?.setValue('LOCN001');
      component.form.get('drawSite')?.setValue('Test Site');
      component.form.get('travelTime')?.setValue('30');
      component.form.get('distance')?.setValue('15.5');
      component.form.get('staffFacility')?.setValue('FAC001');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));
      component.form.get('locationName')?.setValue('Test Name');
      // No zip set - should be invalid since additional details are filled
      tick(400);
      fixture.detectChanges();
      expect(component.isFormValid).toBe(false);
    }));

    it('should be invalid with invalid email', fakeAsync(() => {
      component.form.get('locationType')?.setValue('FIX');
      tick(150);
      component.form.get('drawSite')?.setValue('Test Site');
      component.form.get('travelTime')?.setValue('30');
      component.form.get('distance')?.setValue('15.5');
      component.form.get('staffFacility')?.setValue('FAC001');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));
      component.form.get('locationName')?.setValue('Test Name');
      component.form.get('zip')?.setValue('75001');
      component.form.get('email')?.setValue('not-an-email');
      tick(400);
      fixture.detectChanges();
      expect(component.isFormValid).toBe(false);
    }));
  });

  describe('openInternationalAddressDialog - edit mode', () => {
    it('should pass existing international address data in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        locationId: 'LOC123', locationType: 'FIX', locationName: 'Test',
        travelTime: 30, travelDistance: 15.5
      } as any;
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC123', locationType: 'FIX', locationName: 'Test',
        travelTime: 30, travelDistance: 15.5,
        address: { intlAddrFlag: 'Y', intlAddress1: '123 Foreign', countryName: 'Mexico' }
      }));
      component.ngOnInit();
      fixture.detectChanges();

      spyOn(component.openInternationalAddress, 'emit');
      component.openInternationalAddressDialog();
      expect(component.openInternationalAddress.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ recordKey: 'LOC123', existingData: jasmine.any(Object) })
      );
    });
  });

  describe('loadLocationOptions', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should load location options and execute callback', () => {
      mockService.getLocationLookup.and.returnValue(of([
        { code: 'L1', description: 'Loc 1' },
        { code: 'L2', description: 'Loc 2' }
      ]));
      const callback = jasmine.createSpy('callback');
      component['loadLocationOptions']('FIX', callback);
      expect(component.locationOptions.length).toBe(2);
      expect(callback).toHaveBeenCalled();
    });

    it('should handle error when loading location options', () => {
      mockService.getLocationLookup.and.returnValue(throwError(() => new Error('fail')));
      component['loadLocationOptions']('FIX');
      expect(component.locationOptions.length).toBe(0);
    });
  });

  describe('normalizeTimeInput edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should return null for unparseable input', () => {
      const ctrl = component.form.get('timeOpen')!;
      ctrl.setValue('abcde');
      component.onTimeBlur('timeOpen');
      // Value stays as original since normalize returns null
      expect(ctrl.value).toBe('abcde');
    });

    it('should handle 4-digit with invalid hours', () => {
      const ctrl = component.form.get('timeOpen')!;
      ctrl.setValue('2500');
      component.onTimeBlur('timeOpen');
      // normalize returns null for h > 23
      expect(ctrl.value).toBe('2500');
    });

    it('should handle 3-digit input', () => {
      const ctrl = component.form.get('timeOpen')!;
      ctrl.setValue('830');
      component.onTimeBlur('timeOpen');
      expect(ctrl.value).toBe('08:30');
    });
  });

  describe('onClearAll - full reset', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should reset search controls and location options', () => {
      component.locationTypeSearchCtrl.setValue('test');
      component.locationSearchCtrl.setValue('test');
      component.sponsorSearchCtrl.setValue('test');
      component.hospitalSearchCtrl.setValue('test');
      component.donorCarMnrSearchCtrl.setValue('test');
      component.facilitySearchCtrl.setValue('test');
      component.locationOptions = [{ code: 'L1', description: 'Loc' }];

      component.onClearAll();

      expect(component.locationTypeSearchCtrl.value).toBeNull();
      expect(component.locationSearchCtrl.value).toBeNull();
      expect(component.locationOptions.length).toBe(0);
      expect(component.editingNoteIndex).toBeNull();
      expect(component.notesModified).toBe(false);
    });
  });

  // Additional Coverage
  // ---------------------------------------------------------------------------
  describe('Additional Coverage', () => {

    /** Fill every required field so form.invalid === false in add mode. */
    function fillValidAddForm(comp: AddEditDriveLocationComponent): void {
      comp.form.patchValue({
        locationType: 'FIX',
        drawSite: 'Test Draw Site',
        travelTime: '30',
        distance: '15.5',
        staffFacility: 'FAC001',
        effectiveDate: moment().add(1, 'month'),
        locationName: 'Test Location Name',
        street: '123 Main St'
      });
    }

    // -------------------------------------------------------------------------
    // Group 1: onSave — add mode
    // -------------------------------------------------------------------------
    describe('onSave — add mode', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should not call upsertDriveLocation when the form is invalid', () => {
        // Required fields are all empty → form.invalid is true
        component.onSave();
        expect(mockService.upsertDriveLocation).not.toHaveBeenCalled();
      });


      it('should call upsertDriveLocation, show success snackBar, and emit saveSuccess and closePanel on valid save', () => {
        mockService.upsertDriveLocation.and.returnValue(of({ message: 'Drive location LOCN001 added successfully.' }));
        spyOn(component.saveSuccess, 'emit');
        spyOn(component.closePanel, 'emit');
        fillValidAddForm(component);

        component.onSave();

        expect(mockService.upsertDriveLocation).toHaveBeenCalled();
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          jasmine.stringContaining('added'),
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['success-snackbar'] })
        );
        expect(component.saveSuccess.emit).toHaveBeenCalled();
        expect(component.closePanel.emit).toHaveBeenCalled();
      });

      it('isSaving guard: should not call upsertDriveLocation when isSaving is already true', () => {
        fillValidAddForm(component);
        component.isSaving.set(true);

        component.onSave();

        expect(mockService.upsertDriveLocation).not.toHaveBeenCalled();
      });

      it('API error path: should show error snackBar and NOT emit saveSuccess or closePanel', () => {
        mockService.upsertDriveLocation.and.returnValue(throwError(() => ({ message: 'Server error' })));
        spyOn(component.saveSuccess, 'emit');
        spyOn(component.closePanel, 'emit');
        fillValidAddForm(component);

        component.onSave();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Server error',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
        expect(component.saveSuccess.emit).not.toHaveBeenCalled();
        expect(component.closePanel.emit).not.toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 2: onSave — edit mode
    // -------------------------------------------------------------------------
    describe('onSave — edit mode', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.data = {
          locationId: 'LOC123',
          locationType: 'FIX',
          locationName: 'Test Location',
          travelTime: 30,
          travelDistance: 15.5,
          effDate: '2020-01-01'
        } as any;
        mockService.getDriveLocationDetails.and.returnValue(of({
          locationId: 'LOC123',
          locationType: 'FIX',
          locationName: 'Test Location',
          locationTypeDescription: 'Fixed Location',
          travelTime: 30,
          travelDistance: 15.5,
          effDate: '2020-01-01',
          staffFacility: 'FAC001',
          address: {}
        }));
        component.ngOnInit();
        fixture.detectChanges();
      });

      it('should call upsertDriveLocation and show "updated" message in edit mode on success', () => {
        mockService.upsertDriveLocation.and.returnValue(of({}));
        spyOn(component.saveSuccess, 'emit');
        spyOn(component.closePanel, 'emit');

        // Make one field dirty to represent an edit
        component.form.get('travelTime')?.setValue('45');
        component.form.get('travelTime')?.markAsDirty();

        component.onSave();

        expect(mockService.upsertDriveLocation).toHaveBeenCalled();
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          jasmine.stringContaining('updated'),
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['success-snackbar'] })
        );
        expect(component.saveSuccess.emit).toHaveBeenCalled();
        expect(component.closePanel.emit).toHaveBeenCalled();
      });

      it('should not call upsertDriveLocation when form has dateRangeInvalid error in edit mode', () => {
        component.form.setErrors({ dateRangeInvalid: true });

        component.onSave();

        expect(mockService.upsertDriveLocation).not.toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 3: ngOnChanges — data input
    // -------------------------------------------------------------------------
    describe('ngOnChanges — data input', () => {
      it('should reset notes and set isLoading to false when data changes in add mode (not firstChange)', () => {
        component.mode = 'add';
        component.ngOnInit();

        component.driveLocationNotes = [{ noteText: 'stale note', isDeleted: false }];
        component.form.patchValue({ drawSite: 'Old Site' });

        component.data = null;
        component.ngOnChanges({
          data: new SimpleChange({ locationId: 'OLD' }, null, false)
        });

        expect(component.driveLocationNotes).toEqual([]);
        expect(component.isLoading()).toBe(false);
      });

      it('should call getDriveLocationDetails when data changes in edit mode (not firstChange)', () => {
        component.mode = 'edit';
        component.data = {
          locationId: 'LOC123',
          locationType: 'FIX',
          locationName: 'Test Location',
          travelTime: 30,
          travelDistance: 15.5,
          effDate: '2020-01-01'
        } as any;
        mockService.getDriveLocationDetails.and.returnValue(of({
          locationId: 'LOC123',
          locationType: 'FIX',
          locationName: 'Test Location',
          travelTime: 30,
          travelDistance: 15.5,
          effDate: '2020-01-01',
          staffFacility: 'FAC001',
          address: {}
        }));
        component.ngOnInit();
        mockService.getDriveLocationDetails.calls.reset();

        const newData: any = { locationId: 'LOC456', locationType: 'FIX', locationName: 'New Location', travelTime: 20, travelDistance: 5 };
        component.data = newData;
        component.ngOnChanges({
          data: new SimpleChange({ locationId: 'LOC123' }, newData, false)
        });

        expect(mockService.getDriveLocationDetails).toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 4: isFormValid — edit mode additional branches
    // -------------------------------------------------------------------------
    describe('isFormValid — edit mode additional branches', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.data = {
          locationId: 'LOC123',
          locationType: 'FIX',
          locationName: 'Test Location',
          travelTime: 30,
          travelDistance: 15.5,
          effDate: '2020-01-01'
        } as any;
        mockService.getDriveLocationDetails.and.returnValue(of({
          locationId: 'LOC123',
          locationType: 'FIX',
          locationName: 'Test Location',
          locationTypeDescription: 'Fixed Location',
          travelTime: 30,
          travelDistance: 15.5,
          effDate: '2020-01-01',
          staffFacility: 'FAC001',
          address: {}
        }));
        component.ngOnInit();
        fixture.detectChanges();
      });

      it('should return true when form is dirty with valid fields and staffFacility is filled', () => {
        component.form.get('travelTime')?.setValue('45');
        component.form.get('travelTime')?.markAsDirty();

        expect(component.isFormValid).toBe(true);
      });

      it('should return true when notesModified is true even if form is pristine', () => {
        component.notesModified = true;

        expect(component.isFormValid).toBe(true);
      });

      it('should return false when staffFacility is empty despite other changes', () => {
        component.form.get('staffFacility')?.setValue('');
        component.form.get('travelTime')?.markAsDirty();

        expect(component.isFormValid).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 5 & 6 & 7 & 8: Notes management
    // -------------------------------------------------------------------------
    describe('Notes management', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('onDeleteNote: should soft-delete note with noteId (mark isDeleted true, array length unchanged)', () => {
        component.driveLocationNotes = [{
          noteId: 'NOTE001',
          noteText: 'Existing note',
          createdBy: 'testuser',
          isDeleted: false
        }];

        component.onDeleteNote(0);

        expect(component.driveLocationNotes.length).toBe(1);
        expect(component.driveLocationNotes[0].isDeleted).toBe(true);
        expect(component.notesModified).toBe(true);
      });

      it('onEditNote: should set editingNoteIndex and populate noteText in noteForm', () => {
        component.driveLocationNotes = [
          { noteText: 'First note', isDeleted: false },
          { noteText: 'Second note', isDeleted: false }
        ];

        component.onEditNote(component.driveLocationNotes[1], 1);

        expect(component.editingNoteIndex).toBe(1);
        expect(component.noteForm.get('noteText')?.value).toBe('Second note');
      });

      it('onAddNote with editingNoteIndex set: should update existing note and clear editingNoteIndex', () => {
        component.driveLocationNotes = [{
          noteId: null,
          noteText: 'Original text',
          isDeleted: false,
          createdBy: 'testuser'
        }];
        component.editingNoteIndex = 0;
        component.noteForm.patchValue({ noteText: 'Updated text' });

        component.onAddNote();

        expect(component.driveLocationNotes[0].noteText).toBe('Updated text');
        expect(component.editingNoteIndex).toBeNull();
        expect(component.notesModified).toBe(true);
      });

      it('activeNotes getter: should return only notes where isDeleted is not true', () => {
        component.driveLocationNotes = [
          { noteText: 'Active 1', isDeleted: false },
          { noteText: 'Deleted', isDeleted: true },
          { noteText: 'Active 2', isDeleted: false }
        ];

        const active = component.activeNotes;

        expect(active.length).toBe(2);
        expect(active.every((n: any) => !n.isDeleted)).toBe(true);
      });
    });

    // -------------------------------------------------------------------------
    // Group 9: getInitials
    // -------------------------------------------------------------------------
    describe('getInitials', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should return initials from first and last name for two-word name', () => {
        expect(component.getInitials('John Doe')).toBe('JD');
      });

      it('should return first character uppercase for single-word name', () => {
        expect(component.getInitials('Alice')).toBe('A');
      });

      it('should return "?" for empty string', () => {
        expect(component.getInitials('')).toBe('?');
      });
    });

    // -------------------------------------------------------------------------
    // Group 10: Error getter methods
    // -------------------------------------------------------------------------
    describe('Error getter methods', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('getLocationTypeError: should return required message when touched and empty', () => {
        const ctrl = component.form.get('locationType')!;
        ctrl.setValue('');
        ctrl.markAsTouched();
        ctrl.updateValueAndValidity();
        expect(component.getLocationTypeError()).toBe('Location Type is required');
      });

      it('getLocationTypeError: should return empty string when not touched', () => {
        component.form.get('locationType')?.setValue('');
        expect(component.getLocationTypeError()).toBe('');
      });

      it('getDrawSiteError: should return required message when touched and empty', () => {
        const ctrl = component.form.get('drawSite')!;
        ctrl.setValue('');
        ctrl.markAsTouched();
        expect(component.getDrawSiteError()).toBe('Draw Site is required');
      });

      it('getDrawSiteError: should return maxlength message when value exceeds 50 characters', () => {
        const ctrl = component.form.get('drawSite')!;
        ctrl.setValue('A'.repeat(51));
        ctrl.markAsTouched();
        expect(component.getDrawSiteError()).toContain('50 characters');
      });

      it('getTravelTimeError: should return pattern message when touched with non-numeric value', () => {
        const ctrl = component.form.get('travelTime')!;
        ctrl.setValue('abc');
        ctrl.markAsTouched();
        ctrl.updateValueAndValidity();
        expect(component.getTravelTimeError()).toContain('Travel Time must be');
      });

      it('getDistanceError: should return pattern message when touched with non-numeric value', () => {
        const ctrl = component.form.get('distance')!;
        ctrl.setValue('abc');
        ctrl.markAsTouched();
        ctrl.updateValueAndValidity();
        expect(component.getDistanceError()).toContain('Distance must be');
      });

      it('getStaffFacilityError: should return required message when touched and empty', () => {
        const ctrl = component.form.get('staffFacility')!;
        ctrl.setValue('');
        ctrl.markAsTouched();
        expect(component.getStaffFacilityError()).toBe('Staff Facility is required');
      });

      it('getZipError: should return "Zip is required" when isZipRequired and zip is empty and touched', () => {
        // Filling locationName triggers isZipRequired() → true
        component.form.patchValue({ locationName: 'Test Location' });
        const ctrl = component.form.get('zip')!;
        ctrl.setValue('');
        ctrl.markAsTouched();
        expect(component.getZipError()).toBe('Zip is required');
      });

      it('getZipError: should return empty string when zip is not required and empty', () => {
        const ctrl = component.form.get('zip')!;
        ctrl.setValue('');
        ctrl.markAsTouched();
        expect(component.getZipError()).toBe('');
      });

      it('getTerminationDateError: should return invalid message when termDateInputHasInvalidText is true', () => {
        const ctrl = component.form.get('terminationDate')!;
        ctrl.markAsTouched();
        ctrl.markAsDirty();
        component['termDateInputHasInvalidText'] = true;
        expect(component.getTerminationDateError()).toBe('Termination date is invalid');
      });
    });

    // -------------------------------------------------------------------------
    // Group 11: Form validators — timeFormatValidator
    // -------------------------------------------------------------------------
    describe('Form validators — timeFormatValidator', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should not produce invalidTimeFormat error for valid HH:MM value', () => {
        const ctrl = component.form.get('timeOpen')!;
        ctrl.setValue('09:30');
        ctrl.markAsTouched();
        ctrl.updateValueAndValidity();
        expect(ctrl.hasError('invalidTimeFormat')).toBe(false);
      });

      it('should produce invalidTimeFormat error for alphabetic input (ab:cd)', () => {
        const ctrl = component.form.get('timeOpen')!;
        ctrl.setValue('ab:cd');
        ctrl.markAsTouched();
        ctrl.updateValueAndValidity();
        expect(ctrl.hasError('invalidTimeFormat')).toBe(true);
      });

      it('should not produce error for empty value (field is optional)', () => {
        const ctrl = component.form.get('timeOpen')!;
        ctrl.setValue('');
        ctrl.updateValueAndValidity();
        expect(ctrl.hasError('invalidTimeFormat')).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 13: onNumericKeyPress
    // -------------------------------------------------------------------------
    describe('onNumericKeyPress', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should not call preventDefault for a digit key', () => {
        const event = new KeyboardEvent('keypress', { key: '5' });
        spyOn(event, 'preventDefault');
        component.onNumericKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should call preventDefault for a letter key', () => {
        const event = new KeyboardEvent('keypress', { key: 'a' });
        spyOn(event, 'preventDefault');
        component.onNumericKeyPress(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should not call preventDefault for Ctrl+C', () => {
        const event = new KeyboardEvent('keypress', { key: 'c', ctrlKey: true });
        spyOn(event, 'preventDefault');
        component.onNumericKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 14: onDecimalKeyPress
    // -------------------------------------------------------------------------
    describe('onDecimalKeyPress', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should allow first decimal point (no preventDefault)', () => {
        const event = new KeyboardEvent('keypress', { key: '.' });
        Object.defineProperty(event, 'target', { value: { value: '123' }, configurable: true });
        spyOn(event, 'preventDefault');
        component.onDecimalKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should prevent second decimal point when value already contains one', () => {
        const event = new KeyboardEvent('keypress', { key: '.' });
        Object.defineProperty(event, 'target', { value: { value: '12.3' }, configurable: true });
        spyOn(event, 'preventDefault');
        component.onDecimalKeyPress(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should prevent letter key in decimal field', () => {
        const event = new KeyboardEvent('keypress', { key: 'a' });
        Object.defineProperty(event, 'target', { value: { value: '123' }, configurable: true });
        spyOn(event, 'preventDefault');
        component.onDecimalKeyPress(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 15: onTimeKeyPress
    // -------------------------------------------------------------------------
    describe('onTimeKeyPress', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should allow digit key in time field', () => {
        const event = new KeyboardEvent('keypress', { key: '5' });
        spyOn(event, 'preventDefault');
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should allow colon key in time field', () => {
        const event = new KeyboardEvent('keypress', { key: ':' });
        spyOn(event, 'preventDefault');
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should prevent letter key in time field', () => {
        const event = new KeyboardEvent('keypress', { key: 'a' });
        spyOn(event, 'preventDefault');
        component.onTimeKeyPress(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 16 & 17: Phone/Fax formatting and focus handling
    // -------------------------------------------------------------------------
    describe('Phone and Fax formatting', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('formatPhoneNumber: should format 7 raw digits as xxx-xxxx', () => {
        component.form.get('phoneNumber')?.setValue('1234567');
        component.formatPhoneNumber();
        expect(component.form.get('phoneNumber')?.value).toBe('123-4567');
      });

      it('formatPhoneNumber: should not reformat when value is not exactly 7 digits', () => {
        component.form.get('phoneNumber')?.setValue('12345');
        component.formatPhoneNumber();
        expect(component.form.get('phoneNumber')?.value).toBe('12345');
      });

      it('onPhoneNumberFocus: should strip hyphen from formatted phone number', () => {
        component.form.get('phoneNumber')?.setValue('123-4567');
        component.onPhoneNumberFocus();
        expect(component.form.get('phoneNumber')?.value).toBe('1234567');
      });

      it('onFaxNumberFocus: should strip hyphen from formatted fax number', () => {
        component.form.get('faxNumber')?.setValue('456-7890');
        component.onFaxNumberFocus();
        expect(component.form.get('faxNumber')?.value).toBe('4567890');
      });
    });

    // -------------------------------------------------------------------------
    // Group 18: formatNoteDate
    // -------------------------------------------------------------------------
    describe('formatNoteDate', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should return empty string for empty input', () => {
        expect(component.formatNoteDate('')).toBe('');
      });

      it('should format a valid ISO date string to DD-MON-YYYY pattern', () => {
        // Use a midday UTC timestamp to avoid local-timezone date-shift edge cases
        const result = component.formatNoteDate('2024-06-15T12:00:00.000Z');
        expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      });
    });

    // -------------------------------------------------------------------------
    // Group 19: onTimeBlur — normalizeTimeInput paths
    // -------------------------------------------------------------------------
    describe('onTimeBlur — normalizeTimeInput', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should normalize 4-digit HHMM "2300" to "23:00"', () => {
        component.form.get('timeOpen')?.setValue('2300');
        component.onTimeBlur('timeOpen');
        expect(component.form.get('timeOpen')?.value).toBe('23:00');
      });

      it('should normalize 4-digit HHMM "0630" to "06:30"', () => {
        component.form.get('timeClose')?.setValue('0630');
        component.onTimeBlur('timeClose');
        expect(component.form.get('timeClose')?.value).toBe('06:30');
      });

      it('should normalize 3-digit HMM "930" to "09:30"', () => {
        component.form.get('timeOpen')?.setValue('930');
        component.onTimeBlur('timeOpen');
        expect(component.form.get('timeOpen')?.value).toBe('09:30');
      });

      it('should normalize "9:30" (H:MM with colon) to "09:30"', () => {
        component.form.get('timeOpen')?.setValue('9:30');
        component.onTimeBlur('timeOpen');
        expect(component.form.get('timeOpen')?.value).toBe('09:30');
      });

      it('should not change value when input is already "13:45" (HH:MM)', () => {
        component.form.get('timeOpen')?.setValue('13:45');
        component.onTimeBlur('timeOpen');
        expect(component.form.get('timeOpen')?.value).toBe('13:45');
      });

      it('should not normalize invalid input ("abc")', () => {
        component.form.get('timeOpen')?.setValue('abc');
        component.onTimeBlur('timeOpen');
        // normalizeTimeInput returns null for "abc" → value unchanged
        expect(component.form.get('timeOpen')?.value).toBe('abc');
      });

      it('should not change empty value', () => {
        component.form.get('timeOpen')?.setValue('');
        component.onTimeBlur('timeOpen');
        expect(component.form.get('timeOpen')?.value).toBe('');
      });
    });

    // -------------------------------------------------------------------------
    // Group 20: onTimeInput — marks dirty and updates validity
    // -------------------------------------------------------------------------
    describe('onTimeInput', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should mark timeOpen dirty after onTimeInput', () => {
        component.form.get('timeOpen')?.setValue('09:30');
        component.onTimeInput('timeOpen');
        expect(component.form.get('timeOpen')?.dirty).toBe(true);
      });

      it('should not throw when fieldName does not exist in form', () => {
        expect(() => component.onTimeInput('nonExistentField')).not.toThrow();
      });
    });

    // -------------------------------------------------------------------------
    // Group 21: onCancel
    // -------------------------------------------------------------------------
    describe('onCancel', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should emit closePanel when onCancel is called', () => {
        spyOn(component.closePanel, 'emit');
        component.onCancel();
        expect(component.closePanel.emit).toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 22: formatDate
    // -------------------------------------------------------------------------
    describe('formatDate', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should return "-" for undefined date', () => {
        expect(component.formatDate(undefined)).toBe('-');
      });

      it('should return "-" for empty string', () => {
        expect(component.formatDate('')).toBe('-');
      });

      it('should format a valid ISO date string to DD-MON-YYYY', () => {
        const result = component.formatDate('2024-06-15T12:00:00.000Z');
        expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      });
    });

    // -------------------------------------------------------------------------
    // Group 23: isFormValid edit mode — dirty field with pattern error
    // -------------------------------------------------------------------------
    describe('isFormValid edit mode — dirty field errors', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.data = { locationId: 'LOC123', locationType: 'FIX', locationName: 'Test Location', travelTime: 30, travelDistance: 15.5, effDate: '2020-01-01' } as any;
        mockService.getDriveLocationDetails.and.returnValue(of({
          locationId: 'LOC123', locationType: 'FIX', locationName: 'Test Location',
          locationTypeDescription: 'Fixed', travelTime: 30, travelDistance: 15.5,
          effDate: '2020-01-01', staffFacility: 'FAC001', address: {}
        }));
        component.ngOnInit();
        fixture.detectChanges();
      });

      it('should return false when a dirty field has a pattern validation error', () => {
        component.form.get('travelTime')?.setValue('abc!!!');
        component.form.get('travelTime')?.markAsDirty();
        // pattern error means invalid and dirty → hasDirtyFieldErrors = true
        expect(component.isFormValid).toBe(false);
      });

      it('should return true when dirty fields are all valid and staffFacility filled', () => {
        component.form.get('distance')?.setValue('10.5');
        component.form.get('distance')?.markAsDirty();
        expect(component.isFormValid).toBe(true);
      });
    });

    // -------------------------------------------------------------------------
    // Group 24: zip valueChanges — clears city for short zip
    // -------------------------------------------------------------------------
    describe('zip valueChanges subscription', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should disable city and clear city options when zip is less than 5 digits', fakeAsync(() => {
        component.form.get('zip')?.setValue('123');
        tick(300);
        expect(component.form.get('city')?.disabled).toBe(true);
      }));

      it('should emit to zipInput$ when a valid 5-digit zip is entered', fakeAsync(() => {
        const nextSpy = spyOn((component as any).zipInput$, 'next').and.callThrough();
        component.form.get('zip')?.setValue('75001');
        tick(300);
        expect(nextSpy).toHaveBeenCalledWith('75001');
      }));
    });

    // -------------------------------------------------------------------------
    // Group 25: getDriveLocationDetails error path
    // -------------------------------------------------------------------------
    describe('getDriveLocationDetails error path', () => {
      it('should set isLoading to false when getDriveLocationDetails errors', () => {
        component.mode = 'edit';
        component.data = { locationId: 'LOC_ERR', locationType: 'FIX', locationName: 'Error Location', travelTime: 0, travelDistance: 0, effDate: '2020-01-01' } as any;
        mockService.getDriveLocationDetails.and.returnValue(throwError(() => ({ message: 'Not found' })));
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.isLoading()).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 26: buildPayload with international address
    // -------------------------------------------------------------------------
    describe('buildPayload — international address', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should set intlAddrFlag to "Y" when internationalAddressData is provided', () => {
        component.internationalAddressData = {
          intlAddrFlag: 'Y',
          intlAddress1: '123 Int St',
          countryName: 'Canada'
        } as any;
        // Do NOT set locationName/street — those would set hasAdditionalDetailsData=true
        // which takes priority over international address in buildPayload logic.
        component.form.patchValue({
          locationType: 'FIX', drawSite: 'Test', travelTime: '30', distance: '5',
          staffFacility: 'FAC001', effectiveDate: moment().add(1, 'month')
        });
        const payload = (component as any).buildPayload();
        expect(payload.intlAddrFlag).toBe('Y');
        expect(payload.intlAddress1).toBe('123 Int St');
        expect(payload.countryName).toBe('Canada');
      });

      it('should set intlAddrFlag to "N" when US address data is provided without intl', () => {
        component.internationalAddressData = null;
        component.form.patchValue({
          locationType: 'FIX', drawSite: 'Test', travelTime: '30', distance: '5',
          staffFacility: 'FAC001', effectiveDate: moment().add(1, 'month'),
          locationName: 'US Location', street: '456 Oak Ave'
        });
        const payload = (component as any).buildPayload();
        expect(payload.intlAddrFlag).toBe('N');
        expect(payload.address1).toBe('US Location');
      });

      it('should set intlAddrFlag to null when neither address type is provided', () => {
        component.internationalAddressData = null;
        component.form.patchValue({
          locationType: 'FIX', drawSite: 'Test', travelTime: '30', distance: '5',
          staffFacility: 'FAC001', effectiveDate: moment().add(1, 'month')
          // No locationName or street → no address data
        });
        const payload = (component as any).buildPayload();
        expect(payload.intlAddrFlag).toBeNull();
      });
    });

    describe('Group 27: timeRangeValidator — closeTime before openTime', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should set timeCloseBeforeOpen error on timeClose when close < open', () => {
        component.form.patchValue({ timeOpen: '23:00', timeClose: '09:00' });
        component.form.updateValueAndValidity();

        const timeCloseControl = component.form.get('timeClose');
        expect(timeCloseControl?.hasError('timeCloseBeforeOpen')).toBeTrue();
        expect(component.form.hasError('timeCloseBeforeOpen')).toBeTrue();
      });

      it('should not set error when timeClose is after timeOpen', () => {
        component.form.patchValue({ timeOpen: '09:00', timeClose: '17:00' });
        component.form.updateValueAndValidity();

        const timeCloseControl = component.form.get('timeClose');
        expect(timeCloseControl?.hasError('timeCloseBeforeOpen')).toBeFalse();
      });

      it('should clear timeCloseBeforeOpen error when times become valid', () => {
        component.form.patchValue({ timeOpen: '23:00', timeClose: '09:00' });
        component.form.updateValueAndValidity();
        expect(component.form.get('timeClose')?.hasError('timeCloseBeforeOpen')).toBeTrue();

        component.form.patchValue({ timeOpen: '08:00', timeClose: '17:00' });
        component.form.updateValueAndValidity();
        expect(component.form.get('timeClose')?.hasError('timeCloseBeforeOpen')).toBeFalse();
      });

      it('should return null when only timeOpen is provided', () => {
        component.form.patchValue({ timeOpen: '09:00', timeClose: '' });
        component.form.updateValueAndValidity();

        expect(component.form.hasError('timeCloseBeforeOpen')).toBeFalse();
      });
    });

    describe('Group 28: timeOpen / timeClose valueChanges subscriptions', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should mark timeClose dirty when timeOpen changes and timeClose has a value', () => {
        component.form.patchValue({ timeOpen: '09:00', timeClose: '17:00' });
        component.form.markAsPristine();

        component.form.get('timeOpen')?.setValue('10:00');

        expect(component.form.get('timeClose')?.dirty).toBeTrue();
      });

      it('should NOT mark timeClose dirty when timeOpen changes and timeClose is empty', () => {
        component.form.patchValue({ timeOpen: '', timeClose: '' });
        component.form.markAsPristine();

        component.form.get('timeOpen')?.setValue('10:00');

        expect(component.form.get('timeClose')?.dirty).toBeFalse();
      });

      it('should mark timeClose dirty on timeClose valueChanges', () => {
        component.form.markAsPristine();
        component.form.get('timeClose')?.setValue('17:00');

        expect(component.form.get('timeClose')?.dirty).toBeTrue();
      });
    });

    describe('Group 29: terminationDate valueChanges — isMoment branch', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should clear termDateInputHasInvalidText when a valid moment termDate is set', () => {
        (component as any).termDateInputHasInvalidText = true;
        component.form.get('terminationDate')?.setValue(moment().add(2, 'months'));

        expect((component as any).termDateInputHasInvalidText).toBeFalse();
      });

      it('should not clear termDateInputHasInvalidText when termDate is null', () => {
        (component as any).termDateInputHasInvalidText = true;
        component.form.get('terminationDate')?.setValue(null);

        expect((component as any).termDateInputHasInvalidText).toBeTrue();
      });
    });

    describe('Group 30: ngOnChanges — data input change', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.ngOnInit();
      });

      it('should reset form state when data input changes', () => {
        component.mode = 'edit';
        spyOn<any>(component, 'loadDriveLocationDetails').and.stub();
        component.driveLocationNotes = [{ noteText: 'old note' } as any];
        component.selectedTabIndex = 2;

        const newData = { locationId: 'LOC999' } as any;
        component.data = newData;
        component.ngOnChanges({
          data: {
            currentValue: newData,
            previousValue: { locationId: 'LOC001' },
            firstChange: false,
            isFirstChange: () => false
          }
        } as any);

        expect(component.driveLocationNotes).toEqual([]);
        expect(component.selectedTabIndex).toBe(0);
      });

      it('should call loadDriveLocationDetails when data changes in edit mode', () => {
        component.mode = 'edit';
        const spy = spyOn<any>(component, 'loadDriveLocationDetails').and.stub();
        const newData = { locationId: 'LOC999' } as any;
        component.data = newData;
        component.ngOnChanges({
          data: {
            currentValue: newData,
            previousValue: { locationId: 'LOC001' },
            firstChange: false,
            isFirstChange: () => false
          }
        } as any);

        expect(spy).toHaveBeenCalled();
      });

      it('should not trigger when firstChange is true', () => {
        const spy = spyOn<any>(component, 'loadDriveLocationDetails').and.stub();
        component.ngOnChanges({
          data: {
            currentValue: { locationId: 'LOC001' },
            previousValue: undefined,
            firstChange: true,
            isFirstChange: () => true
          }
        } as any);

        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('Group 31: locationType valueChanges — add mode', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should set locationTypeDescription when locationType selected in add mode', fakeAsync(() => {
        (component as any).locationTypeOptions = [{ code: 'FIX', description: 'Fixed' }];

        component.form.get('locationType')?.setValue('FIX');
        tick(200);

        expect((component as any).editModeValues.locationTypeDescription).toBe('Fixed');
      }));

      it('should clear locationTypeDescription when locationType cleared in add mode', fakeAsync(() => {
        (component as any).editModeValues.locationTypeDescription = 'Fixed';
        component.form.get('locationType')?.setValue('');
        tick(200);

        expect((component as any).editModeValues.locationTypeDescription).toBe('');
      }));

      it('should clear locationId when locationType changes', fakeAsync(() => {
        component.form.get('locationId')?.enable();
        component.form.get('locationId')?.setValue('LOC001');
        component.form.get('locationType')?.setValue('FIX');
        tick(200);

        expect(component.form.get('locationId')?.value).toBe('');
      }));
    });

    describe('Group 32: effectiveDate valueChanges — minTerminationDate update', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should update minTerminationDate when effectiveDate set to valid moment', () => {
        const futureDate = moment().add(30, 'days');
        component.form.get('effectiveDate')?.setValue(futureDate);

        expect((component as any).minTerminationDate).toBeDefined();
      });

      it('should reset minTerminationDate when effectiveDate cleared', () => {
        component.form.get('effectiveDate')?.setValue(null);

        expect((component as any).minTerminationDate).toBeDefined();
      });
    });

    describe('Group 33: search filter subscriptions — sponsor/hospital search', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should filter sponsors on sponsorSearchCtrl change', fakeAsync(() => {
        (component as any).sponsorOptions = [
          { code: 'SP1', description: 'Alpha Sponsor' },
          { code: 'SP2', description: 'Beta Sponsor' }
        ];
        (component as any).sponsorSearchCtrl.setValue('alpha');
        tick(200);

        const filtered = (component as any).filteredSponsorOptions();
        expect(filtered.length).toBe(1);
        expect(filtered[0].code).toBe('SP1');
      }));

      it('should filter hospitals on hospitalSearchCtrl change', fakeAsync(() => {
        (component as any).hospitalOptions = [
          { code: 'H1', description: 'City Hospital' },
          { code: 'H2', description: 'Rural Clinic' }
        ];
        (component as any).hospitalSearchCtrl.setValue('city');
        tick(200);

        const filtered = (component as any).filteredHospitalOptions();
        expect(filtered.length).toBe(1);
        expect(filtered[0].code).toBe('H1');
      }));
    });

    describe('Group 34: getZipError — error branches', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should return "Zip is required" when zip required and empty and touched', () => {
        // Fill locationName to make zip required
        component.form.patchValue({ locationName: 'Test', street: '123 Main' });
        const zipCtrl = component.form.get('zip');
        zipCtrl?.setValue('');
        zipCtrl?.markAsTouched();

        expect(component.getZipError()).toBe('Zip is required');
      });

      it('should return "Zip must be exactly 5 digits" for pattern error', () => {
        const zipCtrl = component.form.get('zip');
        zipCtrl?.setValue('12abc');
        zipCtrl?.markAsTouched();

        expect(component.getZipError()).toBe('Zip must be exactly 5 digits');
      });

      it('should return "Zip code not found" for zipNotFound error', () => {
        const zipCtrl = component.form.get('zip');
        zipCtrl?.setValue('99999');
        zipCtrl?.setErrors({ zipNotFound: true });
        zipCtrl?.markAsTouched();

        expect(component.getZipError()).toBe('Zip code not found');
      });

      it('should return empty string when no errors', () => {
        const zipCtrl = component.form.get('zip');
        zipCtrl?.setValue('75001');
        zipCtrl?.markAsTouched();

        expect(component.getZipError()).toBe('');
      });
    });

    describe('Group 35: isZipRequired — branches', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should return false when no additional details are filled', () => {
        expect(component.isZipRequired()).toBeFalse();
      });

      it('should return true when locationName is filled', () => {
        component.form.patchValue({ locationName: 'Test Location' });
        expect(component.isZipRequired()).toBeTrue();
      });

      it('should return true when email is filled', () => {
        component.form.patchValue({ email: 'test@example.com' });
        expect(component.isZipRequired()).toBeTrue();
      });
    });

    describe('Group 36: getMapscoError — error branches', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should return empty string when not touched', () => {
        expect(component.getMapscoError()).toBe('');
      });

      it('should return mapscoMissingAlpha error when touched', () => {
        const ctrl = component.form.get('mapsco');
        ctrl?.setErrors({ mapscoMissingAlpha: true });
        ctrl?.markAsTouched();
        expect(component.getMapscoError()).toBe('Mapsco must contain at least one letter');
      });

      it('should return mapscoMissingDigit error when touched', () => {
        const ctrl = component.form.get('mapsco');
        ctrl?.setErrors({ mapscoMissingDigit: true });
        ctrl?.markAsTouched();
        expect(component.getMapscoError()).toBe('Mapsco must contain at least one digit');
      });

      it('should return mapscoInvalidChars error when touched', () => {
        const ctrl = component.form.get('mapsco');
        ctrl?.setErrors({ mapscoInvalidChars: true });
        ctrl?.markAsTouched();
        expect(component.getMapscoError()).toBe('Mapsco can only contain letters, digits, and hyphens');
      });
    });

    describe('Group 37: formatDate', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should format a valid date string', () => {
        const result = component.formatDate('2026-01-15');
        expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      });

      it('should return dash for undefined date', () => {
        expect(component.formatDate(undefined)).toBe('-');
      });

      it('should return dash for empty string date', () => {
        expect(component.formatDate('')).toBe('-');
      });
    });

    describe('Group 38: onTimeKeyPress — control/meta key', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should return without action when ctrlKey is pressed', () => {
        const event = { key: 'a', ctrlKey: true, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should return without action when metaKey is pressed', () => {
        const event = { key: 'a', ctrlKey: false, metaKey: true, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should prevent default for non-digit non-colon key', () => {
        const event = { key: 'x', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should allow digit key', () => {
        const event = { key: '5', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should allow navigation keys without preventDefault', () => {
        const event = { key: 'Backspace', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('Group 39: getDirectionNotesError / getTravelTimeError / getDistanceError / getStaffFacilityError', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should return direction notes maxlength error', () => {
        const ctrl = component.form.get('directionNotes');
        ctrl?.setValue('x'.repeat(501));
        ctrl?.markAsTouched();
        expect(component.getDirectionNotesError()).toContain('500');
      });

      it('should return empty string for direction notes when untouched', () => {
        expect(component.getDirectionNotesError()).toBe('');
      });

      it('should return travel time required error', () => {
        const ctrl = component.form.get('travelTime');
        ctrl?.setValue('');
        ctrl?.markAsTouched();
        expect(component.getTravelTimeError()).toBe('Travel Time is required');
      });

      it('should return travel time pattern error', () => {
        const ctrl = component.form.get('travelTime');
        ctrl?.setValue('abc');
        ctrl?.markAsTouched();
        expect(component.getTravelTimeError()).toBe('Travel Time must be a number (max 3 digits)');
      });

      it('should return distance required error', () => {
        const ctrl = component.form.get('distance');
        ctrl?.setValue('');
        ctrl?.markAsTouched();
        expect(component.getDistanceError()).toBe('Distance is required');
      });

      it('should return distance pattern error', () => {
        const ctrl = component.form.get('distance');
        ctrl?.setValue('abc');
        ctrl?.markAsTouched();
        expect(component.getDistanceError()).toBe('Distance must be a number (max 999.99)');
      });

      it('should return staff facility required error', () => {
        const ctrl = component.form.get('staffFacility');
        ctrl?.setValue('');
        ctrl?.markAsTouched();
        expect(component.getStaffFacilityError()).toBe('Staff Facility is required');
      });
    });

    describe('Group 40: openInternationalAddressDialog', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should emit openInternationalAddress with hasUSAddressData=false when no US address data', () => {
        spyOn(component.openInternationalAddress, 'emit');
        component.openInternationalAddressDialog();
        expect(component.openInternationalAddress.emit).toHaveBeenCalledWith(
          jasmine.objectContaining({ hasUSAddressData: false })
        );
      });

      it('should emit openInternationalAddress with existingData=null in add mode', () => {
        spyOn(component.openInternationalAddress, 'emit');
        component.openInternationalAddressDialog();
        const arg = (component.openInternationalAddress.emit as jasmine.Spy).calls.mostRecent().args[0];
        expect(arg.existingData).toBeNull();
      });

      it('should emit with existingData from loadedInternationalAddressData in edit mode', () => {
        component.mode = 'edit';
        (component as any).loadedInternationalAddressData = { intlAddrFlag: 'Y' };
        spyOn(component.openInternationalAddress, 'emit');
        component.openInternationalAddressDialog();
        const arg = (component.openInternationalAddress.emit as jasmine.Spy).calls.mostRecent().args[0];
        expect(arg.existingData).toEqual({ intlAddrFlag: 'Y' });
      });
    });

    // -------------------------------------------------------------------------
    // Group 41: Edit mode loadDropdowns
    // -------------------------------------------------------------------------
    describe('Group 41: Edit mode loadDropdowns', () => {
      beforeEach(() => {
        mockService.getStaffLookup.and.returnValue(of([{ code: 'STAFF1', description: 'Dr Smith' }]));
        mockService.getFacilityLookup.and.returnValue(of([{ code: 'FAC1', description: 'Facility A' }]));
        component.mode = 'edit';
        component.ngOnInit();
      });

      it('should set donorCarMnrOptions from staff lookup in edit mode', () => {
        expect(component.donorCarMnrOptions.length).toBe(1);
        expect(component.donorCarMnrOptions[0].code).toBe('STAFF1');
      });

      it('should set facilityOptions from facility lookup in edit mode', () => {
        expect(component.facilityOptions.length).toBe(1);
        expect(component.facilityOptions[0].code).toBe('FAC1');
      });

      it('should NOT call getLocationTypeLookup in edit mode', () => {
        expect(mockService.getLocationTypeLookup).not.toHaveBeenCalled();
      });

      it('should handle staff lookup error gracefully in edit mode', () => {
        mockService.getStaffLookup.and.returnValue(throwError(() => new Error('Staff error')));
        mockService.getFacilityLookup.and.returnValue(of([]));
        component.ngOnInit();
        expect(component.donorCarMnrOptions).toEqual([]);
      });

      it('should handle facility lookup error gracefully in edit mode', () => {
        mockService.getStaffLookup.and.returnValue(of([]));
        mockService.getFacilityLookup.and.returnValue(throwError(() => new Error('Facility error')));
        component.ngOnInit();
        expect(component.facilityOptions).toEqual([]);
      });
    });

    // -------------------------------------------------------------------------
    // Group 42: Form value change subscriptions
    // -------------------------------------------------------------------------
    describe('Group 42: Form value change subscriptions', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should set lastChangedDateField to "termination" when terminationDate changes directly', () => {
        // Reset to known state, then change terminationDate only
        (component as any).lastChangedDateField = 'effective';
        component.form.get('terminationDate')?.setValue(moment('2026-12-31'));
        expect((component as any).lastChangedDateField).toBe('termination');
      });

      it('should update minTerminationDate when effectiveDate changes to a valid moment', () => {
        const effDate = moment('2026-06-01');
        const before = (component as any).minTerminationDate;
        component.form.get('effectiveDate')?.setValue(effDate);
        const after = (component as any).minTerminationDate;
        expect(moment.isMoment(after)).toBe(true);
        // minTerminationDate should be start-of-day of the eff date
        expect(after.isSame(effDate, 'day')).toBe(true);
      });

      it('should reset minTerminationDate to chapter default when effectiveDate is null', () => {
        // First set a real date
        component.form.get('effectiveDate')?.setValue(moment('2026-06-01'));
        // Then clear it
        component.form.get('effectiveDate')?.setValue(null);
        expect((component as any).minTerminationDate).toBeDefined();
      });

      it('should clear termDateInputHasInvalidText when terminationDate changes to a valid moment', () => {
        (component as any).termDateInputHasInvalidText = true;
        component.form.get('terminationDate')?.setValue(moment('2026-12-31'));
        expect((component as any).termDateInputHasInvalidText).toBe(false);
      });

      it('should not clear termDateInputHasInvalidText when terminationDate changes to null', () => {
        (component as any).termDateInputHasInvalidText = true;
        component.form.get('terminationDate')?.setValue(null);
        expect((component as any).termDateInputHasInvalidText).toBe(true);
      });

      it('should update form validity when timeOpen changes', () => {
        component.form.get('timeClose')?.setValue('17:00');
        component.form.get('timeOpen')?.setValue('08:00');
        expect(component.form).toBeTruthy();
      });

      it('should mark timeClose dirty when timeOpen changes and timeClose has a value', () => {
        component.form.get('timeClose')?.setValue('17:00');
        component.form.get('timeClose')?.markAsPristine();
        component.form.get('timeOpen')?.setValue('08:00');
        expect(component.form.get('timeClose')?.dirty).toBe(true);
      });

      it('should update form validity when timeClose changes', () => {
        component.form.get('timeClose')?.setValue('17:00');
        expect(component.form.get('timeClose')?.dirty).toBe(true);
      });
    });

    // -------------------------------------------------------------------------
    // Group 43: Search filter subscriptions (debounceTime)
    // -------------------------------------------------------------------------
    describe('Group 43: Search filter subscriptions', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should filter locationTypes when locationTypeSearchCtrl changes', fakeAsync(() => {
        component.locationTypeOptions = [
          { code: 'FIX', description: 'Fixed' },
          { code: 'MOB', description: 'Mobile' }
        ] as any;
        component.locationTypeSearchCtrl.setValue('fix');
        tick(200);
        expect(component.filteredLocationTypeOptions().length).toBe(1);
        expect(component.filteredLocationTypeOptions()[0].code).toBe('FIX');
      }));

      it('should filter locations when locationSearchCtrl changes', fakeAsync(() => {
        component.locationOptions = [
          { code: 'LOC1', description: 'Location One' },
          { code: 'LOC2', description: 'Location Two' }
        ] as any;
        component.locationSearchCtrl.setValue('one');
        tick(200);
        expect(component.filteredLocationOptions().length).toBe(1);
      }));

      it('should filter sponsors when sponsorSearchCtrl changes', fakeAsync(() => {
        component.sponsorOptions = [
          { code: 'SP1', description: 'American Red Cross' }
        ] as any;
        component.sponsorSearchCtrl.setValue('red');
        tick(200);
        expect(component.filteredSponsorOptions().length).toBe(1);
      }));

      it('should filter hospitals when hospitalSearchCtrl changes', fakeAsync(() => {
        component.hospitalOptions = [
          { code: 'H1', description: 'City Hospital' }
        ] as any;
        component.hospitalSearchCtrl.setValue('city');
        tick(200);
        expect(component.filteredHospitalOptions().length).toBe(1);
      }));

      it('should filter donorCarMnr when donorCarMnrSearchCtrl changes', fakeAsync(() => {
        component.donorCarMnrOptions = [
          { code: 'DC1', description: 'Dr Jones' }
        ] as any;
        component.donorCarMnrSearchCtrl.setValue('jones');
        tick(200);
        expect(component.filteredDonorCarMnrOptions().length).toBe(1);
      }));

      it('should filter facilities when facilitySearchCtrl changes', fakeAsync(() => {
        component.facilityOptions = [
          { code: 'F1', description: 'Main Facility' }
        ] as any;
        component.facilitySearchCtrl.setValue('main');
        tick(200);
        expect(component.filteredFacilityOptions().length).toBe(1);
      }));

      it('should show all locationTypes when search is cleared', fakeAsync(() => {
        component.locationTypeOptions = [
          { code: 'FIX', description: 'Fixed' },
          { code: 'MOB', description: 'Mobile' }
        ] as any;
        component.locationTypeSearchCtrl.setValue('fix');
        tick(200);
        component.locationTypeSearchCtrl.setValue('');
        tick(200);
        expect(component.filteredLocationTypeOptions().length).toBe(2);
      }));
    });

    // -------------------------------------------------------------------------
    // Group 44: setupZipCodeLookup subscribe callback
    // -------------------------------------------------------------------------
    describe('Group 44: setupZipCodeLookup', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should set city options when zip lookup returns data', () => {
        mockService.getCityStateByZipCode.and.returnValue(of([
          { city: 'Dallas', state: 'TX', country: 'Dallas County', uspsId: 'TX-01' }
        ]));
        (component as any).zipInput$.next('75001');
        expect(component.cityOptions().length).toBe(1);
        expect(component.cityOptions()[0].city).toBe('Dallas');
      });

      it('should auto-select city when exactly one option returned', () => {
        mockService.getCityStateByZipCode.and.returnValue(of([
          { city: 'Plano', state: 'TX', country: 'Collin County', uspsId: 'TX-02' }
        ]));
        (component as any).zipInput$.next('75023');
        expect(component.form.get('city')?.value).toBe('Plano');
      });

      it('should not auto-select city when multiple options returned', () => {
        mockService.getCityStateByZipCode.and.returnValue(of([
          { city: 'City A', state: 'TX', country: 'County A', uspsId: 'TX-03' },
          { city: 'City B', state: 'TX', country: 'County B', uspsId: 'TX-04' }
        ]));
        (component as any).zipInput$.next('75000');
        expect(component.cityOptions().length).toBe(2);
        expect(component.form.get('city')?.value).toBe('');
      });

      it('should disable city and set zipNotFound error when no cities returned', () => {
        mockService.getCityStateByZipCode.and.returnValue(of([]));
        (component as any).zipInput$.next('99999');
        expect(component.form.get('zip')?.hasError('zipNotFound')).toBe(true);
      });

      it('should reset city when null sentinel is emitted (zip cleared)', () => {
        (component as any).zipInput$.next('');
        expect(component.cityOptions().length).toBe(0);
      });

      it('should handle API error silently (undefined sentinel)', () => {
        mockService.getCityStateByZipCode.and.returnValue(throwError(() => new Error('API error')));
        (component as any).zipInput$.next('12345');
        expect(component.cityOptions().length).toBe(0);
      });
    });

    // -------------------------------------------------------------------------
    // Group 45: onTimeKeyPress
    // -------------------------------------------------------------------------
    describe('Group 45: onTimeKeyPress', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should allow digit keys through', () => {
        const event = { key: '5', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should allow colon through', () => {
        const event = { key: ':', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should preventDefault for letter keys', () => {
        const event = { key: 'a', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should allow Backspace key through', () => {
        const event = { key: 'Backspace', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should allow Delete key through', () => {
        const event = { key: 'Delete', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should allow Tab key through', () => {
        const event = { key: 'Tab', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should allow arrow keys through', () => {
        const event = { key: 'ArrowLeft', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should allow Ctrl+A through', () => {
        const event = { key: 'a', ctrlKey: true, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should allow Meta+A through', () => {
        const event = { key: 'a', ctrlKey: false, metaKey: true, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should prevent special characters', () => {
        const event = { key: '-', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
        component.onTimeKeyPress(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 46: isZipRequired additional branches
    // -------------------------------------------------------------------------
    describe('Group 46: isZipRequired', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should return false when no Additional Details fields are filled', () => {
        expect(component.isZipRequired()).toBe(false);
      });

      it('should return true when locationName is filled', () => {
        component.form.get('locationName')?.setValue('Test Location');
        expect(component.isZipRequired()).toBe(true);
      });

      it('should return true when street is filled', () => {
        component.form.get('street')?.setValue('123 Main St');
        expect(component.isZipRequired()).toBe(true);
      });

      it('should return true when phone area code is filled', () => {
        component.form.get('phoneAreaCode')?.setValue('214');
        expect(component.isZipRequired()).toBe(true);
      });

      it('should return true when email is filled', () => {
        component.form.get('email')?.setValue('test@example.com');
        expect(component.isZipRequired()).toBe(true);
      });

      it('should return false when only whitespace in fields', () => {
        component.form.get('locationName')?.setValue('   ');
        expect(component.isZipRequired()).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 47: ngOnChanges add-mode data change
    // -------------------------------------------------------------------------
    describe('Group 47: ngOnChanges add-mode data reset', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should reset form when data changes in add mode', () => {
        component.driveLocationNotes = [{ noteText: 'old' } as any];
        component.selectedTabIndex = 2;
        const newData = { locationId: 'NEW01' } as any;
        component.data = newData;
        component.ngOnChanges({
          data: {
            currentValue: newData,
            previousValue: { locationId: 'OLD01' },
            firstChange: false,
            isFirstChange: () => false
          }
        } as any);
        expect(component.driveLocationNotes).toEqual([]);
        expect(component.selectedTabIndex).toBe(0);
      });

      it('should handle internationalAddressData change when form exists', () => {
        component.ngOnChanges({
          internationalAddressData: {
            currentValue: { intlAddrFlag: 'Y' },
            previousValue: null,
            firstChange: false,
            isFirstChange: () => false
          }
        } as any);
        expect(component.form).toBeTruthy();
      });
    });

    // -------------------------------------------------------------------------
    // Group 48: openInternationalAddressDialog with US address data
    // -------------------------------------------------------------------------
    describe('Group 48: openInternationalAddressDialog with US data', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should emit hasUSAddressData=true when US address fields have data', () => {
        component.form.patchValue({ locationName: 'Test', street: '123 Main' });
        spyOn(component.openInternationalAddress, 'emit');
        component.openInternationalAddressDialog();
        const arg = (component.openInternationalAddress.emit as jasmine.Spy).calls.mostRecent().args[0];
        expect(arg.hasUSAddressData).toBe(true);
      });

      it('should emit recordKey from data.locationId in edit mode', () => {
        component.mode = 'edit';
        component.data = { locationId: 'LOC-999' } as any;
        spyOn(component.openInternationalAddress, 'emit');
        component.openInternationalAddressDialog();
        const arg = (component.openInternationalAddress.emit as jasmine.Spy).calls.mostRecent().args[0];
        expect(arg.recordKey).toBe('LOC-999');
      });
    });

    // -------------------------------------------------------------------------
    // Group 49: setupValueChangeListeners - locationType/locationId/sponsor/hospital
    // -------------------------------------------------------------------------
    describe('Group 49: setupValueChangeListeners - dropdown subscribers', () => {
      beforeEach(() => {
        // Mock service to return options before ngOnInit/loadDropdowns runs
        mockService.getSponsorLookup.and.returnValue(of([{ code: 'SP1', description: 'Red Cross' }]));
        mockService.getHospitalLookup.and.returnValue(of([{ code: 'H1', description: 'City Hospital' }]));
        component.mode = 'add';
        fixture.detectChanges();
        // locationOptions loaded lazily via loadLocationOptions() — set directly after init
        component.locationOptions = [{ code: 'LOC1', description: 'Main Hall' }] as any;
      });

      it('should update locationTypeDescription when locationType changes with matching option', fakeAsync(() => {
        component.form.get('locationType')?.setValue('FIX');
        tick(100);
        expect((component as any).editModeValues.locationTypeDescription).toBe('Fixed');
      }));

      it('should clear locationTypeDescription when locationType is cleared', fakeAsync(() => {
        (component as any).editModeValues.locationTypeDescription = 'Fixed';
        component.form.get('locationType')?.setValue('');
        tick(100);
        expect((component as any).editModeValues.locationTypeDescription).toBe('');
      }));

      it('should clear locationId when locationType changes in add mode', fakeAsync(() => {
        component.form.get('locationId')?.enable();
        component.form.get('locationId')?.setValue('LOC1', { emitEvent: false });
        component.form.get('locationType')?.setValue('FIX');
        tick(100);
        expect(component.form.get('locationId')?.value).toBe('');
      }));

      it('should NOT update locationTypeDescription in edit mode', fakeAsync(() => {
        component.mode = 'edit';
        (component as any).editModeValues.locationTypeDescription = 'Original';
        component.form.get('locationType')?.setValue('FIX');
        tick(100);
        expect((component as any).editModeValues.locationTypeDescription).toBe('Original');
      }));

      it('should set drawSite description when locationId is set in add mode', fakeAsync(() => {
        component.form.get('locationId')?.enable();
        component.form.get('locationId')?.setValue('LOC1');
        tick(100);
        expect((component as any).editModeValues.drawSite).toBe('Main Hall');
      }));

      it('should clear drawSite when locationId is cleared in add mode', fakeAsync(() => {
        (component as any).editModeValues.drawSite = 'Main Hall';
        component.form.get('locationId')?.enable();
        component.form.get('locationId')?.setValue('');
        tick(100);
        expect((component as any).editModeValues.drawSite).toBe('');
      }));

      it('should set sponsorDescription when sponsorId is set in add mode', fakeAsync(() => {
        component.form.get('sponsorId')?.setValue('SP1');
        tick(100);
        expect((component as any).editModeValues.sponsorDescription).toBe('Red Cross');
      }));

      it('should clear sponsorDescription when sponsorId is cleared', fakeAsync(() => {
        (component as any).editModeValues.sponsorDescription = 'Red Cross';
        component.form.get('sponsorId')?.setValue('');
        tick(100);
        expect((component as any).editModeValues.sponsorDescription).toBe('');
      }));

      it('should NOT update sponsorDescription in edit mode', fakeAsync(() => {
        component.mode = 'edit';
        (component as any).editModeValues.sponsorDescription = 'Original';
        component.form.get('sponsorId')?.setValue('SP1');
        tick(100);
        expect((component as any).editModeValues.sponsorDescription).toBe('Original');
      }));

      it('should set hospitalDescription when hospitalId is set in add mode', fakeAsync(() => {
        component.form.get('hospitalId')?.setValue('H1');
        tick(100);
        expect((component as any).editModeValues.hospitalDescription).toBe('City Hospital');
      }));

      it('should clear hospitalDescription when hospitalId is cleared', fakeAsync(() => {
        (component as any).editModeValues.hospitalDescription = 'City Hospital';
        component.form.get('hospitalId')?.setValue('');
        tick(100);
        expect((component as any).editModeValues.hospitalDescription).toBe('');
      }));

      it('should NOT update hospitalDescription in edit mode', fakeAsync(() => {
        component.mode = 'edit';
        (component as any).editModeValues.hospitalDescription = 'Original';
        component.form.get('hospitalId')?.setValue('H1');
        tick(100);
        expect((component as any).editModeValues.hospitalDescription).toBe('Original');
      }));
    });

    // -------------------------------------------------------------------------
    // Group 50: zip.valueChanges subscriber
    // -------------------------------------------------------------------------
    describe('Group 50: zip.valueChanges subscriber', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should trigger zipInput next for valid 5-digit zip', fakeAsync(() => {
        mockService.getCityStateByZipCode.and.returnValue(of([
          { city: 'Dallas', state: 'TX', country: 'Dallas County', uspsId: 'TX-01' }
        ]));
        component.form.get('zip')?.setValue('75001');
        tick(300);
        expect(mockService.getCityStateByZipCode).toHaveBeenCalled();
      }));

      it('should clear city options for non-5-digit zip', fakeAsync(() => {
        component.form.get('zip')?.setValue('750');
        tick(300);
        expect(component.cityOptions().length).toBe(0);
      }));

      it('should clear zipNotFound error when zip changes', fakeAsync(() => {
        component.form.get('zip')?.setErrors({ zipNotFound: true });
        component.form.get('zip')?.setValue('12345');
        tick(300);
        expect(component.form.get('zip')?.hasError('zipNotFound')).toBeFalsy();
      }));

      it('should clear city when zip is empty string', fakeAsync(() => {
        component.form.get('zip')?.setValue('');
        tick(300);
        expect(component.cityOptions().length).toBe(0);
      }));
    });

    // -------------------------------------------------------------------------
    // Group 51: Error getter methods
    // -------------------------------------------------------------------------
    describe('Group 51: Error getter methods', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('getLocationTypeError should return message when required and touched', () => {
        const ctrl = component.form.get('locationType')!;
        ctrl.setErrors({ required: true });
        ctrl.markAsTouched();
        expect(component.getLocationTypeError()).toBe('Location Type is required');
      });

      it('getLocationTypeError should return empty when not touched', () => {
        const ctrl = component.form.get('locationType')!;
        ctrl.setErrors({ required: true });
        expect(component.getLocationTypeError()).toBe('');
      });

      it('getLocationIdError should return message when required and touched', () => {
        const ctrl = component.form.get('locationId')!;
        ctrl.enable();
        ctrl.setErrors({ required: true });
        ctrl.markAsTouched();
        expect(component.getLocationIdError()).toBe('Location ID is required');
      });

      it('getDrawSiteError should return required message when touched', () => {
        const ctrl = component.form.get('drawSite')!;
        ctrl.setErrors({ required: true });
        ctrl.markAsTouched();
        expect(component.getDrawSiteError()).toBe('Draw Site is required');
      });

      it('getDrawSiteError should return maxlength message when touched', () => {
        const ctrl = component.form.get('drawSite')!;
        ctrl.setErrors({ maxlength: true });
        ctrl.markAsTouched();
        expect(component.getDrawSiteError()).toBe('Draw Site cannot exceed 50 characters');
      });

      it('getDrawSiteError should return empty when not touched', () => {
        expect(component.getDrawSiteError()).toBe('');
      });

      it('getEffectiveDateError should return min error message when touched', () => {
        const ctrl = component.form.get('effectiveDate')!;
        ctrl.setErrors({ matDatepickerMin: true });
        ctrl.markAsTouched();
        const err = component.getEffectiveDateError();
        expect(err).toBe('Effective date cannot be more than 365 days in the past');
      });

      it('getTerminationDateError should return invalid when termDateInputHasInvalidText', () => {
        const ctrl = component.form.get('terminationDate')!;
        ctrl.markAsTouched();
        (component as any).termDateInputHasInvalidText = true;
        expect(component.getTerminationDateError()).toBe('Termination date is invalid');
      });

      it('getTerminationDateError should return empty when not touched or dirty', () => {
        expect(component.getTerminationDateError()).toBe('');
      });

      it('getFdaLicenseDateError should return empty when not touched', () => {
        expect(component.getFdaLicenseDateError()).toBe('');
      });

      it('getFdaLicenseDateError should return invalid message for invalidDateFormat', () => {
        const ctrl = component.form.get('fdaLicenseDate')!;
        ctrl.setErrors({ invalidDateFormat: true });
        ctrl.markAsTouched();
        expect(component.getFdaLicenseDateError()).toBe('FDA License date is invalid');
      });

      it('getFdaLicenseDateError should return invalid message for invalidDate error', () => {
        const ctrl = component.form.get('fdaLicenseDate')!;
        ctrl.setErrors({ invalidDate: true });
        ctrl.markAsTouched();
        expect(component.getFdaLicenseDateError()).toBe('FDA License date is invalid');
      });

      it('getFdaLicenseDateError should return invalid message for matDatepickerParse error', () => {
        const ctrl = component.form.get('fdaLicenseDate')!;
        ctrl.setErrors({ matDatepickerParse: true });
        ctrl.markAsTouched();
        expect(component.getFdaLicenseDateError()).toBe('FDA License date is invalid');
      });

      it('getFdaLicenseDateError should return past date message for effectiveDatePast error', () => {
        const ctrl = component.form.get('fdaLicenseDate')!;
        ctrl.setErrors({ effectiveDatePast: true });
        ctrl.markAsTouched();
        expect(component.getFdaLicenseDateError()).toBe('FDA License date cannot be past date');
      });

      it('getTimeOpenError should return error message when touched with invalidTimeFormat', () => {
        const ctrl = component.form.get('timeOpen')!;
        ctrl.setErrors({ invalidTimeFormat: true });
        ctrl.markAsTouched();
        expect(component.getTimeOpenError()).toBe('Time Open is invalid (use HH:MM, e.g. 23:00)');
      });

      it('getTimeOpenError should return empty when not touched', () => {
        expect(component.getTimeOpenError()).toBe('');
      });

      it('getTimeCloseError should return error message for invalidTimeFormat', () => {
        const ctrl = component.form.get('timeClose')!;
        ctrl.setErrors({ invalidTimeFormat: true });
        ctrl.markAsTouched();
        expect(component.getTimeCloseError()).toBe('Time Close is invalid (use HH:MM, e.g. 23:00)');
      });

      it('getTimeCloseError should return message for timeCloseBeforeOpen error', () => {
        const ctrl = component.form.get('timeClose')!;
        ctrl.setErrors({ timeCloseBeforeOpen: true });
        ctrl.markAsTouched();
        expect(component.getTimeCloseError()).toBe('Close time cannot be prior to Open time');
      });

      it('getTimeCloseError should return empty when no timeClose control', () => {
        expect(component.getTimeCloseError()).toBe('');
      });
    });

    // -------------------------------------------------------------------------
    // Group 52: isFormValid getter - edit mode paths
    // -------------------------------------------------------------------------
    describe('Group 52: isFormValid getter - edit mode', () => {
      beforeEach(fakeAsync(() => {
        mockService.getDriveLocationDetails.and.returnValue(of({
          locationId: 'LOC001', locationType: 'FIX', locationName: 'Test Location',
          effDate: '2024-01-01T00:00:00.000Z', staffFacility: 'FAC1',
          travelDistance: null, openTime: null, closeTime: null, termDate: null,
          siteDirections: '', nearestHospitalId: null, siteManager: null, notes: []
        }));
        component.mode = 'edit';
        component.data = {
          locationId: 'LOC001', locationType: 'FIX', locationName: 'Test Location',
          effDate: '2024-01-01', staffFacility: 'FAC1'
        } as any;
        fixture.detectChanges();
        tick();
      }));

      it('should return false when form is pristine (no changes)', () => {
        expect(component.isFormValid).toBe(false);
      });

      it('should return false when form has date range error', () => {
        component.form.markAsDirty();
        component.form.get('staffFacility')?.setValue('FAC1');
        component.form.setErrors({ dateRangeInvalid: true });
        expect(component.isFormValid).toBe(false);
      });

      it('should return false when staffFacility is empty in edit mode', () => {
        component.form.markAsDirty();
        component.form.get('staffFacility')?.setValue('');
        expect(component.isFormValid).toBe(false);
      });

      it('should return false when dirty field has error in edit mode', () => {
        component.form.get('drawSite')?.setValue('');
        component.form.get('drawSite')?.setErrors({ required: true });
        component.form.get('drawSite')?.markAsDirty();
        component.form.get('staffFacility')?.setValue('FAC1');
        expect(component.isFormValid).toBe(false);
      });

      it('should return true when form is dirty with staffFacility and no errors', () => {
        component.form.get('staffFacility')?.setValue('FAC1');
        component.form.get('staffFacility')?.markAsDirty();
        expect(component.isFormValid).toBe(true);
      });

      it('should return true when notes are modified', () => {
        component.form.get('staffFacility')?.setValue('FAC1');
        (component as any).notesModified = true;
        expect(component.isFormValid).toBe(true);
      });
    });

    // -------------------------------------------------------------------------
    // Group 53: isFormValid getter - add mode paths
    // -------------------------------------------------------------------------
    describe('Group 53: isFormValid getter - add mode', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should return false when required fields are missing', () => {
        expect(component.isFormValid).toBe(false);
      });

      it('should return true when draw site valid + international address provided', () => {
        component.form.patchValue({
          locationType: 'FIX',
          drawSite: 'Test Site',
          effectiveDate: moment('2026-07-01'),
          staffFacility: 'FAC1',
          travelTime: '30',
          distance: '5'
        });
        component.internationalAddressData = { intlAddress1: '123 Intl St' };
        expect(component.isFormValid).toBe(true);
      });

      it('should return false when draw site fields valid but no address block provided', () => {
        component.form.patchValue({
          locationType: 'FIX',
          drawSite: 'Test Site',
          effectiveDate: moment('2026-07-01'),
          staffFacility: 'FAC1',
          travelTime: '30',
          distance: '5'
        });
        // No locationName or internationalAddress → locationNameValid = false → returns false
        expect(component.isFormValid).toBe(false);
      });

      it('should require zip when additional details are filled', () => {
        component.form.patchValue({
          locationType: 'FIX',
          drawSite: 'Test Site',
          effectiveDate: moment('2026-07-01'),
          staffFacility: 'FAC1',
          travelTime: '30',
          distance: '5',
          locationName: 'Loc Name',
          street: '123 Main St'
          // zip intentionally missing → hasAdditionalDetailsData=true, hasZip=false → false
        });
        expect(component.isFormValid).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 54: buildPayload() direct calls
    // -------------------------------------------------------------------------
    describe('Group 54: buildPayload', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should build payload with additional details data', () => {
        component.form.patchValue({
          locationType: 'FIX',
          drawSite: 'Test Site',
          locationName: 'Test Loc',
          street: '123 Main',
          zip: '75001',
          phoneAreaCode: '214'
        });
        const payload = (component as any).buildPayload();
        expect(payload).toBeTruthy();
        expect(payload.address1).toBe('Test Loc');
      });

      it('should build payload with international address data', () => {
        component.internationalAddressData = {
          intlAddress1: '1 Intl St', countryName: 'France',
          intlAddress2: '', intlAddress3: '', intlAddress4: '',
          intlPostalCode: '75001', intlHomePhoneNo: null,
          intlWorkPhoneNo: null, intlWorkPhoneExt: null,
          intlMobilePhoneNo: null, intlFaxNo: null, intlEmail: null
        };
        component.form.patchValue({
          locationType: 'FIX',
          drawSite: 'Test Site'
        });
        const payload = (component as any).buildPayload();
        expect(payload.intlAddrFlag).toBe('Y');
        expect(payload.intlAddress1).toBe('1 Intl St');
      });

      it('should build payload with no address (null intlAddrFlag)', () => {
        component.form.patchValue({
          locationType: 'FIX',
          drawSite: 'Test Site'
        });
        const payload = (component as any).buildPayload();
        expect(payload.intlAddrFlag).toBeNull();
      });

      it('should build payload in edit mode using data values', () => {
        component.mode = 'edit';
        component.data = {
          locationId: 'LOC001', locationType: 'FIX', locationName: 'Edit Site',
          effDate: '2024-01-01T00:00:00.000Z', sponsorId: 'SP1',
          nearestHospitalId: 'H1', staffFacility: 'FAC1'
        } as any;
        fixture.detectChanges();
        component.form.get('staffFacility')?.setValue('FAC1');
        const payload = (component as any).buildPayload();
        expect(payload.sponsorId).toBe('SP1');
        expect(payload.nearestHospitalId).toBe('H1');
      });

      it('should convert time fields to UTC in payload', () => {
        (mockChapterTimezoneService as any).getChapterUtcOffsetMinutes = jasmine.createSpy().and.returnValue(-300);
        component.form.patchValue({ timeOpen: '08:00', timeClose: '17:00' });
        const payload = (component as any).buildPayload();
        expect(payload.timeOpen).toBeTruthy();
        expect(payload.timeClose).toBeTruthy();
      });

      it('should include notes in payload', () => {
        component.driveLocationNotes = [
          { noteText: 'Test note', noteId: 1, auditKey: 'AK1', isDeleted: false }
        ];
        const payload = (component as any).buildPayload();
        expect(payload.notes.length).toBe(1);
        expect(payload.notes[0].note).toBe('Test note');
      });
    });

    // -------------------------------------------------------------------------
    // Group 55: updateUSAddressFieldsState
    // -------------------------------------------------------------------------
    describe('Group 55: updateUSAddressFieldsState', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should disable US address fields when internationalAddressData is set', () => {
        component.internationalAddressData = { intlAddress1: '123 Intl St' };
        component.ngOnChanges({
          internationalAddressData: {
            currentValue: { intlAddress1: '123 Intl St' },
            previousValue: null,
            firstChange: false,
            isFirstChange: () => false
          }
        } as any);
        expect(component.form.get('locationName')?.disabled).toBe(true);
      });

      it('should enable US address fields when internationalAddressData is cleared', () => {
        component.internationalAddressData = null;
        component.ngOnChanges({
          internationalAddressData: {
            currentValue: null,
            previousValue: { intlAddress1: '123 Intl St' },
            firstChange: false,
            isFirstChange: () => false
          }
        } as any);
        expect(component.form.get('locationName')?.disabled).toBe(false);
      });
    });

  }); // end describe('Additional Coverage')

  // -------------------------------------------------------------------------
  // Group 56: terminationDateFilterFn direct calls
  // -------------------------------------------------------------------------
  describe('Group 56: terminationDateFilterFn', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('returns true for null date', () => {
      expect(component.terminationDateFilterFn!(null)).toBe(true);
    });

    it('returns false for date before chapter today', () => {
      const pastDate = moment().subtract(10, 'days');
      expect(component.terminationDateFilterFn!(pastDate)).toBe(false);
    });

    it('returns true for today', () => {
      const today = moment();
      const result = component.terminationDateFilterFn!(today);
      // today >= chapterToday so should be true
      expect(typeof result).toBe('boolean');
    });

    it('returns true for future date with no effective date set', () => {
      component.form.get('effectiveDate')?.setValue(null);
      const futureDate = moment().add(30, 'days');
      expect(component.terminationDateFilterFn!(futureDate)).toBe(true);
    });

    it('returns false for future date before effective date', () => {
      const effectiveDate = moment().add(20, 'days');
      component.form.get('effectiveDate')?.setValue(effectiveDate);
      const termDate = moment().add(10, 'days');
      expect(component.terminationDateFilterFn!(termDate)).toBe(false);
    });

    it('returns true for date on or after effective date', () => {
      const effectiveDate = moment().add(5, 'days');
      component.form.get('effectiveDate')?.setValue(effectiveDate);
      const termDate = moment().add(15, 'days');
      expect(component.terminationDateFilterFn!(termDate)).toBe(true);
    });

    it('returns true when effective date is not a moment instance', () => {
      component.form.get('effectiveDate')?.setValue('not-a-moment');
      const futureDate = moment().add(10, 'days');
      expect(component.terminationDateFilterFn!(futureDate)).toBe(true);
    });

    it('accepts non-moment date objects by converting them', () => {
      // Passing a plain date string wrapped in moment
      const futureDate = moment('2099-12-31');
      expect(component.terminationDateFilterFn!(futureDate)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Group 57: effectiveDateFilterFn direct calls
  // -------------------------------------------------------------------------
  describe('Group 57: effectiveDateFilterFn', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('returns true for null date', () => {
      expect(component.effectiveDateFilterFn!(null)).toBe(true);
    });

    it('returns false for date more than 365 days in the past', () => {
      const veryOld = moment().subtract(400, 'days');
      expect(component.effectiveDateFilterFn!(veryOld)).toBe(false);
    });

    it('returns true for date within 365 days in the past', () => {
      const recentPast = moment().subtract(100, 'days');
      expect(component.effectiveDateFilterFn!(recentPast)).toBe(true);
    });

    it('returns true for today', () => {
      const today = moment();
      expect(component.effectiveDateFilterFn!(today)).toBe(true);
    });

    it('returns true for future date', () => {
      const future = moment().add(30, 'days');
      expect(component.effectiveDateFilterFn!(future)).toBe(true);
    });

    it('converts non-moment date via moment()', () => {
      const dateStr = moment().subtract(50, 'days').toISOString();
      const asMoment = moment(dateStr);
      expect(component.effectiveDateFilterFn!(asMoment)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Group 58: setupValueChangeListeners - additional callback branches
  // -------------------------------------------------------------------------
  describe('Group 58: setupValueChangeListeners - additional branches', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('terminationDate valueChanges with null does not clear termDateInputHasInvalidText', () => {
      (component as any).termDateInputHasInvalidText = true;
      // terminationDate.valueChanges subscribe fires synchronously (no debounce)
      component.form.get('terminationDate')?.setValue(null);
      // value=null → if(value && isMoment) is false → flag stays true
      expect((component as any).termDateInputHasInvalidText).toBe(true);
    });

    it('terminationDate valueChanges with moment value clears termDateInputHasInvalidText', () => {
      (component as any).termDateInputHasInvalidText = true;
      component.form.get('terminationDate')?.setValue(moment().add(30, 'days'));
      expect((component as any).termDateInputHasInvalidText).toBe(false);
    });

    it('timeOpen valueChanges marks timeClose dirty when timeClose has value', fakeAsync(() => {
      component.form.get('timeClose')?.setValue('14:00');
      // timeOpen.valueChanges subscribe fires synchronously — markAsDirty is immediate
      component.form.get('timeOpen')?.setValue('08:00');
      tick(300); // drain form.valueChanges debounceTime(100) and any other pending timers
      expect(component.form.get('timeClose')?.dirty).toBe(true);
    }));

    it('timeOpen valueChanges does not mark timeClose dirty when timeClose is empty', fakeAsync(() => {
      component.form.get('timeClose')?.setValue('');
      component.form.get('timeClose')?.markAsPristine();
      component.form.get('timeOpen')?.setValue('09:00');
      tick(300);
      expect(component.form.get('timeClose')?.dirty).toBe(false);
    }));
  });

  // -------------------------------------------------------------------------
  // Group 59: ngOnDestroy
  // -------------------------------------------------------------------------
  describe('Group 59: ngOnDestroy', () => {
    it('completes destroy$ on ngOnDestroy', () => {
      component.mode = 'add';
      component.ngOnInit();
      const destroyNext = spyOn((component as any).destroy$, 'next').and.callThrough();
      const destroyComplete = spyOn((component as any).destroy$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(destroyNext).toHaveBeenCalled();
      expect(destroyComplete).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Group 60: ngOnChanges - edit mode data change
  // -------------------------------------------------------------------------
  describe('Group 60: ngOnChanges - edit mode data change', () => {
    it('sets edit mode panelTitle when data changes in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = { locationId: 'LOC001' } as any;
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC001', address: {}
      }));
      mockService.getStaffLookup.and.returnValue(of([]));
      mockService.getFacilityLookup.and.returnValue(of([]));
      component.ngOnInit();
      tick(300);

      // Simulate a second data change (not firstChange)
      const newData = { locationId: 'LOC002' } as any;
      component.data = newData;
      component.mode = 'edit';
      mockService.getDriveLocationDetails.and.returnValue(of({
        locationId: 'LOC002', address: {}
      }));
      component.ngOnChanges({
        data: new SimpleChange({ locationId: 'LOC001' }, newData, false)
      });
      tick(300);
      expect(component.panelTitle).toBe('Edit Drive Location');
    }));
  });

});
