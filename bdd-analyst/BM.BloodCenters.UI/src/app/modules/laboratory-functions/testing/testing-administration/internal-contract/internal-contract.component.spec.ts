import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

import { InternalContractComponent } from './internal-contract.component';
import { InternalContractService } from './internal-contract.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { MenuService } from '@shared/services/menu.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  Contract,
  ContractWithDetails,
  MasterCode,
  ValidTest,
  State,
  Country,
  Contact,
  ContractTest
} from './internal-contract.models';

@Component({ selector: 'app-page-header-with-breadcrumb', standalone: true, template: '' })
class PageHeaderWithBreadcrumbStub {
  @Input() config: unknown;
}

describe('InternalContractComponent', () => {
  let component: InternalContractComponent;
  let fixture: ComponentFixture<InternalContractComponent>;
  let contractServiceSpy: jasmine.SpyObj<InternalContractService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockContractTypes: MasterCode[] = [
    { codeType: 'CONTR', codeValue: 'CT', codeDescription: 'Contract Type' }
  ];

  const mockBarcodeProtocols: MasterCode[] = [
    { codeType: 'BARCD', codeValue: '8', codeDescription: 'Protocol 8' },
    { codeType: 'BARCD', codeValue: '1', codeDescription: 'Protocol 1' }
  ];

  const mockValidTests: ValidTest[] = [
    { testId: 'TEST001', testDescription: 'Test Description' }
  ];

  const mockContractsList = [
    { contractId: '001CT0001', company: 'Test Company' },
    { contractId: '001CT0002', company: 'Another Company' }
  ];

  const mockContractWithDetails: ContractWithDetails = {
    contract: {
      contractType: 'CT',
      contractId: '001CT0001',
      chapterId: '001',
      company: 'Test Company',
      addressId: 1,
      taxIdForm: '123456789',
      barCodeProtocol: '8',
      unitIdPattern: '=',
      ediInputInd: 'Y',
      resultOutputInd: 'R',
      confirmTestFlag: 'Y',
      effDate: '2026-01-01',
      termDate: null
    },
    address: {
      addressId: 1,
      addressLine1: '123 Main St',
      addressLine2: null,
      city: 'Boston',
      stateCode: 'MA',
      zipCode: '02115',
      country: 'US',
      intFlag: null
    },
    contacts: [],
    tests: [
      {
        testId: 'TEST001',
        stopLabelFlag: 'N',
        effDate: '2026-01-01',
        termDate: null,
        testDescription: 'Test Description'
      }
    ]
  };

  beforeEach(() => {

    contractServiceSpy = jasmine.createSpyObj('InternalContractService', [
      'getAll',
      'getById',
      'create',
      'update',
      'delete',
      'getContractTypes',
      'getBarcodeProtocols',
      'getValidTests',
      'getStates',
      'getCountries',
      'getContractsLov',
      'getContractTests',
      'createContractTest',
      'updateContractTest',
      'deleteContractTest'
    ]);

    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'buildBreadcrumbsFromPath']);
    dialogSpy = createMockMatDialog();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    // Setup default spy returns
    contractServiceSpy.getContractTypes.and.returnValue(of(mockContractTypes));
    contractServiceSpy.getBarcodeProtocols.and.returnValue(of(mockBarcodeProtocols));
    contractServiceSpy.getValidTests.and.returnValue(of(mockValidTests));
    contractServiceSpy.getContractsLov.and.returnValue(of(mockContractsList));
    contractServiceSpy.getById.and.returnValue(of(mockContractWithDetails));
    loginServiceSpy.getStoredUsername.and.returnValue('testuser');
    menuServiceSpy.getMenuItemsSignal.and.returnValue(() => []);
    menuServiceSpy.buildBreadcrumbsFromPath.and.returnValue([]);

      TestBed.configureTestingModule({
      imports: [InternalContractComponent, NoopAnimationsModule],
      providers: [
        { provide: InternalContractService, useValue: contractServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    })
      .overrideComponent(InternalContractComponent, {
        remove: { imports: [PageHeaderWithBreadcrumb] },
        add: {
          imports: [PageHeaderWithBreadcrumbStub],
          providers: [{ provide: MatDialog, useValue: dialogSpy }],
        },
      });

    

      contractServiceSpy.getAll.calls.reset();

      contractServiceSpy.getById.calls.reset();

      contractServiceSpy.create.calls.reset();

      contractServiceSpy.update.calls.reset();

      contractServiceSpy.delete.calls.reset();

      contractServiceSpy.getContractTypes.calls.reset();

      contractServiceSpy.getBarcodeProtocols.calls.reset();

      contractServiceSpy.getValidTests.calls.reset();

      contractServiceSpy.getStates.calls.reset();

      contractServiceSpy.getCountries.calls.reset();

      contractServiceSpy.getContractsLov.calls.reset();

      contractServiceSpy.getContractTests.calls.reset();

      contractServiceSpy.createContractTest.calls.reset();

      contractServiceSpy.updateContractTest.calls.reset();

      contractServiceSpy.deleteContractTest.calls.reset();

      headerServiceSpy.getCurrentChapterId.calls.reset();

      loginServiceSpy.getStoredUsername.calls.reset();

      menuServiceSpy.getMenuItemsSignal.calls.reset();

      menuServiceSpy.buildBreadcrumbsFromPath.calls.reset();

      dialogSpy.open.calls.reset();

      routerSpy.navigate.calls.reset();

      contractServiceSpy.getContractTypes.and.returnValue(of(mockContractTypes));

      contractServiceSpy.getBarcodeProtocols.and.returnValue(of(mockBarcodeProtocols));

      contractServiceSpy.getValidTests.and.returnValue(of(mockValidTests));

      contractServiceSpy.getContractsLov.and.returnValue(of(mockContractsList));

      contractServiceSpy.getById.and.returnValue(of(mockContractWithDetails));
      loginServiceSpy.getStoredUsername.and.returnValue('testuser');

      menuServiceSpy.getMenuItemsSignal.and.returnValue(() => []);

      menuServiceSpy.buildBreadcrumbsFromPath.and.returnValue([]);

    fixture = TestBed.createComponent(InternalContractComponent);
    component = fixture.componentInstance;

    });

  describe('Initialization', () => {

    it('should load contracts list on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(contractServiceSpy.getContractsLov).toHaveBeenCalled();
      expect(component.contractsList()).toEqual(mockContractsList);
    }));

    it('should load lookup data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(contractServiceSpy.getContractTypes).toHaveBeenCalled();
      expect(contractServiceSpy.getBarcodeProtocols).toHaveBeenCalled();
      expect(contractServiceSpy.getValidTests).toHaveBeenCalled();

      expect(component.contractTypes()).toEqual(mockContractTypes);
    }));

    it('should handle contracts list load error', fakeAsync(() => {
      contractServiceSpy.getContractsLov.and.returnValue(throwError(() => new Error('Load error')));

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load contracts list.');
    }));
  });

  describe('Contract Retrieval', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load contract details on retrieve', fakeAsync(() => {
      component.selectedContractId.set('001CT0001');
      component.onRetrieve();
      tick();

      expect(contractServiceSpy.getById).toHaveBeenCalledWith('001CT0001');
      expect(component.contractData()).toEqual(mockContractWithDetails);
      expect(component.isDetailPanelOpen()).toBe(true);
    }));
  });

  describe('Clear All', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear all data', fakeAsync(() => {
      component.selectedContractId.set('001CT0001');
      component.onRetrieve();
      tick();

      expect(component.contractData()).toBeTruthy();

      component.onClearAll();

      expect(component.selectedContractId()).toBeNull();
      expect(component.contractData()).toBeNull();
      expect(component.testsDataSource()).toEqual([]);
      expect(component.filteredTests()).toEqual([]);
      expect(component.hasError()).toBe(false);
      expect(component.isDetailPanelOpen()).toBe(false);
    }));
  });

  describe('Test Search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedContractId.set('001CT0001');
      component.onRetrieve();
      tick();
    }));

    it('should filter tests by keyword', () => {
      component.onSearch('TEST001');
      expect(component.filteredTests().length).toBe(1);
    });

    it('should show all tests when search is empty', () => {
      component.onSearch('');
      expect(component.filteredTests().length).toBe(1);
    });

    it('should show no tests when keyword does not match', () => {
      component.onSearch('NONEXISTENT');
      expect(component.filteredTests().length).toBe(0);
    });
  });

  describe('Test Operations', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedContractId.set('001CT0001');
      component.onRetrieve();
      tick();
    }));

    it('should add test via dialog', fakeAsync(() => {
      const newTest: ContractTest = {
        testId: 'TEST002',
        stopLabelFlag: 'N',
        effDate: '2026-06-15',
        termDate: null,
        testDescription: 'New Test'
      };

      contractServiceSpy.createContractTest.and.returnValue(of(newTest));
      contractServiceSpy.getContractTests.and.returnValue(of([...mockContractWithDetails.tests!, newTest]));

      dialogSpy.open.and.returnValue({
        afterClosed: () => of(newTest)
      } as any);

      component.onAddTest();
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(contractServiceSpy.createContractTest).toHaveBeenCalledWith('001CT0001', '001', newTest);
    }));

    it('should edit test via dialog', fakeAsync(() => {
      const existingTest = mockContractWithDetails.tests![0];
      const updatedTest = { ...existingTest, stopLabelFlag: 'Y' };

      contractServiceSpy.updateContractTest.and.returnValue(of(updatedTest));
      contractServiceSpy.getContractTests.and.returnValue(of([updatedTest]));

      dialogSpy.open.and.returnValue({
        afterClosed: () => of(updatedTest)
      } as any);

      component.onEditTest(existingTest);
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(contractServiceSpy.updateContractTest).toHaveBeenCalledWith(
        '001CT0001', 'TEST001', '001', updatedTest
      );
    }));
  });

  describe('Contract Edit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedContractId.set('001CT0001');
      component.onRetrieve();
      tick();
    }));

    it('should update contract after edit', fakeAsync(() => {
      const updatedData = {
        contract: mockContractWithDetails.contract,
        contact: null
      };

      contractServiceSpy.update.and.returnValue(of({ contractId: '001CT0001', message: 'Success' }));

      dialogSpy.open.and.returnValue({
        afterClosed: () => of(updatedData)
      } as any);

      component.onEdit();
      tick();

      expect(contractServiceSpy.update).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Contract updated successfully');
    }));
  });
  describe('Helper Methods', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should get contract type description', () => {
      expect(component.getContractTypeDescription('CT')).toBe('Contract Type');
      expect(component.getContractTypeDescription('UNKNOWN')).toBe('UNKNOWN');
      expect(component.getContractTypeDescription(null)).toBe('-');
    });

    it('should get first contact', fakeAsync(() => {
      component.selectedContractId.set('001CT0001');
      const contractWithContact: ContractWithDetails = {
        ...mockContractWithDetails,
        contacts: [{
          contactId: 1,
          contactType: 'C',
          contactLastName: 'Doe',
          contactFirstName: 'John',
          contactTitle: 'Manager',
          phoneNumber: '555-555-5555',
          faxNumber: null
        }]
      };
      contractServiceSpy.getById.and.returnValue(of(contractWithContact));
      component.onRetrieve();
      tick();

      expect(component.getFirstContact()).toBeTruthy();
      expect(component.getFirstContact()!.contactLastName).toBe('Doe');
    }));

    it('should return null when no contacts', fakeAsync(() => {
      component.selectedContractId.set('001CT0001');
      component.onRetrieve();
      tick();

      expect(component.getFirstContact()).toBeNull();
    }));
  });
});
