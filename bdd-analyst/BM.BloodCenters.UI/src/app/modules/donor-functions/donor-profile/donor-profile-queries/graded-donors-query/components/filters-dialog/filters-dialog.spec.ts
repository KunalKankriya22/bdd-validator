import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FiltersDialogComponent, FiltersDialogData } from './filters-dialog';

describe('FiltersDialogComponent', () => {
  let component: FiltersDialogComponent;
  let fixture: ComponentFixture<FiltersDialogComponent>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        FiltersDialogComponent,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        NoopAnimationsModule
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(FiltersDialogComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {

    it('should patch form with current filters on init', () => {
      component.currentFilters = { sex: 'Male', status: 'Active' };
      component.ngOnInit();
      expect(component.filterForm.value).toEqual({ sex: 'Male', status: 'Active' });
    });

    it('should set sex options from input', () => {
      component.availableSexOptions = ['Male', 'Female'];
      component.ngOnInit();
      expect(component.sexOptions).toEqual(['Male', 'Female']);
    });


    it('should convert undefined current filters to empty strings', () => {
      component.currentFilters = { sex: undefined, status: undefined };
      component.ngOnInit();
      expect(component.filterForm.value).toEqual({ sex: '', status: '' });
    });
  });

  describe('Apply Button State (isApplyDisabled getter)', () => {
    beforeEach(() => {
      component.ngOnInit();
    });










    it('should update when form value changes', () => {
      // Initially disabled
      component.filterForm.patchValue({ sex: '', status: '' });
      expect(component.isApplyDisabled).toBe(true);

      // Enable after setting a value
      component.filterForm.patchValue({ sex: 'Male', status: '' });
      expect(component.isApplyDisabled).toBe(false);

      // Disable after clearing
      component.filterForm.patchValue({ sex: '', status: '' });
      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('Reopening with existing filters (bug fix scenario)', () => {



    it('should disable Apply button when reopened with no filters (All/All)', () => {
      // Simulate reopening filter panel with no active filters
      component.currentFilters = { sex: 'All', status: 'All' };
      component.ngOnInit();

      // Apply button should be disabled
      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('Form Actions', () => {
    beforeEach(() => {
      component.ngOnInit();
    });


    it('should emit apply event with current form values', () => {
      const applySpy = spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ sex: 'Female', status: 'Inactive' });
      component.onApply();
      expect(applySpy).toHaveBeenCalledWith({ sex: 'Female', status: 'Inactive' });
    });

  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle null filter values', () => {
      component.filterForm.patchValue({ sex: null, status: null });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should handle undefined filter values', () => {
      component.filterForm.patchValue({ sex: undefined, status: undefined });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should normalize "All" as no filter', () => {
      component.filterForm.patchValue({ sex: 'All', status: 'All' });
      expect(component.isApplyDisabled).toBe(true);
    });

  });

  describe('Integration with parent component', () => {
    it('should accept filter data from parent via Input', () => {
      const filterData: FiltersDialogData = {
        sex: 'Male',
        status: 'Active',
        availableSexOptions: ['Male', 'Female'],
        availableStatusOptions: ['Active', 'Inactive']
      };

      component.currentFilters = filterData;
      component.availableSexOptions = filterData.availableSexOptions!;
      component.availableStatusOptions = filterData.availableStatusOptions!;
      component.ngOnInit();

      expect(component.filterForm.value).toEqual({ sex: 'Male', status: 'Active' });
      expect(component.sexOptions).toEqual(['Male', 'Female']);
      expect(component.statusOptions).toEqual(['Active', 'Inactive']);
    });

    it('should emit properly formatted data on apply', () => {
      const applySpy = spyOn(component.apply, 'emit');
      component.ngOnInit();
      component.filterForm.patchValue({ sex: 'Female', status: '' });
      component.onApply();

      expect(applySpy).toHaveBeenCalledWith({ sex: 'Female', status: '' });
    });
  });
});
