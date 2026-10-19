import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RawDataFilterDialog, RawDataFilterData } from './raw-data-filter-dialog';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

describe('RawDataFilterDialog', () => {
  let component: RawDataFilterDialog;
  let fixture: ComponentFixture<RawDataFilterDialog>;
  let mockService: jasmine.SpyObj<InstrumentInterfaceService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<RawDataFilterDialog>>;

  function createComponent(dialogData: RawDataFilterData): void {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    // Reset spy call tracking so assertions are scoped to this component instance
    mockService.getPendingFileIds.calls.reset();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RawDataFilterDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: InstrumentInterfaceService, useValue: mockService },
      ],
    });

    fixture = TestBed.createComponent(RawDataFilterDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('InstrumentInterfaceService', ['getPendingFileIds']);
    mockService.getPendingFileIds.and.returnValue(of({ data: [] }));
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [RawDataFilterDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { chapterId: 'DAL', instrumentId: 'S201', rawDataList: [] } },
        { provide: InstrumentInterfaceService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RawDataFilterDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize fileId from applied filters in constructor', () => {
    // Arrange & Act
    createComponent({
      chapterId: 'DAL',
      instrumentId: 'S201',
      appliedFilters: { fileId: 'F001' },
      rawDataList: [],
    });

    // Assert
    expect(component.fileId).toBe('F001');
  });

  it('should default fileId to empty string when no applied filters', () => {
    // Arrange & Act
    createComponent({
      chapterId: 'DAL',
      instrumentId: 'S201',
      rawDataList: [],
    });

    // Assert
    expect(component.fileId).toBe('');
  });

  it('should extract unique file IDs from rawDataList when available', () => {
    // Arrange & Act
    createComponent({
      chapterId: 'DAL',
      instrumentId: 'S201',
      rawDataList: [
        { fileId: 'F002' },
        { fileId: 'F001' },
        { fileId: 'F002' },
        { fileId: 'F003' },
      ],
    });

    // Assert
    expect(component.fileIdOptions).toEqual(['F001', 'F002', 'F003']);
    expect(component.loadingFileIds).toBe(false);
    expect(mockService.getPendingFileIds).not.toHaveBeenCalled();
  });

  it('should fallback to API call when rawDataList is empty', () => {
    // Arrange
    const apiResponse = {
      data: [{ fileId: 'F010' }, { fileId: 'F020' }],
    };
    mockService.getPendingFileIds.and.returnValue(of(apiResponse));

    // Act
    createComponent({
      chapterId: 'DAL',
      instrumentId: 'S201',
      rawDataList: [],
    });

    // Assert
    expect(mockService.getPendingFileIds).toHaveBeenCalledWith('DAL', 'S201');
    expect(component.fileIdOptions).toEqual(['F010', 'F020']);
    expect(component.loadingFileIds).toBe(false);
  });

  it('should not call API when chapterId is missing and rawDataList is empty', () => {
    // Arrange & Act
    createComponent({
      chapterId: '',
      instrumentId: 'S201',
      rawDataList: [],
    });

    // Assert
    expect(mockService.getPendingFileIds).not.toHaveBeenCalled();
  });

  it('should handle API error gracefully in loadFileIds', () => {
    // Arrange
    mockService.getPendingFileIds.and.returnValue(throwError(() => new Error('API error')));

    // Act
    createComponent({
      chapterId: 'DAL',
      instrumentId: 'S201',
      rawDataList: [],
    });

    // Assert
    expect(component.loadingFileIds).toBe(false);
  });

  it('should close dialog with filter value on apply', () => {
    // Arrange
    component.fileId = 'F001';

    // Act
    component.apply();

    // Assert
    expect(mockDialogRef.close).toHaveBeenCalledWith({ fileId: 'F001' });
  });

  it('should close dialog with empty fileId when no filter selected on apply', () => {
    // Arrange
    component.fileId = '';

    // Act
    component.apply();

    // Assert
    expect(mockDialogRef.close).toHaveBeenCalledWith({ fileId: '' });
  });

  it('should reset fileId to empty string on clearAll', () => {
    // Arrange
    component.fileId = 'F001';

    // Act
    component.clearAll();

    // Assert
    expect(component.fileId).toBe('');
  });

  it('should close dialog without result on close', () => {
    // Act
    component.close();

    // Assert
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('should sort file ID options alphabetically when extracted from rawDataList', () => {
    // Arrange & Act
    createComponent({
      chapterId: 'DAL',
      instrumentId: 'S201',
      rawDataList: [
        { fileId: 'Z100' },
        { fileId: 'A050' },
        { fileId: 'M075' },
      ],
    });

    // Assert
    expect(component.fileIdOptions).toEqual(['A050', 'M075', 'Z100']);
  });
});
