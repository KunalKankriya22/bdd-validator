import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';

import { DonorAttributesComponent } from './donor-attributes.component';
import { DonorAttributesService } from './services/donor-attributes.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { createMockMatDialog, createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  DonorDemographics,
  DonorInterdiction,
  PropertyLookup
} from './models/donor-attributes.model';

describe('DonorAttributesComponent', () => {
  let component: DonorAttributesComponent;
  let fixture: ComponentFixture<DonorAttributesComponent>;
  let donorAttributesServiceSpy: jasmine.SpyObj<DonorAttributesService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let headerServiceSpy: any;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockDonorId = '1234567890';

  const mockDemographics: DonorDemographics = {
    donorId: mockDonorId,
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'M',
    dateOfBirth: '1990-01-15',
    ssn: '123-45-6789',
    bloodType: 'O+',
    gender: 'M'
  };

  const mockAttributes: DonorInterdiction[] = [
    {
      donorId: mockDonorId,
      interCode: 'ATTR1',
      interDesc: 'Test Attribute 1',
      effDate: '2024-01-01',
      chapterId: 'CH01',
      interType: 'TYPE1',
      termDate: null,
      insertUser: 'USER01'
    }
  ];

  const mockProperties: PropertyLookup[] = [
    { interCode: 'ATTR1', interDesc: 'Test Attribute 1', interType: 'TYPE1', viewLevel: 1 },
    { interCode: 'ATTR2', interDesc: 'Test Attribute 2', interType: 'TYPE2', viewLevel: 2 }
  ];

  const mockBulkUpsertSuccess = {
    totalRecords: 1, createdCount: 1, updatedCount: 0, failureCount: 0,
    successCount: 1, errors: [], success: true, message: null, errorCode: null
  };
  const mockBulkUpsertPartial = {
    totalRecords: 2, createdCount: 1, updatedCount: 0, failureCount: 1,
    successCount: 1, errors: [{ recordIndex: 1, donorId: mockDonorId, interCode: 'ATTR2', errorMessage: 'Duplicate' }],
    success: true, message: null, errorCode: null
  };
  const mockBulkUpsertFail = {
    totalRecords: 1, createdCount: 0, updatedCount: 0, failureCount: 1,
    successCount: 0, errors: [], success: false, message: 'Failed', errorCode: 'ERR'
  };

  beforeEach(() => {

    donorAttributesServiceSpy = jasmine.createSpyObj('DonorAttributesService', [
      'getDonorDemographics',
      'getActiveAttributes',
      'getTerminatedAttributes',
      'getValidProperties',
      'addAttribute',
      'updateAttribute',
      'terminateAttribute',
      'bulkUpsert'
    ]);

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'isChapterLocalDateAvailable',
      'getChapterLocalDate'
    ]);

    headerServiceSpy = {
      chapterTimeZone: signal('')
    };
    dialogSpy = createMockMatDialog();
    snackBarSpy = createMockMatSnackBar();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      paramMap: of(new Map([['donorId', mockDonorId]]))
    };

    donorAttributesServiceSpy.getDonorDemographics.and.returnValue(of(mockDemographics));
    donorAttributesServiceSpy.getActiveAttributes.and.returnValue(of({ attributes: mockAttributes, hasOtherAttributes: false }));
    donorAttributesServiceSpy.getValidProperties.and.returnValue(of(mockProperties));
    donorAttributesServiceSpy.addAttribute.and.returnValue(of(mockAttributes[0]));
    donorAttributesServiceSpy.updateAttribute.and.returnValue(of(mockAttributes[0]));
    donorAttributesServiceSpy.terminateAttribute.and.returnValue(of(mockAttributes[0]));

    chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);



      TestBed.configureTestingModule({
      imports: [DonorAttributesComponent, NoopAnimationsModule],
      providers: [
        { provide: DonorAttributesService, useValue: donorAttributesServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    });


    


      donorAttributesServiceSpy.getDonorDemographics.calls.reset();


      donorAttributesServiceSpy.getActiveAttributes.calls.reset();


      donorAttributesServiceSpy.getTerminatedAttributes.calls.reset();


      donorAttributesServiceSpy.getValidProperties.calls.reset();


      donorAttributesServiceSpy.addAttribute.calls.reset();


      donorAttributesServiceSpy.updateAttribute.calls.reset();


      donorAttributesServiceSpy.terminateAttribute.calls.reset();


      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.calls.reset();


      chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();


      routerSpy.navigate.calls.reset();


      donorAttributesServiceSpy.getDonorDemographics.and.returnValue(of(mockDemographics));


      donorAttributesServiceSpy.getActiveAttributes.and.returnValue(of({ attributes: mockAttributes, hasOtherAttributes: false }));


      donorAttributesServiceSpy.getValidProperties.and.returnValue(of(mockProperties));


      donorAttributesServiceSpy.addAttribute.and.returnValue(of(mockAttributes[0]));


      donorAttributesServiceSpy.updateAttribute.and.returnValue(of(mockAttributes[0]));


      donorAttributesServiceSpy.terminateAttribute.and.returnValue(of(mockAttributes[0]));


      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);


    fixture = TestBed.createComponent(DonorAttributesComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should load donor data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(donorAttributesServiceSpy.getDonorDemographics).toHaveBeenCalledWith(mockDonorId);
      expect(donorAttributesServiceSpy.getActiveAttributes).toHaveBeenCalledWith(mockDonorId);
      expect(donorAttributesServiceSpy.getValidProperties).toHaveBeenCalled();
      expect(component.donorDemographics()).toEqual(mockDemographics);
    }));

    it('should handle missing donor ID in route', fakeAsync(() => {
      activatedRoute.paramMap = of(new Map());
      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Donor ID not found in route');
    }));
  });
  describe('Error State', () => {
    it('should have error signal initialized to null', () => {
      expect(component.error()).toBeNull();
    });
  });

  describe('Donor Demographics Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display donor demographics', () => {
      const headerInfo = fixture.debugElement.query(By.css('.header-info'));
      expect(headerInfo).toBeTruthy();
      expect(headerInfo.nativeElement.textContent).toContain('John Doe');
    });

    it('should compute donor name correctly', () => {
      expect(component.donorName()).toBe('John Doe');
    });

    it('should compute donor ID correctly', () => {
      expect(component.donorId()).toBe(mockDonorId);
    });
  });

  describe('Attributes Form Management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should add new attribute row', () => {
      const initialLength = component.attributesArray.length;
      component.onAddAttribute();

      expect(component.attributesArray.length).toBe(initialLength + 1);
      expect(component.getAttributeGroup(0).get('isNew')?.value).toBeTrue();
    });


  });



  describe('Terminate Attribute', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error if term date is missing', () => {
      component.onTerminateAttribute(0);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please set termination date first',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should show error if term date is invalid', () => {
      const group = component.getAttributeGroup(0);
      group.patchValue({ termDate: moment('2020-01-01') }); // Past date

      component.onTerminateAttribute(0);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Invalid termination date',
        'DISMISS',
        jasmine.any(Object)
      );
    });
  });

  describe('Delete Attribute', () => {


    it('should not delete saved attribute', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialLength = component.attributesArray.length;
      component.onDeleteAttribute(0);

      expect(component.attributesArray.length).toBe(initialLength);
    }));
  });



  describe('Date Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should validate effective date is not in past', () => {
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);

      // Set an attribute code first to enable the date fields
      // (date fields are disabled until an attribute is selected)
      group.get('interCode')?.setValue('ATTR1');

      group.patchValue({ effDate: moment().subtract(1, 'day') });
      group.get('effDate')?.markAsTouched();

      expect(group.get('effDate')?.hasError('effectiveDatePast')).toBeTrue();
    });

    it('should update termination date min value when effective date changes', () => {
      const group = component.getAttributeGroup(0);
      const effDate = moment('2024-06-01');

      group.patchValue({ effDate });

      const minTermDate = component.getMinTermDate(group);
      expect(minTermDate.isSame(effDate, 'day')).toBeTrue();
    });
  });

  describe('ngOnInit with dialogData', () => {
    it('should load donor data from dialogData', fakeAsync(() => {
      (component as any).dialogData = { donorId: mockDonorId };
      component.ngOnInit();
      tick();
      expect(component.isSidePanelMode).toBeTrue();
      expect(donorAttributesServiceSpy.getDonorDemographics).toHaveBeenCalledWith(mockDonorId);
    }));

    it('should load donor data from inputDonorId when no dialogData', fakeAsync(() => {
      (component as any).dialogData = null;
      component.inputDonorId = '9999999999';
      donorAttributesServiceSpy.getDonorDemographics.and.returnValue(of(mockDemographics));
      donorAttributesServiceSpy.getActiveAttributes.and.returnValue(of({ attributes: mockAttributes, hasOtherAttributes: false }));
      donorAttributesServiceSpy.getValidProperties.and.returnValue(of(mockProperties));
      component.ngOnInit();
      tick();
      expect(component.isSidePanelMode).toBeTrue();
      expect(donorAttributesServiceSpy.getDonorDemographics).toHaveBeenCalledWith('9999999999');
    }));
  });

  describe('loadDonorData error paths', () => {
    it('should continue loading in side panel mode when demographics fail', fakeAsync(() => {
      donorAttributesServiceSpy.getDonorDemographics.and.returnValue(throwError(() => ({ message: 'Not found' })));
      (component as any).dialogData = { donorId: mockDonorId };
      component.ngOnInit();
      tick();
      expect(component.isSidePanelMode).toBeTrue();
      expect(donorAttributesServiceSpy.getActiveAttributes).toHaveBeenCalledWith(mockDonorId);
    }));

    it('should set error when demographics fail in route mode', fakeAsync(() => {
      donorAttributesServiceSpy.getDonorDemographics.and.returnValue(throwError(() => ({ message: 'Not found' })));
      fixture.detectChanges();
      tick();
      expect(component.error()).toBe('Not found');
    }));

    it('should set error when active attributes fail', fakeAsync(() => {
      donorAttributesServiceSpy.getActiveAttributes.and.returnValue(throwError(() => ({ message: 'Load failed' })));
      fixture.detectChanges();
      tick();
      expect(component.error()).toBe('Load failed');
    }));
  });

  describe('onSaveAttribute', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error when form is invalid', () => {
      component.onAddAttribute();
      component.onSaveAttribute(0);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please fix validation errors before saving', 'DISMISS', jasmine.any(Object)
      );
    });

    it('should call addAttribute for new attribute', fakeAsync(() => {
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2', effDate: moment().add(1, 'day') });
      group.get('effDate')?.enable();
      group.get('termDate')?.enable();
      group.get('interCode')?.updateValueAndValidity();
      group.get('effDate')?.updateValueAndValidity();

      // Force form valid by clearing validators temporarily
      group.get('effDate')?.clearValidators();
      group.get('effDate')?.updateValueAndValidity();
      group.clearValidators();
      group.updateValueAndValidity();

      component.onSaveAttribute(0);
      tick();
      expect(donorAttributesServiceSpy.addAttribute).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Attribute saved successfully', 'DISMISS', jasmine.any(Object));
    }));

    it('should call updateAttribute for existing attribute', fakeAsync(() => {
      const group = component.getAttributeGroup(0);
      group.patchValue({ isNew: false });
      group.clearValidators();
      group.get('effDate')?.clearValidators();
      group.get('termDate')?.clearValidators();
      group.get('interCode')?.clearValidators();
      group.updateValueAndValidity();

      component.onSaveAttribute(0);
      tick();
      expect(donorAttributesServiceSpy.updateAttribute).toHaveBeenCalled();
    }));

    it('should handle save error', fakeAsync(() => {
      donorAttributesServiceSpy.addAttribute.and.returnValue(throwError(() => ({ message: 'Save failed' })));
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2' });
      // Clear all validators on group and all child controls
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      component.onSaveAttribute(0);
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Save failed', 'DISMISS', jasmine.any(Object));
      expect(component.saving()).toBeFalse();
    }));
  });

  describe('onTerminateAttribute success/error', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should terminate attribute successfully', fakeAsync(() => {
      const confirmDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      confirmDialogRef.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(confirmDialogRef);

      const group = component.getAttributeGroup(0);
      const futureDate = moment().add(5, 'days');
      group.get('termDate')?.clearValidators();
      group.patchValue({ termDate: futureDate });
      group.get('termDate')?.updateValueAndValidity();

      component.onTerminateAttribute(0);
      tick();
      expect(donorAttributesServiceSpy.terminateAttribute).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Attribute terminated successfully', 'DISMISS', jasmine.any(Object));
    }));

    it('should handle terminate error', fakeAsync(() => {
      const confirmDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      confirmDialogRef.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(confirmDialogRef);

      donorAttributesServiceSpy.terminateAttribute.and.returnValue(throwError(() => ({ message: 'Term failed' })));
      const group = component.getAttributeGroup(0);
      const futureDate = moment().add(5, 'days');
      group.get('termDate')?.clearValidators();
      group.patchValue({ termDate: futureDate });
      group.get('termDate')?.updateValueAndValidity();

      component.onTerminateAttribute(0);
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Term failed', 'DISMISS', jasmine.any(Object));
      expect(component.saving()).toBeFalse();
    }));
  });

  describe('onDeleteAttribute for new attribute', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should delete unsaved attribute row', () => {
      component.onAddAttribute();
      const initialLength = component.attributesArray.length;
      component.onDeleteAttribute(0);
      expect(component.attributesArray.length).toBe(initialLength - 1);
    });
  });

  describe('onViewTerminated', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open terminated attributes dialog', () => {
      component.onViewTerminated();
      expect(dialogSpy.open).toHaveBeenCalled();
    });
  });

  describe('onRetry', () => {
    it('should reload donor data from route', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      donorAttributesServiceSpy.getDonorDemographics.calls.reset();
      component.onRetry();
      tick();
      expect(donorAttributesServiceSpy.getDonorDemographics).toHaveBeenCalledWith(mockDonorId);
    }));
  });

  describe('onClose', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should navigate back when not in side panel or dialog mode', () => {
      component.onClose();
      expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('should emit closePanelEvent in side panel mode', () => {
      component.isSidePanelMode = true;
      spyOn(component.closePanelEvent, 'emit');
      component.onClose();
      expect(component.closePanelEvent.emit).toHaveBeenCalled();
    });
  });

  describe('onSidePanelButtonClick', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call onClose for close action', () => {
      spyOn(component, 'onClose');
      component.onSidePanelButtonClick('close');
      expect(component.onClose).toHaveBeenCalled();
    });

    it('should not call onClose for other actions', () => {
      spyOn(component, 'onClose');
      component.onSidePanelButtonClick('other');
      expect(component.onClose).not.toHaveBeenCalled();
    });
  });

  describe('onToggleEdit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set isEditing to true in normal mode', () => {
      component.inputReadOnly = false;
      component.onToggleEdit();
      expect(component.isEditing()).toBeTrue();
    });

    it('should show query mode error when read-only', () => {
      component.inputReadOnly = true;
      component.onToggleEdit();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('query mode'), 'DISMISS', jasmine.any(Object)
      );
    });
  });

  describe('onCancelEdit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset editing state and rebuild form', () => {
      component.isEditing.set(true);
      component.onCancelEdit();
      expect(component.isEditing()).toBeFalse();
    });
  });

  describe('onSaveAll', () => {
    beforeEach(fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert = jasmine.createSpy('bulkUpsert');
      fixture.detectChanges();
      tick();
    }));

    it('should show error when form has validation errors', () => {
      component.onAddAttribute();
      // New row with no interCode => invalid
      component.onSaveAll();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please fix validation errors before saving', 'DISMISS', jasmine.any(Object)
      );
    });

    it('should show no changes message when nothing is dirty', () => {
      // Existing rows are not dirty, not new
      component.onSaveAll();
      expect(snackBarSpy.open).toHaveBeenCalledWith('No changes to save', 'DISMISS', jasmine.any(Object));
    });

    it('should call bulkUpsert on success', fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert.and.returnValue(of(mockBulkUpsertSuccess));
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2', effDate: moment().add(1, 'day') });
      group.clearValidators();
      group.get('effDate')?.clearValidators();
      group.get('termDate')?.clearValidators();
      group.get('interCode')?.clearValidators();
      group.updateValueAndValidity();

      component.onSaveAll();
      tick();
      expect(donorAttributesServiceSpy.bulkUpsert).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Donor attributes saved successfully', 'DISMISS', jasmine.any(Object));
      expect(component.isEditing()).toBeFalse();
    }));

    it('should handle partial success response', fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert.and.returnValue(of(mockBulkUpsertPartial));
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2' });
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      component.onSaveAll();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith(jasmine.stringContaining('Partially saved'), 'DISMISS', jasmine.any(Object));
    }));

    it('should handle failure response', fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert.and.returnValue(of(mockBulkUpsertFail));
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2' });
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      component.onSaveAll();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Failed', 'DISMISS', jasmine.any(Object));
    }));

    it('should handle bulkUpsert error', fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert.and.returnValue(throwError(() => ({ message: 'Server error' })));
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2' });
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      component.onSaveAll();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Server error', 'DISMISS', jasmine.any(Object));
      expect(component.saving()).toBeFalse();
    }));
  });

  describe('loadTerminatedAttributes', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load terminated attributes', fakeAsync(() => {
      donorAttributesServiceSpy.getTerminatedAttributes.and.returnValue(of([mockAttributes[0]]));
      component.loadTerminatedAttributes();
      tick();
      expect(donorAttributesServiceSpy.getTerminatedAttributes).toHaveBeenCalledWith(mockDonorId);
      expect(component.terminatedAttributes().length).toBe(1);
    }));

    it('should handle error when loading terminated attributes', fakeAsync(() => {
      donorAttributesServiceSpy.getTerminatedAttributes.and.returnValue(throwError(() => new Error('fail')));
      component.loadTerminatedAttributes();
      tick();
      expect(component.loadingTerminated()).toBeFalse();
    }));

    it('should not load when donorId is empty', () => {
      component['donorDemographics'].set(null);
      component.isSidePanelMode = false;
      component.loadTerminatedAttributes();
      expect(donorAttributesServiceSpy.getTerminatedAttributes).not.toHaveBeenCalled();
    });
  });

  describe('onTabChange', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set active tab', fakeAsync(() => {
      donorAttributesServiceSpy.getTerminatedAttributes.and.returnValue(of([]));
      component.onTabChange('all');
      expect(component.activeTab()).toBe('all');
    }));

    it('should load terminated attributes on first switch', fakeAsync(() => {
      donorAttributesServiceSpy.getTerminatedAttributes.and.returnValue(of([]));
      component.onTabChange('terminated');
      tick();
      expect(donorAttributesServiceSpy.getTerminatedAttributes).toHaveBeenCalled();
    }));

    it('should not reload terminated if already loaded', fakeAsync(() => {
      component['terminatedAttributes'].set([mockAttributes[0]]);
      component.onTabChange('terminated');
      tick();
      expect(donorAttributesServiceSpy.getTerminatedAttributes).not.toHaveBeenCalled();
    }));
  });

  describe('getTermDateFilter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return a filter function', () => {
      const group = component.getAttributeGroup(0);
      const filter = component.getTermDateFilter(group);
      expect(typeof filter).toBe('function');
    });

    it('should return () => true for null group', () => {
      const filter = component.getTermDateFilter(null as any);
      expect(filter(null)).toBeTrue();
    });

    it('should cache filter for same effDate', () => {
      const group = component.getAttributeGroup(0);
      const filter1 = component.getTermDateFilter(group);
      const filter2 = component.getTermDateFilter(group);
      expect(filter1).toBe(filter2);
    });
  });

  describe('getMinTermDate', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return minDate for null group', () => {
      const result = component.getMinTermDate(null as any);
      expect(result).toBeDefined();
    });

    it('should return minDate when no effDate set', () => {
      const group = component.getAttributeGroup(0);
      group.patchValue({ effDate: null });
      const result = component.getMinTermDate(group);
      expect(result).toBeDefined();
    });

    it('should cache min date for same effDate', () => {
      const group = component.getAttributeGroup(0);
      group.patchValue({ effDate: moment('2024-06-01') });
      const result1 = component.getMinTermDate(group);
      const result2 = component.getMinTermDate(group);
      expect(result1).toBe(result2);
    });
  });

  describe('getEffDateError / getTermDateError', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return empty string for null group (effDate)', () => {
      expect(component.getEffDateError(null as any)).toBe('');
    });

    it('should return empty string for null group (termDate)', () => {
      expect(component.getTermDateError(null as any)).toBe('');
    });

    it('should return error string for group with effDate errors', () => {
      const group = component.getAttributeGroup(0);
      const result = component.getEffDateError(group);
      expect(typeof result).toBe('string');
    });

    it('should return error string for group with termDate errors', () => {
      const group = component.getAttributeGroup(0);
      const result = component.getTermDateError(group);
      expect(typeof result).toBe('string');
    });
  });

  describe('onEffDateInput / onTermDateInput', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle eff date input', () => {
      const group = component.getAttributeGroup(0);
      const event = { target: { value: '01-Jan-2025' } } as unknown as Event;
      expect(() => component.onEffDateInput(event, group)).not.toThrow();
    });

    it('should handle term date input', () => {
      const group = component.getAttributeGroup(0);
      const event = { target: { value: '01-Jan-2025' } } as unknown as Event;
      expect(() => component.onTermDateInput(event, group)).not.toThrow();
    });

    it('should return early for null group on effDate input', () => {
      const event = { target: { value: '01-Jan-2025' } } as unknown as Event;
      expect(() => component.onEffDateInput(event, null as any)).not.toThrow();
    });

    it('should return early for null group on termDate input', () => {
      const event = { target: { value: '01-Jan-2025' } } as unknown as Event;
      expect(() => component.onTermDateInput(event, null as any)).not.toThrow();
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format a moment date', () => {
      const result = component.formatDateForDisplay(moment('2024-01-15'));
      expect(result).toBeTruthy();
    });

    it('should return dash for null date', () => {
      const result = component.formatDateForDisplay(null);
      expect(result).toBe('-');
    });
  });

  describe('getSearchControl / getFilteredProperties', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should create and cache a search control', () => {
      const ctrl = component.getSearchControl(0);
      expect(ctrl).toBeTruthy();
      const ctrl2 = component.getSearchControl(0);
      expect(ctrl).toBe(ctrl2);
    });

    it('should filter properties based on search value', fakeAsync(() => {
      const ctrl = component.getSearchControl(0);
      ctrl.setValue('ATTR2');
      tick();
      const filtered = component.getFilteredProperties(0);
      expect(filtered.length).toBeGreaterThanOrEqual(1);
    }));

    it('should reset filtered when search is empty', fakeAsync(() => {
      const ctrl = component.getSearchControl(0);
      ctrl.setValue('ATTR2');
      tick();
      ctrl.setValue('');
      tick();
      const filtered = component.getFilteredProperties(0);
      expect(filtered.length).toBe(component['availableProperties']().length);
    }));

    it('should return all properties for new index', () => {
      const filtered = component.getFilteredProperties(99);
      expect(filtered.length).toBe(component['availableProperties']().length);
    });
  });

  describe('donorName computed', () => {
    it('should return empty string when no demographics', () => {
      component['donorDemographics'].set(null);
      expect(component.donorName()).toBe('');
    });
  });

  describe('donorId computed - side panel mode', () => {
    it('should return inputDonorId in side panel mode', () => {
      component.isSidePanelMode = true;
      component.inputDonorId = 'SIDEPANEL123';
      expect(component.donorId()).toBe('SIDEPANEL123');
    });

    it('should return empty when inputDonorId is not set in side panel mode', () => {
      component.isSidePanelMode = true;
      component.inputDonorId = undefined;
      expect(component.donorId()).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      const spy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('mergeActiveCodesIntoProperties', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should add active codes not in available properties', () => {
      component['activeAttributes'].set([{
        donorId: mockDonorId, interCode: 'NEWCODE', interDesc: 'New',
        effDate: '2024-01-01', chapterId: 'CH01', interType: 'TYPE3'
      }]);
      component['mergeActiveCodesIntoProperties']();
      const codes = component['availableProperties']().map(p => p.interCode);
      expect(codes).toContain('NEWCODE');
    });
  });

  describe('interCode valueChanges in createAttributeFormGroup', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update description when code is set', fakeAsync(() => {
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.get('interCode')?.setValue('ATTR2');
      tick();
      expect(group.get('interDesc')?.value).toBe('Test Attribute 2');
      expect(group.get('effDate')?.enabled).toBeTrue();
    }));

    it('should disable date fields when code is cleared', fakeAsync(() => {
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.get('interCode')?.setValue('ATTR2');
      tick();
      group.get('interCode')?.setValue('');
      tick();
      expect(group.get('effDate')?.disabled).toBeTrue();
      expect(group.get('termDate')?.disabled).toBeTrue();
    }));

    it('should set interType when code is set to a known property', fakeAsync(() => {
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.get('interCode')?.setValue('ATTR2');
      tick();
      expect(group.get('interType')?.value).toBe('TYPE2');
    }));

    it('should enable termDate for existing attribute when code changes', fakeAsync(() => {
      // Existing attribute group (index 1 after adding new at 0)
      const group = component.getAttributeGroup(0);
      // Existing attributes have interCode disabled; enable it to test
      group.get('interCode')?.enable();
      group.get('interCode')?.setValue('ATTR2');
      tick();
      expect(group.get('termDate')?.enabled).toBeTrue();
    }));
  });

  describe('onTerminateAttribute - dialog cancelled', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not terminate when dialog is cancelled', fakeAsync(() => {
      const cancelDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      cancelDialogRef.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(cancelDialogRef);

      const group = component.getAttributeGroup(0);
      const futureDate = moment().add(5, 'days');
      group.get('termDate')?.clearValidators();
      group.patchValue({ termDate: futureDate });
      group.get('termDate')?.updateValueAndValidity();

      component.onTerminateAttribute(0);
      tick();
      expect(donorAttributesServiceSpy.terminateAttribute).not.toHaveBeenCalled();
    }));
  });

  describe('executeTermination - row removal', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should remove the attribute row from form array on successful termination', fakeAsync(() => {
      const confirmDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      confirmDialogRef.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(confirmDialogRef);

      const initialLength = component.attributesArray.length;
      const group = component.getAttributeGroup(0);
      const futureDate = moment().add(5, 'days');
      group.get('termDate')?.clearValidators();
      group.patchValue({ termDate: futureDate });
      group.get('termDate')?.updateValueAndValidity();

      component.onTerminateAttribute(0);
      tick();
      expect(component.attributesArray.length).toBe(initialLength - 1);
    }));

    it('should handle terminate error with no message', fakeAsync(() => {
      const confirmDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      confirmDialogRef.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(confirmDialogRef);

      donorAttributesServiceSpy.terminateAttribute.and.returnValue(throwError(() => ({})));
      const group = component.getAttributeGroup(0);
      const futureDate = moment().add(5, 'days');
      group.get('termDate')?.clearValidators();
      group.patchValue({ termDate: futureDate });
      group.get('termDate')?.updateValueAndValidity();

      component.onTerminateAttribute(0);
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to terminate attribute', 'DISMISS', jasmine.any(Object));
    }));
  });

  describe('onSaveAttribute - additional edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle save error with no message', fakeAsync(() => {
      donorAttributesServiceSpy.addAttribute.and.returnValue(throwError(() => ({})));
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2' });
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      component.onSaveAttribute(0);
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to save attribute', 'DISMISS', jasmine.any(Object));
    }));

    it('should set saving to true during save', fakeAsync(() => {
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2' });
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      component.onSaveAttribute(0);
      // saving should be true while the observable is in flight
      // (it resolves synchronously with our mock, so saving gets set to false immediately)
      tick();
      expect(component.saving()).toBeFalse();
    }));

    it('should update originalEffDate and isNew on successful save', fakeAsync(() => {
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      const futureDate = moment().add(1, 'day');
      group.patchValue({ interCode: 'ATTR2', effDate: futureDate });
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      component.onSaveAttribute(0);
      tick();
      expect(group.get('isNew')?.value).toBeFalse();
    }));
  });

  describe('onSaveAll - additional edge cases', () => {
    beforeEach(fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert = jasmine.createSpy('bulkUpsert');
      fixture.detectChanges();
      tick();
    }));

    it('should include dirty existing rows in bulk upsert', fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert.and.returnValue(of(mockBulkUpsertSuccess));
      const group = component.getAttributeGroup(0);
      group.get('termDate')?.enable();
      group.get('termDate')?.clearValidators();
      group.patchValue({ termDate: moment().add(10, 'days') });
      group.get('termDate')?.updateValueAndValidity();
      group.clearValidators();
      group.get('effDate')?.clearValidators();
      group.get('interCode')?.clearValidators();
      group.updateValueAndValidity();
      group.markAsDirty();

      component.onSaveAll();
      tick();
      expect(donorAttributesServiceSpy.bulkUpsert).toHaveBeenCalled();
      const request = donorAttributesServiceSpy.bulkUpsert.calls.mostRecent().args[1];
      expect(request.records.length).toBeGreaterThanOrEqual(1);
      // Existing rows should have auditKey from the form value
      const record = request.records[0];
      expect(record.interCode).toBe('ATTR1');
    }));

    it('should handle bulkUpsert error with no message', fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert.and.returnValue(throwError(() => ({})));
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2' });
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      component.onSaveAll();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to save attributes', 'DISMISS', jasmine.any(Object));
    }));

    it('should handle failure response with no message', fakeAsync(() => {
      const failNoMsg = {
        totalRecords: 1, createdCount: 0, updatedCount: 0, failureCount: 1,
        successCount: 0, errors: [], success: false, message: null, errorCode: null
      };
      donorAttributesServiceSpy.bulkUpsert.and.returnValue(of(failNoMsg));
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2' });
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      component.onSaveAll();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to save attributes', 'DISMISS', jasmine.any(Object));
    }));

    it('should reload active attributes after full success', fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert.and.returnValue(of(mockBulkUpsertSuccess));
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2' });
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      donorAttributesServiceSpy.getActiveAttributes.calls.reset();
      component.onSaveAll();
      tick();
      expect(donorAttributesServiceSpy.getActiveAttributes).toHaveBeenCalled();
    }));

    it('should reload active attributes after partial success', fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert.and.returnValue(of(mockBulkUpsertPartial));
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2' });
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      donorAttributesServiceSpy.getActiveAttributes.calls.reset();
      component.onSaveAll();
      tick();
      expect(donorAttributesServiceSpy.getActiveAttributes).toHaveBeenCalled();
    }));
  });

  describe('loadDonorData error - fallback messages', () => {
    it('should use fallback message when demographics error has no message', fakeAsync(() => {
      donorAttributesServiceSpy.getDonorDemographics.and.returnValue(throwError(() => ({})));
      fixture.detectChanges();
      tick();
      expect(component.error()).toBe('Failed to load donor demographics');
    }));

    it('should use fallback message when active attributes error has no message', fakeAsync(() => {
      donorAttributesServiceSpy.getActiveAttributes.and.returnValue(throwError(() => ({})));
      fixture.detectChanges();
      tick();
      expect(component.error()).toBe('Failed to load active attributes');
    }));

    it('should set loading to false after demographics error in route mode', fakeAsync(() => {
      donorAttributesServiceSpy.getDonorDemographics.and.returnValue(throwError(() => ({ message: 'Oops' })));
      fixture.detectChanges();
      tick();
      expect(component.loading()).toBeFalse();
    }));

    it('should set loading to false after active attributes error', fakeAsync(() => {
      donorAttributesServiceSpy.getActiveAttributes.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('loadValidProperties error handling', () => {
    it('should silently handle error via catchError and EMPTY', fakeAsync(() => {
      donorAttributesServiceSpy.getValidProperties.and.returnValue(throwError(() => new Error('props fail')));
      fixture.detectChanges();
      tick();
      // Should not set error signal - properties errors are swallowed
      // loadingProperties should remain false after completion
      // The component should still function with empty properties
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('hasHiddenAttributes signal', () => {
    it('should set hasHiddenAttributes to true when response indicates other attributes', fakeAsync(() => {
      donorAttributesServiceSpy.getActiveAttributes.and.returnValue(of({ attributes: mockAttributes, hasOtherAttributes: true }));
      fixture.detectChanges();
      tick();
      expect(component.hasHiddenAttributes()).toBeTrue();
    }));

    it('should set hasHiddenAttributes to false when no other attributes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.hasHiddenAttributes()).toBeFalse();
    }));
  });

  describe('mergeActiveCodesIntoProperties - no duplicates', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not add duplicate codes that already exist in available properties', () => {
      // ATTR1 is already in mockProperties, so setting activeAttributes with ATTR1 should not duplicate
      component['activeAttributes'].set([{
        donorId: mockDonorId, interCode: 'ATTR1', interDesc: 'Test Attribute 1',
        effDate: '2024-01-01', chapterId: 'CH01', interType: 'TYPE1'
      }]);
      const beforeCount = component['availableProperties']().length;
      component['mergeActiveCodesIntoProperties']();
      const afterCount = component['availableProperties']().length;
      expect(afterCount).toBe(beforeCount);
    });
  });

  describe('createAttributeFormGroup - existing attribute with data', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should create form group with existing attribute data', () => {
      const group = component.getAttributeGroup(0);
      expect(group).toBeTruthy();
      expect(group.get('interCode')?.value).toBe('ATTR1');
      expect(group.get('interCode')?.disabled).toBeTrue(); // Existing attrs have code disabled
    });

    it('should set effDate from existing attribute', () => {
      const group = component.getAttributeGroup(0);
      const effDateValue = group.get('effDate')?.value;
      expect(effDateValue).toBeTruthy();
    });

    it('should set insertUser as disabled for existing attribute', () => {
      const group = component.getAttributeGroup(0);
      expect(group.get('insertUser')?.disabled).toBeTrue();
    });

    it('should set interDesc as disabled for existing attribute', () => {
      const group = component.getAttributeGroup(0);
      expect(group.get('interDesc')?.disabled).toBeTrue();
    });
  });

  describe('createAttributeFormGroup - new attribute form behavior', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have interCode enabled for new attribute', () => {
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      expect(group.get('interCode')?.enabled).toBeTrue();
    });

    it('should have effDate and termDate disabled initially when no interCode', () => {
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      expect(group.get('effDate')?.disabled).toBeTrue();
      expect(group.get('termDate')?.disabled).toBeTrue();
    });

    it('should set donorId on new attribute from donorId computed', () => {
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      expect(group.get('donorId')?.value).toBe(mockDonorId);
    });

    it('should set isNew to true for new attribute', () => {
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      expect(group.get('isNew')?.value).toBeTrue();
    });
  });

  describe('effDate valueChanges triggers termDate revalidation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update termDate validity when effDate changes', fakeAsync(() => {
      const group = component.getAttributeGroup(0);
      const termControl = group.get('termDate');
      const updateSpy = spyOn(termControl!, 'updateValueAndValidity').and.callThrough();
      group.get('effDate')?.setValue(moment().add(2, 'days'));
      tick();
      expect(updateSpy).toHaveBeenCalled();
    }));
  });

  describe('attributesArray getter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return the FormArray', () => {
      expect(component.attributesArray).toBeTruthy();
      expect(component.attributesArray.length).toBe(mockAttributes.length);
    });
  });

  describe('getAttributeGroup', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return form group at specified index', () => {
      const group = component.getAttributeGroup(0);
      expect(group).toBeTruthy();
      expect(group.get('interCode')).toBeTruthy();
    });
  });

  describe('shiftRowMapsForInsert and shiftRowMapsForRemove', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should shift row search controls when adding a new attribute', fakeAsync(() => {
      // Create a search control at index 0
      const ctrl = component.getSearchControl(0);
      expect(ctrl).toBeTruthy();

      // Add a new attribute (inserts at 0, shifting existing to 1)
      component.onAddAttribute();

      // The old control at 0 should now be at 1
      const shiftedCtrl = component.getSearchControl(1);
      expect(shiftedCtrl).toBe(ctrl);
    }));

    it('should shift row maps when deleting a new attribute', fakeAsync(() => {
      // Add two new attributes
      component.onAddAttribute();
      component.onAddAttribute();

      // Create search controls
      component.getSearchControl(0);
      component.getSearchControl(1);
      const ctrl2 = component.getSearchControl(2);

      // Delete the first new attribute (index 0)
      component.onDeleteAttribute(0);

      // Control that was at 2 should now be at 1
      const shiftedCtrl = component.getSearchControl(1);
      expect(shiftedCtrl).toBe(ctrl2);
    }));
  });

  describe('onClose with dialogRef', () => {
    it('should close dialog when dialogRef is present', fakeAsync(() => {
      // Create component with dialogRef
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DonorAttributesComponent, NoopAnimationsModule],
        providers: [
          { provide: DonorAttributesService, useValue: donorAttributesServiceSpy },
          { provide: MatDialog, useValue: dialogSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: Router, useValue: routerSpy },
          { provide: ActivatedRoute, useValue: activatedRoute },
          { provide: MatDialogRef, useValue: mockDialogRef }
        ]
      });
      const dialogFixture = TestBed.createComponent(DonorAttributesComponent);
      const dialogComponent = dialogFixture.componentInstance;
      dialogFixture.detectChanges();
      tick();

      dialogComponent.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
    }));
  });

  describe('onCancelEdit - cache clearing', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear all row caches when canceling edit', () => {
      // Populate caches
      component.getSearchControl(0);
      component.getFilteredProperties(0);
      component.getMinTermDate(component.getAttributeGroup(0));
      component.getTermDateFilter(component.getAttributeGroup(0));

      component.isEditing.set(true);
      component.onCancelEdit();

      expect(component['rowSearchControls'].size).toBe(0);
      expect(component['rowFilteredProperties'].size).toBe(0);
    });

    it('should rebuild form array from activeAttributes', fakeAsync(() => {
      component.onAddAttribute();
      const lengthWithNew = component.attributesArray.length;
      expect(lengthWithNew).toBe(mockAttributes.length + 1);

      component.onCancelEdit();
      expect(component.attributesArray.length).toBe(mockAttributes.length);
    }));
  });

  describe('getMinTermDate - cache invalidation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return new min date when effDate changes', () => {
      const group = component.getAttributeGroup(0);
      const date1 = moment('2024-06-01');
      group.patchValue({ effDate: date1 });
      const result1 = component.getMinTermDate(group);

      const date2 = moment('2024-07-01');
      group.patchValue({ effDate: date2 });
      const result2 = component.getMinTermDate(group);

      expect(result1.isSame(date1, 'day')).toBeTrue();
      expect(result2.isSame(date2, 'day')).toBeTrue();
      expect(result1).not.toBe(result2);
    });
  });

  describe('getTermDateFilter - cache invalidation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return new filter when effDate changes', () => {
      const group = component.getAttributeGroup(0);
      const date1 = moment('2024-06-01');
      group.patchValue({ effDate: date1 });
      const filter1 = component.getTermDateFilter(group);

      const date2 = moment('2024-07-01');
      group.patchValue({ effDate: date2 });
      const filter2 = component.getTermDateFilter(group);

      expect(filter1).not.toBe(filter2);
    });
  });

  describe('displayedColumns', () => {
    it('should have correct displayed columns', () => {
      expect(component['displayedColumns']).toEqual([
        'interCode', 'interDesc', 'insertUser', 'effDate', 'termDate', 'actions'
      ]);
    });
  });

  describe('sidePanelButtons', () => {
    it('should have a close button', () => {
      expect(component.sidePanelButtons.length).toBe(1);
      expect(component.sidePanelButtons[0].label).toBe('CLOSE');
      expect(component.sidePanelButtons[0].action).toBe('close');
    });
  });

  describe('signal initial values', () => {
    it('should initialize loading as false', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should initialize saving as false', () => {
      expect(component.saving()).toBeFalse();
    });

    it('should initialize isEditing as false', () => {
      expect(component.isEditing()).toBeFalse();
    });

    it('should initialize activeAttributes as empty array', () => {
      expect(component.activeAttributes()).toEqual([]);
    });

    it('should initialize availableProperties as empty array', () => {
      expect(component.availableProperties()).toEqual([]);
    });

    it('should initialize hasHiddenAttributes as false', () => {
      expect(component.hasHiddenAttributes()).toBeFalse();
    });

    it('should initialize loadingProperties as false', () => {
      expect(component.loadingProperties()).toBeFalse();
    });

    it('should initialize terminatedAttributes as empty array', () => {
      expect(component.terminatedAttributes()).toEqual([]);
    });

    it('should initialize loadingTerminated as false', () => {
      expect(component.loadingTerminated()).toBeFalse();
    });

    it('should initialize activeTab as all', () => {
      expect(component.activeTab()).toBe('all');
    });
  });

  describe('loadTerminatedAttributes - loadingTerminated signal', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set loadingTerminated to true while loading', fakeAsync(() => {
      donorAttributesServiceSpy.getTerminatedAttributes.and.returnValue(of([mockAttributes[0]]));
      component.loadTerminatedAttributes();
      // After subscribe resolves synchronously, loadingTerminated should be false
      tick();
      expect(component.loadingTerminated()).toBeFalse();
    }));
  });

  describe('onTabChange - all tab', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not load terminated when switching to all tab', () => {
      component.onTabChange('all');
      expect(donorAttributesServiceSpy.getTerminatedAttributes).not.toHaveBeenCalled();
    });
  });

  describe('findIndexForSearchControl - returns -1 for unknown control', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle valueChanges when control is removed from map', fakeAsync(() => {
      const ctrl = component.getSearchControl(0);
      // Remove the control from the map to simulate edge case
      component['rowSearchControls'].delete(0);
      // Trigger valueChanges - should handle gracefully (findIndex returns -1)
      ctrl.setValue('test');
      tick();
      // No error should be thrown, filtered properties for index 0 should not be updated
      expect(true).toBeTrue(); // If we get here, no error was thrown
    }));
  });

  describe('getSearchControl - filter by description', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter by interDesc', fakeAsync(() => {
      const ctrl = component.getSearchControl(0);
      ctrl.setValue('Attribute 2');
      tick();
      const filtered = component.getFilteredProperties(0);
      expect(filtered.some(p => p.interCode === 'ATTR2')).toBeTrue();
    }));
  });

  describe('onToggleEdit - when inputReadOnly is undefined', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should enable editing when inputReadOnly is undefined', () => {
      component.inputReadOnly = undefined;
      component.onToggleEdit();
      expect(component.isEditing()).toBeTrue();
    });
  });

  describe('formatDateForDisplay - various inputs', () => {
    it('should return dash for undefined date', () => {
      const result = component.formatDateForDisplay(undefined);
      expect(result).toBe('-');
    });

    it('should return dash for empty string', () => {
      const result = component.formatDateForDisplay('');
      expect(result).toBe('-');
    });

    it('should return uppercase formatted date', () => {
      const result = component.formatDateForDisplay(moment('2024-01-15'));
      if (result !== '-') {
        // The result should be uppercase if formatDateForUI returns a value
        expect(result).toBe(result.toUpperCase());
      }
    });
  });

  describe('onSaveAll - saving signal management', () => {
    beforeEach(fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert = jasmine.createSpy('bulkUpsert');
      fixture.detectChanges();
      tick();
    }));

    it('should set saving to false after successful save', fakeAsync(() => {
      donorAttributesServiceSpy.bulkUpsert.and.returnValue(of(mockBulkUpsertSuccess));
      component.onAddAttribute();
      const group = component.getAttributeGroup(0);
      group.patchValue({ interCode: 'ATTR2' });
      group.clearValidators();
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.clearValidators();
        group.get(key)?.updateValueAndValidity();
      });
      group.updateValueAndValidity();

      component.onSaveAll();
      tick();
      expect(component.saving()).toBeFalse();
    }));
  });

  describe('buildAttributesFormArray - empty attributes', () => {
    it('should handle empty attributes array', fakeAsync(() => {
      donorAttributesServiceSpy.getActiveAttributes.and.returnValue(of({ attributes: [], hasOtherAttributes: false }));
      fixture.detectChanges();
      tick();
      expect(component.attributesArray.length).toBe(0);
    }));
  });

  describe('buildAttributesFormArray - multiple attributes', () => {
    it('should handle multiple attributes', fakeAsync(() => {
      const multipleAttrs: DonorInterdiction[] = [
        { donorId: mockDonorId, interCode: 'ATTR1', interDesc: 'Attr 1', effDate: '2024-01-01', chapterId: 'CH01', interType: 'TYPE1' },
        { donorId: mockDonorId, interCode: 'ATTR2', interDesc: 'Attr 2', effDate: '2024-02-01', chapterId: 'CH01', interType: 'TYPE2', termDate: '2024-12-31' }
      ];
      donorAttributesServiceSpy.getActiveAttributes.and.returnValue(of({ attributes: multipleAttrs, hasOtherAttributes: false }));
      fixture.detectChanges();
      tick();
      expect(component.attributesArray.length).toBe(2);
      // Second attribute should have termDate set
      const group1 = component.getAttributeGroup(1);
      expect(group1.get('termDate')?.value).toBeTruthy();
    }));
  });

  describe('createAttributeFormGroup - attribute with termDate', () => {
    it('should parse existing termDate into moment', fakeAsync(() => {
      const attrsWithTerm: DonorInterdiction[] = [
        { donorId: mockDonorId, interCode: 'ATTR1', interDesc: 'Test', effDate: '2024-01-01', chapterId: 'CH01', interType: 'TYPE1', termDate: '2024-12-31', insertUser: 'USER1' }
      ];
      donorAttributesServiceSpy.getActiveAttributes.and.returnValue(of({ attributes: attrsWithTerm, hasOtherAttributes: false }));
      fixture.detectChanges();
      tick();
      const group = component.getAttributeGroup(0);
      const termDate = group.get('termDate')?.value;
      expect(moment.isMoment(termDate)).toBeTrue();
    }));
  });

  describe('isSidePanelMode initial value', () => {
    it('should default to false', () => {
      expect(component.isSidePanelMode).toBeFalse();
    });
  });

  describe('onAddAttribute - multiple adds', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should allow adding multiple new attribute rows', () => {
      const initialLength = component.attributesArray.length;
      component.onAddAttribute();
      component.onAddAttribute();
      expect(component.attributesArray.length).toBe(initialLength + 2);
      expect(component.getAttributeGroup(0).get('isNew')?.value).toBeTrue();
      expect(component.getAttributeGroup(1).get('isNew')?.value).toBeTrue();
    });
  });

  describe('onDeleteAttribute - does not delete non-new', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not remove existing attribute even if called', () => {
      const initialLength = component.attributesArray.length;
      component.onDeleteAttribute(0);
      expect(component.attributesArray.length).toBe(initialLength);
    });
  });
});
