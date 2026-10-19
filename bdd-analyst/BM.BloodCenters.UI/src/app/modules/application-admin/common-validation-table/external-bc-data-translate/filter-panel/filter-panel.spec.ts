import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ExternalBcDataTranslateFilterPanel, ExternalBcDataTranslateFilterFormValue } from './filter-panel';

describe('ExternalBcDataTranslateFilterPanel', () => {
  let component: ExternalBcDataTranslateFilterPanel;
  let fixture: ComponentFixture<ExternalBcDataTranslateFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ExternalBcDataTranslateFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExternalBcDataTranslateFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {



    it('should accept source code type options', () => {
      component.sourceCodeTypeOptions = [
        { code: 'TYPE1', description: 'Type One' },
        { code: 'TYPE2', description: 'Type Two' },
        { code: 'TYPE3', description: 'Type Three' }
      ];
      fixture.detectChanges();

      expect(component.sourceCodeTypeOptions.length).toBe(3);
      expect(component.sourceCodeTypeOptions[0].code).toBe('TYPE1');
    });

    it('should accept target code type options', () => {
      component.targetCodeTypeOptions = [
        { code: 'TYPE3', description: 'Type Three' },
        { code: 'TYPE4', description: 'Type Four' }
      ];
      fixture.detectChanges();

      expect(component.targetCodeTypeOptions.length).toBe(2);
      expect(component.targetCodeTypeOptions[0].code).toBe('TYPE3');
    });
  });

  describe('Form Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should allow null values in form', () => {
      component.filterForm.patchValue({
        sourceId: null,
        targetId: null
      });

      expect(component.filterForm.get('sourceId')?.value).toBeNull();
      expect(component.filterForm.get('targetId')?.value).toBeNull();
    });

  });

  describe('Apply Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should emit null values for empty filters', (done) => {
      component.filterForm.patchValue({
        sourceId: '',
        targetId: ''
      });

      component.apply.subscribe((filters: ExternalBcDataTranslateFilterFormValue) => {
        expect(filters.sourceId).toBeNull();
        expect(filters.targetId).toBeNull();
        done();
      });

      component.onApply();
    });

    it('should emit partial filters', (done) => {
      component.filterForm.patchValue({
        sourceId: 'TYPE1',
        targetId: null
      });

      component.apply.subscribe((filters: ExternalBcDataTranslateFilterFormValue) => {
        expect(filters.sourceId).toBe('TYPE1');
        expect(filters.targetId).toBeNull();
        done();
      });

      component.onApply();
    });

    it('should convert empty strings to null when applying', (done) => {
      component.filterForm.patchValue({
        sourceId: '',
        targetId: ''
      });

      component.apply.subscribe((filters: ExternalBcDataTranslateFilterFormValue) => {
        expect(filters.sourceId).toBeNull();
        expect(filters.targetId).toBeNull();
        done();
      });

      component.onApply();
    });
  });

  describe('Close Event', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should not modify form when closing', () => {
      component.filterForm.patchValue({
        sourceId: 'TYPE1',
        targetId: 'TYPE2'
      });

      const initialValues = component.filterForm.value;
      component.onClose();

      expect(component.filterForm.value).toEqual(initialValues);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete filter workflow', (done) => {
      const currentFilters: ExternalBcDataTranslateFilterFormValue = {
        sourceId: 'TYPE1',
        targetId: null
      };

      component.currentFilters = currentFilters;
      component.sourceCodeTypeOptions = [
        { code: 'TYPE1', description: 'Type One' },
        { code: 'TYPE2', description: 'Type Two' }
      ];
      component.targetCodeTypeOptions = [
        { code: 'TYPE3', description: 'Type Three' },
        { code: 'TYPE4', description: 'Type Four' }
      ];
      fixture.detectChanges();

      // Update filter
      component.filterForm.patchValue({
        sourceId: 'TYPE2',
        targetId: 'TYPE3'
      });

      component.apply.subscribe((filters: ExternalBcDataTranslateFilterFormValue) => {
        expect(filters.sourceId).toBe('TYPE2');
        expect(filters.targetId).toBe('TYPE3');
        done();
      });

      component.onApply();
    });

  });

  describe('Edge Cases', () => {
    it('should handle undefined current filters', () => {
      component.currentFilters = undefined as any;
      fixture.detectChanges();

      expect(component.filterForm.get('sourceId')?.value).toBeNull();
      expect(component.filterForm.get('targetId')?.value).toBeNull();
    });

    it('should handle empty options arrays', () => {
      component.sourceCodeTypeOptions = [];
      component.targetCodeTypeOptions = [];
      fixture.detectChanges();

      expect(() => component.onApply()).not.toThrow();
    });

  });
});
