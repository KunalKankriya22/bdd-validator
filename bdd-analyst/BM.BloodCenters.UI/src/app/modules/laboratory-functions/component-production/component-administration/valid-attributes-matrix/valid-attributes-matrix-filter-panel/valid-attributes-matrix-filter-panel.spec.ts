import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ValidAttributesMatrixFilterPanel } from './valid-attributes-matrix-filter-panel';
import { HeaderService } from '@shared/services/header.service';
import { Subject } from 'rxjs';

describe('ValidAttributesMatrixFilterPanel', () => {
  let component: ValidAttributesMatrixFilterPanel;
  let fixture: ComponentFixture<ValidAttributesMatrixFilterPanel>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<any>;

  beforeEach(() => {
    chapterChanged$ = new Subject();
    mockHeaderService = jasmine.createSpyObj('HeaderService', [], {
      chapterChanged$: chapterChanged$.asObservable()
    });

    TestBed.configureTestingModule({
      imports: [
        ValidAttributesMatrixFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    fixture = TestBed.createComponent(ValidAttributesMatrixFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('associatedAttribCode')?.value).toBeNull();
    expect(component.filterForm.get('deleteModifierCode')?.value).toBeNull();
    expect(component.filterForm.get('attribDeletedCode')?.value).toBeNull();
  });

  it('should initialize form with currentFilters when provided', () => {
    component.currentFilters = {
      associatedAttribCode: 'AC1',
      deleteModifierCode: 'MC1',
      attribDeletedCode: 'DC1'
    };
    fixture.detectChanges();

    expect(component.filterForm.get('associatedAttribCode')?.value).toBe('AC1');
    expect(component.filterForm.get('deleteModifierCode')?.value).toBe('MC1');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ associatedAttribCode: 'A1' });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      associatedAttribCode: 'A1'
    }));
  });

  it('should reset form values on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ associatedAttribCode: 'A1' });

    component.onClear();

    expect(component.filterForm.get('associatedAttribCode')?.value).toBeNull();
    expect(component.filterForm.get('deleteModifierCode')?.value).toBeNull();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit close when chapter changes', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');

    chapterChanged$.next({});

    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should return true for isApplyDisabled when no filter has a value', () => {
    fixture.detectChanges();
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should return false for isApplyDisabled when a filter has a value', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ associatedAttribCode: 'A1' });
    expect(component.isApplyDisabled).toBeFalse();
  });

  it('should filter added codes based on search input', () => {
    component.associatedAttributeCodeOptions = [
      { attribCode: 'AB', attribDesc: 'Alpha Beta' },
      { attribCode: 'CD', attribDesc: 'Charlie Delta' }
    ] as any[];
    fixture.detectChanges();

    component.addedCodeSearchCtrl.setValue('alpha');

    expect(component.filteredAddedCodes.length).toBe(1);
    expect(component.filteredAddedCodes[0].attribCode).toBe('AB');
  });
});
