import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ValidDonationTypeProcedureCodeComponent } from './valid-donation-type-procedure-code';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ValidDonationTypeProcedureCodeService } from './services/valid-donation-type-procedure-code.service';
import { HeaderService } from '@shared/services/header.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ValidDonationTypeProcedureCodeComponent', () => {
  let component: ValidDonationTypeProcedureCodeComponent;
  let fixture: ComponentFixture<ValidDonationTypeProcedureCodeComponent>;
  let mockService: jasmine.SpyObj<ValidDonationTypeProcedureCodeService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    // Create mock service
    mockService = jasmine.createSpyObj('ValidDonationTypeProcedureCodeService', [
      'getValidDonationTypeProcedureCodes'
    ]);

    // Mock to return empty data
    mockService.getValidDonationTypeProcedureCodes.and.returnValue(of({
      data: [],
      totalRecords: 0
    }));

    // Create mock HeaderService with signal
    mockHeaderService = createMockHeaderService();
    (mockHeaderService as any).chapterTimeZone = signal('America/Chicago');

      TestBed.configureTestingModule({
      imports: [ValidDonationTypeProcedureCodeComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: ValidDonationTypeProcedureCodeService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    

      mockService.getValidDonationTypeProcedureCodes.calls.reset();

    fixture = TestBed.createComponent(ValidDonationTypeProcedureCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    });

  it('should have correct initial breadcrumbs structure', () => {
    expect(component.headerConfig.breadcrumbs.length).toBe(2);
    expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    expect(component.headerConfig.breadcrumbs[0].link).toBe('/home');
    expect(component.headerConfig.breadcrumbs[1].label).toBe('');
    expect(component.headerConfig.breadcrumbs[1].link).toBeNull();
  });

  it('should open side panel in add mode when createRecord is called', () => {
    component.createRecord();
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('add');
  });

  it('should close side panel when closeSidePanel is called', () => {
    component.sidePanelOpen = true;
    component.closeSidePanel();
    expect(component.sidePanelOpen).toBeFalse();
  });

  it('should have correct search placeholder', () => {
    expect(component.searchConfig.placeholder).toBe('Search by Donation Type, Procedure Code, Attribute Group and Attribute Code');
  });

  it('should open side panel in edit mode with data when editRecord is called', () => {
    const mockData = {
      DonationType: 'WHOLE',
      ProcedureCode: 'WB',
      AttribGroup: 'TEST',
      AttribCode: 'TC1'
    };
    component.editRecord(mockData);
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toEqual(mockData);
  });

  it('should initialize with empty dataSource', () => {
    expect(component.dataSource.length).toBe(0);
  });

  it('should initialize with empty filterChips array', () => {
    expect(component.filterChips.length).toBe(0);
  });

  describe('Initial sort state', () => {
    it('should initialize requestState with sort ascending', () => {
      expect(component.requestState.sort).toBe('A');
    });

    it('should initialize table sortConfig with ascending direction', () => {
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });

    it('should initialize table sortConfig with DonationType column', () => {
      expect(component.tableConfig.sortConfig?.column).toBe('DonationType');
    });
  });

  describe('Sort functionality (onSortChange)', () => {
    it('should toggle to ascending on first sort click', () => {
      component.onSortChange({ column: 'DonationType', direction: 'A' });
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(component.requestState.sort).toBe('A');
    });

    it('should toggle to descending when direction is D', () => {
      component.onSortChange({ column: 'DonationType', direction: 'D' });
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
      expect(component.requestState.sort).toBe('D');
    });

    it('should reset pagination to page 0 on sort change', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }
      component.onSortChange({ column: 'DonationType', direction: 'A' });
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should call loadData on sort change', () => {
      const loadDataSpy = spyOn<any>(component, 'loadData');
      component.onSortChange({ column: 'DonationType', direction: 'D' });
      expect(loadDataSpy).toHaveBeenCalled();
    });
  });

  describe('formatDate - date-only fields (EffDate, TermDate)', () => {
    it('should format date as DD-MON-YYYY', () => {
      const result = (component as any).formatDate('2028-04-18T20:30:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should pad single-digit day with leading zero', () => {
      const result = (component as any).formatDate('2028-04-05T00:00:00Z');
      expect(result).toMatch(/^0\d-[A-Z]{3}-\d{4}$/);
    });

    it('should format month name in uppercase', () => {
      const result = (component as any).formatDate('2028-12-25T00:00:00Z');
      expect(result).toContain('DEC');
    });

    it('should return dash for null date', () => {
      expect((component as any).formatDate(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect((component as any).formatDate(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect((component as any).formatDate('')).toBe('-');
    });

    it('should use formatDate for EffDate column', () => {
      const effCol = component.tableConfig.columns.find((c: any) => c.header === 'Effective Date') as any;
      const row = { EffDate: '2028-06-30' };
      const result = effCol.valueFormatter(null, row);
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should use formatDate for TermDate column', () => {
      const termCol = component.tableConfig.columns.find((c: any) => c.header === 'Termination Date') as any;
      const row = { TermDate: '2028-12-31' };
      const result = termCol.valueFormatter(null, row);
      expect(result).toBe('31-DEC-2028');
    });
  });

  describe('formatChapterDate - Modification Date with chapter timezone', () => {
    it('should format as DD-MON-YYYY with no time portion', () => {
      const result = (component as any).formatChapterDate('2028-04-18T20:30:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(result).not.toContain(':');
    });

    it('should return dash for null date', () => {
      expect((component as any).formatChapterDate(null)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect((component as any).formatChapterDate('')).toBe('-');
    });

    it('should apply chapter timezone offset to UTC date', () => {
      (mockHeaderService as any).chapterTimeZone = signal('-05:00');
      const result = (component as any).formatChapterDate('2028-01-15T03:00:00Z');
      expect(result).toBe('14-JAN-2028');
    });

    it('should apply positive offset correctly', () => {
      (mockHeaderService as any).chapterTimeZone = signal('+05:30');
      const result = (component as any).formatChapterDate('2028-01-14T21:00:00Z');
      expect(result).toBe('15-JAN-2028');
    });

    it('should apply large negative offset correctly', () => {
      (mockHeaderService as any).chapterTimeZone = signal('-23:00');
      const result = (component as any).formatChapterDate('2028-01-15T02:00:00Z');
      expect(result).toBe('14-JAN-2028');
    });

    it('should fall back to moment(date) when offset is empty', () => {
      (mockHeaderService as any).chapterTimeZone = signal('');
      const result = (component as any).formatChapterDate('2028-04-18T00:00:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should use formatChapterDate for the Modification Date column', () => {
      const modCol = component.tableConfig.columns.find((c: any) => c.header === 'Modification Date') as any;
      const row = { LastModifiedDate: '2028-06-01T14:45:00Z' };
      const result = modCol.valueFormatter(null, row);
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(result).not.toContain(':');
    });
  });
});
