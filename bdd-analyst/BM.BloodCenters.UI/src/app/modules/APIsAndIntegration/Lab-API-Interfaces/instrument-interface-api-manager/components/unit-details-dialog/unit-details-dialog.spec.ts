import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UnitDetailsDialog } from './unit-details-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UnitDetail } from '../../models/instrument-interface.model';

describe('UnitDetailsDialog', () => {
  let component: UnitDetailsDialog;
  let fixture: ComponentFixture<UnitDetailsDialog>;
  let mockService: jasmine.SpyObj<InstrumentInterfaceService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<UnitDetailsDialog>>;

  const mockUnitDetails: UnitDetail[] = [
    {
      unitId: 'U001', machineTestId: 'MT001', ltTestId: 'LT001',
      machineResult: 'POS', ltResult: 'POS', uploadStatus: 'L',
      uploadStatusDescription: 'Loaded', chapterId: 'DAL', machineId: 'S201', fileId: 'F001',
    },
    {
      unitId: 'U002', machineTestId: 'MT002', ltTestId: 'LT002',
      machineResult: 'NEG', ltResult: 'NEG', uploadStatus: 'E',
      uploadStatusDescription: 'Error', chapterId: 'DAL', machineId: 'S201', fileId: 'F001',
    },
  ];

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('InstrumentInterfaceService', ['getUnitDetails']);
    mockService.getUnitDetails.and.returnValue(of({ data: mockUnitDetails }));

    await TestBed.configureTestingModule({
      imports: [UnitDetailsDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { chapterId: 'DAL', machineId: 'S201', fileId: 'F001' } },
        { provide: InstrumentInterfaceService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitDetailsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load unit details on init', () => {
    // Assert - ngOnInit calls loadUnitDetails during fixture.detectChanges()
    expect(mockService.getUnitDetails).toHaveBeenCalledWith('DAL', 'S201', 'F001', 'ASC');
    expect(component.unitDetails()).toEqual(mockUnitDetails);
    expect(component.loading()).toBe(false);
  });

  it('should set loading to false on API error', () => {
    // Arrange
    mockService.getUnitDetails.and.returnValue(throwError(() => new Error('Server error')));

    // Act
    component.loadUnitDetails();

    // Assert
    expect(component.loading()).toBe(false);
  });

  it('should pass undefined as sort when sortDirection is empty string', () => {
    // Arrange
    component.sortDirection.set('');
    mockService.getUnitDetails.calls.reset();

    // Act
    component.loadUnitDetails();

    // Assert
    expect(mockService.getUnitDetails).toHaveBeenCalledWith('DAL', 'S201', 'F001', undefined);
  });

  it('should cycle sort direction from empty to ASC on toggleSort', () => {
    // Arrange
    component.sortDirection.set('');
    mockService.getUnitDetails.calls.reset();

    // Act
    component.toggleSort();

    // Assert
    expect(component.sortDirection()).toBe('ASC');
    expect(mockService.getUnitDetails).toHaveBeenCalled();
  });

  it('should cycle sort direction from ASC to DESC on toggleSort', () => {
    // Arrange
    component.sortDirection.set('ASC');
    mockService.getUnitDetails.calls.reset();

    // Act
    component.toggleSort();

    // Assert
    expect(component.sortDirection()).toBe('DESC');
    expect(mockService.getUnitDetails).toHaveBeenCalled();
  });

  it('should cycle sort direction from DESC to empty on toggleSort', () => {
    // Arrange
    component.sortDirection.set('DESC');
    mockService.getUnitDetails.calls.reset();

    // Act
    component.toggleSort();

    // Assert
    expect(component.sortDirection()).toBe('');
    expect(mockService.getUnitDetails).toHaveBeenCalled();
  });

  it('should return unfold_more icon when sort direction is empty', () => {
    // Arrange
    component.sortDirection.set('');

    // Act
    const icon = component.getSortIcon();

    // Assert
    expect(icon).toBe('unfold_more');
  });

  it('should return arrow_upward icon when sort direction is ASC', () => {
    // Arrange
    component.sortDirection.set('ASC');

    // Act
    const icon = component.getSortIcon();

    // Assert
    expect(icon).toBe('arrow_upward');
  });

  it('should return arrow_downward icon when sort direction is DESC', () => {
    // Arrange
    component.sortDirection.set('DESC');

    // Act
    const icon = component.getSortIcon();

    // Assert
    expect(icon).toBe('arrow_downward');
  });

  it('should return correct status class for known statuses', () => {
    // Act & Assert
    expect(component.getStatusClass('Loaded')).toBe('status-loaded');
    expect(component.getStatusClass('Error')).toBe('status-error');
    expect(component.getStatusClass('Aborted')).toBe('status-aborted');
    expect(component.getStatusClass('Pending')).toBe('status-pending');
  });

  it('should return status-default for unknown status values', () => {
    // Act & Assert
    expect(component.getStatusClass('Unknown')).toBe('status-default');
    expect(component.getStatusClass('')).toBe('status-default');
    expect(component.getStatusClass('SomeOtherStatus')).toBe('status-default');
  });

  it('should close the dialog when close is called', () => {
    // Act
    component.close();

    // Assert
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should have all expected displayed columns', () => {
    // Assert
    expect(component.displayedColumns).toEqual([
      'unitId', 'machineTestId', 'machineResult',
      'ltTestId', 'ltResult', 'uploadStatusDescription', 'fileId',
    ]);
  });

  it('should reload unit details after each toggleSort call', () => {
    // Arrange
    mockService.getUnitDetails.calls.reset();

    // Act - full cycle: ASC -> DESC -> '' -> ASC
    component.toggleSort(); // ASC -> DESC
    component.toggleSort(); // DESC -> ''
    component.toggleSort(); // '' -> ASC

    // Assert
    expect(mockService.getUnitDetails).toHaveBeenCalledTimes(3);
  });
});
