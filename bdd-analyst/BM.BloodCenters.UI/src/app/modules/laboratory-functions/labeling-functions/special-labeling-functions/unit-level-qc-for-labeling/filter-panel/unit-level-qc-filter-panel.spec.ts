import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import moment from 'moment';

import { UnitLevelQcFilterPanel } from './unit-level-qc-filter-panel';
import { UnitLevelQCFilterValue } from '../models/unit-level-qc.model';

describe('UnitLevelQcFilterPanel', () => {
  let component: any;
  let fixture: ComponentFixture<UnitLevelQcFilterPanel>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [UnitLevelQcFilterPanel, NoopAnimationsModule]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(UnitLevelQcFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Form Initialization', () => {

    it('should initialize form with current filters if provided', () => {
      const filters: UnitLevelQCFilterValue = {
        unitId: 'UNIT001',
        productCode: 'RBC',
        qcLabelFlag: 'Y',
        abo: 'A',
        rh: '+'
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('unitId')?.value).toBe('UNIT001');
      expect(component.filterForm.get('productCode')?.value).toBe('RBC');
      expect(component.filterForm.get('qcLabelFlag')?.value).toBe('Y');
      expect(component.filterForm.get('abo')?.value).toBe('A');
      expect(component.filterForm.get('rh')?.value).toBe('+');
    });

    it('should initialize date fields as moment objects', () => {
      const filters: UnitLevelQCFilterValue = {
        collDateFrom: new Date('2024-01-15'),
        collDateTo: new Date('2024-01-20')
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(moment.isMoment(component.filterForm.get('collDateFrom')?.value)).toBeTrue();
      expect(moment.isMoment(component.filterForm.get('collDateTo')?.value)).toBeTrue();
    });
  });

  describe('Apply Filters', () => {
    it('should emit filters when apply is clicked', () => {
      fixture.detectChanges();
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        unitId: 'UNIT001',
        productCode: 'RBC'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.unitId).toBe('UNIT001');
      expect(emittedFilters.productCode).toBe('RBC');
    });


    it('should convert "All" dropdown values to undefined', () => {
      fixture.detectChanges();
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        qcLabelFlag: 'All',
        abo: 'All',
        rh: 'All'
      });

      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.qcLabelFlag).toBeUndefined();
      expect(emittedFilters.abo).toBeUndefined();
      expect(emittedFilters.rh).toBeUndefined();
    });

    it('should convert moment dates to Date objects', () => {
      fixture.detectChanges();
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        collDateFrom: moment('2024-01-15'),
        collDateTo: moment('2024-01-20')
      });

      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.collDateFrom instanceof Date).toBeTrue();
      expect(emittedFilters.collDateTo instanceof Date).toBeTrue();
    });
  });

  describe('Clear Filters', () => {

    it('should reset date fields to null', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        collDateFrom: moment('2024-01-15'),
        collDateTo: moment('2024-01-20')
      });

      component.onClear();

      expect(component.filterForm.get('collDateFrom')?.value).toBeNull();
      expect(component.filterForm.get('collDateTo')?.value).toBeNull();
    });
  });
  describe('Unique ID Generation', () => {
    it('should generate unique component IDs for multiple instances', () => {
      const fixture2 = TestBed.createComponent(UnitLevelQcFilterPanel);
      const component2 = fixture2.componentInstance as any;

      expect(component.componentId).not.toBe(component2.componentId);
    });
  });
});
