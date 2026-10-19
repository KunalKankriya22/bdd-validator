import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, forwardRef, Input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { CdcanComponent } from './cdcan';
import { CdcanService } from './cdcan.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { CustomerDbcrAdjustDto, CustomerLOV, AdviceLOV, ApiResponse } from './cdcan.model';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderStub { @Input() config: any; }

@Component({
  selector: 'ngx-mat-select-search',
  template: '',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatSelectSearchStub),
      multi: true
    }
  ]
})
class MatSelectSearchStub implements ControlValueAccessor {
  @Input() placeholderLabel = '';
  @Input() noEntriesFoundLabel = '';
  writeValue(_obj: any): void {}
  registerOnChange(_fn: any): void {}
  registerOnTouched(_fn: any): void {}
}

describe('CdcanComponent', () => {
  let component: CdcanComponent;
  let fixture: ComponentFixture<CdcanComponent>;
  let cdcanServiceSpy: jasmine.SpyObj<CdcanService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockCustomers: CustomerLOV[] = [
    { customerId: 'DAL-RG0001', customerName: 'Parkland Hospital' },
    { customerId: 'OBK-RG0003', customerName: 'OBK Regional Hospital' }
  ];

  const mockAdvices: AdviceLOV[] = [
    { adviceId: 'CM18-00000018', displayText: 'CM18-00000018' },
    { adviceId: 'CM18-00000019', displayText: 'CM18-00000019' }
  ];

  const mockAdviceDetails: CustomerDbcrAdjustDto = {
    adviceId: 'CM18-00000018',
    chapterId: 'CH01',
    customerId: 'DAL-RG0001',
    customerName: 'Parkland Hospital',
    tranType: 'CR',
    tranTypeDesc: 'Credit',
    reasonCode: 'BDAH',
    reasonDesc: 'Broken and discarded at St. Jude Hospital',
    requestDate: '2025-01-31T00:00:00Z',
    requestedBy: 'LHOFFMAN',
    orderNo: 'DM1-000402',
    serviceCode: 'F18200-02',
    serviceCodeDesc: 'Service Description',
    productCode: 'E0701V02',
    aliquot: null,
    unitId: 'W1234-18-031310-Z',
    quantity: 250,
    amount: 25.00,
    insertUserId: 'SGREEN',
    insertUserName: 'Samantha Green',
    insertDate: '2025-01-31T10:30:00Z',
    noteId: null,
    note1: null,
    note2: null,
    note3: null,
    patientName: 'Celhun Hunter',
    errorCorrectFlag: 'N',
    errorCorrectUser: null,
    errorCorrectDate: null
  };

  const mockCancelSuccess: ApiResponse<boolean> = {
    success: true,
    statusCode: 200,
    message: 'Advice cancelled successfully',
    item: true
  };

  const mockCancelFailure: ApiResponse<boolean> = {
    success: false,
    statusCode: 400,
    message: 'Advice not found or already cancelled',
    item: false
  };

  beforeEach(async () => {
    cdcanServiceSpy = jasmine.createSpyObj('CdcanService', [
      'getCustomers',
      'getAdvicesByCustomer',
      'getAdviceById',
      'cancelAdvice'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    cdcanServiceSpy.getCustomers.and.returnValue(of(mockCustomers));
    cdcanServiceSpy.getAdvicesByCustomer.and.returnValue(of(mockAdvices));
    cdcanServiceSpy.getAdviceById.and.returnValue(of(mockAdviceDetails));
    cdcanServiceSpy.cancelAdvice.and.returnValue(of(mockCancelSuccess));

    const pageHeaderServiceSpy = { pageHeaderData: signal(undefined) };
    const headerServiceSpy = {
      getCurrentChapterTimezone: () => 'UTC',
      chapterChanged$: new Subject<void>()
    };

    await TestBed.configureTestingModule({
      imports: [CdcanComponent, NoopAnimationsModule],
      providers: [
        { provide: CdcanService, useValue: cdcanServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    })
    .overrideComponent(CdcanComponent, {
      remove: { imports: [PageHeaderWithBreadcrumb, MatDialogModule, NgxMatSelectSearchModule] },
      add: { imports: [PageHeaderStub, MatSelectSearchStub] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdcanComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {

    it('should load customers on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(cdcanServiceSpy.getCustomers).toHaveBeenCalled();
      expect(component['customerOptions']()).toEqual(mockCustomers);
    }));

    it('should show error when customers fail to load', fakeAsync(() => {
      cdcanServiceSpy.getCustomers.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load customer list. Please try again.');
      expect(component['loadingCustomers']()).toBeFalse();
    }));

  });

  describe('Customer Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load advice options when customer is selected', fakeAsync(() => {
      component.form.get('customerId')?.setValue('DAL-RG0001');
      tick();

      expect(cdcanServiceSpy.getAdvicesByCustomer).toHaveBeenCalledWith('DAL-RG0001');
      expect(component['adviceOptions']()).toEqual(mockAdvices);
    }));

    it('should display customer description when customer is selected', fakeAsync(() => {
      component.form.get('customerId')?.setValue('DAL-RG0001');
      tick();
      fixture.detectChanges();

      expect(component['customerDescription']()).toBe('Parkland Hospital');
    }));

    it('should display "—" when no customer is selected', () => {
      fixture.detectChanges();
      expect(component['customerDescription']()).toBe('—');
    });

    it('should show error when advice list fails to load', fakeAsync(() => {
      cdcanServiceSpy.getAdvicesByCustomer.and.returnValue(throwError(() => new Error('Network error')));
      component.form.get('customerId')?.setValue('DAL-RG0001');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load advice list. Please try again.');
      expect(component['loadingAdvices']()).toBeFalse();
    }));

    it('should return "—" for customerDescription when selected customer is not in options list', fakeAsync(() => {
      component['customerOptions'].set(mockCustomers);
      component['selectedCustomerId'].set('NOT-IN-LIST');
      tick();

      expect(component['customerDescription']()).toBe('—');
    }));
  });

  describe('Search Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all customers when search is empty', fakeAsync(() => {
      component.customerSearchCtrl.setValue('');
      tick();

      const filtered = component['filteredCustomerOptions']();
      expect(filtered.length).toBe(2);
    }));

    it('should return all advice options when search is empty', fakeAsync(() => {
      component.form.get('customerId')?.setValue('DAL-RG0001');
      tick();

      component.adviceSearchCtrl.setValue('');
      tick();

      const filtered = component['filteredAdviceOptions']();
      expect(filtered.length).toBe(2);
    }));

    it('should filter customers by name search term', fakeAsync(() => {
      component['customerOptions'].set(mockCustomers);
      component.customerSearchCtrl.setValue('Parkland');
      tick();

      const filtered = component['filteredCustomerOptions']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerId).toBe('DAL-RG0001');
    }));

    it('should filter customers by customerId search term', fakeAsync(() => {
      component['customerOptions'].set(mockCustomers);
      component.customerSearchCtrl.setValue('OBK-RG');
      tick();

      const filtered = component['filteredCustomerOptions']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerId).toBe('OBK-RG0003');
    }));

    it('should filter advice options by advice ID search term', fakeAsync(() => {
      component.form.get('customerId')?.setValue('DAL-RG0001');
      tick();
      component.adviceSearchCtrl.setValue('CM18-00000018');
      tick();

      const filtered = component['filteredAdviceOptions']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].adviceId).toBe('CM18-00000018');
    }));
  });

  describe('Retrieve Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should retrieve advice details when form is valid', fakeAsync(() => {
      component.form.patchValue({
        customerId: 'DAL-RG0001',
        adviceId: 'CM18-00000018'
      });

      component.onRetrieve();
      tick();

      expect(cdcanServiceSpy.getAdviceById).toHaveBeenCalledWith('CM18-00000018');
      expect(component['adviceDetails']()).toEqual(mockAdviceDetails);
    }));

    it('should not call service when form is invalid', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect(cdcanServiceSpy.getAdviceById).not.toHaveBeenCalled();
      expect(component['submitted']()).toBeTrue();
    }));

    it('should show error when advice record is not found', fakeAsync(() => {
      cdcanServiceSpy.getAdviceById.and.returnValue(of(null));
      component.form.patchValue({ customerId: 'DAL-RG0001', adviceId: 'CM18-00000018' });
      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Advice record not found.');
      expect(component['loading']()).toBeFalse();
    }));

    it('should show custom error message when retrieve API call fails', fakeAsync(() => {
      cdcanServiceSpy.getAdviceById.and.returnValue(
        throwError(() => ({ error: { message: 'Custom error message' } }))
      );
      component.form.patchValue({ customerId: 'DAL-RG0001', adviceId: 'CM18-00000018' });
      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Custom error message');
      expect(component['loading']()).toBeFalse();
    }));

    it('should show default error message when retrieve API call fails without message', fakeAsync(() => {
      cdcanServiceSpy.getAdviceById.and.returnValue(throwError(() => ({})));
      component.form.patchValue({ customerId: 'DAL-RG0001', adviceId: 'CM18-00000018' });
      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to retrieve advice details. Please try again.');
    }));
  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form when clear all is clicked', () => {
      component.form.patchValue({
        customerId: 'DAL-RG0001',
        adviceId: 'CM18-00000018'
      });
      component['adviceDetails'].set(mockAdviceDetails);

      component.onClearAll();

      expect(component.form.get('customerId')?.value).toBeNull();
      expect(component.form.get('adviceId')?.value).toBeNull();
      expect(component['adviceDetails']()).toBeNull();
      expect(component['submitted']()).toBeFalse();
    });

    it('should clear advice options and details', () => {
      component['adviceOptions'].set(mockAdvices);
      component['adviceDetails'].set(mockAdviceDetails);

      component.onClearAll();

      expect(component['adviceOptions']()).toEqual([]);
      expect(component['adviceDetails']()).toBeNull();
    });
  });

  describe('Cancel Advice Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['adviceDetails'].set(mockAdviceDetails);
    });

    it('should cancel advice when user confirms', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCancelAdvice();
      tick();

      expect(cdcanServiceSpy.cancelAdvice).toHaveBeenCalledWith('CM18-00000018');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        'Advice for Customer ID DAL-RG0001 has been cancelled.'
      );
    }));

    it('should handle cancellation error', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      cdcanServiceSpy.cancelAdvice.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot cancel' } }))
      );

      component.onCancelAdvice();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component['loading']()).toBeFalse();
    }));

    it('should not open dialog when advice details are null', () => {
      component['adviceDetails'].set(null);
      component.onCancelAdvice();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should not cancel advice when user declines dialog confirmation', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCancelAdvice();
      tick();

      expect(cdcanServiceSpy.cancelAdvice).not.toHaveBeenCalled();
    }));

    it('should show error when cancellation response indicates failure', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      cdcanServiceSpy.cancelAdvice.and.returnValue(of(mockCancelFailure));

      component.onCancelAdvice();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Advice not found or already cancelled');
      expect(component['loading']()).toBeFalse();
    }));

    it('should show default error when cancellation response has success false with no message', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      cdcanServiceSpy.cancelAdvice.and.returnValue(
        of({ success: false, statusCode: 400, message: null, item: false } as any)
      );

      component.onCancelAdvice();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to cancel advice. Please try again.');
    }));

    it('should show default error message when cancel API call fails without error details', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      cdcanServiceSpy.cancelAdvice.and.returnValue(throwError(() => ({})));

      component.onCancelAdvice();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to cancel advice. Please try again.');
    }));
  });

  describe('Display States', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show results when advice details are loaded', () => {
      component['adviceDetails'].set(mockAdviceDetails);
      component['loading'].set(false);
      fixture.detectChanges();

      expect(component['hasResults']()).toBeTrue();
      const resultsContainer = fixture.debugElement.query(By.css('.results-container'));
      expect(resultsContainer).toBeTruthy();
    });
  });

  describe('Formatting Helpers', () => {

    it('should return "—" for null date', () => {
      expect(component['formatDate'](null)).toBe('—');
    });

    it('should return "—" for null currency', () => {
      expect(component['formatCurrency'](null)).toBe('—');
    });

    it('should format quantity correctly', () => {
      expect(component['formatQuantity'](250)).toBe('250');
    });

    it('should return "—" for null quantity', () => {
      expect(component['formatQuantity'](null)).toBe('—');
    });

    it('should display value or "—" for null strings', () => {
      expect(component['displayValue']('Test')).toBe('Test');
      expect(component['displayValue'](null)).toBe('—');
      expect(component['displayValue'](undefined)).toBe('—');
    });

    it('should format a valid date string correctly', () => {
      const result = component['formatDate']('2025-01-31T10:30:00Z');
      expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}/);
    });

    it('should return "—" for an invalid date string', () => {
      expect(component['formatDate']('not-a-valid-date')).toBe('—');
    });

    it('should format zero amount as "$0.00"', () => {
      expect(component['formatCurrency'](0)).toBe('$0.00');
    });

    it('should format a positive amount correctly', () => {
      expect(component['formatCurrency'](25.50)).toBe('$25.50');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when Customer ID is empty and submitted', () => {
      component['submitted'].set(true);
      fixture.detectChanges();

      const customerIdField = component.form.get('customerId');
      expect(customerIdField?.invalid).toBeTrue();
    });

    it('should show error when Advice ID is empty and submitted', () => {
      component.form.get('adviceId')?.enable({ emitEvent: false });
      component['submitted'].set(true);
      fixture.detectChanges();

      const adviceIdField = component.form.get('adviceId');
      expect(adviceIdField?.invalid).toBeTrue();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
