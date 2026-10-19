import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TstparmFilterPanelComponent } from './tstparm-filter-panel.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

describe('TstparmFilterPanelComponent', () => {
  let component: TstparmFilterPanelComponent;
  let fixture: ComponentFixture<TstparmFilterPanelComponent>;

  const mockDialogData = {
    currentFilters: null,
    relatedCodes: ['BACT', 'I1st', 'DROP'],
    voidCodes: ['VOID1', 'VOID2', 'ACTIVE']
  };

  beforeEach(() => {



      TestBed.configureTestingModule({
imports: [TstparmFilterPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(TstparmFilterPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });
  describe('Filter Options', () => {
    it('should have filter options available', () => {
      expect(component.datatypes.length).toBeGreaterThan(0);
      expect(component.relatedCodes.length).toBeGreaterThan(0);
      expect(component.voidCodes.length).toBeGreaterThan(0);
    });

  });

  describe('Form Actions', () => {

    it('should emit apply event with only non-null values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        datatype: 'CHAR',
        relatedCode: null,
        voidCode: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.datatype).toBe('CHAR');
      expect(emittedValue.relatedCode).toBeUndefined();
      expect(emittedValue.voidCode).toBeUndefined();
    });

    it('should clear all filters on clear all', () => {
      component.filterForm.patchValue({
        datatype: 'CHAR',
        relatedCode: 'BACT',
        voidCode: 'VOID1'
      });

      component.onClearAll();

      expect(component.filterForm.get('datatype')?.value).toBeNull();
      expect(component.filterForm.get('relatedCode')?.value).toBeNull();
      expect(component.filterForm.get('voidCode')?.value).toBeNull();
    });

  });

  describe('Active Filters Detection', () => {
    it('should detect no active filters initially', () => {
      expect(component.hasActiveFilters).toBeFalse();
    });

    it('should detect active filters when values are set', () => {
      component.filterForm.patchValue({
        datatype: 'CHAR'
      });

      expect(component.hasActiveFilters).toBeTrue();
    });

    it('should not detect active filters when all values are null', () => {
      component.filterForm.patchValue({
        datatype: 'CHAR'
      });
      component.filterForm.reset();

      expect(component.hasActiveFilters).toBeFalse();
    });
  });

  describe('Date Filters', () => {
    it('should include date period and date in filters', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effDatePeriod: 'After',
        effDate: new Date('2025-01-01')
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effDatePeriod).toBe('After');
      expect(emittedValue.effDate).toBeDefined();
    });

  });

  describe('Accessibility', () => {


    it('should have unique IDs for all form fields', () => {
      const datatypeField = fixture.debugElement.query(By.css(`[id$="-datatype"]`));
      expect(datatypeField).toBeTruthy();
      expect(datatypeField.nativeElement.id).toContain(component.componentId);
    });

  });
});
