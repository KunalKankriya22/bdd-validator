import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UploadStatusFilterDialog } from './upload-status-filter-dialog';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { HeaderService } from '@shared/services/header.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('UploadStatusFilterDialog', () => {
  let component: UploadStatusFilterDialog;
  let fixture: ComponentFixture<UploadStatusFilterDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<UploadStatusFilterDialog>>;
  let mockService: jasmine.SpyObj<InstrumentInterfaceService>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('InstrumentInterfaceService', [
      'getFileIds',
      'getTestBatchIds',
      'getUploadStatuses',
    ]);

    const mockHeaderService = {
      chapterTimeZone: signal('America/New_York')
    };

    mockService.getFileIds.and.returnValue(
      of({
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [{ fileId: 'file1.txt' }],
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      })
    );

    mockService.getTestBatchIds.and.returnValue(
      of({
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [{ ltTbId: '032017-S200205' }],
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      })
    );

    mockService.getUploadStatuses.and.returnValue(
      of([{ value: 'S', label: 'S - Loaded' }])
    );

    await TestBed.configureTestingModule({
      imports: [UploadStatusFilterDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { chapterId: 'DAL', instrumentId: 'S201' },
        },
        { provide: InstrumentInterfaceService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadStatusFilterDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load file IDs on init', () => {
    expect(mockService.getFileIds).toHaveBeenCalled();
    expect(component.fileIdOptions.length).toBeGreaterThan(0);
  });

  it('should load test batch IDs on init', () => {
    expect(mockService.getTestBatchIds).toHaveBeenCalled();
    expect(component.testBatchIdOptions.length).toBeGreaterThan(0);
  });


});
