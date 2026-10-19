import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ComponentAttributesFilterPanel } from './component-attributes-filter-panel';

describe('ComponentAttributesFilterPanel', () => {
  let component: ComponentAttributesFilterPanel;
  let fixture: ComponentFixture<ComponentAttributesFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ComponentAttributesFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    });

    fixture = TestBed.createComponent(ComponentAttributesFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('productCode')?.value).toBe('');
    expect(component.filterForm.get('attribCode')?.value).toBe('');
    expect(component.filterForm.get('insertUserId')?.value).toBe('');
  });

  it('should initialize form with currentFilters when provided', () => {
    component.currentFilters = {
      productCode: 'PC1',
      attribCode: 'AC1',
      insertUserId: 'USER1'
    };
    fixture.detectChanges();

    expect(component.filterForm.get('productCode')?.value).toBe('PC1');
    expect(component.filterForm.get('attribCode')?.value).toBe('AC1');
    expect(component.filterForm.get('insertUserId')?.value).toBe('USER1');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ productCode: 'PC-X', attribCode: 'AC-Y' });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      productCode: 'PC-X',
      attribCode: 'AC-Y'
    }));
  });

  it('should emit apply with undefined for empty fields', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ productCode: 'PC-X' });
    component.onApply();

    const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emitted.insertUserId).toBeUndefined();
  });

  it('should reset form on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ productCode: 'PC-1' });

    component.onClear();

    expect(component.filterForm.get('productCode')?.value).toBeFalsy();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should initialize filtered options from filterOptions input', () => {
    component.filterOptions = {
      productCodes: [{ code: 'PC1', description: 'Product 1' }],
      attribCodes: [{ code: 'AC1', description: 'Attrib 1' }],
      users: ['user1', 'user2']
    } as any;

    fixture.detectChanges();

    expect(component.filteredProductCodeOptions().length).toBe(1);
    expect(component.filteredAttribCodeOptions().length).toBe(1);
    expect(component.filteredUserOptions().length).toBe(2);
  });

  it('should filter product codes based on search input', () => {
    component.filterOptions = {
      productCodes: [
        { code: 'WB', description: 'Whole Blood' },
        { code: 'PLT', description: 'Platelets' }
      ],
      attribCodes: [],
      users: []
    } as any;
    fixture.detectChanges();

    component.productCodeSearchCtrl.setValue('whole');

    expect(component.filteredProductCodeOptions().length).toBe(1);
    expect(component.filteredProductCodeOptions()[0].code).toBe('WB');
  });

  it('should filter user options based on search input', () => {
    component.filterOptions = {
      productCodes: [],
      attribCodes: [],
      users: ['admin', 'labtech', 'manager']
    } as any;
    fixture.detectChanges();

    component.userSearchCtrl.setValue('lab');

    expect(component.filteredUserOptions().length).toBe(1);
    expect(component.filteredUserOptions()[0]).toBe('labtech');
  });

  it('should filter attrib codes based on search input', () => {
    component.filterOptions = {
      productCodes: [],
      attribCodes: [
        { code: 'HBS', description: 'Hepatitis B' },
        { code: 'HIV', description: 'Human Immunodeficiency' }
      ],
      users: []
    } as any;
    fixture.detectChanges();

    component.attribCodeSearchCtrl.setValue('hep');

    expect(component.filteredAttribCodeOptions().length).toBe(1);
    expect(component.filteredAttribCodeOptions()[0].code).toBe('HBS');
  });

  it('should reset attrib code filter when search is cleared', () => {
    component.filterOptions = {
      productCodes: [],
      attribCodes: [
        { code: 'HBS', description: 'Hepatitis B' },
        { code: 'HIV', description: null }
      ],
      users: []
    } as any;
    fixture.detectChanges();

    component.attribCodeSearchCtrl.setValue('hbs');
    expect(component.filteredAttribCodeOptions().length).toBe(1);

    component.attribCodeSearchCtrl.setValue('');
    expect(component.filteredAttribCodeOptions().length).toBe(2);
  });

  it('should reset product code filter when search is cleared', () => {
    component.filterOptions = {
      productCodes: [
        { code: 'WB', description: 'Whole Blood' },
        { code: 'PLT', description: null }
      ],
      attribCodes: [],
      users: []
    } as any;
    fixture.detectChanges();

    component.productCodeSearchCtrl.setValue('wb');
    expect(component.filteredProductCodeOptions().length).toBe(1);

    component.productCodeSearchCtrl.setValue('');
    expect(component.filteredProductCodeOptions().length).toBe(2);
  });

  it('should reset user filter when search is cleared', () => {
    component.filterOptions = {
      productCodes: [],
      attribCodes: [],
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
      productCodes: null,
      attribCodes: null,
      users: null
    } as any;
    fixture.detectChanges();

    expect(component.filteredProductCodeOptions().length).toBe(0);
    expect(component.filteredAttribCodeOptions().length).toBe(0);
    expect(component.filteredUserOptions().length).toBe(0);
  });

  it('should handle product code option with null description in filter', () => {
    component.filterOptions = {
      productCodes: [
        { code: 'PLT', description: null }
      ],
      attribCodes: [],
      users: []
    } as any;
    fixture.detectChanges();

    component.productCodeSearchCtrl.setValue('PLT');
    expect(component.filteredProductCodeOptions().length).toBe(1);
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
