import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';


import { EnterEquipmentDowntimeComponent } from './enter-equipment-downtime';
import { EquipmentEventApiService } from './services/equipment-event-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { EquipmentEventDto, LookupItem, EquipmentItem } from './models/equipment-event.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('EnterEquipmentDowntimeComponent', () => {
  let component: any;
  let fixture: ComponentFixture<EnterEquipmentDowntimeComponent>;
  let apiServiceSpy: jasmine.SpyObj<EquipmentEventApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockEventData: EquipmentEventDto = {
    eventReference: 'DT-000001',
    equipReference: 'EQ-000283',
    downtimeFlag: 'Y',
    downtimeCode: 'REPAR',
    downtimeDescription: 'Repair',
    downtimeStart: '2026-03-20T08:00:00Z',
    downtimeEnd: '2026-03-25T00:00:00Z',
    serviceCode: 'FIX',
    serviceDescription: 'General Repair',
    servicePerson: 'John',
    serviceCompany: 'LG',
    serviceStart: '2026-03-20T08:00:00Z',
    serviceEnd: '2026-03-25T00:00:00Z',
    insertDate: '2026-05-30T14:30:00Z',
    insertUser: 'JSMITH'
  };

  const mockEquipmentTypes: LookupItem[] = [
    { code: 'VIST', description: 'Vista' },
    { code: 'CENT', description: 'Centrifuge' }
  ];

  const mockEquipmentList: EquipmentItem[] = [
    { equipmentType: 'VIST', typeDescription: 'Vista', equipmentId: '001', equipReference: 'EQ-000283' },
    { equipmentType: 'VIST', typeDescription: 'Vista', equipmentId: '002', equipReference: 'EQ-000284' }
  ];

  const mockDowntimeCodes: LookupItem[] = [
    { code: 'REPAR', description: 'Repair' },
    { code: 'MAINT', description: 'Maintenance' }
  ];

  const mockServiceCodes: LookupItem[] = [
    { code: 'FIX', description: 'General Repair' },
    { code: 'PM', description: 'Preventive Maintenance' }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('EquipmentEventApiService', [
      'getEventById',
      'createEvent',
      'updateEvent',
      'deleteEvent',
      'getEquipmentTypes',
      'getEquipmentList',
      'getDowntimeCodes',
      'getServiceCodes'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    const chapterChangedSubject = new Subject<void>();
    headerServiceSpy = createMockHeaderService();
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy().and.returnValue(null)
        }
      }
    });

    apiServiceSpy.getEventById.and.returnValue(of({
      success: true,
      message: 'Equipment event retrieved successfully',
      data: mockEventData
    }));
    apiServiceSpy.createEvent.and.returnValue(of({
      success: true,
      message: 'Equipment Downtime added successfully.',
      data: [{ eventReference: 'DT-000002' }]
    }));
    apiServiceSpy.updateEvent.and.returnValue(of({
      success: true,
      message: 'Equipment Downtime updated successfully.'
    }));
    apiServiceSpy.getEquipmentTypes.and.returnValue(of(mockEquipmentTypes));
    apiServiceSpy.getEquipmentList.and.returnValue(of(mockEquipmentList));
    apiServiceSpy.getDowntimeCodes.and.returnValue(of(mockDowntimeCodes));
    apiServiceSpy.getServiceCodes.and.returnValue(of(mockServiceCodes));
    loginServiceSpy.getStoredUsername.and.returnValue('TESTUSER');

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], {
      pageHeaderData: signal({
        title: 'Enter Equip Downtime & Service Details',
        subtitle: 'Record equipment downtime, maintenance, and service information to ensure accurate tracking and operational continuity.',
      }),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('Enter Equip Downtime & Service Details');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('Record equipment downtime, maintenance, and service information to ensure accurate tracking and operational continuity.');
    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);



      TestBed.configureTestingModule({
      imports: [EnterEquipmentDowntimeComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: EquipmentEventApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy }
      ]
    });


    


      apiServiceSpy.getEventById.calls.reset();


      apiServiceSpy.createEvent.calls.reset();


      apiServiceSpy.updateEvent.calls.reset();


      apiServiceSpy.deleteEvent.calls.reset();


      apiServiceSpy.getEquipmentTypes.calls.reset();


      apiServiceSpy.getEquipmentList.calls.reset();


      apiServiceSpy.getDowntimeCodes.calls.reset();


      apiServiceSpy.getServiceCodes.calls.reset();


      loginServiceSpy.getStoredUsername.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      pageHeaderServiceSpy.getCurrentMenuItem.calls.reset();


      apiServiceSpy.getEquipmentTypes.and.returnValue(of(mockEquipmentTypes));


      apiServiceSpy.getEquipmentList.and.returnValue(of(mockEquipmentList));


      apiServiceSpy.getDowntimeCodes.and.returnValue(of(mockDowntimeCodes));


      apiServiceSpy.getServiceCodes.and.returnValue(of(mockServiceCodes));


      loginServiceSpy.getStoredUsername.and.returnValue('TESTUSER');


      pageHeaderServiceSpy.getTitle.and.returnValue('Enter Equip Downtime & Service Details');


      pageHeaderServiceSpy.getSubtitle.and.returnValue('Record equipment downtime, maintenance, and service information to ensure accurate tracking and operational continuity.');


      pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);


    fixture = TestBed.createComponent(EnterEquipmentDowntimeComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should initialize form with all controls', () => {
      fixture.detectChanges();

      expect(component.form.get('equipmentType')).toBeTruthy();
      expect(component.form.get('equipmentId')).toBeTruthy();
      expect(component.form.get('scheduled')).toBeTruthy();
      expect(component.form.get('downtimeType')).toBeTruthy();
      expect(component.form.get('downtimeStart')).toBeTruthy();
      expect(component.form.get('downtimeEnd')).toBeTruthy();
      expect(component.form.get('serviceType')).toBeTruthy();
      expect(component.form.get('servicePerson')).toBeTruthy();
      expect(component.form.get('serviceStart')).toBeTruthy();
      expect(component.form.get('serviceEnd')).toBeTruthy();
    });

    it('should mark equipmentType and equipmentId as required', () => {
      fixture.detectChanges();

      const equipmentType = component.form.get('equipmentType');
      const equipmentId = component.form.get('equipmentId');

      expect(equipmentType?.hasError('required')).toBeTrue();
      expect(equipmentId?.hasError('required')).toBeTrue();
    });

    it('should load lookup data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getEquipmentTypes).toHaveBeenCalled();
      expect(apiServiceSpy.getDowntimeCodes).toHaveBeenCalled();
      expect(apiServiceSpy.getServiceCodes).toHaveBeenCalled();
    }));

    it('should load event data when eventReference is in route', fakeAsync(() => {
      const mockRoute = activatedRouteSpy as any;
      mockRoute.snapshot.paramMap.get = jasmine.createSpy().and.returnValue('DT-000001');

      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getEventById).toHaveBeenCalledWith('DT-000001');
      expect(component.isEditMode()).toBeTrue();
      expect(component.eventData()).toEqual(mockEventData);
    }));
  });
  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should mark scheduled as required', () => {
      const scheduled = component.form.get('scheduled');
      expect(scheduled?.hasError('required')).toBeTrue();
    });

    it('should validate maxlength for servicePerson', () => {
      const servicePerson = component.form.get('servicePerson');
      const longString = 'a'.repeat(64);

      servicePerson?.setValue(longString);

      expect(servicePerson?.hasError('maxlength')).toBeTrue();
    });

    it('should validate maxlength for serviceCompany', () => {
      const serviceCompany = component.form.get('serviceCompany');
      const longString = 'a'.repeat(64);

      serviceCompany?.setValue(longString);

      expect(serviceCompany?.hasError('maxlength')).toBeTrue();
    });

    it('should validate datetime format for downtimeStart', () => {
      const downtimeStart = component.form.get('downtimeStart');

      downtimeStart?.setValue('invalid-date');
      expect(downtimeStart?.hasError('invalidDateTimeFormat')).toBeTrue();

      downtimeStart?.setValue('03-20-26 08:00');
      expect(downtimeStart?.hasError('invalidDateTimeFormat')).toBeFalse();
    });

  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should create event when form is valid', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'VIST' });
      tick();

      component.form.patchValue({
        equipmentId: '001',
        scheduled: 'Y',
        downtimeType: 'REPAR',
        downtimeStart: '05-31-26 08:00',
        downtimeEnd: '05-31-26 12:00'
      });

      component.onSubmit();
      tick();

      expect(apiServiceSpy.createEvent).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Equipment Downtime added successfully.');
    }));

    it('should update event in edit mode', fakeAsync(() => {
      component.isEditMode.set(true);
      component.eventData.set(mockEventData);

      component.form.patchValue({
        equipmentType: 'VIST',
        equipmentId: '001',
        scheduled: 'N'
      });

      component.onSubmit();
      tick();

      expect(apiServiceSpy.updateEvent).toHaveBeenCalledWith('DT-000001', jasmine.any(Object));
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Equipment Downtime updated successfully.');
    }));








  });

  describe('Computed Values', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set selectedEquipmentDescription from API-loaded types', () => {
      component.form.patchValue({ equipmentType: 'VIST' });
      expect(component.selectedEquipmentDescription()).toBe('Vista');
    });



    it('should set selectedEquipmentRef when equipment ID is selected', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'VIST' });
      tick();

      component.form.patchValue({ equipmentId: '001' });
      expect(component.selectedEquipmentRef()).toBe('EQ-000283');
    }));

    it('should compute displayEventId', () => {
      expect(component.displayEventId()).toBe('-');

      component.eventData.set(mockEventData);
      expect(component.displayEventId()).toBe('DT-000001');
    });

    it('should load equipment list when equipment type changes', fakeAsync(() => {
      component.form.patchValue({ equipmentType: 'VIST' });
      tick();

      expect(apiServiceSpy.getEquipmentList).toHaveBeenCalledWith('VIST');
    }));
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear form on CLEAR ALL button click', () => {
      component.form.patchValue({
        equipmentType: 'VIST',
        servicePerson: 'John'
      });

      component.onClearAll();

      expect(component.form.get('equipmentType')?.value).toBeNull();
      expect(component.form.get('servicePerson')?.value).toBeNull();
      expect(component.submitted()).toBeFalse();
    });

    it('should not show required errors after CLEAR ALL', () => {
      component.form.get('equipmentType')?.markAsTouched();
      component.submitted.set(true);
      fixture.detectChanges();

      component.onClearAll();
      fixture.detectChanges();

      expect(component.form.pristine).toBeTrue();
      expect(component.form.untouched).toBeTrue();
      expect(component.submitted()).toBeFalse();

      const errors = fixture.debugElement.queryAll(By.css('mat-error'));
      expect(errors.length).toBe(0);
    });

    it('should reset equipment ID when equipment type changes', fakeAsync(() => {
      component.form.patchValue({
        equipmentType: 'VIST',
        equipmentId: '001'
      });
      tick();

      component.form.patchValue({ equipmentType: 'CENT' });
      tick();

      expect(component.form.get('equipmentId')?.value).toBeNull();
    }));

    it('should clear description signals on CLEAR ALL', () => {
      component.selectedEquipmentDescription.set('Vista');
      component.selectedEquipmentRef.set('EQ-000283');
      component.selectedDowntimeDescription.set('Repair');
      component.selectedServiceDescription.set('General Repair');

      component.onClearAll();

      expect(component.selectedEquipmentDescription()).toBe('');
      expect(component.selectedEquipmentRef()).toBe('');
      expect(component.selectedDowntimeDescription()).toBe('');
      expect(component.selectedServiceDescription()).toBe('');
    });
  });


});
