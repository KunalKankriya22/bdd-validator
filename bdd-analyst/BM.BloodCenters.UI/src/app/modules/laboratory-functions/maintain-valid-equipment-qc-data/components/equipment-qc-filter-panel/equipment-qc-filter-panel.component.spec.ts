import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';

import { EquipmentQcFilterPanelComponent } from './equipment-qc-filter-panel.component';
import { EquipmentQcDataService } from '../../services/equipment-qc-data.service';
import { EquipmentType, QcType } from '../../models/equipment-qc-data.model';

describe('EquipmentQcFilterPanelComponent', () => {
  let component: EquipmentQcFilterPanelComponent;
  let fixture: ComponentFixture<EquipmentQcFilterPanelComponent>;
  let equipmentQcDataServiceSpy: jasmine.SpyObj<EquipmentQcDataService>;

  const mockEquipmentTypes: EquipmentType[] = [
    { code: 'EQ1', codeDesc: 'Equipment Type 1' },
    { code: 'EQ2', codeDesc: 'Equipment Type 2' }
  ];

  const mockQcTypes: QcType[] = [
    { code: 'QC1', codeDesc: 'QC Type 1' },
    { code: 'QC2', codeDesc: 'QC Type 2' }
  ];

  beforeEach(() => {

    equipmentQcDataServiceSpy = jasmine.createSpyObj('EquipmentQcDataService', [
      'getEquipmentTypes',
      'getQcTypes'
    ]);

    equipmentQcDataServiceSpy.getEquipmentTypes.and.returnValue(of(mockEquipmentTypes));
    equipmentQcDataServiceSpy.getQcTypes.and.returnValue(of(mockQcTypes));



      TestBed.configureTestingModule({
imports: [EquipmentQcFilterPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: EquipmentQcDataService, useValue: equipmentQcDataServiceSpy }
      ]
    });


    });



  beforeEach(() => {


      equipmentQcDataServiceSpy.getEquipmentTypes.calls.reset();


      equipmentQcDataServiceSpy.getQcTypes.calls.reset();


      equipmentQcDataServiceSpy.getEquipmentTypes.and.returnValue(of(mockEquipmentTypes));


      equipmentQcDataServiceSpy.getQcTypes.and.returnValue(of(mockQcTypes));


    fixture = TestBed.createComponent(EquipmentQcFilterPanelComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should only have equipmentType and qcType controls', () => {
      fixture.detectChanges();
      const controls = Object.keys(component.filterForm.controls);
      expect(controls).toEqual(['equipmentType', 'qcType']);
    });



  });
  describe('Form Controls', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update equipment type description when selection changes', () => {
      component.filterForm.patchValue({ equipmentType: 'EQ1' });
      fixture.detectChanges();

      expect(component['selectedEquipmentTypeDesc']()).toBe('Equipment Type 1');
    });

    it('should update QC type description when selection changes', () => {
      component.filterForm.patchValue({ qcType: 'QC1' });
      fixture.detectChanges();

      expect(component['selectedQcTypeDesc']()).toBe('QC Type 1');
    });

  });


  describe('Clear All Action', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset form when clear all is clicked', () => {
      component.filterForm.patchValue({
        equipmentType: 'EQ1',
        qcType: 'QC1'
      });

      component.onClearAll();

      expect(component.filterForm.get('equipmentType')?.value).toBeNull();
      expect(component.filterForm.get('qcType')?.value).toBeNull();
    });

  });

  describe('Accessibility', () => {

    it('should mark required fields with Angular Material required indicator', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const requiredMarkers = fixture.debugElement.queryAll(By.css('.mat-mdc-form-field-required-marker'));
      expect(requiredMarkers.length).toBeGreaterThan(0);
    }));

  });
});
