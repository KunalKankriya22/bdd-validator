import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';

import { ReportSubmissionComponent } from './report-submission';
import { ReportSubmissionService } from './services/report-submission.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  ReportSubmissionDetail,
  ReportSubmissionParameter,
  ScheduleDialogResult,
  SubmitReportResponseDto,
  ReportNameOption,
} from './models/report-submission.model';

describe('ReportSubmissionComponent', () => {
  let component: ReportSubmissionComponent;
  let fixture: ComponentFixture<ReportSubmissionComponent>;
  let mockService: jasmine.SpyObj<ReportSubmissionService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockActivatedRoute: any;
  let mockHeaderService: Partial<HeaderService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockReportNames: ReportNameOption[] = [
    { reportName: 'SPONSOR_MGMT', title: 'Sponsor Management' },
    { reportName: 'DONOR_LIST', title: 'Donor List Report' },
  ];

  const mockReportDetail: ReportSubmissionDetail = {
    reportName: 'SPONSOR_MGMT',
    reportDescription: 'Sponsor Management',
    title: 'Sponsor Management Report',
    subTitle: 'List of all sponsors',
    printId: 'PRINT01',
    formsType: 'PDF',
    parameters: [
      {
        parmNo: 1,
        parmCode: 'START_DATE',
        parmPrompt: 'Start Date',
        codeType: 'DATE',
        isMultiSelect: false,
        listEntryFlag: 'N',
        options: [],
        defaultValue: '',
        value: null,
        totalLovCount: 0, // DATE fields don't have LOV
      },
      {
        parmNo: 2,
        parmCode: 'LOCATION',
        parmPrompt: 'Location',
        codeType: 'LIST',
        isMultiSelect: true,
        listEntryFlag: 'Y',
        options: [
          { code: 'LOC1', description: 'Location 1' },
          { code: 'LOC2', description: 'Location 2' },
        ],
        defaultValue: 'all',
        value: null,
        totalLovCount: 2, // Small LOV set - should use array format
      },
    ],
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ReportSubmissionService', [
      'getReportTypes',
      'getReportNames',
      'generateParmId',
      'getReportDetails',
      'getRecentParameterSets',
      'getParameterValues',
      'getParameterLovPaginated',
      'submitReport',
      'scheduleReport',
    ]);

    mockSnackBar = createMockMatSnackBar();

    // Create MatDialog mock with proper structure
    mockDialog = jasmine.createSpyObj('MatDialog', ['open', 'closeAll', 'getDialogById', 'ngOnDestroy']);
    // Set up internal properties MatDialog expects
    (mockDialog as any)._openDialogs = [];
    (mockDialog as any).afterOpened = new Subject();
    (mockDialog as any).afterAllClosed = new Subject();
    (mockDialog as any)._afterAllClosed = new Subject();
    mockDialog.open.and.returnValue({
      afterClosed: () => of(null),
      close: () => {},
    } as any);

    mockActivatedRoute = {
      snapshot: { params: {}, queryParams: {} },
      params: of({}),
      queryParams: of({}),
    };

    // Mock HeaderService for ChapterAwareDateAdapter
    mockHeaderService = {
      chapterTimeZone: signal('America/New_York'),
    };

    // Mock TranslateService for DataTable
    mockTranslateService = createMockTranslateService();
    // Default mock implementations
    mockService.getReportTypes.and.returnValue(of([
      { reportType: 'STANDARD' },
      { reportType: 'CUSTOM' },
    ]));
    mockService.getReportNames.and.returnValue(of(mockReportNames));
    mockService.generateParmId.and.returnValue(of('TEST_USER_052626_001'));
    mockService.getReportDetails.and.returnValue(of(mockReportDetail));
    mockService.getRecentParameterSets.and.returnValue(of([
      { parmId: 'TEST_USER_052626_001', submitDate: '2026-05-26 14:30:00' },
      { parmId: 'TEST_USER_052526_002', submitDate: '2026-05-25 10:15:00' },
    ]));
    mockService.getParameterValues.and.returnValue(of({
      parmId: 'TEST_USER_052626_001',
      reportName: 'SPONSOR_MGMT',
      submitDate: '2026-05-26 14:30:00',
      reportStatus: 'COMPLETED',
      printId: 'PRINT01',
      formsType: 'PDF',
      parameters: [
        { parmNo: 1, parmSelect: '05-26-2026', parmCode: 'START_DATE' },
        { parmNo: 2, parmSelect: 'LOC1', parmCode: 'LOCATION' },
        { parmNo: 2, parmSelect: 'LOC2', parmCode: 'LOCATION' },
      ],
    }));
    mockService.getParameterLovPaginated.and.returnValue(of({
      items: [
        { code: 'LOC1', description: 'Location 1' },
        { code: 'LOC2', description: 'Location 2' },
      ],
      totalCount: 2,
      hasMore: false,
      isPaginated: false,
    }));



      TestBed.configureTestingModule({
      imports: [
        ReportSubmissionComponent,
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ReportSubmissionService, useValue: mockService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
      ],
    })
    .overrideComponent(ReportSubmissionComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MatDialog, useValue: mockDialog },
        ]
      }
    });


    


      mockService.getReportTypes.calls.reset();


      mockService.getReportNames.calls.reset();


      mockService.generateParmId.calls.reset();


      mockService.getReportDetails.calls.reset();


      mockService.getRecentParameterSets.calls.reset();


      mockService.getParameterValues.calls.reset();


      mockService.getParameterLovPaginated.calls.reset();


      mockService.submitReport.calls.reset();


      mockService.scheduleReport.calls.reset();


      mockSnackBar.open.calls.reset();


      mockDialog.open.calls.reset();


      mockDialog.closeAll.calls.reset();


      mockDialog.getDialogById.calls.reset();


      mockDialog.ngOnDestroy.calls.reset();


      mockTranslateService.instant.calls.reset();


      mockTranslateService.get.calls.reset();


      mockService.getReportNames.and.returnValue(of(mockReportNames));


      mockService.generateParmId.and.returnValue(of('TEST_USER_052626_001'));


      mockService.getReportDetails.and.returnValue(of(mockReportDetail));


    fixture = TestBed.createComponent(ReportSubmissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('ngOnInit', () => {
    it('should load report types on init', () => {
      expect(mockService.getReportTypes).toHaveBeenCalled();
      expect(component.reportTypes().length).toBe(2);
      expect(component.reportTypes()[0].code).toBe('STANDARD');
    });




  });

  describe('onReportNameChange', () => {
    it('should set selected report name', () => {
      component.onReportNameChange('SPONSOR_MGMT');
      expect(component.selectedReportName()).toBe('SPONSOR_MGMT');
    });

    it('should generate PARM_ID when report is selected', () => {
      component.onReportNameChange('SPONSOR_MGMT');
      expect(mockService.generateParmId).toHaveBeenCalled();
      expect(component.generatedReportId()).toBe('TEST_USER_052626_001');
    });

    it('should clear PARM_ID when report is deselected', () => {
      component.onReportNameChange('');
      expect(component.generatedReportId()).toBe('');
    });

    it('should show error when PARM_ID generation fails', fakeAsync(() => {
      mockService.generateParmId.and.returnValue(
        throwError(() => new Error('Failed to generate PARM_ID'))
      );

      component.onReportNameChange('SPONSOR_MGMT');
      tick(); // Process microtask queue
      fixture.detectChanges();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to generate Report ID',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should load recent PARM IDs when report is selected', fakeAsync(() => {
      component.onReportNameChange('SPONSOR_MGMT');
      tick();
      expect(mockService.getRecentParameterSets).toHaveBeenCalledWith('SPONSOR_MGMT');
      expect(component.recentParmIds().length).toBe(2);
      expect(component.recentParmIds()[0].parmId).toBe('TEST_USER_052626_001');
    }));

    it('should clear recent PARM IDs when report is deselected', fakeAsync(() => {
      // First select a report
      component.onReportNameChange('SPONSOR_MGMT');
      tick();
      expect(component.recentParmIds().length).toBe(2);

      // Then deselect
      component.onReportNameChange('');
      tick();
      expect(component.recentParmIds().length).toBe(0);
      expect(component.selectedRecentParmId()).toBe('');
    }));




  });

  describe('Recent PARM IDs', () => {
    beforeEach(fakeAsync(() => {
      component.onReportNameChange('SPONSOR_MGMT');
      tick();
    }));



    it('should filter recent PARM IDs case-insensitively', fakeAsync(() => {
      component.recentParmIdSearchControl.setValue('test_user');
      tick(200); // Wait for debounce
      expect(component.filteredRecentParmIds().length).toBe(2);
    }));


  });

  describe('onRecentParmIdChange', () => {
    beforeEach(fakeAsync(() => {
      component.onReportNameChange('SPONSOR_MGMT');
      tick();
    }));

    it('should update selected recent PARM ID', () => {
      component.onRecentParmIdChange('TEST_USER_052626_001');
      expect(component.selectedRecentParmId()).toBe('TEST_USER_052626_001');
    });

    it('should NOT change the generated report ID when recent PARM ID is selected', () => {
      const originalGeneratedId = component.generatedReportId();
      component.onRecentParmIdChange('TEST_USER_052526_002');

      // Generated report ID should remain unchanged
      expect(component.generatedReportId()).toBe(originalGeneratedId);
      expect(component.generatedReportId()).not.toBe('TEST_USER_052526_002');
    });



    it('should keep generated report ID unchanged when deselecting recent PARM ID', () => {
      const originalGeneratedId = component.generatedReportId();

      component.onRecentParmIdChange('TEST_USER_052626_001');
      component.onRecentParmIdChange('');

      // Generated report ID should still be the original one
      expect(component.generatedReportId()).toBe(originalGeneratedId);
    });
  });

  describe('onRetrieve', () => {


    it('should retrieve report details when report name is selected', () => {
      component.selectedReportName.set('SPONSOR_MGMT');
      component.onRetrieve();
      expect(mockService.getReportDetails).toHaveBeenCalledWith('SPONSOR_MGMT');
      expect(component.reportDetail()).toEqual(mockReportDetail);
      expect(component.isRetrieved()).toBe(true);
    });

    it('should update breadcrumbs with report name', () => {
      component.selectedReportName.set('SPONSOR_MGMT');
      component.onRetrieve();
      expect(component.headerConfig.breadcrumbs[1].label).toBe('SPONSOR_MGMT');
    });

    it('should show error when retrieval fails', fakeAsync(() => {
      mockService.getReportDetails.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );
      component.selectedReportName.set('SPONSOR_MGMT');
      component.onRetrieve();
      tick(); // Process microtask queue
      fixture.detectChanges();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to load report details',
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.isLoading()).toBe(false);
    }));

    it('should load saved parameter values when recent PARM ID is selected', fakeAsync(() => {
      // Setup: select a report and set reportDetail manually (avoid datepicker initialization)
      component.selectedReportName.set('SPONSOR_MGMT');
      component.reportDetail.set(mockReportDetail);

      // Select a recent PARM ID
      component.onRecentParmIdChange('TEST_USER_052626_001');
      tick();

      // Verify getParameterValues was called
      expect(mockService.getParameterValues).toHaveBeenCalledWith('SPONSOR_MGMT', 'TEST_USER_052626_001');

      // Verify parameter values were populated
      const detail = component.reportDetail();
      expect(detail).toBeTruthy();
      if (detail) {
        // DATE parameter should be converted to Date object
        expect(detail.parameters[0].value).toBeInstanceOf(Date);
        // Multi-select value should be an array
        expect(detail.parameters[1].value).toEqual(['LOC1', 'LOC2']);
      }
    }));



    it('should handle error when loading saved parameter values fails', fakeAsync(() => {
      mockService.getParameterValues.and.returnValue(
        throwError(() => new Error('Failed to load parameter values'))
      );

      component.selectedReportName.set('SPONSOR_MGMT');
      component.onRecentParmIdChange('TEST_USER_052626_001');
      component.onRetrieve();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to load saved parameter values',
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });
  describe('getInputType', () => {
    it('should return "select" for LIST type', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'LIST',
        isMultiSelect: false,
        totalLovCount: 50, // Normal LOV count (1-1000 range)
      };
      expect(component.getInputType(param)).toBe('select');
    });

    it('should return "multiselect" for LIST type with multi-select flag', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'LIST',
        isMultiSelect: true,
        totalLovCount: 100, // Normal LOV count (1-1000 range)
      };
      expect(component.getInputType(param)).toBe('multiselect');
    });

    it('should return "date" for DATE type', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'DATE',
      };
      expect(component.getInputType(param)).toBe('date');
    });

    it('should return "datetime" for DATETM type', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'DATETM',
      };
      expect(component.getInputType(param)).toBe('datetime');
    });

    it('should return "odate" for ODATE type', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'ODATE',
      };
      expect(component.getInputType(param)).toBe('odate');
    });

    it('should return "select" for CHAR with refTable', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'CHAR',
        refTable: 'LOCATIONS',
        listEntryFlag: 'N',
        totalLovCount: 75, // Normal LOV count (1-1000 range)
      };
      expect(component.getInputType(param)).toBe('select');
    });

    it('should return "multiselect" for CHAR with refTable and listEntryFlag=Y', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'CHAR',
        refTable: 'LOCATIONS',
        listEntryFlag: 'Y',
        totalLovCount: 150, // Normal LOV count (1-1000 range)
      };
      expect(component.getInputType(param)).toBe('multiselect');
    });

    it('should return "text" for CHAR without refTable', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'CHAR',
        refTable: null,
      };
      expect(component.getInputType(param)).toBe('text');
    });

    it('should return "text" for TEXT type', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'TEXT',
      };
      expect(component.getInputType(param)).toBe('text');
    });

    it('should return "searchable-text" for LIST type with LOV count > 1000', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'LIST',
        isMultiSelect: false,
        totalLovCount: 1500,
      };
      expect(component.getInputType(param)).toBe('searchable-text');
    });

    it('should return "searchable-multiselect" for LIST type with multi-select and LOV count > 1000', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'LIST',
        isMultiSelect: true,
        totalLovCount: 2000,
      };
      expect(component.getInputType(param)).toBe('searchable-multiselect');
    });

    it('should return "searchable-text" for CHAR with refTable and LOV count > 1000', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'CHAR',
        refTable: 'LOCATIONS',
        listEntryFlag: 'N',
        totalLovCount: 1200,
      };
      expect(component.getInputType(param)).toBe('searchable-text');
    });

    it('should return "searchable-multiselect" for CHAR with refTable and listEntryFlag=Y and LOV count > 1000', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'CHAR',
        refTable: 'LOCATIONS',
        listEntryFlag: 'Y',
        totalLovCount: 3000,
      };
      expect(component.getInputType(param)).toBe('searchable-multiselect');
    });

    it('should return "select" for LIST type with LOV count exactly 1000', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'LIST',
        isMultiSelect: false,
        totalLovCount: 1000,
      };
      expect(component.getInputType(param)).toBe('select');
    });

    it('should return "searchable-text" for LIST type with LOV count = 0 (no options)', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'LIST',
        isMultiSelect: false,
        totalLovCount: 0,
      };
      expect(component.getInputType(param)).toBe('searchable-text');
    });

    it('should return "searchable-multiselect" for LIST type with LOV count = 0 and multiselect', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        codeType: 'LIST',
        isMultiSelect: true,
        totalLovCount: 0,
      };
      expect(component.getInputType(param)).toBe('searchable-multiselect');
    });

    it('should return "searchable-text" for CHAR type with ref lookup and LOV count = 0', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'CHAR',
        refTable: 'LOCATIONS',
        totalLovCount: 0,
        listEntryFlag: 'N',
      };
      expect(component.getInputType(param)).toBe('searchable-text');
    });
  });

  describe('validateDate', () => {
    it('should auto-format MMDDYY to date object', () => {
      const param: ReportSubmissionParameter = { ...mockReportDetail.parameters[0] };
      param.value = '052326';
      component.validateDate(param);
      expect(param.value).toBeInstanceOf(Date);
    });

    it('should auto-format MMDDYYYY to date object', () => {
      const param: ReportSubmissionParameter = { ...mockReportDetail.parameters[0] };
      param.value = '05232026';
      component.validateDate(param);
      expect(param.value).toBeInstanceOf(Date);
    });

    it('should show error for invalid date format', fakeAsync(() => {
      const param: ReportSubmissionParameter = { ...mockReportDetail.parameters[0] };
      param.value = 'invalid';
      component.validateDate(param);
      tick(); // Process microtask queue
      fixture.detectChanges();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Invalid date format'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  describe('validateODate', () => {
    it('should auto-format DDMONYYYY to date object', () => {
      const param: ReportSubmissionParameter = { ...mockReportDetail.parameters[0] };
      param.value = '23MAY2026';
      component.validateODate(param);
      expect(param.value).toBeInstanceOf(Date);
    });

    it('should show error for invalid ODATE format', fakeAsync(() => {
      const param: ReportSubmissionParameter = { ...mockReportDetail.parameters[0] };
      param.value = 'invalid';
      component.validateODate(param);
      tick(); // Process microtask queue
      fixture.detectChanges();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Invalid date format'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  describe('chip management', () => {
    describe('getSelectedChipDetails', () => {
      it('should return empty array if value is not an array', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[0],
          value: 'single-value',
        };
        expect(component.getSelectedChipDetails(param)).toEqual([]);
      });

      it('should return chip details with descriptions from options', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: ['LOC1', 'LOC2'],
        };
        const chips = component.getSelectedChipDetails(param);
        expect(chips.length).toBe(2);
        expect(chips[0]).toEqual({ code: 'LOC1', description: 'Location 1' });
        expect(chips[1]).toEqual({ code: 'LOC2', description: 'Location 2' });
      });

      it('should use code as description when option not found', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: ['LOC1', 'LOC999'], // LOC999 not in options
        };
        const chips = component.getSelectedChipDetails(param);
        expect(chips[1]).toEqual({ code: 'LOC999', description: 'LOC999' });
      });

      it('should return empty array for null value', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: null,
        };
        expect(component.getSelectedChipDetails(param)).toEqual([]);
      });

      it('should return empty array for empty array value', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: [],
        };
        expect(component.getSelectedChipDetails(param)).toEqual([]);
      });
    });

    describe('getVisibleChips', () => {


      it('should return all chips when maxVisible is greater than total', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: ['LOC1', 'LOC2'],
        };
        const visible = component.getVisibleChips(param, 5);
        expect(visible.length).toBe(2);
      });

      it('should return empty array when no chips available', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: [],
        };
        expect(component.getVisibleChips(param, 1)).toEqual([]);
      });
    });

    describe('getRemainingChipsCount', () => {
      it('should return correct remaining count', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: ['LOC1', 'LOC2'],
        };
        const count = component.getRemainingChipsCount(param, 1);
        expect(count).toBe(1);
      });

      it('should return 0 when all chips are visible', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: ['LOC1', 'LOC2'],
        };
        expect(component.getRemainingChipsCount(param, 2)).toBe(0);
      });

      it('should return 0 when maxVisible exceeds total chips', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: ['LOC1'],
        };
        expect(component.getRemainingChipsCount(param, 5)).toBe(0);
      });
    });

    describe('hasMoreChips', () => {
      it('should return true when more chips exist', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: ['LOC1', 'LOC2'],
        };
        expect(component.hasMoreChips(param, 1)).toBe(true);
      });

      it('should return false when no more chips exist', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: ['LOC1'],
        };
        expect(component.hasMoreChips(param, 1)).toBe(false);
      });

      it('should return false for empty value', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: [],
        };
        expect(component.hasMoreChips(param, 1)).toBe(false);
      });
    });

    describe('getHiddenChipsTooltip', () => {
      it('should generate tooltip with newline-separated descriptions', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: ['LOC1', 'LOC2'],
        };
        const tooltip = component.getHiddenChipsTooltip(param, 1);
        expect(tooltip).toBe('Location 2');
      });



      it('should handle multiple hidden chips', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          options: [
            { code: 'LOC1', description: 'Location 1' },
            { code: 'LOC2', description: 'Location 2' },
            { code: 'LOC3', description: 'Location 3' },
          ],
          value: ['LOC1', 'LOC2', 'LOC3'],
        };
        const tooltip = component.getHiddenChipsTooltip(param, 1);
        expect(tooltip).toBe('Location 2\nLocation 3');
      });
    });

    describe('removeChip', () => {


      it('should do nothing if value is not an array', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[0],
          value: 'single-value',
        };
        const event = new MouseEvent('click');
        component.removeChip(param, 'LOC1', event);
        expect(param.value).toBe('single-value');
      });

      it('should handle removing non-existent chip gracefully', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          value: ['LOC1', 'LOC2'],
        };
        const event = new MouseEvent('click');
        component.removeChip(param, 'LOC999', event);
        expect(param.value).toEqual(['LOC1', 'LOC2']);
      });
    });

    describe('shouldShowChips', () => {
      it('should return true for multiselect with refTable and large LOV', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          refTable: 'LOCATIONS',
          listEntryFlag: 'Y',
          totalLovCount: 1500,
        };
        expect(component.shouldShowChips(param)).toBe(true);
      });

      it('should return true for multiselect with refTable and LOV count = 0', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          refTable: 'LOCATIONS',
          listEntryFlag: 'Y',
          totalLovCount: 0,
        };
        expect(component.shouldShowChips(param)).toBe(true);
      });

      it('should return false for multiselect with normal LOV count', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          refTable: 'LOCATIONS',
          listEntryFlag: 'Y',
          totalLovCount: 500,
        };
        expect(component.shouldShowChips(param)).toBe(false);
      });

      it('should return false for single-select with large LOV', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[0],
          refTable: 'LOCATIONS',
          listEntryFlag: 'N',
          totalLovCount: 1500,
        };
        expect(component.shouldShowChips(param)).toBe(false);
      });

      it('should return false for multiselect without refTable', () => {
        const param: ReportSubmissionParameter = {
          ...mockReportDetail.parameters[1],
          refTable: null,
          listEntryFlag: 'Y',
          totalLovCount: 1500,
        };
        expect(component.shouldShowChips(param)).toBe(false);
      });
    });
  });

  describe('onSubmitNow', () => {
    beforeEach(() => {
      component.reportDetail.set(mockReportDetail);
      component.generatedReportId.set('TEST_USER_052626_001');
      mockService.submitReport.and.returnValue(
        of({
          jobId: 'JOB123',
          parmId: 'TEST_USER_052626_001',
          reportName: 'SPONSOR_MGMT',
          status: 'SUBMITTED',
          message: 'Success',
        } as SubmitReportResponseDto)
      );
      // Mock dialog to return confirmed (true)
      mockDialog.open.and.returnValue({
        afterClosed: () => of(true),
        close: () => {},
      } as any);
    });



    it('should submit report with formatted parameters', fakeAsync(() => {
      component.onSubmitNow();
      tick();
      expect(mockService.submitReport).toHaveBeenCalledWith(
        jasmine.objectContaining({
          reportName: 'SPONSOR_MGMT',
          parmId: 'TEST_USER_052626_001',
        })
      );
    }));

    it('should send "ALL" keyword when all multiselect options are selected', fakeAsync(() => {
      const detail = { ...mockReportDetail };
      detail.parameters[1].value = ['LOC1', 'LOC2']; // All options selected
      component.reportDetail.set(detail);
      component['initializeParameterSearchControls'](detail.parameters);

      component.onSubmitNow();
      tick();

      expect(mockService.submitReport).toHaveBeenCalledWith(
        jasmine.objectContaining({
          parameters: jasmine.arrayContaining([
            jasmine.objectContaining({
              parmNo: 2,
              parmSelect: 'ALL', // Should send "ALL" instead of "LOC1,LOC2"
            }),
          ]),
        })
      );
    }));

    it('should send comma-separated values when partial multiselect selection', fakeAsync(() => {
      const detail = { ...mockReportDetail };
      detail.parameters[1].value = ['LOC1']; // Partial selection
      component.reportDetail.set(detail);
      component['initializeParameterSearchControls'](detail.parameters);

      component.onSubmitNow();
      tick();

      expect(mockService.submitReport).toHaveBeenCalledWith(
        jasmine.objectContaining({
          parameters: jasmine.arrayContaining([
            jasmine.objectContaining({
              parmNo: 2,
              parmSelect: 'LOC1', // Should send individual code
            }),
          ]),
        })
      );
    }));

    it('should show success message after submission', fakeAsync(() => {
      component.onSubmitNow();
      tick(); // Process microtask queue
      fixture.detectChanges();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('submitted successfully'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should reset to empty state after successful submission', fakeAsync(() => {
      // Setup initial state with some values
      component.selectedReportName.set('SPONSOR_MGMT');
      component.selectedReportType.set('STANDARD');
      component.showRecentParmIds = true;
      component.selectedRecentParmId.set('TEST_USER_052526_002');
      component.recentParmIds.set([
        { parmId: 'TEST_USER_052626_001', submitDate: '2026-05-26 14:30:00' },
      ]);

      component.onSubmitNow();
      tick();
      fixture.detectChanges();

      // Verify all state is reset
      expect(component.isRetrieved()).toBe(false);
      expect(component.reportDetail()).toBeNull();
      expect(component.selectedReportName()).toBe('');
      expect(component.selectedReportType()).toBe('');
      expect(component.generatedReportId()).toBe('');
      expect(component.showRecentParmIds).toBe(false);
      expect(component.selectedRecentParmId()).toBe('');
      expect(component.recentParmIds().length).toBe(0);
      expect(component.filteredRecentParmIds().length).toBe(0);
    }));

    it('should show error when submission fails', fakeAsync(() => {
      // Mock dialog to confirm submission
      mockDialog.open.and.returnValue({
        afterClosed: () => of(true),
        close: () => {},
      } as any);
      mockService.submitReport.and.returnValue(
        throwError(() => ({ error: { message: 'Submission failed' } }))
      );
      component.onSubmitNow();
      tick(); // Process microtask queue
      fixture.detectChanges();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Submission failed',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should convert comma-separated string to array for searchable-multiselect (LOV > 1000)', fakeAsync(() => {
      const detail = { ...mockReportDetail };
      detail.parameters[1].totalLovCount = 1500; // Large LOV set
      detail.parameters[1].value = 'LOC1, LOC2, LOC3'; // String input from searchable-multiselect
      component.reportDetail.set(detail);

      component.onSubmitNow();
      tick();

      expect(mockService.submitReport).toHaveBeenCalledWith(
        jasmine.objectContaining({
          parameters: jasmine.arrayContaining([
            jasmine.objectContaining({
              parmNo: 2,
              parmSelect: 'LOC1,LOC2,LOC3', // Should be comma-separated after normalization
            }),
          ]),
        })
      );
    }));

    it('should handle "ALL" keyword for searchable-multiselect (LOV > 1000)', fakeAsync(() => {
      const detail = { ...mockReportDetail };
      detail.parameters[1].totalLovCount = 2000; // Large LOV set
      detail.parameters[1].value = 'ALL'; // User typed "ALL"
      component.reportDetail.set(detail);

      component.onSubmitNow();
      tick();

      expect(mockService.submitReport).toHaveBeenCalledWith(
        jasmine.objectContaining({
          parameters: jasmine.arrayContaining([
            jasmine.objectContaining({
              parmNo: 2,
              parmSelect: 'ALL', // Should preserve "ALL" keyword
            }),
          ]),
        })
      );
    }));

    it('should trim whitespace for searchable-text (LOV > 1000)', fakeAsync(() => {
      const detail = { ...mockReportDetail };
      detail.parameters[0].codeType = 'CHAR';
      detail.parameters[0].refTable = 'LOCATIONS';
      detail.parameters[0].totalLovCount = 1200; // Large LOV set
      detail.parameters[0].value = '  LOC123  '; // String input with whitespace
      component.reportDetail.set(detail);

      component.onSubmitNow();
      tick();

      expect(mockService.submitReport).toHaveBeenCalledWith(
        jasmine.objectContaining({
          parameters: jasmine.arrayContaining([
            jasmine.objectContaining({
              parmNo: 1,
              parmSelect: 'LOC123', // Should be trimmed
            }),
          ]),
        })
      );
    }));
  });

  describe('onScheduleSubmit', () => {
    beforeEach(() => {
      component.reportDetail.set(mockReportDetail);
      component.generatedReportId.set('TEST_USER_052626_001');
    });





    it('should schedule report when dialog returns result', fakeAsync(() => {
      const scheduleResult: ScheduleDialogResult = {
        scheduledTime: '2026-05-27T10:00:00',
      };
      const dialogRefMock = {
        afterClosed: () => of(scheduleResult),
      };
      mockDialog.open.and.returnValue(dialogRefMock as any);
      mockService.scheduleReport.and.returnValue(
        of({
          jobId: 'JOB456',
          parmId: 'TEST_USER_052626_001',
          reportName: 'SPONSOR_MGMT',
          status: 'SCHEDULED',
          message: 'Success',
        } as SubmitReportResponseDto)
      );

      component.onScheduleSubmit();
      tick(); // Process microtask queue
      fixture.detectChanges();

      expect(mockService.scheduleReport).toHaveBeenCalledWith(
        jasmine.objectContaining({
          reportName: 'SPONSOR_MGMT',
          startTime: '2026-05-27T10:00:00',
        })
      );
    }));

    it('should send "ALL" keyword when scheduling with all multiselect options selected', fakeAsync(() => {
      const detail = { ...mockReportDetail };
      detail.parameters[1].value = ['LOC1', 'LOC2']; // All options selected
      component.reportDetail.set(detail);
      component['initializeParameterSearchControls'](detail.parameters);

      const scheduleResult: ScheduleDialogResult = {
        scheduledTime: '2026-05-27T10:00:00',
      };
      const dialogRefMock = {
        afterClosed: () => of(scheduleResult),
      };
      mockDialog.open.and.returnValue(dialogRefMock as any);
      mockService.scheduleReport.and.returnValue(
        of({
          jobId: 'JOB456',
          parmId: 'TEST_USER_052626_001',
          reportName: 'SPONSOR_MGMT',
          status: 'SCHEDULED',
          message: 'Success',
        } as SubmitReportResponseDto)
      );

      component.onScheduleSubmit();
      tick(); // Process microtask queue
      fixture.detectChanges();

      expect(mockService.scheduleReport).toHaveBeenCalledWith(
        jasmine.objectContaining({
          parameters: jasmine.arrayContaining([
            jasmine.objectContaining({
              parmNo: 2,
              parmSelect: 'ALL', // Should send "ALL" for scheduled reports too
            }),
          ]),
        })
      );
    }));
  });

  describe('parameter search controls', () => {
    beforeEach(() => {
      component.reportDetail.set(mockReportDetail);
      component['initializeParameterSearchControls'](mockReportDetail.parameters);
    });

    it('should initialize search controls for each parameter', () => {
      expect(component.parameterSearchControls.size).toBe(2);
    });

    it('should initialize filtered options for each parameter', () => {
      expect(component.filteredParameterOptions.size).toBe(2);
    });

    it('should get filtered options for a parameter', () => {
      const param = mockReportDetail.parameters[1];
      const options = component.getFilteredOptions(param);
      expect(options.length).toBe(2);
    });


  });

  describe('select all functionality', () => {
    let param: ReportSubmissionParameter;

    beforeEach(() => {
      param = {
        ...mockReportDetail.parameters[1],
        value: [],
      };
      component.reportDetail.set(mockReportDetail);
      component['initializeParameterSearchControls'](mockReportDetail.parameters);
    });

    it('should check if all options are selected', () => {
      param.value = ['LOC1', 'LOC2'];
      expect(component.isAllSelected(param)).toBe(true);
    });

    it('should return false if no options selected', () => {
      param.value = [];
      expect(component.isAllSelected(param)).toBe(false);
    });


    it('should toggle select all - select all when none selected', () => {
      param.value = [];
      component.toggleSelectAll(param);
      expect(param.value).toEqual(['LOC1', 'LOC2']);
    });

    it('should toggle select all - deselect all when all selected', () => {
      param.value = ['LOC1', 'LOC2'];
      component.toggleSelectAll(param);
      expect(param.value).toEqual([]);
    });



  });

  describe('state management', () => {


    it('should disable retrieve when no report name selected', () => {
      expect(component.selectedReportName()).toBe('');
    });


  });

  describe('Recent Parameter Sets - onRecentParmIdChange', () => {
    beforeEach(() => {
      component.selectedReportName.set('SPONSOR_MGMT');
      component.reportDetail.set(mockReportDetail);
    });

    it('should load saved parameter values when recent parm ID is selected', fakeAsync(() => {
      component.onRecentParmIdChange('TEST_USER_052626_001');
      tick();

      expect(mockService.getParameterValues).toHaveBeenCalledWith('SPONSOR_MGMT', 'TEST_USER_052626_001');
    }));






  });

  describe('Recent Parameter Sets - populateParameterValues', () => {
    beforeEach(() => {
      component.selectedReportName.set('SPONSOR_MGMT');
      component.reportDetail.set(mockReportDetail);
    });


    it('should populate multiselect parameter with array of values', fakeAsync(() => {
      // Ensure reportDetail has totalLovCount explicitly set
      const detailWithSmallLov = {
        ...mockReportDetail,
        parameters: [
          mockReportDetail.parameters[0],
          {
            ...mockReportDetail.parameters[1],
            totalLovCount: 2, // Explicitly set small LOV count
          },
        ],
      };
      component.reportDetail.set(detailWithSmallLov);

      mockService.getParameterValues.and.returnValue(of({
        parmId: 'TEST_USER_052626_001',
        reportName: 'SPONSOR_MGMT',
        submitDate: '2026-05-26 14:30:00',
        reportStatus: 'COMPLETED',
        parameters: [
          { parmNo: 2, parmSelect: 'LOC1', parmCode: 'LOCATION' },
          { parmNo: 2, parmSelect: 'LOC2', parmCode: 'LOCATION' },
        ],
      }));

      component.onRecentParmIdChange('TEST_USER_052626_001');
      tick();

      const param = component.reportDetail()?.parameters[1];
      expect(Array.isArray(param?.value)).toBe(true);
      expect(param?.value).toEqual(['LOC1', 'LOC2']);
    }));

    it('should handle multiple multiselect values from API (200+ entries)', fakeAsync(() => {
      // First, update the report detail to have a parameter with totalLovCount: 200
      const detailWithLargeParam = {
        ...mockReportDetail,
        parameters: [
          mockReportDetail.parameters[0],
          {
            ...mockReportDetail.parameters[1],
            totalLovCount: 200, // Set to 200 to match the number of saved values
          },
        ],
      };
      component.reportDetail.set(detailWithLargeParam);

      const locationParams = Array.from({ length: 200 }, (_, i) => ({
        parmNo: 2,
        parmSelect: `LOC${String(i + 1).padStart(4, '0')}`,
        parmCode: 'LOCATION',
      }));

      mockService.getParameterValues.and.returnValue(of({
        parmId: 'TEST_USER_052626_001',
        reportName: 'SPONSOR_MGMT',
        submitDate: '2026-05-26 14:30:00',
        reportStatus: 'COMPLETED',
        parameters: locationParams,
      }));

      component.onRecentParmIdChange('TEST_USER_052626_001');
      tick();

      const param = component.reportDetail()?.parameters[1];
      expect(Array.isArray(param?.value)).toBe(true);
      expect((param?.value as string[]).length).toBe(200);
      expect((param?.value as string[])[0]).toBe('LOC0001');
      expect((param?.value as string[])[199]).toBe('LOC0200');
    }));

    it('should add placeholder options for lazy-loaded multiselect values', fakeAsync(() => {
      const detailWithLazyLoading = {
        ...mockReportDetail,
        parameters: [
          ...mockReportDetail.parameters.slice(0, 1),
          {
            parmNo: 2,
            parmCode: 'LOCATION',
            parmPrompt: 'Location',
            codeType: 'LIST' as const,
            isMultiSelect: true,
            listEntryFlag: 'Y',
            options: [{ code: 'LOC1', description: 'Location 1' }], // Only 1 pre-loaded
            defaultValue: 'all',
            value: null,
            totalLovCount: 200, // Indicates lazy loading
          },
        ],
      };

      component.reportDetail.set(detailWithLazyLoading);

      mockService.getParameterValues.and.returnValue(of({
        parmId: 'TEST_USER_052626_001',
        reportName: 'SPONSOR_MGMT',
        submitDate: '2026-05-26 14:30:00',
        reportStatus: 'COMPLETED',
        parameters: [
          { parmNo: 2, parmSelect: 'LOC1', parmCode: 'LOCATION' },
          { parmNo: 2, parmSelect: 'LOC999', parmCode: 'LOCATION' }, // Not in options
        ],
      }));

      component.onRecentParmIdChange('TEST_USER_052626_001');
      tick();

      const param = component.reportDetail()?.parameters[1];
      expect(param?.options.length).toBe(2); // Original 1 + placeholder for LOC999
      expect(param?.options.find(opt => opt.code === 'LOC999')).toEqual({
        code: 'LOC999',
        description: 'LOC999',
      });
    }));

    it('should convert ODATE format correctly', fakeAsync(() => {
      const detailWithODate = {
        ...mockReportDetail,
        parameters: [
          {
            parmNo: 1,
            parmCode: 'END_DATE',
            parmPrompt: 'End Date',
            codeType: 'ODATE' as const,
            isMultiSelect: false,
            listEntryFlag: 'N',
            options: [],
            defaultValue: '',
            value: null,
            totalLovCount: 0, // DATE fields don't have LOV
          },
        ],
      };

      component.reportDetail.set(detailWithODate);

      mockService.getParameterValues.and.returnValue(of({
        parmId: 'TEST_USER_052626_001',
        reportName: 'SPONSOR_MGMT',
        submitDate: '2026-05-26 14:30:00',
        reportStatus: 'COMPLETED',
        parameters: [
          { parmNo: 1, parmSelect: '26-MAY-2026', parmCode: 'END_DATE' },
        ],
      }));

      component.onRecentParmIdChange('TEST_USER_052626_001');
      tick();

      const param = component.reportDetail()?.parameters[0];
      // Value should be converted to Date object
      expect(param?.value).toBeTruthy();
      expect(param?.value).toEqual(jasmine.any(Date));
      // Verify date is May 26, 2026
      const dateValue = param?.value as Date;
      expect(dateValue.getFullYear()).toBe(2026);
      expect(dateValue.getMonth()).toBe(4); // May is month 4 (0-indexed)
      expect(dateValue.getDate()).toBe(26);
    }));



    it('should convert multiselect array to comma-separated string when LOV count > 1000', fakeAsync(() => {
      const detailWithLargeLov = {
        ...mockReportDetail,
        parameters: [
          ...mockReportDetail.parameters.slice(0, 1),
          {
            parmNo: 2,
            parmCode: 'LOCATION',
            parmPrompt: 'Location',
            codeType: 'LIST' as const,
            isMultiSelect: true,
            listEntryFlag: 'Y',
            options: [],
            defaultValue: 'all',
            value: null,
            totalLovCount: 1500, // Large LOV set
          },
        ],
      };

      component.reportDetail.set(detailWithLargeLov);

      mockService.getParameterValues.and.returnValue(of({
        parmId: 'TEST_USER_052626_001',
        reportName: 'SPONSOR_MGMT',
        submitDate: '2026-05-26 14:30:00',
        reportStatus: 'COMPLETED',
        parameters: [
          { parmNo: 2, parmSelect: 'LOC1', parmCode: 'LOCATION' },
          { parmNo: 2, parmSelect: 'LOC2', parmCode: 'LOCATION' },
          { parmNo: 2, parmSelect: 'LOC3', parmCode: 'LOCATION' },
        ],
      }));

      component.onRecentParmIdChange('TEST_USER_052626_001');
      tick();

      const param = component.reportDetail()?.parameters[1];
      // Should be a string, not an array
      expect(typeof param?.value).toBe('string');
      expect(param?.value).toBe('LOC1, LOC2, LOC3');
    }));

    it('should NOT add placeholder options when LOV count > 1000', fakeAsync(() => {
      const detailWithLargeLov = {
        ...mockReportDetail,
        parameters: [
          ...mockReportDetail.parameters.slice(0, 1),
          {
            parmNo: 2,
            parmCode: 'LOCATION',
            parmPrompt: 'Location',
            codeType: 'LIST' as const,
            isMultiSelect: true,
            listEntryFlag: 'Y',
            options: [{ code: 'LOC1', description: 'Location 1' }], // Only 1 pre-loaded
            defaultValue: 'all',
            value: null,
            totalLovCount: 2000, // Large LOV set
          },
        ],
      };

      component.reportDetail.set(detailWithLargeLov);

      mockService.getParameterValues.and.returnValue(of({
        parmId: 'TEST_USER_052626_001',
        reportName: 'SPONSOR_MGMT',
        submitDate: '2026-05-26 14:30:00',
        reportStatus: 'COMPLETED',
        parameters: [
          { parmNo: 2, parmSelect: 'LOC1', parmCode: 'LOCATION' },
          { parmNo: 2, parmSelect: 'LOC999', parmCode: 'LOCATION' }, // Not in options
        ],
      }));

      component.onRecentParmIdChange('TEST_USER_052626_001');
      tick();

      const param = component.reportDetail()?.parameters[1];
      // Should NOT add placeholder for LOC999 due to large LOV count
      expect(param?.options.length).toBe(1); // Still only 1 option
      expect(param?.options.find(opt => opt.code === 'LOC999')).toBeUndefined();
    }));
  });

  describe('Recent Parameter Sets - onUseRecentParmIdToggle', () => {
    beforeEach(() => {
      component.reportDetail.set(mockReportDetail);
      component.selectedRecentParmId.set('TEST_USER_052626_001');
    });

    it('should clear selected parm ID when toggled off', () => {
      component.onUseRecentParmIdToggle(false);
      expect(component.selectedRecentParmId()).toBe('');
    });



    it('should do nothing when toggled on', () => {
      const initialParmId = component.selectedRecentParmId();
      component.onUseRecentParmIdToggle(true);
      expect(component.selectedRecentParmId()).toBe(initialParmId);
    });
  });

  describe('Recent Parameter Sets - Search Functionality', () => {
    beforeEach(() => {
      component.recentParmIds.set([
        { parmId: 'USER1_052626_001', submitDate: '2026-05-26 14:30:00' },
        { parmId: 'USER2_052526_002', submitDate: '2026-05-25 10:15:00' },
        { parmId: 'USER1_052426_003', submitDate: '2026-05-24 08:45:00' },
      ]);
      component.filteredRecentParmIds.set(component.recentParmIds());
    });

    it('should filter recent parm IDs by search term', fakeAsync(() => {
      component.recentParmIdSearchControl.setValue('USER1');
      tick(200); // Wait for debounce

      expect(component.filteredRecentParmIds().length).toBe(2);
      expect(component.filteredRecentParmIds()[0].parmId).toContain('USER1');
    }));



    it('should show all when search is cleared', fakeAsync(() => {
      component.recentParmIdSearchControl.setValue('USER1');
      tick(200);
      component.recentParmIdSearchControl.setValue('');
      tick(200);

      expect(component.filteredRecentParmIds().length).toBe(3);
    }));
  });

  describe('areAllParametersFilled - Parameter Validation', () => {
    it('should return false when reportDetail is null', () => {
      component.reportDetail.set(null);
      expect(component.areAllParametersFilled()).toBe(false);
    });

    it('should return false when parameters array is empty', () => {
      component.reportDetail.set({
        ...mockReportDetail,
        parameters: [],
      });
      expect(component.areAllParametersFilled()).toBe(false);
    });

    it('should return false when any parameter value is null', () => {
      component.reportDetail.set({
        ...mockReportDetail,
        parameters: [
          { ...mockReportDetail.parameters[0], value: new Date() },
          { ...mockReportDetail.parameters[1], value: null }, // This is null
        ],
      });
      expect(component.areAllParametersFilled()).toBe(false);
    });

    it('should return false when any string parameter is empty', () => {
      component.reportDetail.set({
        ...mockReportDetail,
        parameters: [
          { ...mockReportDetail.parameters[0], codeType: 'TEXT', value: '' }, // Empty string
          { ...mockReportDetail.parameters[1], value: ['LOC1'] },
        ],
      });
      expect(component.areAllParametersFilled()).toBe(false);
    });

    it('should return false when any string parameter contains only whitespace', () => {
      component.reportDetail.set({
        ...mockReportDetail,
        parameters: [
          { ...mockReportDetail.parameters[0], codeType: 'TEXT', value: '   ' }, // Only spaces
          { ...mockReportDetail.parameters[1], value: ['LOC1'] },
        ],
      });
      expect(component.areAllParametersFilled()).toBe(false);
    });

    it('should return false when any multiselect array is empty', () => {
      component.reportDetail.set({
        ...mockReportDetail,
        parameters: [
          { ...mockReportDetail.parameters[0], value: new Date() },
          { ...mockReportDetail.parameters[1], value: [] }, // Empty array
        ],
      });
      expect(component.areAllParametersFilled()).toBe(false);
    });

    it('should return true when all string parameters have values', () => {
      component.reportDetail.set({
        ...mockReportDetail,
        parameters: [
          { ...mockReportDetail.parameters[0], codeType: 'TEXT', value: 'Some value' },
          { ...mockReportDetail.parameters[1], codeType: 'TEXT', value: 'Another value' },
        ],
      });
      expect(component.areAllParametersFilled()).toBe(true);
    });

    it('should return true when all date parameters have Date values', () => {
      component.reportDetail.set({
        ...mockReportDetail,
        parameters: [
          { ...mockReportDetail.parameters[0], value: new Date('2026-05-26') },
          { ...mockReportDetail.parameters[1], value: new Date('2026-05-27') },
        ],
      });
      expect(component.areAllParametersFilled()).toBe(true);
    });

    it('should return true when all multiselect parameters have selected values', () => {
      component.reportDetail.set({
        ...mockReportDetail,
        parameters: [
          { ...mockReportDetail.parameters[0], value: ['LOC1'] },
          { ...mockReportDetail.parameters[1], value: ['LOC1', 'LOC2'] },
        ],
      });
      expect(component.areAllParametersFilled()).toBe(true);
    });

    it('should return true when all mixed parameter types have values', () => {
      component.reportDetail.set({
        ...mockReportDetail,
        parameters: [
          { ...mockReportDetail.parameters[0], codeType: 'DATE', value: new Date() },
          { ...mockReportDetail.parameters[1], codeType: 'LIST', value: ['LOC1'] },
          {
            parmNo: 3,
            parmCode: 'NAME',
            parmPrompt: 'Name',
            codeType: 'TEXT',
            isMultiSelect: false,
            listEntryFlag: 'N',
            options: [],
            defaultValue: '',
            value: 'John Doe',
          },
        ],
      });
      expect(component.areAllParametersFilled()).toBe(true);
    });
  });



  describe('Required Asterisk Display', () => {
    beforeEach(() => {
      component.reportDetail.set(mockReportDetail);
      component.isRetrieved.set(true);
      fixture.detectChanges();
    });

    it('should display asterisk for all parameter prompts', () => {
      const asterisks = fixture.nativeElement.querySelectorAll('.required-asterisk');
      expect(asterisks.length).toBe(mockReportDetail.parameters.length);
    });

    it('should have correct asterisk styling', () => {
      const asterisk = fixture.nativeElement.querySelector('.required-asterisk');
      expect(asterisk).toBeTruthy();
      expect(asterisk.textContent).toBe('*');
    });
  });

  describe('onSingleSelectChange', () => {
    let param: ReportSubmissionParameter;

    beforeEach(() => {
      param = {
        ...mockReportDetail.parameters[0],
        parmCode: 'LOCATION',
        codeType: 'LIST',
        options: [{ code: 'LOC1', description: 'Location 1' }],
      };
    });

    it('should do nothing if selectedValue is null', () => {
      const initialOptionsLength = param.options.length;
      component.onSingleSelectChange(param, null);
      expect(param.options.length).toBe(initialOptionsLength);
      expect(mockService.getParameterLovPaginated).not.toHaveBeenCalled();
    });

    it('should do nothing if selectedValue is an array', () => {
      const initialOptionsLength = param.options.length;
      component.onSingleSelectChange(param, ['LOC1', 'LOC2']);
      expect(param.options.length).toBe(initialOptionsLength);
      expect(mockService.getParameterLovPaginated).not.toHaveBeenCalled();
    });

    it('should do nothing if selected value already exists in options', () => {
      const initialOptionsLength = param.options.length;
      component.onSingleSelectChange(param, 'LOC1');
      expect(param.options.length).toBe(initialOptionsLength);
      expect(mockService.getParameterLovPaginated).not.toHaveBeenCalled();
    });

    it('should fetch description from API when selected value not in options', fakeAsync(() => {
      mockService.getParameterLovPaginated.and.returnValue(of({
        items: [{ code: 'LOC999', description: 'Location 999' }],
        totalCount: 1,
        hasMore: false,
        isPaginated: false,
      }));

      component.onSingleSelectChange(param, 'LOC999');
      tick();

      expect(mockService.getParameterLovPaginated).toHaveBeenCalledWith('LOCATION', '', 0, 1, ['LOC999']);
      expect(param.options.length).toBe(2);
      expect(param.options[1]).toEqual({ code: 'LOC999', description: 'Location 999' });
    }));

    it('should create placeholder when API fetch fails', fakeAsync(() => {
      mockService.getParameterLovPaginated.and.returnValue(throwError(() => new Error('API Error')));

      component.onSingleSelectChange(param, 'LOC999');
      tick();

      expect(param.options.length).toBe(2);
      expect(param.options[1]).toEqual({ code: 'LOC999', description: 'LOC999' });
    }));


  });

  describe('onMultiSelectChange', () => {
    let param: ReportSubmissionParameter;

    beforeEach(() => {
      param = {
        ...mockReportDetail.parameters[1],
        parmCode: 'LOCATION',
        codeType: 'LIST',
        isMultiSelect: true,
        listEntryFlag: 'Y',
        options: [
          { code: 'LOC1', description: 'Location 1' },
          { code: 'LOC2', description: 'Location 2' },
        ],
      };
    });

    it('should do nothing if selectedValues is null', () => {
      const initialOptionsLength = param.options.length;
      component.onMultiSelectChange(param, null);
      expect(param.options.length).toBe(initialOptionsLength);
      expect(mockService.getParameterLovPaginated).not.toHaveBeenCalled();
    });

    it('should do nothing if selectedValues is not an array', () => {
      const initialOptionsLength = param.options.length;
      component.onMultiSelectChange(param, 'LOC1');
      expect(param.options.length).toBe(initialOptionsLength);
      expect(mockService.getParameterLovPaginated).not.toHaveBeenCalled();
    });

    it('should do nothing if all selected values exist in options', () => {
      const initialOptionsLength = param.options.length;
      component.onMultiSelectChange(param, ['LOC1', 'LOC2']);
      expect(param.options.length).toBe(initialOptionsLength);
      expect(mockService.getParameterLovPaginated).not.toHaveBeenCalled();
    });

    it('should fetch descriptions from API for missing values', fakeAsync(() => {
      mockService.getParameterLovPaginated.and.returnValue(of({
        items: [
          { code: 'LOC3', description: 'Location 3' },
          { code: 'LOC4', description: 'Location 4' },
        ],
        totalCount: 2,
        hasMore: false,
        isPaginated: false,
      }));

      component.onMultiSelectChange(param, ['LOC1', 'LOC2', 'LOC3', 'LOC4']);
      tick();

      expect(mockService.getParameterLovPaginated).toHaveBeenCalledWith('LOCATION', '', 0, 2, ['LOC3', 'LOC4']);
      expect(param.options.length).toBe(4);
      expect(param.options[2]).toEqual({ code: 'LOC3', description: 'Location 3' });
      expect(param.options[3]).toEqual({ code: 'LOC4', description: 'Location 4' });
    }));

    it('should create placeholders when API fetch fails', fakeAsync(() => {
      mockService.getParameterLovPaginated.and.returnValue(throwError(() => new Error('API Error')));

      component.onMultiSelectChange(param, ['LOC1', 'LOC3', 'LOC4']);
      tick();

      expect(param.options.length).toBe(4);
      expect(param.options[2]).toEqual({ code: 'LOC3', description: 'LOC3' });
      expect(param.options[3]).toEqual({ code: 'LOC4', description: 'LOC4' });
    }));

    it('should handle partial missing values', fakeAsync(() => {
      mockService.getParameterLovPaginated.and.returnValue(of({
        items: [{ code: 'LOC3', description: 'Location 3' }],
        totalCount: 1,
        hasMore: false,
        isPaginated: false,
      }));

      component.onMultiSelectChange(param, ['LOC1', 'LOC3']);
      tick();

      expect(mockService.getParameterLovPaginated).toHaveBeenCalledWith('LOCATION', '', 0, 1, ['LOC3']);
      expect(param.options.length).toBe(3);
    }));


  });

  describe('getChipValues', () => {
    it('should return empty array for null value', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        value: null,
      };
      expect(component.getChipValues(param)).toEqual([]);
    });

    it('should return empty array for empty array value', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        value: [],
      };
      expect(component.getChipValues(param)).toEqual([]);
    });

    it('should return array as-is when value is already an array', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        value: ['LOC1', 'LOC2', 'LOC3'],
      };
      expect(component.getChipValues(param)).toEqual(['LOC1', 'LOC2', 'LOC3']);
    });

    it('should split comma-separated string and trim values', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        value: 'LOC1, LOC2 , LOC3',
      };
      expect(component.getChipValues(param)).toEqual(['LOC1', 'LOC2', 'LOC3']);
    });

    it('should filter out empty values from comma-separated string', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        value: 'LOC1, , LOC2,  , LOC3',
      };
      expect(component.getChipValues(param)).toEqual(['LOC1', 'LOC2', 'LOC3']);
    });





    it('should handle single value without commas', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        value: 'LOC1',
      };
      expect(component.getChipValues(param)).toEqual(['LOC1']);
    });
  });

  describe('getChipValuesTooltip', () => {




    it('should return comma-separated codes for multiple chips', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        value: ['LOC1', 'LOC2', 'LOC3'],
      };
      const tooltip = component.getChipValuesTooltip(param);
      expect(tooltip).toContain('LOC2');
      expect(tooltip).toContain('LOC3');
    });

    it('should handle comma-separated string values', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        value: 'LOC1, LOC2, LOC3',
      };
      const tooltip = component.getChipValuesTooltip(param);
      expect(tooltip).toContain('LOC2');
      expect(tooltip).toContain('LOC3');
    });
  });

  describe('normalizeParameterValue', () => {
    it('should convert comma-separated string to array for searchable-multiselect', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        totalLovCount: 1500, // Large LOV → searchable-multiselect
        isMultiSelect: true,
        value: 'LOC1, LOC2, LOC3',
      };
      const normalized = component['normalizeParameterValue'](param);
      expect(normalized).toEqual(['LOC1', 'LOC2', 'LOC3']);
    });

    it('should preserve "ALL" keyword for searchable-multiselect', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        totalLovCount: 2000,
        isMultiSelect: true,
        value: 'ALL',
      };
      const normalized = component['normalizeParameterValue'](param);
      expect(normalized).toBe('ALL');
    });

    it('should preserve "ALL" keyword case-insensitively', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        totalLovCount: 2000,
        isMultiSelect: true,
        value: 'all',
      };
      const normalized = component['normalizeParameterValue'](param);
      expect(normalized).toBe('ALL');
    });

    it('should trim whitespace for searchable-text', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'CHAR',
        refTable: 'LOCATIONS',
        totalLovCount: 1200,
        value: '  LOC123  ',
      };
      const normalized = component['normalizeParameterValue'](param);
      expect(normalized).toBe('LOC123');
    });





    it('should filter empty values from comma-separated string', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[1],
        totalLovCount: 1500,
        isMultiSelect: true,
        value: 'LOC1, , LOC2,  , LOC3',
      };
      const normalized = component['normalizeParameterValue'](param);
      expect(normalized).toEqual(['LOC1', 'LOC2', 'LOC3']);
    });

    it('should return value as-is for normal inputs', () => {
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'TEXT',
        value: 'normal value',
      };
      const normalized = component['normalizeParameterValue'](param);
      expect(normalized).toBe('normal value');
    });

    it('should return Date objects as-is', () => {
      const date = new Date('2026-05-26');
      const param: ReportSubmissionParameter = {
        ...mockReportDetail.parameters[0],
        codeType: 'DATE',
        value: date,
      };
      const normalized = component['normalizeParameterValue'](param);
      expect(normalized).toBe(date);
    });


  });
});
