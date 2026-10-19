import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ViewportScroller } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { RollbackDonationAuditComponent } from './rollback-donation-audit';
import { RollbackDonationAuditService } from './services/rollback-donation-audit.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ReturnResult, RetrieveResponse } from './models/rollback-donation-audit.model';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('RollbackDonationAuditComponent', () => {
  let mockViewportScroller: any;
  let component: RollbackDonationAuditComponent;
  let fixture: ComponentFixture<RollbackDonationAuditComponent>;
  let serviceSpy: jasmine.SpyObj<RollbackDonationAuditService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const mockRetrieveResponse: ReturnResult<RetrieveResponse> = {
    success: true,
    message: 'Success',
    error: '',
    statusCode: 200,
    data: [],
    item: {
      donorProfile: {
        donorName: 'Richard Carlsbad',
        dob: '02-12-2002',
        gender: 'Male',
        transactionId: 'TR02887063',
        date: '01-10-2025 16:39',
        auditUser: 'Celeste Hunter',
        donationType: 'ALL',
        procedureCode: 'WB',
        signature: 'Yes'
      },
      healthHistory: [
        {
          id: '1',
          question: '6',
          response: 'Yes',
          answer: 'ADAL7',
          description: 'Adalat (For Migraine, No Headache now)',
          interdiction: '',
          incident: '',
          deferredThru: '01-10-2025',
          comment: 'Ok to donate'
        }
      ],
      physicalFindings: [
        {
          code: 'ARMCK',
          description: 'Arm check',
          value: 'ACC',
          interdiction: '',
          interdictionDescription: ''
        },
        {
          code: 'HGB',
          description: 'Hemoglobin',
          value: '14.4',
          interdiction: '',
          interdictionDescription: ''
        }
      ],
      collectionDate: '01-10-2025',
      okToDonate: true
    },
    total: 1
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('RollbackDonationAuditService', [
      'retrieve',
      'rollback'
    ]);
    dialogSpy = createMockMatDialog();
    snackbarSpy = createMockSnackbarService();

    mockViewportScroller = jasmine.createSpyObj('ViewportScroller', ['scrollToPosition', 'scrollToAnchor', 'getScrollPosition', 'setOffset', 'setHistoryScrollRestoration']);



      TestBed.configureTestingModule({
      imports: [RollbackDonationAuditComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: RollbackDonationAuditService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: ViewportScroller, useValue: mockViewportScroller }
      ]
    })
    .overrideProvider(MatDialog, { useValue: dialogSpy });


    


      serviceSpy.retrieve.calls.reset();


      serviceSpy.rollback.calls.reset();


      mockViewportScroller.scrollToPosition.calls.reset();


      mockViewportScroller.scrollToAnchor.calls.reset();


      mockViewportScroller.getScrollPosition.calls.reset();


      mockViewportScroller.setOffset.calls.reset();


      mockViewportScroller.setHistoryScrollRestoration.calls.reset();


    fixture = TestBed.createComponent(RollbackDonationAuditComponent);
    component = fixture.componentInstance;

    // Mock scrollIntoView which is not available in jsdom
    fixture.nativeElement.scrollIntoView = jest.fn();


    });

  describe('Initialization', () => {

    it('should initialize with empty type', () => {
      fixture.detectChanges();
      expect(component.searchForm.get('type')?.value).toBe('');
    });

    it('should have required validator on type field', () => {
      fixture.detectChanges();
      const typeControl = component.searchForm.get('type');
      expect(typeControl?.hasError('required')).toBeTrue();
      typeControl?.setValue('Deferral');
      expect(typeControl?.hasError('required')).toBeFalse();
    });

    it('should have required validator on id field', () => {
      fixture.detectChanges();
      const idControl = component.searchForm.get('id');
      expect(idControl?.hasError('required')).toBeTrue();
      idControl?.setValue('12345678');
      expect(idControl?.hasError('required')).toBeFalse();
    });

    it('should have maxlength validator of 15 on id field by default', () => {
      fixture.detectChanges();
      const idControl = component.searchForm.get('id');
      idControl?.setValue('A'.repeat(16));
      expect(idControl?.hasError('maxlength')).toBeTrue();
      idControl?.setValue('A'.repeat(15));
      expect(idControl?.hasError('maxlength')).toBeFalse();
    });


  });

  describe('Type Selection', () => {

    it('should show Donation ID fields when Donation is selected', fakeAsync(() => {
      fixture.detectChanges();
      component.searchForm.get('type')?.setValue('Donation');
      tick();
      fixture.detectChanges();

      expect((component as any).isDonationMode()).toBeTrue();
    }));

    it('should set maxlength to 10 when Deferral is selected', fakeAsync(() => {
      fixture.detectChanges();
      component.searchForm.get('type')?.setValue('Deferral');
      tick();

      const idControl = component.searchForm.get('id');
      idControl?.setValue('A'.repeat(11));
      expect(idControl?.hasError('maxlength')).toBeTrue();
      idControl?.setValue('A'.repeat(10));
      expect(idControl?.hasError('maxlength')).toBeFalse();
    }));

    it('should set maxlength to 15 when Donation is selected', fakeAsync(() => {
      fixture.detectChanges();
      component.searchForm.get('type')?.setValue('Donation');
      tick();

      const idControl = component.searchForm.get('id');
      idControl?.setValue('A'.repeat(16));
      expect(idControl?.hasError('maxlength')).toBeTrue();
      idControl?.setValue('A'.repeat(15));
      expect(idControl?.hasError('maxlength')).toBeFalse();
    }));

  });

  describe('Retrieve Functionality', () => {

    it('should retrieve data for valid Deferral', fakeAsync(() => {
      serviceSpy.retrieve.and.returnValue(of(mockRetrieveResponse));
      fixture.detectChanges();

      component.searchForm.patchValue({ type: 'Deferral', id: '12345678' });
      component.onRetrieve();
      tick();

      expect(serviceSpy.retrieve).toHaveBeenCalledWith({
        type: 'Deferral',
        id: '12345678'
      });
      expect((component as any).donorProfile()).not.toBeNull();
      expect((component as any).donorProfile()?.donorName).toBe('Richard Carlsbad');
    }));



    it('should set okToDonate flag', fakeAsync(() => {
      serviceSpy.retrieve.and.returnValue(of(mockRetrieveResponse));
      fixture.detectChanges();

      component.searchForm.patchValue({ type: 'Deferral', id: '12345678' });
      component.onRetrieve();
      tick();

      expect((component as any).okToDonate()).toBeTrue();
    }));

  });

  describe('Health History Expansion', () => {
    it('should expand and collapse health history rows', fakeAsync(() => {
      serviceSpy.retrieve.and.returnValue(of(mockRetrieveResponse));
      fixture.detectChanges();

      component.searchForm.patchValue({ type: 'Deferral', id: '12345678' });
      component.onRetrieve();
      tick();

      const rowIndex = 0;
      expect(component.isRowExpanded(rowIndex)).toBeFalse();

      component.toggleRow(rowIndex);
      expect(component.isRowExpanded(rowIndex)).toBeTrue();

      component.toggleRow(rowIndex);
      expect(component.isRowExpanded(rowIndex)).toBeFalse();
    }));
  });
  describe('Rollback Functionality', () => {

    it('should perform rollback when confirmed', fakeAsync(() => {
      const rollbackResponse = {
        success: true,
        message: 'Rollback successful',
        error: '',
        statusCode: 200,
        data: [],
        item: true,
        total: 1
      };
      serviceSpy.retrieve.and.returnValue(of(mockRetrieveResponse));
      serviceSpy.rollback.and.returnValue(of(rollbackResponse));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      fixture.detectChanges();

      component.searchForm.patchValue({ type: 'Deferral', id: '12345678' });
      component.onRetrieve();
      tick();

      component.onRollback();
      tick();

      expect(serviceSpy.rollback).toHaveBeenCalledWith({
        type: 'Deferral',
        id: '12345678',
        transactionId: 'TR02887063'
      });
    }));


  });

  describe('Cancel Functionality', () => {
    it('should reset form on cancel', fakeAsync(() => {
      serviceSpy.retrieve.and.returnValue(of(mockRetrieveResponse));
      fixture.detectChanges();

      component.searchForm.patchValue({ type: 'Deferral', id: '12345678' });
      component.onRetrieve();
      tick();

      expect((component as any).donorProfile()).not.toBeNull();

      component.onCancel();

      expect((component as any).donorProfile()).toBeNull();
      expect(component.searchForm.get('type')?.value).toBe('');
      expect(component.searchForm.get('id')?.value).toBeFalsy();
    }));
  });
});
