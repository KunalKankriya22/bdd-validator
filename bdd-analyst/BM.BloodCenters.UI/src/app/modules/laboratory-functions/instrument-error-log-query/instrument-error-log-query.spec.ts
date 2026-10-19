import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { InstrumentErrorLogQuery } from './instrument-error-log-query';
import { InstrumentErrorLogQueryService } from './services/instrument-error-log-query.service';
import { InstrumentErrorLogRecord } from './models/instrument-error-log-query.model';
import { provideRouter } from '@angular/router';

describe('InstrumentErrorLogQuery', () => {
  let component: InstrumentErrorLogQuery;
  let fixture: ComponentFixture<InstrumentErrorLogQuery>;
  let service: jasmine.SpyObj<InstrumentErrorLogQueryService>;

  const mockErrorLogs: InstrumentErrorLogRecord[] = [
    {
      moduleName: 'TESTMOD',
      insertDats: '13-JUN-2026 10:30:00',
      userId: 'USER01',
      statementId: 'STMT001',
      errorKey: 'ERR-001',
      errorDesc: 'Test error description',
      expandKey: '0',
    },
    {
      moduleName: 'PRODMOD',
      insertDats: '12-JUN-2026 14:15:00',
      userId: 'USER02',
      statementId: 'STMT002',
      errorKey: 'ERR-002',
      errorDesc: 'Another error description',
      expandKey: '1',
    },
  ];

  beforeEach(() => {

    service = jasmine.createSpyObj('InstrumentErrorLogQueryService', [
      'queryErrorLogs',
    ]);



      TestBed.configureTestingModule({
      imports: [InstrumentErrorLogQuery,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: InstrumentErrorLogQueryService, useValue: service },
      ],
    });


    


      service.queryErrorLogs.calls.reset();


    fixture = TestBed.createComponent(InstrumentErrorLogQuery);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ==================== Component Initialization ====================

  describe('Component Initialization', () => {


    it('should initialize search form with required fields', () => {
      expect(component.searchForm.get('startDate')).toBeDefined();
      expect(component.searchForm.get('endDate')).toBeDefined();
      expect(component.searchForm.get('moduleName')).toBeDefined();
    });

    it('should initialize with required validators on date fields', () => {
      const startDate = component.searchForm.get('startDate');
      const endDate = component.searchForm.get('endDate');

      startDate?.setValue(null);
      endDate?.setValue(null);

      expect(startDate?.hasError('required')).toBeTrue();
      expect(endDate?.hasError('required')).toBeTrue();
    });

    it('should initialize with loading state as false', () => {
      expect(component.isLoading).toBeFalse();
    });



    it('should initialize with empty dataSource', () => {
      expect(component.dataSource.length).toBe(0);
    });

    it('should initialize with isRetrieved as false', () => {
      expect(component.isRetrieved).toBeFalse();
    });







    it('should initialize expanded rows as empty set', () => {
      expect(component.expandedRows().size).toBe(0);
    });
  });

  // ==================== Form Validation ====================

  describe('Form Validation', () => {






    it('should accept equal startDate and endDate', () => {
      const date = moment('2026-06-01');

      component.searchForm.patchValue({
        startDate: date.clone(),
        endDate: date.clone(),
      });

      expect(component.searchForm.valid).toBeTrue();
    });

    it('should not require moduleName', () => {
      component.searchForm.patchValue({
        startDate: moment('2026-06-01'),
        endDate: moment('2026-06-13'),
        moduleName: '',
      });

      expect(component.searchForm.valid).toBeTrue();
    });
  });

  // ==================== Retrieve Disabled State ====================
  // ==================== Clear All Disabled State ====================
  // ==================== Query Functionality ====================

  describe('Query Functionality', () => {
    beforeEach(() => {
      component.searchForm.patchValue({
        startDate: moment('2026-06-01'),
        endDate: moment('2026-06-13'),
      });
      component.isRetrieved = false;
    });







    it('should set hasSearched to true after query', fakeAsync(() => {
      service.queryErrorLogs.and.returnValue(of({ data: mockErrorLogs, total: 2 }));

      component.onRetrieve();
      tick();

      expect(component.hasSearched).toBeTrue();
    }));

    it('should set isRetrieved to true after query', fakeAsync(() => {
      service.queryErrorLogs.and.returnValue(of({ data: mockErrorLogs, total: 2 }));

      component.onRetrieve();
      tick();

      expect(component.isRetrieved).toBeTrue();
    }));





    it('should reset pageIndex to 0 on new retrieve', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 3;

      service.queryErrorLogs.and.returnValue(of({ data: mockErrorLogs, total: 2 }));

      component.onRetrieve();
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    }));





    it('should uppercase moduleName before sending to service', fakeAsync(() => {
      component.searchForm.get('moduleName')?.setValue('testmod');
      service.queryErrorLogs.and.returnValue(of({ data: [], total: 0 }));

      component.onRetrieve();
      tick();

      const callArgs = service.queryErrorLogs.calls.mostRecent().args;
      expect(callArgs[2].moduleName).toBe('TESTMOD');
    }));

    it('should clear expanded rows on new query', fakeAsync(() => {
      component.expandedRows.set(new Set(['0', '1']));
      service.queryErrorLogs.and.returnValue(of({ data: mockErrorLogs, total: 2 }));

      component.onRetrieve();
      tick();

      expect(component.expandedRows().size).toBe(0);
    }));
  });

  // ==================== Pagination ====================

  describe('Pagination', () => {
    beforeEach(() => {
      component.searchForm.patchValue({
        startDate: moment('2026-06-01'),
        endDate: moment('2026-06-13'),
      });
      component.isRetrieved = false;
      service.queryErrorLogs.and.returnValue(of({ data: mockErrorLogs, total: 100 }));
    });



    it('should trigger new query with updated skip/take', fakeAsync(() => {
      component.onRetrieve();
      tick();

      service.queryErrorLogs.calls.reset();

      component.onPageChange({ pageIndex: 1, pageSize: 50 });
      tick();

      expect(service.queryErrorLogs).toHaveBeenCalled();
      const callArgs = service.queryErrorLogs.calls.mostRecent().args;
      expect(callArgs[0]).toBe(50);
      expect(callArgs[1]).toBe(50);
    }));

    it('should calculate skip correctly for different pages', fakeAsync(() => {
      component.onRetrieve();
      tick();

      service.queryErrorLogs.calls.reset();

      component.onPageChange({ pageIndex: 3, pageSize: 25 });
      tick();

      const callArgs = service.queryErrorLogs.calls.mostRecent().args;
      expect(callArgs[0]).toBe(25);
      expect(callArgs[1]).toBe(75);
    }));
  });

  // ==================== Sorting ====================

  describe('Sorting', () => {
    beforeEach(() => {
      component.searchForm.patchValue({
        startDate: moment('2026-06-01'),
        endDate: moment('2026-06-13'),
      });
      component.isRetrieved = false;
      service.queryErrorLogs.and.returnValue(of({ data: mockErrorLogs, total: 2 }));
    });



    it('should map direction D to DESC for API', fakeAsync(() => {
      component.onRetrieve();
      tick();

      service.queryErrorLogs.calls.reset();

      component.onSortChange({ column: 'moduleName', direction: 'D' });
      tick();

      const callArgs = service.queryErrorLogs.calls.mostRecent().args;
      expect(callArgs[2].sortOrder).toBe('DESC');
    }));

    it('should map direction A to ASC for API', fakeAsync(() => {
      component.onRetrieve();
      tick();

      service.queryErrorLogs.calls.reset();

      component.onSortChange({ column: 'moduleName', direction: 'A' });
      tick();

      const callArgs = service.queryErrorLogs.calls.mostRecent().args;
      expect(callArgs[2].sortOrder).toBe('ASC');
    }));

    it('should map direction default to ASC for API', fakeAsync(() => {
      component.onRetrieve();
      tick();

      service.queryErrorLogs.calls.reset();

      component.onSortChange({ column: 'moduleName', direction: 'default' });
      tick();

      const callArgs = service.queryErrorLogs.calls.mostRecent().args;
      expect(callArgs[2].sortOrder).toBe('ASC');
    }));


  });

  // ==================== Row Expand ====================

  describe('Row Expand', () => {
    it('should toggle row expansion on', () => {
      const row: InstrumentErrorLogRecord = { ...mockErrorLogs[0], expandKey: '0' };

      component.onRowExpandToggle(row);

      expect(component.expandedRows().has('0')).toBeTrue();
    });

    it('should toggle row expansion off', () => {
      component.expandedRows.set(new Set(['0']));

      const row: InstrumentErrorLogRecord = { ...mockErrorLogs[0], expandKey: '0' };

      component.onRowExpandToggle(row);

      expect(component.expandedRows().has('0')).toBeFalse();
    });

    it('should allow multiple rows to be expanded', () => {
      const row1: InstrumentErrorLogRecord = { ...mockErrorLogs[0], expandKey: '0' };
      const row2: InstrumentErrorLogRecord = { ...mockErrorLogs[1], expandKey: '1' };

      component.onRowExpandToggle(row1);
      component.onRowExpandToggle(row2);

      expect(component.expandedRows().size).toBe(2);
      expect(component.expandedRows().has('0')).toBeTrue();
      expect(component.expandedRows().has('1')).toBeTrue();
    });

    it('should expand all rows on onExpandAllToggle(true)', () => {
      component.dataSource = mockErrorLogs.map((r, i) => ({ ...r, expandKey: `${i}` }));

      component.onExpandAllToggle(true);

      expect(component.expandedRows().size).toBe(2);
      expect(component.expandedRows().has('0')).toBeTrue();
      expect(component.expandedRows().has('1')).toBeTrue();
    });

    it('should collapse all rows on onExpandAllToggle(false)', () => {
      component.expandedRows.set(new Set(['0', '1']));

      component.onExpandAllToggle(false);

      expect(component.expandedRows().size).toBe(0);
    });
  });

  // ==================== Clear All ====================

  describe('Clear All', () => {
    beforeEach(fakeAsync(() => {
      component.searchForm.patchValue({
        startDate: moment('2026-06-01'),
        endDate: moment('2026-06-13'),
        moduleName: 'TESTMOD',
      });
      component.isRetrieved = false;
      service.queryErrorLogs.and.returnValue(of({ data: mockErrorLogs, total: 2 }));
      component.onRetrieve();
      tick();
    }));

    it('should reset form values', () => {
      component.onClearAll();

      expect(component.searchForm.get('startDate')?.value).toBeNull();
      expect(component.searchForm.get('endDate')?.value).toBeNull();
      expect(component.searchForm.get('moduleName')?.value).toBeNull();
    });

    it('should reset hasSearched to false', () => {
      component.onClearAll();
      expect(component.hasSearched).toBeFalse();
    });

    it('should reset isRetrieved to false', () => {
      component.onClearAll();
      expect(component.isRetrieved).toBeFalse();
    });





    it('should clear expanded rows', () => {
      component.expandedRows.set(new Set(['0', '1']));
      component.onClearAll();
      expect(component.expandedRows().size).toBe(0);
    });
  });

  // ==================== Date Validation Listeners ====================

  describe('Date Validation Listeners', () => {
    it('should reset isRetrieved when startDate changes', fakeAsync(() => {
      component.isRetrieved = true;

      component.searchForm.get('startDate')?.setValue(moment('2026-06-01'));
      tick();

      expect(component.isRetrieved).toBeFalse();
    }));

    it('should reset isRetrieved when endDate changes', fakeAsync(() => {
      component.isRetrieved = true;

      component.searchForm.get('endDate')?.setValue(moment('2026-06-13'));
      tick();

      expect(component.isRetrieved).toBeFalse();
    }));

    it('should reset isRetrieved when moduleName changes', fakeAsync(() => {
      component.isRetrieved = true;

      component.searchForm.get('moduleName')?.setValue('NEWMOD');
      tick();

      expect(component.isRetrieved).toBeFalse();
    }));
  });

  // ==================== Module Name Input ====================
  // ==================== Date Input Handlers ====================

  describe('Date Input Handlers', () => {
    it('should handle start date input event', () => {
      const mockInput = { value: '01-JUN-2026' } as HTMLInputElement;
      const event = { target: mockInput } as unknown as Event;

      expect(() => component.onStartDateInput(event)).not.toThrow();
    });

    it('should handle end date input event', () => {
      const mockInput = { value: '13-JUN-2026' } as HTMLInputElement;
      const event = { target: mockInput } as unknown as Event;

      expect(() => component.onEndDateInput(event)).not.toThrow();
    });
  });

  // ==================== End Date Filter ====================

  describe('End Date Filter', () => {
    it('should allow null date', () => {
      expect(component.endDateFilter(null)).toBeTrue();
    });

    it('should allow date after start date', () => {
      component.searchForm.get('startDate')?.setValue(moment('2026-06-01'));
      const endDate = moment('2026-06-13');

      expect(component.endDateFilter(endDate)).toBeTrue();
    });

    it('should reject date before start date', () => {
      component.searchForm.get('startDate')?.setValue(moment('2026-06-10'));
      const endDate = moment('2026-06-05');

      expect(component.endDateFilter(endDate)).toBeFalse();
    });

    it('should allow any date when no start date is set', () => {
      component.searchForm.get('startDate')?.setValue(null);
      const endDate = moment('2026-01-01');

      expect(component.endDateFilter(endDate)).toBeTrue();
    });
  });

  // ==================== Column Value Formatters ====================

  describe('Column Value Formatters', () => {
    const dummyRow = mockErrorLogs[0];

    it('should format insertDats column with valid date', () => {
      const formatter = component.tableConfig.columns[1].valueFormatter!;
      const result = formatter('06-13-2026 10:30:00', dummyRow);

      expect(result).toBe('13-JUN-2026 10:30');
    });

    it('should return dash for empty insertDats', () => {
      const formatter = component.tableConfig.columns[1].valueFormatter!;

      expect(formatter('', dummyRow)).toBe('-');
    });

    it('should return original value for invalid insertDats', () => {
      const formatter = component.tableConfig.columns[1].valueFormatter!;

      expect(formatter('not-a-date', dummyRow)).toBe('not-a-date');
    });

    it('should return dash for empty errorKey', () => {
      const formatter = component.tableConfig.columns[4].valueFormatter!;

      expect(formatter('', dummyRow)).toBe('-');
    });

    it('should return value for non-empty errorKey', () => {
      const formatter = component.tableConfig.columns[4].valueFormatter!;

      expect(formatter('ERR-001', dummyRow)).toBe('ERR-001');
    });
  });

  // ==================== loadData Edge Cases ====================
  // ==================== Component Cleanup ====================
});
