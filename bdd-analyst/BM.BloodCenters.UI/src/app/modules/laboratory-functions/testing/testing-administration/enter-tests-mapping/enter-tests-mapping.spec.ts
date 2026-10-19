import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { EnterTestsMappingComponent } from './enter-tests-mapping';
import { EnterTestsMappingService } from './services/enter-tests-mapping.service';
import { provideRouter } from '@angular/router';
import {
  ContractDropdownItem,
  TestDropdownItem,
  TestMappingRow,
} from './models/enter-tests-mapping.model';

describe('EnterTestsMappingComponent', () => {
  let component: EnterTestsMappingComponent;
  let fixture: ComponentFixture<EnterTestsMappingComponent>;
  let service: jasmine.SpyObj<EnterTestsMappingService>;

  const mockContracts: ContractDropdownItem[] = [
    { contractId: 'C001', company: 'Company A' },
    { contractId: 'C002', company: 'Company B' },
  ];

  const mockTests: TestDropdownItem[] = [
    { testGroup: 'GROUP-A', testId: 'T001', testDesc: 'Test One' },
    { testGroup: 'GROUP-A', testId: 'T002', testDesc: 'Test Two' },
    { testGroup: null, testId: 'T003', testDesc: 'Test Three' },
  ];

  const mockMatrix: TestMappingRow[] = [
    {
      testId: 'T001',
      testDesc: 'Test One',
      cbcTestId: 'CBC001',
      effDate: '2026-06-01',
      termDate: null,
      modifiedDate: '2026-06-01',
    },
    {
      testId: 'T002',
      testDesc: 'Test Two',
      cbcTestId: 'CBC002',
      effDate: '2026-06-01',
      termDate: '2026-12-31',
      modifiedDate: '2026-06-01',
    },
  ];

  beforeEach(() => {

    service = jasmine.createSpyObj('EnterTestsMappingService', [
      'getContractsDropdown',
      'getTestsDropdown',
      'getTestMatrix',
      'saveTestMatrix',
    ]);
    service.getContractsDropdown.and.returnValue(of(mockContracts));
    service.getTestsDropdown.and.returnValue(of(mockTests));
    service.getTestMatrix.and.returnValue(of(mockMatrix));



      TestBed.configureTestingModule({
      imports: [EnterTestsMappingComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: EnterTestsMappingService, useValue: service },
      ],
    });


    


      service.getContractsDropdown.calls.reset();


      service.getTestsDropdown.calls.reset();


      service.getTestMatrix.calls.reset();


      service.saveTestMatrix.calls.reset();


      service.getContractsDropdown.and.returnValue(of(mockContracts));


      service.getTestsDropdown.and.returnValue(of(mockTests));


      service.getTestMatrix.and.returnValue(of(mockMatrix));


    fixture = TestBed.createComponent(EnterTestsMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ==================== Component Initialization ====================

  describe('Component Initialization', () => {






    it('should initialize with no selected contract', () => {
      expect(component.selectedContract).toBeNull();
      expect(component.selectedContractDescription).toBe('');
    });





    it('should initialize formDirty as false', () => {
      expect(component.formDirty).toBe(false);
    });

    it('should initialize isSaving as false', () => {
      expect(component.isSaving).toBe(false);
    });
  });

  // ==================== Contract Dropdown ====================

  describe('Contract Dropdown', () => {




    it('should return all contracts when search is empty', () => {
      component.contractSearchControl.setValue('');
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(2);
    });

    it('should compare contracts by contractId', () => {
      const a: ContractDropdownItem = { contractId: 'C001', company: 'A' };
      const b: ContractDropdownItem = { contractId: 'C001', company: 'B' };
      expect(component.compareContract(a, b)).toBe(true);
    });

    it('should return false for different contract IDs', () => {
      const a: ContractDropdownItem = { contractId: 'C001', company: 'A' };
      const b: ContractDropdownItem = { contractId: 'C002', company: 'B' };
      expect(component.compareContract(a, b)).toBe(false);
    });



    it('should set selected contract on change', () => {
      const contract = mockContracts[0];
      component.contractControl.setValue(contract);
      component.onContractChanged();

      expect(component.selectedContract).toEqual(contract);
      expect(component.selectedContractDescription).toBe('Company A');
    });

    it('should load tests and matrix when contract is selected', () => {
      component.contractControl.setValue(mockContracts[0]);
      component.onContractChanged();

      expect(service.getTestsDropdown).toHaveBeenCalledWith('C001');
    });
  });

  // ==================== Clear Contract ====================

  describe('clearContract', () => {
    it('should reset all contract-related state', () => {
      component.selectedContract = mockContracts[0];
      component.selectedContractDescription = 'Company A';
      component.formDirty = true;

      component.clearContract();

      expect(component.contractControl.value).toBeNull();
      expect(component.selectedContract).toBeNull();
      expect(component.selectedContractDescription).toBe('');
      expect(component.testOptions().length).toBe(0);
      expect(component.rows.length).toBe(0);
      expect(component.formDirty).toBe(false);
    });
  });

  // ==================== Test Dropdown ====================

  describe('Test Dropdown', () => {




    it('should return all tests when search is empty', () => {
      component.testOptions.set(mockTests);
      component.testSearchControl.setValue('');
      const filtered = component.filteredTestOptions();
      expect(filtered.length).toBe(3);
    });


  });

  // ==================== Row Operations ====================

  describe('Row Operations', () => {
    it('should compare tests by testId (object)', () => {
      const a: TestDropdownItem = { testGroup: null, testId: 'T001', testDesc: 'A' };
      const b: TestDropdownItem = { testGroup: null, testId: 'T001', testDesc: 'B' };
      expect(component.compareTest(a, b)).toBe(true);
    });



    it('should compare tests case-insensitively', () => {
      expect(component.compareTest('t001', 'T001')).toBe(true);
    });



    it('should delete a row by index', () => {
      component.contractControl.setValue(mockContracts[0]);
      component.onContractChanged();
      fixture.detectChanges();

      const initialLength = component.rows.length;
      component.deleteRow(1);
      expect(component.rows.length).toBe(initialLength - 1);
      expect(component.formDirty).toBe(true);
    });
  });

  // ==================== Sort ====================
  // ==================== Template Row ====================

  describe('Template Row', () => {
    beforeEach(() => {
      component.contractControl.setValue(mockContracts[0]);
      component.onContractChanged();
      fixture.detectChanges();
    });

    it('should identify template row at index 0', () => {
      expect(component.isTemplateRow(0)).toBe(true);
    });

    it('should not identify data rows as template', () => {
      expect(component.isTemplateRow(1)).toBe(false);
    });
  });

  // ==================== Test Description Helpers ====================





  // ==================== Save ====================

  describe('Save', () => {
    it('should not allow save when no contract is selected', () => {
      expect(component.canSave).toBe(false);
    });

    it('should not allow save when form is not dirty', () => {
      component.selectedContract = mockContracts[0];
      component.formDirty = false;
      expect(component.canSave).toBe(false);
    });

    it('should not allow save while saving', () => {
      component.selectedContract = mockContracts[0];
      component.formDirty = true;
      component.isSaving = true;
      expect(component.canSave).toBe(false);
    });





    it('should reload matrix after successful save', fakeAsync(() => {
      component.contractControl.setValue(mockContracts[0]);
      component.onContractChanged();
      tick();
      fixture.detectChanges();

      const futureDate = moment().add(30, 'days');
      component.rows.controls.forEach((row) => {
        row.get('effDate')?.setValue(futureDate);
        row.get('effDate')?.updateValueAndValidity();
      });

      component.formDirty = true;

      service.saveTestMatrix.and.returnValue(
        of({ message: 'Saved', status: 'OK', warnings: [] })
      );

      const callCountBefore = service.getTestsDropdown.calls.count();
      component.onSave();
      tick();

      expect(service.getTestsDropdown.calls.count()).toBeGreaterThan(callCountBefore);
    }));
  });

  // ==================== Keyboard Handler ====================
  // ==================== blockLeadingSpace ====================
  // ==================== Date Helpers ====================

  describe('Date Helpers', () => {
    it('should return a term date filter function', () => {
      component.contractControl.setValue(mockContracts[0]);
      component.onContractChanged();
      fixture.detectChanges();

      const filter = component.getTermDateFilter(1);
      expect(typeof filter).toBe('function');
    });

    it('should allow null date in term date filter', () => {
      component.contractControl.setValue(mockContracts[0]);
      component.onContractChanged();
      fixture.detectChanges();

      const filter = component.getTermDateFilter(1);
      expect(filter(null)).toBe(true);
    });

    it('should format a valid date', () => {
      const result = component.formatDate(moment('2026-06-14'));
      expect(result).not.toBe('-');
    });


  });

  // ==================== clearAllRows ====================

  describe('clearAllRows', () => {
    it('should not clear when form is not dirty', () => {
      component.formDirty = false;
      component.selectedContract = mockContracts[0];
      const callCount = service.getTestsDropdown.calls.count();
      component.clearAllRows();
      expect(service.getTestsDropdown.calls.count()).toBe(callCount);
    });

    it('should not clear when no contract is selected', () => {
      component.formDirty = true;
      component.selectedContract = null;
      const callCount = service.getTestsDropdown.calls.count();
      component.clearAllRows();
      expect(service.getTestsDropdown.calls.count()).toBe(callCount);
    });

    it('should reload matrix when form is dirty and contract selected', () => {
      component.formDirty = true;
      component.selectedContract = mockContracts[0];
      const callCountBefore = service.getTestsDropdown.calls.count();
      component.clearAllRows();
      expect(service.getTestsDropdown.calls.count()).toBeGreaterThan(callCountBefore);
    });
  });

  // ==================== Cleanup ====================
});
