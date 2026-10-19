import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { ReInterfaceDonorToLabComponent } from './re-interface-donor-to-lab';
import { ReInterfaceDonorToLabApiService } from './services/re-interface-donor-to-lab-api.service';
import {
  ReInterfaceDonorToLabUnit,
  ReInterfaceDonorToLabResponse
} from './models/re-interface-donor-to-lab.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ReInterfaceDonorToLabComponent', () => {
  let component: ReInterfaceDonorToLabComponent;
  let fixture: ComponentFixture<ReInterfaceDonorToLabComponent>;
  let apiServiceSpy: jasmine.SpyObj<ReInterfaceDonorToLabApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterChangedSubject: Subject<void>;

  const mockUnit: ReInterfaceDonorToLabUnit = {
    sequence: 1,
    unitId: 'W633326051301',
    checkDigit: '-A',
    collectionDate: '2026-05-13T00:00:00',
    interdictionExist: 'N',
    interfaceId: '',
    interdictionState: ''
  };

  const mockUnit2: ReInterfaceDonorToLabUnit = {
    sequence: 2,
    unitId: 'W633326051302',
    checkDigit: '-5',
    collectionDate: '2026-05-12T00:00:00',
    interdictionExist: 'Y',
    interfaceId: '',
    interdictionState: ''
  };

  const mockExecuteResponse: ReInterfaceDonorToLabResponse = {
    success: true,
    message: 'ReInterface executed successfully',
    statusCode: 200,
    data: [{
      sequence: 1,
      unitId: 'W633326051301',
      checkDigit: '-A',
      collectionDate: '2026-05-13T00:00:00',
      interdictionExist: 'N',
      interfaceId: '12345',
      interdictionState: 'N'
    }]
  };

  const mockExecuteResponse2: ReInterfaceDonorToLabResponse = {
    success: true,
    message: 'ReInterface executed successfully',
    statusCode: 200,
    data: [{
      sequence: 2,
      unitId: 'W633326051302',
      checkDigit: '-5',
      collectionDate: '2026-05-12T00:00:00',
      interdictionExist: 'Y',
      interfaceId: '12346',
      interdictionState: 'Y'
    }]
  };

  function createMockPostValidateEvent(parsedUnitId: string) {
    return {
      data: { parsedUnitId },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    } as any;
  }

  function addUnitViaPostValidate(unitId: string, unit: ReInterfaceDonorToLabUnit) {
    apiServiceSpy.getUnitData.and.returnValue(of(unit));
    const event = createMockPostValidateEvent(unitId);
    component.onPostValidate(event);
    tick();
    expect(event.confirm).toHaveBeenCalled();
    component.onUnitValidated({ parsedUnitId: unitId } as any);
  }

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('ReInterfaceDonorToLabApiService', [
      'getUnitData',
      'executeReInterface'
    ]);

    snackbarServiceSpy = createMockSnackbarService();

    const headerServiceSpy = createMockHeaderService();

    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Re-Interface Donor to Lab', subtitle: '' })
    });

    apiServiceSpy.getUnitData.and.returnValue(of(mockUnit));
    apiServiceSpy.executeReInterface.and.returnValue(of(mockExecuteResponse));



      TestBed.configureTestingModule({
      imports: [ReInterfaceDonorToLabComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ReInterfaceDonorToLabApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy }
      ]
    });


    


      apiServiceSpy.getUnitData.calls.reset();


      apiServiceSpy.executeReInterface.calls.reset();


      apiServiceSpy.getUnitData.and.returnValue(of(mockUnit));


      apiServiceSpy.executeReInterface.and.returnValue(of(mockExecuteResponse));


    fixture = TestBed.createComponent(ReInterfaceDonorToLabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Component Initialization', () => {


    it('should initialize with empty units list', () => {
      expect(component['units']()).toEqual([]);
    });

    it('should initialize processing as false', () => {
      expect(component['processing']()).toBeFalse();
    });




  });

  describe('Computed Signals', () => {
    it('should compute hasUnits as false when no units', () => {
      expect(component['hasUnits']()).toBeFalse();
    });

    it('should compute hasUnits as true when units exist', () => {
      component['units'].set([mockUnit]);
      expect(component['hasUnits']()).toBeTrue();
    });

    it('should compute unitCount correctly', () => {
      expect(component['unitCount']()).toBe(0);
      component['units'].set([mockUnit, mockUnit2]);
      expect(component['unitCount']()).toBe(2);
    });

    it('should compute canReInterface as false when no units', () => {
      expect(component['canReInterface']()).toBeFalse();
    });

    it('should compute canReInterface as true when units exist and not processing', () => {
      component['units'].set([mockUnit]);
      expect(component['canReInterface']()).toBeTrue();
    });

    it('should compute canReInterface as false when processing', () => {
      component['units'].set([mockUnit]);
      component['processing'].set(true);
      expect(component['canReInterface']()).toBeFalse();
    });
  });

  describe('Post Validate (onPostValidate)', () => {
    it('should call getUnitData and confirm on success', fakeAsync(() => {
      const event = createMockPostValidateEvent('W633326051301');
      component.onPostValidate(event);
      tick();

      expect(apiServiceSpy.getUnitData).toHaveBeenCalledWith('W633326051301');
      expect(event.confirm).toHaveBeenCalled();
      expect(event.reject).not.toHaveBeenCalled();
    }));

    it('should store pending unit with formatted date', fakeAsync(() => {
      const event = createMockPostValidateEvent('W633326051301');
      component.onPostValidate(event);
      tick();

      expect(component['pendingUnit']).toBeTruthy();
      expect(component['pendingUnit']!.collectionDate).toBe('13-MAY-2026');
      expect(component['pendingUnit']!.sequence).toBe(1);
    }));

    it('should reject duplicate unit IDs', fakeAsync(() => {
      addUnitViaPostValidate('W633326051301', mockUnit);

      const event2 = createMockPostValidateEvent('W633326051301');
      component.onPostValidate(event2);
      tick();

      expect(event2.reject).toHaveBeenCalledWith('Unit is already in the list');
      expect(event2.confirm).not.toHaveBeenCalled();
    }));

    it('should show snackbar with errorCode and message on API failure', fakeAsync(() => {
      const errorResponse = {
        error: {
          message: 'This unit is older than 165 days',
          errorResponse: { errorCode: '0301', error: 'This unit is older than 165 days' }
        }
      };
      apiServiceSpy.getUnitData.and.returnValue(throwError(() => errorResponse));

      const event = createMockPostValidateEvent('W633326051301');
      component.onPostValidate(event);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('0301: This unit is older than 165 days');
      expect(event.reject).toHaveBeenCalledWith('');
      expect(event.confirm).not.toHaveBeenCalled();
    }));



    it('should not show snackbar when no error details available', fakeAsync(() => {
      apiServiceSpy.getUnitData.and.returnValue(throwError(() => ({})));

      const event = createMockPostValidateEvent('W633326051301');
      component.onPostValidate(event);
      tick();

      expect(snackbarServiceSpy.showError).not.toHaveBeenCalled();
      expect(event.reject).toHaveBeenCalledWith('');
    }));
  });

  describe('Unit Validated (onUnitValidated)', () => {
    it('should add pending unit to list', fakeAsync(() => {
      addUnitViaPostValidate('W633326051301', mockUnit);

      expect(component['units']().length).toBe(1);
      expect(component['units']()[0].unitId).toBe('W633326051301');
      expect(component['pendingUnit']).toBeNull();
    }));



    it('should not add if no pending unit', () => {
      component.onUnitValidated({ parsedUnitId: 'W633326051301' } as any);
      expect(component['units']().length).toBe(0);
    });
  });

  describe('Re-Interface (onReInterface)', () => {
    beforeEach(fakeAsync(() => {
      addUnitViaPostValidate('W633326051301', mockUnit);
    }));

    it('should call executeReInterface for each unit', fakeAsync(() => {
      component.onReInterface();
      tick();

      expect(apiServiceSpy.executeReInterface).toHaveBeenCalledTimes(1);
      expect(apiServiceSpy.executeReInterface).toHaveBeenCalledWith({
        unitId: 'W633326051301',
        collectionDate: '13-MAY-2026'
      });
    }));







    it('should set processing to true during execution', fakeAsync(() => {
      const responseSubject = new Subject<ReInterfaceDonorToLabResponse>();
      apiServiceSpy.executeReInterface.and.returnValue(responseSubject.asObservable());

      component.onReInterface();
      expect(component['processing']()).toBeTrue();

      responseSubject.next(mockExecuteResponse);
      responseSubject.complete();
      tick();

      expect(component['processing']()).toBeFalse();
    }));

    it('should set processing to false after completion', fakeAsync(() => {
      component.onReInterface();
      tick();

      expect(component['processing']()).toBeFalse();
    }));

    it('should handle re-interface error', fakeAsync(() => {
      const errorResponse = {
        error: { message: 'Failed to re-interface units' }
      };
      apiServiceSpy.executeReInterface.and.returnValue(throwError(() => errorResponse));

      component.onReInterface();
      tick();

      expect(component['processing']()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to re-interface units');
    }));



    it('should call executeReInterface for multiple units', fakeAsync(() => {
      apiServiceSpy.getUnitData.and.returnValue(of(mockUnit2));
      addUnitViaPostValidate('W633326051302', mockUnit2);

      apiServiceSpy.executeReInterface.calls.reset();
      apiServiceSpy.executeReInterface.and.returnValues(
        of(mockExecuteResponse),
        of(mockExecuteResponse2)
      );

      component.onReInterface();
      tick();

      expect(apiServiceSpy.executeReInterface).toHaveBeenCalledTimes(2);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        'Re-interfaced 2 units to Lab successfully.'
      );
    }));
  });


  describe('Sorting', () => {
    beforeEach(fakeAsync(() => {
      addUnitViaPostValidate('W633326051301', mockUnit);
      apiServiceSpy.getUnitData.and.returnValue(of(mockUnit2));
      addUnitViaPostValidate('W633326051302', mockUnit2);
    }));



    it('should return unfold_more icon for default sort', () => {
      expect(component.getSortIcon()).toBe('unfold_more');
    });












  });
});
