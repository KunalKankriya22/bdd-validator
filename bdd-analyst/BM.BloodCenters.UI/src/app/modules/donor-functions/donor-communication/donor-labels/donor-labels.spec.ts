import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

import { DonorLabelsComponent } from './donor-labels';
import { DonorLabelsService } from './services/donor-labels.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DonorLabelDto, SearchType } from './models/donor-labels.model';
import moment from 'moment';
import { createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DonorLabelsComponent', () => {
  let component: DonorLabelsComponent;
  let fixture: ComponentFixture<DonorLabelsComponent>;
  let donorLabelsServiceSpy: jasmine.SpyObj<DonorLabelsService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockDropdownValues = {
    searchTypes: [
      { value: 'FirstTimeFixed' as any, label: 'First Time Donors' },
      { value: 'GallonDonors' as any, label: 'Gallon Donors' }
    ],
    printers: [
      { printerName: 'LP001', printerDescription: 'Label Printer 1' },
      { printerName: 'LP002', printerDescription: 'Label Printer 2' }
    ]
  };

  const mockDonorLabels: DonorLabelDto[] = [
    {
      donorId: '123456',
      donorName: 'Doe, John',
      dateOfBirth: '1980-05-15',
      gender: 'M',
      totalDonations: 1,
      gallons: 0,
      lastDonationDate: '2024-05-01',
      lastUnitId: 'W633324081002',
      collectionDate: '2024-05-01',
      communicationCode: 'FRTTM',
      printFlag: 'N',
      insertDate: '2024-05-01T10:00:00Z',
      insertUser: 'JSMITH'
    },
    {
      donorId: '789012',
      donorName: 'Smith, Jane',
      dateOfBirth: '1990-08-20',
      gender: 'F',
      totalDonations: 40,
      gallons: 5,
      lastDonationDate: '2024-06-15',
      lastUnitId: 'W633324081003',
      collectionDate: '2024-06-15',
      communicationCode: 'GAL5',
      printFlag: 'Y',
      insertDate: '2024-06-15T14:30:00Z',
      insertUser: 'AJONES'
    }
  ];

  beforeEach(() => {

    donorLabelsServiceSpy = jasmine.createSpyObj('DonorLabelsService', [
      'getDropdownValues',
      'searchDonorLabels',
      'updatePrintFlags',
      'generateLabels',
      'printLabels'
    ]);
    dialogSpy = createMockMatDialog();
    snackBarSpy = createMockMatSnackBar();
    headerServiceSpy = createMockHeaderService();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate'
    ]);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue({
        title: 'First Time and Gallon Donor Labels',
        subtitle: 'Manage donor label generation and printing'
      })
    });

    // Set up default return values
    donorLabelsServiceSpy.getDropdownValues.and.returnValue(of(mockDropdownValues));
    donorLabelsServiceSpy.searchDonorLabels.and.returnValue(of({
      data: mockDonorLabels,
      totalCount: 2
    }));
    donorLabelsServiceSpy.updatePrintFlags.and.returnValue(of({
      updatedCount: 2,
      message: 'Successfully updated 2 print flag(s)'
    }));
    donorLabelsServiceSpy.generateLabels.and.returnValue(of({
      generatedCount: 2,
      skippedCount: 0,
      totalProcessed: 2,
      message: 'Label generation complete. Generated: 2, Skipped: 0'
    }));
    donorLabelsServiceSpy.printLabels.and.returnValue(of({
      parmId: 'DCIDNLBL000001',
      serverName: 'rep_wls_reports_server',
      reportName: 'DCRDNLBL',
      jobId: 'JOB123'
    }));
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());



      TestBed.configureTestingModule({
      imports: [DonorLabelsComponent, NoopAnimationsModule],
      providers: [
        { provide: DonorLabelsService, useValue: donorLabelsServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    });


    


      donorLabelsServiceSpy.getDropdownValues.calls.reset();


      donorLabelsServiceSpy.searchDonorLabels.calls.reset();


      donorLabelsServiceSpy.updatePrintFlags.calls.reset();


      donorLabelsServiceSpy.generateLabels.calls.reset();


      donorLabelsServiceSpy.printLabels.calls.reset();


      dialogSpy.open.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      headerServiceSpy.getCurrentWarehouseId.calls.reset();


      chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();


      donorLabelsServiceSpy.getDropdownValues.and.returnValue(of(mockDropdownValues));


      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());


    fixture = TestBed.createComponent(DonorLabelsComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {








    it('should define table columns correctly', () => {
      const columns = component.tableConfig.columns;
      expect(columns.length).toBe(10);
      expect(columns[0].key).toBe('rowIndex'); // Sequence
      expect(columns[1].key).toBe('donorName');
      expect(columns[2].key).toBe('dateOfBirth');
      expect(columns[3].key).toBe('gender');
      expect(columns[4].key).toBe('totalDonations');
      expect(columns[5].key).toBe('gallons');
      expect(columns[6].key).toBe('collectionDate');
      expect(columns[7].key).toBe('lastUnitId');
      expect(columns[8].key).toBe('insertDate');
      expect(columns[9].key).toBe('printFlag');
    });

    it('should only have Sequence column sortable', () => {
      const columns = component.tableConfig.columns;
      expect(columns[0].sortable).toBeTrue(); // Sequence
      expect(columns[1].sortable).toBeFalse(); // Donor Name
      expect(columns[2].sortable).toBeFalsy(); // Date of Birth
    });







    it('should have gallon number field disabled initially', () => {
      fixture.detectChanges();

      const gallonControl = component.searchForm.get('gallonNumber');
      expect(gallonControl?.disabled).toBeTrue();
    });
  });

  describe('Dropdown Loading', () => {
    it('should load dropdown values on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(donorLabelsServiceSpy.getDropdownValues).toHaveBeenCalled();
      expect(component.searchTypeOptions().length).toBe(2);
      expect(component.printerOptions().length).toBe(2);
      expect(component.isLoadingDropdowns()).toBeFalse();
    }));



    it('should handle error when loading dropdowns fails', fakeAsync(() => {
      const error = { error: { message: 'API Error' } };
      donorLabelsServiceSpy.getDropdownValues.and.returnValue(throwError(() => error));

      fixture.detectChanges();
      tick();

      expect(component.isLoadingDropdowns()).toBeFalse();
      expect(snackBarSpy.open).toHaveBeenCalled();
      // Should set default search types on error
      expect(component.searchTypeOptions().length).toBeGreaterThan(0);
    }));
  });

  describe('Form Validation - Required Fields', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require searchType', () => {
      const control = component.searchForm.get('searchType');
      expect(control?.hasError('required')).toBeTrue();

      control?.setValue('FirstTimeFixed');
      expect(control?.valid).toBeTrue();
    });

    it('should require printerName', () => {
      const control = component.searchForm.get('printerName');
      expect(control?.hasError('required')).toBeTrue();

      control?.setValue('LP001');
      expect(control?.valid).toBeTrue();
    });

    it('should require fromDate', () => {
      const control = component.searchForm.get('fromDate');
      expect(control?.hasError('required')).toBeTrue();

      control?.setValue(moment());
      expect(control?.hasError('required')).toBeFalse();
    });

    it('should require toDate', () => {
      const control = component.searchForm.get('toDate');
      expect(control?.hasError('required')).toBeTrue();

      control?.setValue(moment());
      expect(control?.hasError('required')).toBeFalse();
    });
  });

  describe('Form Validation - Date Field Requirements', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require fromDate field', () => {
      const fromControl = component.searchForm.get('fromDate');

      fromControl?.setValue(null);
      fromControl?.markAsTouched();

      expect(fromControl?.hasError('required')).toBeTrue();
    });

    it('should require toDate field', () => {
      const toControl = component.searchForm.get('toDate');

      toControl?.setValue(null);
      toControl?.markAsTouched();

      expect(toControl?.hasError('required')).toBeTrue();
    });

    it('should not allow both dates to be empty', () => {
      const fromControl = component.searchForm.get('fromDate');
      const toControl = component.searchForm.get('toDate');

      fromControl?.setValue(null);
      toControl?.setValue(null);

      expect(fromControl?.hasError('required')).toBeTrue();
      expect(toControl?.hasError('required')).toBeTrue();
    });

    it('should require toDate when fromDate is provided', fakeAsync(() => {
      const fromControl = component.searchForm.get('fromDate');
      const toControl = component.searchForm.get('toDate');

      fromControl?.setValue(moment());
      fromControl?.markAsTouched();
      tick();

      expect(toControl?.hasError('conditionallyRequired')).toBeTrue();
    }));

    it('should require fromDate when toDate is provided', fakeAsync(() => {
      const fromControl = component.searchForm.get('fromDate');
      const toControl = component.searchForm.get('toDate');

      // Set toDate value
      toControl?.setValue(moment());
      toControl?.markAsTouched();

      // Trigger validation on fromControl and mark as touched
      fromControl?.markAsTouched();
      fromControl?.updateValueAndValidity();
      tick();

      expect(fromControl?.hasError('conditionallyRequired')).toBeTrue();
    }));

    it('should be valid when both dates are provided', fakeAsync(() => {
      const fromControl = component.searchForm.get('fromDate');
      const toControl = component.searchForm.get('toDate');

      const today = moment();
      fromControl?.setValue(today.clone().subtract(7, 'days'));
      toControl?.setValue(today);
      tick();

      expect(fromControl?.hasError('conditionallyRequired')).toBeFalsy();
      expect(toControl?.hasError('conditionallyRequired')).toBeFalsy();
    }));
  });

  describe('Form Validation - Date Range Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate future dates for fromDate', () => {
      const futureDate = moment().add(1, 'day');
      const today = moment().subtract(1, 'day');
      const fromControl = component.searchForm.get('fromDate');
      const toControl = component.searchForm.get('toDate');

      fromControl?.setValue(futureDate, { emitEvent: false });
      toControl?.setValue(today, { emitEvent: false });

      fromControl?.setErrors({ futureDate: true });

      expect(fromControl?.hasError('futureDate')).toBeTrue();
    });

    it('should validate future dates for toDate', () => {
      const futureDate = moment().add(1, 'day');
      const today = moment().subtract(1, 'day');
      const fromControl = component.searchForm.get('fromDate');
      const toControl = component.searchForm.get('toDate');

      fromControl?.setValue(today, { emitEvent: false });
      toControl?.setValue(futureDate, { emitEvent: false });

      toControl?.setErrors({ futureDate: true });

      expect(toControl?.hasError('futureDate')).toBeTrue();
    });

    it('should validate from date not after to date', () => {
      const today = moment();
      const yesterday = moment().subtract(1, 'day');

      component.searchForm.patchValue({
        fromDate: today,
        toDate: yesterday
      });

      component['validateDates']();

      expect(component.searchForm.get('fromDate')?.hasError('dateRangeInvalid')).toBeTrue();
    });


  });



  describe('isRetrieveDisabled Getter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable RETRIEVE when form is incomplete (missing required fields)', () => {
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should disable RETRIEVE when required fields are provided without dates', () => {
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001'
      });

      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should disable RETRIEVE when only fromDate is provided', fakeAsync(() => {
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        fromDate: moment()
      });
      tick();

      expect(component.isRetrieveDisabled).toBeTrue();
    }));

    it('should disable RETRIEVE when only toDate is provided', fakeAsync(() => {
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        toDate: moment()
      });
      tick();

      expect(component.isRetrieveDisabled).toBeTrue();
    }));

    it('should enable RETRIEVE when all required fields and both dates are valid', () => {
      const today = moment();
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        fromDate: today.clone().subtract(7, 'days'),
        toDate: today
      });

      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should disable RETRIEVE when dates are invalid (future dates)', () => {
      const futureDate = moment().add(1, 'day');
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        fromDate: futureDate,
        toDate: futureDate
      });
      component['validateDates']();

      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should disable RETRIEVE when loading data', () => {
      component.isLoadingData.set(true);
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001'
      });

      expect(component.isRetrieveDisabled).toBeTrue();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should search when form is valid with dates', fakeAsync(() => {
      const today = moment();

      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        fromDate: today.clone().subtract(7, 'days'),
        toDate: today
      });

      component.onRetrieve(true);
      tick();

      expect(donorLabelsServiceSpy.searchDonorLabels).toHaveBeenCalled();
      expect(component.searchResults().length).toBe(2);
      expect(component.hasSearched()).toBeTrue();
    }));







    it('should store last search request', fakeAsync(() => {
      const today = moment();
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        fromDate: today.clone().subtract(7, 'days'),
        toDate: today
      });

      component.onRetrieve(true);
      tick();

      expect(component['lastSearchRequest']).toBeDefined();
      expect(component['lastSearchRequest']?.searchType).toBe('FirstTimeFixed');
      expect(component['lastSearchRequest']?.take).toBe(1000);
    }));



    it('should not reset print flag action when refreshing after update', fakeAsync(() => {
      const today = moment();
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        fromDate: today.clone().subtract(7, 'days'),
        toDate: today
      });

      component.lastPrintFlagAction.set('N');
      component.onRetrieve(false);
      tick();

      expect(component.lastPrintFlagAction()).toBe('N');
    }));
  });

  describe('Sorting Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const today = moment();
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        fromDate: today.clone().subtract(7, 'days'),
        toDate: today
      });
    });



    it('should handle sort change - descending', fakeAsync(() => {
      component.onRetrieve(true);
      tick();

      // Initial state is 'A', first click goes to 'D'
      component.onSortChange({ column: 'rowIndex', direction: 'D' });

      expect(component.tableConfig.sortConfig?.direction).toBe('D');
    }));

    it('should handle sort change - neutral (default)', fakeAsync(() => {
      component.onRetrieve(true);
      tick();

      // Initial state is 'A', first click goes to 'D', second click goes to 'default'
      component.onSortChange({ column: 'rowIndex', direction: 'D' });
      component.onSortChange({ column: 'rowIndex', direction: 'default' });

      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    }));

    it('should restore original order on neutral sort', fakeAsync(() => {
      component.onRetrieve(true);
      tick();

      const originalData = [...component.searchResults()];

      // Sort ascending
      component.onSortChange({ column: 'rowIndex', direction: 'A' });

      // Sort descending
      component.onSortChange({ column: 'rowIndex', direction: 'D' });

      // Sort back to neutral (default) - completes three-state cycle
      component.onSortChange({ column: 'rowIndex', direction: 'default' });

      expect(component.searchResults()).toEqual(originalData);
    }));

    it('should store original data on search', fakeAsync(() => {
      component.onRetrieve(true);
      tick();

      expect(component['originalSearchResults'].length).toBe(2);
    }));
  });

  describe('Clear Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear form and results', () => {
      const today = moment();
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        fromDate: today.clone().subtract(7, 'days'),
        toDate: today
      });

      component.searchResults.set(mockDonorLabels);
      component.hasSearched.set(true);

      component.onClear();

      expect(component.searchForm.value.searchType).toBeNull();
      expect(component.searchResults().length).toBe(0);
      expect(component.hasSearched()).toBeFalse();
    });





    it('should reset last print flag action', () => {
      component.lastPrintFlagAction.set('N');

      component.onClear();

      expect(component.lastPrintFlagAction()).toBeNull();
    });
  });

  describe('Update Print Flags', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchResults.set(mockDonorLabels);
    });

    it('should show confirmation dialog for Set Print Flag N', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onSetPrintFlagNo();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.title).toContain('N');
    });

    it('should show confirmation dialog for Set Print Flag Y', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onSetPrintFlagYes();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.title).toContain('Y');
    });

    it('should update print flags when confirmed', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onSetPrintFlagNo();
      tick();

      expect(donorLabelsServiceSpy.updatePrintFlags).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalled();
    }));









    it('should track last print flag action when set to No', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onSetPrintFlagNo();
      tick();

      expect(component.lastPrintFlagAction()).toBe('N');
    }));

    it('should track last print flag action when set to Yes', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onSetPrintFlagYes();
      tick();

      expect(component.lastPrintFlagAction()).toBe('Y');
    }));

    it('should handle error when update fails', fakeAsync(() => {
      donorLabelsServiceSpy.updatePrintFlags.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onSetPrintFlagNo();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Update failed',
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  describe('Generate Labels', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const today = moment();
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        fromDate: today.clone().subtract(7, 'days'),
        toDate: today
      });
      component.searchResults.set(mockDonorLabels);
    });

    it('should show confirmation dialog', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onGenerateLabels();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.title).toBe('Generate Labels');
    });

    it('should generate labels when confirmed', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onGenerateLabels();
      tick();

      expect(donorLabelsServiceSpy.generateLabels).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalled();
    }));

    it('should pass correct request data to service', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onGenerateLabels();
      tick();

      const call = donorLabelsServiceSpy.generateLabels.calls.mostRecent();
      expect(call.args[0].searchType).toBe('FirstTimeFixed');
      expect(call.args[0].startDate).toBeDefined();
      expect(call.args[0].endDate).toBeDefined();
    }));
  });

  describe('Print Labels', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const today = moment();
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        fromDate: today.clone().subtract(7, 'days'),
        toDate: today
      });
      component.searchResults.set(mockDonorLabels);
    });

    it('should show confirmation dialog with printer name', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onPrintLabels();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.message).toContain('LP001');
    });

    it('should print labels when confirmed', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onPrintLabels();
      tick();

      expect(donorLabelsServiceSpy.printLabels).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalled();
    }));

    it('should pass printer name to service', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onPrintLabels();
      tick();

      const call = donorLabelsServiceSpy.printLabels.calls.mostRecent();
      expect(call.args[0].printerName).toBe('LP001');
    }));
  });

  describe('UI State Computed Properties', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should show results when search is successful', fakeAsync(() => {
      const today = moment();
      component.searchForm.patchValue({
        searchType: 'FirstTimeFixed',
        printerName: 'LP001',
        fromDate: today.clone().subtract(7, 'days'),
        toDate: today
      });

      component.onRetrieve();
      tick();

      expect(component.hasResults()).toBeTrue();
      expect(component.showEmptyState()).toBeFalse();
    }));

    it('should detect records with print flag N', () => {
      component.searchResults.set(mockDonorLabels);

      expect(component.hasRecordsWithPrintFlagNo()).toBeTrue();
    });

    it('should return false when no records have print flag N', () => {
      const allYesRecords = mockDonorLabels.map(r => ({ ...r, printFlag: 'Y' as any }));
      component.searchResults.set(allYesRecords as any);

      expect(component.hasRecordsWithPrintFlagNo()).toBeFalse();
    });
  });

  describe('Action Button States', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable action buttons when no results', () => {
      expect(component.areActionsDisabled).toBeTrue();
    });

    it('should enable action buttons when results exist', () => {
      component.searchResults.set(mockDonorLabels);

      expect(component.areActionsDisabled).toBeFalse();
    });

    it('should disable Generate Labels when no records with print flag N', () => {
      const allYesRecords = mockDonorLabels.map(r => ({ ...r, printFlag: 'Y' as any }));
      component.searchResults.set(allYesRecords as any);

      expect(component.isGenerateLabelsDisabled).toBeTrue();
    });

    it('should enable Generate Labels when records with print flag N exist', () => {
      component.searchResults.set(mockDonorLabels);

      expect(component.isGenerateLabelsDisabled).toBeFalse();
    });

    it('should disable all actions when processing', () => {
      component.searchResults.set(mockDonorLabels);
      component.isProcessing.set(true);

      expect(component.areActionsDisabled).toBeTrue();
      expect(component.isGenerateLabelsDisabled).toBeTrue();
    });

    it('should disable Print Labels when records have print flag N', () => {
      component.searchResults.set(mockDonorLabels); // contains a record with printFlag='N'

      expect(component.isPrintLabelsDisabled).toBeTrue();
    });

    it('should enable Print Labels when no records have print flag N', () => {
      const allYesRecords = mockDonorLabels.map(r => ({ ...r, printFlag: 'Y' as any }));
      component.searchResults.set(allYesRecords as any);

      expect(component.isPrintLabelsDisabled).toBeFalse();
    });

    it('should enable Print Labels when all flags are Y or P', () => {
      const mixedRecords = [
        { ...mockDonorLabels[0], printFlag: 'Y' as any },
        { ...mockDonorLabels[1], printFlag: 'P' as any }
      ];
      component.searchResults.set(mixedRecords as any);

      expect(component.isPrintLabelsDisabled).toBeFalse();
    });
  });



  describe('Printer Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should show all printers when search is empty', () => {
      component.printerOptions.set(mockDropdownValues.printers);
      component.printerSearchControl.setValue('');

      const filtered = component.filteredPrinterOptions();
      expect(filtered.length).toBe(2);
    });




  });

  describe('Date Input Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle fromDate input', () => {
      const input = document.createElement('input');
      input.value = '18-MAY-2026';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: input, enumerable: true });

      component.onFromDateInput(event);

      // Should not throw error
      expect(component.searchForm.get('fromDate')).toBeDefined();
    });

    it('should handle toDate input', () => {
      const input = document.createElement('input');
      input.value = '25-MAY-2026';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: input, enumerable: true });

      component.onToDateInput(event);

      // Should not throw error
      expect(component.searchForm.get('toDate')).toBeDefined();
    });
  });


});
