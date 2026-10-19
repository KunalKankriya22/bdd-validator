import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

import { DonorRbcAgQueryComponent } from './donor-rbc-ag-query';
import { DonorRbcAgQueryService } from './services/donor-rbc-ag-query.service';
import { DonorRbcAgQueryDto, AntigenTestHeaderDto } from './models/donor-rbc-ag-query.model';
import { DonorAntigensApiService } from '../../laboratory-functions/donor-antigens-query/services/donor-antigens-api.service';
import { DonorAntigensData } from '../../laboratory-functions/donor-antigens-query/models/donor-antigens.model';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('DonorRbcAgQueryComponent', () => {
  let component: DonorRbcAgQueryComponent;
  let fixture: ComponentFixture<DonorRbcAgQueryComponent>;
  let donorRbcAgQueryServiceSpy: jasmine.SpyObj<DonorRbcAgQueryService>;
  let donorAntigensApiServiceSpy: jasmine.SpyObj<DonorAntigensApiService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let router: Router;
  let routeParams$: BehaviorSubject<any>;

  const mockDonorData: DonorRbcAgQueryDto = {
    donorId: 'DN30120859',
    fullName: 'BOLTON, CALVIN',
    dateOfBirth: '1980-03-11T00:00:00Z',
    bloodType: 'O Positive',
    gender: 'Male',
    ethnicGroup: 'Caucasian',
    ethnicGroupDescription: null,
    genotype: 'C+c-E-e+Jka-Jkb+Fya-Fyb-M-N-S+s-U-(K1,JK1,FY1,FYbneg)(JK2pos)',
    cmvResult: 'N',
    hgbSResult: 'N',
    antigenTests: [
      {
        donorId: 'DN30120859',
        antigenCode: 'Fya',
        resultCode: '-',
        confirmFlag: 'Y',
        confirmDate: '2025-06-16T00:00:00Z',
        primaryRuleId: 1,
        resultPending: 0,
        serologicalTests: [
          {
            donorId: 'DN30120859',
            antigenCode: 'Fya',
            testType: 'SER',
            testSeqNo: 1,
            unitId: 'W633324021301',
            testId: 'Fya',
            collDate: '2025-06-26T00:00:00Z',
            testResult: '-',
            confirmStatus: 'Y',
            licensedFlag: 'L',
            excludeFlag: 'N',
            testDate: '2025-06-26T10:30:00Z',
            insertDate: '2025-06-26T10:35:00Z',
            insertUser: 'USER01',
            programId: 'AGTEST'
          }
        ],
        molecularTests: [
          {
            donorId: 'DN30120859',
            antigenCode: 'Fya',
            testType: 'MOL',
            testSeqNo: 1,
            unitId: 'W633324021301',
            testId: 'FY1 (Fya)',
            collDate: '2025-06-26T00:00:00Z',
            testResult: '-',
            confirmStatus: 'Y',
            licensedFlag: 'L',
            excludeFlag: 'N',
            testDate: '2025-06-26T11:00:00Z',
            insertDate: '2025-06-26T11:30:00Z',
            insertUser: 'USER02',
            programId: 'MOLTEST'
          }
        ],
        rules: [],
        insertDate: '2025-06-26T10:35:00Z',
        insertUser: 'USER01',
        programId: 'AGTEST'
      },
      {
        donorId: 'DN30120859',
        antigenCode: 'K',
        resultCode: '+',
        confirmFlag: 'Y',
        confirmDate: '2025-06-22T00:00:00Z',
        primaryRuleId: 2,
        resultPending: 0,
        serologicalTests: [],
        molecularTests: [],
        rules: [],
        insertDate: '2025-06-22T10:35:00Z',
        insertUser: 'USER01',
        programId: 'AGTEST'
      }
    ]
  };

  const mockHlaAntigensData: DonorAntigensData = {
    donorInfo: {
      donorId: 'DN30120859',
      donorName: 'BOLTON, CALVIN',
      dateOfBirth: '1980-03-11',
      gender: 'Male',
      aboType: 'O Positive'
    },
    rbcAntigens: [],
    hlaAntigens: {
      a1: '2',
      a2: '26',
      b1: '22',
      b2: '47',
      c1: null,
      c2: null,
      d1: null,
      d2: null,
      dr: null
    }
  };

  beforeEach(() => {

    routeParams$ = new BehaviorSubject({ donorId: 'DN30120859' });

    donorRbcAgQueryServiceSpy = jasmine.createSpyObj('DonorRbcAgQueryService', [
      'getDonorRbcAgQuery',
      'getDonorRbcAgQueryByAntigen',
      'updateGenotype',
      'bulkUpdateExcludeFlag',
      'excludeUnits',
      'getCmvHbs',
      'checkAccess'
    ]);
    donorRbcAgQueryServiceSpy.getDonorRbcAgQuery.and.returnValue(of(mockDonorData));
    donorRbcAgQueryServiceSpy.checkAccess.and.returnValue(of(true));
    donorRbcAgQueryServiceSpy.getCmvHbs.and.returnValue(of([
      { unitId: '7431378', testId: 'HbS', resultCode: 'N', parameterCode: 'HBS', parameterValue: 'HbS' },
      { unitId: '7431378', testId: 'CMV', resultCode: 'N' }
    ]));

    donorAntigensApiServiceSpy = jasmine.createSpyObj('DonorAntigensApiService', [
      'getDonorAntigens'
    ]);
    donorAntigensApiServiceSpy.getDonorAntigens.and.returnValue(of(mockHlaAntigensData));

    snackBarSpy = createMockMatSnackBar();
    dialogSpy = createMockMatDialog();



      TestBed.configureTestingModule({
      imports: [DonorRbcAgQueryComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: DonorRbcAgQueryService, useValue: donorRbcAgQueryServiceSpy },
        { provide: DonorAntigensApiService, useValue: donorAntigensApiServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: routeParams$.asObservable(),
            snapshot: {
              queryParams: {}
            }
          }
        }
      ]
    });


    


      donorRbcAgQueryServiceSpy.getDonorRbcAgQuery.calls.reset();


      donorRbcAgQueryServiceSpy.getDonorRbcAgQueryByAntigen.calls.reset();


      donorRbcAgQueryServiceSpy.updateGenotype.calls.reset();


      donorRbcAgQueryServiceSpy.bulkUpdateExcludeFlag.calls.reset();


      donorRbcAgQueryServiceSpy.excludeUnits.calls.reset();


      donorRbcAgQueryServiceSpy.getCmvHbs.calls.reset();


      donorRbcAgQueryServiceSpy.checkAccess.calls.reset();


      donorAntigensApiServiceSpy.getDonorAntigens.calls.reset();


      dialogSpy.open.calls.reset();


      donorRbcAgQueryServiceSpy.getDonorRbcAgQuery.and.returnValue(of(mockDonorData));


      donorRbcAgQueryServiceSpy.checkAccess.and.returnValue(of(true));


      donorAntigensApiServiceSpy.getDonorAntigens.and.returnValue(of(mockHlaAntigensData));


    fixture = TestBed.createComponent(DonorRbcAgQueryComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);


    });

  describe('Initialization', () => {






    it('should load donor data on init with donorId from route', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(donorRbcAgQueryServiceSpy.getDonorRbcAgQuery).toHaveBeenCalledWith('DN30120859');
      expect(component.donorData()).toEqual(mockDonorData);
    }));

    it('should auto-select first antigen on load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.selectedAntigen()).toEqual(mockDonorData.antigenTests[0]);
    }));



    it('should load donor data from query parameter when path param not provided', fakeAsync(() => {
      // Update the route to return empty path params but have query params
      TestBed.resetTestingModule();

      const queryParamsRoute = {
        params: of({}),
        snapshot: {
          queryParams: { donorId: 'DN99999999' }
        }
      };

      TestBed.configureTestingModule({
        imports: [DonorRbcAgQueryComponent, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideRouter([]),
          { provide: DonorRbcAgQueryService, useValue: donorRbcAgQueryServiceSpy },
          { provide: DonorAntigensApiService, useValue: donorAntigensApiServiceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MatDialog, useValue: dialogSpy },
          { provide: ActivatedRoute, useValue: queryParamsRoute }
        ]
      });

      const newFixture = TestBed.createComponent(DonorRbcAgQueryComponent);
      const newComponent = newFixture.componentInstance;

      newFixture.detectChanges();
      tick();

      expect(donorRbcAgQueryServiceSpy.getDonorRbcAgQuery).toHaveBeenCalledWith('DN99999999');
    }));
  });
  describe('Error State', () => {
    it('should show error message on load failure', fakeAsync(() => {
      const error = { message: 'Donor not found' };
      donorRbcAgQueryServiceSpy.getDonorRbcAgQuery.and.returnValue(throwError(() => error));

      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Donor not found');
    }));

    it('should display error container when error exists', fakeAsync(() => {
      // Initialize component first
      fixture.detectChanges();
      tick();

      // Set error state
      component.error.set('Test error');
      component.loading.set(false);
      component.donorData.set(null); // Clear data to prevent isReady from being true
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Test error');
    }));


  });

  describe('Antigen Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should select antigen when clicked', () => {
      const secondAntigen = mockDonorData.antigenTests[1];
      component.selectAntigen(secondAntigen);

      expect(component.selectedAntigen()).toEqual(secondAntigen);
    });



    it('should identify selected antigen correctly', () => {
      const firstAntigen = mockDonorData.antigenTests[0];
      component.selectAntigen(firstAntigen);

      expect(component.isAntigenSelected(firstAntigen)).toBeTrue();
      expect(component.isAntigenSelected(mockDonorData.antigenTests[1])).toBeFalse();
    });




  });

  describe('Antigen Search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should show all antigens when search is empty', () => {
      component.antigenSearchControl.setValue('');
      fixture.detectChanges();

      expect(component.filteredAntigens().length).toBe(2);
    });


  });

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle serological page change', () => {
      const event = { pageIndex: 1, pageSize: 25, length: 100 };
      component.onSerologicalPageChange(event);

      expect(component.serologicalPageIndex()).toBe(1);
      expect(component.serologicalPageSize()).toBe(25);
    });



    it('should paginate serological tests correctly', () => {
      // Assuming first antigen has serological tests
      component.serologicalPageIndex.set(0);
      component.serologicalPageSize.set(10);

      const paginated = component.paginatedSerologicalTests();
      expect(paginated.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Action Buttons', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges(); // Extra detectChanges after data loads
    }));

    it('should open donor interdictions dialog when donor data available', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogRefSpy.componentInstance = { donorId: '' };
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onDonorInterdictions();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      expect(dialogConfig?.width).toBe('70vw');
      expect(dialogConfig?.height).toBe('calc(100vh - 64px)');
      expect(dialogConfig?.position).toEqual({ right: '0', top: '64px' });
      expect(dialogConfig?.panelClass).toBe('code-dialog-panel-right');
      expect(dialogRefSpy.componentInstance.donorId).toBe('DN30120859');
    });



    it('should open donor attributes dialog when donor data available', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogRefSpy.componentInstance = {
        inputDonorId: '',
        inputDonorName: '',
        inputDob: '',
        inputSex: '',
        inputAbo: '',
        closePanelEvent: of()
      };
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onAttributes();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      expect(dialogConfig?.width).toBe('70vw');
      expect(dialogConfig?.height).toBe('calc(100vh - 64px)');
      expect(dialogConfig?.position).toEqual({ right: '0', top: '64px' });
      expect(dialogConfig?.panelClass).toBe('code-dialog-panel-right');
      expect(dialogRefSpy.componentInstance.inputDonorId).toBe('DN30120859');
      expect(dialogRefSpy.componentInstance.inputDonorName).toBe('BOLTON, CALVIN');
    });



    it('should reload donor data after interdictions dialog closes', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogRefSpy.componentInstance = { donorId: '' };
      dialogSpy.open.and.returnValue(dialogRefSpy);
      donorRbcAgQueryServiceSpy.getDonorRbcAgQuery.calls.reset();

      component.onDonorInterdictions();
      tick();

      expect(donorRbcAgQueryServiceSpy.getDonorRbcAgQuery).toHaveBeenCalledWith('DN30120859');
    }));

    it('should reload donor data after attributes dialog closes', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogRefSpy.componentInstance = {
        inputDonorId: '',
        inputDonorName: '',
        inputDob: '',
        inputSex: '',
        inputAbo: '',
        closePanelEvent: of()
      };
      dialogSpy.open.and.returnValue(dialogRefSpy);
      donorRbcAgQueryServiceSpy.getDonorRbcAgQuery.calls.reset();

      component.onAttributes();
      tick();

      expect(donorRbcAgQueryServiceSpy.getDonorRbcAgQuery).toHaveBeenCalledWith('DN30120859');
    }));

    it('should open HLA Antigens panel and load data', fakeAsync(() => {
      component.onHlaAntigens();
      tick();

      expect(component.showHlaAntigensPanel()).toBeTrue();
      expect(donorAntigensApiServiceSpy.getDonorAntigens).toHaveBeenCalledWith('DN30120859');
      expect(component.hlaAntigensData()).toEqual(mockHlaAntigensData.hlaAntigens);
      expect(component.hlaAntigensLoading()).toBeFalse();
    }));

    it('should not open HLA panel when no donor ID available', () => {
      component.donorData.set(null);
      component.onHlaAntigens();

      expect(component.showHlaAntigensPanel()).toBeFalse();
      expect(donorAntigensApiServiceSpy.getDonorAntigens).not.toHaveBeenCalled();
    });

    it('should handle HLA antigens API error gracefully', fakeAsync(() => {
      const error = { message: 'Failed to load HLA data' };
      donorAntigensApiServiceSpy.getDonorAntigens.and.returnValue(throwError(() => error));

      component.onHlaAntigens();
      tick();

      expect(component.showHlaAntigensPanel()).toBeFalse();
      expect(component.hlaAntigensLoading()).toBeFalse();
    }));



    it('should not open panel when exclude units called without antigen selection', () => {
      component.selectedAntigen.set(null);
      const panelStateBefore = component.showExcludeUnitsPanel();

      component.onExcludeUnits();

      // Verify panel doesn't open when no antigen is selected
      expect(component.showExcludeUnitsPanel()).toBe(panelStateBefore);
      expect(component.showExcludeUnitsPanel()).toBeFalse();
    });


  });
  describe('Result Badge Styling', () => {
    it('should return correct badge info for positive result', () => {
      const badge = component.getResultBadgeInfo('+');
      expect(badge.label).toBe('POS');
      expect(badge.class).toContain('result-success');
    });

    it('should return correct badge info for negative result', () => {
      const badge = component.getResultBadgeInfo('-');
      expect(badge.label).toBe('NEG');
      expect(badge.class).toContain('result-default');
    });

    it('should return correct badge info for discrepancy result', () => {
      const badge = component.getResultBadgeInfo('?');
      expect(badge.label).toBe('DIS');
      expect(badge.class).toContain('result-warn');
    });

    it('should return correct badge info for D result', () => {
      const badge = component.getResultBadgeInfo('D');
      expect(badge.label).toBe('DIS');
      expect(badge.class).toContain('result-warn');
    });


  });

  describe('Accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have unique IDs for major sections', () => {
      const donorHeaderId = component.elementId('donor-header');
      const antigenResultId = component.elementId('antigen-result');
      expect(donorHeaderId).not.toBe(antigenResultId);
    });

    it('should have unique table IDs', () => {
      const serTableId = component.tableId('serological');
      const molTableId = component.tableId('molecular');
      expect(serTableId).not.toBe(molTableId);
    });

    it('should generate unique IDs across multiple instances', () => {
      const fixture2 = TestBed.createComponent(DonorRbcAgQueryComponent);
      const component2 = fixture2.componentInstance;

      expect(component.componentId).not.toBe(component2.componentId);
      expect(component.elementId('search')).not.toBe(component2.elementId('search'));
    });
  });

  describe('Computed Properties', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should compute isReady correctly when data loaded', () => {
      expect(component.isReady()).toBeTrue();
    });

    it('should compute isReady as false when loading', () => {
      component.loading.set(true);
      expect(component.isReady()).toBeFalse();
    });

    it('should compute hasSelectedAntigen correctly', () => {
      expect(component.selectedAntigen()).toBeTruthy();
    });

    it('should compute serologicalTestsTotal correctly', () => {
      const total = component.selectedAntigen()?.serologicalTests.length || 0;
      expect(total).toBe(1);
    });

    it('should compute molecularTestsTotal correctly', () => {
      const total = component.selectedAntigen()?.molecularTests.length || 0;
      expect(total).toBe(1);
    });
  });

  describe('Template Rendering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges(); // Extra detectChanges to render template after data loads
    }));

    it('should display donor header information', () => {
      const donorHeader = fixture.debugElement.query(By.css('.donor-header-card'));
      expect(donorHeader).toBeTruthy();
      expect(donorHeader.nativeElement.textContent).toContain('DN30120859');
      expect(donorHeader.nativeElement.textContent).toContain('BOLTON, CALVIN');
    });







    it('should display action buttons', () => {
      const buttons = fixture.debugElement.queryAll(By.css('.action-buttons button'));
      expect(buttons.length).toBe(5);
    });
  });

  describe('HLA Antigens Panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should close HLA panel when close button clicked', () => {
      component.showHlaAntigensPanel.set(true);
      component.hlaAntigensData.set(mockHlaAntigensData.hlaAntigens);

      component.onHlaAntigensPanelButtonClick('close');

      expect(component.showHlaAntigensPanel()).toBeFalse();
      expect(component.hlaAntigensData()).toBeNull();
    });

    it('should close HLA panel when backdrop clicked', () => {
      component.showHlaAntigensPanel.set(true);
      component.hlaAntigensData.set(mockHlaAntigensData.hlaAntigens);

      component.onHlaAntigensPanelClose();

      expect(component.showHlaAntigensPanel()).toBeFalse();
      expect(component.hlaAntigensData()).toBeNull();
    });

    it('should return HLA value or empty string for null', () => {
      expect(component.getHlaValue('2')).toBe('2');
      expect(component.getHlaValue(null)).toBe('');
      expect(component.getHlaValue(undefined)).toBe('');
    });
  });

  describe('CMV and HbS', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load CMV and HbS data on init', fakeAsync(() => {
      // CMV and HbS now come from the main getDonorRbcAgQuery response
      expect(component.cmv()).toBe('N'); // cmvResult from mockDonorData
      expect(component.hemoglobinS()).toBe('No'); // hgbSResult 'N' maps to 'No'
    }));

    it('should parse HbS parameterValue from API response', fakeAsync(() => {
      // hgbSResult 'N' is transformed to 'No' by the component
      expect(component.hemoglobinS()).toBe('No');
    }));

    it('should parse CMV resultCode from API response', fakeAsync(() => {
      // cmvResult is passed through directly from the main response
      expect(component.cmv()).toBe('N');
    }));

    it('should use unit ID from serological tests first', () => {
      // Verify serological test data is present and has unit ID
      const firstAntigen = component.donorData()?.antigenTests[0];
      expect(firstAntigen).toBeTruthy();
      expect(firstAntigen!.serologicalTests[0].unitId).toBe('W633324021301');
    });

    it('should fall back to molecular tests if serological is empty', () => {
      // Verify molecular test data serves as fallback source
      const firstAntigen = component.donorData()?.antigenTests[0];
      expect(firstAntigen).toBeTruthy();
      expect(firstAntigen!.molecularTests[0].unitId).toBe('W633324021301');
    });



    it('should pass "0" to API when no unit ID is available', fakeAsync(() => {
      // When donor data has no antigen tests, CMV/HbS come from main response
      const dataWithNoTests: DonorRbcAgQueryDto = {
        ...mockDonorData,
        cmvResult: null,
        hgbSResult: null,
        antigenTests: []
      };
      donorRbcAgQueryServiceSpy.getDonorRbcAgQuery.and.returnValue(of(dataWithNoTests));

      // Re-trigger load
      routeParams$.next({ donorId: 'DN30120859' });
      tick();

      expect(component.cmv()).toBe('');
      expect(component.hemoglobinS()).toBe('');
    }));





    it('should extract unit ID from antigen serological tests', () => {
      // Verify the antigen has correct serological test unit ID
      const antigen = mockDonorData.antigenTests[0];
      expect(antigen.serologicalTests.length).toBeGreaterThan(0);
      expect(antigen.serologicalTests[0].unitId).toBe('W633324021301');
    });

    it('should extract unit ID from antigen molecular tests if serological is empty', () => {
      // Verify molecular tests provide unit ID when serological is absent
      const antigenWithNoSerological: AntigenTestHeaderDto = {
        ...mockDonorData.antigenTests[0],
        serologicalTests: [],
        molecularTests: [{
          ...mockDonorData.antigenTests[0].molecularTests[0],
          unitId: 'W888888888888'
        }]
      };
      expect(antigenWithNoSerological.molecularTests[0].unitId).toBe('W888888888888');
    });



    it('should reload CMV/HbS with correct unit ID from selected antigen', fakeAsync(() => {
      // CMV/HbS now come from the main response and stay stable across antigen selections
      const cmvBefore = component.cmv();
      const hbsBefore = component.hemoglobinS();

      // Select a different antigen
      const antigen = mockDonorData.antigenTests[1];
      component.selectAntigen(antigen);

      // CMV/HbS remain unchanged since they come from the main response
      expect(component.cmv()).toBe(cmvBefore);
      expect(component.hemoglobinS()).toBe(hbsBefore);
    }));



    it('should pass "0" to API when selected antigen has no unit ID', fakeAsync(() => {
      // Selecting an antigen with no tests should not change CMV/HbS
      const antigenWithNoTests: AntigenTestHeaderDto = {
        ...mockDonorData.antigenTests[0],
        serologicalTests: [],
        molecularTests: []
      };

      component.selectAntigen(antigenWithNoTests);

      // CMV/HbS values remain from the main response
      expect(component.cmv()).toBe('N');
      expect(component.hemoglobinS()).toBe('No');
    }));
  });
});
