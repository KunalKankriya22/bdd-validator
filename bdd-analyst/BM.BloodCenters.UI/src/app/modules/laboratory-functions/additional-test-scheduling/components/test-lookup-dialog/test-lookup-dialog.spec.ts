import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { TestLookupDialogComponent } from './test-lookup-dialog';
import { AdditionalTestSchedulingApiService } from '../../services/additional-test-scheduling-api.service';
import { ValidTestDto, TestGroupDto } from '../../models/additional-test-scheduling.model';

describe('TestLookupDialogComponent', () => {
  let component: TestLookupDialogComponent;
  let fixture: ComponentFixture<TestLookupDialogComponent>;
  let apiServiceSpy: jasmine.SpyObj<AdditionalTestSchedulingApiService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<TestLookupDialogComponent>>;

  const mockTests: ValidTestDto[] = [
    {
      testId: 'COVID01',
      testDesc: 'COVID-19 Antibody Test',
      testGroup: 'TSTGRP1',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null
    },
    {
      testId: 'HCV001',
      testDesc: 'Hepatitis C Virus Test',
      testGroup: 'TSTGRP1',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null
    },
    {
      testId: 'HIV001',
      testDesc: 'HIV Antibody Test',
      testGroup: 'TSTGRP2',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null
    }
  ];

  const mockTestGroups: TestGroupDto[] = [
    { testGroup: 'TSTGRP1', description: 'Infectious Disease Tests' },
    { testGroup: 'TSTGRP2', description: 'Blood Type Tests' }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('AdditionalTestSchedulingApiService', [
      'getValidTests',
      'getTestGroups'
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    apiServiceSpy.getValidTests.and.returnValue(
      of({ data: mockTests, totalCount: 3 })
    );
    apiServiceSpy.getTestGroups.and.returnValue(of(mockTestGroups));



      TestBed.configureTestingModule({
      imports: [TestLookupDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: AdditionalTestSchedulingApiService, useValue: apiServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { selectedTests: [] } }
      ]
    });


    


      apiServiceSpy.getValidTests.calls.reset();


      apiServiceSpy.getTestGroups.calls.reset();


      dialogRefSpy.close.calls.reset();


      apiServiceSpy.getTestGroups.and.returnValue(of(mockTestGroups));


    fixture = TestBed.createComponent(TestLookupDialogComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {




    it('should load test groups on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getTestGroups).toHaveBeenCalled();
      expect(component.testGroups().length).toBe(2);
    }));

    it('should load tests on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getValidTests).toHaveBeenCalled();
      expect(component.tests().length).toBe(3);
    }));

    it('should initialize with previously selected tests', fakeAsync(() => {
      TestBed.resetTestingModule();
      apiServiceSpy = jasmine.createSpyObj('AdditionalTestSchedulingApiService', [
        'getValidTests',
        'getTestGroups'
      ]);
      apiServiceSpy.getValidTests.and.returnValue(
        of({ data: mockTests, totalCount: 3 })
      );
      apiServiceSpy.getTestGroups.and.returnValue(of(mockTestGroups));

      TestBed.configureTestingModule({
        imports: [TestLookupDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: AdditionalTestSchedulingApiService, useValue: apiServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          {
            provide: MAT_DIALOG_DATA,
            useValue: { selectedTests: [mockTests[0]] }
          }
        ]
      });

      const newFixture = TestBed.createComponent(TestLookupDialogComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.selectedTests().has('COVID01')).toBeTrue();
      expect(newComponent.selectionCount()).toBe(1);
    }));
  });







  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by test group', fakeAsync(() => {
      apiServiceSpy.getValidTests.calls.reset();

      component.filterForm.patchValue({ testGroup: 'TSTGRP1' });
      component.onTestGroupChange();
      tick();

      expect(apiServiceSpy.getValidTests).toHaveBeenCalledWith(
        10,
        0,
        jasmine.objectContaining({ testGroup: 'TSTGRP1' })
      );
    }));

    it('should filter by search keyword with debounce', fakeAsync(() => {
      apiServiceSpy.getValidTests.calls.reset();

      component.filterForm.patchValue({ searchKeyword: 'COVID' });
      tick(400); // Wait for debounce

      expect(apiServiceSpy.getValidTests).toHaveBeenCalledWith(
        10,
        0,
        jasmine.objectContaining({ searchKeyword: 'COVID' })
      );
    }));



    it('should clear filters on clear button click', fakeAsync(() => {
      component.filterForm.patchValue({
        testGroup: 'TSTGRP1',
        searchKeyword: 'COVID'
      });
      component.pageIndex.set(2);

      component.onClearFilters();
      tick();

      expect(component.filterForm.value.testGroup).toBeNull();
      expect(component.filterForm.value.searchKeyword).toBe('');
      expect(component.pageIndex()).toBe(0);
    }));
  });



  describe('Test Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle test selection', () => {
      component.onTestToggle('COVID01');
      expect(component.isTestSelected('COVID01')).toBeTrue();

      component.onTestToggle('COVID01');
      expect(component.isTestSelected('COVID01')).toBeFalse();
    });

    it('should select all visible tests on master toggle', () => {
      component['tests'].set(mockTests);
      component.onMasterToggle();

      expect(component.isTestSelected('COVID01')).toBeTrue();
      expect(component.isTestSelected('HCV001')).toBeTrue();
      expect(component.isTestSelected('HIV001')).toBeTrue();
    });

    it('should deselect all visible tests on master toggle when all selected', () => {
      component['tests'].set(mockTests);
      component.onMasterToggle(); // Select all
      component.onMasterToggle(); // Deselect all

      expect(component.isTestSelected('COVID01')).toBeFalse();
      expect(component.isTestSelected('HCV001')).toBeFalse();
      expect(component.isTestSelected('HIV001')).toBeFalse();
    });



    it('should show selection info when tests selected', () => {
      component['selectedTests'].set(new Set(['COVID01']));
      fixture.detectChanges();

      const selectionInfo = fixture.debugElement.query(By.css('.selection-info'));
      expect(selectionInfo).toBeTruthy();
      expect(selectionInfo.nativeElement.textContent).toContain('1 test(s) selected');
    });
  });



  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should have proper ARIA labels on checkboxes', () => {
      component['tests'].set([mockTests[0]]);
      fixture.detectChanges();

      const checkbox = fixture.debugElement.query(
        By.css(`mat-checkbox[id*="select-COVID01"]`)
      );
      expect(checkbox).toBeTruthy();
      // Verify the checkbox has a unique, descriptive ID for accessibility
      expect(checkbox.nativeElement.id).toContain('select-COVID01');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update page size and index on page change', fakeAsync(() => {
      apiServiceSpy.getValidTests.calls.reset();

      component.onPageChange({ pageSize: 25, pageIndex: 2, length: 100, previousPageIndex: 1 });
      tick();

      expect(component.pageSize()).toBe(25);
      expect(component.pageIndex()).toBe(2);
      expect(apiServiceSpy.getValidTests).toHaveBeenCalledWith(25, 50, jasmine.any(Object));
    }));

    it('should reset page index when test group changes', fakeAsync(() => {
      component.pageIndex.set(3);
      component.onTestGroupChange();
      tick();

      expect(component.pageIndex()).toBe(0);
    }));
  });

  describe('Dialog Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close dialog with selected tests on confirm', () => {
      component['tests'].set(mockTests);
      component['selectedTests'].set(new Set(['COVID01', 'HCV001']));

      component.onConfirm();

      expect(dialogRefSpy.close).toHaveBeenCalled();
      const closeArg = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(closeArg.length).toBe(2);
      expect(closeArg.map((t: any) => t.testId)).toContain('COVID01');
      expect(closeArg.map((t: any) => t.testId)).toContain('HCV001');
    });

    it('should close dialog with null on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });

    it('should merge previously selected tests with current page selections on confirm', fakeAsync(() => {
      TestBed.resetTestingModule();
      apiServiceSpy = jasmine.createSpyObj('AdditionalTestSchedulingApiService', [
        'getValidTests',
        'getTestGroups'
      ]);
      apiServiceSpy.getValidTests.and.returnValue(of({ data: mockTests, totalCount: 3 }));
      apiServiceSpy.getTestGroups.and.returnValue(of(mockTestGroups));

      TestBed.configureTestingModule({
        imports: [TestLookupDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: AdditionalTestSchedulingApiService, useValue: apiServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { selectedTests: [mockTests[0]] } }
        ]
      });

      const newFixture = TestBed.createComponent(TestLookupDialogComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      newComponent.onTestToggle('HCV001');
      newComponent.onConfirm();

      const closeArg = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(closeArg.length).toBe(2);
    }));
  });

  describe('Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should compute isEmpty correctly', () => {
      component['tests'].set([]);
      component['loading'].set(false);
      expect(component['isEmpty']()).toBeTrue();

      component['tests'].set(mockTests);
      expect(component['isEmpty']()).toBeFalse();
    });

    it('should compute hasSelection correctly', () => {
      expect(component['hasSelection']()).toBeFalse();

      component['selectedTests'].set(new Set(['COVID01']));
      expect(component['hasSelection']()).toBeTrue();
    });

    it('should compute isSomeSelected correctly', () => {
      component['tests'].set(mockTests);

      component['selectedTests'].set(new Set(['COVID01']));
      expect(component.isSomeSelected()).toBeTrue();

      component.onMasterToggle();
      expect(component.isSomeSelected()).toBeFalse();
    });

    it('should filter test groups by search text', () => {
      component['testGroups'].set(mockTestGroups);
      component['testGroupSearchCtrl'].setValue('infectious');

      const filtered = component['filteredTestGroups']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].testGroup).toBe('TSTGRP1');
    });

    it('should return all groups when search is empty', () => {
      component['testGroups'].set(mockTestGroups);
      component['testGroupSearchCtrl'].setValue('');

      expect(component['filteredTestGroups']().length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle API error when loading tests', fakeAsync(() => {
      fixture.detectChanges(); // trigger ngOnInit to initialize filterForm
      apiServiceSpy.getValidTests.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component['loadTests']();
      tick();

      expect(component['error']()).toBe('API Error');
      expect(component['loading']()).toBeFalse();
    }));

    it('should handle API error when loading test groups', fakeAsync(() => {
      fixture.detectChanges(); // trigger ngOnInit to initialize filterForm
      apiServiceSpy.getTestGroups.and.returnValue(
        throwError(() => new Error('Failed to load test groups'))
      );

      component['loadTestGroups']();
      tick();

      // loadTestGroups silently handles errors by setting empty groups
      expect(component['testGroups']().length).toBe(0);
    }));
  });
});
