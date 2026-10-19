import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { CloseBoxComponent } from './close-box';
import { CloseBoxService } from './services/close-box.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { CloseBoxDto, CloseBoxResultDto } from './models/close-box.model';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('CloseBoxComponent', () => {
  let component: CloseBoxComponent;
  let fixture: ComponentFixture<CloseBoxComponent>;
  let closeBoxServiceSpy: jasmine.SpyObj<CloseBoxService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockBoxDetails: CloseBoxDto = {
    boxId: 'BOX001',
    boxType: 'ST',
    boxTypeDescription: 'Standard',
    packedDate: '2026-05-30T10:00:00Z',
    packedBy: 'USER01',
    insertDate: '2026-05-30T10:00:00Z',
    boxStatus: 'OP',
    boxStatusDescription: 'Open',
    products: [
      {
        unitId: 'UNIT001',
        productCode: 'RBC',
        bloodType: 'O+',
        aboDescription: 'O Positive',
        expirationDate: '2026-06-29T00:00:00Z',
        collectionDate: '2026-05-29T00:00:00Z',
        checkDigit: '12',
        pickSlipId: 'PS001',
        itemNo: 1,
        productType: 'RBC'
      },
      {
        unitId: 'UNIT002',
        productCode: 'PLT',
        bloodType: 'A+',
        aboDescription: 'A Positive',
        expirationDate: '2026-06-04T00:00:00Z',
        collectionDate: '2026-05-29T00:00:00Z',
        checkDigit: '34',
        pickSlipId: 'PS001',
        itemNo: 2,
        productType: 'PLT'
      }
    ],
    productCount: 2,
    estimatedArrivalTime: '2026-06-01T15:30:00Z',
    shipTo: 'Nago Japan Hospital',
    address: '2342 55th st NAGO, JP, USA, JAPAN',
    contact: 'Emily Wilson',
    phone: '555-1234'
  };

  const mockCloseResult: CloseBoxResultDto = {
    boxId: 'BOX001',
    status: 'CL',
    message: 'Box BOX001 closed successfully with 2 products',
    productsProcessed: 2
  };

  beforeEach(() => {

    closeBoxServiceSpy = jasmine.createSpyObj('CloseBoxService', [
      'getBoxDetails', 'closeBox', 'getAvailableBoxes', 'validateBoxScan'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    closeBoxServiceSpy.getAvailableBoxes.and.returnValue(of([]));

    const headerServiceMock = { chapterChanged$: new Subject<void>().asObservable() };
    const pageHeaderServiceMock = {
      pageHeaderData: signal({ title: 'Close Box', subtitle: '' }),
      getTitle: () => 'Close Box',
      getSubtitle: () => '',
    };



      TestBed.configureTestingModule({
      imports: [CloseBoxComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CloseBoxService, useValue: closeBoxServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } },
      ]
    })
    .overrideComponent(CloseBoxComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });


    


      closeBoxServiceSpy.getBoxDetails.calls.reset();


      closeBoxServiceSpy.closeBox.calls.reset();


      closeBoxServiceSpy.getAvailableBoxes.calls.reset();


      closeBoxServiceSpy.validateBoxScan.calls.reset();


      dialogSpy.open.calls.reset();


      closeBoxServiceSpy.getAvailableBoxes.and.returnValue(of([]));


    fixture = TestBed.createComponent(CloseBoxComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty form', () => {
      fixture.detectChanges();
      expect(component.boxIdControl.value).toBe('');
      expect((component as any).boxDetails()).toBeNull();
    });

    it('should have correct page header configuration', () => {
      fixture.detectChanges();
      expect(component.headerConfig.title).toBe('Close Box');
      expect(component.headerConfig.subtitle).toContain('Close an open box');
      expect(component.headerConfig.breadcrumbs?.length).toBe(2);
    });

    it('should load available boxes on init', () => {
      fixture.detectChanges();
      expect(closeBoxServiceSpy.getAvailableBoxes).toHaveBeenCalled();
    });
  });

  describe('Box ID Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be invalid when empty', () => {
      component.boxIdControl.setValue('');
      expect(component.boxIdControl.invalid).toBeTrue();
      expect(component.boxIdControl.hasError('required')).toBeTrue();
    });

    it('should be valid with correct box ID', () => {
      component.boxIdControl.setValue('BOX001');
      expect(component.boxIdControl.valid).toBeTrue();
    });

    it('should reject box ID longer than 10 characters', () => {
      component.boxIdControl.setValue('12345678901');
      expect(component.boxIdControl.invalid).toBeTrue();
      expect(component.boxIdControl.hasError('maxlength')).toBeTrue();
    });

    it('should show error message when touched and invalid', () => {
      component.boxIdControl.setValue('');
      component.boxIdControl.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('mat-error'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain('Box ID is required');
    });
  });

  describe('Search Box Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load box details on search', fakeAsync(() => {
      closeBoxServiceSpy.getBoxDetails.and.returnValue(of(mockBoxDetails));

      component.boxIdControl.setValue('BOX001');
      component.onSearchBox();
      tick();

      expect(closeBoxServiceSpy.getBoxDetails).toHaveBeenCalledWith('BOX001');
      expect((component as any).boxDetails()).toEqual(mockBoxDetails);
      expect((component as any).loading()).toBeFalse();
    }));

    it('should not search when box ID is invalid', () => {
      component.boxIdControl.setValue('');
      component.onSearchBox();

      expect(closeBoxServiceSpy.getBoxDetails).not.toHaveBeenCalled();
      expect(component.boxIdControl.touched).toBeTrue();
    });

    it('should show loading state during search', fakeAsync(() => {
      const detailsSubject = new Subject<CloseBoxDto>();
      closeBoxServiceSpy.getBoxDetails.and.returnValue(detailsSubject.asObservable());

      component.boxIdControl.setValue('BOX001');
      component.onSearchBox();

      expect((component as any).loading()).toBeTrue();

      detailsSubject.next(mockBoxDetails);
      detailsSubject.complete();
      tick();

      expect((component as any).loading()).toBeFalse();
    }));

    it('should handle search error', fakeAsync(() => {
      const errorMessage = 'Box not found';
      closeBoxServiceSpy.getBoxDetails.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      component.boxIdControl.setValue('NOTFOUND');
      component.onSearchBox();
      tick();

      expect((component as any).loading()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(errorMessage);
    }));

    it('should trigger search on Enter key press', () => {
      closeBoxServiceSpy.getBoxDetails.and.returnValue(of(mockBoxDetails));
      component.boxIdControl.setValue('BOX001');

      const event = new KeyboardEvent('keypress', { key: 'Enter' });
      spyOn(event, 'preventDefault');

      component.onBoxIdKeyPress(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(closeBoxServiceSpy.getBoxDetails).toHaveBeenCalled();
    });

    it('should clear previous box details when typing new box ID', fakeAsync(() => {
      closeBoxServiceSpy.getBoxDetails.and.returnValue(of(mockBoxDetails));

      component.boxIdControl.setValue('BOX001');
      component.onSearchBox();
      tick();

      expect((component as any).boxDetails()).toEqual(mockBoxDetails);

      component.boxIdControl.setValue('BOX002');
      tick();

      expect((component as any).boxDetails()).toBeNull();
    }));

    it('should show error when box is already closed', fakeAsync(() => {
      const closedBox = { ...mockBoxDetails, boxStatus: 'CL' };
      closeBoxServiceSpy.getBoxDetails.and.returnValue(of(closedBox));

      component.boxIdControl.setValue('BOX001');
      component.onSearchBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Box has already been closed');
    }));

    it('should show error when box is not in open status', fakeAsync(() => {
      const shippedBox = { ...mockBoxDetails, boxStatus: 'SH' };
      closeBoxServiceSpy.getBoxDetails.and.returnValue(of(shippedBox));

      component.boxIdControl.setValue('BOX001');
      component.onSearchBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Box is not in open status');
    }));

    it('should show error when box has no products', fakeAsync(() => {
      const emptyBox = { ...mockBoxDetails, products: [], productCount: 0 };
      closeBoxServiceSpy.getBoxDetails.and.returnValue(of(emptyBox));

      component.boxIdControl.setValue('BOX001');
      component.onSearchBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No products found in box');
    }));
  });

  describe('Products Table', () => {
    beforeEach(fakeAsync(() => {
      closeBoxServiceSpy.getBoxDetails.and.returnValue(of(mockBoxDetails));
      fixture.detectChanges();

      component.boxIdControl.setValue('BOX001');
      component.onSearchBox();
      tick();
      fixture.detectChanges();
    }));

    it('should display products table when box details loaded', () => {
      const table = fixture.debugElement.query(By.css('.products-table'));
      expect(table).toBeTruthy();
    });

    it('should display correct number of columns', () => {
      expect(component.displayedColumns.length).toBe(7);
      expect(component.displayedColumns).toContain('pickSlipId');
      expect(component.displayedColumns).toContain('productType');
      expect(component.displayedColumns).toContain('unitId');
      expect(component.displayedColumns).toContain('expirationDate');
    });

    it('should display correct product data', () => {
      const tableData = (component as any).tableData();
      expect(tableData.length).toBe(2);
      expect(tableData[0].unitId).toBe('UNIT001');
      expect(tableData[0].productType).toBe('RBC');
      expect(tableData[1].unitId).toBe('UNIT002');
      expect(tableData[1].productType).toBe('PLT');
    });

    it('should map ABO description correctly', () => {
      const tableData = (component as any).tableData();
      expect(tableData[0].orderedAboRh).toBe('O Positive');
      expect(tableData[1].orderedAboRh).toBe('A Positive');
    });

    it('should display paginated data correctly', () => {
      component.pageSize = 1;
      component.pageIndex = 0;
      fixture.detectChanges();

      const paginatedData = (component as any).paginatedData();
      expect(paginatedData.length).toBe(2);
      expect(paginatedData[0].unitId).toBe('UNIT001');
    });

    it('should handle page change', () => {
      const pageEvent = { pageIndex: 1, pageSize: 1, length: 2 };
      component.onPageChange(pageEvent);

      expect(component.pageIndex).toBe(1);
      expect(component.pageSize).toBe(1);
    });
  });

  describe('Close Box Functionality', () => {
    beforeEach(fakeAsync(() => {
      closeBoxServiceSpy.getBoxDetails.and.returnValue(of(mockBoxDetails));
      fixture.detectChanges();

      component.boxIdControl.setValue('BOX001');
      component.onSearchBox();
      tick();
      fixture.detectChanges();
    }));

    it('should allow closing when box is in OP status with products', () => {
      expect((component as any).canCloseBox()).toBeTrue();
    });

    it('should open confirmation dialog on close box click', () => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCloseBox();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      expect(dialogConfig?.width).toBe('480px');
      expect(dialogConfig?.disableClose).toBeTrue();
    });

    it('should pass CLOSE BOX as confirm button text to dialog', () => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCloseBox();

      const dialogData = (dialogSpy.open.calls.mostRecent().args[1] as any)?.data;
      expect(dialogData?.confirmButtonText).toBe('CLOSE BOX');
    });

    it('should close box when confirmed', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true, allProperlyPacked: true }));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      closeBoxServiceSpy.closeBox.and.returnValue(of(mockCloseResult));

      component.onCloseBox();
      tick();

      expect(closeBoxServiceSpy.closeBox).toHaveBeenCalledWith('BOX001');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should not close box when cancelled in dialog', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCloseBox();
      tick();

      expect(closeBoxServiceSpy.closeBox).not.toHaveBeenCalled();
    }));

    it('should reset form when dialog is cancelled', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCloseBox();
      tick();

      expect((component as any).boxDetails()).toBeNull();
    }));

    it('should reset form when close box is declined', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: false, allProperlyPacked: true }));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCloseBox();
      tick();

      expect(closeBoxServiceSpy.closeBox).not.toHaveBeenCalled();
      expect((component as any).boxDetails()).toBeNull();
    }));

    it('should reset form after successful close', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true, allProperlyPacked: true }));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      closeBoxServiceSpy.closeBox.and.returnValue(of(mockCloseResult));

      component.onCloseBox();
      tick();

      expect((component as any).boxDetails()).toBeNull();
    }));

    it('should reload available boxes after successful close', fakeAsync(() => {
      closeBoxServiceSpy.getAvailableBoxes.calls.reset();

      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true, allProperlyPacked: true }));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      closeBoxServiceSpy.closeBox.and.returnValue(of(mockCloseResult));

      component.onCloseBox();
      tick();

      expect(closeBoxServiceSpy.getAvailableBoxes).toHaveBeenCalled();
    }));

    it('should handle close box error', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true, allProperlyPacked: true }));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const errorMessage = 'Failed to close box';
      closeBoxServiceSpy.closeBox.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      component.onCloseBox();
      tick();

      expect((component as any).submitting()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(errorMessage);
    }));

    it('should not allow close when box is not in open status', () => {
      const shippedBox = { ...mockBoxDetails, boxStatus: 'SH' };
      (component as any).boxDetails.set(shippedBox);
      fixture.detectChanges();

      expect((component as any).canCloseBox()).toBeFalse();

      component.onCloseBox();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should not allow close when box has no products', () => {
      const emptyBox = { ...mockBoxDetails, products: [], productCount: 0 };
      (component as any).boxDetails.set(emptyBox);
      fixture.detectChanges();

      expect((component as any).canCloseBox()).toBeFalse();
    });
  });

  describe('Cancel Functionality', () => {
    it('should reset form on cancel', fakeAsync(() => {
      closeBoxServiceSpy.getBoxDetails.and.returnValue(of(mockBoxDetails));
      fixture.detectChanges();

      component.boxIdControl.setValue('BOX001');
      component.onSearchBox();
      tick();

      expect((component as any).boxDetails()).not.toBeNull();

      component.onCancel();

      expect((component as any).boxDetails()).toBeNull();
    }));
  });

  describe('Date Formatting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format date correctly (DD MMM YYYY)', () => {
      const formatted = component.formatDate('2026-06-29T00:00:00Z');
      expect(formatted).toBe('29 JUN 2026');
    });

    it('should format datetime correctly (DD MMM YYYY HH:mm)', () => {
      const formatted = component.formatDateTime('2026-06-01T15:30:00Z');
      expect(formatted).toContain('JUN 2026');
    });

    it('should handle null date', () => {
      const formatted = component.formatDate(null);
      expect(formatted).toBe('-');
    });

    it('should handle invalid date', () => {
      const invalidDate = 'not-a-date';
      const formatted = component.formatDate(invalidDate);
      expect(formatted).toBe(invalidDate);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have aria-labelledby on main container', () => {
      const region = fixture.debugElement.query(By.css('[role="region"]'));
      expect(region.nativeElement.getAttribute('aria-labelledby')).toContain('page-title');
    });

    it('should have aria-invalid on invalid form fields', () => {
      component.boxIdControl.setValue('');
      component.boxIdControl.markAsTouched();
      fixture.detectChanges();

      const inputId = (component as any).elementId('box-id');
      const input = fixture.debugElement.query(By.css(`#${inputId}`));
      expect(input.nativeElement.getAttribute('aria-invalid')).toBe('true');
    });

    it('should have aria-describedby linking to error message', () => {
      component.boxIdControl.setValue('');
      component.boxIdControl.markAsTouched();
      fixture.detectChanges();

      const inputId = (component as any).elementId('box-id');
      const input = fixture.debugElement.query(By.css(`#${inputId}`));
      const errorId = (component as any).errorId('box-id');
      expect(input.nativeElement.getAttribute('aria-describedby')).toContain(errorId);
    });
  });

  describe('Unique ID Generation', () => {
    it('should have unique IDs across multiple instances', () => {
      const fixture2 = TestBed.createComponent(CloseBoxComponent);
      const component2 = fixture2.componentInstance;

      expect((component as any).elementId('box-id')).not.toBe((component2 as any).elementId('box-id'));
    });
  });

  describe('Cleanup', () => {
    it('should complete destroy$ on component destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
