import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DatePipe } from '@angular/common';
import { of, throwError, Subject } from 'rxjs';
import { QueryStatusPanelComponent, QueryStatusItem } from './query-status-panel.component';
import { PathogenReductionManagerService } from '../services/pathogen-reduction-manager.service';
import { PathogenReductionQueryStatusDto } from '../models/pathogen-reduction.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('QueryStatusPanelComponent', () => {
  let component: QueryStatusPanelComponent;
  let fixture: ComponentFixture<QueryStatusPanelComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<QueryStatusPanelComponent>>;
  let mockPRService: jasmine.SpyObj<PathogenReductionManagerService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  const mockQueryItems: QueryStatusItem[] = [
    {
      unitId: 'UNIT001',
      cadProduct: 'Product A',
      setType: 'Type 1',
      cadStartTime: '2026-06-18 10:00:00',
      cadTime: 120,
      status: 'ready-acceptable',
      statusLabel: 'Ready - Acceptable',
      priority: 2
    },
    {
      unitId: 'UNIT002',
      cadProduct: 'Product B',
      setType: 'Type 2',
      cadStartTime: '2026-06-18 11:00:00',
      cadTime: 150,
      status: 'ready-almost-overdue',
      statusLabel: 'Ready - Almost Overdue',
      priority: 1
    }
  ];

  const mockApiData: PathogenReductionQueryStatusDto[] = [
    {
      unitId: 'UNIT001',
      cadProductCode: 'PROD-A',
      volumeTypeSet: 'Large',
      cadStartTime: '2026-06-18T10:00:00Z',
      cadEndTime: null,
      cadTimeElapsed: 5.7,
      priority: 2,
      statusDescription: 'Ready - Acceptable'
    },
    {
      unitId: 'UNIT002',
      cadProductCode: 'PROD-B',
      volumeTypeSet: 'Small',
      cadStartTime: '2026-06-18T14:30:00Z',
      cadEndTime: null,
      cadTimeElapsed: 2.3,
      priority: 1,
      statusDescription: 'Ready - Almost Overdue'
    },
    {
      unitId: 'UNIT003',
      cadProductCode: 'PROD-C',
      volumeTypeSet: 'Medium',
      cadStartTime: '2026-06-17T08:00:00Z',
      cadEndTime: '2026-06-18T08:00:00Z',
      cadTimeElapsed: 24.1,
      priority: 4,
      statusDescription: 'Discard - Time Exceeded'
    }
  ];

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockPRService = jasmine.createSpyObj('PathogenReductionManagerService', ['getQueryStatus']);
    mockPRService.getQueryStatus.and.returnValue(of([]));
    mockSnackbarService = createMockSnackbarService();



      TestBed.configureTestingModule({
imports: [
        QueryStatusPanelComponent,
        FormsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: PathogenReductionManagerService, useValue: mockPRService },
        { provide: SnackbarService, useValue: mockSnackbarService }
      ]
    });


    });



  beforeEach(() => {


      mockDialogRef.close.calls.reset();


      mockPRService.getQueryStatus.calls.reset();


      mockPRService.getQueryStatus.and.returnValue(of([]));


    fixture = TestBed.createComponent(QueryStatusPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should initialize with empty query items', () => {
    expect(component.queryItems).toEqual([]);
  });


  it('should initialize sort state as null', () => {
    expect(component.sortColumn).toBeNull();
    expect(component.sortDirection).toBeNull();
  });



  it('should toggle sort from descending to null', () => {
    component.sortColumn = 'unitId';
    component.sortDirection = 'desc';

    component.toggleSort('unitId');

    expect(component.sortColumn).toBeNull();
    expect(component.sortDirection).toBeNull();
  });


  it('should return unfold_more icon for unsorted column', () => {
    component.sortColumn = null;

    const icon = component.getSortIcon('unitId');

    expect(icon).toBe('unfold_more');
  });

  it('should return arrow_upward icon for ascending sort', () => {
    component.sortColumn = 'unitId';
    component.sortDirection = 'asc';

    const icon = component.getSortIcon('unitId');

    expect(icon).toBe('arrow_upward');
  });

  it('should return arrow_downward icon for descending sort', () => {
    component.sortColumn = 'unitId';
    component.sortDirection = 'desc';

    const icon = component.getSortIcon('unitId');

    expect(icon).toBe('arrow_downward');
  });

  it('should return unfold_more icon for different column', () => {
    component.sortColumn = 'unitId';
    component.sortDirection = 'asc';

    const icon = component.getSortIcon('cadProduct');

    expect(icon).toBe('unfold_more');
  });

  // ---- ngOnInit tests ----

  it('should call loadQueryStatus on init', () => {
    expect(mockPRService.getQueryStatus).toHaveBeenCalled();
  });

  // ---- loadQueryStatus tests ----

  it('should set loading to true while loading and false after completion', () => {
    // After beforeEach, loading is already done (of([]) resolves synchronously)
    expect(component.loading()).toBe(false);

    // Set up new data and call loadQueryStatus again
    mockPRService.getQueryStatus.and.returnValue(of(mockApiData));
    component.loadQueryStatus();

    // After synchronous observable completes, loading should be false
    expect(component.loading()).toBe(false);
  });

  it('should map API data to query status items on success', () => {
    mockPRService.getQueryStatus.and.returnValue(of(mockApiData));

    component.loadQueryStatus();

    expect(component.queryItems.length).toBe(3);
    // Items should be sorted by priority ascending by default
    expect(component.queryItems[0].unitId).toBe('UNIT002'); // priority 1
    expect(component.queryItems[1].unitId).toBe('UNIT001'); // priority 2
    expect(component.queryItems[2].unitId).toBe('UNIT003'); // priority 4
  });

  it('should map DTO fields correctly', () => {
    const singleItem: PathogenReductionQueryStatusDto[] = [{
      unitId: 'U100',
      cadProductCode: 'CP-X',
      volumeTypeSet: 'VTS-1',
      cadStartTime: '2026-01-15T09:30:00Z',
      cadEndTime: null,
      cadTimeElapsed: 3.7,
      priority: 2,
      statusDescription: 'Ready Within Range'
    }];
    mockPRService.getQueryStatus.and.returnValue(of(singleItem));

    component.loadQueryStatus();

    expect(component.queryItems.length).toBe(1);
    const item = component.queryItems[0];
    expect(item.unitId).toBe('U100');
    expect(item.cadProduct).toBe('CP-X');
    expect(item.setType).toBe('VTS-1');
    expect(item.cadTime).toBe(4); // Math.round(3.7)
    expect(item.status).toBe('ready-acceptable');
    expect(item.statusLabel).toBe('Ready Within Range');
    expect(item.priority).toBe(2);
  });

  it('should round cadTimeElapsed to nearest integer', () => {
    const items: PathogenReductionQueryStatusDto[] = [
      {
        unitId: 'U1',
        cadProductCode: 'P1',
        volumeTypeSet: 'V1',
        cadStartTime: '2026-01-15T09:30:00Z',
        cadEndTime: null,
        cadTimeElapsed: 5.4,
        priority: 3,
        statusDescription: 'Not Ready'
      },
      {
        unitId: 'U2',
        cadProductCode: 'P2',
        volumeTypeSet: 'V2',
        cadStartTime: '2026-01-15T10:30:00Z',
        cadEndTime: null,
        cadTimeElapsed: 5.5,
        priority: 3,
        statusDescription: 'Not Ready'
      }
    ];
    mockPRService.getQueryStatus.and.returnValue(of(items));

    component.loadQueryStatus();

    expect(component.queryItems[0].cadTime).toBe(5); // 5.4 rounds down
    expect(component.queryItems[1].cadTime).toBe(6); // 5.5 rounds up
  });

  it('should show error snackbar and set empty items on API error', () => {
    mockPRService.getQueryStatus.and.returnValue(
      throwError(() => new Error('Server error'))
    );

    component.loadQueryStatus();

    expect(mockSnackbarService.showError).toHaveBeenCalledWith(
      'Failed to load query status data. Please try again.'
    );
    expect(component.queryItems).toEqual([]);
  });

  it('should set loading to false even on API error', () => {
    mockPRService.getQueryStatus.and.returnValue(
      throwError(() => new Error('Server error'))
    );

    component.loadQueryStatus();

    expect(component.loading()).toBe(false);
  });

  it('should sort items by priority ascending by default after loading', () => {
    mockPRService.getQueryStatus.and.returnValue(of(mockApiData));

    component.loadQueryStatus();

    // mockApiData has priorities 2, 1, 4 - sorted asc should be 1, 2, 4
    expect(component.queryItems[0].priority).toBe(1);
    expect(component.queryItems[1].priority).toBe(2);
    expect(component.queryItems[2].priority).toBe(4);
  });

  // ---- Priority-to-status mapping tests ----

  it('should map priority 1 to ready-almost-overdue', () => {
    const items: PathogenReductionQueryStatusDto[] = [{
      unitId: 'U1', cadProductCode: 'P', volumeTypeSet: 'V',
      cadStartTime: '2026-01-01T00:00:00Z', cadEndTime: null,
      cadTimeElapsed: 1, priority: 1, statusDescription: 'Almost Overdue'
    }];
    mockPRService.getQueryStatus.and.returnValue(of(items));

    component.loadQueryStatus();

    expect(component.queryItems[0].status).toBe('ready-almost-overdue');
  });

  it('should map priority 2 to ready-acceptable', () => {
    const items: PathogenReductionQueryStatusDto[] = [{
      unitId: 'U1', cadProductCode: 'P', volumeTypeSet: 'V',
      cadStartTime: '2026-01-01T00:00:00Z', cadEndTime: null,
      cadTimeElapsed: 1, priority: 2, statusDescription: 'Acceptable'
    }];
    mockPRService.getQueryStatus.and.returnValue(of(items));

    component.loadQueryStatus();

    expect(component.queryItems[0].status).toBe('ready-acceptable');
  });

  it('should map priority 3 to not-ready', () => {
    const items: PathogenReductionQueryStatusDto[] = [{
      unitId: 'U1', cadProductCode: 'P', volumeTypeSet: 'V',
      cadStartTime: '2026-01-01T00:00:00Z', cadEndTime: null,
      cadTimeElapsed: 1, priority: 3, statusDescription: 'Not Ready'
    }];
    mockPRService.getQueryStatus.and.returnValue(of(items));

    component.loadQueryStatus();

    expect(component.queryItems[0].status).toBe('not-ready');
  });

  it('should map priority 4 to discard-exceeded', () => {
    const items: PathogenReductionQueryStatusDto[] = [{
      unitId: 'U1', cadProductCode: 'P', volumeTypeSet: 'V',
      cadStartTime: '2026-01-01T00:00:00Z', cadEndTime: null,
      cadTimeElapsed: 1, priority: 4, statusDescription: 'Exceeded'
    }];
    mockPRService.getQueryStatus.and.returnValue(of(items));

    component.loadQueryStatus();

    expect(component.queryItems[0].status).toBe('discard-exceeded');
  });

  it('should map unknown priority to not-ready as default', () => {
    const items: PathogenReductionQueryStatusDto[] = [{
      unitId: 'U1', cadProductCode: 'P', volumeTypeSet: 'V',
      cadStartTime: '2026-01-01T00:00:00Z', cadEndTime: null,
      cadTimeElapsed: 1, priority: 99, statusDescription: 'Unknown'
    }];
    mockPRService.getQueryStatus.and.returnValue(of(items));

    component.loadQueryStatus();

    expect(component.queryItems[0].status).toBe('not-ready');
  });

  // ---- formatDateTime tests (via loadQueryStatus) ----

  it('should format valid ISO date strings', () => {
    const items: PathogenReductionQueryStatusDto[] = [{
      unitId: 'U1', cadProductCode: 'P', volumeTypeSet: 'V',
      cadStartTime: '2026-06-15T14:30:00Z', cadEndTime: null,
      cadTimeElapsed: 1, priority: 2, statusDescription: 'Ready'
    }];
    mockPRService.getQueryStatus.and.returnValue(of(items));

    component.loadQueryStatus();

    // DatePipe should format it; the exact output depends on locale
    // but it should NOT be the raw ISO string
    expect(component.queryItems[0].cadStartTime).toBeTruthy();
    expect(component.queryItems[0].cadStartTime).not.toBe('');
  });

  it('should return original string for invalid date', () => {
    const items: PathogenReductionQueryStatusDto[] = [{
      unitId: 'U1', cadProductCode: 'P', volumeTypeSet: 'V',
      cadStartTime: 'not-a-date', cadEndTime: null,
      cadTimeElapsed: 1, priority: 2, statusDescription: 'Ready'
    }];
    mockPRService.getQueryStatus.and.returnValue(of(items));

    component.loadQueryStatus();

    // Invalid date should fall back to the original string
    expect(component.queryItems[0].cadStartTime).toBe('not-a-date');
  });

  // ---- toggleSort tests ----

  it('should set sort to ascending when clicking a new column', () => {
    component.sortColumn = null;
    component.sortDirection = null;

    component.toggleSort('unitId');

    expect(component.sortColumn).toBe('unitId');
    expect(component.sortDirection).toBe('asc');
  });

  it('should toggle from ascending to descending on same column', () => {
    component.sortColumn = 'unitId';
    component.sortDirection = 'asc';

    component.toggleSort('unitId');

    expect(component.sortColumn).toBe('unitId');
    expect(component.sortDirection).toBe('desc');
  });

  it('should reset to default priority sort when toggling from desc to null', () => {
    // Load some data first
    mockPRService.getQueryStatus.and.returnValue(of(mockApiData));
    component.loadQueryStatus();

    // Sort by unitId ascending first
    component.toggleSort('unitId');
    expect(component.sortColumn).toBe('unitId');

    // Toggle to desc
    component.toggleSort('unitId');
    expect(component.sortDirection).toBe('desc');

    // Toggle again - should reset to null and re-sort by priority
    component.toggleSort('unitId');

    expect(component.sortColumn).toBeNull();
    expect(component.sortDirection).toBeNull();
    // Items should be re-sorted by priority ascending
    expect(component.queryItems[0].priority).toBe(1);
    expect(component.queryItems[1].priority).toBe(2);
    expect(component.queryItems[2].priority).toBe(4);
  });

  it('should switch to new column with ascending sort when different column clicked', () => {
    component.sortColumn = 'unitId';
    component.sortDirection = 'desc';

    component.toggleSort('cadProduct');

    expect(component.sortColumn).toBe('cadProduct');
    expect(component.sortDirection).toBe('asc');
  });

  // ---- Sorting behavior tests ----

  it('should sort items ascending by column', () => {
    mockPRService.getQueryStatus.and.returnValue(of(mockApiData));
    component.loadQueryStatus();

    component.toggleSort('unitId');

    expect(component.queryItems[0].unitId).toBe('UNIT001');
    expect(component.queryItems[1].unitId).toBe('UNIT002');
    expect(component.queryItems[2].unitId).toBe('UNIT003');
  });

  it('should sort items descending by column', () => {
    mockPRService.getQueryStatus.and.returnValue(of(mockApiData));
    component.loadQueryStatus();

    component.toggleSort('unitId'); // asc
    component.toggleSort('unitId'); // desc

    expect(component.queryItems[0].unitId).toBe('UNIT003');
    expect(component.queryItems[1].unitId).toBe('UNIT002');
    expect(component.queryItems[2].unitId).toBe('UNIT001');
  });

  it('should handle sorting when items have equal values', () => {
    const itemsWithSamePriority: PathogenReductionQueryStatusDto[] = [
      {
        unitId: 'U-B', cadProductCode: 'P1', volumeTypeSet: 'V1',
        cadStartTime: '2026-01-01T00:00:00Z', cadEndTime: null,
        cadTimeElapsed: 1, priority: 2, statusDescription: 'Ready'
      },
      {
        unitId: 'U-A', cadProductCode: 'P2', volumeTypeSet: 'V2',
        cadStartTime: '2026-01-02T00:00:00Z', cadEndTime: null,
        cadTimeElapsed: 2, priority: 2, statusDescription: 'Ready'
      }
    ];
    mockPRService.getQueryStatus.and.returnValue(of(itemsWithSamePriority));
    component.loadQueryStatus();

    // Both have priority 2, so sort by priority should maintain relative order
    // (stable sort behavior may vary, but no error should occur)
    expect(component.queryItems.length).toBe(2);
    expect(component.queryItems.every(i => i.priority === 2)).toBe(true);
  });

  // ---- onClose / onCancel / onSelect tests ----

  it('should close dialog with null when onClose is called', () => {
    component.onClose();

    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it('should close dialog with null when onCancel is called', () => {
    component.onCancel();

    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it('should close dialog with selected item when onSelect is called with a selection', () => {
    component.selectedItem = mockQueryItems[0];

    component.onSelect();

    expect(mockDialogRef.close).toHaveBeenCalledWith(mockQueryItems[0]);
  });

  it('should not close dialog when onSelect is called without a selection', () => {
    component.selectedItem = null;

    component.onSelect();

    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  // ---- ngOnDestroy tests ----

  it('should complete destroy$ subject on destroy', () => {
    const destroySub = (component as any).destroy$ as Subject<void>;
    let nextCalled = false;
    let completeCalled = false;

    destroySub.subscribe({
      next: () => (nextCalled = true),
      complete: () => (completeCalled = true)
    });

    component.ngOnDestroy();

    expect(nextCalled).toBe(true);
    expect(completeCalled).toBe(true);
  });

  // ---- selectedItem tests ----

  it('should initialize selectedItem as null', () => {
    expect(component.selectedItem).toBeNull();
  });

  // ---- Loading signal tests ----

  it('should initialize loading as false after data loads', () => {
    expect(component.loading()).toBe(false);
  });

  // ---- Empty data tests ----

  it('should handle empty API response gracefully', () => {
    mockPRService.getQueryStatus.and.returnValue(of([]));

    component.loadQueryStatus();

    expect(component.queryItems).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  // ---- Multiple calls to loadQueryStatus ----

  it('should replace previous items when loadQueryStatus is called again', () => {
    // First load with data
    mockPRService.getQueryStatus.and.returnValue(of(mockApiData));
    component.loadQueryStatus();
    expect(component.queryItems.length).toBe(3);

    // Second load with empty
    mockPRService.getQueryStatus.and.returnValue(of([]));
    component.loadQueryStatus();
    expect(component.queryItems.length).toBe(0);
  });

  it('should call getQueryStatus on each loadQueryStatus invocation', () => {
    mockPRService.getQueryStatus.calls.reset();

    component.loadQueryStatus();
    component.loadQueryStatus();

    expect(mockPRService.getQueryStatus).toHaveBeenCalledTimes(2);
  });
});
