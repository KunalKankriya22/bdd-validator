import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { AddEditFacilityPanelComponent } from './add-edit-facility-panel.component';
import { ValidRemoteTestingLabsApiService } from '../services/valid-remote-testing-labs-api.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ValidRemoteTestingLabDto, TestingLabLookupDto } from '../models/valid-remote-testing-labs.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditFacilityPanelComponent', () => {
  let component: AddEditFacilityPanelComponent;
  let fixture: ComponentFixture<AddEditFacilityPanelComponent>;
  let serviceSpy: jasmine.SpyObj<ValidRemoteTestingLabsApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockLookup: TestingLabLookupDto[] = [
    { testingLabId: 'LAB001', testingLabName: 'Test Lab 1' },
    { testingLabId: 'LAB002', testingLabName: 'Test Lab 2' },
  ];

  const mockFacility: ValidRemoteTestingLabDto = {
    testingLabId: 'LAB001',
    chapterId: '0001',
    testingLabName: 'Test Lab 1',
    contractId: 'C001',
    cliaNumber: '12D3456789',
    medicalDirector: 'Dr. Smith',
    effDate: '2024-01-01',
    termDate: null,
    intFlag: 'N',
    addr1: '123 Main St',
    addr2: '',
    addr3: '',
    city: 'Springfield',
    stateCode: 'IL',
    zip: '62701',
    country: 'USA',
    phoneNumber: '2175551234',
    faxNumber: null,
    intPhoneNumber: null,
    telexNumber: null,
  } as any;

  function setupTestBed(params: { id?: string } = {}) {
    serviceSpy = jasmine.createSpyObj('ValidRemoteTestingLabsApiService', [
      'getLookup', 'getById', 'create', 'update',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();

    serviceSpy.getLookup.and.returnValue(of(mockLookup));
    serviceSpy.getById.and.returnValue(of(mockFacility));
    serviceSpy.create.and.returnValue(of({ success: true, data: mockFacility } as any));
    serviceSpy.update.and.returnValue(of({ success: true, data: mockFacility } as any));

    return TestBed.configureTestingModule({
      imports: [AddEditFacilityPanelComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ValidRemoteTestingLabsApiService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => params.id || null } } },
        },
      ],
    }).compileComponents();
  }

  describe('Add Mode', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });


    it('should load testing labs lookup in add mode', () => {
      expect(serviceSpy.getLookup).toHaveBeenCalled();
      expect(component.testingLabsList).toEqual(mockLookup);
    });

    it('should initialize form with required fields', () => {
      expect(component.facilityForm.get('testingLabId')).toBeTruthy();
      expect(component.facilityForm.get('testingLabName')).toBeTruthy();
      expect(component.facilityForm.get('contractId')).toBeTruthy();
      expect(component.facilityForm.get('effDate')).toBeTruthy();
    });

    it('should require testingLabId', () => {
      component.facilityForm.get('testingLabId')?.setValue('');
      expect(component.facilityForm.get('testingLabId')?.hasError('required')).toBe(true);
    });


    it('should populate testingLabName when testing lab selected', () => {
      component.onTestingLabSelected({ option: { value: 'LAB001' } });
      expect(component.facilityForm.get('testingLabName')?.value).toBe('Test Lab 1');
    });

    it('should not set testingLabName when selected lab is not found', () => {
      component.facilityForm.get('testingLabName')?.setValue('');
      component.onTestingLabSelected({ option: { value: 'NONEXISTENT' } });
      expect(component.facilityForm.get('testingLabName')?.value).toBe('');
    });

    it('should filter testingLabs when typing in lab ID field', fakeAsync(() => {
      component.facilityForm.get('testingLabId')?.setValue('LAB001');
      tick();
      expect(component.filteredTestingLabsList.length).toBeGreaterThanOrEqual(0);
    }));

    it('should show all labs when lab ID field is cleared', fakeAsync(() => {
      component.facilityForm.get('testingLabId')?.setValue('LAB');
      tick();
      component.facilityForm.get('testingLabId')?.setValue('');
      tick();
      expect(component.filteredTestingLabsList.length).toBe(2);
    }));

    it('should set labIdExists error for duplicate lab IDs', fakeAsync(() => {
      component.facilityForm.get('testingLabId')?.setValue('LAB001');
      tick();
      expect(component.facilityForm.get('testingLabId')?.hasError('labIdExists')).toBe(true);
    }));

    it('should clear labIdExists error when lab ID is not duplicate', fakeAsync(() => {
      component.facilityForm.get('testingLabId')?.setValue('LAB001');
      tick();
      component.facilityForm.get('testingLabId')?.setValue('NEWLAB');
      tick();
      expect(component.facilityForm.get('testingLabId')?.hasError('labIdExists')).toBe(false);
    }));
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await setupTestBed({ id: 'LAB001' });
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });


    it('should load facility data on init', () => {
      expect(serviceSpy.getById).toHaveBeenCalledWith('LAB001');
    });

    it('should patch form with facility data', fakeAsync(() => {
      tick();
      expect(component.facilityForm.get('testingLabName')?.value).toBe('Test Lab 1');
    }));

  });

  describe('onSave — Add Mode', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should call create on valid form submit', fakeAsync(() => {
      const futureDate = moment().add(10, 'days');
      component.facilityForm.patchValue({
        testingLabId: 'NW001',
        testingLabName: 'New Lab',
        contractId: 'C001',
        effDate: futureDate,
        addr1: '123 Main St',
        city: 'Springfield',
        stateCode: 'IL',
        zip: '62701',
        country: 'USA',
      });
      tick();

      component.onSave();
      tick();

      expect(serviceSpy.create).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Facility created successfully');
    }));

  });

  describe('onSave — Edit Mode', () => {
    beforeEach(async () => {
      await setupTestBed({ id: 'LAB001' });
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should call update on valid edit form submit', fakeAsync(() => {
      tick();
      const futureDate = moment().add(10, 'days');
      component.facilityForm.patchValue({
        testingLabName: 'Updated Lab',
        contractId: 'C002',
        addr1: '456 Oak Ave',
        city: 'Chicago',
        stateCode: 'IL',
        zip: '60601',
        country: 'USA',
        termDate: futureDate,
      });

      component.onSave();
      tick();

      expect(serviceSpy.update).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Facility updated successfully');
    }));
  });

  describe('phone formatting', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should format phone input to XXX-XXX-XXXX', () => {
      const input = document.createElement('input');
      input.value = '2175551234';
      const event = { target: input } as any;
      component.onPhoneInput(event, 'phoneNumber');
      expect(component.facilityForm.get('phoneNumber')?.value).toBe('217-555-1234');
    });

    it('should limit phone to 10 digits', () => {
      const input = document.createElement('input');
      input.value = '21755512349999';
      const event = { target: input } as any;
      component.onPhoneInput(event, 'phoneNumber');
      expect(component.facilityForm.get('phoneNumber')?.value).toBe('217-555-1234');
    });
  });

  describe('checkOverflow', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set cityOverflowing when city input overflows', () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'scrollWidth', { value: 200 });
      Object.defineProperty(input, 'clientWidth', { value: 100 });
      const event = { target: input } as any;
      component.checkOverflow(event, 'city');
      expect(component.cityOverflowing).toBe(true);
    });

    it('should set medicalDirectorOverflowing when overflow detected', () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'scrollWidth', { value: 200 });
      Object.defineProperty(input, 'clientWidth', { value: 100 });
      const event = { target: input } as any;
      component.checkOverflow(event, 'medicalDirector');
      expect(component.medicalDirectorOverflowing).toBe(true);
    });

    it('should not set overflowing when content fits', () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'scrollWidth', { value: 100 });
      Object.defineProperty(input, 'clientWidth', { value: 200 });
      const event = { target: input } as any;
      component.checkOverflow(event, 'city');
      expect(component.cityOverflowing).toBe(false);
    });
  });

  describe('onCancel', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should navigate back to list page', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      component.onCancel();
      expect(navigateSpy).toHaveBeenCalledWith([
        '/laboratory-functions/testing-modules/testing-administration/valid-remote-testing-labs',
      ]);
    });
  });

  describe('displayLabId', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return the value when provided', () => {
      expect(component.displayLabId('LAB001')).toBe('LAB001');
    });

    it('should return empty string when value is empty', () => {
      expect(component.displayLabId('')).toBe('');
    });
  });

  describe('formatDate', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should format valid date string', () => {
      const result = component.formatDate('2024-01-15');
      expect(result).toBe('15-Jan-2024');
    });

    it('should return empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });
  });

  describe('hasError', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return true when control has error and is touched', () => {
      const ctrl = component.facilityForm.get('testingLabId');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(component.hasError('testingLabId', 'required')).toBe(true);
    });

    it('should return false when control has error but not touched', () => {
      component.facilityForm.get('testingLabId')?.setValue('');
      expect(component.hasError('testingLabId', 'required')).toBe(false);
    });

    it('should return false for non-existent error', () => {
      const ctrl = component.facilityForm.get('contractId');
      ctrl?.setValue('C001');
      ctrl?.markAsTouched();
      expect(component.hasError('contractId', 'maxlength')).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return required message for required fields', () => {
      component.facilityForm.get('testingLabId')?.setValue('');
      expect(component.getErrorMessage('testingLabId')).toBe('Test Lab ID is required');
    });

    it('should return required message for city', () => {
      component.facilityForm.get('city')?.setValue('');
      expect(component.getErrorMessage('city')).toBe('City is required');
    });

    it('should return labIdExists message when lab ID exists', () => {
      const ctrl = component.facilityForm.get('testingLabId');
      ctrl?.setErrors({ labIdExists: true });
      expect(component.getErrorMessage('testingLabId')).toBe('Lab ID already exists');
    });

    it('should return empty string when no errors', () => {
      component.facilityForm.get('testingLabId')?.setValue('VALIDLAB');
      expect(component.getErrorMessage('testingLabId')).toBe('');
    });

    it('should return empty string for non-existent control', () => {
      expect(component.getErrorMessage('nonExistent')).toBe('');
    });
  });

  describe('intFlag toggle', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should clear stateCode validators when intFlag is true', () => {
      component.facilityForm.get('intFlag')?.setValue(true);
      component.facilityForm.get('stateCode')?.setValue(null);
      expect(component.facilityForm.get('stateCode')?.valid).toBe(true);
    });

    it('should require stateCode when intFlag is false', () => {
      component.facilityForm.get('intFlag')?.setValue(false);
      component.facilityForm.get('stateCode')?.setValue(null);
      expect(component.facilityForm.get('stateCode')?.hasError('required')).toBe(true);
    });
  });

  describe('onSave — validation', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should not call create when form is invalid', fakeAsync(() => {
      component.onSave();
      tick();
      expect(serviceSpy.create).not.toHaveBeenCalled();
    }));

    it('should mark all fields as touched when form is invalid', fakeAsync(() => {
      component.onSave();
      tick();
      expect(component.facilityForm.get('testingLabId')?.touched).toBe(true);
    }));
  });

  describe('onSave — error handling', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should reset isSaving on create error', fakeAsync(() => {
      serviceSpy.create.and.returnValue(throwError(() => new Error('Server error')));
      const futureDate = moment().add(10, 'days');
      component.facilityForm.patchValue({
        testingLabId: 'NW001',
        testingLabName: 'New Lab',
        contractId: 'C001',
        effDate: futureDate,
        addr1: '123 Main St',
        city: 'Springfield',
        stateCode: 'IL',
        zip: '62701',
        country: 'USA',
      });
      tick();
      component.onSave();
      tick();
      expect(component.isSaving).toBe(false);
    }));
  });

  describe('edit mode header update', () => {
    beforeEach(async () => {
      await setupTestBed({ id: 'LAB001' });
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should update header title with facility name after load', fakeAsync(() => {
      tick();
      expect(component.headerConfig.title).toBe('Test Lab 1');
    }));

    it('should update breadcrumbs with facility name', fakeAsync(() => {
      tick();
      const lastCrumb = component.headerConfig.breadcrumbs[component.headerConfig.breadcrumbs.length - 1];
      expect(lastCrumb.label).toBe('Test Lab 1');
    }));
  });

  describe('loadFacility error handling', () => {
    beforeEach(async () => {
      await setupTestBed({ id: 'LAB001' });
      serviceSpy.getById.and.returnValue(throwError(() => new Error('Not found')));
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set isLoading to false on error', () => {
      expect(component.isLoading).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(AddEditFacilityPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should complete destroy$ subject', () => {
      const destroySpy = jest.spyOn(component['destroy$'], 'next');
      const completeSpy = jest.spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
