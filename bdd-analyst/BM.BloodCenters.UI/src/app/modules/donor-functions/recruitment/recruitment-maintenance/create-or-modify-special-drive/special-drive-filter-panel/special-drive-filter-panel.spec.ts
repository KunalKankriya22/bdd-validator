import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, delay } from 'rxjs';
import { signal } from '@angular/core';

import { SpecialDriveFilterPanel } from './special-drive-filter-panel';
import { SpecialDriveService } from '../services/special-drive.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('SpecialDriveFilterPanelComponent', () => {
  let component: SpecialDriveFilterPanel;
  let fixture: ComponentFixture<SpecialDriveFilterPanel>;
  let mockSpecialDriveService: jasmine.SpyObj<SpecialDriveService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockDriveIds = [
    { driveId: 'DRV001' },
    { driveId: 'DRV002' },
    { driveId: 'DRV003' }
  ];

  const mockSponsors = [
    { sponsorId: 'SP001', name: 'Sponsor One' },
    { sponsorId: 'SP002', name: 'Sponsor Two' }
  ];

  const mockCategories = [
    { code: 'ROUTN', description: 'Routine' },
    { code: 'SPEC', description: 'Special' }
  ];

  beforeEach(() => {

    mockSpecialDriveService = jasmine.createSpyObj('SpecialDriveService', [
      'getDriveIds',
      'getSponsors',
      'getDriveCategories'
    ]);

    mockHeaderService = createMockHeaderService({ chapterId: signal('WAD') });



      TestBed.configureTestingModule({
imports: [
        SpecialDriveFilterPanel,
        ReactiveFormsModule
      ],
      providers: [
        { provide: SpecialDriveService, useValue: mockSpecialDriveService },
        { provide: HeaderService, useValue: mockHeaderService },
        provideNoopAnimations(),
        provideHttpClient()
      ]
    });


    });



  beforeEach(() => {


    mockSpecialDriveService.getDriveIds.and.returnValue(of(mockDriveIds));
    mockSpecialDriveService.getSponsors.and.returnValue(of(mockSponsors));
    mockSpecialDriveService.getDriveCategories.and.returnValue(of(mockCategories));

    fixture = TestBed.createComponent(SpecialDriveFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {

    it('should initialize the filter form with all fields', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('driveId')).toBeDefined();
      expect(component.filterForm.get('sponsorId')).toBeDefined();
      expect(component.filterForm.get('driveType')).toBeDefined();
      expect(component.filterForm.get('category')).toBeDefined();
      expect(component.filterForm.get('driveDate')).toBeDefined();
    });

    it('should load drive IDs on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSpecialDriveService.getDriveIds).toHaveBeenCalledWith('WAD');
      expect(component.driveIdOptionsSignal().length).toBe(3);
    }));

    it('should load sponsors on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSpecialDriveService.getSponsors).toHaveBeenCalledWith('WAD', '', 500, 0);
      expect(component.sponsorOptionsSignal().length).toBe(2);
    }));

    it('should load categories on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSpecialDriveService.getDriveCategories).toHaveBeenCalled();
      expect(component.categoryOptionsSignal().length).toBe(2);
    }));

    it('should initialize drive type options signal', () => {
      fixture.detectChanges();

      expect(component.driveTypeOptionsSignal().length).toBe(3);
      expect(component.driveTypeOptionsSignal()).toContainEqual({ value: 'F', label: 'Fixed' });
    });


    it('should store initial filter values on init when currentFilters has values', () => {
      const testDate = new Date('2026-04-15');
      component.currentFilters = {
        driveId: 'DRV001',
        sponsorId: 'SP001',
        driveType: 'F',
        category: 'ROUTN',
        driveDate: testDate
      };

      fixture.detectChanges();

      expect(component['initialFilterValues']).toEqual({
        driveId: 'DRV001',
        sponsorId: 'SP001',
        driveType: 'F',
        category: 'ROUTN',
        driveDate: testDate
      });
    });
  });
  describe('Signal-based Reactive Properties', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should compute filteredDriveIdOptions correctly', fakeAsync(() => {
      tick();

      const filtered = component.filteredDriveIdOptions();
      expect(filtered.length).toBe(3);
    }));


    it('should compute filteredSponsorOptions correctly', fakeAsync(() => {
      tick();

      const filtered = component.filteredSponsorOptions();
      expect(filtered.length).toBe(2);
    }));



    it('should compute filteredDriveTypeOptions correctly', () => {
      const filtered = component.filteredDriveTypeOptions();
      expect(filtered.length).toBe(3);
    });


    it('should compute filteredCategoryOptions correctly', fakeAsync(() => {
      tick();

      const filtered = component.filteredCategoryOptions();
      expect(filtered.length).toBe(2);
    }));


  });
  describe('Error Handling', () => {
    it('should handle error loading drive IDs', fakeAsync(() => {
      mockSpecialDriveService.getDriveIds.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      spyOn(console, 'error');
      component['loadDriveIds']();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error loading drive IDs:', jasmine.any(Error));
      expect(component.driveIdOptionsSignal()).toEqual([]);
      expect(component.isLoadingDriveIds).toBe(false);
    }));

    it('should handle error loading sponsors', fakeAsync(() => {
      mockSpecialDriveService.getSponsors.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      spyOn(console, 'error');
      component['loadSponsors']();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error loading sponsors:', jasmine.any(Error));
      expect(component.sponsorOptionsSignal()).toEqual([]);
      expect(component.isLoadingSponsors).toBe(false);
    }));

    it('should handle error loading categories', fakeAsync(() => {
      mockSpecialDriveService.getDriveCategories.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      spyOn(console, 'error');
      component['loadCategories']();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error loading categories:', jasmine.any(Error));
      expect(component.categoryOptionsSignal()).toEqual([]);
      expect(component.isLoadingCategories).toBe(false);
    }));

    it('should warn when chapter ID is missing for drive IDs', () => {
      Object.defineProperty(mockHeaderService, 'chapterId', {
        get: () => signal(null)
      });

      spyOn(console, 'warn');
      component['loadDriveIds']();

      expect(console.warn).toHaveBeenCalledWith('No chapter ID available for loading drive IDs');
      expect(mockSpecialDriveService.getDriveIds).not.toHaveBeenCalled();
    });

    it('should warn when chapter ID is missing for sponsors', () => {
      Object.defineProperty(mockHeaderService, 'chapterId', {
        get: () => signal(null)
      });

      spyOn(console, 'warn');
      component['loadSponsors']();

      expect(console.warn).toHaveBeenCalledWith('No chapter ID available for loading sponsors');
      expect(mockSpecialDriveService.getSponsors).not.toHaveBeenCalled();
    });
  });

  describe('Apply Button State - hasFilterChanged()', () => {
    describe('when opened with no initial filters', () => {
      beforeEach(() => {
        component.currentFilters = null;
        fixture.detectChanges();
      });

      it('should return false when form is empty (no changes)', () => {
        expect(component.hasFilterChanged()).toBe(false);
      });

      it('should return true when user enters a drive ID', () => {
        component.filterForm.patchValue({ driveId: 'DRV001' });
        expect(component.hasFilterChanged()).toBe(true);
      });

      it('should return true when user selects a sponsor', () => {
        component.filterForm.patchValue({ sponsorId: 'SP001' });
        expect(component.hasFilterChanged()).toBe(true);
      });

      it('should return true when user selects a drive type', () => {
        component.filterForm.patchValue({ driveType: 'F' });
        expect(component.hasFilterChanged()).toBe(true);
      });

      it('should return true when user selects a category', () => {
        component.filterForm.patchValue({ category: 'ROUTN' });
        expect(component.hasFilterChanged()).toBe(true);
      });

      it('should return true when user selects a date', () => {
        component.filterForm.patchValue({ driveDate: new Date('2026-04-15') });
        expect(component.hasFilterChanged()).toBe(true);
      });
    });

    describe('when reopened with existing filters', () => {
      beforeEach(() => {
        component.currentFilters = {
          driveId: 'DRV001',
          sponsorId: 'SP001',
          driveType: 'F',
          category: null,
          driveDate: null
        };
        fixture.detectChanges();
      });

      it('should return false when no changes made (same as initial)', () => {
        expect(component.hasFilterChanged()).toBe(false);
      });

      it('should return true when drive ID is changed', () => {
        component.filterForm.patchValue({ driveId: 'DRV002' });
        expect(component.hasFilterChanged()).toBe(true);
      });

      it('should return true when sponsor is changed', () => {
        component.filterForm.patchValue({ sponsorId: 'SP002' });
        expect(component.hasFilterChanged()).toBe(true);
      });

      it('should return true when drive type is changed', () => {
        component.filterForm.patchValue({ driveType: 'C' });
        expect(component.hasFilterChanged()).toBe(true);
      });

      it('should return true when a null field is given a value', () => {
        component.filterForm.patchValue({ category: 'ROUTN' });
        expect(component.hasFilterChanged()).toBe(true);
      });

      it('should return true when a field is cleared', () => {
        component.filterForm.patchValue({ driveId: '' });
        expect(component.hasFilterChanged()).toBe(true);
      });

    });

    describe('normalization of empty strings and null', () => {
      it('should treat empty string and null as equivalent', () => {
        component.currentFilters = { driveId: null, sponsorId: null, driveType: null, category: null, driveDate: null };
        fixture.detectChanges();

        component.filterForm.patchValue({ driveId: '' });
        expect(component.hasFilterChanged()).toBe(false);
      });

      it('should treat undefined and null as equivalent', () => {
        component.currentFilters = { driveId: undefined, sponsorId: null, driveType: null, category: null, driveDate: null };
        fixture.detectChanges();

        expect(component.hasFilterChanged()).toBe(false);
      });
    });

    describe('after clear button clicked', () => {
      beforeEach(() => {
        component.currentFilters = {
          driveId: 'DRV001',
          sponsorId: 'SP001',
          driveType: null,
          category: null,
          driveDate: null
        };
        fixture.detectChanges();
      });

      it('should return false after clearing (initial values reset)', () => {
        component.onClear();
        expect(component.hasFilterChanged()).toBe(false);
      });

      it('should return true after clearing and entering new value', () => {
        component.onClear();
        component.filterForm.patchValue({ driveId: 'DRV002' });
        expect(component.hasFilterChanged()).toBe(true);
      });
    });
  });

  describe('getSelectedSponsorName()', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return sponsor name when a valid sponsorId is selected', () => {
      component.filterForm.patchValue({ sponsorId: 'SP001' });
      expect(component.getSelectedSponsorName()).toBe('Sponsor One');
    });

    it('should return empty string when no sponsorId is selected', () => {
      component.filterForm.patchValue({ sponsorId: '' });
      expect(component.getSelectedSponsorName()).toBe('');
    });

    it('should return empty string when sponsorId does not match any sponsor', () => {
      component.filterForm.patchValue({ sponsorId: 'INVALID' });
      expect(component.getSelectedSponsorName()).toBe('');
    });
  });

  describe('onApply()', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filters with null for empty string values', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        driveId: '',
        sponsorId: '',
        driveType: '',
        category: '',
        driveDate: null
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

    it('should emit filters with actual values when form has data', () => {
      spyOn(component.apply, 'emit');
      const testDate = new Date('2026-04-15');
      component.filterForm.patchValue({
        driveId: 'DRV001',
        sponsorId: 'SP001',
        driveType: 'F',
        category: 'ROUTN',
        driveDate: testDate
      });
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalledWith({
        driveId: 'DRV001',
        sponsorId: 'SP001',
        driveType: 'F',
        category: 'ROUTN',
        driveDate: testDate
      });
    });
  });

  describe('onClose()', () => {
    it('should emit close event', () => {
      fixture.detectChanges();
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy()', () => {
    it('should call destroy$.next() and destroy$.complete()', () => {
      fixture.detectChanges();
      const destroyNext = spyOn(component['destroy$'], 'next');
      const destroyComplete = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroyNext).toHaveBeenCalled();
      expect(destroyComplete).toHaveBeenCalled();
    });
  });

  describe('Filtered options with search terms', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter drive ID options by search term', () => {
      component.driveIdSearchCtrl.setValue('001');
      const filtered = component.filteredDriveIdOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].driveId).toBe('DRV001');
    });

    it('should filter sponsor options by sponsor name', () => {
      component.sponsorIdSearchCtrl.setValue('one');
      const filtered = component.filteredSponsorOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Sponsor One');
    });

    it('should filter sponsor options by sponsor ID', () => {
      component.sponsorIdSearchCtrl.setValue('sp002');
      const filtered = component.filteredSponsorOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].sponsorId).toBe('SP002');
    });

    it('should filter drive type options by label', () => {
      component.driveTypeSearchCtrl.setValue('fix');
      const filtered = component.filteredDriveTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].label).toBe('Fixed');
    });

    it('should filter category options by description', () => {
      component.categorySearchCtrl.setValue('routine');
      const filtered = component.filteredCategoryOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].description).toBe('Routine');
    });

    it('should filter category options by code', () => {
      component.categorySearchCtrl.setValue('spec');
      const filtered = component.filteredCategoryOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('SPEC');
    });

    it('should return empty array when search term matches nothing', () => {
      component.driveIdSearchCtrl.setValue('nonexistent');
      expect(component.filteredDriveIdOptions().length).toBe(0);
    });
  });
});
