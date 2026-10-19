import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { UnitComponentAttributesFilterPanel } from './unit-component-attributes-filter-panel';

describe('UnitComponentAttributesFilterPanel', () => {
  let component: UnitComponentAttributesFilterPanel;
  let fixture: ComponentFixture<UnitComponentAttributesFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UnitComponentAttributesFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    });

    fixture = TestBed.createComponent(UnitComponentAttributesFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('attribCode')?.value).toBe('');
    expect(component.filterForm.get('attribGroup')?.value).toBe('');
    expect(component.filterForm.get('insertUserId')?.value).toBe('');
  });

  it('should initialize form with currentFilters when provided', () => {
    component.currentFilters = {
      attribCode: 'AC1',
      attribGroup: 'AG1',
      insertUserId: 'USER1'
    };
    fixture.detectChanges();

    expect(component.filterForm.get('attribCode')?.value).toBe('AC1');
    expect(component.filterForm.get('attribGroup')?.value).toBe('AG1');
    expect(component.filterForm.get('insertUserId')?.value).toBe('USER1');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ attribCode: 'AC-X', attribGroup: 'AG-Y' });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      attribCode: 'AC-X',
      attribGroup: 'AG-Y'
    }));
  });

  it('should emit apply with undefined for empty fields', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ attribCode: 'AC-X' });
    component.onApply();

    const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emitted.insertUserId).toBeUndefined();
  });

  it('should reset form on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ attribCode: 'AC-1' });

    component.onClear();

    expect(component.filterForm.get('attribCode')?.value).toBeFalsy();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should initialize filtered options from filterOptions input', () => {
    component.filterOptions = {
      attribCodes: [{ code: 'AC1', description: 'Attrib 1' }],
      attribGroups: [{ code: 'AG1' }],
      users: ['user1', 'user2']
    } as any;

    fixture.detectChanges();

    expect(component.filteredAttribCodeOptions().length).toBe(1);
    expect(component.filteredAttribGroupOptions().length).toBe(1);
    expect(component.filteredUserOptions().length).toBe(2);
  });

  it('should filter attrib codes based on search input', () => {
    component.filterOptions = {
      attribCodes: [
        { code: 'IRR', description: 'Irradiated' },
        { code: 'WAS', description: 'Washed' }
      ],
      attribGroups: [],
      users: []
    } as any;
    fixture.detectChanges();

    component.attribCodeSearchCtrl.setValue('irr');

    expect(component.filteredAttribCodeOptions().length).toBe(1);
    expect(component.filteredAttribCodeOptions()[0].code).toBe('IRR');
  });

  it('should filter user options based on search input', () => {
    component.filterOptions = {
      attribCodes: [],
      attribGroups: [],
      users: ['admin', 'labtech', 'manager']
    } as any;
    fixture.detectChanges();

    component.userSearchCtrl.setValue('man');

    expect(component.filteredUserOptions().length).toBe(1);
    expect(component.filteredUserOptions()[0]).toBe('manager');
  });

  it('should filter attrib groups based on search input', () => {
    component.filterOptions = {
      attribCodes: [],
      attribGroups: [
        { code: 'LAB', description: 'Laboratory' },
        { code: 'BLD', description: 'Blood' }
      ],
      users: []
    } as any;
    fixture.detectChanges();

    component.attribGroupSearchCtrl.setValue('lab');

    expect(component.filteredAttribGroupOptions().length).toBe(1);
    expect(component.filteredAttribGroupOptions()[0].code).toBe('LAB');
  });

  it('should reset attrib code filter when search is cleared', () => {
    component.filterOptions = {
      attribCodes: [
        { code: 'IRR', description: 'Irradiated' },
        { code: 'WAS', description: null }
      ],
      attribGroups: [],
      users: []
    } as any;
    fixture.detectChanges();

    component.attribCodeSearchCtrl.setValue('irr');
    expect(component.filteredAttribCodeOptions().length).toBe(1);

    component.attribCodeSearchCtrl.setValue('');
    expect(component.filteredAttribCodeOptions().length).toBe(2);
  });

  it('should reset attrib group filter when search is cleared', () => {
    component.filterOptions = {
      attribCodes: [],
      attribGroups: [
        { code: 'LAB', description: 'Laboratory' },
        { code: 'BLD', description: 'Blood' }
      ],
      users: []
    } as any;
    fixture.detectChanges();

    component.attribGroupSearchCtrl.setValue('lab');
    expect(component.filteredAttribGroupOptions().length).toBe(1);

    component.attribGroupSearchCtrl.setValue('');
    expect(component.filteredAttribGroupOptions().length).toBe(2);
  });

  it('should reset user filter when search is cleared', () => {
    component.filterOptions = {
      attribCodes: [],
      attribGroups: [],
      users: ['admin', 'labtech']
    } as any;
    fixture.detectChanges();

    component.userSearchCtrl.setValue('admin');
    expect(component.filteredUserOptions().length).toBe(1);

    component.userSearchCtrl.setValue('');
    expect(component.filteredUserOptions().length).toBe(2);
  });

  it('should handle filterOptions with null arrays', () => {
    component.filterOptions = {
      attribCodes: null,
      attribGroups: null,
      users: null
    } as any;
    fixture.detectChanges();

    expect(component.filteredAttribCodeOptions().length).toBe(0);
    expect(component.filteredAttribGroupOptions().length).toBe(0);
    expect(component.filteredUserOptions().length).toBe(0);
  });

  it('should handle attrib code option with null description in filter', () => {
    component.filterOptions = {
      attribCodes: [
        { code: 'IRR', description: null }
      ],
      attribGroups: [],
      users: []
    } as any;
    fixture.detectChanges();

    component.attribCodeSearchCtrl.setValue('IRR');
    expect(component.filteredAttribCodeOptions().length).toBe(1);
  });

  it('should clean up subscriptions on destroy', () => {
    fixture.detectChanges();
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
