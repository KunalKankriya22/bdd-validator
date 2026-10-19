import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MobilePcLaptopRegisterComponent } from './mobile-pc-laptop-register';
import { MobilePcLaptopRegisterService } from './services/mobile-pc-laptop-register.service';
import { of, throwError, Observable } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';
import { MobilePcLaptopRegisterModel } from './models/mobile-pc-laptop-register.model';
import { provideRouter } from '@angular/router';

describe('MobilePcLaptopRegisterComponent', () => {
  let component: MobilePcLaptopRegisterComponent;
  let fixture: ComponentFixture<MobilePcLaptopRegisterComponent>;
  let mockService: jasmine.SpyObj<MobilePcLaptopRegisterService>;
  let mockOverlay: jasmine.SpyObj<Overlay>;

  const mockData: MobilePcLaptopRegisterModel[] = [
    {
      laptopId: 'LTP-101',
      temporaryId: 'A1',
      chapterId: 'DAL',
      chapter: 'DAL',
      currentSequence: 10542,
      auditIncrement: 1,
      refreshDate: new Date('2025-12-02'),
      location: 'LAB',
      detail1: 'Server detail A',
      detail2: 'Config type 1',
      detail3: 'C1',
      detail4: 'C1'
    },
    {
      laptopId: 'LTP-102',
      temporaryId: 'B2',
      chapterId: 'DAL',
      chapter: 'DAL',
      currentSequence: 9876,
      auditIncrement: 2,
      refreshDate: new Date('2025-04-15'),
      location: 'OFFICE',
      detail1: 'Detail 1',
      detail2: 'Detail 2',
      detail3: '',
      detail4: ''
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('MobilePcLaptopRegisterService', [
      'getMobilePcLaptopRegister',
      'getMobilePcLaptopRegisterFilters',
      'getChapters',
      'addMobilePcLaptopRegister',
      'updateMobilePcLaptopRegister'
    ]);

    mockService.getMobilePcLaptopRegister.and.returnValue(of({ data: mockData, totalRecords: 2 }));
    mockService.getMobilePcLaptopRegisterFilters.and.returnValue(of({ chapters: [] }));
    mockService.getChapters.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [MobilePcLaptopRegisterComponent,
        NoopAnimationsModule,
        HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: MobilePcLaptopRegisterService, useValue: mockService },
        Overlay
      ]
    });


    


      mockService.getMobilePcLaptopRegister.calls.reset();


      mockService.getMobilePcLaptopRegisterFilters.calls.reset();


      mockService.getChapters.calls.reset();


      mockService.addMobilePcLaptopRegister.calls.reset();


      mockService.updateMobilePcLaptopRegister.calls.reset();


      mockService.getMobilePcLaptopRegister.and.returnValue(of({ data: mockData, totalRecords: 2 }));


      mockService.getMobilePcLaptopRegisterFilters.and.returnValue(of({ chapters: [] }));


      mockService.getChapters.and.returnValue(of([]));


    fixture = TestBed.createComponent(MobilePcLaptopRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });
  describe('Row Expansion', () => {


    it('should expand multiple rows', () => {
      const row1 = mockData[0];
      const row2 = mockData[1];

      component.toggleRow(row1);
      expect(component.isExpanded(row1)).toBeTrue();

      component.toggleRow(row2);
      expect(component.isExpanded(row1)).toBeTrue();
      expect(component.isExpanded(row2)).toBeTrue();
    });
  });

  describe('Side Panel Operations', () => {
    it('should open side panel for add', () => {
      component.createRecord();
      
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open side panel for edit', () => {
      const mockRecord = mockData[0];
      
      component.editRecord(mockRecord);
      
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockRecord);
    });



    it('should handle mode change to add', () => {
      component.sidePanelData = mockData[0];
      
      component.onModeChange('add');
      
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should handle mode change to edit', () => {
      component.onModeChange('edit');
      
      expect(component.sidePanelMode).toBe('edit');
    });
  });

  describe('Search Functionality', () => {
    it('should handle search with text', () => {
      spyOn(component, 'loadData');
      
      component.onSearch('LTP-101');
      
      expect(component.requestState.searchKeyword).toBe('LTP-101');
      expect(component.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should handle empty search', () => {
      spyOn(component, 'loadData');
      component.requestState.searchKeyword = 'previous';
      
      component.onSearch('');
      
      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(component.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {


    it('should calculate correct skip value', () => {
      component.pageIndex = 2;
      component.pageSize = 25;
      
      component.loadData();
      
      expect(mockService.getMobilePcLaptopRegister).toHaveBeenCalledWith(
        25,  // take
        50,  // skip (2 * 25)
        jasmine.any(Object)
      );
    });
  });

  describe('Sorting', () => {
    it('should handle sort cycling undefined -> D -> A -> D', () => {
      spyOn(component, 'loadData');
      component.sortDirection = undefined as any;

      // First click - D
      component.onSort('chapter');
      expect(component.sortColumn).toBe('chapter');
      expect(component.sortDirection).toBe('D');
      expect(component.requestState.sort).toBe('D');

      // Second click - A
      component.onSort('chapter');
      expect(component.sortDirection).toBe('A');
      expect(component.requestState.sort).toBe('A');

      // Third click - D
      component.onSort('chapter');
      expect(component.sortDirection).toBe('D');
      expect(component.requestState.sort).toBe('D');
    });


  });
  describe('Filter Operations', () => {
    it('should apply filters correctly', () => {
      spyOn(component, 'loadData');
      
      const filters = {
        chapter: 'DAL',
        period: 'Before',
        refreshDate: new Date('2025-03-05')
      };
      
      component.applyFilters(filters);
      
      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.chapterId).toBe('DAL');
      expect(component.requestState.refreshDatePeriod).toBe('Before');
      expect(component.requestState.refreshDate).toBeDefined();
      expect(component.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });



    it('should check hasActiveFilters correctly', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBeFalse();
      
      component.appliedFilters = { chapter: 'DAL' };
      expect(component.hasActiveFilters()).toBeTrue();
    });
  });
});
