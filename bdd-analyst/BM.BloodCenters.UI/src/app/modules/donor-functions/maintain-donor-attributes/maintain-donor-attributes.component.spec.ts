import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';

import { MaintainDonorAttributesComponent } from './maintain-donor-attributes.component';
import { MaintainDonorAttributesService } from './services/maintain-donor-attributes.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MaintainDonorAttributeDonorDetails, MaintainDonorAttribute } from './models/maintain-donor-attributes.models';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('MaintainDonorAttributesComponent', () => {
  let component: MaintainDonorAttributesComponent;
  let fixture: ComponentFixture<MaintainDonorAttributesComponent>;
  let serviceSpy: jasmine.SpyObj<MaintainDonorAttributesService>;
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

  const mockDonorDetails: MaintainDonorAttributeDonorDetails = {
    donorId: 'DON12345',
    name: 'BOLTON, CALVIN JOSEPH',
    dateOfBirth: '1970-10-05',
    gender: 'MALE',
    street: '4909 PEARL ST',
    suiteApt: null,
    city: 'Denver',
    state: 'CO',
    zip: '1',
    otherAttributes: 0,
    internationalAddress: null
  };

  const mockAttributes: MaintainDonorAttribute[] = [
    {
      interCode: 'CARTM',
      interDesc: 'Carter Merged Donor',
      interType: 'PROPR',
      effDate: pastDateStr,
      termDate: null,
      insertUser: 'EILTOY'
    },
    {
      interCode: 'ZVR',
      interDesc: 'Very Rare Donor',
      interType: 'PROPR',
      effDate: pastDateStr,
      termDate: null,
      insertUser: 'EILTOY'
    }
  ];

  function createDialogRefSpy(result: unknown): jasmine.SpyObj<MatDialogRef<unknown>> {
    const ref = jasmine.createSpyObj<MatDialogRef<unknown>>('MatDialogRef', ['afterClosed', 'close']);
    ref.afterClosed.and.returnValue(of(result));
    return ref;
  }

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('MaintainDonorAttributesService', [
      'getDonorDetails', 'getAttributes', 'getPropertiesDropdown',
      'createAttribute', 'updateAttribute', 'bulkTerminate'
    ]);
    snackbarSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    serviceSpy.getDonorDetails.and.returnValue(of(mockDonorDetails));
    serviceSpy.getAttributes.and.returnValue(of(mockAttributes));
    serviceSpy.bulkTerminate.and.returnValue(of(undefined));

    const defaultRef = createDialogRefSpy(undefined);
    dialogSpy.open.and.returnValue(defaultRef);



      TestBed.configureTestingModule({
      imports: [
        MaintainDonorAttributesComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MaintainDonorAttributesService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy }
      ]
    })
    .overrideComponent(MaintainDonorAttributesComponent, {
      add: {
        providers: [
          { provide: MatDialog, useValue: dialogSpy },
          { provide: SnackbarService, useValue: snackbarSpy }
        ]
      }
    });


    


      serviceSpy.getDonorDetails.calls.reset();


      serviceSpy.getAttributes.calls.reset();


      serviceSpy.getPropertiesDropdown.calls.reset();


      serviceSpy.createAttribute.calls.reset();


      serviceSpy.updateAttribute.calls.reset();


      serviceSpy.bulkTerminate.calls.reset();


      serviceSpy.getDonorDetails.and.returnValue(of(mockDonorDetails));


      serviceSpy.getAttributes.and.returnValue(of(mockAttributes));


      serviceSpy.bulkTerminate.and.returnValue(of(undefined));


      dialogSpy.open.and.returnValue(defaultRef);


    fixture = TestBed.createComponent(MaintainDonorAttributesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should start with no donor selected', () => {
      expect(component.donorDetails()).toBeNull();
      expect(component.hasDonor()).toBeFalse();
    });

    it('should start with empty attributes', () => {
      expect(component.attributes()).toEqual([]);
    });

    it('should start with no error', () => {
      expect(component.error()).toBeNull();
    });

    it('should start with loading false', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should start with no selected items', () => {
      expect(component.selectedItems()).toEqual([]);
    });
  });
  describe('Donor Details Display', () => {
    beforeEach(() => {
      component.donorDetails.set(mockDonorDetails);
      component.attributes.set(mockAttributes);
      component.sortedAttributes.set(mockAttributes);
      component.loading.set(false);
      fixture.detectChanges();
    });

    it('should display donor details card', () => {
      expect(fixture.debugElement.query(By.css('.donor-details-card'))).toBeTruthy();
    });

    it('should display donor name', () => {
      const card = fixture.debugElement.query(By.css('.donor-details-card'));
      expect(card.nativeElement.textContent).toContain('BOLTON, CALVIN JOSEPH');
    });



    it('should display attributes table', () => {
      expect(fixture.debugElement.query(By.css('.attributes-card'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('app-data-table'))).toBeTruthy();
    });
  });




  describe('Search Filtering', () => {
    beforeEach(() => {
      component.donorDetails.set(mockDonorDetails);
      component.attributes.set(mockAttributes);
      component.sortedAttributes.set(mockAttributes);
      component.loading.set(false);
      fixture.detectChanges();
    });

    it('should filter attributes by search text', () => {
      component.onSearchChange('CARTM');
      expect(component.sortedAttributes().length).toBe(1);
    });



    it('should return all when search is cleared', () => {
      component.onSearchChange('CARTM');
      component.onSearchChange('');
      expect(component.sortedAttributes().length).toBe(2);
    });
  });

  describe('Error Display', () => {
    it('should display error message when error exists', () => {
      component.error.set('Test error message');
      fixture.detectChanges();
      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Test error message');
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
      component.attributes.set(mockAttributes);
      component.error.set('some error');
      component.searchText.set('search');
      component.selectedItems.set([mockAttributes[0]]);

      component.onReset();

      expect(component.donorDetails()).toBeNull();
      expect(component.attributes()).toEqual([]);
      expect(component.error()).toBeNull();
      expect(component.searchText()).toBe('');
      expect(component.selectedItems()).toEqual([]);
    });
  });
});
