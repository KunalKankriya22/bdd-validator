import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { GroupSitesFilterPanel } from './group-sites-filter-panel';
import { GroupSitesFilterValue, ChapterLookup } from '../models/group-sites.model';
import { GroupSitesService } from '../services/group-sites.service';

describe('GroupSitesFilterPanel', () => {
  let component: GroupSitesFilterPanel;
  let fixture: ComponentFixture<GroupSitesFilterPanel>;
  let mockGroupSitesService: jasmine.SpyObj<GroupSitesService>;

  const mockChapterLookups: ChapterLookup[] = [
    { chapterId: '01', chapterName: 'Chapter One' },
    { chapterId: '02', chapterName: 'Chapter Two' },
    { chapterId: '03', chapterName: 'Test Chapter' },
    { chapterId: '04', chapterName: 'Sample Chapter' }
  ];

  beforeEach(() => {

    mockGroupSitesService = jasmine.createSpyObj('GroupSitesService', [
      'getChapterIds',
      'getGroupSitesFilters'
    ]);

    // Default mock return value
    mockGroupSitesService.getChapterIds.and.returnValue(of(mockChapterLookups));



      TestBed.configureTestingModule({
      imports: [
        GroupSitesFilterPanel,
        ReactiveFormsModule,
        MatSelectModule,
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: GroupSitesService, useValue: mockGroupSitesService }
      ]
    });


    


      mockGroupSitesService.getChapterIds.calls.reset();


      mockGroupSitesService.getGroupSitesFilters.calls.reset();


      mockGroupSitesService.getChapterIds.and.returnValue(of(mockChapterLookups));


    fixture = TestBed.createComponent(GroupSitesFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should initialize form with null chapterId when no current filters', () => {
      component.currentFilters = null;
      fixture.detectChanges();

      expect(component.filterForm.get('chapterId')?.value).toBeNull();
    });

    it('should initialize form with current filter value', () => {
      const currentFilters: GroupSitesFilterValue = {
        chapterId: '01'
      };

      component.currentFilters = currentFilters;
      fixture.detectChanges();

      expect(component.filterForm.get('chapterId')?.value).toBe('01');
    });



    it('should load chapter options into signal', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.filteredChapterIds().length).toBe(4);
        expect(component.filteredChapterIds()[0].chapterId).toBe('01');
        expect(component.filteredChapterIds()[0].chapterName).toBe('Chapter One');
        done();
      }, 10);
    });
  });

  describe('Chapter Lookup Loading', () => {
    it('should set allChapterIds signal with loaded chapters', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        const chapters = component.filteredChapterIds();
        expect(chapters.length).toBe(4);
        expect(chapters).toEqual(mockChapterLookups);
        done();
      }, 10);
    });



    it('should handle service error gracefully', (done) => {
      mockGroupSitesService.getChapterIds.and.returnValue(
        throwError(() => new Error('Service error'))
      );
      fixture.detectChanges();

      setTimeout(() => {
        // Should set empty array on error
        expect(component.filteredChapterIds().length).toBe(0);
        done();
      }, 10);
    });

    it('should handle null response', (done) => {
      mockGroupSitesService.getChapterIds.and.returnValue(of(null as any));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.filteredChapterIds().length).toBe(0);
        done();
      }, 10);
    });
  });

  describe('Search Functionality', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(done, 10); // Wait for initial load
    });







    it('should filter case-insensitively by name', () => {
      component.chapterIdSearchControl.setValue('CHAPTER');

      const filtered = component.filteredChapterIds();
      expect(filtered.length).toBe(4); // All contain "Chapter"
    });

    it('should return multiple matches when searching by partial name', () => {
      component.chapterIdSearchControl.setValue('Chapter');

      const filtered = component.filteredChapterIds();
      expect(filtered.length).toBe(4);
    });

    it('should return specific match when searching by partial ID', () => {
      component.chapterIdSearchControl.setValue('0');

      const filtered = component.filteredChapterIds();
      expect(filtered.length).toBe(4); // All IDs start with '0'
    });



    it('should return all chapters when search is empty', () => {
      component.chapterIdSearchControl.setValue('');

      const filtered = component.filteredChapterIds();
      expect(filtered.length).toBe(4);
    });

    it('should return all chapters when search is null', () => {
      component.chapterIdSearchControl.setValue(null);

      const filtered = component.filteredChapterIds();
      expect(filtered.length).toBe(4);
    });

    it('should update filtered results when search term changes', () => {
      component.chapterIdSearchControl.setValue('01');
      expect(component.filteredChapterIds().length).toBe(1);

      component.chapterIdSearchControl.setValue('Chapter');
      expect(component.filteredChapterIds().length).toBe(4);

      component.chapterIdSearchControl.setValue('Sample');
      expect(component.filteredChapterIds().length).toBe(1);
      expect(component.filteredChapterIds()[0].chapterName).toBe('Sample Chapter');
    });
  });

  describe('Signal Behavior', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(done, 10);
    });

    it('should update chapterIdSearch signal when search control value changes', () => {
      component.chapterIdSearchControl.setValue('Test');

      // The signal should be updated through the valueChanges subscription
      // We can verify this indirectly through the computed signal
      const filtered = component.filteredChapterIds();
      expect(filtered.length).toBe(1);
    });

    it('should recompute filteredChapterIds when search signal changes', () => {
      const initialLength = component.filteredChapterIds().length;
      expect(initialLength).toBe(4);

      component.chapterIdSearchControl.setValue('01');
      const filteredLength = component.filteredChapterIds().length;
      expect(filteredLength).toBe(1);
    });
  });




  describe('isApplyDisabled', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(done, 10);
    });

    it('should return true when chapterId is null', () => {
      component.filterForm.patchValue({ chapterId: null });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when chapterId is undefined', () => {
      component.filterForm.patchValue({ chapterId: undefined });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when chapterId is set', () => {
      component.filterForm.patchValue({ chapterId: '01' });

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when chapterId is set to any valid string', () => {
      component.filterForm.patchValue({ chapterId: '99' });

      expect(component.isApplyDisabled).toBe(false);
    });
  });

  describe('Input properties', () => {
    it('should accept currentFilters input', () => {
      const filters: GroupSitesFilterValue = {
        chapterId: '03'
      };

      component.currentFilters = filters;
      expect(component.currentFilters).toEqual(filters);
    });


  });

  describe('Search Control Reset on Dropdown Close', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(done, 10);
    });

    it('should show all chapters when search is cleared', () => {
      component.chapterIdSearchControl.setValue('Test');
      expect(component.filteredChapterIds().length).toBe(1);

      // Simulate dropdown closing (when user clears search)
      component.chapterIdSearchControl.setValue('');

      expect(component.chapterIdSearchControl.value).toBe('');
      expect(component.filteredChapterIds().length).toBe(4);
    });
  });
  describe('Edge Cases', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(done, 10);
    });

    it('should handle search term with leading/trailing whitespace', () => {
      // The search doesn't trim, so '  Chapter  ' won't match 'Chapter One'
      // This test verifies that whitespace is preserved in the search
      component.chapterIdSearchControl.setValue('  Chapter  ');

      const filtered = component.filteredChapterIds();
      // No results expected because search includes spaces that don't match
      expect(filtered.length).toBe(0);
    });






  });
});
