import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { HorizontalTestFileTestMappingComponent } from './horizontal-test-file-test-mapping';
import { HtfMappingService } from './services/htf-mapping.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('HorizontalTestFileTestMappingComponent', () => {
  let mockPageHeaderService: any;
  let component: HorizontalTestFileTestMappingComponent;
  let fixture: ComponentFixture<HorizontalTestFileTestMappingComponent>;
  let mockService: jasmine.SpyObj<HtfMappingService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterSubject: Subject<void>;

  const mockData = [
    {
      sequenceNo: 1,
      headerName: 'HBSAG',
      testDesc: 'Hepatitis B Surface Antigen',
      startPos: 15,
      endPos: 18,
      modifiedUser: 'admin',
      modifiedDate: '2025-01-01',
    },
    {
      sequenceNo: 2,
      headerName: 'HIV-1/2',
      testDesc: 'HIV Antibody',
      startPos: 18,
      endPos: 15,
      modifiedUser: 'admin',
      modifiedDate: '2025-01-01',
    },
  ];

  beforeEach(() => {

    chapterSubject = new Subject<void>();

    mockService = jasmine.createSpyObj('HtfMappingService', [
      'getAll',
      'create',
      'update',
      'delete',
      'getTestIdsDropdown',
    ]);
    mockService.getAll.and.returnValue(of({ data: mockData, totalRecords: 2 }));

    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterSubject.asObservable() });
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal({ title: 'Horizontal Test File Test Mapping', subtitle: '' }),
    });
    mockPageHeaderService.getTitle.and.returnValue('Horizontal Test File Test Mapping');
    mockPageHeaderService.getSubtitle.and.returnValue('');



      TestBed.configureTestingModule({
      imports: [
        HorizontalTestFileTestMappingComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: HtfMappingService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
      ],
    });

      mockService.getAll.and.returnValue(of({ data: mockData, totalRecords: 2 }));


      mockPageHeaderService.getTitle.and.returnValue('Horizontal Test File Test Mapping');


      mockPageHeaderService.getSubtitle.and.returnValue('');


    fixture = TestBed.createComponent(HorizontalTestFileTestMappingComponent);
    component = fixture.componentInstance;


    });




































  it('should handle row action for edit', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const row = mockData[0] as any;
    component.onRowAction({ action: 'edit', row });

    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('edit');
  }));

  it('should reload data and close panel on chapter change', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.sidePanelOpen = true;
    chapterSubject.next();
    tick();

    expect(mockService.getAll).toHaveBeenCalled();
    expect(component.sidePanelOpen).toBeFalse();
  }));

  it('should clear request state on chapter change', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.requestState.searchKeyword = 'test';
    chapterSubject.next();
    tick();

    expect(component.requestState).toEqual({});
  }));

  describe('Data Loading', () => {
    it('should populate dataSource on successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.dataSource.length).toBe(2);
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle error on loadData', fakeAsync(() => {
      mockService.getAll.and.returnValue(throwError(() => new Error('API error')));
      component.loadData();
      tick();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Failed to load test mappings. Please try again.');
    }));
  });

  describe('Search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set search keyword and reload data', fakeAsync(() => {
      mockService.getAll.calls.reset();
      component.onSearch('HBSAG');
      tick();

      expect(component.requestState.searchKeyword).toBe('HBSAG');
      expect(mockService.getAll).toHaveBeenCalled();
    }));

    it('should set searchKeyword to null for empty search', fakeAsync(() => {
      component.onSearch('');
      tick();

      expect(component.requestState.searchKeyword).toBeNull();
    }));

    it('should reset page index on search', fakeAsync(() => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }
      component.onSearch('test');
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    }));

    it('should close side panel on search', fakeAsync(() => {
      component.sidePanelOpen = true;
      component.onSearch('test');
      tick();

      expect(component.sidePanelOpen).toBeFalse();
    }));
  });

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update page index and size on page change', fakeAsync(() => {
      mockService.getAll.calls.reset();
      component.onPageChange({ pageIndex: 2, pageSize: 50 });
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
      expect(mockService.getAll).toHaveBeenCalled();
    }));

    it('should close side panel on page change', fakeAsync(() => {
      component.sidePanelOpen = true;
      component.onPageChange({ pageIndex: 1, pageSize: 25 });
      tick();

      expect(component.sidePanelOpen).toBeFalse();
    }));
  });

  describe('Sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update sort config on sort change', fakeAsync(() => {
      mockService.getAll.calls.reset();
      component.onSortChange({ column: 'headerName', direction: 'D' });
      tick();

      expect(component.tableConfig.sortConfig?.column).toBe('headerName');
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
      expect(mockService.getAll).toHaveBeenCalled();
    }));

    it('should close side panel on sort change', fakeAsync(() => {
      component.sidePanelOpen = true;
      component.onSortChange({ column: 'sequenceNo', direction: 'A' });
      tick();

      expect(component.sidePanelOpen).toBeFalse();
    }));
  });

  describe('Create Record', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set side panel to add mode', () => {
      component.createRecord();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Close Side Panel', () => {
    it('should close side panel and clear data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0] as any;

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    }));
  });

  describe('Save Success', () => {
    it('should reload data on save success', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.getAll.calls.reset();

      component.onSaveSuccess();
      tick();

      expect(mockService.getAll).toHaveBeenCalled();
    }));
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open create record on Alt+C', () => {
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
    });

    it('should close side panel on Escape', () => {
      component.sidePanelOpen = true;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should not close side panel on Escape when panel is not open', () => {
      component.sidePanelOpen = false;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
