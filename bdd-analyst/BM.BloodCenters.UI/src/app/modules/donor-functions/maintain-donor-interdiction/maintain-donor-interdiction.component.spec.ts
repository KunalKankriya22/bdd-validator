import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';

import { MaintainDonorInterdictionComponent } from './maintain-donor-interdiction.component';
import { MaintainDonorInterdictionService } from './services/maintain-donor-interdiction.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DonorDetails, DonorInterdiction } from './models/maintain-donor-interdiction.models';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('MaintainDonorInterdictionComponent', () => {
  let component: MaintainDonorInterdictionComponent;
  let fixture: ComponentFixture<MaintainDonorInterdictionComponent>;
  let serviceSpy: jasmine.SpyObj<MaintainDonorInterdictionService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const pastDate = new Date(now);
  pastDate.setFullYear(pastDate.getFullYear() - 1);
  const pastDateStr = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`;

  const futureDate = new Date(now);
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const futureDateStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;

  const mockDonorDetails: DonorDetails = {
    donorId: 'DON12345',
    name: 'Smith, John',
    dateOfBirth: '1985-06-15',
    gender: 'Male',
    street: '123 Main St',
    suiteApt: 'Apt 4B',
    city: 'Boston',
    state: 'MA',
    zip: '02101',
    bloodType: 'O+',
    otherInters: 2,
    internationalAddress: null
  };

  const mockInterdictions: DonorInterdiction[] = [
    {
      interCode: 'BPHLD',
      interType: 'HOLD S',
      interDesc: 'Blood Pressure Hold',
      unitId: 'UNIT001',
      effDate: pastDateStr,
      termDate: futureDateStr,
      releaseDate: null,
      insertUser: 'USER01',
      releaseUser: null,
      originatedFrom: 'INQR',
      reasonCode: 'TATTO',
      termReason: null,
      groupMode: null,
      groupId: 'HQ0250',
      chapterId: 'CH01',
      donorId: 'DON12345',
      collDate: pastDateStr,
      notes: 'Test note'
    }
  ];

  function createDialogRefSpy(result: unknown): jasmine.SpyObj<MatDialogRef<unknown>> {
    const ref = jasmine.createSpyObj<MatDialogRef<unknown>>('MatDialogRef', ['afterClosed', 'close']);
    ref.afterClosed.and.returnValue(of(result));
    return ref;
  }

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('MaintainDonorInterdictionService', [
      'getDonorDetails',
      'getInterdictions',
      'getValidCodes',
      'getCollectionDates',
      'placeInterdiction',
      'releaseInterdiction',
      'terminateInterdiction',
      'getTerminationReasons'
    ]);
    snackbarSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    serviceSpy.getDonorDetails.and.returnValue(of(mockDonorDetails));
    serviceSpy.getInterdictions.and.returnValue(of(mockInterdictions));
    serviceSpy.releaseInterdiction.and.returnValue(of(undefined));

    const defaultRef = createDialogRefSpy(undefined);
    dialogSpy.open.and.returnValue(defaultRef);



      TestBed.configureTestingModule({
      imports: [
        MaintainDonorInterdictionComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MaintainDonorInterdictionService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy }
      ]
    })
    .overrideComponent(MaintainDonorInterdictionComponent, {
      add: {
        providers: [
          { provide: MatDialog, useValue: dialogSpy },
          { provide: SnackbarService, useValue: snackbarSpy }
        ]
      }
    });


    


      serviceSpy.getDonorDetails.calls.reset();


      serviceSpy.getInterdictions.calls.reset();


      serviceSpy.getValidCodes.calls.reset();


      serviceSpy.getCollectionDates.calls.reset();


      serviceSpy.placeInterdiction.calls.reset();


      serviceSpy.releaseInterdiction.calls.reset();


      serviceSpy.terminateInterdiction.calls.reset();


      serviceSpy.getTerminationReasons.calls.reset();


      serviceSpy.getDonorDetails.and.returnValue(of(mockDonorDetails));


      serviceSpy.getInterdictions.and.returnValue(of(mockInterdictions));


      serviceSpy.releaseInterdiction.and.returnValue(of(undefined));


      dialogSpy.open.and.returnValue(defaultRef);


    fixture = TestBed.createComponent(MaintainDonorInterdictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {

    it('should start with no donor selected', () => {
      expect(component.donorDetails()).toBeNull();
      expect(component.hasDonor()).toBeFalse();
    });

    it('should start with empty interdictions', () => {
      expect(component.interdictions()).toEqual([]);
    });

    it('should start with no error', () => {
      expect(component.error()).toBeNull();
    });

    it('should start with loading false', () => {
      expect(component.loading()).toBeFalse();
    });
  });
  describe('Donor Details Display', () => {
    beforeEach(() => {
      component.donorDetails.set(mockDonorDetails);
      component.interdictions.set(mockInterdictions);
      component.sortedInterdictions.set(mockInterdictions);
      component.loading.set(false);
      fixture.detectChanges();
    });

    it('should display donor details card', () => {
      expect(fixture.debugElement.query(By.css('.donor-details-card'))).toBeTruthy();
    });

    it('should display donor name', () => {
      const card = fixture.debugElement.query(By.css('.donor-details-card'));
      expect(card.nativeElement.textContent).toContain('Smith, John');
    });


    it('should display blood type', () => {
      const card = fixture.debugElement.query(By.css('.donor-details-card'));
      expect(card.nativeElement.textContent).toContain('O+');
    });

    it('should display interdiction table', () => {
      expect(fixture.debugElement.query(By.css('.interdiction-card'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('app-data-table'))).toBeTruthy();
    });
  });
  describe('Show Terminated Toggle', () => {
    beforeEach(() => {
      component.donorDetails.set(mockDonorDetails);
      component.interdictions.set(mockInterdictions);
      component.sortedInterdictions.set(mockInterdictions);
      component.loading.set(false);
      fixture.detectChanges();
    });

    it('should toggle showTerminated on button click', () => {
      expect(component.showTerminated()).toBeFalse();
      component.onToggleShowTerminated();
      expect(component.showTerminated()).toBeTrue();
      component.onToggleShowTerminated();
      expect(component.showTerminated()).toBeFalse();
    });

    it('should reload interdictions when toggling show terminated', () => {
      serviceSpy.getInterdictions.calls.reset();
      component.onToggleShowTerminated();
      expect(serviceSpy.getInterdictions).toHaveBeenCalledWith(
        'DON12345', true, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined
      );
    });
  });

  describe('Search Filtering', () => {
    beforeEach(() => {
      component.donorDetails.set(mockDonorDetails);
      component.interdictions.set(mockInterdictions);
      component.sortedInterdictions.set(mockInterdictions);
      component.loading.set(false);
      fixture.detectChanges();
    });

    it('should filter interdictions by search text', () => {
      component.onSearchChange('BPHLD');
      expect(component.sortedInterdictions().length).toBe(1);
    });


    it('should return all when search is cleared', () => {
      component.onSearchChange('BPHLD');
      component.onSearchChange('');
      expect(component.sortedInterdictions().length).toBe(1);
    });
  });

  describe('Release Functionality', () => {
    beforeEach(() => {
      component.donorDetails.set(mockDonorDetails);
      component.interdictions.set(mockInterdictions);
      component.sortedInterdictions.set(mockInterdictions);
      component.loading.set(false);
      fixture.detectChanges();
    });


    it('should call release service when confirmed', fakeAsync(() => {
      const ref = createDialogRefSpy(true);
      dialogSpy.open.and.returnValue(ref);

      component.onRelease(mockInterdictions[0]);
      tick();

      expect(serviceSpy.releaseInterdiction).toHaveBeenCalledWith(jasmine.objectContaining({
        donorId: 'DON12345',
        interCode: 'BPHLD'
      }));
    }));



  });

  describe('Error Display', () => {
    it('should display error message when error exists', () => {
      component.error.set('Test error message');
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Test error message');
    });

    it('should not show error when no error', () => {
      component.error.set(null);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.error-container'))).toBeFalsy();
    });
  });
  describe('Date Formatting', () => {
    it('should format valid date to DD-MMM-YYYY uppercase', () => {
      const result = component.formatDate(todayStr);
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

  });

  describe('Reset', () => {
    it('should reset all state on onReset', () => {
      component.donorDetails.set(mockDonorDetails);
      component.interdictions.set(mockInterdictions);
      component.error.set('some error');
      component.searchText.set('search');
      component.showTerminated.set(true);

      component.onReset();

      expect(component.donorDetails()).toBeNull();
      expect(component.interdictions()).toEqual([]);
      expect(component.error()).toBeNull();
      expect(component.searchText()).toBe('');
      expect(component.showTerminated()).toBeFalse();
    });
  });
});
