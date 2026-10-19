import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

import { InterdictionsTableComponent } from './interdictions-table';
import { UnitInterdiction } from '../models/unit-interdiction.model';

const mockRow: UnitInterdiction = {
  id: '1',
  transactionId: 'TXN001',
  code: 'HBVP',
  description: 'Hep B Virus Positive',
  type: 'INTER',
  effectiveDate: '2026-01-15',
  terminationDate: undefined,
  userId: 'USER001',
  originated: 'D',
  reason: 'ERR',
  groupMode: 'A',
  groupId: 'GRP001',
  isTerminated: false,
  isReleased: false,
  canTerminate: true,
  canRelease: false
};

describe('InterdictionsTableComponent', () => {
  let component: InterdictionsTableComponent;
  let fixture: ComponentFixture<InterdictionsTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InterdictionsTableComponent, NoopAnimationsModule]
    });

    fixture = TestBed.createComponent(InterdictionsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('displayedColumns', () => {
    it('should contain all expected columns', () => {
      const expected = ['code', 'description', 'type', 'effectiveDate', 'terminationDate', 'releaseDate', 'userId', 'originated', 'reason', 'groupMode', 'groupId', 'actions'];
      expected.forEach(col => {
        expect(component.displayedColumns).toContain(col);
      });
    });

    it('should have exactly 12 columns', () => {
      expect(component.displayedColumns.length).toBe(12);
    });
  });

  describe('getSortIcon', () => {
    it('should return unfold_more when no sort direction', () => {
      component.currentSortDirection = '';
      expect(component.getSortIcon()).toBe('unfold_more');
    });

    it('should return arrow_upward when ascending', () => {
      component.currentSortDirection = 'asc';
      expect(component.getSortIcon()).toBe('arrow_upward');
    });

    it('should return arrow_downward when descending', () => {
      component.currentSortDirection = 'desc';
      expect(component.getSortIcon()).toBe('arrow_downward');
    });
  });

  describe('onCodeSort', () => {
    it('should cycle from empty to asc', () => {
      component.currentSortDirection = '';
      component.onCodeSort();
      expect(component.currentSortDirection).toBe('asc');
    });

    it('should cycle from asc to desc', () => {
      component.currentSortDirection = 'asc';
      component.onCodeSort();
      expect(component.currentSortDirection).toBe('desc');
    });

    it('should cycle from desc back to asc', () => {
      component.currentSortDirection = 'desc';
      component.onCodeSort();
      expect(component.currentSortDirection).toBe('asc');
    });

    it('should emit sortChange with code and current direction', () => {
      const sortSpy = jest.spyOn(component.sortChange, 'emit');
      component.currentSortDirection = '';
      component.onCodeSort();
      expect(sortSpy).toHaveBeenCalledWith({ active: 'code', direction: 'asc' });
    });

    it('should emit sortChange with desc direction on second call', () => {
      const sortSpy = jest.spyOn(component.sortChange, 'emit');
      component.currentSortDirection = 'asc';
      component.onCodeSort();
      expect(sortSpy).toHaveBeenCalledWith({ active: 'code', direction: 'desc' });
    });
  });

  describe('onMenuOpened / onMenuClosed / isMenuActive', () => {
    it('should set activeMenuRow on onMenuOpened', () => {
      component.onMenuOpened(mockRow);
      expect(component.activeMenuRow).toBe(mockRow);
    });

    it('should clear activeMenuRow on onMenuClosed', () => {
      component.activeMenuRow = mockRow;
      component.onMenuClosed();
      expect(component.activeMenuRow).toBeNull();
    });

    it('should return true from isMenuActive when row is active menu row', () => {
      component.activeMenuRow = mockRow;
      expect(component.isMenuActive(mockRow)).toBe(true);
    });

    it('should return false from isMenuActive when row is not active menu row', () => {
      component.activeMenuRow = null;
      expect(component.isMenuActive(mockRow)).toBe(false);
    });
  });

  describe('isRowActive', () => {
    it('should return true when row is active menu row', () => {
      component.activeMenuRow = mockRow;
      component.highlightedRow = null;
      expect(component.isRowActive(mockRow)).toBe(true);
    });

    it('should return true when row is highlighted row', () => {
      component.activeMenuRow = null;
      component.highlightedRow = mockRow;
      expect(component.isRowActive(mockRow)).toBe(true);
    });

    it('should return false when row is neither active nor highlighted', () => {
      component.activeMenuRow = null;
      component.highlightedRow = null;
      expect(component.isRowActive(mockRow)).toBe(false);
    });
  });

  describe('onPageChange', () => {
    it('should emit pageChange event', () => {
      const pageChangeSpy = jest.spyOn(component.pageChange, 'emit');
      const event: PageEvent = { pageIndex: 1, pageSize: 25, length: 100 };
      component.onPageChange(event);
      expect(pageChangeSpy).toHaveBeenCalledWith(event);
    });
  });

  describe('onSortChange', () => {
    it('should emit sortChange event', () => {
      const sortSpy = jest.spyOn(component.sortChange, 'emit');
      const sort: Sort = { active: 'description', direction: 'asc' };
      component.onSortChange(sort);
      expect(sortSpy).toHaveBeenCalledWith(sort);
    });
  });

  describe('onTerminate', () => {
    it('should emit actionClick with type terminate', () => {
      const actionSpy = jest.spyOn(component.actionClick, 'emit');
      component.onTerminate(mockRow);
      expect(actionSpy).toHaveBeenCalledWith({ type: 'terminate', interdiction: mockRow });
    });
  });

  describe('onRelease', () => {
    it('should emit actionClick with type release', () => {
      const actionSpy = jest.spyOn(component.actionClick, 'emit');
      component.onRelease(mockRow);
      expect(actionSpy).toHaveBeenCalledWith({ type: 'release', interdiction: mockRow });
    });
  });

  describe('formatDate', () => {
    it('should return empty string for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should format a date string as DD-MON-YYYY', () => {
      const result = component.formatDate('2026-01-15T12:00:00');
      expect(result).toBe('15-JAN-2026');
    });

    it('should pad single digit day with zero', () => {
      const result = component.formatDate('2026-03-05T12:00:00');
      expect(result).toBe('05-MAR-2026');
    });

    it('should return uppercase month abbreviation', () => {
      const result = component.formatDate('2026-07-13T12:00:00');
      expect(result).toMatch(/JUL/);
    });
  });

  describe('ngOnChanges', () => {
    it('should handle dataSource changes without error', () => {
      const changes = {
        dataSource: {
          currentValue: [mockRow],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      };
      expect(() => component.ngOnChanges(changes)).not.toThrow();
    });
  });

  describe('inputs', () => {
    it('should default isLoading to false', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should default totalRecords to 0', () => {
      expect(component.totalRecords).toBe(0);
    });

    it('should default pageSize to 25', () => {
      expect(component.pageSize).toBe(25);
    });

    it('should default pageIndex to 0', () => {
      expect(component.pageIndex).toBe(0);
    });

    it('should have default pageSizeOptions', () => {
      expect(component.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });
  });

  describe('formatDate - edge cases', () => {
    it('should return empty string for null', () => {
      expect(component.formatDate(null as any)).toBe('');
    });

    it('should handle date-only string without time component', () => {
      const result = component.formatDate('2026-01-15');
      expect(result).toBe('15-JAN-2026');
    });

    it('should format December date correctly', () => {
      const result = component.formatDate('2026-12-25T00:00:00');
      expect(result).toBe('25-DEC-2026');
    });

    it('should format February date correctly', () => {
      const result = component.formatDate('2026-02-14T10:30:00');
      expect(result).toBe('14-FEB-2026');
    });
  });

  describe('dataSource input', () => {
    it('should accept dataSource input', () => {
      component.dataSource = [mockRow];
      expect(component.dataSource.length).toBe(1);
    });

    it('should accept empty dataSource', () => {
      component.dataSource = [];
      expect(component.dataSource.length).toBe(0);
    });

    it('should accept multiple rows', () => {
      const rows = [
        mockRow,
        { ...mockRow, id: '2', code: 'HCVP', description: 'Hep C Virus Positive' }
      ];
      component.dataSource = rows;
      expect(component.dataSource.length).toBe(2);
    });
  });

  describe('highlightedRow input', () => {
    it('should default highlightedRow to null', () => {
      expect(component.highlightedRow).toBeNull();
    });

    it('should accept a highlighted row', () => {
      component.highlightedRow = mockRow;
      expect(component.highlightedRow).toBe(mockRow);
    });
  });

  describe('isRowActive - combined conditions', () => {
    it('should return true when row is both active menu and highlighted', () => {
      component.activeMenuRow = mockRow;
      component.highlightedRow = mockRow;
      expect(component.isRowActive(mockRow)).toBe(true);
    });

    it('should return false for different row than active/highlighted', () => {
      const otherRow = { ...mockRow, id: '99', code: 'OTHER' };
      component.activeMenuRow = mockRow;
      component.highlightedRow = mockRow;
      expect(component.isRowActive(otherRow)).toBe(false);
    });
  });

  describe('ngOnChanges - additional cases', () => {
    it('should handle changes with no dataSource key', () => {
      const changes = {
        isLoading: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false
        }
      };
      expect(() => component.ngOnChanges(changes)).not.toThrow();
    });

    it('should handle first change of dataSource', () => {
      const changes = {
        dataSource: {
          currentValue: [mockRow],
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      };
      expect(() => component.ngOnChanges(changes)).not.toThrow();
    });
  });

  describe('onCodeSort - full cycle emit verification', () => {
    it('should emit three different sort directions over three calls', () => {
      const sortSpy = jest.spyOn(component.sortChange, 'emit');
      component.currentSortDirection = '';

      component.onCodeSort();
      expect(sortSpy).toHaveBeenCalledWith({ active: 'code', direction: 'asc' });

      component.onCodeSort();
      expect(sortSpy).toHaveBeenCalledWith({ active: 'code', direction: 'desc' });

      component.onCodeSort();
      expect(sortSpy).toHaveBeenCalledWith({ active: 'code', direction: 'asc' });

      expect(sortSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('formatDate - boundary dates', () => {
    it('should handle end-of-year date', () => {
      const result = component.formatDate('2026-12-31T23:59:59');
      expect(result).toBe('31-DEC-2026');
    });

    it('should handle start-of-year date', () => {
      const result = component.formatDate('2026-01-01T00:00:00');
      expect(result).toBe('01-JAN-2026');
    });

    it('should handle leap year date', () => {
      const result = component.formatDate('2024-02-29T12:00:00');
      expect(result).toBe('29-FEB-2024');
    });
  });

  describe('CustomPaginatorIntl', () => {
    it('should use custom items per page label', () => {
      const paginator = fixture.debugElement.injector.get(MatPaginatorIntl);
      expect(paginator.itemsPerPageLabel).toBe('Rows per page:');
    });
  });
});
