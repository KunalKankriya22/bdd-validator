import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LabBatchTransferComponent } from './lab-batch-transfer';
import { LabBatchTransferService } from './services/lab-batch-transfer.service';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogModule } from '@angular/material/dialog';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('LabBatchTransferComponent', () => {
  let component: LabBatchTransferComponent;
  let fixture: ComponentFixture<LabBatchTransferComponent>;
  let mockService: jasmine.SpyObj<LabBatchTransferService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let chapterChangedSubject: Subject<void>;

  const successResponse = {
    success: true,
    message: 'Transfer completed',
    error: null,
    statusCode: 200,
    data: {
      processStartTime: '2026-05-23T10:00:00',
      processEndTime: '2026-05-23T10:05:30'
    }
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('LabBatchTransferService', ['executeBatchTransfer']);
    mockDialog = createMockMatDialog();
    mockSnackbarService = createMockSnackbarService();
    chapterChangedSubject = new Subject<void>();



      TestBed.configureTestingModule({
      imports: [LabBatchTransferComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: LabBatchTransferService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } },
        { provide: PageHeaderService, useValue: { pageHeaderData: signal(undefined), getTitle: () => '', getSubtitle: () => '' } },
      ]
    }).overrideComponent(LabBatchTransferComponent, {
      remove: { imports: [MatDialogModule] }
    });


    


      mockService.executeBatchTransfer.calls.reset();


    fixture = TestBed.createComponent(LabBatchTransferComponent);
    component = fixture.componentInstance;


    });


  it('should initialize with ready state', () => {
    expect(component.transferState).toBe('ready');
    expect(component.processStartTime).toBeNull();
    expect(component.processEndTime).toBeNull();
  });

  it('should initialize header config on init', () => {
    fixture.detectChanges();
    expect(component.headerConfig).toBeDefined();
    expect(component.headerConfig.breadcrumbs.length).toBeGreaterThan(0);
  });
  describe('executeTransfer', () => {
    beforeEach(() => {
      const dialogRefSpyObj = { afterClosed: () => of(true) } as any;
      mockDialog.open.and.returnValue(dialogRefSpyObj);
    });

    it('should set state to processing then completed on success', () => {
      mockService.executeBatchTransfer.and.returnValue(of(successResponse));

      component.onTransferClick();

      expect(component.transferState).toBe('completed');
      expect(component.processStartTime).toBeTruthy();
      expect(component.processEndTime).toBeTruthy();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Batch transfer completed successfully');
    });

    it('should handle response with success false', () => {
      const failResponse = { success: false, message: 'Failed', error: 'Error', statusCode: 500, data: null };
      mockService.executeBatchTransfer.and.returnValue(of(failResponse));

      component.onTransferClick();

      expect(component.transferState).toBe('processing');
      expect(component.processStartTime).toBeNull();
    });
  });
  describe('ngOnDestroy', () => {
    it('should clean up subscriptions', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
