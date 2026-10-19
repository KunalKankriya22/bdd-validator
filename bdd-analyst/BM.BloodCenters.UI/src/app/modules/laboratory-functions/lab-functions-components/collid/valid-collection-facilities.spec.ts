import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ValidCollectionFacilitiesComponent } from './valid-collection-facilities';
import { ValidCollectionFacilitiesService } from './services/valid-collection-facilities.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MatDialog } from '@angular/material/dialog';
import { ValidCollectionFacilityDto } from './models/valid-collection-facilities.model';
import moment from 'moment';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ValidCollectionFacilitiesComponent', () => {
  let component: ValidCollectionFacilitiesComponent;
  let fixture: ComponentFixture<ValidCollectionFacilitiesComponent>;
  let facilityServiceSpy: jasmine.SpyObj<ValidCollectionFacilitiesService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockFacility: ValidCollectionFacilityDto = {
    chapterId: '1000',
    contractId: 'CONTRACT1',
    collId: 'FAC01',
    collName: 'Test Facility',
    collIdHead: 'John Doe',
    intFlag: 'N',
    collAddress1: '123 Main St',
    collAddress2: null,
    collAddress3: null,
    city: 'Test City',
    state: 'CA',
    stateCode: 'California',
    zip: '90001',
    country: null,
    intPhoneNumber: null,
    registrationNo: 'REG123',
    licenceNo: 'LIC456',
    licenceAddress1: '123 Main St',
    licenceAddress2: null,
    licenceAddress3: null,
    licenceCity: 'Test City',
    licenceState: 'CA',
    licenceZip: '90001',
    licenceCountry: 'USA',
    phoneNo: '555-1234',
    faxNo: '555-5678',
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    lastModifiedDate: '2024-05-29T10:00:00Z',
    contractType: 'ST',
    contractName: 'Standard Contract',
  };

  beforeEach(() => {

    facilityServiceSpy = jasmine.createSpyObj('ValidCollectionFacilitiesService', [
      'getValidCollectionFacilityById',
      'createValidCollectionFacility',
      'updateValidCollectionFacility',
      'getCollectionIdOptions',
      'checkCollectionIdAssociations',
      'getContractOptions',
      'getStateOptions',
      'getCountryOptions',
      'getByLicenceNo',
    ]);

    headerServiceSpy = createMockHeaderService({ chapterId: signal('1000') });
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    loginServiceSpy.getStoredUsername.and.returnValue('testuser');

    snackbarServiceSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(undefined),
    });

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'fetchChapterTimezone',
      'isChapterLocalDateAvailable',
      'getChapterLocalDate',
      'getChapterLocalDateTime',
      'convertLocalToGmt',
      'convertGmtToLocal',
    ]);
    chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));
    chapterTimezoneServiceSpy.fetchChapterTimezone.and.returnValue(of({ chapterId: '1000', chapterLocalDate: moment().format() }));

    facilityServiceSpy.getCollectionIdOptions.and.returnValue(of([]));
    facilityServiceSpy.checkCollectionIdAssociations.and.returnValue(of([]));
    facilityServiceSpy.getContractOptions.and.returnValue(of([]));
    facilityServiceSpy.getStateOptions.and.returnValue(of([]));
    facilityServiceSpy.getCountryOptions.and.returnValue(of([]));
    facilityServiceSpy.getByLicenceNo.and.returnValue(of(null));



      TestBed.configureTestingModule({
      imports: [ValidCollectionFacilitiesComponent, NoopAnimationsModule],
      providers: [
        { provide: ValidCollectionFacilitiesService, useValue: facilityServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        provideRouter([]),
      ],
    });

      loginServiceSpy.getStoredUsername.and.returnValue('testuser');


      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);


      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));


      chapterTimezoneServiceSpy.fetchChapterTimezone.and.returnValue(of({ chapterId: '1000', chapterLocalDate: moment().format() }));


      facilityServiceSpy.getCollectionIdOptions.and.returnValue(of([]));


      facilityServiceSpy.checkCollectionIdAssociations.and.returnValue(of([]));


      facilityServiceSpy.getContractOptions.and.returnValue(of([]));


      facilityServiceSpy.getStateOptions.and.returnValue(of([]));


      facilityServiceSpy.getCountryOptions.and.returnValue(of([]));


      facilityServiceSpy.getByLicenceNo.and.returnValue(of(null));


    fixture = TestBed.createComponent(ValidCollectionFacilitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should initialize search form with required fields', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('contractId')).toBeDefined();
      expect(component.searchForm.get('contractType')).toBeDefined();
      expect(component.searchForm.get('collId')).toBeDefined();
    });

    it('should initialize detail form with all sections', () => {
      expect(component.detailForm).toBeDefined();
      expect(component.detailForm.get('collName')).toBeDefined();
      expect(component.detailForm.get('international')).toBeDefined();
      expect(component.detailForm.get('registrationNo')).toBeDefined();
      expect(component.detailForm.get('effDate')).toBeDefined();
    });


  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      component.searchForm.patchValue({
        contractId: 'CONTRACT1',
        collId: 'FAC01',
      });
    });

    it('should retrieve facility on valid search', async () => {
      facilityServiceSpy.getValidCollectionFacilityById.and.returnValue(of(mockFacility));

      await component.onRetrieve();

      expect(facilityServiceSpy.getValidCollectionFacilityById).toHaveBeenCalledWith(
        '1000',
        'CONTRACT1',
        'FAC01'
      );
      expect(component['showForm']()).toBeTrue();
      expect(component['facility']()).toEqual(mockFacility);
    });




  });

  describe('Form Validation', () => {
    it('should validate required fields in detail form', () => {
      const form = component.detailForm;

      expect(form.valid).toBeFalse();

      form.patchValue({
        collName: 'Test',
        collAddress1: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '90001',
        country: 'USA',
        registrationNo: 'REG123',
        licenceNo: 'LIC456',
        licenceAddress1: '123 Main St',
        licenceCity: 'Test City',
        licenceState: 'CA',
        licenceZip: '90001',
        licenceCountry: 'USA',
        effDate: new Date(),
      });

      expect(form.valid).toBeTrue();
    });

    it('should enforce maxLength validators', () => {
      const collNameControl = component.detailForm.get('collName');
      collNameControl?.setValue('A'.repeat(101)); // Exceeds 100 char limit

      expect(collNameControl?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce 40 char maxLength on address fields', () => {
      const addressFields = [
        'collAddress1', 'collAddress2', 'collAddress3',
        'licenceAddress1', 'licenceAddress2', 'licenceAddress3',
      ];

      addressFields.forEach(field => {
        const control = component.detailForm.get(field);
        control?.setValue('A'.repeat(41));
        expect(control?.hasError('maxlength')).toBeTrue();

        control?.setValue('A'.repeat(40));
        expect(control?.hasError('maxlength')).toBeFalse();
      });
    });

    it('should validate effective date is not in past', () => {
      const effDateControl = component.detailForm.get('effDate');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      effDateControl?.setValue(yesterday);
      effDateControl?.markAsTouched();

      expect(effDateControl?.hasError('dateInPast')).toBeTrue();
    });


  });

  describe('International Mode', () => {
    it('should update validators when international is checked', () => {
      const collAddress1Control = component.detailForm.get('collAddress1');
      const countryControl = component.detailForm.get('country');

      // collAddress1 and country are always required
      expect(collAddress1Control?.hasError('required')).toBeTrue();
      expect(countryControl?.hasError('required')).toBeTrue();

      // Set international
      component.detailForm.patchValue({ international: true });
      fixture.detectChanges();

      // Still required after toggling international
      collAddress1Control?.setValue('');
      countryControl?.setValue('');

      expect(collAddress1Control?.hasError('required')).toBeTrue();
      expect(countryControl?.hasError('required')).toBeTrue();
    });

    it('should show international fields when checked', () => {
      component.detailForm.patchValue({ international: true });
      fixture.detectChanges();

      expect(component['isInternational']()).toBeTrue();
    });

    it('should not require state when international is unchecked', () => {
      const stateControl = component.detailForm.get('state');
      const licenceStateControl = component.detailForm.get('licenceState');

      // Default: international=false, state has no required validator
      stateControl?.setValue('');
      licenceStateControl?.setValue('');

      expect(stateControl?.hasError('required')).toBeFalse();
      expect(licenceStateControl?.hasError('required')).toBeFalse();
    });

    it('should make state optional when international is checked', () => {
      component.detailForm.patchValue({ international: true });
      fixture.detectChanges();

      const stateControl = component.detailForm.get('state');
      const licenceStateControl = component.detailForm.get('licenceState');

      stateControl?.setValue('');
      licenceStateControl?.setValue('');

      expect(stateControl?.hasError('required')).toBeFalse();
      expect(licenceStateControl?.hasError('required')).toBeFalse();
    });

    it('should keep state optional when international is unchecked after being checked', () => {
      // Check international (state is optional)
      component.detailForm.patchValue({ international: true });
      fixture.detectChanges();

      // Uncheck international (state remains optional — no required validator added)
      component.detailForm.patchValue({ international: false });
      fixture.detectChanges();

      const stateControl = component.detailForm.get('state');
      stateControl?.setValue('');

      expect(stateControl?.hasError('required')).toBeFalse();
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      component.searchForm.patchValue({
        contractId: 'CONTRACT1',
        collId: 'FAC01',
      });

      component.detailForm.patchValue({
        collName: 'Test Facility',
        collAddress1: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '90001',
        country: 'USA',
        registrationNo: 'REG123',
        licenceNo: 'LIC456',
        licenceAddress1: '123 Main St',
        licenceCity: 'Test City',
        licenceState: 'CA',
        licenceZip: '90001',
        licenceCountry: 'USA',
        effDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1),
      });

      facilityServiceSpy.checkCollectionIdAssociations.and.returnValue(of([]));
    });

    it('should save valid form data', fakeAsync(() => {
      component['facility'].set(mockFacility); // Existing facility
      facilityServiceSpy.updateValidCollectionFacility.and.returnValue(of({ success: true, message: 'Success', statusCode: 200 }));
      facilityServiceSpy.getValidCollectionFacilityById.and.returnValue(of(mockFacility));

      component.onSave();
      tick();

      expect(facilityServiceSpy.updateValidCollectionFacility).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should not save invalid form', fakeAsync(() => {
      component.detailForm.reset();
      component.onSave();
      tick();

      expect(facilityServiceSpy.updateValidCollectionFacility).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));


  });

  describe('Clear Functionality', () => {
    it('should clear all forms and state', () => {
      component.searchForm.patchValue({
        contractId: 'CONTRACT1',
        collId: 'FAC01',
      });
      component['showForm'].set(true);
      component['facility'].set(mockFacility);

      component.clearAll();

      expect(component['showForm']()).toBeFalse();
      expect(component['facility']()).toBeNull();
      expect(component.searchForm.get('contractId')?.value).toBeFalsy();
    });

    it('should reset saved signal on clearAll', () => {
      component['saved'].set(true);

      component.clearAll();

      expect(component['saved']()).toBeFalse();
    });

    it('should allow clearAll after save', fakeAsync(() => {
      component.searchForm.patchValue({
        contractId: 'CONTRACT1',
        collId: 'FAC01',
      });
      component['facility'].set(mockFacility);
      component['showForm'].set(true);

      component.detailForm.patchValue({
        collName: 'Test Facility',
        collAddress1: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '90001',
        country: 'USA',
        registrationNo: 'REG123',
        licenceNo: 'LIC456',
        licenceAddress1: '123 Main St',
        licenceCity: 'Test City',
        licenceState: 'CA',
        licenceZip: '90001',
        licenceCountry: 'USA',
        effDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1),
      });

      facilityServiceSpy.updateValidCollectionFacility.and.returnValue(of({ success: true, message: 'Success', statusCode: 200 }));
      facilityServiceSpy.getValidCollectionFacilityById.and.returnValue(of(mockFacility));

      component.onSave();
      tick();

      expect(component['saved']()).toBeTrue();

      // clearAll should still work after save
      component.clearAll();

      expect(component['saved']()).toBeFalse();
      expect(component['showForm']()).toBeFalse();
    }));

    it('should hide form on cancel', () => {
      component['showForm'].set(true);

      component.onCancel();

      expect(component['showForm']()).toBeFalse();
    });
  });
});
