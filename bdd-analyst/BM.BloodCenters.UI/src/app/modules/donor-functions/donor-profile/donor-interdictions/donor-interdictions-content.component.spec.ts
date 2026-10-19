import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DonorInterdictionsContentComponent } from './donor-interdictions-content.component';
import { DonorInterdictionsApiService } from './services/donor-interdictions-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { DonorInterdiction } from './models/donor-interdictions.model';

describe('DonorInterdictionsContentComponent', () => {
  let component: DonorInterdictionsContentComponent;
  let fixture: ComponentFixture<DonorInterdictionsContentComponent>;
  let mockService: jasmine.SpyObj<DonorInterdictionsApiService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  const mockInterdictions: DonorInterdiction[] = [
    {
      interCode: 'ENH',
      interType: 'INTER',
      interDesc: 'E Negative',
      unitId: 'W633324021301-Q',
      effDate: '2024-02-13T00:00:00Z',
      termDate: '2024-02-13T00:00:00Z',
      releaseDate: null,
      insertUser: 'DONSYS',
      releaseUser: null,
      originatedFrom: 'DONATION',
      reasonCode: 'TEMP',
      groupMode: null,
      groupId: null,
      chapterId: 'CH001',
      donorId: '12345',
      noteId: null,
      notes: '--'
    }
  ];

  const mockActivatedRoute = {
    snapshot: { params: {}, queryParams: {} },
    params: of({}),
    queryParams: of({})
  };

  const mockDonorDetailsResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    item: {
      donorId: '12345',
      name: 'ROGERS, SHELIA MARY',
      dateOfBirth: '2002-02-12',
      gender: 'Female',
      street: '123 Main St',
      bloodType: 'O POS',
      otherInters: 0
    },
    errorResponse: {
      errorCode: '',
      error: ''
    }
  };

  const mockInterdictionsResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: mockInterdictions,
    total: mockInterdictions.length,
    errorResponse: {
      errorCode: '',
      error: ''
    }
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('DonorInterdictionsApiService', ['getDonorInterdictions', 'getDonorDetails']);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['error', 'info']);

    mockService.getDonorInterdictions.and.returnValue(of(mockInterdictionsResponse));
    mockService.getDonorDetails.and.returnValue(of(mockDonorDetailsResponse));

    TestBed.configureTestingModule({
      imports: [DonorInterdictionsContentComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: DonorInterdictionsApiService, useValue: mockService },
        { provide: LoggingService, useValue: mockLoggingService }
      ]
    });

    mockService.getDonorInterdictions.calls.reset();
    mockService.getDonorDetails.calls.reset();
    mockLoggingService.error.calls.reset();
    mockLoggingService.info.calls.reset();
    mockService.getDonorInterdictions.and.returnValue(of(mockInterdictionsResponse));
    mockService.getDonorDetails.and.returnValue(of(mockDonorDetailsResponse));

    fixture = TestBed.createComponent(DonorInterdictionsContentComponent);
    component = fixture.componentInstance;
    component.donorId = '12345';
  });

  describe('Initialization', () => {

    it('should load donor details and interdictions on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getDonorDetails).toHaveBeenCalledWith('12345');
      expect(mockService.getDonorInterdictions).toHaveBeenCalledWith('12345', false);
      expect(component['allInterdictions']().length).toBe(1);
      expect(component['donorInfo']()).toBeTruthy();
    }));

    it('should not auto-select first interdiction on load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component['allInterdictions']().length).toBe(1);
      expect(component['selectedInterdiction']()).toBeNull();
    }));

    it('should set error if donorId is not provided', () => {
      component.donorId = '';
      fixture.detectChanges();

      expect(component['error']()).toBe('Donor ID is required');
    });
  });

  describe('Filter functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reload interdictions when filter changes', fakeAsync(() => {
      tick();
      mockService.getDonorInterdictions.calls.reset();

      component.showTerminatedControl.setValue('No');
      tick();

      expect(mockService.getDonorInterdictions).toHaveBeenCalledWith('12345', false);
    }));
  });

  describe('Row selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should select row on click', () => {
      component.onRowClick(mockInterdictions[0]);

      expect(component['selectedInterdiction']()).toEqual(mockInterdictions[0]);
    });

    it('should check if row is selected', () => {
      component['selectedInterdiction'].set(mockInterdictions[0]);

      expect(component.isRowSelected(mockInterdictions[0])).toBe(true);
    });
  });

  describe('otherIntersCount', () => {
    it('should set otherIntersCount from donor details response', fakeAsync(() => {
      const responseWithOtherInters = {
        ...mockDonorDetailsResponse,
        item: { ...mockDonorDetailsResponse.item, otherInters: 3 }
      };
      mockService.getDonorDetails.and.returnValue(of(responseWithOtherInters));

      fixture.detectChanges();
      tick();

      expect(component['otherIntersCount']()).toBe(3);
    }));

    it('should default otherIntersCount to 0 when not present', fakeAsync(() => {
      const responseNoOtherInters = {
        ...mockDonorDetailsResponse,
        item: { ...mockDonorDetailsResponse.item, otherInters: undefined as any }
      };
      mockService.getDonorDetails.and.returnValue(of(responseNoOtherInters));

      fixture.detectChanges();
      tick();

      expect(component['otherIntersCount']()).toBe(0);
    }));
  });

  describe('Error handling', () => {
    it('should load interdictions even when donor details fail', fakeAsync(() => {
      mockService.getDonorDetails.and.returnValue(throwError(() => new Error('API error')));

      fixture.detectChanges();
      tick();

      expect(mockLoggingService.error).toHaveBeenCalled();
      expect(mockService.getDonorInterdictions).toHaveBeenCalled();
    }));

    it('should set error when interdictions response is not successful', fakeAsync(() => {
      const failResponse = {
        ...mockInterdictionsResponse,
        success: false,
        data: null as any
      };
      mockService.getDonorInterdictions.and.returnValue(of(failResponse));

      fixture.detectChanges();
      tick();

      expect(component['error']()).toBe('Failed to load interdictions.');
      expect(component['allInterdictions']().length).toBe(0);
    }));

    it('should set error when interdictions API call fails', fakeAsync(() => {
      mockService.getDonorInterdictions.and.returnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges();
      tick();

      expect(component['error']()).toBe('Failed to load interdictions. Please try again.');
      expect(mockLoggingService.error).toHaveBeenCalled();
    }));

    it('should not load data when donor details response is not successful', fakeAsync(() => {
      mockService.getDonorDetails.and.returnValue(of({
        ...mockDonorDetailsResponse,
        success: false,
        item: null as any
      }));

      fixture.detectChanges();
      tick();

      expect(component['donorInfo']()).toBeNull();
      expect(mockService.getDonorInterdictions).not.toHaveBeenCalled();
    }));
  });

  describe('formatDate', () => {
    it('should format ISO date string to DD-MMM-YYYY', () => {
      expect(component.formatDate('2024-02-13T00:00:00Z')).toBe('13-FEB-2024');
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

  describe('trackByInterdiction', () => {
    it('should return composite key with unitId', () => {
      const result = component.trackByInterdiction(0, mockInterdictions[0]);
      expect(result).toBe('ENH-2024-02-13T00:00:00Z-W633324021301-Q');
    });

    it('should use index when unitId is null', () => {
      const interdiction = { ...mockInterdictions[0], unitId: null };
      const result = component.trackByInterdiction(5, interdiction);
      expect(result).toBe('ENH-2024-02-13T00:00:00Z-5');
    });
  });

  describe('onClose', () => {
    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');
      component.onClose();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('Filter with Show Terminated Yes', () => {
    it('should send showTerminated=true when toggled to Yes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.getDonorInterdictions.calls.reset();

      component.showTerminatedControl.setValue('Yes');
      tick();

      expect(mockService.getDonorInterdictions).toHaveBeenCalledWith('12345', true);
    }));

    it('should clear selected interdiction when filter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onRowClick(mockInterdictions[0]);
      expect(component['selectedInterdiction']()).toBeTruthy();

      component.showTerminatedControl.setValue('Yes');
      tick();

      expect(component['selectedInterdiction']()).toBeNull();
    }));
  });

  describe('isRowSelected edge cases', () => {
    it('should return false when no row is selected', () => {
      expect(component.isRowSelected(mockInterdictions[0])).toBe(false);
    });

    it('should return false for different interdiction', () => {
      component['selectedInterdiction'].set(mockInterdictions[0]);
      const different = { ...mockInterdictions[0], interCode: 'DIFF' };
      expect(component.isRowSelected(different)).toBe(false);
    });
  });

  describe('Donor header fields', () => {
    it('should return empty array when donor info is null', () => {
      component['donorInfo'].set(null);

      const fields = component['donorHeaderFields']();

      expect(fields).toEqual([]);
    });

    it('should return 4 fields with correct labels and values', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const fields = component['donorHeaderFields']();

      expect(fields.length).toBe(4);
      expect(fields[0]).toEqual({ label: 'Name', value: 'ROGERS, SHELIA MARY' });
      expect(fields[1]).toEqual({ label: 'DOB', value: '2002-02-12' });
      expect(fields[2]).toEqual({ label: 'Sex', value: 'Female' });
      expect(fields[3]).toEqual({ label: 'ABO', value: 'O POS' });
    }));
  });
});
