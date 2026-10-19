import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrivesFilterPanel } from './drives-filter-panel';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { DrivesService } from '../services/drives.service';

describe('DrivesFilterPanel', () => {
  let drivesServiceSpy: any;
  let component: DrivesFilterPanel;
  let fixture: ComponentFixture<DrivesFilterPanel>;
  let drivesService: jasmine.SpyObj<DrivesService>;

  beforeEach(() => {

    drivesServiceSpy = jasmine.createSpyObj('DrivesService', ['getGroupSitesForFilter', 'getDrivesForFilter', 'getDriveTypesForFilter']);
    drivesServiceSpy.getGroupSitesForFilter.and.returnValue(of({ data: [], total: 0 }));
    drivesServiceSpy.getDrivesForFilter.and.returnValue(of({ data: [], total: 0 }));
    drivesServiceSpy.getDriveTypesForFilter.and.returnValue(of({ data: [], total: 0 }));



      TestBed.configureTestingModule({
      imports: [
        DrivesFilterPanel,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DrivesService, useValue: drivesServiceSpy }
      ]
    });


    


      drivesServiceSpy.getGroupSitesForFilter.calls.reset();


      drivesServiceSpy.getDrivesForFilter.calls.reset();


      drivesServiceSpy.getDriveTypesForFilter.calls.reset();


      drivesServiceSpy.getGroupSitesForFilter.and.returnValue(of({ data: [], total: 0 }));


      drivesServiceSpy.getDrivesForFilter.and.returnValue(of({ data: [], total: 0 }));


      drivesServiceSpy.getDriveTypesForFilter.and.returnValue(of({ data: [], total: 0 }));


    drivesService = TestBed.inject(DrivesService) as jasmine.SpyObj<DrivesService>;
    fixture = TestBed.createComponent(DrivesFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should have period options without On option', () => {
    expect(component.periodOptions).toEqual(['After', 'Before']);
    expect(component.periodOptions).not.toContain('On');
  });

  it('should initialize with empty type options when API returns no data', () => {
    expect(component.typeOptions).toEqual([]);
  });

  it('should load type options on init', () => {
    expect(drivesService.getDriveTypesForFilter).toHaveBeenCalledWith({
      chapterId: undefined,
      fromDate: undefined,
      toDate: undefined
    });
  });

  it('should populate typeOptions when API returns data', () => {
    const mockTypes = [
      { driveType: 'F', driveTypeDescription: 'Fixed Site Drive' },
      { driveType: 'I', driveTypeDescription: 'Mobile Drive' }
    ];

    drivesService.getDriveTypesForFilter.and.returnValue(of({ data: mockTypes, total: 2 }));

    component.ngOnInit();

    expect(component.typeOptions.length).toBe(2);
    expect(component.typeOptions[0].value).toBe('F');
    expect(component.typeOptions[0].label).toBe('F - Fixed Site Drive');
  });

  it('should handle error when loading type options', () => {
    drivesService.getDriveTypesForFilter.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    component.ngOnInit();

    expect(component.typeOptions.length).toBe(0);
    expect(component.isLoadingTypes).toBeFalse();
  });







  it('should have all filter form fields', () => {
    expect(component.filterForm.get('type')).toBeTruthy();
    expect(component.filterForm.get('drive')).toBeTruthy();
    expect(component.filterForm.get('siteId')).toBeTruthy();
    expect(component.filterForm.get('period')).toBeTruthy();
    expect(component.filterForm.get('scheduledDate')).toBeTruthy();
  });

  it('should initialize with empty form values', () => {
    expect(component.filterForm.get('type')?.value).toBeNull();
    expect(component.filterForm.get('drive')?.value).toBeNull();
    expect(component.filterForm.get('siteId')?.value).toBeNull();
  });

  it('should load drive ID options on init', () => {
    expect(drivesService.getDrivesForFilter).toHaveBeenCalledWith({
      chapterId: undefined,
      fromDate: undefined,
      toDate: undefined
    });
  });

  it('should load site ID options on init', () => {
    expect(drivesService.getGroupSitesForFilter).toHaveBeenCalledWith({
      chapterId: undefined,
      fromDate: undefined,
      toDate: undefined
    });
  });

  it('should populate driveIdOptions when API returns data', () => {
    const mockDrives = [
      { drive: 'D001' },
      { drive: 'D002' }
    ];

    drivesService.getDrivesForFilter.and.returnValue(of({ data: mockDrives, total: 2 }));

    component.ngOnInit();

    expect(component.driveIdOptions.length).toBe(2);
    expect(component.driveIdOptions[0].value).toBe('D001');
    expect(component.driveIdOptions[0].label).toBe('D001');
  });

  it('should handle error when loading drive ID options', () => {
    drivesService.getDrivesForFilter.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    component.ngOnInit();

    expect(component.driveIdOptions.length).toBe(0);
    expect(component.isLoadingDriveIds).toBeFalse();
  });

  it('should populate siteIdOptions when API returns data', () => {
    const mockSites = [
      { groupSiteId: 'G00001', siteName: 'Site 1', chapterId: 'WAD' },
      { groupSiteId: 'G00002', siteName: 'Site 2', chapterId: 'WAD' }
    ];

    drivesService.getGroupSitesForFilter.and.returnValue(of({ data: mockSites, total: 2 }));

    component.ngOnInit();

    expect(component.siteIdOptions.length).toBe(2);
    expect(component.siteIdOptions[0].value).toBe('G00001');
    expect(component.siteIdOptions[0].label).toBe('G00001 - Site 1');
  });

  it('should handle error when loading site ID options', () => {
    drivesService.getGroupSitesForFilter.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    component.ngOnInit();

    expect(component.siteIdOptions.length).toBe(0);
    expect(component.isLoadingSiteIds).toBeFalse();
  });



  describe('Period Validation', () => {
    it('should show error when scheduled date is selected but period is not', () => {
      component.filterForm.patchValue({
        scheduledDate: new Date(),
        period: null
      });
      fixture.detectChanges();

      expect(component.filterForm.get('period')?.hasError('required')).toBeTrue();
      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should not show error when both scheduled date and period are selected', () => {
      component.filterForm.patchValue({
        scheduledDate: new Date(),
        period: 'After'
      });
      fixture.detectChanges();

      expect(component.filterForm.get('period')?.hasError('required')).toBeFalse();
      expect(component.hasValidationErrors).toBeFalse();
    });

    it('should not show error when neither scheduled date nor period are selected', () => {
      component.filterForm.patchValue({
        scheduledDate: null,
        period: null
      });
      fixture.detectChanges();

      expect(component.filterForm.get('period')?.hasError('required')).toBeFalsy();
    });

    it('should disable apply button when validation errors exist', () => {
      component.filterForm.patchValue({
        scheduledDate: new Date(),
        period: null // This should trigger validation error
      });
      fixture.detectChanges();

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('Selected Chapter ID Input', () => {
    it('should accept selectedChapterId as input', () => {
      component.selectedChapterId = 'WAD';
      expect(component.selectedChapterId).toBe('WAD');
    });

    it('should load site options with chapter ID when selectedChapterId is set', () => {
      drivesService.getGroupSitesForFilter.calls.reset();
      component.selectedChapterId = 'WAD';
      component.ngOnInit();

      expect(drivesService.getGroupSitesForFilter).toHaveBeenCalledWith({
        chapterId: 'WAD',
        fromDate: undefined,
        toDate: undefined
      });
    });

    it('should load all site options when selectedChapterId is null', () => {
      drivesService.getGroupSitesForFilter.calls.reset();
      component.selectedChapterId = null;
      component.ngOnInit();

      expect(drivesService.getGroupSitesForFilter).toHaveBeenCalledWith({
        chapterId: undefined,
        fromDate: undefined,
        toDate: undefined
      });
    });
  });

  describe('ngOnChanges - Chapter ID Changes', () => {
    it('should reload type, drive, and site options when selectedChapterId changes', () => {
      drivesService.getDriveTypesForFilter.calls.reset();
      drivesService.getDrivesForFilter.calls.reset();
      drivesService.getGroupSitesForFilter.calls.reset();

      component.selectedChapterId = 'WAD';
      component.ngOnChanges({
        selectedChapterId: {
          currentValue: 'WAD',
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(drivesService.getDriveTypesForFilter).toHaveBeenCalledWith({
        chapterId: 'WAD',
        fromDate: undefined,
        toDate: undefined
      });

      expect(drivesService.getDrivesForFilter).toHaveBeenCalledWith({
        chapterId: 'WAD',
        fromDate: undefined,
        toDate: undefined
      });

      expect(drivesService.getGroupSitesForFilter).toHaveBeenCalledWith({
        chapterId: 'WAD',
        fromDate: undefined,
        toDate: undefined
      });
    });

    it('should clear type, drive, and siteId selection when selectedChapterId changes', () => {
      component.filterForm.patchValue({ type: 'F', drive: 'D001', siteId: 'G00001' });

      component.selectedChapterId = 'CHI';
      component.ngOnChanges({
        selectedChapterId: {
          currentValue: 'CHI',
          previousValue: 'WAD',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.filterForm.get('type')?.value).toBeNull();
      expect(component.filterForm.get('drive')?.value).toBeNull();
      expect(component.filterForm.get('siteId')?.value).toBeNull();
    });



    it('should reload with undefined when selectedChapterId is cleared', () => {
      drivesService.getGroupSitesForFilter.calls.reset();

      component.selectedChapterId = null;
      component.ngOnChanges({
        selectedChapterId: {
          currentValue: null,
          previousValue: 'WAD',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(drivesService.getGroupSitesForFilter).toHaveBeenCalledWith({
        chapterId: undefined,
        fromDate: undefined,
        toDate: undefined
      });
    });

    it('should populate drive and site options after chapter change', () => {
      const mockDrives = [
        { drive: 'D003' },
        { drive: 'D004' }
      ];

      const mockSites = [
        { groupSiteId: 'G00003', siteName: 'New Site 1', chapterId: 'CHI' },
        { groupSiteId: 'G00004', siteName: 'New Site 2', chapterId: 'CHI' }
      ];

      drivesService.getDrivesForFilter.and.returnValue(of({ data: mockDrives, total: 2 }));
      drivesService.getGroupSitesForFilter.and.returnValue(of({ data: mockSites, total: 2 }));

      component.selectedChapterId = 'CHI';
      component.ngOnChanges({
        selectedChapterId: {
          currentValue: 'CHI',
          previousValue: 'WAD',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.driveIdOptions.length).toBe(2);
      expect(component.driveIdOptions[0].value).toBe('D003');
      expect(component.driveIdOptions[0].label).toBe('D003');

      expect(component.siteIdOptions.length).toBe(2);
      expect(component.siteIdOptions[0].value).toBe('G00003');
      expect(component.siteIdOptions[0].label).toBe('G00003 - New Site 1');
    });
  });
});
