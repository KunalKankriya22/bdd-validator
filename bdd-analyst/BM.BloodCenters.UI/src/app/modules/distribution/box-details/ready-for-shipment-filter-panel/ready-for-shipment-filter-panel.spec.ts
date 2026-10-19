import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ReadyForShipmentFilterPanelComponent } from './ready-for-shipment-filter-panel';

describe('ReadyForShipmentFilterPanelComponent', () => {
  let component: ReadyForShipmentFilterPanelComponent;
  let fixture: ComponentFixture<ReadyForShipmentFilterPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReadyForShipmentFilterPanelComponent, NoopAnimationsModule, ReactiveFormsModule]
    });

    fixture = TestBed.createComponent(ReadyForShipmentFilterPanelComponent);
    component = fixture.componentInstance;

    component.priorities = ['High', 'Medium', 'Low'];
    component.consignees = ['Hospital A', 'Hospital B'];
    component.packedByUsers = ['User1', 'User2'];

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with null defaults', () => {
    expect(component.filterForm.value).toEqual({
      priority: null,
      consignee: null,
      packedBy: null
    });
  });

  it('should initialize filtered lists from input arrays', () => {
    expect(component.filteredPriorities).toEqual(['High', 'Medium', 'Low']);
    expect(component.filteredConsignees).toEqual(['Hospital A', 'Hospital B']);
    expect(component.filteredPackedByUsers).toEqual(['User1', 'User2']);
  });

  describe('isApplyDisabled', () => {
    it('should return true when no changes have been made', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when priority changes', () => {
      component.filterForm.patchValue({ priority: 'High' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when consignee changes', () => {
      component.filterForm.patchValue({ consignee: 'Hospital A' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when packedBy changes', () => {
      component.filterForm.patchValue({ packedBy: 'User1' });
      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('onApply', () => {
    it('should emit apply with current form values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        priority: 'High',
        consignee: 'Hospital A',
        packedBy: 'User1'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        priority: 'High',
        consignee: 'Hospital A',
        packedBy: 'User1'
      });
    });

    it('should emit null values when nothing is selected', () => {
      spyOn(component.apply, 'emit');

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        priority: null,
        consignee: null,
        packedBy: null
      });
    });
  });

  describe('onClear', () => {
    it('should reset form to null values', () => {
      component.filterForm.patchValue({
        priority: 'High',
        consignee: 'Hospital A',
        packedBy: 'User1'
      });

      component.onClear();

      expect(component.filterForm.value.priority).toBeNull();
      expect(component.filterForm.value.consignee).toBeNull();
      expect(component.filterForm.value.packedBy).toBeNull();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('search controls', () => {
    it('should filter priorities by search term', fakeAsync(() => {
      component.prioritySearchCtrl.setValue('hi');
      tick();

      expect(component.filteredPriorities).toEqual(['High']);
    }));

    it('should filter consignees by search term', fakeAsync(() => {
      component.consigneeSearchCtrl.setValue('hospital a');
      tick();

      expect(component.filteredConsignees).toEqual(['Hospital A']);
    }));

    it('should filter packedByUsers by search term', fakeAsync(() => {
      component.packedBySearchCtrl.setValue('user1');
      tick();

      expect(component.filteredPackedByUsers).toEqual(['User1']);
    }));

    it('should show all options when search is empty', fakeAsync(() => {
      component.prioritySearchCtrl.setValue('hi');
      tick();
      expect(component.filteredPriorities.length).toBe(1);

      component.prioritySearchCtrl.setValue('');
      tick();
      expect(component.filteredPriorities.length).toBe(3);
    }));

    it('should treat null search value as empty string for priorities', fakeAsync(() => {
      component.prioritySearchCtrl.setValue(null);
      tick();
      expect(component.filteredPriorities.length).toBe(3);
    }));

    it('should treat null search value as empty string for consignees', fakeAsync(() => {
      component.consigneeSearchCtrl.setValue(null);
      tick();
      expect(component.filteredConsignees.length).toBe(2);
    }));

    it('should treat null search value as empty string for packedByUsers', fakeAsync(() => {
      component.packedBySearchCtrl.setValue(null);
      tick();
      expect(component.filteredPackedByUsers.length).toBe(2);
    }));
  });

  describe('currentFilters input', () => {
    it('should populate form from currentFilters on init', () => {
      component.currentFilters = {
        priority: 'Medium',
        consignee: 'Hospital B',
        packedBy: 'User2'
      };

      component.ngOnInit();

      expect(component.filterForm.value.priority).toBe('Medium');
      expect(component.filterForm.value.consignee).toBe('Hospital B');
      expect(component.filterForm.value.packedBy).toBe('User2');
    });
  });
});
