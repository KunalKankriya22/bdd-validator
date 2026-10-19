import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ContractListComponent } from './contract-list.component';
import { RegionalTestingContractService } from '../../services/regional-testing-contract.service';
import { RegionalTestingContract } from '../../models/regional-testing-contract.models';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ContractListComponent', () => {
  let component: ContractListComponent;
  let fixture: ComponentFixture<ContractListComponent>;
  let contractServiceSpy: jasmine.SpyObj<RegionalTestingContractService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockContracts: RegionalTestingContract[] = [
    {
      contractId: 'CNT001',
      chapterId: 'OBK',
      contractType: 'T',
      customerName: 'Test Lab 1',
      customerId: 'CUST001',
      exportCode: 'US',
      agreementDate: null,
      effDate: '2025-01-01T00:00:00Z',
      termDate: null,
      addressId: 100,
      contactName: 'C',
      lastModifiedDate: '2026-06-16T00:00:00Z',
      programId: 'RGICNTCT',
      auditKey: 1000
    },
    {
      contractId: 'CNT002',
      chapterId: 'DAL',
      contractType: 'R',
      customerName: 'Test Lab 2',
      customerId: 'CUST002',
      exportCode: 'CA',
      agreementDate: null,
      effDate: '2025-01-01T00:00:00Z',
      termDate: '2025-12-31T00:00:00Z',
      addressId: 101,
      contactName: 'C',
      lastModifiedDate: '2026-06-16T00:00:00Z',
      programId: 'RGICNTCT',
      auditKey: 1001
    }
  ];

  beforeEach(() => {

    contractServiceSpy = jasmine.createSpyObj('RegionalTestingContractService', ['getContracts']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);



      TestBed.configureTestingModule({
      imports: [ContractListComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RegionalTestingContractService, useValue: contractServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });


    


      contractServiceSpy.getContracts.calls.reset();


      routerSpy.navigate.calls.reset();


    contractServiceSpy.getContracts.and.returnValue(of({
      success: true,
      statusCode: 200,
      message: 'Data retrieved successfully',
      data: mockContracts,
      totalCount: 2
    }));

    fixture = TestBed.createComponent(ContractListComponent);
    component = fixture.componentInstance;


    });

  describe('Error Handling', () => {
    it('should handle error when loading contracts fails', () => {
      contractServiceSpy.getContracts.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect((component as any).error()).toBeTruthy();
      expect((component as any).contracts().length).toBe(0);
    });

    it('should display error message', () => {
      // Trigger ngOnInit first so forms are initialized, then set error
      fixture.detectChanges();
      (component as any).error.set('Failed to load contracts');
      (component as any).loading.set(false);
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('.error-container');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Failed to load contracts');
    });
  });
  describe('Table Display', () => {
    it('should display contracts in table', () => {
      fixture.detectChanges();

      const table = fixture.nativeElement.querySelector('table');
      expect(table).toBeTruthy();

      const rows = fixture.nativeElement.querySelectorAll('tr[mat-row]');
      expect(rows.length).toBe(2);
    });

    it('should show edit icon for each contract', () => {
      fixture.detectChanges();

      const editButtons = fixture.nativeElement.querySelectorAll('button[mat-icon-button]');
      expect(editButtons.length).toBe(2);
    });
  });
});
