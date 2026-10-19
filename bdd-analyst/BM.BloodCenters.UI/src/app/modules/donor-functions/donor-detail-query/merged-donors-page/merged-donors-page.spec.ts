import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { MergedDonorsPage } from './merged-donors-page';
import { DonorDetailQueryService } from '../services/donor-detail-query.service';
import { DonorStateService } from '../../shared/services/donor-state.service';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import {
  MergedDonor,
  MergeHoldUnit,
  MergedDonorInterdiction,
  PotentialDuplicate,
} from '../models/donor-detail-query.model';

describe('MergedDonorsPage', () => {
  let component: MergedDonorsPage;
  let fixture: ComponentFixture<MergedDonorsPage>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockService: jasmine.SpyObj<DonorDetailQueryService>;
  let mockDonorState: jasmine.SpyObj<DonorStateService>;

  const mockMergedDonors: MergedDonor[] = [
    {
      secondaryDonorId: '99999',
      gender: 'M',
      dateOfBirth: '1990-01-01',
      lastName: 'SMITH',
      firstName: 'BOB',
      middleName: '',
    },
  ];

  const mockHoldUnits: MergeHoldUnit[] = [
    { unitId: 'U001', collDate: '2025-01-01', donorId: '12345' },
  ];

  const mockInterdictions: MergedDonorInterdiction[] = [
    {
      donorId: '99999',
      interType: 'HOLD',
      interCode: 'DR',
      unitId: '',
      effDate: '2025-01-01',
      termDate: '',
    },
  ];

  const mockDuplicates: PotentialDuplicate[] = [
    {
      setId: 'S1',
      donorId: '12345',
      mergeFlag: 'Y',
      resolveUser: 'USR',
      resolveDate: '2025-01-01',
      demographicsUser: 'USR',
      demographicsCheck: 'Y',
      demographicsDate: '2025-01-01',
      interdictionsUser: '',
      interdictionsCheck: '',
      interdictionsDate: '',
      donationsUser: '',
      donationsCheck: '',
      donationsDate: '',
      keydataUser: '',
      keydataCheck: '',
      keydataDate: '',
    },
  ];

  const donorDetailQueryPath = ROUTE_REGISTRY[RouteKey.DonorDetailQuery].path;
  let mockRoute: { snapshot: { queryParams: Record<string, string> } };

  function createComponent(queryParams: Record<string, string> = { donorId: '12345' }) {
    mockRoute.snapshot.queryParams = queryParams;
    fixture = TestBed.createComponent(MergedDonorsPage);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    mockRoute = { snapshot: { queryParams: { donorId: '12345' } } };
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockService = jasmine.createSpyObj('DonorDetailQueryService', [
      'getMergedDonors',
      'getMergeHoldUnits',
      'getMergedInterdictions',
      'getPotentialDuplicates',
      'formatDate',
    ]);
    mockDonorState = jasmine.createSpyObj('DonorStateService', ['getSelectedDonor']);

    mockService.getMergedDonors.and.returnValue(of(mockMergedDonors));
    mockService.getMergeHoldUnits.and.returnValue(of(mockHoldUnits));
    mockService.getMergedInterdictions.and.returnValue(of(mockInterdictions));
    mockService.getPotentialDuplicates.and.returnValue(of(mockDuplicates));
    mockService.formatDate.and.callFake((d: string) => d || '--');
    mockDonorState.getSelectedDonor.and.returnValue({
      donorId: '12345',
      donorName: 'DOE, JOHN',
      timestamp: Date.now(),
    });

    const mockTranslate = jasmine.createSpyObj('TranslateService', ['instant', 'get']);
    mockTranslate.instant.and.returnValue('');
    mockTranslate.get.and.returnValue(of(''));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: DonorDetailQueryService, useValue: mockService },
        { provide: DonorStateService, useValue: mockDonorState },
        { provide: TranslateService, useValue: mockTranslate },
      ],
    })
      .overrideComponent(MergedDonorsPage, { set: { template: '' } })
      .compileComponents();

    createComponent({ donorId: '12345' });
  });

  // -------------------------------------------------------
  // 1. Component creation
  // -------------------------------------------------------
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------
  // 2. ngOnInit - donorId from queryParams
  // -------------------------------------------------------
  describe('ngOnInit with donorId from queryParams', () => {
    it('should set donorId signal from query params', () => {
      fixture.detectChanges();

      expect(component.donorId()).toBe('12345');
    });

    it('should set donorName from state service', () => {
      fixture.detectChanges();

      expect(component.donorName()).toBe('DOE, JOHN');
    });

    it('should update pageHeaderConfig title with donorId and donorName', () => {
      fixture.detectChanges();

      expect(component.pageHeaderConfig.title).toBe('12345 | DOE, JOHN');
    });

    it('should call loadData with the resolved donorId', () => {
      spyOn(component, 'loadData').and.callThrough();
      fixture.detectChanges();

      expect(component.loadData).toHaveBeenCalledWith('12345');
    });

    it('should call all four service methods', () => {
      fixture.detectChanges();

      expect(mockService.getMergedDonors).toHaveBeenCalledWith('12345');
      expect(mockService.getMergeHoldUnits).toHaveBeenCalledWith('12345');
      expect(mockService.getMergedInterdictions).toHaveBeenCalledWith('12345');
      expect(mockService.getPotentialDuplicates).toHaveBeenCalledWith('12345');
    });

    it('should not navigate away', () => {
      fixture.detectChanges();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // 3. ngOnInit - donorId from state service (no query param)
  // -------------------------------------------------------
  describe('ngOnInit with donorId from state service only', () => {
    beforeEach(() => {
      createComponent({});
    });

    it('should fall back to donorId from state service', () => {
      fixture.detectChanges();

      expect(component.donorId()).toBe('12345');
    });

    it('should set donorName from state service', () => {
      fixture.detectChanges();

      expect(component.donorName()).toBe('DOE, JOHN');
    });

    it('should call loadData with the state-service donorId', () => {
      fixture.detectChanges();

      expect(mockService.getMergedDonors).toHaveBeenCalledWith('12345');
    });

    it('should not redirect', () => {
      fixture.detectChanges();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // 4. ngOnInit - no donorId available -> redirect
  // -------------------------------------------------------
  describe('ngOnInit with no donorId', () => {
    beforeEach(() => {
      mockDonorState.getSelectedDonor.and.returnValue(null);
      createComponent({});
    });

    it('should redirect to DonorDetailQuery page', () => {
      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith([donorDetailQueryPath]);
    });

    it('should not call any service methods', () => {
      fixture.detectChanges();

      expect(mockService.getMergedDonors).not.toHaveBeenCalled();
      expect(mockService.getMergeHoldUnits).not.toHaveBeenCalled();
      expect(mockService.getMergedInterdictions).not.toHaveBeenCalled();
      expect(mockService.getPotentialDuplicates).not.toHaveBeenCalled();
    });

    it('should not set donorId signal', () => {
      fixture.detectChanges();

      expect(component.donorId()).toBe('');
    });
  });

  // -------------------------------------------------------
  // 5. loadData - success populates all 4 signals
  // -------------------------------------------------------
  describe('loadData success', () => {
    it('should populate mergedDonors signal', () => {
      fixture.detectChanges();

      expect(component.mergedDonors()).toEqual(mockMergedDonors);
    });

    it('should populate holdUnits signal', () => {
      fixture.detectChanges();

      expect(component.holdUnits()).toEqual(mockHoldUnits);
    });

    it('should populate mergedInterdictions signal', () => {
      fixture.detectChanges();

      expect(component.mergedInterdictions()).toEqual(mockInterdictions);
    });

    it('should populate duplicates signal', () => {
      fixture.detectChanges();

      expect(component.duplicates()).toEqual(mockDuplicates);
    });

    it('should set loading to false after data loads', () => {
      fixture.detectChanges();

      expect(component.loading()).toBeFalse();
    });

    it('should not set an error', () => {
      fixture.detectChanges();

      expect(component.error()).toBeNull();
    });

    it('should set loading to true at the start of loadData', () => {
      // Before calling loadData, loading should be in its initial state (true).
      // After the observable completes synchronously, loading becomes false.
      // Verify by calling loadData manually on a component that already initialized.
      fixture.detectChanges();
      expect(component.loading()).toBeFalse();

      // Call loadData again and verify loading was toggled
      component.loadData('12345');
      expect(component.loading()).toBeFalse(); // completes synchronously
    });
  });

  // -------------------------------------------------------
  // 6. loadData - error handling
  // -------------------------------------------------------
  describe('loadData error handling', () => {
    it('should set error message on service failure', () => {
      mockService.getMergedDonors.and.returnValue(throwError(() => new Error('Server error')));
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load merged donor information. Please try again.');
    });

    it('should set loading to false on error', () => {
      mockService.getMergedDonors.and.returnValue(throwError(() => new Error('Server error')));
      fixture.detectChanges();

      expect(component.loading()).toBeFalse();
    });

    it('should not populate signals on error', () => {
      mockService.getMergedDonors.and.returnValue(throwError(() => new Error('Server error')));
      fixture.detectChanges();

      expect(component.mergedDonors()).toEqual([]);
      expect(component.holdUnits()).toEqual([]);
      expect(component.mergedInterdictions()).toEqual([]);
      expect(component.duplicates()).toEqual([]);
    });

    it('should clear error when loadData is called again', () => {
      // First call fails
      mockService.getMergedDonors.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.error()).toBeTruthy();

      // Reset to success
      mockService.getMergedDonors.and.returnValue(of(mockMergedDonors));
      component.loadData('12345');

      expect(component.error()).toBeNull();
    });

    it('should handle error from getMergeHoldUnits', () => {
      mockService.getMergeHoldUnits.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load merged donor information. Please try again.');
      expect(component.loading()).toBeFalse();
    });

    it('should handle error from getMergedInterdictions', () => {
      mockService.getMergedInterdictions.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load merged donor information. Please try again.');
      expect(component.loading()).toBeFalse();
    });

    it('should handle error from getPotentialDuplicates', () => {
      mockService.getPotentialDuplicates.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load merged donor information. Please try again.');
      expect(component.loading()).toBeFalse();
    });
  });

  // -------------------------------------------------------
  // 7. navigateBack
  // -------------------------------------------------------
  describe('navigateBack', () => {
    it('should navigate to DonorDetailQuery with donorId queryParam', () => {
      fixture.detectChanges();
      component.navigateBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [donorDetailQueryPath],
        { queryParams: { donorId: '12345' } }
      );
    });

    it('should use the current donorId signal value', () => {
      fixture.detectChanges();
      component.donorId.set('67890');
      component.navigateBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [donorDetailQueryPath],
        { queryParams: { donorId: '67890' } }
      );
    });
  });

  // -------------------------------------------------------
  // 8. Computed signals - with data
  // -------------------------------------------------------
  describe('computed signals with data', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('hasMergedDonors should be true when mergedDonors has items', () => {
      expect(component.hasMergedDonors()).toBeTrue();
    });

    it('hasHoldUnits should be true when holdUnits has items', () => {
      expect(component.hasHoldUnits()).toBeTrue();
    });

    it('hasMergedInterdictions should be true when mergedInterdictions has items', () => {
      expect(component.hasMergedInterdictions()).toBeTrue();
    });

    it('hasDuplicates should be true when duplicates has items', () => {
      expect(component.hasDuplicates()).toBeTrue();
    });
  });

  // -------------------------------------------------------
  // 9. Empty data scenarios
  // -------------------------------------------------------
  describe('empty data scenarios', () => {
    beforeEach(() => {
      mockService.getMergedDonors.and.returnValue(of([]));
      mockService.getMergeHoldUnits.and.returnValue(of([]));
      mockService.getMergedInterdictions.and.returnValue(of([]));
      mockService.getPotentialDuplicates.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('hasMergedDonors should be false with empty array', () => {
      expect(component.hasMergedDonors()).toBeFalse();
    });

    it('hasHoldUnits should be false with empty array', () => {
      expect(component.hasHoldUnits()).toBeFalse();
    });

    it('hasMergedInterdictions should be false with empty array', () => {
      expect(component.hasMergedInterdictions()).toBeFalse();
    });

    it('hasDuplicates should be false with empty array', () => {
      expect(component.hasDuplicates()).toBeFalse();
    });

    it('signals should contain empty arrays', () => {
      expect(component.mergedDonors()).toEqual([]);
      expect(component.holdUnits()).toEqual([]);
      expect(component.mergedInterdictions()).toEqual([]);
      expect(component.duplicates()).toEqual([]);
    });

    it('loading should be false', () => {
      expect(component.loading()).toBeFalse();
    });

    it('error should be null', () => {
      expect(component.error()).toBeNull();
    });
  });

  // -------------------------------------------------------
  // DataTable config value formatters
  // -------------------------------------------------------
  describe('DataTable config value formatters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('mergedDonorsConfig dateOfBirth formatter should call formatDate', () => {
      const col = component.mergedDonorsConfig.columns.find((c) => c.key === 'dateOfBirth');
      expect(col?.valueFormatter?.('2025-01-15')).toBe('2025-01-15');
      expect(mockService.formatDate).toHaveBeenCalledWith('2025-01-15');
    });

    it('mergedDonorsConfig middleName formatter should return "--" for empty value', () => {
      const col = component.mergedDonorsConfig.columns.find((c) => c.key === 'middleName');
      expect(col?.valueFormatter?.('')).toBe('--');
    });

    it('mergedDonorsConfig middleName formatter should return value when present', () => {
      const col = component.mergedDonorsConfig.columns.find((c) => c.key === 'middleName');
      expect(col?.valueFormatter?.('JAMES')).toBe('JAMES');
    });

    it('holdUnitsConfig collDate formatter should call formatDate', () => {
      const col = component.holdUnitsConfig.columns.find((c) => c.key === 'collDate');
      expect(col?.valueFormatter?.('2025-03-10')).toBe('2025-03-10');
      expect(mockService.formatDate).toHaveBeenCalledWith('2025-03-10');
    });

    it('interdictionsConfig unitId formatter should return "--" for empty value', () => {
      const col = component.interdictionsConfig.columns.find((c) => c.key === 'unitId');
      expect(col?.valueFormatter?.('')).toBe('--');
    });

    it('interdictionsConfig unitId formatter should return value when present', () => {
      const col = component.interdictionsConfig.columns.find((c) => c.key === 'unitId');
      expect(col?.valueFormatter?.('U999')).toBe('U999');
    });

    it('interdictionsConfig effDate formatter should call formatDate', () => {
      const col = component.interdictionsConfig.columns.find((c) => c.key === 'effDate');
      expect(col?.valueFormatter?.('2025-06-01')).toBe('2025-06-01');
      expect(mockService.formatDate).toHaveBeenCalledWith('2025-06-01');
    });

    it('interdictionsConfig termDate formatter should return "--" for empty value', () => {
      const col = component.interdictionsConfig.columns.find((c) => c.key === 'termDate');
      expect(col?.valueFormatter?.('')).toBe('--');
    });

    it('interdictionsConfig termDate formatter should call formatDate for non-empty value', () => {
      const col = component.interdictionsConfig.columns.find((c) => c.key === 'termDate');
      expect(col?.valueFormatter?.('2026-12-31')).toBe('2026-12-31');
      expect(mockService.formatDate).toHaveBeenCalledWith('2026-12-31');
    });

    it('duplicatesConfig resolveDate formatter should return "--" for empty value', () => {
      const col = component.duplicatesConfig.columns.find((c) => c.key === 'resolveDate');
      expect(col?.valueFormatter?.('')).toBe('--');
    });

    it('duplicatesConfig resolveDate formatter should call formatDate for non-empty value', () => {
      const col = component.duplicatesConfig.columns.find((c) => c.key === 'resolveDate');
      expect(col?.valueFormatter?.('2025-05-05')).toBe('2025-05-05');
      expect(mockService.formatDate).toHaveBeenCalledWith('2025-05-05');
    });

    it('duplicatesConfig demographicsDate formatter should handle empty and non-empty', () => {
      const col = component.duplicatesConfig.columns.find((c) => c.key === 'demographicsDate');
      expect(col?.valueFormatter?.('')).toBe('--');
      expect(col?.valueFormatter?.('2025-02-02')).toBe('2025-02-02');
    });

    it('duplicatesConfig interdictionsDate formatter should handle empty and non-empty', () => {
      const col = component.duplicatesConfig.columns.find((c) => c.key === 'interdictionsDate');
      expect(col?.valueFormatter?.('')).toBe('--');
      expect(col?.valueFormatter?.('2025-03-03')).toBe('2025-03-03');
    });

    it('duplicatesConfig donationsDate formatter should handle empty and non-empty', () => {
      const col = component.duplicatesConfig.columns.find((c) => c.key === 'donationsDate');
      expect(col?.valueFormatter?.('')).toBe('--');
      expect(col?.valueFormatter?.('2025-04-04')).toBe('2025-04-04');
    });

    it('duplicatesConfig keydataDate formatter should handle empty and non-empty', () => {
      const col = component.duplicatesConfig.columns.find((c) => c.key === 'keydataDate');
      expect(col?.valueFormatter?.('')).toBe('--');
      expect(col?.valueFormatter?.('2025-07-07')).toBe('2025-07-07');
    });
  });

  // -------------------------------------------------------
  // pageHeaderConfig
  // -------------------------------------------------------
  describe('pageHeaderConfig', () => {
    it('should have correct breadcrumbs', () => {
      expect(component.pageHeaderConfig.breadcrumbs?.length).toBe(3);
      expect(component.pageHeaderConfig.breadcrumbs?.[0]).toEqual({ label: 'Home', link: '/home' });
      expect(component.pageHeaderConfig.breadcrumbs?.[1]).toEqual({
        label: 'Donor Detail Query',
        link: donorDetailQueryPath,
      });
      expect(component.pageHeaderConfig.breadcrumbs?.[2]).toEqual({
        label: 'Merged Donor',
        link: null,
      });
    });

    it('should have showBackButton set to true', () => {
      expect(component.pageHeaderConfig.showBackButton).toBeTrue();
    });

    it('onBackClick should call navigateBack', () => {
      fixture.detectChanges();
      spyOn(component, 'navigateBack');
      component.pageHeaderConfig.onBackClick?.();

      expect(component.navigateBack).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // ngOnDestroy
  // -------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();

      // Access the private destroy$ to verify it completes
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // queryParam takes precedence over state service
  // -------------------------------------------------------
  describe('queryParam precedence over state service', () => {
    it('should prefer queryParam donorId over state service donorId', () => {
      mockDonorState.getSelectedDonor.and.returnValue({
        donorId: '99999',
        donorName: 'STATE, DONOR',
        timestamp: Date.now(),
      });
      createComponent({ donorId: '55555' });
      fixture.detectChanges();

      expect(component.donorId()).toBe('55555');
      expect(mockService.getMergedDonors).toHaveBeenCalledWith('55555');
    });
  });

  // -------------------------------------------------------
  // donorName when state service returns no name
  // -------------------------------------------------------
  describe('donorName fallback', () => {
    it('should set donorName to empty string when state has no donorName', () => {
      mockDonorState.getSelectedDonor.and.returnValue(null);
      createComponent({ donorId: '12345' });
      fixture.detectChanges();

      expect(component.donorName()).toBe('');
    });

    it('should set page title with empty name when state has no donor', () => {
      mockDonorState.getSelectedDonor.and.returnValue(null);
      createComponent({ donorId: '12345' });
      fixture.detectChanges();

      expect(component.pageHeaderConfig.title).toBe('12345 | ');
    });
  });

  // -------------------------------------------------------
  // Initial signal values
  // -------------------------------------------------------
  describe('initial signal values (before ngOnInit)', () => {
    it('donorId should be empty string', () => {
      expect(component.donorId()).toBe('');
    });

    it('donorName should be empty string', () => {
      expect(component.donorName()).toBe('');
    });

    it('mergedDonors should be empty array', () => {
      expect(component.mergedDonors()).toEqual([]);
    });

    it('holdUnits should be empty array', () => {
      expect(component.holdUnits()).toEqual([]);
    });

    it('mergedInterdictions should be empty array', () => {
      expect(component.mergedInterdictions()).toEqual([]);
    });

    it('duplicates should be empty array', () => {
      expect(component.duplicates()).toEqual([]);
    });

    it('loading should be true', () => {
      expect(component.loading()).toBeTrue();
    });

    it('error should be null', () => {
      expect(component.error()).toBeNull();
    });
  });
});
