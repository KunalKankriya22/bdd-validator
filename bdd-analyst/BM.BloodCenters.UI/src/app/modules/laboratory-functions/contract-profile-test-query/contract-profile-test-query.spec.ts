import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { of, throwError } from 'rxjs';

import { ContractProfileTestQuery } from './contract-profile-test-query';
import { ContractProfileTestQueryApiService } from './services/contract-profile-test-query-api.service';
import {
  ContractOption,
  ProfileSetOption,
  ContractProfileTest,
  ContractLookupResponse,
  ProfileSetLookupResponse,
  ValidateProfileSetResponse,
  ContractProfileTestQueryResponse,
} from './models/contract-profile-test-query.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ContractProfileTestQuery', () => {
  let component: ContractProfileTestQuery;
  let fixture: ComponentFixture<ContractProfileTestQuery>;
  let apiService: jasmine.SpyObj<ContractProfileTestQueryApiService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  const mockContracts: ContractOption[] = [
    { contractId: 'MDWRG0035', company: 'ISBT(7703) DAL and OBK Chapter', centerId: 'DAL' },
    { contractId: 'MDWRG0036', company: 'Test Hospital System', centerId: 'TST' },
  ];

  const mockProfileSets: ProfileSetOption[] = [
    { profileSetId: 'RG0035-0001', profileDesc: 'Primary', maxProfileSeqNo: 3 },
    { profileSetId: 'RG0035-0002', profileDesc: 'Secondary', maxProfileSeqNo: 2 },
  ];

  const mockValidationResponse: ValidateProfileSetResponse = {
    success: true,
    message: 'Profile set is valid.',
    statusCode: 200,
    data: {
      isValid: true,
      profileDesc: 'Primary',
      maxProfileSeqNo: 3,
    },
  };

  const mockTests: ContractProfileTest[] = [
    {
      testId: 'C',
      testDesc: 'C Antigen',
      profileSeqNo: 3,
      effDate: '08-AUG-2018',
      stopLabelFlag: 'Y',
      isActiveProfile: true,
    },
    {
      testId: 'HBC',
      testDesc: 'HBC Antibody',
      profileSeqNo: 3,
      effDate: '08-AUG-2018',
      stopLabelFlag: 'Y',
      isActiveProfile: true,
    },
  ];

  beforeEach(() => {

    apiService = jasmine.createSpyObj('ContractProfileTestQueryApiService', [
      'getContractLookup',
      'getProfileSetLookup',
      'validateProfileSet',
      'getContractProfileTests',
    ]);
    snackbarService = createMockSnackbarService();
    pageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue({ title: 'Contract Profile Test Query', subtitle: '' })
    });
    headerService = createMockHeaderService();

    // Setup default mock for getContractLookup
    apiService.getContractLookup.and.returnValue(
      of({ success: true, message: 'Success', statusCode: 200, data: [] } as ContractLookupResponse)
    );



      TestBed.configureTestingModule({
      imports: [ContractProfileTestQuery,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: ContractProfileTestQueryApiService, useValue: apiService },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: PageHeaderService, useValue: pageHeaderService },
        { provide: HeaderService, useValue: headerService },
      ],
    });
    fixture = TestBed.createComponent(ContractProfileTestQuery);
    component = fixture.componentInstance;

    // Set up default stubs to prevent undefined errors
    apiService.getContractLookup.and.returnValue(
      of({ success: true, message: 'Success', statusCode: 200, data: [] } as ContractLookupResponse)
    );
    apiService.getProfileSetLookup.and.returnValue(
      of({ success: true, message: 'Success', statusCode: 200, data: [] } as ProfileSetLookupResponse)
    );
    apiService.validateProfileSet.and.returnValue(
      of({ success: false, message: 'Not validated', statusCode: 400, data: { isValid: false } } as ValidateProfileSetResponse)
    );
    apiService.getContractProfileTests.and.returnValue(
      of({ success: true, message: 'Success', statusCode: 200, data: [], totalCount: 0 } as ContractProfileTestQueryResponse)
    );

    // Don't call detectChanges here - let individual tests control when to initialize
  });

  // ==================== Component Initialization ====================

  describe('Component Initialization', () => {


    it('should initialize search form with required fields', () => {
      fixture.detectChanges(); // Initialize component
      expect(component.searchForm.get('contractId')).toBeDefined();
      expect(component.searchForm.get('profileSetId')).toBeDefined();
      expect(component.searchForm.get('profileSeqNo')).toBeDefined();
    });

    it('should initialize with contractId as required', () => {
      fixture.detectChanges(); // Initialize component
      const contractId = component.searchForm.get('contractId');
      contractId?.setValue('');
      expect(contractId?.hasError('required')).toBeTrue();
    });

    it('should initialize with profileSetId as required', () => {
      fixture.detectChanges(); // Initialize component
      const profileSetId = component.searchForm.get('profileSetId');
      profileSetId?.enable(); // Enable field first since it's initially disabled
      profileSetId?.setValue('');
      expect(profileSetId?.hasError('required')).toBeTrue();


    });

    it('should initialize with profileSeqNo as optional', () => {
      fixture.detectChanges(); // Initialize component
      const profileSeqNo = component.searchForm.get('profileSeqNo');
      profileSeqNo?.setValue(null);
      expect(profileSeqNo?.hasError('required')).toBeFalse();
    });





    it('should initialize with loading state as false', () => {
      fixture.detectChanges(); // Initialize component
      expect(component.isLoading).toBeFalse();
    });



    it('should initialize with empty dataSource', () => {
      fixture.detectChanges(); // Initialize component
      expect(component.dataSource.length).toBe(0);
    });




  });

  // ==================== Form Validation ====================
  // ==================== API Integration ====================

  describe('API Integration', () => {
    beforeEach(() => {
      apiService.getContractLookup.and.returnValue(
        of({ success: true, data: mockContracts } as ContractLookupResponse)
      );
    });

    it('should load contracts on component init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiService.getContractLookup).toHaveBeenCalled();
      expect(component.contracts()).toEqual(mockContracts);
    }));

    it('should load profile sets when contract is selected', fakeAsync(() => {
      apiService.getProfileSetLookup.and.returnValue(
        of({ success: true, data: mockProfileSets } as ProfileSetLookupResponse)
      );

      fixture.detectChanges();
      component.searchForm.patchValue({ contractId: 'MDWRG0035' });
      tick();

      expect(apiService.getProfileSetLookup).toHaveBeenCalledWith('MDWRG0035');
      expect(component.profileSets()).toEqual(mockProfileSets);
      expect(component.searchForm.get('profileSetId')?.enabled).toBeTrue();
    }));

    it('should validate profile set when selected', fakeAsync(() => {
      apiService.getProfileSetLookup.and.returnValue(
        of({ success: true, data: mockProfileSets } as ProfileSetLookupResponse)
      );
      apiService.validateProfileSet.and.returnValue(of(mockValidationResponse));

      fixture.detectChanges();
      component.searchForm.patchValue({ contractId: 'MDWRG0035' });
      tick();

      component.searchForm.get('profileSetId')?.enable();
      component.searchForm.patchValue({ profileSetId: 'RG0035-0001' });
      tick();

      expect(apiService.validateProfileSet).toHaveBeenCalledWith({
        contractId: 'MDWRG0035',
        profileSetId: 'RG0035-0001',
      });
      expect(component.profileDescription()).toBe('Primary');
      expect(component.maxProfileSeqNo()).toBe(3);
      expect(component.profileSequences().length).toBe(3);
      expect(component.searchForm.get('profileSeqNo')?.enabled).toBeTrue();
    }));

    it('should retrieve tests when RETRIEVE is clicked', fakeAsync(() => {
      const mockResponse: ContractProfileTestQueryResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockTests,
        totalCount: 2,
      };

      apiService.getProfileSetLookup.and.returnValue(
        of({ success: true, data: mockProfileSets } as ProfileSetLookupResponse)
      );
      apiService.validateProfileSet.and.returnValue(of(mockValidationResponse));
      apiService.getContractProfileTests.and.returnValue(of(mockResponse));

      fixture.detectChanges();
      component.searchForm.patchValue({ contractId: 'MDWRG0035' });
      tick();

      component.searchForm.get('profileSetId')?.enable();
      component.searchForm.patchValue({ profileSetId: 'RG0035-0001' });
      tick();

      component.onRetrieve();
      tick();

      expect(apiService.getContractProfileTests).toHaveBeenCalledWith(
        jasmine.objectContaining({
          contractId: 'MDWRG0035',
          profileSetId: 'RG0035-0001',
          take: 25,
          skip: 0,
          sortColumn: 'profileSeqNo',
          sortDirection: 'D',
        })
      );
      expect(component.dataSource).toEqual(mockTests);
      expect(component.hasSearched).toBeTrue();
    }));
  });

  // ==================== Error Handling ====================
  // ==================== User Interactions ====================

  describe('User Interactions', () => {
    it('should reset form when CLEAR ALL is clicked', fakeAsync(() => {
      apiService.getContractLookup.and.returnValue(
        of({ success: true, data: mockContracts } as ContractLookupResponse)
      );

      fixture.detectChanges();
      component.searchForm.patchValue({
        contractId: 'MDWRG0035',
        profileSetId: 'RG0035-0001',
      });
      tick();

      component.onClearAll();
      tick();

      expect(component.searchForm.get('contractId')?.value).toBe(null);
      expect(component.searchForm.get('profileSetId')?.value).toBe(null);
      expect(component.dataSource.length).toBe(0);
      expect(component.hasSearched).toBeFalse();
    }));

    it('should handle pagination change', fakeAsync(() => {
      const mockResponse: ContractProfileTestQueryResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockTests,
        totalCount: 100,
      };

      apiService.getProfileSetLookup.and.returnValue(
        of({ success: true, data: mockProfileSets } as ProfileSetLookupResponse)
      );
      apiService.validateProfileSet.and.returnValue(of(mockValidationResponse));
      apiService.getContractProfileTests.and.returnValue(of(mockResponse));

      fixture.detectChanges();
      component.searchForm.patchValue({ contractId: 'MDWRG0035' });
      tick();

      component.searchForm.get('profileSetId')?.enable();
      component.searchForm.patchValue({ profileSetId: 'RG0035-0001' });
      tick();

      component.onRetrieve();
      tick();

      component.onPageChange({ pageIndex: 1, pageSize: 25 });
      tick();

      expect(apiService.getContractProfileTests).toHaveBeenCalledWith(
        jasmine.objectContaining({
          skip: 25,
          take: 25,
          sortColumn: 'profileSeqNo',
          sortDirection: 'D',
        })
      );
    }));


  });

  // ==================== Accessibility ====================

  describe('Accessibility', () => {


    it('should mark required fields with aria-required', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const contractIdSelect = compiled.querySelector('mat-select[formControlName="contractId"]');
      const profileSetIdSelect = compiled.querySelector('mat-select[formControlName="profileSetId"]');

      expect(contractIdSelect).toBeTruthy();
      expect(profileSetIdSelect).toBeTruthy();
      expect(contractIdSelect?.hasAttribute('required')).toBeTrue();
      expect(profileSetIdSelect?.hasAttribute('required')).toBeTrue();
    });


  });
});
