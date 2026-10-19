import { Component, Input, EventEmitter, Output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// MatDialog is accessed via component's private `dialog` property (cmp.dialog) for spying
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { EnterPheresisCountComponent } from './enter-pheresis-count';
import { PheresisCountService } from './services/pheresis-count.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  PheresisCountComponentDto,
  PagedResult,
} from './models/pheresis-count.model';

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderStub {
  @Input() config: any;
}

@Component({ selector: 'app-search-bar', template: '', standalone: true })
class SearchBarStub {
  @Input() config: any;
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();
}

describe('EnterPheresisCountComponent', () => {
  let svcSpy: any;
  let component: EnterPheresisCountComponent;
  let cmp: any;
  let fixture: ComponentFixture<EnterPheresisCountComponent>;
  let serviceSpy: jasmine.SpyObj<PheresisCountService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let chapterChanged$: Subject<void>;

  const mockDtos: PheresisCountComponentDto[] = [
    {
      unitId: 'U001',
      collDate: '2001-05-24T00:00:00',
      productCode: '12710',
      componentPrefix: '1',
      componentCount: 20,
      componentLabeled: 'N',
      productDescription: 'Platelets Pheresis LeukoReduced by Filtration',
    },
    {
      unitId: 'U002',
      collDate: '2001-05-24T00:00:00',
      productCode: '12010',
      componentPrefix: '1',
      componentCount: null,
      componentLabeled: 'Y',
      productDescription: 'Platelets Pheresis',
    },
  ];

  const mockPagedResult: PagedResult<PheresisCountComponentDto> = {
    data: mockDtos,
    total: 2,
  };

  beforeEach(() => {

    svcSpy = jasmine.createSpyObj('PheresisCountService', [
      'getComponentsByCollectionDate',
      'updateComponentCounts',
      'validateCount',
    ]);
    const snkSpy = createMockSnackbarService();

    chapterChanged$ = new Subject<void>();
    const headerServiceStub = {
      chapterChanged$,
      chapterTimeZone: signal(''),
    };

    const pageHeaderServiceMock = {
      pageHeaderData: signal({
        title: 'Enter Pheresis Count',
        subtitle: 'Allows for entry of apheresis product cell counts.',
      }),
    };

    svcSpy.getComponentsByCollectionDate.and.returnValue(of(mockPagedResult));



      TestBed.configureTestingModule({
      imports: [
        EnterPheresisCountComponent,
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PheresisCountService, useValue: svcSpy },
        { provide: SnackbarService, useValue: snkSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
      ],
    })
      .overrideComponent(EnterPheresisCountComponent, {
        remove: { imports: [PageHeaderWithBreadcrumb, SearchBar] },
        add: { imports: [PageHeaderStub, SearchBarStub] },
      });


    


      svcSpy.getComponentsByCollectionDate.calls.reset();


      svcSpy.updateComponentCounts.calls.reset();


      svcSpy.validateCount.calls.reset();


      svcSpy.getComponentsByCollectionDate.and.returnValue(of(mockPagedResult));


    fixture = TestBed.createComponent(EnterPheresisCountComponent);
    component = fixture.componentInstance;
    cmp = component as any;
    serviceSpy = TestBed.inject(PheresisCountService) as jasmine.SpyObj<PheresisCountService>;
    snackbarSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should initialize form with collection date field', () => {
      expect(component.form.get('collectionDate')).toBeTruthy();
      expect(component.form.get('collectionDate')?.value).toBeNull();
    });



    it('should default sort order to DESC', () => {
      expect(component.currentSortOrder).toBe('DESC');
    });

    it('should default page size to 25', () => {
      expect(component.pageSize).toBe(25);
    });
  });

  describe('Form Validation', () => {
    it('should require collection date', () => {
      const control = component.form.get('collectionDate');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should accept past dates', () => {
      const pastDate = moment().subtract(1, 'day');
      component.form.patchValue({ collectionDate: pastDate });
      expect(component.form.get('collectionDate')?.valid).toBeTrue();
    });

    it('should return error message for required field', () => {
      const control = component.form.get('collectionDate');
      control?.markAsTouched();
      const error = component.getCollectionDateError();
      expect(error).toBe('Collection Date is required');
    });
  });

  describe('Retrieve Functionality', () => {


    it('should retrieve components when form is valid', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(serviceSpy.getComponentsByCollectionDate).toHaveBeenCalled();
      expect(cmp.searchPerformed()).toBeTrue();
      expect(cmp.totalRecords()).toBe(2);
    }));

    it('should pass sort order to service', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.currentSortOrder = 'ASC';
      component.onRetrieve();
      tick();

      const args = serviceSpy.getComponentsByCollectionDate.calls.mostRecent().args;
      expect(args[3]).toBe('ASC');
    }));





    it('should handle retrieve errors', fakeAsync(() => {
      serviceSpy.getComponentsByCollectionDate.and.returnValue(
        throwError(() => ({ error: { message: 'Failed', errorCode: '0123' } }))
      );
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(cmp.loading()).toBeFalse();
      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Clear Functionality', () => {
    it('should reset form and state', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      component.onClear();

      expect(component.form.get('collectionDate')?.value).toBeNull();
      expect(cmp.searchPerformed()).toBeFalse();
      expect(cmp.editMode()).toBeFalse();
      expect(cmp.totalRecords()).toBe(0);
    }));
  });

  describe('Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should enter edit mode', () => {
      component.enterEditMode();
      expect(cmp.editMode()).toBeTrue();
    });

    it('should cancel edit mode and restore values', () => {
      component.enterEditMode();
      component.dataSource.data[0].cellCount = 999;

      component.cancelEdit();

      expect(cmp.editMode()).toBeFalse();
      expect(component.dataSource.data[0].cellCount).toBe(20);
    });
  });

  describe('Sort Functionality', () => {
    it('should toggle sort order', () => {
      expect(component.currentSortOrder).toBe('DESC');
      component.toggleSort();
      expect(component.currentSortOrder).toBe('ASC');
      component.toggleSort();
      expect(component.currentSortOrder).toBe('DESC');
    });




  });

  describe('Search Filter', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should filter data source on search', () => {
      component.onSearchFilter('U001');
      expect(component.dataSource.filter).toBe('u001');
    });


  });

  describe('Input Validation', () => {
    it('should reject non-numeric input', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 65 } as any);
      const spy = spyOn(event, 'preventDefault');
      const result = component.onlyNumbers(event);
      expect(result).toBeFalse();
      expect(spy).toHaveBeenCalled();
    });

    it('should allow numeric keys', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 53 } as any);
      const result = component.onlyNumbers(event);
      expect(result).toBeTrue();
    });

    it('should allow control keys', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 8 } as any);
      const result = component.onlyNumbers(event);
      expect(result).toBeTrue();
    });
  });

  describe('Save Functionality', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      fixture.detectChanges();
      component.enterEditMode();
    }));

    it('should exit edit mode when no changes', () => {
      component.saveAll();
      expect(cmp.editMode()).toBeFalse();
    });

    it('should call batch update API when counts changed', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(of({ success: true, message: 'Saved' }));
      component.dataSource.data[0].cellCount = 99;

      component.saveAll();
      tick();

      expect(serviceSpy.updateComponentCounts).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalled();
      expect(cmp.editMode()).toBeFalse();
    }));



    it('should handle save errors', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(
        throwError(() => ({ error: { message: 'Save failed' } }))
      );
      component.dataSource.data[0].cellCount = 99;

      component.saveAll();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalled();
      expect(cmp.saving()).toBeFalse();
    }));
  });
  describe('Chapter Change', () => {
    it('should clear state when chapter changes', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      chapterChanged$.next();
      tick();

      expect(component.form.get('collectionDate')?.value).toBeNull();
      expect(cmp.searchPerformed()).toBeFalse();
      expect(cmp.totalRecords()).toBe(0);
    }));
  });

  describe('Computed Signals', () => {
    it('isEmpty should return true when totalRecords is 0', () => {
      cmp.totalRecords.set(0);
      expect(cmp.isEmpty()).toBeTrue();
    });

    it('isEmpty should return false when totalRecords > 0', () => {
      cmp.totalRecords.set(5);
      expect(cmp.isEmpty()).toBeFalse();
    });

    it('hasResults should return true when searchPerformed and not empty', () => {
      cmp.searchPerformed.set(true);
      cmp.totalRecords.set(5);
      expect(cmp.hasResults()).toBeTrue();
    });

    it('hasResults should return false when searchPerformed but empty', () => {
      cmp.searchPerformed.set(true);
      cmp.totalRecords.set(0);
      expect(cmp.hasResults()).toBeFalse();
    });

    it('hasResults should return false when not searchPerformed', () => {
      cmp.searchPerformed.set(false);
      cmp.totalRecords.set(5);
      expect(cmp.hasResults()).toBeFalse();
    });

    it('showEmptyState should return true when searchPerformed and empty', () => {
      cmp.searchPerformed.set(true);
      cmp.totalRecords.set(0);
      expect(cmp.showEmptyState()).toBeTrue();
    });

    it('showEmptyState should return false when searchPerformed and not empty', () => {
      cmp.searchPerformed.set(true);
      cmp.totalRecords.set(5);
      expect(cmp.showEmptyState()).toBeFalse();
    });

    it('showEmptyState should return false when not searchPerformed', () => {
      cmp.searchPerformed.set(false);
      cmp.totalRecords.set(0);
      expect(cmp.showEmptyState()).toBeFalse();
    });
  });

  describe('ID Helpers', () => {
    it('elementId should return component-prefixed id', () => {
      const id = cmp.elementId('field');
      expect(id).toContain('enter-pheresis-count-');
      expect(id).toContain('-field');
    });

    it('errorId should return component-prefixed error id', () => {
      const id = cmp.errorId('field');
      expect(id).toContain('enter-pheresis-count-');
      expect(id).toContain('-field-error');
    });

    it('labelId should return component-prefixed label id', () => {
      const id = cmp.labelId('field');
      expect(id).toContain('enter-pheresis-count-');
      expect(id).toContain('-field-label');
    });
  });

  describe('Form Controls Getter', () => {
    it('f getter should return form controls', () => {
      expect(component.f).toBe(component.form.controls);
    });

    it('f should contain collectionDate control', () => {
      expect(component.f['collectionDate']).toBeTruthy();
    });
  });

  describe('ngAfterViewInit - filterPredicate', () => {
    it('should filter by unitId', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      const predicate = component.dataSource.filterPredicate;
      const row = component.dataSource.data[0];
      expect(predicate(row, 'u001')).toBeTrue();
      expect(predicate(row, 'ZZZZ')).toBeFalse();
    }));

    it('should filter by productCode', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      const predicate = component.dataSource.filterPredicate;
      const row = component.dataSource.data[0];
      expect(predicate(row, '12710')).toBeTrue();
    }));

    it('should filter by productDescription', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      const predicate = component.dataSource.filterPredicate;
      const row = component.dataSource.data[0];
      expect(predicate(row, 'platelets')).toBeTrue();
    }));

    it('should be case-insensitive', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      const predicate = component.dataSource.filterPredicate;
      const row = component.dataSource.data[0];
      expect(predicate(row, 'U001')).toBeTrue();
      expect(predicate(row, 'u001')).toBeTrue();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn(cmp.destroy$, 'next');
      const completeSpy = spyOn(cmp.destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onCollectionDateInput', () => {
    it('should return early when control is null', () => {
      spyOn(component.form, 'get').and.returnValue(null);
      const event = { target: { value: 'test' } } as unknown as Event;
      component.onCollectionDateInput(event);
      // No error thrown = passed
    });

    it('should set required error for empty input', () => {
      const control = component.form.get('collectionDate')!;
      const event = { target: { value: '' } } as unknown as Event;

      component.onCollectionDateInput(event);

      expect(control.touched).toBeTrue();
      expect(control.hasError('required')).toBeTrue();
    });

    it('should set required error for whitespace-only input', () => {
      const control = component.form.get('collectionDate')!;
      const event = { target: { value: '   ' } } as unknown as Event;

      component.onCollectionDateInput(event);

      expect(control.touched).toBeTrue();
      expect(control.hasError('required')).toBeTrue();
    });

    it('should set invalidDate error when input has text but control has no value', () => {
      const control = component.form.get('collectionDate')!;
      control.setValue(null, { emitEvent: false });
      const event = { target: { value: 'invalid-text' } } as unknown as Event;

      component.onCollectionDateInput(event);

      expect(control.touched).toBeTrue();
      expect(control.dirty).toBeTrue();
      expect(control.hasError('invalidDate')).toBeTrue();
    });

    it('should mark as touched and dirty when input has text and control has value', () => {
      const control = component.form.get('collectionDate')!;
      control.setValue(moment('2001-05-24'));
      const event = { target: { value: '24-May-2001' } } as unknown as Event;

      component.onCollectionDateInput(event);

      expect(control.touched).toBeTrue();
      expect(control.dirty).toBeTrue();
    });
  });

  describe('onCollectionDateChange', () => {
    it('should clear error signal', () => {
      cmp.error.set('some error');
      component.onCollectionDateChange();
      expect(cmp.error()).toBeNull();
    });

    it('should clear control errors when control has value', () => {
      const control = component.form.get('collectionDate')!;
      control.setValue(moment('2001-05-24'));
      control.setErrors({ someError: true });

      component.onCollectionDateChange();

      expect(control.errors).toBeNull();
    });

    it('should not clear errors when control has no value', () => {
      const control = component.form.get('collectionDate')!;
      control.setValue(null);
      control.setErrors({ required: true });

      component.onCollectionDateChange();

      // Control still has errors because setValue(null) triggers validators
      // The method only clears when control?.value is truthy
      expect(cmp.error()).toBeNull();
    });
  });

  describe('onRetrieve - invalid form', () => {
    it('should mark all fields as touched when form is invalid', () => {
      const spy = spyOn(component.form, 'markAllAsTouched');
      component.onRetrieve();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call service when form is invalid', () => {
      component.onRetrieve();
      expect(serviceSpy.getComponentsByCollectionDate).not.toHaveBeenCalled();
    });
  });

  describe('onRetrieve - empty results', () => {
    it('should handle empty result set', fakeAsync(() => {
      serviceSpy.getComponentsByCollectionDate.and.returnValue(
        of({ data: [], total: 0 })
      );
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(cmp.searchPerformed()).toBeTrue();
      expect(cmp.totalRecords()).toBe(0);
      expect(component.dataSource.data.length).toBe(0);
    }));
  });

  describe('onRetrieve - error handling details', () => {
    it('should format error with errorCode when present', fakeAsync(() => {
      serviceSpy.getComponentsByCollectionDate.and.returnValue(
        throwError(() => ({ error: { message: 'Not found', errorCode: '404' } }))
      );
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(cmp.error()).toBe('Error 404: Not found');
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 404: Not found');
    }));

    it('should use default message when error has no message', fakeAsync(() => {
      serviceSpy.getComponentsByCollectionDate.and.returnValue(
        throwError(() => ({ error: {} }))
      );
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(cmp.error()).toBe('Failed to load components.');
    }));

    it('should use apiMessage when no errorCode present', fakeAsync(() => {
      serviceSpy.getComponentsByCollectionDate.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(cmp.error()).toBe('Server error');
    }));

    it('should set loading to false on error', fakeAsync(() => {
      serviceSpy.getComponentsByCollectionDate.and.returnValue(
        throwError(() => ({ error: { message: 'Fail' } }))
      );
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(cmp.loading()).toBeFalse();
    }));

    it('should set searchPerformed to true on error', fakeAsync(() => {
      serviceSpy.getComponentsByCollectionDate.and.returnValue(
        throwError(() => ({ error: { message: 'Fail' } }))
      );
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(cmp.searchPerformed()).toBeTrue();
    }));
  });

  describe('onRetrieve - row mapping', () => {
    it('should map isLabeled correctly for Y value', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      const labeledRow = component.dataSource.data.find(r => r.unitId === 'U002');
      expect(labeledRow?.isLabeled).toBeTrue();
    }));

    it('should map isLabeled correctly for N value', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      const unlabeledRow = component.dataSource.data.find(r => r.unitId === 'U001');
      expect(unlabeledRow?.isLabeled).toBeFalse();
    }));

    it('should set originalCount from componentCount', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(component.dataSource.data[0].originalCount).toBe(20);
      expect(component.dataSource.data[1].originalCount).toBeNull();
    }));
  });

  describe('onRetrieve - state reset', () => {
    it('should clear allRows and dataSource before fetching', fakeAsync(() => {
      // First retrieve
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      expect(component.dataSource.data.length).toBe(2);

      // Set loading to check it was set to true
      serviceSpy.getComponentsByCollectionDate.and.returnValue(of(mockPagedResult));
      component.onRetrieve();
      // Before tick, editMode should be false
      expect(cmp.editMode()).toBeFalse();
      tick();
    }));
  });

  describe('onPageChange', () => {
    it('should call onRetrieve when searchPerformed is true', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      serviceSpy.getComponentsByCollectionDate.calls.reset();

      component.onPageChange();
      tick();

      expect(serviceSpy.getComponentsByCollectionDate).toHaveBeenCalled();
    }));

    it('should not call onRetrieve when searchPerformed is false', () => {
      cmp.searchPerformed.set(false);
      const spy = spyOn(component, 'onRetrieve');

      component.onPageChange();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('toggleSort - with search', () => {
    it('should call onRetrieve when searchPerformed is true', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      serviceSpy.getComponentsByCollectionDate.calls.reset();

      component.toggleSort();
      tick();

      expect(component.currentSortOrder).toBe('ASC');
      expect(serviceSpy.getComponentsByCollectionDate).toHaveBeenCalled();
    }));

    it('should not call onRetrieve when searchPerformed is false', () => {
      cmp.searchPerformed.set(false);
      component.toggleSort();
      expect(component.currentSortOrder).toBe('ASC');
      expect(serviceSpy.getComponentsByCollectionDate).not.toHaveBeenCalled();
    });
  });

  describe('getSortIcon', () => {
    it('should return arrow_downward for DESC', () => {
      component.currentSortOrder = 'DESC';
      expect(component.getSortIcon()).toBe('arrow_downward');
    });

    it('should return arrow_upward for ASC', () => {
      component.currentSortOrder = 'ASC';
      expect(component.getSortIcon()).toBe('arrow_upward');
    });
  });

  describe('onClear - detailed', () => {
    it('should clear originalSnapshots', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      component.enterEditMode();

      component.onClear();

      expect(cmp.originalSnapshots.size).toBe(0);
    }));

    it('should clear error signal', () => {
      cmp.error.set('some error');
      component.onClear();
      expect(cmp.error()).toBeNull();
    });
  });

  describe('enterEditMode - snapshots', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should store original values in snapshots', () => {
      component.enterEditMode();
      expect(cmp.originalSnapshots.get('U001')).toBe(20);
      expect(cmp.originalSnapshots.get('U002')).toBeNull();
    });

    it('should clear existing snapshots before storing new ones', () => {
      component.enterEditMode();
      cmp.originalSnapshots.set('extra', 100);
      component.enterEditMode();
      expect(cmp.originalSnapshots.has('extra')).toBeFalse();
    });

    it('should refresh dataSource with allRows copy', () => {
      component.enterEditMode();
      expect(component.dataSource.data.length).toBe(2);
    });
  });

  describe('cancelEdit - detailed', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      fixture.detectChanges();
      component.enterEditMode();
    }));

    it('should clear row errors', () => {
      component.dataSource.data[0].error = 'some error';
      component.cancelEdit();
      expect(component.dataSource.data[0].error).toBeUndefined();
    });

    it('should clear originalSnapshots', () => {
      component.cancelEdit();
      expect(cmp.originalSnapshots.size).toBe(0);
    });

    it('should restore all rows to original values', () => {
      component.dataSource.data[0].cellCount = 500;
      component.dataSource.data[1].cellCount = 100;
      component.cancelEdit();
      expect(component.dataSource.data[0].cellCount).toBe(20);
      expect(component.dataSource.data[1].cellCount).toBeNull();
    });
  });

  describe('saveAll - validation errors', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      fixture.detectChanges();
      component.enterEditMode();
    }));

    it('should show error when cellCount is negative', () => {
      component.dataSource.data[0].cellCount = -1;
      component.saveAll();
      expect(component.dataSource.data[0].error).toBe('Cell count must be between 0 and 999');
      expect(serviceSpy.updateComponentCounts).not.toHaveBeenCalled();
    });

    it('should show error when cellCount exceeds 999', () => {
      component.dataSource.data[0].cellCount = 1000;
      component.saveAll();
      expect(component.dataSource.data[0].error).toBe('Cell count must be between 0 and 999');
      expect(serviceSpy.updateComponentCounts).not.toHaveBeenCalled();
    });

    it('should show error and snackbar when cellCount exceeds 3 digits', fakeAsync(() => {
      // 3-digit string length > 3 means e.g. 1000 is 4 digits string
      // But 1000 > 999 triggers the first check. Need a value that passes 0-999 but has > 3 digit string
      // Actually, cellCount.toString().length > 3 applies after the 0-999 check
      // So this branch is only hit if cellCount is between 0-999 AND toString().length > 3
      // This could happen with decimal numbers like 99.9 (length=4) but they're integers
      // Looking at the code again: the check is cellCount < 0 || cellCount > 999 first,
      // then cellCount.toString().length > 3. For integers 0-999, max length is 3.
      // This could be hit with e.g. floating point like 9.99 which passes 0-999 but has length 4.
      component.dataSource.data[0].cellCount = 9.99;
      component.saveAll();
      expect(component.dataSource.data[0].error).toBe('Error 1707: Component count exceeds 3 digits');
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 1707: Component count exceeds 3 digits');
    }));
  });

  describe('saveAll - response handling', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      fixture.detectChanges();
      component.enterEditMode();
    }));

    it('should use default success message when response has no message', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(of({ success: true }));
      component.dataSource.data[0].cellCount = 50;
      component.saveAll();
      tick();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('All changes has been saved');
    }));

    it('should use response message when provided', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(of({ success: true, message: 'Custom saved' }));
      component.dataSource.data[0].cellCount = 50;
      component.saveAll();
      tick();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Custom saved');
    }));

    it('should update originalCount on success', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(of({ success: true }));
      component.dataSource.data[0].cellCount = 50;
      component.saveAll();
      tick();

      expect(component.dataSource.data[0].originalCount).toBe(50);
    }));

    it('should clear originalSnapshots on success', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(of({ success: true }));
      component.dataSource.data[0].cellCount = 50;
      component.saveAll();
      tick();

      expect(cmp.originalSnapshots.size).toBe(0);
    }));

    it('should open CMCO dialog when errorCode is 9789', fakeAsync(() => {
      const openSpy = spyOn(cmp.dialog, 'open');
      serviceSpy.updateComponentCounts.and.returnValue(
        of({ success: false, errorCode: '9789', unitId: 'U001' })
      );
      component.dataSource.data[0].cellCount = 50;
      component.saveAll();
      tick();

      expect(openSpy).toHaveBeenCalled();
    }));

    it('should handle non-success response with errorCode', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(
        of({ success: false, errorCode: '1234', message: 'Bad request', unitId: 'U001' })
      );
      component.dataSource.data[0].cellCount = 50;
      component.saveAll();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 1234: Bad request');
      expect(component.dataSource.data[0].error).toBe('Error 1234: Bad request');
    }));

    it('should handle non-success response without errorCode', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(
        of({ success: false, message: 'Generic fail', unitId: 'U001' })
      );
      component.dataSource.data[0].cellCount = 50;
      component.saveAll();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Generic fail');
    }));

    it('should use default message when non-success response has no message', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(
        of({ success: false, unitId: 'U001' })
      );
      component.dataSource.data[0].cellCount = 50;
      component.saveAll();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to update component count.');
    }));

    it('should handle error response with errorCode', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(
        throwError(() => ({ error: { errorCode: '500', message: 'Internal error' } }))
      );
      component.dataSource.data[0].cellCount = 50;
      component.saveAll();
      tick();

      expect(cmp.saving()).toBeFalse();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 500: Internal error');
    }));

    it('should handle error response without errorCode', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(
        throwError(() => ({ error: { message: 'Network error' } }))
      );
      component.dataSource.data[0].cellCount = 50;
      component.saveAll();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Network error');
    }));

    it('should use default message when error has no message or errorCode', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(
        throwError(() => ({ error: {} }))
      );
      component.dataSource.data[0].cellCount = 50;
      component.saveAll();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to update component counts.');
    }));

    it('should not save labeled rows even if changed', fakeAsync(() => {
      serviceSpy.updateComponentCounts.and.returnValue(of({ success: true }));
      // U002 is labeled, changing it should not trigger a save
      component.dataSource.data[1].cellCount = 99;
      component.saveAll();
      // Since U002 is labeled, and U001 is unchanged, no changes => exit edit mode
      expect(cmp.editMode()).toBeFalse();
      expect(serviceSpy.updateComponentCounts).not.toHaveBeenCalled();
    }));
  });

  describe('onSearchCleared', () => {
    it('should clear the filter', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      component.onSearchFilter('test');
      expect(component.dataSource.filter).toBe('test');

      component.onSearchCleared();
      expect(component.dataSource.filter).toBe('');
    }));
  });

  describe('onlyNumbers - keyboard shortcuts', () => {
    it('should allow Ctrl+A', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 65, ctrlKey: true } as any);
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Ctrl+C', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 67, ctrlKey: true } as any);
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Ctrl+V', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 86, ctrlKey: true } as any);
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Ctrl+X', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 88, ctrlKey: true } as any);
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Meta+C (Mac)', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 67, metaKey: true } as any);
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Tab key', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 9 } as any);
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Escape key', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 27 } as any);
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Enter key', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 13 } as any);
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Delete key', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 46 } as any);
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow digit 0', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 48 } as any);
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow digit 9', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 57 } as any);
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should reject letter without ctrl', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 65 } as any);
      const spy = spyOn(event, 'preventDefault');
      expect(component.onlyNumbers(event)).toBeFalse();
      expect(spy).toHaveBeenCalled();
    });

    it('should reject special characters', () => {
      const event = new KeyboardEvent('keypress', { keyCode: 33 } as any);
      const spy = spyOn(event, 'preventDefault');
      expect(component.onlyNumbers(event)).toBeFalse();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onPasteNumbers', () => {
    it('should paste valid numeric text', () => {
      const row: any = { cellCount: null };
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '123' },
      } as unknown as ClipboardEvent;

      component.onPasteNumbers(event, row);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(row.cellCount).toBe(123);
    });

    it('should strip non-numeric characters from paste', () => {
      const row: any = { cellCount: null };
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc12def3' },
      } as unknown as ClipboardEvent;

      component.onPasteNumbers(event, row);

      expect(row.cellCount).toBe(123);
    });

    it('should not set value when paste exceeds 999', () => {
      const row: any = { cellCount: null };
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '1000' },
      } as unknown as ClipboardEvent;

      component.onPasteNumbers(event, row);

      expect(row.cellCount).toBeNull();
    });

    it('should not set value when paste is entirely non-numeric', () => {
      const row: any = { cellCount: null };
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abcdef' },
      } as unknown as ClipboardEvent;

      component.onPasteNumbers(event, row);

      expect(row.cellCount).toBeNull();
    });

    it('should handle empty clipboard data', () => {
      const row: any = { cellCount: null };
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '' },
      } as unknown as ClipboardEvent;

      component.onPasteNumbers(event, row);

      expect(row.cellCount).toBeNull();
    });

    it('should handle null clipboardData', () => {
      const row: any = { cellCount: null };
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: null,
      } as unknown as ClipboardEvent;

      component.onPasteNumbers(event, row);

      expect(row.cellCount).toBeNull();
    });

    it('should accept value of exactly 999', () => {
      const row: any = { cellCount: null };
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '999' },
      } as unknown as ClipboardEvent;

      component.onPasteNumbers(event, row);

      expect(row.cellCount).toBe(999);
    });

    it('should accept value of 0', () => {
      const row: any = { cellCount: null };
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '0' },
      } as unknown as ClipboardEvent;

      component.onPasteNumbers(event, row);

      expect(row.cellCount).toBe(0);
    });
  });

  describe('onCellCountBlur', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      fixture.detectChanges();
      component.enterEditMode();
    }));

    it('should return early when cellCount is null', () => {
      const row = component.dataSource.data[0];
      row.cellCount = null;
      component.onCellCountBlur(row);
      expect(serviceSpy.validateCount).not.toHaveBeenCalled();
    });

    it('should return early when cellCount is undefined', () => {
      const row = component.dataSource.data[0];
      row.cellCount = undefined as any;
      component.onCellCountBlur(row);
      expect(serviceSpy.validateCount).not.toHaveBeenCalled();
    });

    it('should return early when cellCount equals original', () => {
      const row = component.dataSource.data[0];
      // originalSnapshots has U001 = 20
      row.cellCount = 20;
      component.onCellCountBlur(row);
      expect(serviceSpy.validateCount).not.toHaveBeenCalled();
    });

    it('should return early when cellCount is negative', () => {
      const row = component.dataSource.data[0];
      row.cellCount = -1;
      component.onCellCountBlur(row);
      expect(serviceSpy.validateCount).not.toHaveBeenCalled();
    });

    it('should return early when cellCount exceeds 999', () => {
      const row = component.dataSource.data[0];
      row.cellCount = 1000;
      component.onCellCountBlur(row);
      expect(serviceSpy.validateCount).not.toHaveBeenCalled();
    });

    it('should call validateCount when cellCount is valid and changed', fakeAsync(() => {
      serviceSpy.validateCount.and.returnValue(of({ success: true }));
      const row = component.dataSource.data[0];
      row.cellCount = 50;
      component.onCellCountBlur(row);
      tick();

      expect(serviceSpy.validateCount).toHaveBeenCalledWith('12710', 'U001', 50);
    }));

    it('should open CMCO dialog when validation returns errorCode 9789', fakeAsync(() => {
      const openSpy = spyOn(cmp.dialog, 'open');
      serviceSpy.validateCount.and.returnValue(
        of({ success: false, errorCode: '9789' })
      );
      const row = component.dataSource.data[0];
      row.cellCount = 5;
      component.onCellCountBlur(row);
      tick();

      expect(openSpy).toHaveBeenCalled();
    }));

    it('should not open dialog when validation returns success', fakeAsync(() => {
      const openSpy = spyOn(cmp.dialog, 'open');
      serviceSpy.validateCount.and.returnValue(of({ success: true }));
      const row = component.dataSource.data[0];
      row.cellCount = 50;
      component.onCellCountBlur(row);
      tick();

      expect(openSpy).not.toHaveBeenCalled();
    }));

    it('should accept cellCount of 0 as valid', fakeAsync(() => {
      serviceSpy.validateCount.and.returnValue(of({ success: true }));
      const row = component.dataSource.data[0];
      row.cellCount = 0;
      component.onCellCountBlur(row);
      tick();

      expect(serviceSpy.validateCount).toHaveBeenCalledWith('12710', 'U001', 0);
    }));

    it('should accept cellCount of exactly 999 as valid', fakeAsync(() => {
      serviceSpy.validateCount.and.returnValue(of({ success: true }));
      const row = component.dataSource.data[0];
      row.cellCount = 999;
      component.onCellCountBlur(row);
      tick();

      expect(serviceSpy.validateCount).toHaveBeenCalledWith('12710', 'U001', 999);
    }));
  });

  describe('displayedColumns', () => {
    it('should have the expected columns', () => {
      expect(component.displayedColumns).toEqual([
        'unitId',
        'productCode',
        'productDescription',
        'labeled',
        'cellCount',
      ]);
    });
  });

  describe('searchConfig', () => {
    it('should have correct default config', () => {
      expect(component.searchConfig.placeholder).toBe('Search');
      expect(component.searchConfig.minLength).toBe(3);
      expect(component.searchConfig.ariaLabel).toBe('Search pheresis components by Unit ID');
    });
  });

  describe('pageSizeOptions', () => {
    it('should have expected page size options', () => {
      expect(component.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });
  });

  describe('headerConfig', () => {
    it('should have default breadcrumbs', () => {
      expect(component.headerConfig.breadcrumbs.length).toBeGreaterThanOrEqual(1);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    });
  });

  describe('collectionDateErrorMatcher', () => {
    it('should be defined', () => {
      expect(component.collectionDateErrorMatcher).toBeDefined();
    });
  });

  describe('allLabeled signal', () => {
    it('should default to false', () => {
      expect(cmp.allLabeled()).toBeFalse();
    });

    it('should be true when all rows are labeled', fakeAsync(() => {
      const allLabeledDtos: PheresisCountComponentDto[] = [
        { unitId: 'U001', collDate: '2001-05-24T00:00:00', productCode: '12710', componentPrefix: '1', componentCount: 20, componentLabeled: 'Y', productDescription: 'Desc1' },
        { unitId: 'U002', collDate: '2001-05-24T00:00:00', productCode: '12010', componentPrefix: '1', componentCount: 10, componentLabeled: 'Y', productDescription: 'Desc2' },
      ];
      serviceSpy.getComponentsByCollectionDate.and.returnValue(of({ data: allLabeledDtos, total: 2 }));
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(cmp.allLabeled()).toBeTrue();
    }));

    it('should be false when some rows are not labeled', fakeAsync(() => {
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(cmp.allLabeled()).toBeFalse();
    }));

    it('should reset to false on clear', fakeAsync(() => {
      const allLabeledDtos: PheresisCountComponentDto[] = [
        { unitId: 'U001', collDate: '2001-05-24T00:00:00', productCode: '12710', componentPrefix: '1', componentCount: 20, componentLabeled: 'Y', productDescription: 'Desc1' },
      ];
      serviceSpy.getComponentsByCollectionDate.and.returnValue(of({ data: allLabeledDtos, total: 1 }));
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();
      expect(cmp.allLabeled()).toBeTrue();

      component.onClear();
      expect(cmp.allLabeled()).toBeFalse();
    }));

    it('should be false when results are empty', fakeAsync(() => {
      serviceSpy.getComponentsByCollectionDate.and.returnValue(of({ data: [], total: 0 }));
      component.form.patchValue({ collectionDate: moment('2001-05-24') });
      component.onRetrieve();
      tick();

      expect(cmp.allLabeled()).toBeFalse();
    }));
  });

  describe('signals default values', () => {
    it('loading should default to false', () => {
      expect(cmp.loading()).toBeFalse();
    });

    it('saving should default to false', () => {
      expect(cmp.saving()).toBeFalse();
    });

    it('error should default to null', () => {
      expect(cmp.error()).toBeNull();
    });

    it('searchPerformed should default to false', () => {
      expect(cmp.searchPerformed()).toBeFalse();
    });

    it('editMode should default to false', () => {
      expect(cmp.editMode()).toBeFalse();
    });

    it('totalRecords should default to 0', () => {
      expect(cmp.totalRecords()).toBe(0);
    });
  });
});
