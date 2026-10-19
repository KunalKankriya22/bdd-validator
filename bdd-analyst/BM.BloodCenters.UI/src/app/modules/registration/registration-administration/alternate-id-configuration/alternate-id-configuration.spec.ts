import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';
import { AlternateIdConfiguration } from './alternate-id-configuration';
import { AlternateIdService } from './services/alternate-id.service';
import { AlternateIdDonorGrade, AlternateIdSearchParams } from './models/alternate-id.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { TranslateModule } from '@ngx-translate/core';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AlternateIdConfiguration', () => {
  let component: AlternateIdConfiguration;
  let fixture: ComponentFixture<AlternateIdConfiguration>;
  let mockService: jasmine.SpyObj<AlternateIdService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let chapterChangedSubject: Subject<void>;

  const mockData: AlternateIdDonorGrade[] = [
    {
      keyDataGrade: '2',
      altidMatchType: 'DIFF',
      finalGrade: '3',
      effDate: new Date('2026-01-01'),
      termDate: new Date('2026-12-31'),
      programId: 'VDIALTID',
      insertDate: new Date('2025-12-15'),
      insertUser: 'ADMIN',
      auditKey: 1,
    },
    {
      keyDataGrade: '5',
      altidMatchType: 'SAME',
      finalGrade: '1',
      effDate: new Date('2026-01-15'),
      termDate: new Date('2027-01-14'),
      programId: 'VDIALTID',
      insertDate: new Date('2025-12-20'),
      insertUser: 'ADMIN',
      auditKey: 2,
    },
    {
      keyDataGrade: '2',
      altidMatchType: 'SIMM',
      finalGrade: '3',
      effDate: new Date('2026-03-01'),
      programId: 'VDIALTID',
      insertDate: new Date('2026-02-01'),
      insertUser: 'ADMIN',
      auditKey: 3,
    },
  ];

  const mockPageHeaderService = {
    pageHeaderData: signal({ title: 'Alternate ID Configuration', subtitle: 'Manage alternate ID donor grades' })
  };

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockService = jasmine.createSpyObj('AlternateIdService', [
      'getAll',
      'create',
      'update',
      'delete',
    ]);
    mockSnackBar = createMockMatSnackBar();

    mockService.getAll.and.returnValue(of(mockData));

    const mockHeaderService = {
      chapterChanged$: chapterChangedSubject.asObservable(),
      chapterTimeZone: signal('America/New_York'),
      chapterId: signal(1),
      chapterName: signal('Test Chapter'),
      warehouseId: signal(1),
      warehouseName: signal('Test Warehouse'),
    };



      TestBed.configureTestingModule({
      imports: [AlternateIdConfiguration, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AlternateIdService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        Overlay,
      ],
    })
      .overrideComponent(AlternateIdConfiguration, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: mockSnackBar },
          ],
        },
      });


    


      mockService.getAll.calls.reset();


      mockService.create.calls.reset();


      mockService.update.calls.reset();


      mockService.delete.calls.reset();


      mockService.getAll.and.returnValue(of(mockData));


    fixture = TestBed.createComponent(AlternateIdConfiguration);
    component = fixture.componentInstance;


    });

  describe('search', () => {








    it('should return empty when search matches nothing', () => {
      fixture.detectChanges();
      component.onSearch('xyz');
      expect(component.dataSource.length).toBe(0);
    });
  });

  describe('filters', () => {
    it('should apply key grade filter', () => {
      fixture.detectChanges();
      component.applyFilters({ keyDataGrade: '2' });
      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource.every(d => d.keyDataGrade === '2')).toBeTrue();
    });



    it('should apply final grade filter', () => {
      fixture.detectChanges();
      component.applyFilters({ finalGrade: '3' });
      expect(component.dataSource.length).toBe(2);
    });

    it('should apply effective date After filter', () => {
      fixture.detectChanges();
      component.applyFilters({
        effDate: new Date('2026-01-10'),
        effDatePeriod: 'After'
      });
      expect(component.dataSource.length).toBe(2);
    });

    it('should apply effective date Before filter', () => {
      fixture.detectChanges();
      component.applyFilters({
        effDate: new Date('2026-01-10'),
        effDatePeriod: 'Before'
      });
      expect(component.dataSource.length).toBe(1);
    });

    it('should apply termination date filter', () => {
      fixture.detectChanges();
      component.applyFilters({
        termDate: new Date('2027-01-01'),
        termDatePeriod: 'After'
      });
      expect(component.dataSource.length).toBe(1);
    });

    it('should generate filter chips when filters applied', () => {
      fixture.detectChanges();
      component.applyFilters({ keyDataGrade: '2', finalGrade: '3' });
      expect(component.filterChips.length).toBe(2);
    });







    it('should combine search and filters', () => {
      fixture.detectChanges();
      component.onSearch('2');
      component.applyFilters({ finalGrade: '3' });
      expect(component.dataSource.length).toBe(2);
    });
  });

  describe('sort', () => {


    it('should sort data descending', () => {
      fixture.detectChanges();
      component.onSortChange({ column: 'keyDataGrade', direction: 'D' });
      expect(component.dataSource[0].keyDataGrade).toBe('5');
    });
  });

  describe('side panel', () => {
    it('should open in add mode', () => {
      fixture.detectChanges();
      component.createRecord();
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open in edit mode with record data', () => {
      fixture.detectChanges();
      component.editRecord(mockData[0]);
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[0]);
    });




  });

  describe('filter options from table data', () => {
    it('should extract unique key grades sorted', () => {
      fixture.detectChanges();
      expect(component.filterKeyGradeOptions.map(o => o.value)).toEqual(['2', '5']);
    });



    it('should extract unique final grades sorted', () => {
      fixture.detectChanges();
      expect(component.filterFinalGradeOptions.map(o => o.value)).toEqual(['1', '3']);
    });

    it('should update filter options when data reloads', () => {
      fixture.detectChanges();
      const newData: AlternateIdDonorGrade[] = [{
        keyDataGrade: '9', altidMatchType: 'DIFF', finalGrade: '7',
        effDate: new Date(), programId: 'VDIALTID',
        insertDate: new Date(), insertUser: 'ADMIN', auditKey: 10,
      }];
      mockService.getAll.and.returnValue(of(newData));
      component.loadData();
      expect(component.filterKeyGradeOptions.map(o => o.value)).toEqual(['9']);
      expect(component.filterFinalGradeOptions.map(o => o.value)).toEqual(['7']);
    });
  });

  describe('chapter change', () => {
    it('should reset all state on chapter change', () => {
      fixture.detectChanges();
      mockService.getAll.calls.reset();

      component.searchText = 'test';
      component.appliedFilters = { keyDataGrade: '2' };
      component.filterChips = [{ key: 'keyDataGrade', label: 'Key Grade: 2', value: '2' }];
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];

      chapterChangedSubject.next();

      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
      expect(mockService.getAll).toHaveBeenCalled();
    });
  });
  describe('filter panel state', () => {
    it('should initialize filter open as false', () => {
      expect(component.isFilterOpen).toBe(false);
    });
  });
});
