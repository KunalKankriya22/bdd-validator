import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DonationTypeProcedureFilterDialog } from './donation-type-procedure-filter-dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ValidDonationTypeProcedureCodeService } from '../services/valid-donation-type-procedure-code.service';
import { of } from 'rxjs';

describe('DonationTypeProcedureFilterDialog', () => {
  let component: DonationTypeProcedureFilterDialog;
  let fixture: ComponentFixture<DonationTypeProcedureFilterDialog>;
  let mockService: jasmine.SpyObj<ValidDonationTypeProcedureCodeService>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockDialogData = {
    currentFilters: null
  };

  beforeEach(() => {

    // Create mock service
    mockService = jasmine.createSpyObj('ValidDonationTypeProcedureCodeService', [
      'getFilters'
    ]);

    // Mock to return empty filter options
    mockService.getFilters.and.returnValue(of({
      success: true,
      message: 'Success',
      statusCode: 200,
      data: {
        donationTypes: [],
        procedureCodes: [],
        attributeGroups: []
      }
    }));



      TestBed.configureTestingModule({
imports: [
        DonationTypeProcedureFilterDialog,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: ValidDonationTypeProcedureCodeService, useValue: mockService }
      ]
    });


    });



  beforeEach(() => {
      mockService.getFilters.and.returnValue(of({
    }));


    fixture = TestBed.createComponent(DonationTypeProcedureFilterDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should initialize form with all filter fields', () => {
    expect(component.filterForm.get('donationType')).toBeTruthy();
    expect(component.filterForm.get('procedureCode')).toBeTruthy();
    expect(component.filterForm.get('attributeGroup')).toBeTruthy();
    expect(component.filterForm.get('period')).toBeTruthy();
    expect(component.filterForm.get('effectiveDate')).toBeTruthy();
  });


  it('should initialize with empty dropdown options', () => {
    expect(component.donationTypeOptions.length).toBe(0);
    expect(component.procedureCodeOptions.length).toBe(0);
    expect(component.attributeGroupOptions.length).toBe(0);
  });




  it('should patch form with current filters if provided', () => {
    const dialogDataWithFilters = {
      currentFilters: {
        donationType: 'WHOLE',
        procedureCode: 'WB',
        attributeGroup: 'TEST',
        period: 'current',
        effectiveDate: null
      }
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        DonationTypeProcedureFilterDialog,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogDataWithFilters },
        { provide: ValidDonationTypeProcedureCodeService, useValue: mockService }
      ]
    });

    const newFixture = TestBed.createComponent(DonationTypeProcedureFilterDialog);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.filterForm.value.donationType).toBe('WHOLE');
    expect(newComponent.filterForm.value.procedureCode).toBe('WB');
  });
});
