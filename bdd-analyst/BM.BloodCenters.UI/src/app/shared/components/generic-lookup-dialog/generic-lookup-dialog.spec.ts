import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { GenericLookupDialog } from './generic-lookup-dialog';
import { LookupDialogConfig } from './generic-lookup-dialog.model';

interface MockItem {
  id: string;
  name: string;
  status: string;
}

describe('GenericLookupDialog', () => {
  let component: GenericLookupDialog<MockItem>;
  let fixture: ComponentFixture<GenericLookupDialog<MockItem>>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<GenericLookupDialog<MockItem>>>;

  const mockItems: MockItem[] = [
    { id: '001', name: 'Alpha', status: 'OPEN' },
    { id: '002', name: 'Beta', status: 'CLOSED' },
    { id: '003', name: 'Gamma', status: 'OPEN' }
  ];

  const baseConfig: LookupDialogConfig<MockItem> = {
    title: 'Select Item',
    columns: [
      { key: 'id', header: 'ID', width: '100px' },
      { key: 'name', header: 'Name', width: '200px' },
      { key: 'status', header: 'Status', width: '100px' }
    ],
    data: mockItems,
    selectionMode: 'single',
    selectionKey: 'id',
    searchFields: ['id', 'name']
  };

  function createComponent(configOverrides: Partial<LookupDialogConfig<MockItem>> = {}): void {
    const config = { ...baseConfig, ...configOverrides };

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [GenericLookupDialog, BrowserAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: config },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(GenericLookupDialog<MockItem>);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<GenericLookupDialog<MockItem>>>;
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('with static data', () => {
    beforeEach(() => createComponent());

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should display the title', () => {
      expect(component.config.title).toBe('Select Item');
    });

    it('should load all data', () => {
      expect(component.allData().length).toBe(3);
      expect(component.filteredData().length).toBe(3);
    });

    it('should set up displayed columns with select column for single mode', () => {
      expect(component.displayedColumns).toEqual(['select', 'id', 'name', 'status']);
    });

    it('should enable search when searchFields provided', () => {
      expect(component.enableSearch()).toBe(true);
    });

    it('should have no selection initially', () => {
      expect(component.selectedItem()).toBeNull();
      expect(component.hasSelection()).toBe(false);
    });
  });

  describe('selection', () => {
    beforeEach(() => createComponent());

    it('should select an item', () => {
      component.onSelectItem(mockItems[0]);
      expect(component.selectedItem()).toBe(mockItems[0]);
      expect(component.hasSelection()).toBe(true);
    });

    it('should identify selected item', () => {
      component.onSelectItem(mockItems[1]);
      expect(component.isSelected(mockItems[1])).toBe(true);
      expect(component.isSelected(mockItems[0])).toBe(false);
    });

    it('should close dialog with selected item on continue', () => {
      component.onSelectItem(mockItems[0]);
      component.onContinue();

      expect(dialogRef.close).toHaveBeenCalledWith({
        cancelled: false,
        selectedItem: mockItems[0]
      });
    });

    it('should not close dialog on continue without selection', () => {
      component.onContinue();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should select and close on double-click in single mode', () => {
      component.onRowDoubleClick(mockItems[2]);

      expect(component.selectedItem()).toBe(mockItems[2]);
      expect(dialogRef.close).toHaveBeenCalledWith({
        cancelled: false,
        selectedItem: mockItems[2]
      });
    });
  });

  describe('cancel', () => {
    beforeEach(() => createComponent());

    it('should close dialog with cancelled flag', () => {
      component.onCancel();

      expect(dialogRef.close).toHaveBeenCalledWith({ cancelled: true });
    });
  });

  describe('search', () => {
    beforeEach(() => createComponent());

    it('should filter data based on search text', () => {
      component.onSearch('alpha');
      expect(component.filteredData().length).toBe(1);
      expect(component.filteredData()[0].name).toBe('Alpha');
    });

    it('should filter by ID field', () => {
      component.onSearch('002');
      expect(component.filteredData().length).toBe(1);
      expect(component.filteredData()[0].id).toBe('002');
    });

    it('should show all data when search is cleared', () => {
      component.onSearch('alpha');
      expect(component.filteredData().length).toBe(1);

      component.onSearch('');
      expect(component.filteredData().length).toBe(3);
    });

    it('should show empty results for non-matching search', () => {
      component.onSearch('nonexistent');
      expect(component.filteredData().length).toBe(0);
    });
  });

  describe('with observable data', () => {
    beforeEach(() => createComponent({ data: of(mockItems) }));

    it('should load data from observable', () => {
      expect(component.allData().length).toBe(3);
      expect(component.filteredData().length).toBe(3);
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('with initialSearchTerm', () => {
    beforeEach(() => createComponent({ initialSearchTerm: 'Beta' }));

    it('should pre-fill search control', () => {
      expect(component.searchControl.value).toBe('Beta');
    });

    it('should filter data by initial search term', () => {
      expect(component.filteredData().length).toBe(1);
      expect(component.filteredData()[0].name).toBe('Beta');
    });
  });

  describe('without search fields', () => {
    beforeEach(() => createComponent({ searchFields: undefined }));

    it('should disable search', () => {
      expect(component.enableSearch()).toBe(false);
    });
  });

  describe('getDisplayValue', () => {
    beforeEach(() => createComponent());

    it('should return raw value when no formatter', () => {
      const col = { key: 'name', header: 'Name' };
      expect(component.getDisplayValue(mockItems[0], col)).toBe('Alpha');
    });

    it('should return dash for null values', () => {
      const item = { id: '004', name: null as any, status: 'OPEN' };
      const col = { key: 'name', header: 'Name' };
      expect(component.getDisplayValue(item, col)).toBe('–');
    });
  });

  describe('with custom formatters', () => {
    beforeEach(() => createComponent({
      formatters: { status: (val: string) => val === 'OPEN' ? 'Active' : 'Inactive' }
    }));

    it('should apply formatter to column value', () => {
      const col = { key: 'status', header: 'Status' };
      expect(component.getDisplayValue(mockItems[0], col)).toBe('Active');
      expect(component.getDisplayValue(mockItems[1], col)).toBe('Inactive');
    });
  });

  describe('accessibility', () => {
    beforeEach(() => createComponent());

    it('should have dialog role on container', () => {
      const container = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(container).toBeTruthy();
    });

    it('should have aria-labelledby on dialog container', () => {
      const container = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(container.getAttribute('aria-labelledby')).toBeTruthy();
    });

    it('should have close button with aria-label', () => {
      const closeBtn = fixture.nativeElement.querySelector('button[aria-label="Close dialog"]');
      expect(closeBtn).toBeTruthy();
    });
  });
});
