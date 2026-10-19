import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import moment from 'moment';

import { FastTrakWebConfiguration } from './fasttrak-web-configuration';
import { FastTrakWebConfigurationService } from './services/fasttrak-web-configuration.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MenuService } from '@shared/services/menu.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { CodeLookup, ValidHHResource } from './models/fasttrak-web-configuration.model';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('FastTrakWebConfiguration', () => {
  let component: FastTrakWebConfiguration;
  let fixture: ComponentFixture<FastTrakWebConfiguration>;
  let fastTrakService: jasmine.SpyObj<FastTrakWebConfigurationService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let menuService: jasmine.SpyObj<MenuService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const today = moment();
  const todayStr = today.format('YYYY-MM-DD');

  const mockDonorConfig = {
    onlineResponsesFlag: true,
    multiLanguageFlag: false,
    effectiveDate: moment(todayStr),
    terminationDate: null as moment.Moment | null,
    auditKey: 1
  };

  const mockResourceConfig = {
    q: [{ code: 'Q001', description: 'Question Code 1' }, { code: 'Q002', description: 'Question Code 2' }],
    o: [{ code: 'O001', description: 'Other Code 1' }]
  };

  const mockResources: ValidHHResource[] = [
    { code: 'Q001', locationLink: 'http://example.com/a', description: 'Resource A', effectiveDate: todayStr, terminationDate: null },
    { code: 'Q001', locationLink: 'http://example.com/b', description: 'Resource B', effectiveDate: todayStr, terminationDate: null }
  ];

  beforeEach(() => {

    fastTrakService = jasmine.createSpyObj('FastTrakWebConfigurationService', [
      'getDonorResponseConfiguration',
      'saveDonorResponseConfiguration',
      'getResourceConfiguration',
      'retrieveResources',
      'addResource',
      'updateResource'
    ]);
    headerService = createMockHeaderService();
    snackbarService = createMockSnackbarService();
    menuService = jasmine.createSpyObj('MenuService', ['findMenuItemByPath'], {
      getMenuItemsSignal: signal([])
    });
    matDialog = createMockMatDialog();

    fastTrakService.getDonorResponseConfiguration.and.returnValue(of(null));
    fastTrakService.getResourceConfiguration.and.returnValue(of(mockResourceConfig));
    menuService.findMenuItemByPath.and.returnValue(undefined);



      TestBed.configureTestingModule({
      imports: [
        FastTrakWebConfiguration,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([]),
        { provide: FastTrakWebConfigurationService, useValue: fastTrakService },
        { provide: HeaderService, useValue: headerService },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: MenuService, useValue: menuService },
        { provide: MatDialog, useValue: matDialog }
      ]
    });


    


      fastTrakService.getDonorResponseConfiguration.calls.reset();


      fastTrakService.saveDonorResponseConfiguration.calls.reset();


      fastTrakService.getResourceConfiguration.calls.reset();


      fastTrakService.retrieveResources.calls.reset();


      fastTrakService.addResource.calls.reset();


      fastTrakService.updateResource.calls.reset();


      menuService.findMenuItemByPath.calls.reset();


      matDialog.open.calls.reset();


      fastTrakService.getDonorResponseConfiguration.and.returnValue(of(null));


      fastTrakService.getResourceConfiguration.and.returnValue(of(mockResourceConfig));


      menuService.findMenuItemByPath.and.returnValue(undefined);


    fixture = TestBed.createComponent(FastTrakWebConfiguration);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Component Initialization', () => {


    it('should initialize donorResponseForm with expected controls', () => {
      expect(component.donorResponseForm.contains('onlineResponsesFlag')).toBeTrue();
      expect(component.donorResponseForm.contains('multiLanguageFlag')).toBeTrue();
      expect(component.donorResponseForm.contains('effectiveDate')).toBeTrue();
      expect(component.donorResponseForm.contains('terminationDate')).toBeTrue();
    });






  });

  describe('Page Title', () => {
    it('should return default title when menu item not found', () => {
      expect(component.pageTitle()).toContain('FastTrak Web Configuration');
    });
  });

  describe('Type and Code Dropdowns', () => {
    it('should load code lookup list when type is selected as Question', fakeAsync(() => {
      fastTrakService.getResourceConfiguration.and.returnValue(of(mockResourceConfig));

      component.typeControl.setValue('Question');
      tick();

      expect(fastTrakService.getResourceConfiguration).toHaveBeenCalled();
      expect(component.codeLookupList.length).toBe(2);
    }));



    it('should set selectedCodeDetail when code is selected', fakeAsync(() => {
      const codeLookup: CodeLookup = { code: 'Q001', description: 'My Code Description' };
      component.codeControl.setValue(codeLookup);
      tick();

      expect(component.selectedCodeDetail).toBe('My Code Description');
    }));
  });

  describe('Retrieve Resources', () => {
    it('should not be enabled when type or code is not selected', () => {
      expect(component.isRetrieveEnabled).toBeFalse();
    });



    it('should call retrieveResources and populate data on success', fakeAsync(() => {
      component.typeControl.setValue('Question', { emitEvent: false });
      component.codeControl.setValue({ code: 'Q001', description: 'Test' }, { emitEvent: false });

      fastTrakService.retrieveResources.and.returnValue(of({
        success: true, message: 'ok', statusCode: 200,
        data: mockResources, total: 2
      }));

      component.onRetrieve();
      tick();

      expect(component.filteredResources.length).toBe(2);
      expect(component.isLoading).toBeFalse();
    }));


  });

  describe('Add and Edit Resource', () => {
    it('should not enable add when code is not selected', () => {
      expect(component.isAddNewResourceEnabled).toBeFalse();
    });



    it('should call addResource when dialog returns result', fakeAsync(() => {
      component.typeControl.setValue('Question', { emitEvent: false });
      component.codeControl.setValue({ code: 'Q001', description: 'Test' }, { emitEvent: false });

      const dialogResult = {
        mode: 'add' as const,
        code: 'Q001',
        locationLink: 'http://test.com',
        description: 'New',
        effectiveDate: todayStr,
        terminationDate: null
      };
      const afterClosedSubject = new Subject<any>();
      matDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);
      fastTrakService.addResource.and.returnValue(of({ success: true, message: 'Created', statusCode: 201, data: [], total: 0 }));
      fastTrakService.retrieveResources.and.returnValue(of({ success: true, message: 'ok', statusCode: 200, data: [], total: 0 }));

      component.onAddNewResource();
      afterClosedSubject.next(dialogResult);
      afterClosedSubject.complete();
      tick();

      expect(fastTrakService.addResource).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalled();
    }));
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      component.validHHResources = [...mockResources];
      component.filteredResources = [...mockResources];
      component.allResources = [...mockResources];
    });







    it('should toggle filter open state', () => {
      expect(component.isFilterOpen).toBeFalse();
      component.toggleFilter();
      expect(component.isFilterOpen).toBeTrue();
      component.toggleFilter();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('Donor Response Configuration', () => {
    it('should patch form with loaded configuration values', fakeAsync(() => {
      fastTrakService.getDonorResponseConfiguration.and.returnValue(of(mockDonorConfig));

      const newFixture = TestBed.createComponent(FastTrakWebConfiguration);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.donorResponseForm.get('onlineResponsesFlag')?.value).toBeTrue();
      expect(newComponent.donorResponseForm.get('multiLanguageFlag')?.value).toBeFalse();
    }));

    it('should save donor response config and show success snackbar', fakeAsync(() => {
      component.donorResponseForm.patchValue({
        onlineResponsesFlag: true,
        multiLanguageFlag: false,
        effectiveDate: moment()
      });
      component.donorResponseForm.markAsDirty();

      fastTrakService.saveDonorResponseConfiguration.and.returnValue(of({
        success: true, message: 'Saved', statusCode: 200, data: [], total: 0
      }));

      component.onSaveDonorResponseConfig();
      tick();

      expect(snackbarService.showSuccess).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    }));



    it('should clear changes and revert to original values', fakeAsync(() => {
      fastTrakService.getDonorResponseConfiguration.and.returnValue(of(mockDonorConfig));
      const newFixture = TestBed.createComponent(FastTrakWebConfiguration);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      newComponent.onFlagChange('onlineResponsesFlag', false);
      expect(newComponent.isDonorResponseDirty).toBeTrue();

      newComponent.onClearDonorResponseChanges();
      expect(newComponent.donorResponseForm.get('onlineResponsesFlag')?.value).toBeTrue();
      expect(newComponent.isDonorResponseDirty).toBeFalse();
    }));

    it('should lower minDate to the loaded past effectiveDate so the form stays valid', fakeAsync(() => {
      const pastDate = moment().subtract(30, 'days');
      const pastConfig = {
        onlineResponsesFlag: false,
        multiLanguageFlag: false,
        effectiveDate: pastDate,
        terminationDate: null as moment.Moment | null,
        auditKey: 2
      };
      fastTrakService.getDonorResponseConfiguration.and.returnValue(of(pastConfig));

      const newFixture = TestBed.createComponent(FastTrakWebConfiguration);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      // minDate should be adjusted to match the past effectiveDate
      expect(newComponent.minDate.format('YYYY-MM-DD')).toBe(pastDate.format('YYYY-MM-DD'));
      // Form must be valid after loading a past effectiveDate
      expect(newComponent.donorResponseForm.valid).toBeTrue();
    }));
  });

  describe('Tab Navigation', () => {
    it('should update selectedTabIndex on tab change', () => {
      component.onTabChange({ index: 1 } as any);
      expect(component.selectedTabIndex).toBe(1);
    });
  });

  describe('donorTerminationDateFilter', () => {


    it('should return false for a date before minDate (today)', () => {
      const pastDate = moment().subtract(2, 'days').startOf('day');
      expect(component.donorTerminationDateFilter(pastDate)).toBeFalse();
    });

    it('should return false for a date before the current effective date', () => {
      const futureEffective = moment().add(10, 'days');
      const beforeEffective = moment().add(5, 'days');
      component.donorResponseForm.get('effectiveDate')?.setValue(futureEffective, { emitEvent: false });
      expect(component.donorTerminationDateFilter(beforeEffective)).toBeFalse();
    });

    it('should return true for a date equal to the effective date', () => {
      const futureEffective = moment().add(5, 'days');
      component.donorResponseForm.get('effectiveDate')?.setValue(futureEffective, { emitEvent: false });
      expect(component.donorTerminationDateFilter(futureEffective.clone())).toBeTrue();
    });

    it('should return true for a date after both minDate and effective date', () => {
      const futureEffective = moment().add(5, 'days');
      const afterEffective = moment().add(10, 'days');
      component.donorResponseForm.get('effectiveDate')?.setValue(futureEffective, { emitEvent: false });
      expect(component.donorTerminationDateFilter(afterEffective)).toBeTrue();
    });

    it('should return true for a future date when no effective date is set', () => {
      component.donorResponseForm.get('effectiveDate')?.setValue(null, { emitEvent: false });
      const futureDate = moment().add(5, 'days');
      expect(component.donorTerminationDateFilter(futureDate)).toBeTrue();
    });
  });

  describe('Dirty tracking via valueChanges', () => {
    let loadedComponent: FastTrakWebConfiguration;

    beforeEach(fakeAsync(() => {
      fastTrakService.getDonorResponseConfiguration.and.returnValue(of(mockDonorConfig));
      const newFixture = TestBed.createComponent(FastTrakWebConfiguration);
      loadedComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();
    }));

    it('should set isDonorResponseDirty to true when effectiveDate changes', fakeAsync(() => {
      const newDate = moment().add(1, 'day');
      loadedComponent.donorResponseForm.get('effectiveDate')?.setValue(newDate);
      tick();
      expect(loadedComponent.isDonorResponseDirty).toBeTrue();
    }));

    it('should set isDonorResponseDirty to true when terminationDate changes', fakeAsync(() => {
      const termDate = moment().add(30, 'days');
      loadedComponent.donorResponseForm.get('terminationDate')?.setValue(termDate);
      tick();
      expect(loadedComponent.isDonorResponseDirty).toBeTrue();
    }));

    it('should keep isDonorResponseDirty false when effectiveDate reverts to original', fakeAsync(() => {
      const original = mockDonorConfig.effectiveDate.clone();
      const changed = moment().add(2, 'days');
      loadedComponent.donorResponseForm.get('effectiveDate')?.setValue(changed);
      tick();
      loadedComponent.donorResponseForm.get('effectiveDate')?.setValue(original);
      tick();
      expect(loadedComponent.isDonorResponseDirty).toBeFalse();
    }));

    it('should set donorLastChangedDateField to "effective" when effectiveDate changes', fakeAsync(() => {
      loadedComponent.donorResponseForm.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      tick();
      expect((loadedComponent as any).donorLastChangedDateField).toBe('effective');
    }));

    it('should set donorLastChangedDateField to "termination" when terminationDate changes', fakeAsync(() => {
      const termDate = moment().add(10, 'days');
      loadedComponent.donorResponseForm.get('terminationDate')?.setValue(termDate);
      tick();
      expect((loadedComponent as any).donorLastChangedDateField).toBe('termination');
    }));
  });

  describe('updateDonorTermMinDate via effectiveDate valueChanges', () => {
    it('should update minTermDate to the new effective date when it is after today', fakeAsync(() => {
      const futureDate = moment().add(10, 'days');
      component.donorResponseForm.get('effectiveDate')?.setValue(futureDate);
      tick();
      expect(component.minTermDate.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    }));

    it('should keep minTermDate as minDate when effective date is cleared', fakeAsync(() => {
      component.donorResponseForm.get('effectiveDate')?.setValue(null);
      tick();
      expect(component.minTermDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    }));
  });
  describe('Date Error Getters', () => {




    it('should return cross-field error on effective date when termination is before effective', fakeAsync(() => {
      const effDate = moment().add(10, 'days');
      const termDate = moment().add(5, 'days');
      component.donorResponseForm.get('effectiveDate')?.setValue(effDate);
      tick();
      component.donorResponseForm.get('terminationDate')?.setValue(termDate);
      tick();
      // lastChangedField is 'termination', so effective date error shows cross-field error only when 'effective'
      // force the field to effective to trigger the error display
      (component as any).donorLastChangedDateField = 'effective';
      component.donorResponseForm.get('effectiveDate')?.markAsTouched();
      expect(component.getDonorEffectiveDateError()).toBeTruthy();
    }));

    it('should return cross-field error on termination date when it is before effective date', fakeAsync(() => {
      const effDate = moment().add(10, 'days');
      const termDate = moment().add(5, 'days');
      component.donorResponseForm.get('effectiveDate')?.setValue(effDate);
      tick();
      component.donorResponseForm.get('terminationDate')?.setValue(termDate);
      component.donorResponseForm.get('terminationDate')?.markAsTouched();
      tick();
      expect(component.getDonorTerminationDateError()).toBeTruthy();
    }));
  });

  describe('Utility Methods', () => {
    it('should format valid date string to DD-MMM-YYYY uppercase', () => {
      expect(component.formatDateForDisplay('2026-01-15')).toBe('15-JAN-2026');
    });





    it('should compare codes correctly', () => {
      expect(component.compareCode({ code: 'A', description: '' }, { code: 'A', description: '' })).toBeTrue();
      expect(component.compareCode({ code: 'A', description: '' }, { code: 'B', description: '' })).toBeFalse();
    });
  });
});
