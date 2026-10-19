import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { of, throwError } from 'rxjs';
import { SpecialDriveFilterPanel, SpecialDriveFilterValue } from './special-drive-filter-panel';
import { SpecialDriveService } from '../services/special-drive.service';
import { HeaderService } from '@shared/services/header.service';
import { signal } from '@angular/core';

describe('SpecialDriveFilterPanel', () => {
  let component: SpecialDriveFilterPanel;
  let fixture: ComponentFixture<SpecialDriveFilterPanel>;
  let mockSpecialDriveService: jasmine.SpyObj<SpecialDriveService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(async () => {
    mockSpecialDriveService = jasmine.createSpyObj('SpecialDriveService', [
      'getDriveIds',
      'getSponsors',
      'getDriveCategories'
    ]);
    mockSpecialDriveService.getDriveIds.and.returnValue(of([
      { driveId: 'DRV001' },
      { driveId: 'DRV002' }
    ] as any));
    mockSpecialDriveService.getSponsors.and.returnValue(of([
      { sponsorId: 'SP001', name: 'Sponsor A' },
      { sponsorId: 'SP002', name: 'Sponsor B' }
    ] as any));
    mockSpecialDriveService.getDriveCategories.and.returnValue(of([
      { code: 'CAT1', description: 'Category 1' },
      { code: 'CAT2', description: 'Category 2' }
    ] as any));

    mockHeaderService = jasmine.createSpyObj('HeaderService', [], {
      chapterId: signal('CH01')
    });

    await TestBed.configureTestingModule({
      imports: [
        SpecialDriveFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SpecialDriveService, useValue: mockSpecialDriveService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialDriveFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with empty string defaults', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('driveId')?.value).toBe('');
      expect(component.filterForm.get('sponsorId')?.value).toBe('');
      expect(component.filterForm.get('driveType')?.value).toBe('');
      expect(component.filterForm.get('category')?.value).toBe('');
      expect(component.filterForm.get('driveDate')?.value).toBeNull();
    });

    it('should populate form from currentFilters', () => {
      component.currentFilters = {
        driveId: 'DRV001',
        sponsorId: 'SP001',
        driveType: 'F',
        category: 'CAT1',
        driveDate: null
      };
      fixture.detectChanges();

      expect(component.filterForm.get('driveId')?.value).toBe('DRV001');
      expect(component.filterForm.get('sponsorId')?.value).toBe('SP001');
      expect(component.filterForm.get('driveType')?.value).toBe('F');
      expect(component.filterForm.get('category')?.value).toBe('CAT1');
    });

    it('should load filter options from service', () => {
      fixture.detectChanges();

      expect(mockSpecialDriveService.getDriveIds).toHaveBeenCalledWith('CH01');
      expect(mockSpecialDriveService.getSponsors).toHaveBeenCalledWith('CH01', '', 500, 0);
      expect(mockSpecialDriveService.getDriveCategories).toHaveBeenCalled();
      expect(component.driveIdOptionsSignal().length).toBe(2);
      expect(component.sponsorOptionsSignal().length).toBe(2);
      expect(component.categoryOptionsSignal().length).toBe(2);
    });

    it('should handle service errors gracefully', () => {
      mockSpecialDriveService.getDriveIds.and.returnValue(throwError(() => new Error('fail')));
      mockSpecialDriveService.getSponsors.and.returnValue(throwError(() => new Error('fail')));
      mockSpecialDriveService.getDriveCategories.and.returnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();

      expect(component.driveIdOptionsSignal()).toEqual([]);
      expect(component.sponsorOptionsSignal()).toEqual([]);
      expect(component.categoryOptionsSignal()).toEqual([]);
    });

    it('should have drive type options', () => {
      fixture.detectChanges();

      expect(component.driveTypeOptions).toEqual([
        { value: 'F', label: 'Fixed' },
        { value: 'I', label: 'Inside' },
        { value: 'C', label: 'Coach' }
      ]);
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filter values on apply', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ driveId: 'DRV001' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        driveId: 'DRV001',
        sponsorId: null,
        driveType: null,
        category: null,
        driveDate: null
      }));
    });

    it('should emit null for empty string values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        driveId: '',
        sponsorId: '',
        driveType: '',
        category: ''
      });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        driveId: null,
        sponsorId: null,
        driveType: null,
        category: null,
        driveDate: null
      });
    });

    it('should include driveDate when set', () => {
      spyOn(component.apply, 'emit');

      const testDate = new Date('2025-06-15');
      component.filterForm.patchValue({
        driveId: 'DRV001',
        driveDate: testDate
      });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        driveId: 'DRV001',
        driveDate: testDate
      }));
    });
  });

  describe('Clear Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls on clear', () => {
      component.filterForm.patchValue({
        driveId: 'DRV001',
        sponsorId: 'SP001',
        driveType: 'F',
        category: 'CAT1',
        driveDate: new Date()
      });

      component.onClear();

      expect(component.filterForm.get('driveId')?.value).toBe('');
      expect(component.filterForm.get('sponsorId')?.value).toBe('');
      expect(component.filterForm.get('driveType')?.value).toBe('');
      expect(component.filterForm.get('category')?.value).toBe('');
      expect(component.filterForm.get('driveDate')?.value).toBeNull();
    });

    it('should reset initial filter values to null', () => {
      component.onClear();

      expect((component as any).initialFilterValues).toEqual({
        driveId: null,
        sponsorId: null,
        driveType: null,
        category: null,
        driveDate: null
      });
    });
  });

  describe('Close', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('hasFilterChanged', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when no changes from initial', () => {
      expect(component.hasFilterChanged()).toBeFalse();
    });

    it('should return true when driveId is changed', () => {
      component.filterForm.patchValue({ driveId: 'DRV001' });

      expect(component.hasFilterChanged()).toBeTrue();
    });

    it('should return true when driveType is changed', () => {
      component.filterForm.patchValue({ driveType: 'F' });

      expect(component.hasFilterChanged()).toBeTrue();
    });
  });

  describe('getSelectedSponsorName', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return sponsor name for selected sponsor', () => {
      component.filterForm.patchValue({ sponsorId: 'SP001' });

      expect(component.getSelectedSponsorName()).toBe('Sponsor A');
    });

    it('should return empty string when no sponsor selected', () => {
      expect(component.getSelectedSponsorName()).toBe('');
    });

    it('should return empty string for unknown sponsor ID', () => {
      component.filterForm.patchValue({ sponsorId: 'UNKNOWN' });

      expect(component.getSelectedSponsorName()).toBe('');
    });
  });

  describe('Search Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter drive IDs by search term', () => {
      component.driveIdSearchCtrl.setValue('DRV001');

      const filtered = component.filteredDriveIdOptions();
      expect(filtered.length).toBe(1);
    });

    it('should filter sponsors by search term on name', () => {
      component.sponsorIdSearchCtrl.setValue('Sponsor A');

      const filtered = component.filteredSponsorOptions();
      expect(filtered.length).toBe(1);
    });

    it('should filter categories by search term on code', () => {
      component.categorySearchCtrl.setValue('CAT1');

      const filtered = component.filteredCategoryOptions();
      expect(filtered.length).toBe(1);
    });

    it('should show all options when search is empty', () => {
      component.driveIdSearchCtrl.setValue('');

      expect(component.filteredDriveIdOptions().length).toBe(2);
    });
  });
});
