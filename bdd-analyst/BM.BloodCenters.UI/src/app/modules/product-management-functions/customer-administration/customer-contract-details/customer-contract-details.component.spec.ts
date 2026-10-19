import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CustomerContractDetailsComponent } from './customer-contract-details.component';
import { CustomerContractApiService } from './services/customer-contract-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { CustomerContractDto } from './models/customer-contract.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CustomerContractDetailsComponent', () => {
  let component: CustomerContractDetailsComponent;
  let fixture: ComponentFixture<CustomerContractDetailsComponent>;
  let apiServiceSpy: jasmine.SpyObj<CustomerContractApiService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockContracts: CustomerContractDto[] = [
    {
      contractId: 'DI0121-001',
      customerId: 'WAD-DI0121',
      rotationFlag: 'Y',
      poNumber: 'PO-12345',
      creditLimit: 5000.00,
      startTerm: '01-Jan-2026',
      endTerm: '31-Dec-2026',
      effDate: '01-Jan-2026',
      termDate: null,
      lastModifiedDate: '06-Jun-2026'
    },
    {
      contractId: 'DI0121-002',
      customerId: 'WAD-DI0121',
      rotationFlag: 'N',
      poNumber: 'PO-12346',
      creditLimit: 10000.00,
      startTerm: '01-Jan-2026',
      endTerm: '31-Dec-2026',
      effDate: '01-Jan-2026',
      termDate: '2026-12-31',
      lastModifiedDate: '06-Jun-2026'
    }
  ];

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('CustomerContractApiService', ['getCustomerContracts']);
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error']);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();
    headerServiceSpy.chapterChanged$ = chapterChangedSubject.asObservable();

    apiServiceSpy.getCustomerContracts.and.returnValue(of({ data: mockContracts, total: 2 }));

    TestBed.configureTestingModule({
      imports: [CustomerContractDetailsComponent, NoopAnimationsModule],
      providers: [
        { provide: CustomerContractApiService, useValue: apiServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    apiServiceSpy.getCustomerContracts.calls.reset();
    loggingServiceSpy.error.calls.reset();
    apiServiceSpy.getCustomerContracts.and.returnValue(of({ data: mockContracts, total: 2 }));

    fixture = TestBed.createComponent(CustomerContractDetailsComponent);
    component = fixture.componentInstance;
    component.customerId = 'WAD-DI0121';
    component.customerName = 'BAYLOR SPECIAL HEMATOLOGY';
    component.customerCity = 'DALLAS';
  });

  describe('Initialization', () => {
    it('should load contracts on init when customerId is provided', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getCustomerContracts).toHaveBeenCalledWith(
        'WAD-DI0121',
        25,
        0,
        jasmine.objectContaining({ customerId: 'WAD-DI0121' })
      );
    });

    it('should not load contracts when customerId is empty', () => {
      component.customerId = '';
      fixture.detectChanges();
      expect(apiServiceSpy.getCustomerContracts).not.toHaveBeenCalled();
    });

    it('should subscribe to chapter changes on init', () => {
      fixture.detectChanges();
      apiServiceSpy.getCustomerContracts.calls.reset();

      chapterChangedSubject.next();

      expect(apiServiceSpy.getCustomerContracts).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('isEmpty getter', () => {
    it('should return true when contracts array is empty and not loading and no error', () => {
      component.contracts.apply(component, []);
      component['contracts'].set([]);
      component['isLoading'].set(false);
      component['hasError'].set(false);
      expect(component.isEmpty).toBeTrue();
    });

    it('should return false when contracts exist', () => {
      fixture.detectChanges();
      expect(component.isEmpty).toBeFalse();
    });

    it('should return false when loading', () => {
      component['contracts'].set([]);
      component['isLoading'].set(true);
      expect(component.isEmpty).toBeFalse();
    });

    it('should return false when there is an error', () => {
      component['contracts'].set([]);
      component['hasError'].set(true);
      expect(component.isEmpty).toBeFalse();
    });
  });

  describe('loadContracts', () => {
    it('should set error when customerId is missing', () => {
      component.customerId = '';
      component.loadContracts();
      expect(component.hasError()).toBeTrue();
      expect(component.errorMessage()).toBe('Customer ID is required');
    });

    it('should set isLoading to true while loading', () => {
      const subject = new Subject<any>();
      apiServiceSpy.getCustomerContracts.and.returnValue(subject.asObservable());

      component.loadContracts();
      expect(component.isLoading()).toBeTrue();

      subject.next({ data: [], total: 0 });
      subject.complete();
      expect(component.isLoading()).toBeFalse();
    });

    it('should sort contracts with active first', () => {
      const activeContract: CustomerContractDto = {
        contractId: 'C-002',
        customerId: 'WAD-DI0121',
        effDate: '2026-01-01',
        termDate: null
      };
      const inactiveContract: CustomerContractDto = {
        contractId: 'C-001',
        customerId: 'WAD-DI0121',
        effDate: '2020-01-01',
        termDate: '2020-12-31'
      };

      apiServiceSpy.getCustomerContracts.and.returnValue(of({
        data: [inactiveContract, activeContract],
        total: 2
      }));

      component.loadContracts();

      const sorted = component.contracts();
      expect(sorted[0].contractId).toBe('C-002');
      expect(sorted[1].contractId).toBe('C-001');
    });

    it('should emit activeContractCount', () => {
      const emitSpy = spyOn(component.activeContractCount, 'emit');
      fixture.detectChanges();
      expect(emitSpy).toHaveBeenCalledWith(jasmine.any(Number));
    });

    it('should set totalRecords from response', () => {
      fixture.detectChanges();
      expect(component.totalRecords()).toBe(2);
    });

    it('should handle error with structured error code', () => {
      const error = {
        error: {
          errorResponse: {
            errorCode: '1234',
            error: 'Structured error message'
          }
        }
      };
      apiServiceSpy.getCustomerContracts.and.returnValue(throwError(() => error));

      component.loadContracts();

      expect(component.hasError()).toBeTrue();
      expect(component.errorMessage()).toContain('Error 1234');
      expect(component.errorMessage()).toContain('Structured error message');
    });

    it('should handle error with errorCode at body level', () => {
      const error = {
        error: {
          errorCode: '5678',
          error: 'Body error'
        }
      };
      apiServiceSpy.getCustomerContracts.and.returnValue(throwError(() => error));

      component.loadContracts();

      expect(component.errorMessage()).toContain('Error 5678');
    });

    it('should handle error with message only', () => {
      const error = {
        error: {
          message: 'Simple error message'
        }
      };
      apiServiceSpy.getCustomerContracts.and.returnValue(throwError(() => error));

      component.loadContracts();

      expect(component.errorMessage()).toBe('Simple error message');
    });

    it('should use default error message when no message in response', () => {
      const error = { error: {} };
      apiServiceSpy.getCustomerContracts.and.returnValue(throwError(() => error));

      component.loadContracts();

      expect(component.errorMessage()).toBe('Failed to load customer contracts. Please try again.');
    });

    it('should log error and show snackbar on failure', () => {
      const error = { error: { message: 'Test error' } };
      apiServiceSpy.getCustomerContracts.and.returnValue(throwError(() => error));

      component.loadContracts();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith('Failed to load customer contracts', error);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });

  describe('Error State', () => {
    it('should show error message on load failure', () => {
      const error = { error: { message: 'Test error' } };
      apiServiceSpy.getCustomerContracts.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      expect(component.hasError()).toBeTrue();
      expect(component.errorMessage()).toContain('Test error');
    });

    it('should display retry button in error state', () => {
      const error = { error: { message: 'Test error' } };
      apiServiceSpy.getCustomerContracts.and.returnValue(throwError(() => error));
      fixture.detectChanges();

      const retryButton = fixture.debugElement.query(By.css('.error-container button'));
      expect(retryButton).toBeTruthy();
    });
  });

  describe('Contracts Display', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(() => {
        fixture.detectChanges();
        done();
      }, 100);
    });

    it('should display contract cards', () => {
      const cards = fixture.debugElement.queryAll(By.css('app-customer-contract-card'));
      expect(cards.length).toBe(2);
    });

    it('should pass contract data to card components', () => {
      const firstCard = fixture.debugElement.query(By.css('app-customer-contract-card'));
      expect(firstCard.componentInstance.contract).toEqual(mockContracts[0]);
    });

    it('should pass customerName to card components', () => {
      const firstCard = fixture.debugElement.query(By.css('app-customer-contract-card'));
      expect(firstCard.componentInstance.customerName).toBe('BAYLOR SPECIAL HEMATOLOGY');
    });

    it('should pass customerCity to card components', () => {
      const firstCard = fixture.debugElement.query(By.css('app-customer-contract-card'));
      expect(firstCard.componentInstance.customerCity).toBe('DALLAS');
    });

    it('should have proper aria-label on contracts grid', () => {
      const grid = fixture.debugElement.query(By.css('.contracts-grid'));
      const ariaLabel = grid.attributes['aria-label'];
      expect(ariaLabel).toContain('Customer contracts');
      expect(ariaLabel).toContain('2 total');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no contracts returned', () => {
      apiServiceSpy.getCustomerContracts.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();

      const emptyContainer = fixture.debugElement.query(By.css('.empty-container'));
      expect(emptyContainer).toBeTruthy();
    });
  });

  describe('Add New Contract', () => {
    it('should open side panel on add new click', () => {
      fixture.detectChanges();
      const addButton = fixture.debugElement.query(By.css('[aria-label="Add new customer contract"]'));
      addButton.nativeElement.click();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
    });

    it('should set customerId in sidePanelData when adding', () => {
      component.onAddNew();
      expect(component.sidePanelData?.customerId).toBe('WAD-DI0121');
    });

    it('should set empty contractId in sidePanelData when adding', () => {
      component.onAddNew();
      expect(component.sidePanelData?.contractId).toBe('');
    });

    it('should close side panel when overlay clicked', () => {
      component.onAddNew();
      fixture.detectChanges();

      const overlay = fixture.debugElement.query(By.css('.side-panel-overlay'));
      overlay.nativeElement.click();

      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  describe('Edit Contract', () => {
    it('should open side panel on edit', () => {
      component.onEditContract(mockContracts[0]);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockContracts[0]);
    });
  });

  describe('closeSidePanel', () => {
    it('should close panel and clear data', () => {
      component.onAddNew();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelData).toBeTruthy();

      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('onSaveSuccess', () => {
    it('should reload contracts on save success', () => {
      fixture.detectChanges();
      apiServiceSpy.getCustomerContracts.calls.reset();

      component.onSaveSuccess();

      expect(apiServiceSpy.getCustomerContracts).toHaveBeenCalled();
    });
  });

  describe('Chapter Changes', () => {
    it('should reload contracts when chapter changes', () => {
      fixture.detectChanges();
      apiServiceSpy.getCustomerContracts.calls.reset();

      chapterChangedSubject.next();

      expect(apiServiceSpy.getCustomerContracts).toHaveBeenCalled();
    });
  });

  describe('isContractActive edge cases', () => {
    it('should handle contract with termDate in the past', () => {
      const pastContract: CustomerContractDto = {
        contractId: 'C-PAST',
        customerId: 'WAD-DI0121',
        effDate: '2020-01-01',
        termDate: '2020-06-01'
      };

      apiServiceSpy.getCustomerContracts.and.returnValue(of({
        data: [pastContract],
        total: 1
      }));

      component.loadContracts();

      const sorted = component.contracts();
      expect(sorted.length).toBe(1);
    });

    it('should handle when chapterTimeZone is falsy', () => {
      headerServiceSpy.chapterTimeZone = undefined as any;

      const contractWithTerm: CustomerContractDto = {
        contractId: 'C-003',
        customerId: 'WAD-DI0121',
        effDate: '2026-01-01',
        termDate: '2020-01-01'
      };

      apiServiceSpy.getCustomerContracts.and.returnValue(of({
        data: [contractWithTerm],
        total: 1
      }));

      component.loadContracts();

      expect(component.contracts().length).toBe(1);
    });
  });

  describe('loadContracts error edge cases', () => {
    it('should handle error with errorResponse but no errorCode', () => {
      const error = {
        error: {
          errorResponse: {
            error: 'Error without code'
          }
        }
      };
      apiServiceSpy.getCustomerContracts.and.returnValue(throwError(() => error));

      component.loadContracts();

      expect(component.errorMessage()).toBe('Error without code');
    });

    it('should handle error when error.error is null', () => {
      const error = { error: null };
      apiServiceSpy.getCustomerContracts.and.returnValue(throwError(() => error));

      component.loadContracts();

      expect(component.errorMessage()).toBe('Failed to load customer contracts. Please try again.');
    });
  });

  describe('elementId', () => {
    it('should generate unique element IDs', () => {
      const id1 = component['elementId']('heading');
      const id2 = component['elementId']('add-btn');
      expect(id1).toContain('heading');
      expect(id2).toContain('add-btn');
      expect(id1).not.toEqual(id2);
    });
  });
});
