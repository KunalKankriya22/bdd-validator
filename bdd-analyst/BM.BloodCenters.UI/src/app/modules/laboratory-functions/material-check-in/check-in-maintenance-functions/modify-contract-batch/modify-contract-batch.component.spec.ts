import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ModifyContractBatchComponent } from './modify-contract-batch.component';
import { ModifyContractBatchApiService } from './services/modify-contract-batch-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  QueryContractBatchResponseDto,
  ValidateContractResponseDto,
  ModifyContractBatchResponseDto,
  ContractOption,
} from './models/modify-contract-batch.model';

describe('ModifyContractBatchComponent', () => {
  let component: ModifyContractBatchComponent;
  let fixture: ComponentFixture<ModifyContractBatchComponent>;
  let apiServiceSpy: jasmine.SpyObj<ModifyContractBatchApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockContractOptions: ContractOption[] = [
    { contractId: 'MDWRG0058', description: 'Part Donor - W1707', contractType: 'RG' },
    { contractId: 'MDWRG0089', description: 'TSUOCON - W1707', contractType: 'RG' },
  ];

  const mockQueryResponse: QueryContractBatchResponseDto = {
    oldContractId: 'MDWRG0058',
    oldBatchId: '080618-RG2010',
    oldRcvdCollDate: new Date('2025-01-09'),
    oldContractType: 'RG',
    oldProfileSetId: 'RG0058-0002',
    oldContractDescription: 'Part Donor - W1707',
    units: [
      {
        unitId: 'W1707180824701',
        collDate: new Date('2025-01-08'),
        contractId: 'MDWRG0058',
        batchId: '080618-RG2010',
        receivedDate: new Date('2025-01-09'),
        chapterId: 'MDWR',
        changeFlag: 'N',
        collIdFlag: null,
        qcTestFlag: null,
        qcTestDate: null,
        externalUnitId: 'W1707180824701',
        internalUnitId: 'W1707180824701',
        oldProfile: 'HIV-1/2',
        newProfile: 'CMV',
      },
    ],
    totalUnits: 1,
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ModifyContractBatchApiService', [
      'queryContractBatch',
      'validateContract',
      'modifyContractBatch',
      'getContractOptions',
      'getBatchOptions',
      'getProfileSetOptions',
      'getReceivedDates',
      'getContractTests',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(null),
    });
    headerServiceSpy = createMockHeaderService();

    apiServiceSpy.getContractOptions.and.returnValue(of(mockContractOptions));
    apiServiceSpy.getBatchOptions.and.returnValue(of([{ batchId: '080618-RG2010' }]));
    apiServiceSpy.getProfileSetOptions.and.returnValue(of([{ profileSetId: 'RG0089-0001' }]));
    apiServiceSpy.getReceivedDates.and.returnValue(of([{ receivedDate: new Date('2025-01-09') }]));
    apiServiceSpy.getContractTests.and.returnValue(of(['HIV-1/2', 'HTLV-1/11']));
    apiServiceSpy.validateContract.and.returnValue(of({ isValid: true, profileSetId: 'RG0089-0001', contractType: 'RG', message: 'Valid' }));
    apiServiceSpy.modifyContractBatch.and.returnValue(of({ success: true, message: 'Success', unitsModified: 1, unitsSkipped: 0, warnings: [] }));
    apiServiceSpy.queryContractBatch.and.returnValue(of(mockQueryResponse));



      TestBed.configureTestingModule({
      imports: [ModifyContractBatchComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ModifyContractBatchApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });


    


      apiServiceSpy.queryContractBatch.calls.reset();


      apiServiceSpy.validateContract.calls.reset();


      apiServiceSpy.modifyContractBatch.calls.reset();


      apiServiceSpy.getContractOptions.calls.reset();


      apiServiceSpy.getBatchOptions.calls.reset();


      apiServiceSpy.getProfileSetOptions.calls.reset();


      apiServiceSpy.getReceivedDates.calls.reset();


      apiServiceSpy.getContractTests.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      apiServiceSpy.getContractOptions.and.returnValue(of(mockContractOptions));


      apiServiceSpy.getBatchOptions.and.returnValue(of([{ batchId: '080618-RG2010' }]));


      apiServiceSpy.getProfileSetOptions.and.returnValue(of([{ profileSetId: 'RG0089-0001' }]));


      apiServiceSpy.getReceivedDates.and.returnValue(of([{ receivedDate: new Date('2025-01-09') }]));


      apiServiceSpy.getContractTests.and.returnValue(of(['HIV-1/2', 'HTLV-1/11']));


      apiServiceSpy.validateContract.and.returnValue(of({ isValid: true, profileSetId: 'RG0089-0001', contractType: 'RG', message: 'Valid' }));


      apiServiceSpy.modifyContractBatch.and.returnValue(of({ success: true, message: 'Success', unitsModified: 1, unitsSkipped: 0, warnings: [] }));


      apiServiceSpy.queryContractBatch.and.returnValue(of(mockQueryResponse));


    fixture = TestBed.createComponent(ModifyContractBatchComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {




    it('should load contract options on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getContractOptions).toHaveBeenCalled();
      expect(component.contractOptions().length).toBe(2);
    }));


  });

  describe('Form Controls', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require old contract ID', () => {
      const control = component.oldContractForm.get('oldContractId');
      expect(control?.hasError('required')).toBeTrue();

      control?.setValue('MDWRG0058');
      expect(control?.hasError('required')).toBeFalse();
    });

    it('should load received dates when old contract ID changes', fakeAsync(() => {
      component.oldContractForm.get('oldContractId')?.setValue('MDWRG0058');
      tick();

      expect(apiServiceSpy.getReceivedDates).toHaveBeenCalledWith('MDWRG0058');
    }));

    it('should load profile set options when new contract ID changes', fakeAsync(() => {
      component.newContractForm.get('newContractId')?.setValue('MDWRG0089');
      tick();

      expect(apiServiceSpy.getProfileSetOptions).toHaveBeenCalledWith('MDWRG0089');
    }));
  });

  describe('Query Contract Batch', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should retrieve contract batch data', fakeAsync(() => {
      component.oldContractForm.patchValue({
        oldContractId: 'MDWRG0058',
        oldBatchId: '080618-RG2010',
        oldRcvdCollDate: new Date('2025-01-09'),
      });

      component.onRetrieve();
      tick();

      expect(apiServiceSpy.queryContractBatch).toHaveBeenCalled();
      expect(component.oldContractData()).toBeTruthy();
      expect(component.units().length).toBe(1);
    }));

    it('should mark form as touched if old contract ID is missing', () => {
      component.onRetrieve();

      expect(component.oldContractForm.get('oldContractId')?.touched).toBeTrue();
      expect(apiServiceSpy.queryContractBatch).not.toHaveBeenCalled();
    });



    it('should handle API error on retrieve', fakeAsync(() => {
      apiServiceSpy.queryContractBatch.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid batch/contract combination' } })),
      );

      component.oldContractForm.patchValue({
        oldContractId: 'MDWRG0058',
        oldBatchId: 'INVALID',
        oldRcvdCollDate: new Date('2025-01-09'),
      });

      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.error()).toBeTruthy();
    }));

    it('should auto-populate new contract section after retrieval', fakeAsync(() => {
      component.oldContractForm.patchValue({
        oldContractId: 'MDWRG0058',
        oldBatchId: '080618-RG2010',
        oldRcvdCollDate: new Date('2025-01-09'),
      });

      component.onRetrieve();
      tick();

      expect(component.newContractForm.get('newContractId')?.value).toBe('');
      expect(component.newContractForm.get('newRcvdCollDate')?.value).toEqual(new Date('2025-01-09'));
    }));
  });

  describe('Validate New Contract', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate new contract when contract ID changes', fakeAsync(() => {
      const mockValidateResponse: ValidateContractResponseDto = {
        isValid: true,
        profileSetId: 'RG0089-0001',
        contractType: 'RG',
        message: 'Contract is valid',
      };

      apiServiceSpy.validateContract.and.returnValue(of(mockValidateResponse));

      component.newContractForm.patchValue({
        newContractId: 'MDWRG0089',
        newRcvdCollDate: new Date('2025-01-09'),
      });

      tick();

      expect(apiServiceSpy.validateContract).toHaveBeenCalled();
      expect(component.newContractValid()).toBeTrue();
      expect(component.newContractForm.get('newProfileSetId')?.value).toBe('RG0089-0001');
    }));

    it('should handle invalid contract response', fakeAsync(() => {
      const mockValidateResponse: ValidateContractResponseDto = {
        isValid: false,
        profileSetId: '',
        contractType: '',
        message: 'Invalid contract type',
      };

      apiServiceSpy.validateContract.and.returnValue(of(mockValidateResponse));

      component.newContractForm.patchValue({
        newContractId: 'MDWRG0089',
        newRcvdCollDate: new Date('2025-01-09'),
      });

      tick();

      expect(component.newContractValid()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid contract type');
    }));
  });

  describe('Unit Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.oldContractForm.patchValue({
        oldContractId: 'MDWRG0058',
        oldBatchId: '080618-RG2010',
        oldRcvdCollDate: new Date('2025-01-09'),
      });
      component.onRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should toggle unit selection', () => {
      const unitId = 'W1707180824701';
      expect(component.isUnitSelected(unitId)).toBeFalse();

      component.toggleUnit(unitId);
      expect(component.isUnitSelected(unitId)).toBeTrue();

      component.toggleUnit(unitId);
      expect(component.isUnitSelected(unitId)).toBeFalse();
    });

    it('should select all units', () => {
      component.toggleSelectAll();
      expect(component.allSelected()).toBeTrue();
      expect(component.selectedUnits().size).toBe(1);
    });

    it('should deselect all units', () => {
      component.toggleSelectAll();
      expect(component.allSelected()).toBeTrue();

      component.toggleSelectAll();
      expect(component.allSelected()).toBeFalse();
      expect(component.selectedUnits().size).toBe(0);
    });

    it('should compute someSelected correctly', () => {
      expect(component.someSelected()).toBeFalse();

      component.toggleUnit('W1707180824701');
      // With only 1 unit, selecting it means allSelected, not someSelected
      expect(component.allSelected()).toBeTrue();
      expect(component.someSelected()).toBeFalse();
    });
  });

  describe('Modify Records', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.oldContractForm.patchValue({
        oldContractId: 'MDWRG0058',
        oldBatchId: '080618-RG2010',
        oldRcvdCollDate: new Date('2025-01-09'),
      });
      component.onRetrieve();
      tick();

      const mockValidateResponse: ValidateContractResponseDto = {
        isValid: true,
        profileSetId: 'RG0089-0001',
        contractType: 'RG',
        message: 'Contract is valid',
      };
      apiServiceSpy.validateContract.and.returnValue(of(mockValidateResponse));

      component.newContractForm.patchValue({
        newContractId: 'MDWRG0089',
        newRcvdCollDate: new Date('2025-01-09'),
      });
      tick();

      component.toggleUnit('W1707180824701');
      fixture.detectChanges();
    }));

    it('should modify selected records', fakeAsync(() => {
      const mockModifyResponse: ModifyContractBatchResponseDto = {
        success: true,
        message: 'Success',
        unitsModified: 1,
        unitsSkipped: 0,
        warnings: [],
      };

      apiServiceSpy.modifyContractBatch.and.returnValue(of(mockModifyResponse));

      component.onModifyRecords();
      tick();

      expect(apiServiceSpy.modifyContractBatch).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));








  });

  describe('Clear All', () => {
    it('should reset all forms and state', () => {
      fixture.detectChanges();
      component.oldContractForm.patchValue({
        oldContractId: 'MDWRG0058',
      });
      component.units.set([mockQueryResponse.units[0]]);
      component.selectedUnits.set(new Set(['W1707180824701']));

      component.onClearAll();

      expect(component.oldContractForm.get('oldContractId')?.value).toBeNull();
      expect(component.units().length).toBe(0);
      expect(component.selectedUnits().size).toBe(0);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should generate unique IDs across multiple instances', () => {
      const fixture2 = TestBed.createComponent(ModifyContractBatchComponent);
      const component2 = fixture2.componentInstance;

      expect((component as any).componentId).not.toBe((component2 as any).componentId);
      expect((component as any).elementId('old-contract-id')).not.toBe((component2 as any).elementId('old-contract-id'));
    });
  });
  describe('Computed Properties', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should compute old contract description', () => {
      component.oldContractForm.get('oldContractId')?.setValue('MDWRG0058');
      expect(component.oldContractDescription()).toBe('Part Donor - W1707');
    });

    it('should compute new contract description', () => {
      component.newContractForm.get('newContractId')?.setValue('MDWRG0089');
      expect(component.newContractDescription()).toBe('TSUOCON - W1707');
    });

    it('should compute hasRetrievedData', () => {
      expect(component.hasRetrievedData()).toBeFalse();

      component.oldContractData.set(mockQueryResponse);
      expect(component.hasRetrievedData()).toBeTrue();
    });

    it('should compute canModify', () => {
      expect(component.canModify()).toBeFalse();

      component.selectedUnits.set(new Set(['W1707180824701']));
      expect(component.canModify()).toBeFalse();

      component.newContractValid.set(true);
      expect(component.canModify()).toBeTrue();
    });
  });
});
