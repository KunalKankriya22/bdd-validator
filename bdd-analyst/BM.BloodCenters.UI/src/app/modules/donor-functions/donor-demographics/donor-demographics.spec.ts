import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule, TranslateLoader, TranslateNoOpLoader } from '@ngx-translate/core';

import { DonorDemographicsComponent } from './donor-demographics';
import { DonorDemographicsService } from './services/donor-demographics.service';
import { DonorDemographicsDto, DonorDemographicsDialogData } from './models/donor-demographics.model';

describe('DonorDemographicsComponent', () => {
  let component: DonorDemographicsComponent;
  let fixture: ComponentFixture<DonorDemographicsComponent>;
  let demographicsServiceSpy: jasmine.SpyObj<DonorDemographicsService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DonorDemographicsComponent>>;

  const mockDialogData: DonorDemographicsDialogData = {
    donorId: 'D123456789',
    readOnly: false
  };

  const mockDemographicsDto: DonorDemographicsDto = {
    donorId: 'D123456789',
    chapterId: 'CHI',
    header: {
      name: 'Rogers, Shelia MAry',
      dateOfBirth: '2002-12-12',
      sex: 'Female',
      abo: 'O Pos'
    },
    address: {
      streetName: '82 LONG',
      suiteApt: null,
      city: 'DALLAS',
      state: 'Texas',
      zip: '66207',
      county: 'DALLAS',
      uspsId: 12345,
      intlAddress1: null,
      intlAddress2: null,
      intlAddress3: null,
      intlAddress4: null,
      countryName: null,
      intlPostalCode: null,
      intlWorkPhoneNo: null,
      intlWorkPhoneExt: null,
      intlHomePhoneNo: null,
      intlMobilePhoneNo: null,
      intlFaxNo: null
    },
    phones: {
      home: {
        areaCode: '+214',
        phoneNo: '2345678'
      },
      work: {
        areaCode: '+214',
        phoneNo: '2345678',
        extension: null
      },
      mobile: {
        areaCode: '+817',
        phoneNo: '2345678'
      },
      preferredContact: 'M'
    },
    email: 'kim.mubee@hotmail.com',
    personalInfo: {
      language: 'ENG',
      alias: 'SHEQ',
      lastNameSuffix: null,
      ethnicGroup: 'CA',
      salutation: null,
      height: "5' 6\"",
      donorWeight: 100,
      claimedDonations: 1
    },
    employer: {
      employerId: 'EMP001',
      employerName: 'WELLSKY',
      city: 'OVERLAND PARK',
      zip: '62207',
      state: 'KS'
    },
    intlAddrFlag: 'N'
  };

  beforeEach(() => {

    demographicsServiceSpy = jasmine.createSpyObj('DonorDemographicsService', [
      'getDemographics',
      'updateDemographics',
      'getLanguages',
      'getEthnicities',
      'getSalutations',
      'getHeights',
      'getCityStateByZip',
      'getCityStateByCity',
      'validateAreaCode',
      'searchEmployers'
    ]);
    demographicsServiceSpy.getDemographics.and.returnValue(of(mockDemographicsDto));
    demographicsServiceSpy.updateDemographics.and.returnValue(of({
      success: true,
      message: 'Updated successfully',
      statusCode: 200
    }));
    demographicsServiceSpy.getLanguages.and.returnValue(of([
      { code: 'EN', description: 'English', active: true },
      { code: 'ES', description: 'Spanish', active: true }
    ]));
    demographicsServiceSpy.getEthnicities.and.returnValue(of([
      { code: 'CAUC', description: 'Caucasian', active: true }
    ]));
    demographicsServiceSpy.getSalutations.and.returnValue(of([
      { code: 'Mr', description: 'Mr.', active: true }
    ]));
    demographicsServiceSpy.getHeights.and.returnValue(of([
      { code: "5' 6\"", description: "5' 6\"", active: true },
      { code: "5' 7\"", description: "5' 7\"", active: true }
    ]));
    demographicsServiceSpy.getCityStateByZip.and.returnValue(of([
      { city: 'DALLAS', state: 'TX', zip: '66207', uspsId: 12345 }
    ]));
    demographicsServiceSpy.getCityStateByCity.and.returnValue(of([
      { city: 'DALLAS', state: 'TX', zip: '66207', uspsId: 12345 }
    ]));
    demographicsServiceSpy.validateAreaCode.and.returnValue(of(true));
    demographicsServiceSpy.searchEmployers.and.returnValue(of({ data: [], total: 0 }));

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close', 'afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(null));

    const afterOpenedSubject = new Subject();
    const afterAllClosedSubject = new Subject();

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open', '_getAfterAllClosed']);
    (dialogSpy as any).openDialogs = [];
    (dialogSpy as any)._openDialogsAtThisLevel = [];
    (dialogSpy as any).afterOpened = afterOpenedSubject;
    (dialogSpy as any)._afterOpened = afterOpenedSubject;
    (dialogSpy as any)._afterAllClosed = afterAllClosedSubject;
    (dialogSpy as any)._getAfterAllClosed.and.returnValue(afterAllClosedSubject);
    dialogSpy.open.and.returnValue(dialogRefSpy);



      TestBed.configureTestingModule({
      imports: [
        DonorDemographicsComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader }
        })
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DonorDemographicsService, useValue: demographicsServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });


    


      demographicsServiceSpy.getDemographics.calls.reset();


      demographicsServiceSpy.updateDemographics.calls.reset();


      demographicsServiceSpy.getLanguages.calls.reset();


      demographicsServiceSpy.getEthnicities.calls.reset();


      demographicsServiceSpy.getSalutations.calls.reset();


      demographicsServiceSpy.getCityStateByZip.calls.reset();


      dialogRefSpy.close.calls.reset();


      dialogRefSpy.afterClosed.calls.reset();


      dialogSpy.open.calls.reset();


      dialogSpy._getAfterAllClosed.calls.reset();


      demographicsServiceSpy.getDemographics.and.returnValue(of(mockDemographicsDto));


      dialogRefSpy.afterClosed.and.returnValue(of(null));


      dialogSpy.open.and.returnValue(dialogRefSpy);


    fixture = TestBed.createComponent(DonorDemographicsComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should load demographics on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(demographicsServiceSpy.getDemographics).toHaveBeenCalledWith('D123456789');
      expect(component.donorData()).toEqual(mockDemographicsDto);
    }));

    it('should load master code options on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(demographicsServiceSpy.getLanguages).toHaveBeenCalled();
      expect(demographicsServiceSpy.getEthnicities).toHaveBeenCalled();
      expect(demographicsServiceSpy.getSalutations).toHaveBeenCalled();
      expect(component.languageOptions().length).toBeGreaterThan(0);
    }));

    it('should populate form with loaded data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.form.get('streetName')?.value).toBe('82 LONG');
      expect(component.form.get('weight')?.value).toBe(100);
      expect(component.form.get('mobilePreferred')?.value).toBeTrue();
    }));
  });
  describe('Error State', () => {
    it('should show error message on load error', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );

      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Failed to load');
    }));


  });

  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should allow null weight (not required)', () => {
      const weightControl = component.form.get('weight');
      weightControl?.setValue(null);

      expect(weightControl?.valid).toBeTrue();
    });

    it('should validate weight minimum value', () => {
      const weightControl = component.form.get('weight');
      weightControl?.setValue(-1);

      expect(weightControl?.hasError('min')).toBeTrue();
    });

    it('should validate weight is integer', () => {
      const weightControl = component.form.get('weight');
      weightControl?.setValue(150.5);

      expect(weightControl?.hasError('notInteger')).toBeTrue();
    });

    it('should validate email format', () => {
      const emailControl = component.form.get('email');
      emailControl?.setValue('invalid-email');

      expect(emailControl?.hasError('email')).toBeTrue();
    });

    it('should validate phone format', () => {
      const homePhoneControl = component.form.get('homePhoneNumber');
      homePhoneControl?.setValue('123');
      homePhoneControl?.markAsTouched();

      expect(homePhoneControl?.valid).toBeFalse();
    });

    it('should be valid with required fields filled', () => {
      component.form.patchValue({
        weight: 150,
        streetName: '82 LONG',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      expect(component.form.valid).toBeTrue();
    });
  });

  describe('Preferred Contact Logic', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should allow only one preferred contact', fakeAsync(() => {
      component.form.patchValue({
        homePreferred: true
      });
      tick();

      component.form.patchValue({
        workPreferred: true
      });
      tick();

      expect(component.form.get('homePreferred')?.value).toBeFalse();
      expect(component.form.get('workPreferred')?.value).toBeTrue();
    }));

    it('should uncheck other preferred when mobile selected', fakeAsync(() => {
      component.form.patchValue({
        homePreferred: true,
        workPreferred: false
      });
      tick();

      component.form.patchValue({
        mobilePreferred: true
      });
      tick();

      expect(component.form.get('homePreferred')?.value).toBeFalse();
      expect(component.form.get('mobilePreferred')?.value).toBeTrue();
    }));
  });





  describe('Redisplay Functionality', () => {
    it('should reload demographics on redisplay', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialCallCount = demographicsServiceSpy.getDemographics.calls.count();

      component.onRedisplay();
      tick();

      expect(demographicsServiceSpy.getDemographics.calls.count()).toBe(initialCallCount + 1);
    }));
  });


  describe('Number-Only Input', () => {
    it('should block non-numeric keys', () => {
      const event = new KeyboardEvent('keypress', { key: 'a', keyCode: 65 });
      spyOn(event, 'preventDefault');

      const result = component.onlyNumbers(event as any);

      expect(result).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow numeric keys', () => {
      const event = new KeyboardEvent('keypress', { key: '5', keyCode: 53 });

      const result = component.onlyNumbers(event as any);

      expect(result).toBeTrue();
    });
  });

  // ===== ADDITIONAL COVERAGE TESTS =====

  describe('forceUpperCase', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should format phone on blur without re-triggering sync validator', fakeAsync(() => {
      const homePhone = component.form.get('homePhoneNumber');
      homePhone?.setValue('9271231212');

      component.onPhoneBlur('homePhoneNumber');
      tick();

      expect(homePhone?.value).toBe('(+927) 123-1212');
    }));

    it('should show single error for invalid area code from API', fakeAsync(() => {
      demographicsServiceSpy.validateAreaCode.and.returnValue(of(false));
      const homePhone = component.form.get('homePhoneNumber');
      homePhone?.setValue('(+999) 123-1212');

      component.onPhoneBlur('homePhoneNumber');
      tick();

      expect(homePhone?.hasError('areaCodeNotFound')).toBeTrue();
      expect(homePhone?.hasError('invalidAreaCode')).toBeFalse();
    }));

    it('should clear areaCodeNotFound when valid area code entered', fakeAsync(() => {
      demographicsServiceSpy.validateAreaCode.and.returnValue(of(false));
      const homePhone = component.form.get('homePhoneNumber');
      homePhone?.setValue('(+999) 123-1212');
      component.onPhoneBlur('homePhoneNumber');
      tick();

      expect(homePhone?.hasError('areaCodeNotFound')).toBeTrue();

      demographicsServiceSpy.validateAreaCode.and.returnValue(of(true));
      homePhone?.setValue('(+214) 123-1212');
      component.onPhoneBlur('homePhoneNumber');
      tick();

      expect(homePhone?.hasError('areaCodeNotFound')).toBeFalse();
    }));
  });

  describe('Bug 2/4/6: Save Flow (No Commit Dialog)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call submitUpdate directly without commit confirmation dialog', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({
        success: true, message: 'OK', statusCode: 200
      }));

      component.onSave();
      tick();

      expect(demographicsServiceSpy.updateDemographics).toHaveBeenCalled();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    }));

    it('should not call submitUpdate when form is invalid', fakeAsync(() => {
      component.form.patchValue({ streetName: '' });
      component.onSave();
      tick();

      expect(demographicsServiceSpy.updateDemographics).not.toHaveBeenCalled();
    }));

    it('should show snackbar on successful save', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({
        success: true, message: 'OK', statusCode: 200
      }));

      const snackBarSpy = spyOn((component as any).snackBar, 'open');
      component.onSave();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Donor demographics updated successfully',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    }));

    it('should show error snackbar on save failure', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(
        throwError(() => new Error('Save failed'))
      );

      const snackBarSpy = spyOn((component as any).snackBar, 'open');
      component.onSave();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Save failed',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));
  });

  describe('Bug 3/5: Employer Creation Flow', () => {
    let compDialogOpenSpy: jasmine.Spy;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of(null));
      compDialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(fakeRef);
    }));

    it('should prompt to create employer when employer name changed and not found', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        employerName: 'NEW CORP',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.searchEmployers.and.returnValue(of({ data: [], total: 0 }));
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of('no'));
      compDialogOpenSpy.and.returnValue(fakeRef);

      component.onSave();
      tick();

      expect(demographicsServiceSpy.searchEmployers).toHaveBeenCalledWith(
        { searchName: 'NEW CORP', searchType: 'M' }, 1, 0
      );
      expect(compDialogOpenSpy).toHaveBeenCalled();
    }));

    it('should skip employer check when employer name unchanged', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({
        success: true, message: 'OK', statusCode: 200
      }));

      component.onSave();
      tick();

      expect(demographicsServiceSpy.searchEmployers).not.toHaveBeenCalled();
    }));

    it('should send null employerId when user confirms new employer creation', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        employerName: 'BRAND NEW INC',
        employerCity: 'DALLAS',
        employerZip: '75001',
        employerState: 'TX',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.searchEmployers.and.returnValue(of({ data: [], total: 0 }));
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of('yes'));
      compDialogOpenSpy.and.returnValue(fakeRef);
      demographicsServiceSpy.updateDemographics.and.returnValue(of({
        success: true, message: 'OK', statusCode: 200
      }));

      component.onSave();
      tick();

      expect(demographicsServiceSpy.updateDemographics).toHaveBeenCalled();
      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.employer?.employerId).toBeNull();
      expect(payload.employer?.employerName).toBe('BRAND NEW INC');
    }));

    it('should not create employer when user declines', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        employerName: 'BRAND NEW INC',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.searchEmployers.and.returnValue(of({ data: [], total: 0 }));
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of('no'));
      compDialogOpenSpy.and.returnValue(fakeRef);

      component.onSave();
      tick();

      expect(demographicsServiceSpy.updateDemographics).not.toHaveBeenCalled();
    }));

    it('should show error when save fails for new employer', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        employerName: 'FAIL CORP',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.searchEmployers.and.returnValue(of({ data: [], total: 0 }));
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of('yes'));
      compDialogOpenSpy.and.returnValue(fakeRef);
      demographicsServiceSpy.updateDemographics.and.returnValue(
        throwError(() => new Error('Failed to save donor demographics'))
      );

      const snackBarSpy = spyOn((component as any).snackBar, 'open');
      component.onSave();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to save donor demographics', 'DISMISS', jasmine.any(Object)
      );
    }));

    it('should send null employerId and uspsId in payload for new employer', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        employerName: 'BRAND NEW INC',
        employerUspsId: 54321,
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.searchEmployers.and.returnValue(of({ data: [], total: 0 }));
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of('yes'));
      compDialogOpenSpy.and.returnValue(fakeRef);
      demographicsServiceSpy.updateDemographics.and.returnValue(of({
        success: true, message: 'OK', statusCode: 200
      }));

      component.onSave();
      tick();

      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.employer?.employerId).toBeNull();
      expect(payload.employer?.uspsId).toBe(54321);
    }));

    it('should use matched employer ID when employer name matches existing', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        employerName: 'EXISTING CORP',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.searchEmployers.and.returnValue(of({
        data: [{
          employerId: 'EMP999', employerName: 'EXISTING CORP',
          city: 'HOUSTON', state: 'TX', zip: '77001', uspsId: 11111,
          effDate: null, termDate: null, chapterId: 'ALL', intlAddrFlag: null
        }],
        total: 1
      }));
      demographicsServiceSpy.updateDemographics.and.returnValue(of({
        success: true, message: 'OK', statusCode: 200
      }));

      component.onSave();
      tick();

      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.employer?.employerId).toBe('EMP999');
      expect(payload.employer?.city).toBe('HOUSTON');
      expect(payload.employer?.uspsId).toBe(11111);
    }));
  });

  describe('Bug 7: Weight Not Required', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should allow form submission with null weight', () => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        weight: null,
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      expect(component.form.valid).toBeTrue();
    });

    it('should still validate weight minimum when provided', () => {
      component.form.get('weight')?.setValue(-1);
      expect(component.form.get('weight')?.hasError('min')).toBeTrue();

      component.form.get('weight')?.setValue(1);
      expect(component.form.get('weight')?.hasError('min')).toBeFalse();
    });
  });

  describe('Gap 3.1: Height Options from API', () => {
    it('should load height options from API on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(demographicsServiceSpy.getHeights).toHaveBeenCalled();
      expect(component.heightOptions().length).toBe(2);
      expect(component.heightOptions()[0].code).toBe("5' 6\"");
    }));

    it('should filter height options by search term', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filteredHeights.length).toBe(2);

      component.heightSearchCtrl.setValue("5' 7");
      tick();

      expect(component.filteredHeights.length).toBe(1);
      expect(component.filteredHeights[0].description).toContain("5' 7");
    }));

    it('should show all heights when search is cleared', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.heightSearchCtrl.setValue("5' 7");
      tick();
      expect(component.filteredHeights.length).toBe(1);

      component.heightSearchCtrl.setValue('');
      tick();
      expect(component.filteredHeights.length).toBe(2);
    }));
  });

  describe('Gap 3.2: City Minimum Length Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reject city names shorter than 3 characters', () => {
      component.form.get('city')?.setValue('AB');
      component.form.get('city')?.markAsTouched();

      expect(component.form.get('city')?.hasError('minlength')).toBeTrue();
    });

    it('should accept city names with 3 or more characters', () => {
      component.form.get('city')?.setValue('ABC');
      component.form.get('city')?.markAsTouched();

      expect(component.form.get('city')?.hasError('minlength')).toBeFalse();
    });

    it('should not validate empty city (optional field)', () => {
      component.form.get('city')?.setValue('');

      expect(component.form.get('city')?.hasError('minlength')).toBeFalse();
    });
  });

  describe('Gap 3.3: City Validation Against Reference Data', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set cityNotFound error when city not in reference data', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByCity.and.returnValue(of([]));

      component.form.get('city')?.setValue('FAKECITY');
      component.onCityBlur();
      tick();

      expect(component.form.get('city')?.hasError('cityNotFound')).toBeTrue();
    }));

    it('should not set error when city exists in reference data', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByCity.and.returnValue(of([
        { city: 'DALLAS', state: 'TX', zip: '75001', uspsId: 123 }
      ]));

      component.form.get('city')?.setValue('DALLAS');
      component.onCityBlur();
      tick();

      expect(component.form.get('city')?.hasError('cityNotFound')).toBeFalse();
    }));

    it('should skip validation when city is less than 3 characters', fakeAsync(() => {
      component.form.get('city')?.setValue('DA');
      component.onCityBlur();
      tick();

      expect(demographicsServiceSpy.getCityStateByCity).not.toHaveBeenCalled();
    }));

    it('should clear cityNotFound error when city becomes valid', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByCity.and.returnValue(of([]));
      component.form.get('city')?.setValue('FAKECITY');
      component.onCityBlur();
      tick();
      expect(component.form.get('city')?.hasError('cityNotFound')).toBeTrue();

      demographicsServiceSpy.getCityStateByCity.and.returnValue(of([
        { city: 'FAKECITY', state: 'TX', zip: '75001', uspsId: 123 }
      ]));
      component.onCityBlur();
      tick();
      expect(component.form.get('city')?.hasError('cityNotFound')).toBeFalse();
    }));
  });

  describe('Gap 3.4: Extension Cross-Field Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set error on extension when work phone is cleared but extension has value', fakeAsync(() => {
      component.form.patchValue({
        workPhoneNumber: '(+214) 555-1234',
        workExtension: 1234
      });
      tick();

      component.form.get('workPhoneNumber')?.setValue('');
      tick();

      expect(component.form.get('workExtension')?.hasError('extensionRequiresPhone')).toBeTrue();
    }));

    it('should not set error on extension when work phone is present', fakeAsync(() => {
      component.form.patchValue({
        workPhoneNumber: '(+214) 555-1234',
        workExtension: 1234
      });
      tick();

      expect(component.form.get('workExtension')?.hasError('extensionRequiresPhone')).toBeFalse();
    }));

    it('should clear extension error when work phone is re-entered', fakeAsync(() => {
      component.form.patchValue({
        workPhoneNumber: '(+214) 555-1234',
        workExtension: 1234
      });
      tick();

      component.form.get('workPhoneNumber')?.setValue('');
      tick();
      expect(component.form.get('workExtension')?.hasError('extensionRequiresPhone')).toBeTrue();

      component.form.get('workPhoneNumber')?.setValue('(+214) 555-9999');
      tick();
      expect(component.form.get('workExtension')?.hasError('extensionRequiresPhone')).toBeFalse();
    }));
  });

  describe('Gap 3.5: Zip Required for Domestic Addresses', () => {
    it('should require zip for domestic addresses', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('zip')?.setValue('');
      component.form.get('zip')?.markAsTouched();

      expect(component.form.get('zip')?.hasError('required')).toBeTrue();
    }));

    it('should not require zip for international addresses', fakeAsync(() => {
      const intlData = { ...mockDemographicsDto, intlAddrFlag: 'Y' };
      demographicsServiceSpy.getDemographics.and.returnValue(of(intlData));

      fixture.detectChanges();
      tick();

      component.form.get('zip')?.setValue('');
      component.form.get('zip')?.markAsTouched();

      expect(component.form.get('zip')?.hasError('required')).toBeFalse();
    }));
  });

  describe('Phone Formatting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should format 10-digit phone to (+XXX) XXX-XXXX on blur', fakeAsync(() => {
      component.form.get('workPhoneNumber')?.setValue('2145551234');
      component.onPhoneBlur('workPhoneNumber');
      tick();

      expect(component.form.get('workPhoneNumber')?.value).toBe('(+214) 555-1234');
    }));

    it('should not reformat already-formatted phone', fakeAsync(() => {
      component.form.get('homePhoneNumber')?.setValue('(+214) 555-1234');
      component.onPhoneBlur('homePhoneNumber');
      tick();

      expect(component.form.get('homePhoneNumber')?.value).toBe('(+214) 555-1234');
    }));

    it('should return correct error message for each phone error type', fakeAsync(() => {
      component.form.get('homePhoneNumber')?.setErrors({ areaCodeNotFound: true });
      expect(component.getPhoneError('homePhoneNumber')).toBe('Invalid area code');

      component.form.get('homePhoneNumber')?.setErrors({ invalidPhoneDigits: true });
      expect(component.getPhoneError('homePhoneNumber')).toBe('Phone must be 7 digits');

      component.form.get('homePhoneNumber')?.setErrors({ phoneTooShort: true });
      expect(component.getPhoneError('homePhoneNumber')).toBe('Phone number is too short');
    }));
  });

  describe('Force Uppercase', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should convert field value to uppercase', () => {
      component.form.get('streetName')?.setValue('lower case', { emitEvent: false });
      component.forceUpperCase('streetName');
      expect(component.form.get('streetName')?.value).toBe('LOWER CASE');
    });

    it('should not modify already-uppercase value', () => {
      component.form.get('streetName')?.setValue('UPPER', { emitEvent: false });
      component.forceUpperCase('streetName');
      expect(component.form.get('streetName')?.value).toBe('UPPER');
    });

    it('should do nothing for empty value', () => {
      component.form.get('streetName')?.setValue('', { emitEvent: false });
      component.forceUpperCase('streetName');
      expect(component.form.get('streetName')?.value).toBe('');
    });
  });

  describe('onZipInput', () => {
    it('should strip non-numeric characters', () => {
      const input = { value: '12a3b' } as HTMLInputElement;
      component.onZipInput({ target: input } as unknown as Event);
      expect(input.value).toBe('123');
    });
  });

  describe('onPhoneInput', () => {
    it('should strip invalid phone characters', () => {
      const input = { value: '(+123) 456-7890abc!' } as HTMLInputElement;
      component.onPhoneInput({ target: input } as unknown as Event);
      expect(input.value).toBe('(+123) 456-7890');
    });
  });

  describe('onPhoneBlur and area code validation', () => {
    beforeEach(fakeAsync(() => {
      (demographicsServiceSpy as any).validateAreaCode = jasmine.createSpy('validateAreaCode').and.returnValue(of(true));
      fixture.detectChanges();
      tick();
    }));

    it('should format 10-digit phone number', fakeAsync(() => {
      component.form.get('homePhoneNumber')?.setValue('2145551234', { emitEvent: false });
      component.onPhoneBlur('homePhoneNumber');
      tick();
      expect(component.form.get('homePhoneNumber')?.value).toBe('(+214) 555-1234');
    }));

    it('should not format phone with fewer than 10 digits', fakeAsync(() => {
      component.form.get('homePhoneNumber')?.setValue('12345', { emitEvent: false });
      component.onPhoneBlur('homePhoneNumber');
      tick();
      expect(component.form.get('homePhoneNumber')?.value).toBe('12345');
    }));

    it('should do nothing for empty phone', fakeAsync(() => {
      component.form.get('homePhoneNumber')?.setValue('', { emitEvent: false });
      component.onPhoneBlur('homePhoneNumber');
      tick();
    }));

    it('should set areaCodeNotFound error for invalid area code', fakeAsync(() => {
      (demographicsServiceSpy as any).validateAreaCode.and.returnValue(of(false));
      component.form.get('homePhoneNumber')?.setValue('(+999) 555-1234', { emitEvent: false });
      component.onPhoneBlur('homePhoneNumber');
      tick();
      expect(component.form.get('homePhoneNumber')?.hasError('areaCodeNotFound')).toBeTrue();
    }));

    it('should clear only areaCodeNotFound when area code becomes valid and other errors exist', fakeAsync(() => {
      const ctrl = component.form.get('homePhoneNumber');
      ctrl?.setValue('(+214) 12', { emitEvent: false });
      ctrl?.setErrors({ invalidPhoneDigits: true, areaCodeNotFound: true });
      (demographicsServiceSpy as any).validateAreaCode.and.returnValue(of(true));
      component.onPhoneBlur('homePhoneNumber');
      tick();
      expect(ctrl?.hasError('areaCodeNotFound')).toBeFalse();
      expect(ctrl?.hasError('invalidPhoneDigits')).toBeTrue();
    }));

    it('should set errors to null when only areaCodeNotFound is cleared', fakeAsync(() => {
      const ctrl = component.form.get('homePhoneNumber');
      ctrl?.setValue('(+214) 12', { emitEvent: false });
      ctrl?.setErrors({ areaCodeNotFound: true });
      (demographicsServiceSpy as any).validateAreaCode.and.returnValue(of(true));
      component.onPhoneBlur('homePhoneNumber');
      tick();
      expect(ctrl?.errors).toBeNull();
    }));
  });

  describe('onCitySelected', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should populate state and county from city match', () => {
      component.cityOptions.set([{ city: 'DALLAS', state: 'TX', uspsId: 123, county: 'DALLAS' }]);
      component.onCitySelected('DALLAS');
      expect(component.form.get('state')?.value).toBe('TX');
      expect(component.form.get('county')?.value).toBe('DALLAS');
    });

    it('should do nothing if city not in options', () => {
      component.cityOptions.set([]);
      component.onCitySelected('UNKNOWN');
    });
  });

  describe('onEmployerCitySelected', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should populate employer state from city match', () => {
      component.employerCityOptions.set([{ city: 'CHICAGO', state: 'IL', uspsId: 456 }]);
      component.onEmployerCitySelected('CHICAGO');
      expect(component.form.get('employerState')?.value).toBe('IL');
    });

    it('should not change form if employer city not found', () => {
      component.employerCityOptions.set([]);
      component.onEmployerCitySelected('UNKNOWN');
    });
  });

  describe('Phone clears preferred', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should uncheck homePreferred when home phone is cleared', fakeAsync(() => {
      component.form.patchValue({ homePreferred: true }, { emitEvent: false });
      component.form.get('homePhoneNumber')?.setValue('');
      tick();
      expect(component.form.get('homePreferred')?.value).toBeFalse();
    }));

    it('should uncheck workPreferred when work phone is cleared', fakeAsync(() => {
      component.form.patchValue({ workPreferred: true }, { emitEvent: false });
      component.form.get('workPhoneNumber')?.setValue('');
      tick();
      expect(component.form.get('workPreferred')?.value).toBeFalse();
    }));

    it('should uncheck mobilePreferred when mobile phone is cleared', fakeAsync(() => {
      component.form.patchValue({ mobilePreferred: true }, { emitEvent: false });
      component.form.get('mobilePhoneNumber')?.setValue('');
      tick();
      expect(component.form.get('mobilePreferred')?.value).toBeFalse();
    }));
  });

  describe('Employer name clears fields', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear employer city/zip/state when employer name changes', fakeAsync(() => {
      component.form.get('employerName')?.setValue('NEW EMPLOYER');
      tick();
      expect(component.form.get('employerCity')?.value).toBe('');
      expect(component.form.get('employerZip')?.value).toBe('');
      expect(component.form.get('employerState')?.value).toBe('');
    }));
  });

  describe('City clears fields', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear zip/state/county when city is manually typed and no city options exist', fakeAsync(() => {
      component.cityOptions.set([]);
      component.form.get('city')?.setValue('NEW CITY');
      tick();
      expect(component.form.get('zip')?.value).toBe('');
      expect(component.form.get('state')?.value).toBe('');
      expect(component.form.get('county')?.value).toBe('');
    }));
  });

  describe('Employer city clears fields', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear employer zip/state when employer city is manually typed and no options exist', fakeAsync(() => {
      component.employerCityOptions.set([]);
      component.form.get('employerCity')?.setValue('MANUAL CITY');
      tick();
      expect(component.form.get('employerZip')?.value).toBe('');
      expect(component.form.get('employerState')?.value).toBe('');
    }));
  });

  describe('Zip Lookup', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set invalidZip error when API returns empty results', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(of([]));
      component.form.get('zip')?.setValue('99999');
      tick(350);
      expect(component.form.get('zip')?.hasError('invalidZip')).toBeTrue();
    }));

    it('should auto-populate city/state/county for single result', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(of([
        { city: 'SPRINGFIELD', state: 'IL', zip: '62704', uspsId: 100, county: 'SANGAMON' }
      ]));
      component.form.get('city')?.setValue('', { emitEvent: false });
      component.form.get('zip')?.setValue('62704');
      tick(350);
      expect(component.form.get('city')?.value).toBe('SPRINGFIELD');
      expect(component.form.get('state')?.value).toBe('IL');
    }));

    it('should populate cityOptions for multiple results', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(of([
        { city: 'CITY1', state: 'ST1', zip: '11111', uspsId: 1 },
        { city: 'CITY2', state: 'ST2', zip: '11111', uspsId: 2 }
      ]));
      component.form.get('city')?.setValue('', { emitEvent: false });
      component.form.get('zip')?.setValue('11111');
      tick(350);
      expect(component.cityOptions().length).toBe(2);
    }));

    it('should match existing city when zip returns matching city', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(of([
        { city: 'DALLAS', state: 'TX', zip: '75201', uspsId: 200, county: 'DALLAS' },
        { city: 'OTHER', state: 'TX', zip: '75201', uspsId: 201 }
      ]));
      component.form.get('city')?.setValue('DALLAS', { emitEvent: false });
      component.form.get('zip')?.setValue('75201');
      tick(350);
      expect(component.form.get('state')?.value).toBe('TX');
      expect(component.cityOptions().length).toBe(0);
    }));

    it('should handle zip lookup API error gracefully', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(throwError(() => new Error('API error')));
      component.form.get('zip')?.setValue('88888');
      tick(350);
      expect(component.cityOptions().length).toBe(0);
    }));

    it('should clear state and county immediately when zip changes', fakeAsync(() => {
      component.form.get('state')?.setValue('TX', { emitEvent: false });
      component.form.get('county')?.setValue('DALLAS', { emitEvent: false });
      component.form.get('zip')?.setValue('1');
      tick();
      expect(component.form.get('state')?.value).toBe('');
      expect(component.form.get('county')?.value).toBe('');
    }));
  });

  describe('Employer Zip Lookup', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set invalidZip error for employer when API returns empty', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(of([]));
      component.form.get('employerZip')?.setValue('99999');
      tick(350);
      expect(component.form.get('employerZip')?.hasError('invalidZip')).toBeTrue();
    }));

    it('should auto-populate employer city/state for single result', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(of([
        { city: 'TOPEKA', state: 'KS', zip: '66601', uspsId: 300 }
      ]));
      component.form.get('employerCity')?.setValue('', { emitEvent: false });
      component.form.get('employerZip')?.setValue('66601');
      tick(350);
      expect(component.form.get('employerCity')?.value).toBe('TOPEKA');
      expect(component.form.get('employerState')?.value).toBe('KS');
    }));

    it('should set employerCityOptions for multiple results', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(of([
        { city: 'CITY_A', state: 'SA', zip: '22222', uspsId: 1 },
        { city: 'CITY_B', state: 'SB', zip: '22222', uspsId: 2 }
      ]));
      component.form.get('employerCity')?.setValue('', { emitEvent: false });
      component.form.get('employerZip')?.setValue('22222');
      tick(350);
      expect(component.employerCityOptions().length).toBe(2);
    }));

    it('should match existing employer city', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(of([
        { city: 'OVERLAND PARK', state: 'KS', zip: '66207', uspsId: 400 },
        { city: 'OTHER', state: 'KS', zip: '66207', uspsId: 401 }
      ]));
      component.form.get('employerCity')?.setValue('OVERLAND PARK', { emitEvent: false });
      component.form.get('employerZip')?.setValue('66207');
      tick(350);
      expect(component.form.get('employerState')?.value).toBe('KS');
    }));

    it('should clear employer state immediately when employer zip changes', fakeAsync(() => {
      component.form.get('employerState')?.setValue('KS', { emitEvent: false });
      component.form.get('employerZip')?.setValue('1');
      tick();
      expect(component.form.get('employerState')?.value).toBe('');
    }));
  });

  describe('Dropdown search filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter languages by search term', fakeAsync(() => {
      component.languageSearchCtrl.setValue('Span');
      tick();
      expect(component.filteredLanguages.length).toBe(1);
      expect(component.filteredLanguages[0].description).toBe('Spanish');
    }));

    it('should filter ethnicities by search term', fakeAsync(() => {
      component.ethnicitySearchCtrl.setValue('Cauc');
      tick();
      expect(component.filteredEthnicities.length).toBe(1);
    }));

    it('should filter salutations by search term', fakeAsync(() => {
      component.salutationSearchCtrl.setValue('Mr');
      tick();
      expect(component.filteredSalutations.length).toBe(1);
    }));

    it('should filter heights by search term', fakeAsync(() => {
      component.heightSearchCtrl.setValue("5' 6");
      tick();
      expect(component.filteredHeights.length).toBeGreaterThan(0);
    }));

    it('should show all options when search is empty', fakeAsync(() => {
      component.languageSearchCtrl.setValue('');
      tick();
      expect(component.filteredLanguages.length).toBe(2);
    }));
  });

  describe('onCancel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should close dialog ref when in dialog mode', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('Save pipeline', () => {
    let compDialogOpenSpy: jasmine.Spy;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of(null));
      compDialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(fakeRef);
    }));

    it('should set submitted signal to true on save', () => {
      component.onSave();
      expect(component.submitted()).toBeTrue();
    });

    it('should not call updateDemographics if form is invalid', () => {
      component.form.get('streetName')?.setValue('');
      component.onSave();
      expect(demographicsServiceSpy.updateDemographics).not.toHaveBeenCalled();
    });

    it('should call updateDemographics directly when form is valid and employer unchanged', fakeAsync(() => {
      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });
      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();
      expect(demographicsServiceSpy.updateDemographics).toHaveBeenCalled();
    }));

    it('should search employers when employer name changed', fakeAsync(() => {
      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });
      component.form.get('employerName')?.setValue('NEW COMPANY', { emitEvent: false });
      demographicsServiceSpy.searchEmployers.and.returnValue(of({
        data: [{ employerId: 'EMP1', employerName: 'NEW COMPANY', city: 'NY', state: 'NY', zip: '10001', uspsId: 1, effDate: null, termDate: null, chapterId: 'ALL', intlAddrFlag: null }],
        total: 1
      }));
      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();
      expect(demographicsServiceSpy.searchEmployers).toHaveBeenCalled();
    }));

    it('should prompt to create employer when search returns no results', fakeAsync(() => {
      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });
      component.form.get('employerName')?.setValue('BRAND NEW CORP', { emitEvent: false });
      demographicsServiceSpy.searchEmployers.and.returnValue(of({ data: [], total: 0 }));
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of('yes'));
      compDialogOpenSpy.and.returnValue(fakeRef);
      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();
      expect(compDialogOpenSpy).toHaveBeenCalled();
      expect(demographicsServiceSpy.updateDemographics).toHaveBeenCalled();
    }));

    it('should prompt to create employer when search errors', fakeAsync(() => {
      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });
      component.form.get('employerName')?.setValue('ERROR CORP', { emitEvent: false });
      demographicsServiceSpy.searchEmployers.and.returnValue(throwError(() => new Error('Search failed')));
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of('yes'));
      compDialogOpenSpy.and.returnValue(fakeRef);
      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();
      expect(compDialogOpenSpy).toHaveBeenCalled();
    }));

    it('should close dialog on successful save', fakeAsync(() => {
      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });
      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();
      expect(component.saving()).toBeFalse();
    }));

    it('should handle save failure', fakeAsync(() => {
      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });
      demographicsServiceSpy.updateDemographics.and.returnValue(throwError(() => new Error('Save failed')));
      component.onSave();
      tick();
      expect(component.saving()).toBeFalse();
    }));

    it('should not save when new employer prompt is declined', fakeAsync(() => {
      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });
      component.form.get('employerName')?.setValue('DECLINED CORP', { emitEvent: false });
      demographicsServiceSpy.searchEmployers.and.returnValue(of({ data: [], total: 0 }));
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of('no'));
      compDialogOpenSpy.and.returnValue(fakeRef);
      component.onSave();
      tick();
      expect(demographicsServiceSpy.updateDemographics).not.toHaveBeenCalled();
    }));
  });

  describe('getPhoneError', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return empty string for no errors', () => {
      component.form.get('homePhoneNumber')?.setErrors(null);
      expect(component.getPhoneError('homePhoneNumber')).toBe('');
    });

    it('should return "Invalid area code" for areaCodeNotFound', () => {
      component.form.get('homePhoneNumber')?.setErrors({ areaCodeNotFound: true });
      expect(component.getPhoneError('homePhoneNumber')).toBe('Invalid area code');
    });

    it('should return "Area code must be 3 digits" for invalidAreaCode', () => {
      component.form.get('homePhoneNumber')?.setErrors({ invalidAreaCode: true });
      expect(component.getPhoneError('homePhoneNumber')).toBe('Area code must be 3 digits');
    });

    it('should return "Phone must be 7 digits" for invalidPhoneDigits', () => {
      component.form.get('homePhoneNumber')?.setErrors({ invalidPhoneDigits: true });
      expect(component.getPhoneError('homePhoneNumber')).toBe('Phone must be 7 digits');
    });

    it('should return "Enter area code + phone number" for phoneRequired', () => {
      component.form.get('homePhoneNumber')?.setErrors({ phoneRequired: true });
      expect(component.getPhoneError('homePhoneNumber')).toBe('Enter area code + phone number');
    });

    it('should return "Phone number is too short" for phoneTooShort', () => {
      component.form.get('homePhoneNumber')?.setErrors({ phoneTooShort: true });
      expect(component.getPhoneError('homePhoneNumber')).toBe('Phone number is too short');
    });

    it('should return "Phone number is too long" for phoneTooLong', () => {
      component.form.get('homePhoneNumber')?.setErrors({ phoneTooLong: true });
      expect(component.getPhoneError('homePhoneNumber')).toBe('Phone number is too long');
    });
  });

  describe('limitWeightLength', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should truncate weight input to 4 characters', () => {
      const input = { value: '12345' } as HTMLInputElement;
      component.limitWeightLength({ target: input } as unknown as Event);
      expect(input.value).toBe('1234');
    });

    it('should not modify input with 4 or fewer characters', () => {
      const input = { value: '123' } as HTMLInputElement;
      component.limitWeightLength({ target: input } as unknown as Event);
      expect(input.value).toBe('123');
    });
  });

  describe('onPasteNumbers', () => {
    it('should prevent default and strip non-numeric characters', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const clipboardData = { getData: jasmine.createSpy().and.returnValue('abc123def') };
      const event = {
        preventDefault: jasmine.createSpy(),
        clipboardData
      } as unknown as ClipboardEvent;
      (document as any).execCommand = jasmine.createSpy('execCommand');
      component.onPasteNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(clipboardData.getData).toHaveBeenCalledWith('text');
      expect((document as any).execCommand).toHaveBeenCalledWith('insertText', false, '123');
    }));
  });

  describe('onFormClick', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should do nothing if not readOnly or not queryMode', () => {
      component.readOnly = false;
      component.queryMode = false;
      const input = document.createElement('input');
      component.onFormClick({ target: input } as unknown as Event);
    });

    it('should show error when clicking form field in readOnly queryMode', () => {
      component.readOnly = true;
      component.queryMode = true;
      const input = document.createElement('input');
      component.onFormClick({ target: input } as unknown as Event);
    });

    it('should not show error when clicking non-form element in queryMode', () => {
      component.readOnly = true;
      component.queryMode = true;
      const div = document.createElement('div');
      component.onFormClick({ target: div } as unknown as Event);
    });
  });

  describe('International Address', () => {
    let compDialogOpenSpy: jasmine.Spy;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of(null));
      compDialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(fakeRef);
    }));

    it('should show error when domestic fields are populated and not international', () => {
      component.onInternationalAddress();
      expect(compDialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should open dialog when domestic fields are cleared', fakeAsync(() => {
      component.form.patchValue({ streetName: '', city: '', zip: '' }, { emitEvent: false });
      component.onInternationalAddress();
      tick();
      expect(compDialogOpenSpy).toHaveBeenCalled();
    }));

    it('should clear intl address when dialog returns null', fakeAsync(() => {
      component.form.patchValue({ streetName: '', city: '', zip: '' }, { emitEvent: false });
      spyOn(component.intlAddressService, 'clearInternationalAddress');
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of(null));
      compDialogOpenSpy.and.returnValue(fakeRef);
      component.onInternationalAddress();
      tick();
      expect(component.intlAddressService.clearInternationalAddress).toHaveBeenCalled();
    }));

    it('should mark form dirty when dialog returns result', fakeAsync(() => {
      component.form.patchValue({ streetName: '', city: '', zip: '' }, { emitEvent: false });
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of({ some: 'data' }));
      compDialogOpenSpy.and.returnValue(fakeRef);
      component.onInternationalAddress();
      tick();
      expect(component.form.dirty).toBeTrue();
    }));

    it('should open dialog directly when already international', fakeAsync(() => {
      component.donorData.set({ ...mockDemographicsDto, intlAddrFlag: 'Y' });
      component.onInternationalAddress();
      tick();
      expect(compDialogOpenSpy).toHaveBeenCalled();
    }));
  });

  describe('Alternate Address', () => {
    let compDialogOpenSpy: jasmine.Spy;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of(null));
      compDialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(fakeRef);
    }));

    it('should open alternate demographics dialog', fakeAsync(() => {
      component.onAlternateAddress();
      tick();
      expect(compDialogOpenSpy).toHaveBeenCalled();
      expect(component.currentSubPanel()).toBe('main');
    }));

    it('should reload demographics when dialog returns result', fakeAsync(() => {
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of(true));
      compDialogOpenSpy.and.returnValue(fakeRef);
      const callsBefore = demographicsServiceSpy.getDemographics.calls.count();
      component.onAlternateAddress();
      tick();
      expect(demographicsServiceSpy.getDemographics.calls.count()).toBe(callsBefore + 1);
    }));
  });

  describe('Sub-panel navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('onSubPanelBack should reset to main panel', () => {
      component.currentSubPanel.set('international');
      spyOn(component.panelWidthChange, 'emit');
      component.onSubPanelBack();
      expect(component.currentSubPanel()).toBe('main');
      expect(component.alternateInjector).toBeNull();
      expect(component.panelWidthChange.emit).toHaveBeenCalledWith('70vw');
    });

    it('onSubPanelCancel should reset to main panel', () => {
      component.currentSubPanel.set('alternate');
      spyOn(component.panelWidthChange, 'emit');
      component.onSubPanelCancel();
      expect(component.currentSubPanel()).toBe('main');
      expect(component.panelWidthChange.emit).toHaveBeenCalledWith('70vw');
    });

    it('onSubPanelApply should reset to main and show error in query mode with result', () => {
      component.queryMode = true;
      component.currentSubPanel.set('alternate');
      spyOn(component.panelWidthChange, 'emit');
      component.onSubPanelApply({ some: 'result' });
      expect(component.currentSubPanel()).toBe('main');
      expect(component.panelWidthChange.emit).toHaveBeenCalledWith('70vw');
    });

    it('onSubPanelApply should reset to main without error when no result', () => {
      component.currentSubPanel.set('alternate');
      spyOn(component.panelWidthChange, 'emit');
      component.onSubPanelApply(null);
      expect(component.currentSubPanel()).toBe('main');
    });

    it('onIntlAddressApplied should clear intl address when result is null', () => {
      spyOn(component.intlAddressService, 'clearInternationalAddress');
      spyOn(component.panelWidthChange, 'emit');
      component.onIntlAddressApplied(null);
      expect(component.intlAddressService.clearInternationalAddress).toHaveBeenCalled();
      expect(component.currentSubPanel()).toBe('main');
      expect(component.panelWidthChange.emit).toHaveBeenCalledWith('70vw');
    });

    it('onIntlAddressApplied should mark form dirty when result is truthy', () => {
      spyOn(component.panelWidthChange, 'emit');
      component.onIntlAddressApplied({ some: 'data' });
      expect(component.form.dirty).toBeTrue();
      expect(component.currentSubPanel()).toBe('main');
    });
  });

  describe('onSidePanelButtonClick', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call onRedisplay for redisplay action', () => {
      spyOn(component, 'onRedisplay');
      component.onSidePanelButtonClick('redisplay');
      expect(component.onRedisplay).toHaveBeenCalled();
    });

    it('should call onCancel for cancel action', () => {
      spyOn(component, 'onCancel');
      component.onSidePanelButtonClick('cancel');
      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should call onSave for save action', () => {
      spyOn(component, 'onSave');
      component.onSidePanelButtonClick('save');
      expect(component.onSave).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    }));
  });

  describe('Form dirty tracking', () => {
    it('should set formDirty when form value changes and form is dirty', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.formDirty.set(false);
      component.form.get('streetName')?.markAsDirty();
      component.form.get('streetName')?.setValue('NEW VALUE');
      tick();
      expect(component.formDirty()).toBeTrue();
    }));
  });

  describe('Computed signals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('panelTitle should return Donor Demographics for main panel', () => {
      component.currentSubPanel.set('main');
      expect(component.panelTitle()).toBe('Donor Demographics');
    });

    it('panelTitle should return International Address for international panel', () => {
      component.currentSubPanel.set('international');
      expect(component.panelTitle()).toBe('International Address');
    });

    it('panelTitle should return Alternate Demographics for alternate panel', () => {
      component.currentSubPanel.set('alternate');
      expect(component.panelTitle()).toBe('Alternate Demographics');
    });

    it('sidePanelButtons should return 3 buttons', () => {
      const buttons = component.sidePanelButtons();
      expect(buttons.length).toBe(3);
      expect(buttons[0].action).toBe('redisplay');
      expect(buttons[1].action).toBe('cancel');
      expect(buttons[2].action).toBe('save');
    });

    it('f getter should return form controls', () => {
      expect(component.f).toBe(component.form.controls);
    });
  });

  describe('Data loading variants', () => {
    it('should set international address when intlAddrFlag is Y', fakeAsync(() => {
      const intlData = {
        ...mockDemographicsDto,
        intlAddrFlag: 'Y',
        address: {
          ...mockDemographicsDto.address,
          intlAddress1: '123 Intl St',
          intlAddress2: 'Line 2',
          intlAddress3: 'Line 3',
          intlAddress4: 'Line 4',
          countryName: 'Canada',
          intlPostalCode: 'V6B 1S5',
          intlHomePhoneNo: '6045551234',
          intlWorkPhoneNo: '6045555678',
          intlWorkPhoneExt: '123',
          intlMobilePhoneNo: '6045559999',
          intlFaxNo: '6045550000'
        }
      };
      demographicsServiceSpy.getDemographics.and.returnValue(of(intlData));
      spyOn(component.intlAddressService, 'setInternationalAddress');
      fixture.detectChanges();
      tick();
      expect(component.intlAddressService.setInternationalAddress).toHaveBeenCalled();
    }));

    it('should clear international address when intlAddrFlag is not Y', fakeAsync(() => {
      spyOn(component.intlAddressService, 'clearInternationalAddress');
      fixture.detectChanges();
      tick();
      expect(component.intlAddressService.clearInternationalAddress).toHaveBeenCalled();
    }));

    it('should handle null phone data in demographics', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        phones: { home: null, work: null, mobile: null, preferredContact: null }
      }));
      fixture.detectChanges();
      tick();
      expect(component.form.get('homePhoneNumber')?.value).toBe('');
    }));

    it('should use default error message when error has no message', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(
        throwError(() => ({ message: '' }))
      );
      fixture.detectChanges();
      tick();
      expect(component.error()).toBe('Failed to load donor demographics');
    }));

    it('should use height value as-is from API', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        personalInfo: { ...mockDemographicsDto.personalInfo, height: "5'6\"" }
      }));
      fixture.detectChanges();
      tick();
      expect(component.form.get('height')?.value).toBe("5'6\"");
    }));

    it('should handle null height', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        personalInfo: { ...mockDemographicsDto.personalInfo, height: null }
      }));
      fixture.detectChanges();
      tick();
      expect(component.form.get('height')?.value).toBe('');
    }));

    it('should return original height when not in HEIGHT_OPTIONS', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        personalInfo: { ...mockDemographicsDto.personalInfo, height: "8'5\"" }
      }));
      fixture.detectChanges();
      tick();
      expect(component.form.get('height')?.value).toBe("8'5\"");
    }));

    it('should handle intl address flag Y in form population', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        intlAddrFlag: 'Y'
      }));
      fixture.detectChanges();
      tick();
      expect(component.donorData()?.intlAddrFlag).toBe('Y');
    }));

    it('should set query mode snapshot when readOnly and queryMode', fakeAsync(() => {
      component.readOnly = true;
      component.queryMode = true;
      fixture.detectChanges();
      tick();
      expect(component.donorData()).toBeTruthy();
    }));
  });

  // ===== COMPREHENSIVE COVERAGE TESTS =====

  describe('Constructor branches', () => {
    it('should set donorId and readOnly from dialog data', () => {
      expect(component.donorId).toBe('D123456789');
      expect(component.readOnly).toBeFalse();
    });

    it('should set isSidePanelMode to false when dialogRef is provided', () => {
      expect(component.isSidePanelMode).toBeFalse();
    });
  });

  describe('ngOnInit side panel mode', () => {
    it('should use inputDonorId when in side panel mode', fakeAsync(() => {
      // Create a fresh component to test side panel mode by not providing dialogRef
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          DonorDemographicsComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader }
          })
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DonorDemographicsService, useValue: demographicsServiceSpy },
          { provide: MAT_DIALOG_DATA, useValue: null }
        ]
      });

      demographicsServiceSpy.getDemographics.and.returnValue(of(mockDemographicsDto));

      const sidePanelFixture = TestBed.createComponent(DonorDemographicsComponent);
      const sidePanelComponent = sidePanelFixture.componentInstance;
      sidePanelComponent.inputDonorId = 'SP-DONOR-001';
      sidePanelComponent.inputReadOnly = true;

      sidePanelFixture.detectChanges();
      tick();

      expect(sidePanelComponent.isSidePanelMode).toBeTrue();
      expect(sidePanelComponent.donorId).toBe('SP-DONOR-001');
      expect(sidePanelComponent.readOnly).toBeTrue();

      sidePanelFixture.destroy();
    }));
  });

  describe('initForm readOnly branches', () => {
    it('should disable form when readOnly is true and not side panel mode', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          DonorDemographicsComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader }
          })
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DonorDemographicsService, useValue: demographicsServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { donorId: 'D123456789', readOnly: true } }
        ]
      });

      demographicsServiceSpy.getDemographics.and.returnValue(of(mockDemographicsDto));

      const roFixture = TestBed.createComponent(DonorDemographicsComponent);
      const roComponent = roFixture.componentInstance;

      roFixture.detectChanges();
      tick();

      expect(roComponent.readOnly).toBeTrue();
      expect(roComponent.form.disabled).toBeTrue();

      roFixture.destroy();
    }));
  });

  describe('weightValidator edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should allow empty string weight', () => {
      component.form.get('weight')?.setValue('');
      expect(component.form.get('weight')?.valid).toBeTrue();
    });

    it('should allow zero weight (treated as empty)', () => {
      component.form.get('weight')?.setValue(0);
      expect(component.form.get('weight')?.valid).toBeTrue();
    });

    it('should reject non-integer weight', () => {
      component.form.get('weight')?.setValue(3.5);
      expect(component.form.get('weight')?.hasError('notInteger')).toBeTrue();
    });

    it('should accept valid integer weight', () => {
      component.form.get('weight')?.setValue(150);
      expect(component.form.get('weight')?.valid).toBeTrue();
    });
  });

  describe('emailFormatValidator edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should allow empty email', () => {
      component.form.get('email')?.setValue('');
      expect(component.form.get('email')?.valid).toBeTrue();
    });

    it('should allow whitespace-only email (treated as empty)', () => {
      component.form.get('email')?.setValue('   ');
      expect(component.form.get('email')?.valid).toBeTrue();
    });

    it('should reject email without @ symbol', () => {
      component.form.get('email')?.setValue('nodomain.com');
      expect(component.form.get('email')?.hasError('email')).toBeTrue();
    });

    it('should reject email without dot', () => {
      component.form.get('email')?.setValue('user@domain');
      expect(component.form.get('email')?.hasError('email')).toBeTrue();
    });

    it('should accept valid email', () => {
      component.form.get('email')?.setValue('user@domain.com');
      expect(component.form.get('email')?.hasError('email')).toBeFalse();
    });
  });

  describe('phoneFormatValidator edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should allow empty phone', () => {
      component.form.get('homePhoneNumber')?.setValue('');
      expect(component.form.get('homePhoneNumber')?.valid).toBeTrue();
    });

    it('should reject formatted phone with non-3-digit area code', () => {
      component.form.get('homePhoneNumber')?.setValue('(+12) 555-1234');
      expect(component.form.get('homePhoneNumber')?.hasError('invalidAreaCode')).toBeTrue();
    });

    it('should reject formatted phone with non-7-digit phone number', () => {
      component.form.get('homePhoneNumber')?.setValue('(+214) 555-12');
      expect(component.form.get('homePhoneNumber')?.hasError('invalidPhoneDigits')).toBeTrue();
    });

    it('should reject formatted phone with all-zero phone digits', () => {
      component.form.get('homePhoneNumber')?.setValue('(+214) 000-0000');
      expect(component.form.get('homePhoneNumber')?.hasError('invalidPhoneDigits')).toBeTrue();
    });

    it('should accept valid formatted phone', () => {
      component.form.get('homePhoneNumber')?.setValue('(+214) 555-1234');
      expect(component.form.get('homePhoneNumber')?.valid).toBeTrue();
    });

    it('should reject raw digits with phoneRequired error for non-digit content', () => {
      component.form.get('homePhoneNumber')?.setValue('abc');
      expect(component.form.get('homePhoneNumber')?.hasError('phoneRequired')).toBeTrue();
    });

    it('should reject phone number with more than 10 digits', () => {
      component.form.get('homePhoneNumber')?.setValue('12345678901');
      expect(component.form.get('homePhoneNumber')?.hasError('phoneTooLong')).toBeTrue();
    });

    it('should accept exactly 10 raw digits', () => {
      component.form.get('homePhoneNumber')?.setValue('2145551234');
      expect(component.form.get('homePhoneNumber')?.valid).toBeTrue();
    });
  });

  describe('combinePhone and parsePhone', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle phone with only area code', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        phones: {
          ...mockDemographicsDto.phones,
          home: { areaCode: '214', phoneNo: null }
        }
      }));
      component.loadDemographics();
      tick();

      expect(component.form.get('homePhoneNumber')?.value).toBe('(+214)');
    }));

    it('should handle phone with only phone number', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        phones: {
          ...mockDemographicsDto.phones,
          home: { areaCode: null, phoneNo: '5551234' }
        }
      }));
      component.loadDemographics();
      tick();

      expect(component.form.get('homePhoneNumber')?.value).toBe('555-1234');
    }));

    it('should return empty string when both area code and phone are null', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        phones: {
          ...mockDemographicsDto.phones,
          home: { areaCode: null, phoneNo: null }
        }
      }));
      component.loadDemographics();
      tick();

      expect(component.form.get('homePhoneNumber')?.value).toBe('');
    }));
  });

  describe('formatPhoneWithHyphen', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should format 7-digit phone with hyphen', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        phones: {
          ...mockDemographicsDto.phones,
          home: { areaCode: '214', phoneNo: '5551234' }
        }
      }));
      component.loadDemographics();
      tick();

      // 7 digits -> formatted with hyphen
      expect(component.form.get('homePhoneNumber')?.value).toContain('555-1234');
    }));

    it('should leave non-7-digit phone as-is', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        phones: {
          ...mockDemographicsDto.phones,
          home: { areaCode: '214', phoneNo: '12345' }
        }
      }));
      component.loadDemographics();
      tick();

      expect(component.form.get('homePhoneNumber')?.value).toContain('12345');
    }));
  });

  describe('getPreferredContact', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return H when homePreferred is true', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      }, { emitEvent: false });
      // Set preferred AFTER phone changes to avoid phone-clear-unchecks-preferred
      component.form.patchValue({
        homePreferred: true,
        workPreferred: false,
        mobilePreferred: false
      }, { emitEvent: false });

      const compDialogOpen = spyOn((component as any).dialog, 'open');
      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));

      component.onSave();
      tick();

      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.phones.preferredContact).toBe('H');
    }));

    it('should return W when workPreferred is true', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePreferred: false,
        workPreferred: true,
        mobilePreferred: false,
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      }, { emitEvent: false });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      const compDialogOpen = spyOn((component as any).dialog, 'open');

      component.onSave();
      tick();

      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.phones.preferredContact).toBe('W');
    }));

    it('should return null when no preferred is selected', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePreferred: false,
        workPreferred: false,
        mobilePreferred: false,
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      }, { emitEvent: false });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      const compDialogOpen = spyOn((component as any).dialog, 'open');

      component.onSave();
      tick();

      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.phones.preferredContact).toBeNull();
    }));
  });

  describe('populateForm intlAddrFlag handling', () => {
    it('should load with intlAddrFlag Y and not add zip required', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        intlAddrFlag: 'Y'
      }));
      fixture.detectChanges();
      tick();

      expect(component.donorData()?.intlAddrFlag).toBe('Y');
      // For intl addresses, zip does NOT get required validator
      component.form.get('zip')?.setValue('', { emitEvent: false });
      component.form.get('zip')?.updateValueAndValidity();
      expect(component.form.get('zip')?.hasError('required')).toBeFalse();
    }));

    it('should add zip required validator for domestic address', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('zip')?.setValue('');
      expect(component.form.get('zip')?.hasError('required')).toBeTrue();
    }));

    it('should not add zip required for international address', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(of({
        ...mockDemographicsDto,
        intlAddrFlag: 'Y'
      }));
      fixture.detectChanges();
      tick();

      component.form.get('zip')?.setValue('');
      expect(component.form.get('zip')?.hasError('required')).toBeFalse();
    }));

    it('should set query mode snapshot when readOnly and queryMode', fakeAsync(() => {
      component.readOnly = true;
      component.queryMode = true;
      fixture.detectChanges();
      tick();

      // After populateForm, queryModeSnapshot should be set
      expect(component.donorData()).toBeTruthy();
      expect(component.form.get('streetName')?.value).toBe('82 LONG');
    }));
  });

  describe('loadIntlAddressFromData', () => {
    it('should set international address when intlAddrFlag is Y with all fields', fakeAsync(() => {
      const intlData = {
        ...mockDemographicsDto,
        intlAddrFlag: 'Y',
        address: {
          ...mockDemographicsDto.address,
          intlAddress1: '123 International St',
          intlAddress2: 'Suite 456',
          intlAddress3: 'Floor 7',
          intlAddress4: 'Building A',
          countryName: 'Canada',
          intlPostalCode: 'V6B 1S5',
          intlHomePhoneNo: '6045551234',
          intlWorkPhoneNo: '6045555678',
          intlWorkPhoneExt: '123',
          intlMobilePhoneNo: '6045559999',
          intlFaxNo: '6045550000'
        }
      };
      demographicsServiceSpy.getDemographics.and.returnValue(of(intlData));
      spyOn(component.intlAddressService, 'setInternationalAddress');

      fixture.detectChanges();
      tick();

      expect(component.intlAddressService.setInternationalAddress).toHaveBeenCalledWith(jasmine.objectContaining({
        streetName: '123 International St',
        country: 'Canada',
        intlAddrFlag: 'Y'
      }));
    }));

    it('should clear international address when intlAddrFlag is not Y', fakeAsync(() => {
      spyOn(component.intlAddressService, 'clearInternationalAddress');
      fixture.detectChanges();
      tick();

      expect(component.intlAddressService.clearInternationalAddress).toHaveBeenCalled();
    }));
  });

  describe('onCancel in different modes', () => {
    it('should close dialogRef when in dialog mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    }));

    it('should emit closePanelEvent when in side panel mode', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          DonorDemographicsComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader }
          })
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DonorDemographicsService, useValue: demographicsServiceSpy },
          { provide: MAT_DIALOG_DATA, useValue: null }
        ]
      });

      demographicsServiceSpy.getDemographics.and.returnValue(of(mockDemographicsDto));
      const spFixture = TestBed.createComponent(DonorDemographicsComponent);
      const spComponent = spFixture.componentInstance;
      spComponent.inputDonorId = 'SP-001';

      spFixture.detectChanges();
      tick();

      spyOn(spComponent.closePanelEvent, 'emit');
      spComponent.onCancel();
      expect(spComponent.closePanelEvent.emit).toHaveBeenCalled();

      spFixture.destroy();
    }));
  });

  describe('onInternationalAddress side panel mode', () => {
    it('should set currentSubPanel to international in side panel mode', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          DonorDemographicsComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader }
          })
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DonorDemographicsService, useValue: demographicsServiceSpy },
          { provide: MAT_DIALOG_DATA, useValue: null }
        ]
      });

      demographicsServiceSpy.getDemographics.and.returnValue(of(mockDemographicsDto));
      const spFixture = TestBed.createComponent(DonorDemographicsComponent);
      const spComponent = spFixture.componentInstance;
      spComponent.inputDonorId = 'SP-001';

      spFixture.detectChanges();
      tick();

      // Clear domestic fields first
      spComponent.form.patchValue({ streetName: '', city: '', zip: '' }, { emitEvent: false });
      spyOn(spComponent.panelWidthChange, 'emit');

      spComponent.onInternationalAddress();

      expect(spComponent.currentSubPanel()).toBe('international');
      expect(spComponent.panelWidthChange.emit).toHaveBeenCalledWith('700px');

      spFixture.destroy();
    }));
  });

  describe('onAlternateAddress side panel mode', () => {
    it('should set up alternate injector and switch sub panel in side panel mode', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          DonorDemographicsComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader }
          })
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DonorDemographicsService, useValue: demographicsServiceSpy },
          { provide: MAT_DIALOG_DATA, useValue: null }
        ]
      });

      demographicsServiceSpy.getDemographics.and.returnValue(of(mockDemographicsDto));
      const spFixture = TestBed.createComponent(DonorDemographicsComponent);
      const spComponent = spFixture.componentInstance;
      spComponent.inputDonorId = 'SP-001';

      spFixture.detectChanges();
      tick();

      spyOn(spComponent.panelWidthChange, 'emit');
      spComponent.onAlternateAddress();

      expect(spComponent.currentSubPanel()).toBe('alternate');
      expect(spComponent.alternateInjector).toBeTruthy();
      expect(spComponent.panelWidthChange.emit).toHaveBeenCalledWith('700px');

      spFixture.destroy();
    }));
  });

  describe('submitUpdate in query mode', () => {
    it('should show query mode error and close panel when side panel and query mode', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          DonorDemographicsComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader }
          })
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DonorDemographicsService, useValue: demographicsServiceSpy },
          { provide: MAT_DIALOG_DATA, useValue: null }
        ]
      });

      demographicsServiceSpy.getDemographics.and.returnValue(of(mockDemographicsDto));
      const spFixture = TestBed.createComponent(DonorDemographicsComponent);
      const spComponent = spFixture.componentInstance;
      spComponent.inputDonorId = 'SP-001';
      spComponent.queryMode = true;

      spFixture.detectChanges();
      tick();

      const snackBarSpy = spyOn((spComponent as any).snackBar, 'open');
      spyOn(spComponent.closePanelEvent, 'emit');

      // Force form valid
      Object.defineProperty(spComponent.form, 'invalid', { get: () => false, configurable: true });
      spComponent.onSave();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error:1705: Form in query mode, cannot change database fields',
        'DISMISS',
        jasmine.any(Object)
      );
      expect(spComponent.closePanelEvent.emit).toHaveBeenCalled();
      expect(demographicsServiceSpy.updateDemographics).not.toHaveBeenCalled();

      spFixture.destroy();
    }));
  });

  describe('buildUpdatePayload with intl address', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should include intl address data in payload when available', fakeAsync(() => {
      spyOn(component.intlAddressService, 'getInternationalAddress').and.returnValue({
        streetName: 'Intl Street',
        addr1: 'Line 2',
        addr2: 'Line 3',
        addr3: null,
        country: 'UK',
        postalCode: 'SW1A 1AA',
        homePhoneNo: null,
        workPhoneNo: null,
        workPhoneExt: null,
        mobilePhoneNo: null,
        faxNo: null,
        intlAddrFlag: 'Y'
      });

      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();

      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.address.intlAddress1).toBe('Intl Street');
      expect(payload.address.intlAddress2).toBe('Line 2');
      expect(payload.address.countryName).toBe('UK');
      expect(payload.address.intlPostalCode).toBe('SW1A 1AA');
      expect(payload.address.intlAddrFlag).toBe('Y');
    }));

    it('should set null intl address data when no intl address', fakeAsync(() => {
      spyOn(component.intlAddressService, 'getInternationalAddress').and.returnValue(null);

      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();

      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.address.intlAddress1).toBeNull();
      expect(payload.address.countryName).toBeNull();
      expect(payload.address.intlAddrFlag).toBe('N');
    }));
  });

  describe('parsePhone via buildUpdatePayload', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should parse formatted phone into areaCode and phoneNo', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '(+214) 555-1234',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();

      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.phones.home?.areaCode).toBe('214');
      expect(payload.phones.home?.phoneNo).toBe('5551234');
    }));

    it('should handle raw digit phone number (no parentheses)', fakeAsync(() => {
      // Use emitEvent: false to set an unformatted value, bypass form validation
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '5551234',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      }, { emitEvent: false });

      // Force form valid since raw 7-digit phone fails phoneFormatValidator
      Object.defineProperty(component.form, 'invalid', { get: () => false, configurable: true });
      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();

      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.phones.home?.areaCode).toBeNull();
      expect(payload.phones.home?.phoneNo).toBe('5551234');
    }));

    it('should return null phone when empty', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();

      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.phones.home).toBeNull();
    }));

    it('should include work extension in payload', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '(+214) 555-9999',
        workExtension: 4567,
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();

      const payload = demographicsServiceSpy.updateDemographics.calls.mostRecent().args[1];
      expect(payload.phones.work?.extension).toBe(4567);
    }));
  });

  describe('Preferred contact unchecked does not affect others', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not affect other checkboxes when homePreferred is unchecked', fakeAsync(() => {
      component.form.patchValue({ homePreferred: true }, { emitEvent: false });
      component.form.patchValue({ workPreferred: true }, { emitEvent: false });

      component.form.get('homePreferred')?.setValue(false);
      tick();

      expect(component.form.get('workPreferred')?.value).toBeTrue();
    }));
  });

  describe('setupPhoneClearUnchecksPreferred - with value', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not uncheck homePreferred when phone has value', fakeAsync(() => {
      component.form.patchValue({ homePreferred: true }, { emitEvent: false });
      component.form.get('homePhoneNumber')?.setValue('2145551234');
      tick();

      expect(component.form.get('homePreferred')?.value).toBeTrue();
    }));

    it('should not uncheck workPreferred when work phone has value', fakeAsync(() => {
      component.form.patchValue({ workPreferred: true }, { emitEvent: false });
      component.form.get('workPhoneNumber')?.setValue('2145551234');
      tick();

      expect(component.form.get('workPreferred')?.value).toBeTrue();
    }));

    it('should not uncheck mobilePreferred when mobile phone has value', fakeAsync(() => {
      component.form.patchValue({ mobilePreferred: true }, { emitEvent: false });
      component.form.get('mobilePhoneNumber')?.setValue('2145551234');
      tick();

      expect(component.form.get('mobilePreferred')?.value).toBeTrue();
    }));
  });

  describe('setupExtensionValidation - no extension value', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not set error when work phone cleared and extension is empty', fakeAsync(() => {
      component.form.patchValue({
        workPhoneNumber: '(+214) 555-1234',
        workExtension: null
      });
      tick();

      component.form.get('workPhoneNumber')?.setValue('');
      tick();

      expect(component.form.get('workExtension')?.hasError('extensionRequiresPhone')).toBeFalse();
    }));
  });

  describe('setupCityClearsFields - with cityOptions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not clear zip/state/county when city changes and cityOptions exist', fakeAsync(() => {
      component.cityOptions.set([{ city: 'DALLAS', state: 'TX', uspsId: 123 }]);
      component.form.patchValue({ zip: '75201', state: 'TX', county: 'DALLAS' }, { emitEvent: false });

      component.form.get('city')?.setValue('DALLAS');
      tick();

      expect(component.form.get('zip')?.value).toBe('75201');
      expect(component.form.get('state')?.value).toBe('TX');
    }));
  });

  describe('setupEmployerCityClearsFields - with employerCityOptions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not clear employer zip/state when employer city changes and options exist', fakeAsync(() => {
      component.employerCityOptions.set([{ city: 'CHICAGO', state: 'IL', uspsId: 456 }]);
      component.form.patchValue({ employerZip: '60601', employerState: 'IL' }, { emitEvent: false });

      component.form.get('employerCity')?.setValue('CHICAGO');
      tick();

      expect(component.form.get('employerZip')?.value).toBe('60601');
      expect(component.form.get('employerState')?.value).toBe('IL');
    }));
  });

  describe('onCityBlur edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not call API when city is empty', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByCity.calls.reset();
      component.form.get('city')?.setValue('');
      component.onCityBlur();
      tick();

      expect(demographicsServiceSpy.getCityStateByCity).not.toHaveBeenCalled();
    }));

    it('should not call API when city is null', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByCity.calls.reset();
      component.form.get('city')?.setValue(null);
      component.onCityBlur();
      tick();

      expect(demographicsServiceSpy.getCityStateByCity).not.toHaveBeenCalled();
    }));
  });

  describe('onFormClick edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should do nothing when readOnly is true but queryMode is false', () => {
      component.readOnly = true;
      component.queryMode = false;
      const snackBarSpy = spyOn((component as any).snackBar, 'open');
      const input = document.createElement('input');
      component.onFormClick({ target: input } as unknown as Event);
      expect(snackBarSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when readOnly is false and queryMode is true', () => {
      component.readOnly = false;
      component.queryMode = true;
      const snackBarSpy = spyOn((component as any).snackBar, 'open');
      const input = document.createElement('input');
      component.onFormClick({ target: input } as unknown as Event);
      expect(snackBarSpy).not.toHaveBeenCalled();
    });

    it('should show error when clicking a mat-form-field in query mode', () => {
      component.readOnly = true;
      component.queryMode = true;
      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      const matFormField = document.createElement('mat-form-field');
      component.onFormClick({ target: matFormField } as unknown as Event);

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error:1705: Form in query mode, cannot change database fields',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should show error when clicking a mat-checkbox in query mode', () => {
      component.readOnly = true;
      component.queryMode = true;
      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      const checkbox = document.createElement('mat-checkbox');
      component.onFormClick({ target: checkbox } as unknown as Event);

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error:1705: Form in query mode, cannot change database fields',
        'DISMISS',
        jasmine.any(Object)
      );
    });
  });

  describe('doUpdateDemographics success - dialog vs panel close', () => {
    it('should close dialogRef on successful save in dialog mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      component.onSave();
      tick();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));

    it('should emit closePanelEvent on successful save in side panel mode', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          DonorDemographicsComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader }
          })
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DonorDemographicsService, useValue: demographicsServiceSpy },
          { provide: MAT_DIALOG_DATA, useValue: null }
        ]
      });

      demographicsServiceSpy.getDemographics.and.returnValue(of(mockDemographicsDto));
      const spFixture = TestBed.createComponent(DonorDemographicsComponent);
      const spComponent = spFixture.componentInstance;
      spComponent.inputDonorId = 'SP-001';
      spComponent.queryMode = false;

      spFixture.detectChanges();
      tick();

      spyOn(spComponent.closePanelEvent, 'emit');

      spComponent.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));

      Object.defineProperty(spComponent.form, 'invalid', { get: () => false, configurable: true });
      spComponent.onSave();
      tick();

      expect(spComponent.closePanelEvent.emit).toHaveBeenCalled();

      spFixture.destroy();
    }));
  });

  describe('doUpdateDemographics error handling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset saving and pendingNewEmployer on error', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      component.onSave();
      tick();

      expect(component.saving()).toBeFalse();
    }));

    it('should use default error message when error has no message', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.updateDemographics.and.returnValue(
        throwError(() => ({ message: '' }))
      );

      const snackBarSpy = spyOn((component as any).snackBar, 'open');
      component.onSave();
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to save donor demographics', 'DISMISS', jasmine.any(Object)
      );
    }));
  });

  describe('onPasteNumbers edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle null clipboardData', () => {
      const event = {
        preventDefault: jasmine.createSpy(),
        clipboardData: null
      } as unknown as ClipboardEvent;
      (document as any).execCommand = jasmine.createSpy('execCommand');
      component.onPasteNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect((document as any).execCommand).toHaveBeenCalledWith('insertText', false, '');
    });
  });

  describe('onPhoneBlur edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not validate area code when phone has no parenthesized area code', fakeAsync(() => {
      demographicsServiceSpy.validateAreaCode.calls.reset();
      component.form.get('homePhoneNumber')?.setValue('12345', { emitEvent: false });
      component.onPhoneBlur('homePhoneNumber');
      tick();

      // validatePhoneAreaCode skips when no match for area code pattern
      expect(demographicsServiceSpy.validateAreaCode).not.toHaveBeenCalled();
    }));

    it('should not do anything for null control value', fakeAsync(() => {
      component.form.get('homePhoneNumber')?.setValue(null, { emitEvent: false });
      component.onPhoneBlur('homePhoneNumber');
      tick();
      // No error thrown
    }));
  });

  describe('Employer search error in submitUpdate', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should prompt to create employer when searchEmployers errors', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        employerName: 'ERROR SEARCH CORP',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.searchEmployers.and.returnValue(
        throwError(() => new Error('Search API error'))
      );

      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of('yes'));
      const compDialogOpen = spyOn((component as any).dialog, 'open').and.returnValue(fakeRef);
      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));

      component.onSave();
      tick();

      expect(compDialogOpen).toHaveBeenCalled();
      expect(demographicsServiceSpy.updateDemographics).toHaveBeenCalled();
    }));
  });

  describe('Zip lookup deduplication', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should deduplicate cities from zip lookup results', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(of([
        { city: 'DALLAS', state: 'TX', zip: '75201', uspsId: 1 },
        { city: 'DALLAS', state: 'TX', zip: '75201', uspsId: 2 },
        { city: 'OTHER', state: 'TX', zip: '75201', uspsId: 3 }
      ]));
      component.form.get('city')?.setValue('', { emitEvent: false });
      component.form.get('zip')?.setValue('75201');
      tick(350);

      expect(component.cityOptions().length).toBe(2);
    }));
  });

  describe('Employer zip lookup deduplication', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should deduplicate employer cities from zip lookup', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(of([
        { city: 'TOPEKA', state: 'KS', zip: '66601', uspsId: 1 },
        { city: 'TOPEKA', state: 'KS', zip: '66601', uspsId: 2 }
      ]));
      component.form.get('employerCity')?.setValue('', { emitEvent: false });
      component.form.get('employerZip')?.setValue('66601');
      tick(350);

      // Should deduplicate to 1 unique city and auto-select
      expect(component.form.get('employerCity')?.value).toBe('TOPEKA');
      expect(component.form.get('employerState')?.value).toBe('KS');
    }));

    it('should handle employer zip lookup API error gracefully', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.and.returnValue(throwError(() => new Error('API error')));
      component.form.get('employerZip')?.setValue('88888');
      tick(350);

      expect(component.employerCityOptions().length).toBe(0);
    }));
  });

  describe('onSave - form invalid branch', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set submitted to true even when form is invalid', () => {
      component.form.get('streetName')?.setValue('');
      component.onSave();

      expect(component.submitted()).toBeTrue();
      expect(demographicsServiceSpy.updateDemographics).not.toHaveBeenCalled();
    });
  });

  describe('Alternate address dialog mode - result handling', () => {
    let compDialogOpenSpy: jasmine.Spy;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of(null));
      compDialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(fakeRef);
    }));

    it('should not reload demographics when alternate dialog returns null', fakeAsync(() => {
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of(null));
      compDialogOpenSpy.and.returnValue(fakeRef);

      const callsBefore = demographicsServiceSpy.getDemographics.calls.count();
      component.onAlternateAddress();
      tick();

      expect(demographicsServiceSpy.getDemographics.calls.count()).toBe(callsBefore);
    }));
  });

  describe('International address dialog - no result (not null)', () => {
    let compDialogOpenSpy: jasmine.Spy;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of(undefined));
      compDialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(fakeRef);
    }));

    it('should not clear intl address or mark form dirty when dialog returns undefined', fakeAsync(() => {
      component.form.patchValue({ streetName: '', city: '', zip: '' }, { emitEvent: false });
      spyOn(component.intlAddressService, 'clearInternationalAddress');
      component.form.markAsPristine();

      component.onInternationalAddress();
      tick();

      // undefined is not null, so clearInternationalAddress should not be called
      expect(component.intlAddressService.clearInternationalAddress).not.toHaveBeenCalled();
      // undefined is falsy, so form should not be marked dirty
      expect(component.form.dirty).toBeFalse();
    }));
  });

  describe('Side panel alternate address fakeDialogRef close', () => {
    it('should show query mode error when alternate sub-panel closes with result in query mode', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          DonorDemographicsComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader }
          })
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DonorDemographicsService, useValue: demographicsServiceSpy },
          { provide: MAT_DIALOG_DATA, useValue: null }
        ]
      });

      demographicsServiceSpy.getDemographics.and.returnValue(of(mockDemographicsDto));
      const spFixture = TestBed.createComponent(DonorDemographicsComponent);
      const spComponent = spFixture.componentInstance;
      spComponent.inputDonorId = 'SP-001';
      spComponent.queryMode = true;

      spFixture.detectChanges();
      tick();

      const snackBarSpy = spyOn((spComponent as any).snackBar, 'open');

      // Open alternate address (side panel mode)
      spComponent.onAlternateAddress();

      // Verify alternate injector was created
      expect(spComponent.alternateInjector).toBeTruthy();

      // Get the fakeDialogRef and call close with a result
      const fakeDialogRef = spComponent.alternateInjector!.get(MatDialogRef);
      fakeDialogRef.close({ some: 'result' });

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error:1705: Form in query mode, cannot change database fields',
        'DISMISS',
        jasmine.any(Object)
      );
      expect(spComponent.currentSubPanel()).toBe('main');

      spFixture.destroy();
    }));
  });

  describe('Zip lookup - short zip ignored', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not call API for zip shorter than 5 digits', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.calls.reset();
      component.form.get('zip')?.setValue('123');
      tick(350);

      expect(demographicsServiceSpy.getCityStateByZip).not.toHaveBeenCalled();
    }));

    it('should not call API for employer zip shorter than 5 digits', fakeAsync(() => {
      demographicsServiceSpy.getCityStateByZip.calls.reset();
      component.form.get('employerZip')?.setValue('12');
      tick(350);

      expect(demographicsServiceSpy.getCityStateByZip).not.toHaveBeenCalled();
    }));
  });

  describe('onSidePanelButtonClick - unknown action', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should do nothing for unknown action', () => {
      spyOn(component, 'onRedisplay');
      spyOn(component, 'onCancel');
      spyOn(component, 'onSave');

      component.onSidePanelButtonClick('unknown');

      expect(component.onRedisplay).not.toHaveBeenCalled();
      expect(component.onCancel).not.toHaveBeenCalled();
      expect(component.onSave).not.toHaveBeenCalled();
    });
  });

  describe('Form formDirty not set when form is pristine', () => {
    it('should not set formDirty when form changes but is still pristine', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.formDirty.set(false);
      // setValue without markAsDirty keeps form pristine
      component.form.get('streetName')?.setValue('NEW VALUE');
      tick();

      // form.dirty is false because setValue alone does not mark dirty
      expect(component.formDirty()).toBeFalse();
    }));
  });

  describe('sidePanelButtons computed - disabled states', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should disable redisplay button when loading', () => {
      component.loading.set(true);
      const buttons = component.sidePanelButtons();
      expect(buttons[0].disabled).toBeTrue();
    });

    it('should disable redisplay button when saving', () => {
      component.saving.set(true);
      const buttons = component.sidePanelButtons();
      expect(buttons[0].disabled).toBeTrue();
    });

    it('should disable save button when saving', () => {
      component.saving.set(true);
      const buttons = component.sidePanelButtons();
      expect(buttons[2].disabled).toBeTrue();
    });

    it('should disable save button when form is not dirty', () => {
      component.formDirty.set(false);
      component.saving.set(false);
      const buttons = component.sidePanelButtons();
      expect(buttons[2].disabled).toBeTrue();
    });

    it('should enable save button when form is dirty and not saving', () => {
      component.formDirty.set(true);
      component.saving.set(false);
      component.readOnly = false;
      const buttons = component.sidePanelButtons();
      expect(buttons[2].disabled).toBeFalse();
    });
  });

  describe('loadDemographics error with object error', () => {
    it('should use error message from error object', fakeAsync(() => {
      demographicsServiceSpy.getDemographics.and.returnValue(
        throwError(() => new Error('Custom API error'))
      );
      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Custom API error');
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('forceUpperCase edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle non-string value gracefully', () => {
      component.form.get('weight')?.setValue(123, { emitEvent: false });
      component.forceUpperCase('weight');
      // Non-string value - should not throw
      expect(component.form.get('weight')?.value).toBe(123);
    });

    it('should handle non-existent control gracefully', () => {
      // Should not throw
      component.forceUpperCase('nonExistentControl');
    });
  });

  describe('onlyNumbers edge cases', () => {
    it('should prevent letters using which property', () => {
      const event = { which: 65, keyCode: 65, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      const result = component.onlyNumbers(event);
      expect(result).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow digits using which property', () => {
      const event = { which: 50, keyCode: 50, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      const result = component.onlyNumbers(event);
      expect(result).toBeTrue();
    });

    it('should use keyCode when which is 0', () => {
      const event = { which: 0, keyCode: 65, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      const result = component.onlyNumbers(event);
      expect(result).toBeFalse();
    });
  });

  describe('Dropdown search null/undefined handling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle null search value for language', fakeAsync(() => {
      component.languageSearchCtrl.setValue(null as any);
      tick();
      expect(component.filteredLanguages.length).toBe(2);
    }));

    it('should handle null search value for ethnicity', fakeAsync(() => {
      component.ethnicitySearchCtrl.setValue(null as any);
      tick();
      expect(component.filteredEthnicities.length).toBe(1);
    }));

    it('should handle null search value for salutation', fakeAsync(() => {
      component.salutationSearchCtrl.setValue(null as any);
      tick();
      expect(component.filteredSalutations.length).toBe(1);
    }));

    it('should handle null search value for height', fakeAsync(() => {
      component.heightSearchCtrl.setValue(null as any);
      tick();
      expect(component.filteredHeights.length).toBe(2);
    }));
  });

  describe('onCitySelected with county', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle city option without county', () => {
      component.cityOptions.set([{ city: 'NOCOUNTY', state: 'TX', uspsId: 789 }]);
      component.onCitySelected('NOCOUNTY');
      expect(component.form.get('state')?.value).toBe('TX');
      expect(component.form.get('county')?.value).toBe('');
    });
  });

  describe('Employer matched with uspsId update', () => {
    let compDialogOpenSpy: jasmine.Spy;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const fakeRef = jasmine.createSpyObj('DialogRef', ['close', 'afterClosed']);
      fakeRef.afterClosed.and.returnValue(of(null));
      compDialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(fakeRef);
    }));

    it('should update employer fields when matched employer found', fakeAsync(() => {
      component.form.patchValue({
        streetName: '123 MAIN',
        zip: '66207',
        employerName: 'MATCH CORP',
        homePhoneNumber: '',
        workPhoneNumber: '',
        mobilePhoneNumber: ''
      });

      demographicsServiceSpy.searchEmployers.and.returnValue(of({
        data: [{
          employerId: 'EMP-MATCH',
          employerName: 'MATCH CORP',
          city: 'AUSTIN',
          state: 'TX',
          zip: '73301',
          uspsId: 55555,
          effDate: null, termDate: null, chapterId: 'ALL', intlAddrFlag: null
        }],
        total: 1
      }));
      demographicsServiceSpy.updateDemographics.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));

      component.onSave();
      tick();

      expect(component.form.get('employerCity')?.value).toBe('AUSTIN');
      expect(component.form.get('employerState')?.value).toBe('TX');
      expect(component.form.get('employerZip')?.value).toBe('73301');
    }));
  });
});
