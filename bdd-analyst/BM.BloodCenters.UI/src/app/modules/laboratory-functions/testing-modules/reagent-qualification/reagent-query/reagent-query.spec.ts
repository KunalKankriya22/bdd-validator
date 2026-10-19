import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

import { ReagentQueryComponent } from './reagent-query';
import { ReagentQueryService } from './services/reagent-query.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  TestIdOption,
  ReagentCodeOption,
  LotNumberOption,
  ReagentDto,
  ReagentSearchResponse,
} from './models/reagent-query.model';
import { signal } from '@angular/core';

describe('ReagentQueryComponent', () => {
  let pageHeaderServiceSpy: any;
  let component: ReagentQueryComponent;
  let fixture: ComponentFixture<ReagentQueryComponent>;
  let reagentQueryService: jasmine.SpyObj<ReagentQueryService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let matDialog: MatDialog;
  let queryParamsSubject: BehaviorSubject<Record<string, string>>;

  const mockTestIds: TestIdOption[] = [
    { testId: 'T001', testDesc: 'Test One' },
    { testId: 'T002', testDesc: 'Test Two' },
  ];

  const mockReagentCodes: ReagentCodeOption[] = [
    { reagentCode: 'RC001', reagentName: 'Reagent One' },
  ];

  const mockLotNumbers: LotNumberOption[] = [{ lotNumber: 'LOT001' }];

  const mockReagent: ReagentDto = {
    reagent: 'RC001',
    reagentDescription: 'Reagent One',
    reagentId: 'RID001',
    receivedDate: '2024-01-01',
    supplier: 'SUP001',
    supplierDescription: 'Supplier One',
    expirationDate: '2025-01-01',
    disposition: 'Active',
    kitLotNo: 'KIT001',
    lotNo: 'LOT001',
    receivedBy: 'User1',
    containerId: 'CTN001',
    controlIndicator: 'Y',
    storageLocation: 'LOC01',
    minimumTemperature: '2',
    maximumTemperature: '8',
    noOfTests: '100',
    reagentAcceptability: 'Pass',
    packageInsertDate: '2023-12-01',
    reagentRejectReason: '',
    rejectionDescription: '',
    reagentType: 'Type A',
    remaining: '50',
    noteId: null,
    preparationFlag: null,
  };

  const mockSearchResponse: ReagentSearchResponse = {
    reagents: [mockReagent],
    totalRecords: 1,
  };

  beforeEach(() => {

    reagentQueryService = jasmine.createSpyObj<ReagentQueryService>(
      'ReagentQueryService',
      ['getTestIds', 'getReagentCodes', 'getLotNumbers', 'getReagentIds', 'searchReagents', 'getTestKits', 'getNote', 'getPreparationDetails']
    );
    snackbarService = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['showError', 'showSuccess']);

    reagentQueryService.getTestIds.and.returnValue(of(mockTestIds));
    reagentQueryService.getReagentCodes.and.returnValue(of(mockReagentCodes));
    reagentQueryService.getLotNumbers.and.returnValue(of(mockLotNumbers));
    reagentQueryService.getReagentIds.and.returnValue(of([]));
    reagentQueryService.searchReagents.and.returnValue(of(mockSearchResponse));
    reagentQueryService.getNote.and.returnValue(of('Note text'));

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService',
      ['getTitle', 'getSubtitle', 'getCurrentMenuItem'],
      { pageHeaderData: signal(null) }
    );
    pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);

    queryParamsSubject = new BehaviorSubject<Record<string, string>>({});
    const mockActivatedRoute = {
      queryParams: queryParamsSubject.asObservable(),
      snapshot: { queryParams: {} }
    };



      TestBed.configureTestingModule({
      imports: [
        ReagentQueryComponent,
        NoopAnimationsModule,
        MatSnackBarModule,
        MatDialogModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ReagentQueryService, useValue: reagentQueryService },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    });


    


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      pageHeaderServiceSpy.getCurrentMenuItem.calls.reset();


      reagentQueryService.getTestIds.and.returnValue(of(mockTestIds));


      reagentQueryService.getReagentCodes.and.returnValue(of(mockReagentCodes));


      reagentQueryService.getLotNumbers.and.returnValue(of(mockLotNumbers));


      reagentQueryService.getReagentIds.and.returnValue(of([]));


      reagentQueryService.searchReagents.and.returnValue(of(mockSearchResponse));


      reagentQueryService.getNote.and.returnValue(of('Note text'));


      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);


      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);


    matDialog = TestBed.inject(MatDialog);
    fixture = TestBed.createComponent(ReagentQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should load test IDs on init', () => {
    expect(reagentQueryService.getTestIds).toHaveBeenCalled();
    expect(component['testIds']()).toEqual(mockTestIds);
    expect(component['loadingTestIds']()).toBeFalse();
  });



  it('should initialize searchForm with required testId validator', () => {
    const testIdCtrl = component.searchForm.get('testId');
    expect(testIdCtrl?.valid).toBeFalse();
    testIdCtrl?.setValue('T001');
    expect(testIdCtrl?.valid).toBeTrue();
  });

  describe('onTestIdChange', () => {
    it('should load reagent codes and lot numbers when testId selected', () => {
      component.searchForm.get('testId')?.setValue('T001');

      expect(reagentQueryService.getReagentCodes).toHaveBeenCalledWith('T001');
      expect(reagentQueryService.getLotNumbers).toHaveBeenCalledWith('T001', null);
      expect(component['reagentCodes']()).toEqual(mockReagentCodes);
      expect(component['lotNumbers']()).toEqual(mockLotNumbers);
    });

    it('should reset reagent code and lot number when testId changes', () => {
      component.searchForm.get('testId')?.setValue('T001');
      component.searchForm.get('reagentCode')?.setValue('RC001');
      component.searchForm.get('lotNumber')?.setValue('LOT001');

      component.searchForm.get('testId')?.setValue('T002');

      expect(component['reagentCodeValue']()).toBeNull();
      expect(component['lotNumberValue']()).toBeNull();
    });


  });

  describe('onReagentCodeChange', () => {
    it('should reload lot numbers with reagent code filter', () => {
      component.searchForm.get('testId')?.setValue('T001');
      component.searchForm.get('reagentCode')?.setValue('RC001');

      expect(reagentQueryService.getLotNumbers).toHaveBeenCalledWith('T001', 'RC001');
    });


  });

  describe('filtered computed signals', () => {
    beforeEach(() => {
      component.searchForm.get('testId')?.setValue('T001');
    });



    it('should return all test IDs when search is empty', () => {
      component.testIdSearchControl.setValue('');
      expect(component['filteredTestIds']().length).toBe(mockTestIds.length);
    });

    it('should filter reagent codes by search text', () => {
      component['reagentCodes'].set([
        { reagentCode: 'RC001', reagentName: 'Alpha' },
        { reagentCode: 'RC002', reagentName: 'Beta' },
      ]);
      component.reagentCodeSearchControl.setValue('alpha');
      expect(component['filteredReagentCodes']().length).toBe(1);
    });

    it('should filter lot numbers by search text', () => {
      component['lotNumbers'].set([{ lotNumber: 'LOT001' }, { lotNumber: 'LOT002' }]);
      component.lotNumberSearchControl.setValue('LOT001');
      expect(component['filteredLotNumbers']().length).toBe(1);
    });
  });

  describe('onRetrieve', () => {
    it('should not search when form is invalid (testId missing)', () => {
      component['onRetrieve']();
      expect(reagentQueryService.searchReagents).not.toHaveBeenCalled();
      expect(component['submitted']()).toBeTrue();
    });

    it('should perform search when form is valid', () => {
      component.searchForm.get('testId')?.setValue('T001');
      component['onRetrieve']();

      expect(reagentQueryService.searchReagents).toHaveBeenCalled();
      expect(component['reagents']()).toEqual(mockSearchResponse.reagents);
      expect(component['totalRecords']()).toBe(1);
      expect(component['loading']()).toBeFalse();
    });




  });

  describe('onClearAll', () => {
    it('should reset all state signals', () => {
      component.searchForm.get('testId')?.setValue('T001');
      component['reagents'].set([mockReagent]);
      component['submitted'].set(true);
      component['error'].set('some error');

      component['onClearAll']();

      expect(component.searchForm.get('testId')?.value).toBeNull();
      expect(component['reagents']()).toEqual([]);
      expect(component['submitted']()).toBeFalse();
      expect(component['error']()).toBeNull();
      expect(component['pageIndex']()).toBe(0);
      expect(component['pageSize']()).toBe(25);
    });
  });
  describe('onDropdownOpened', () => {
    it('should clear search controls when dropdown closed', () => {
      component.testIdSearchControl.setValue('search text');
      component.reagentCodeSearchControl.setValue('code text');
      component.lotNumberSearchControl.setValue('lot text');

      component['onDropdownOpened'](false);

      expect(component.testIdSearchControl.value).toBe('');
      expect(component.reagentCodeSearchControl.value).toBe('');
      expect(component.lotNumberSearchControl.value).toBe('');
    });

    it('should not clear search controls when dropdown opens', () => {
      component.testIdSearchControl.setValue('search text');
      component['onDropdownOpened'](true);
      expect(component.testIdSearchControl.value).toBe('search text');
    });
  });

  describe('computed display values', () => {
    beforeEach(() => {
      component['testIds'].set(mockTestIds);
      component['reagentCodes'].set(mockReagentCodes);
      component['lotNumbers'].set(mockLotNumbers);
    });

    it('selectedTestIdDisplay should show testId and description', () => {
      component['testIdValue'].set('T001');
      expect(component['selectedTestIdDisplay']()).toBe('T001 - Test One');
    });



    it('selectedReagentCodeDisplay should show code and name', () => {
      component['reagentCodeValue'].set('RC001');
      expect(component['selectedReagentCodeDisplay']()).toBe('RC001 - Reagent One');
    });

    it('selectedLotNumberDisplay should return lot number', () => {
      component['lotNumberValue'].set('LOT001');
      expect(component['selectedLotNumberDisplay']()).toBe('LOT001');
    });

    it('testDescription should return description for selected testId', () => {
      component['testIdValue'].set('T001');
      expect(component['testDescription']()).toBe('Test One');
    });

    it('testDescription should return dash when no testId selected', () => {
      component['testIdValue'].set(null);
      expect(component['testDescription']()).toBe('-');
    });
  });

  describe('isEmpty computed', () => {
    it('should be true when no reagents and submitted', () => {
      component['reagents'].set([]);
      component['submitted'].set(true);
      component['loading'].set(false);
      expect(component['isEmpty']()).toBeTrue();
    });

    it('should be false when reagents exist', () => {
      component['reagents'].set([mockReagent]);
      component['submitted'].set(true);
      component['loading'].set(false);
      expect(component['isEmpty']()).toBeFalse();
    });

    it('should be false when loading', () => {
      component['reagents'].set([]);
      component['submitted'].set(true);
      component['loading'].set(true);
      expect(component['isEmpty']()).toBeFalse();
    });
  });
  describe('formatDate / formatDateTime', () => {
    it('formatDate should format to DD-MMM-YYYY uppercase', () => {
      const result = component['formatDate']('2024-01-15');
      expect(result).toBe('15-JAN-2024');
    });



    it('formatDateTime should format to DD-MMM-YYYY HH:mm uppercase', () => {
      const result = component['formatDateTime']('2024-01-15T10:30:00');
      expect(result).toContain('15-JAN-2024');
    });
  });

  describe('formatPackageInsertDate', () => {
    it('should format to DD - MMM uppercase (e.g. 01 - JAN)', () => {
      const result = component['formatPackageInsertDate']('2023-01-01');
      expect(result).toBe('01 - JAN');
    });

    it('should format December as DEC uppercase', () => {
      const result = component['formatPackageInsertDate']('2023-12-01');
      expect(result).toBe('01 - DEC');
    });

    it('should zero-pad single-digit days', () => {
      const result = component['formatPackageInsertDate']('2024-06-05');
      expect(result).toBe('05 - JUN');
    });




  });
  describe('getNoteText / isNoteLoading', () => {
    it('getNoteText should return null when row has no noteId', () => {
      const row = { ...mockReagent, noteId: null };
      expect(component['getNoteText'](row)).toBeNull();
    });

    it('isNoteLoading should return false when row has no noteId', () => {
      const row = { ...mockReagent, noteId: null };
      expect(component['isNoteLoading'](row)).toBeFalse();
    });
  });
  describe('getContextHint', () => {
    it('should return preparation hint for flag P', () => {
      const result = component['getContextHint']({ ...mockReagent, preparationFlag: 'P' });
      expect(result).toContain('Preparation details available');
    });

    it('should return preparation hint for flag I', () => {
      const result = component['getContextHint']({ ...mockReagent, preparationFlag: 'I' });
      expect(result).toContain('Preparation details available');
    });

    it('should return prepared reagent hint for flag Y', () => {
      const result = component['getContextHint']({ ...mockReagent, preparationFlag: 'Y' });
      expect(result).toContain('prepared reagent');
    });




  });

  describe('applyQueryParams (Kit Details navigation)', () => {
    it('should pre-fill testId and reagentId and auto-search on same-route navigation', () => {
      reagentQueryService.searchReagents.calls.reset();

      queryParamsSubject.next({ testId: 'T001', reagentId: 'RID001' });
      fixture.detectChanges();

      expect(component.searchForm.get('testId')?.value).toBe('T001');
      expect(component.searchForm.get('reagentId')?.value).toBe('RID001');
      expect(reagentQueryService.searchReagents).toHaveBeenCalled();
    });

    it('should pre-fill only testId when reagentId param is absent', () => {
      reagentQueryService.searchReagents.calls.reset();

      queryParamsSubject.next({ testId: 'T002' });
      fixture.detectChanges();

      expect(component.searchForm.get('testId')?.value).toBe('T002');
      expect(component.searchForm.get('reagentId')?.value).toBeNull();
      expect(reagentQueryService.searchReagents).toHaveBeenCalled();
    });




  });
});
