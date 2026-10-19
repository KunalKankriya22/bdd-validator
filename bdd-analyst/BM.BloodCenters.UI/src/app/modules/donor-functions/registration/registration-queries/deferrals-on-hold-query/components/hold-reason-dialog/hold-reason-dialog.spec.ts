import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { HoldReasonDialog } from './hold-reason-dialog';
import { DeferralsOnHoldQueryService } from '../../services/deferrals-on-hold-query.service';
import { HoldReasonDialogData } from '../../models/deferrals-on-hold-query.model';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';
import { TableSortEvent } from '@shared/interfaces/data-table.interface';

describe('HoldReasonDialog', () => {
  let component: HoldReasonDialog;
  let fixture: ComponentFixture<HoldReasonDialog>;
  let queryServiceSpy: jasmine.SpyObj<DeferralsOnHoldQueryService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<HoldReasonDialog>>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const dialogData: HoldReasonDialogData = {
    deferralId: '01273001',
    transactionId: 'TR02854711',
    donorId: 'DN30111404',
    donorName: 'JOE MITCHELL',
  };

  const mockDonationInterdictions = [
    {
      type: 'HOLDS',
      code: 'DRDEF',
      description: 'Donor deferral due to deferral reason',
      entryDate: '2025-01-11',
      terminationDate: '',
      comment: 'Donor deferral due to deferral reason',
    },
  ];

  const mockDonorInterdictions = [
    {
      type: 'HOLDS',
      code: 'TEST',
      description: 'Test hold',
      originatedFrom: 'Deferral Entry',
      entryDate: '2025-01-01',
      effectiveDate: '2025-01-01',
      terminationDate: '2024-12-31',
    },
  ];

  beforeEach(() => {

    queryServiceSpy = jasmine.createSpyObj('DeferralsOnHoldQueryService', [
      'getDonationInterdictions',
      'getDonorInterdictions',
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2025-06-15'));

    queryServiceSpy.getDonationInterdictions.and.returnValue(of(mockDonationInterdictions));
    queryServiceSpy.getDonorInterdictions.and.returnValue(of(mockDonorInterdictions));



      TestBed.configureTestingModule({
      imports: [HoldReasonDialog, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: DeferralsOnHoldQueryService, useValue: queryServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
      ],
    });




      queryServiceSpy.getDonationInterdictions.calls.reset();
      queryServiceSpy.getDonorInterdictions.calls.reset();
      dialogRefSpy.close.calls.reset();

      queryServiceSpy.getDonationInterdictions.and.returnValue(of(mockDonationInterdictions));
      queryServiceSpy.getDonorInterdictions.and.returnValue(of(mockDonorInterdictions));

    fixture = TestBed.createComponent(HoldReasonDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load interdictions on init', () => {
    expect(queryServiceSpy.getDonationInterdictions).toHaveBeenCalledWith('TR02854711', false);
    expect(queryServiceSpy.getDonorInterdictions).toHaveBeenCalledWith('TR02854711', false);
    expect(component.allDonationInterdictions.length).toBe(1);
    expect(component.allDonorInterdictions.length).toBe(1);
  });

  it('should set isLoading to false after successful load', () => {
    expect(component.isLoading).toBe(false);
  });

  it('should set errorMessage to null after successful load', () => {
    expect(component.errorMessage).toBeNull();
  });

  it('should filter out expired donor interdictions in active mode', () => {
    expect(component.filteredDonorInterdictions.length).toBe(0);
  });

  it('should show all donor interdictions when selection is "all"', () => {
    component.donorSelectionFilter = 'all';
    component.onDonorSelectionChange();
    expect(component.filteredDonorInterdictions.length).toBe(1);
  });

  it('should filter out donor interdictions with future effective date in active mode', () => {
    component.allDonorInterdictions = [
      {
        type: 'HOLDS',
        code: 'FUTURE',
        description: 'Future hold',
        originatedFrom: 'Deferral Entry',
        entryDate: '2025-01-01',
        effectiveDate: '2099-01-01',
        terminationDate: '',
      },
    ];
    component.donorSelectionFilter = 'active';
    component.onDonorSelectionChange();
    expect(component.filteredDonorInterdictions.length).toBe(0);
  });

  it('should include donor interdictions with past effective date and no termination', () => {
    component.allDonorInterdictions = [
      {
        type: 'HOLDS',
        code: 'ACTIVE',
        description: 'Active hold',
        originatedFrom: 'Deferral Entry',
        entryDate: '2025-01-01',
        effectiveDate: '2025-01-01',
        terminationDate: '',
      },
    ];
    component.donorSelectionFilter = 'active';
    component.onDonorSelectionChange();
    expect(component.filteredDonorInterdictions.length).toBe(1);
  });

  it('should include originatedFrom column in donor interdictions table', () => {
    const originatedFromColumn = component.donorInterdictionsTableConfig.columns.find(
      col => col.key === 'originatedFrom'
    );
    expect(originatedFromColumn).toBeDefined();
    expect(originatedFromColumn?.header).toBe('Originated From');
  });

  it('should have deferralId in dialog data', () => {
    expect(component.data.deferralId).toBe('01273001');
  });

  // --- ngOnDestroy ---

  it('should complete destroy$ subject on ngOnDestroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // --- onClose ---

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  // --- loadInterdictions error path ---

  it('should set errorMessage on load failure', () => {
    queryServiceSpy.getDonationInterdictions.and.returnValue(throwError(() => new Error('fail')));
    queryServiceSpy.getDonorInterdictions.and.returnValue(throwError(() => new Error('fail')));

    component.ngOnInit();

    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('Failed to load interdiction data');
  });

  it('should handle null response from service gracefully', () => {
    queryServiceSpy.getDonationInterdictions.and.returnValue(of(null as any));
    queryServiceSpy.getDonorInterdictions.and.returnValue(of(null as any));

    component.ngOnInit();

    expect(component.allDonationInterdictions).toEqual([]);
    expect(component.allDonorInterdictions).toEqual([]);
    expect(component.isLoading).toBe(false);
  });

  // --- onDonationSelectionChange ---

  it('should filter donation interdictions when onDonationSelectionChange is called with active filter', () => {
    component.allDonationInterdictions = [
      {
        type: 'HOLDS',
        code: 'DRDEF',
        description: 'Active hold',
        entryDate: '2025-01-11',
        terminationDate: '',
        comment: 'Active',
      },
      {
        type: 'HOLDS',
        code: 'EXPIRED',
        description: 'Expired hold',
        entryDate: '2024-01-01',
        terminationDate: '2024-06-01',
        comment: 'Expired',
      },
    ];
    component.donationSelectionFilter = 'active';
    component.onDonationSelectionChange();

    expect(component.filteredDonationInterdictions.length).toBe(1);
    expect(component.filteredDonationInterdictions[0].code).toBe('DRDEF');
  });

  it('should show all donation interdictions when selection is "all"', () => {
    component.allDonationInterdictions = [
      {
        type: 'HOLDS',
        code: 'DRDEF',
        description: 'Active hold',
        entryDate: '2025-01-11',
        terminationDate: '',
        comment: 'Active',
      },
      {
        type: 'HOLDS',
        code: 'EXPIRED',
        description: 'Expired hold',
        entryDate: '2024-01-01',
        terminationDate: '2024-06-01',
        comment: 'Expired',
      },
    ];
    component.donationSelectionFilter = 'all';
    component.onDonationSelectionChange();

    expect(component.filteredDonationInterdictions.length).toBe(2);
  });

  it('should include donation interdictions with termination date today or in the future', () => {
    component.allDonationInterdictions = [
      {
        type: 'HOLDS',
        code: 'TODAY',
        description: 'Terminates today',
        entryDate: '2025-01-01',
        terminationDate: '2025-06-15',
        comment: 'Termination today',
      },
    ];
    component.donationSelectionFilter = 'active';
    component.onDonationSelectionChange();

    expect(component.filteredDonationInterdictions.length).toBe(1);
  });

  // --- onDonationSortChange ---

  it('should update donation sort config and sort ascending', () => {
    component.allDonationInterdictions = [
      { type: 'ZTYPE', code: 'Z1', description: 'Z', entryDate: '', terminationDate: '', comment: '' },
      { type: 'ATYPE', code: 'A1', description: 'A', entryDate: '', terminationDate: '', comment: '' },
    ];
    component.donationSelectionFilter = 'all';
    component.onDonationSelectionChange();

    const sortEvent: TableSortEvent = { column: 'type', direction: 'A' };
    component.onDonationSortChange(sortEvent);

    expect(component.donationInterdictionsTableConfig.sortConfig!.column).toBe('type');
    expect(component.donationInterdictionsTableConfig.sortConfig!.direction).toBe('A');
    expect(component.filteredDonationInterdictions[0].type).toBe('ATYPE');
    expect(component.filteredDonationInterdictions[1].type).toBe('ZTYPE');
  });

  it('should update donation sort config and sort descending', () => {
    component.allDonationInterdictions = [
      { type: 'ATYPE', code: 'A1', description: 'A', entryDate: '', terminationDate: '', comment: '' },
      { type: 'ZTYPE', code: 'Z1', description: 'Z', entryDate: '', terminationDate: '', comment: '' },
    ];
    component.donationSelectionFilter = 'all';
    component.onDonationSelectionChange();

    const sortEvent: TableSortEvent = { column: 'type', direction: 'D' };
    component.onDonationSortChange(sortEvent);

    expect(component.filteredDonationInterdictions[0].type).toBe('ZTYPE');
    expect(component.filteredDonationInterdictions[1].type).toBe('ATYPE');
  });

  it('should not change order when donation sort direction is default', () => {
    component.allDonationInterdictions = [
      { type: 'BTYPE', code: 'B1', description: 'B', entryDate: '', terminationDate: '', comment: '' },
      { type: 'ATYPE', code: 'A1', description: 'A', entryDate: '', terminationDate: '', comment: '' },
    ];
    component.donationSelectionFilter = 'all';
    component.onDonationSelectionChange();

    const sortEvent: TableSortEvent = { column: 'type', direction: 'default' };
    component.onDonationSortChange(sortEvent);

    expect(component.filteredDonationInterdictions[0].type).toBe('BTYPE');
    expect(component.filteredDonationInterdictions[1].type).toBe('ATYPE');
  });

  // --- onDonorSortChange ---

  it('should update donor sort config and sort ascending', () => {
    component.allDonorInterdictions = [
      { type: 'ZTYPE', code: 'Z1', description: 'Z', originatedFrom: '', entryDate: '', effectiveDate: '2025-01-01', terminationDate: '' },
      { type: 'ATYPE', code: 'A1', description: 'A', originatedFrom: '', entryDate: '', effectiveDate: '2025-01-01', terminationDate: '' },
    ];
    component.donorSelectionFilter = 'all';
    component.onDonorSelectionChange();

    const sortEvent: TableSortEvent = { column: 'type', direction: 'A' };
    component.onDonorSortChange(sortEvent);

    expect(component.donorInterdictionsTableConfig.sortConfig!.column).toBe('type');
    expect(component.donorInterdictionsTableConfig.sortConfig!.direction).toBe('A');
    expect(component.filteredDonorInterdictions[0].type).toBe('ATYPE');
    expect(component.filteredDonorInterdictions[1].type).toBe('ZTYPE');
  });

  it('should update donor sort config and sort descending', () => {
    component.allDonorInterdictions = [
      { type: 'ATYPE', code: 'A1', description: 'A', originatedFrom: '', entryDate: '', effectiveDate: '2025-01-01', terminationDate: '' },
      { type: 'ZTYPE', code: 'Z1', description: 'Z', originatedFrom: '', entryDate: '', effectiveDate: '2025-01-01', terminationDate: '' },
    ];
    component.donorSelectionFilter = 'all';
    component.onDonorSelectionChange();

    const sortEvent: TableSortEvent = { column: 'type', direction: 'D' };
    component.onDonorSortChange(sortEvent);

    expect(component.filteredDonorInterdictions[0].type).toBe('ZTYPE');
    expect(component.filteredDonorInterdictions[1].type).toBe('ATYPE');
  });

  it('should not change order when donor sort direction is default', () => {
    component.allDonorInterdictions = [
      { type: 'BTYPE', code: 'B1', description: 'B', originatedFrom: '', entryDate: '', effectiveDate: '2025-01-01', terminationDate: '' },
      { type: 'ATYPE', code: 'A1', description: 'A', originatedFrom: '', entryDate: '', effectiveDate: '2025-01-01', terminationDate: '' },
    ];
    component.donorSelectionFilter = 'all';
    component.onDonorSelectionChange();

    const sortEvent: TableSortEvent = { column: 'type', direction: 'default' };
    component.onDonorSortChange(sortEvent);

    expect(component.filteredDonorInterdictions[0].type).toBe('BTYPE');
    expect(component.filteredDonorInterdictions[1].type).toBe('ATYPE');
  });

  // --- formatDate (via table config valueFormatter) ---

  it('should format a valid date string via donation entryDate column formatter', () => {
    const entryDateCol = component.donationInterdictionsTableConfig.columns.find(c => c.key === 'entryDate');
    expect(entryDateCol).toBeDefined();
    const result = entryDateCol!.valueFormatter!('2025-03-15');
    expect(result).toBe('15-MAR-2025');
  });

  it('should return "--" for empty date string via column formatter', () => {
    const entryDateCol = component.donationInterdictionsTableConfig.columns.find(c => c.key === 'entryDate');
    const result = entryDateCol!.valueFormatter!('');
    expect(result).toBe('--');
  });

  it('should return "--" for invalid date string via column formatter', () => {
    const entryDateCol = component.donationInterdictionsTableConfig.columns.find(c => c.key === 'entryDate');
    const result = entryDateCol!.valueFormatter!('not-a-date');
    expect(result).toBe('--');
  });

  it('should format date via donation terminationDate column formatter', () => {
    const termCol = component.donationInterdictionsTableConfig.columns.find(c => c.key === 'terminationDate');
    expect(termCol).toBeDefined();
    const result = termCol!.valueFormatter!('2024-12-25');
    expect(result).toBe('25-DEC-2024');
  });

  it('should format date via donor entryDate column formatter', () => {
    const entryDateCol = component.donorInterdictionsTableConfig.columns.find(c => c.key === 'entryDate');
    expect(entryDateCol).toBeDefined();
    const result = entryDateCol!.valueFormatter!('2025-07-04');
    expect(result).toBe('04-JUL-2025');
  });

  it('should format date via donor effectiveDate column formatter', () => {
    const effDateCol = component.donorInterdictionsTableConfig.columns.find(c => c.key === 'effectiveDate');
    expect(effDateCol).toBeDefined();
    const result = effDateCol!.valueFormatter!('2025-01-01');
    expect(result).toBe('01-JAN-2025');
  });

  it('should format date via donor terminationDate column formatter', () => {
    const termCol = component.donorInterdictionsTableConfig.columns.find(c => c.key === 'terminationDate');
    expect(termCol).toBeDefined();
    const result = termCol!.valueFormatter!('2025-12-31');
    expect(result).toBe('31-DEC-2025');
  });

  // --- Table config structure ---

  it('should have correct number of columns in donation interdictions table', () => {
    expect(component.donationInterdictionsTableConfig.columns.length).toBe(6);
  });

  it('should have correct number of columns in donor interdictions table', () => {
    expect(component.donorInterdictionsTableConfig.columns.length).toBe(7);
  });

  it('should have stickyHeader enabled for both tables', () => {
    expect(component.donationInterdictionsTableConfig.stickyHeader).toBe(true);
    expect(component.donorInterdictionsTableConfig.stickyHeader).toBe(true);
  });

  it('should have showPagination disabled for both tables', () => {
    expect(component.donationInterdictionsTableConfig.showPagination).toBe(false);
    expect(component.donorInterdictionsTableConfig.showPagination).toBe(false);
  });

  it('should have selection options with active and all', () => {
    expect(component.selectionOptions.length).toBe(2);
    expect(component.selectionOptions[0].value).toBe('active');
    expect(component.selectionOptions[1].value).toBe('all');
  });

  // --- isActive edge cases through donation filtering ---

  it('should keep donation interdictions with no termination date as active', () => {
    component.allDonationInterdictions = [
      { type: 'HOLDS', code: 'NOTERM', description: 'No termination', entryDate: '2025-01-01', terminationDate: '', comment: '' },
    ];
    component.donationSelectionFilter = 'active';
    component.onDonationSelectionChange();
    expect(component.filteredDonationInterdictions.length).toBe(1);
  });

  it('should exclude donation interdictions with past termination date', () => {
    component.allDonationInterdictions = [
      { type: 'HOLDS', code: 'PAST', description: 'Past termination', entryDate: '2024-01-01', terminationDate: '2024-12-31', comment: '' },
    ];
    component.donationSelectionFilter = 'active';
    component.onDonationSelectionChange();
    expect(component.filteredDonationInterdictions.length).toBe(0);
  });

  it('should include donation interdictions with future termination date', () => {
    component.allDonationInterdictions = [
      { type: 'HOLDS', code: 'FUTURE', description: 'Future termination', entryDate: '2025-01-01', terminationDate: '2099-12-31', comment: '' },
    ];
    component.donationSelectionFilter = 'active';
    component.onDonationSelectionChange();
    expect(component.filteredDonationInterdictions.length).toBe(1);
  });

  // --- isActive edge cases through donor filtering ---

  it('should include donor interdiction where effective date equals today', () => {
    component.allDonorInterdictions = [
      { type: 'HOLDS', code: 'TODAY', description: 'Effective today', originatedFrom: '', entryDate: '', effectiveDate: '2025-06-15', terminationDate: '' },
    ];
    component.donorSelectionFilter = 'active';
    component.onDonorSelectionChange();
    expect(component.filteredDonorInterdictions.length).toBe(1);
  });

  it('should include donor interdiction where termination date equals today', () => {
    component.allDonorInterdictions = [
      { type: 'HOLDS', code: 'TERM_TODAY', description: 'Terminates today', originatedFrom: '', entryDate: '', effectiveDate: '2025-01-01', terminationDate: '2025-06-15' },
    ];
    component.donorSelectionFilter = 'active';
    component.onDonorSelectionChange();
    expect(component.filteredDonorInterdictions.length).toBe(1);
  });

  it('should exclude donor interdiction where termination date is yesterday', () => {
    component.allDonorInterdictions = [
      { type: 'HOLDS', code: 'YESTERDAY', description: 'Terminated yesterday', originatedFrom: '', entryDate: '', effectiveDate: '2025-01-01', terminationDate: '2025-06-14' },
    ];
    component.donorSelectionFilter = 'active';
    component.onDonorSelectionChange();
    expect(component.filteredDonorInterdictions.length).toBe(0);
  });

  it('should include donor interdiction with empty effective date and no termination', () => {
    component.allDonorInterdictions = [
      { type: 'HOLDS', code: 'NOEFF', description: 'No effective date', originatedFrom: '', entryDate: '', effectiveDate: '', terminationDate: '' },
    ];
    component.donorSelectionFilter = 'active';
    component.onDonorSelectionChange();
    expect(component.filteredDonorInterdictions.length).toBe(1);
  });

  // --- Default filter values ---

  it('should have default donation selection filter as active', () => {
    expect(component.donationSelectionFilter).toBe('active');
  });

  it('should have default donor selection filter as active', () => {
    expect(component.donorSelectionFilter).toBe('active');
  });

  // --- Data binding ---

  it('should expose dialog data including donorId and donorName', () => {
    expect(component.data.donorId).toBe('DN30111404');
    expect(component.data.donorName).toBe('JOE MITCHELL');
    expect(component.data.transactionId).toBe('TR02854711');
  });

  // --- Filtering applies sort after filtering ---

  it('should apply current sort after donation filtering', () => {
    component.allDonationInterdictions = [
      { type: 'ZTYPE', code: 'Z1', description: 'Z', entryDate: '', terminationDate: '', comment: '' },
      { type: 'ATYPE', code: 'A1', description: 'A', entryDate: '', terminationDate: '', comment: '' },
    ];
    component.donationInterdictionsTableConfig.sortConfig!.direction = 'A';
    component.donationSelectionFilter = 'all';
    component.onDonationSelectionChange();

    expect(component.filteredDonationInterdictions[0].type).toBe('ATYPE');
    expect(component.filteredDonationInterdictions[1].type).toBe('ZTYPE');
  });

  it('should apply current sort after donor filtering', () => {
    component.allDonorInterdictions = [
      { type: 'ZTYPE', code: 'Z1', description: 'Z', originatedFrom: '', entryDate: '', effectiveDate: '2025-01-01', terminationDate: '' },
      { type: 'ATYPE', code: 'A1', description: 'A', originatedFrom: '', entryDate: '', effectiveDate: '2025-01-01', terminationDate: '' },
    ];
    component.donorInterdictionsTableConfig.sortConfig!.direction = 'A';
    component.donorSelectionFilter = 'all';
    component.onDonorSelectionChange();

    expect(component.filteredDonorInterdictions[0].type).toBe('ATYPE');
    expect(component.filteredDonorInterdictions[1].type).toBe('ZTYPE');
  });

  // --- Empty data ---

  it('should handle empty interdiction arrays from service', () => {
    queryServiceSpy.getDonationInterdictions.and.returnValue(of([]));
    queryServiceSpy.getDonorInterdictions.and.returnValue(of([]));

    component.ngOnInit();

    expect(component.allDonationInterdictions).toEqual([]);
    expect(component.allDonorInterdictions).toEqual([]);
    expect(component.filteredDonationInterdictions).toEqual([]);
    expect(component.filteredDonorInterdictions).toEqual([]);
    expect(component.isLoading).toBe(false);
  });

  // --- Sort config defaults ---

  it('should have default sort config with column type and direction default for donation table', () => {
    expect(component.donationInterdictionsTableConfig.sortConfig!.column).toBe('type');
    expect(component.donationInterdictionsTableConfig.sortConfig!.direction).toBe('default');
  });

  it('should have default sort config with column type and direction default for donor table', () => {
    expect(component.donorInterdictionsTableConfig.sortConfig!.column).toBe('type');
    expect(component.donorInterdictionsTableConfig.sortConfig!.direction).toBe('default');
  });
});
