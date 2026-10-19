import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import {
  AddEditStandingOrderDialogComponent,
  AddEditStandingOrderDialogData,
} from './add-edit-standing-order-dialog';
import { StandingOrderService } from '../../services/standing-order.service';

describe('AddEditStandingOrderDialogComponent', () => {
  let component: AddEditStandingOrderDialogComponent;
  let fixture: ComponentFixture<AddEditStandingOrderDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditStandingOrderDialogComponent>>;
  let serviceSpy: jasmine.SpyObj<StandingOrderService>;

  function createComponent(data: AddEditStandingOrderDialogData) {
    serviceSpy = jasmine.createSpyObj('StandingOrderService', [
      'getStandingOrderById',
      'createStandingOrder',
      'updateStandingOrder',
      'serializeDateForApi',
    ]);
    serviceSpy.getStandingOrderById.and.returnValue(of(null));
    serviceSpy.createStandingOrder.and.returnValue(of(undefined));
    serviceSpy.updateStandingOrder.and.returnValue(of(undefined));
    serviceSpy.serializeDateForApi.and.callFake((d: any) => d ? d.format?.('YYYY-MM-DD') || d : null);

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [AddEditStandingOrderDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: StandingOrderService, useValue: serviceSpy },
      ],
    });

    fixture = TestBed.createComponent(AddEditStandingOrderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('Create mode', () => {
    beforeEach(() => {
      createComponent({
        mode: 'create',
        contractId: 'CON001',
        consigneeId: 'CSG001',
      });
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set isEditMode to false in create mode', () => {
      expect(component.isEditMode).toBeFalse();
    });

    it('should set dialog title to Add New Day', () => {
      expect(component.dialogTitle).toBe('Add New Day');
    });

    it('should initialize form with required validators', () => {
      expect(component.form.get('weekDay')?.hasError('required')).toBeTrue();
      expect(component.form.get('effDate')?.hasError('required')).toBeTrue();
    });

    it('should not load existing data in create mode', () => {
      expect(serviceSpy.getStandingOrderById).not.toHaveBeenCalled();
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit();
      expect(serviceSpy.createStandingOrder).not.toHaveBeenCalled();
      expect(component.submitted()).toBeTrue();
    });

    it('should close dialog with false on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });

    it('should handle create error', fakeAsync(() => {
      serviceSpy.createStandingOrder.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Duplicate entry' } } })),
      );

      component.form.patchValue({ weekDay: 'MON', effDate: new Date() });
      component.onSubmit();
      tick();

      expect(component.error()).toBe('Duplicate entry');
      expect(component.loading()).toBeFalse();
    }));

    it('should close dialog with true on create success', fakeAsync(() => {
      component.form.patchValue({ weekDay: 'MON', effDate: new Date() });
      component.onSubmit();
      tick();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('Edit mode', () => {
    beforeEach(() => {
      serviceSpy = jasmine.createSpyObj('StandingOrderService', [
        'getStandingOrderById',
        'createStandingOrder',
        'updateStandingOrder',
        'serializeDateForApi',
      ]);
      serviceSpy.getStandingOrderById.and.returnValue(of({
        weekDay: 'TUE',
        confirmFlag: 'N',
        requiredTime: '10:00',
        effDate: '2024-01-01',
        termDate: null,
      }));
      serviceSpy.updateStandingOrder.and.returnValue(of(undefined));
      serviceSpy.serializeDateForApi.and.callFake((d: any) => d ? d.format?.('YYYY-MM-DD') || d : null);

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

      TestBed.configureTestingModule({
        imports: [AddEditStandingOrderDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          {
            provide: MAT_DIALOG_DATA,
            useValue: { mode: 'edit', contractId: 'CON001', consigneeId: 'CSG001', weekDay: 'TUE' },
          },
          { provide: StandingOrderService, useValue: serviceSpy },
        ],
      });

      fixture = TestBed.createComponent(AddEditStandingOrderDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set isEditMode to true', () => {
      expect(component.isEditMode).toBeTrue();
    });

    it('should set dialog title to Edit Standing Order', () => {
      expect(component.dialogTitle).toBe('Edit Standing Order');
    });

    it('should load existing data in edit mode', () => {
      expect(serviceSpy.getStandingOrderById).toHaveBeenCalledWith('CON001', 'CSG001', 'TUE');
    });

    it('should patch form from loaded order data', () => {
      expect(component.form.get('confirmFlag')?.value).toBe('N');
      expect(component.form.get('requiredTime')?.value).toBe('10:00');
      expect(component.form.get('effDate')?.value).not.toBeNull();
    });

    it('should call updateStandingOrder on submit when form is valid', fakeAsync(() => {
      component.form.patchValue({ effDate: moment() });
      component.onSubmit();
      tick();
      expect(serviceSpy.updateStandingOrder).toHaveBeenCalled();
    }));

    it('should close dialog with true on update success', fakeAsync(() => {
      component.form.patchValue({ effDate: moment() });
      component.onSubmit();
      tick();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));

    it('should show error on update failure', fakeAsync(() => {
      serviceSpy.updateStandingOrder.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Update failed' } } }))
      );
      component.form.patchValue({ effDate: moment() });
      component.onSubmit();
      tick();
      expect(component.error()).toBe('Update failed');
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('Edit mode — loadExistingData error', () => {
    beforeEach(() => {
      serviceSpy = jasmine.createSpyObj('StandingOrderService', [
        'getStandingOrderById',
        'createStandingOrder',
        'updateStandingOrder',
        'serializeDateForApi',
      ]);
      serviceSpy.getStandingOrderById.and.returnValue(
        throwError(() => new Error('Load failed'))
      );

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

      TestBed.configureTestingModule({
        imports: [AddEditStandingOrderDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          {
            provide: MAT_DIALOG_DATA,
            useValue: { mode: 'edit', contractId: 'CON001', consigneeId: 'CSG001', weekDay: 'TUE' },
          },
          { provide: StandingOrderService, useValue: serviceSpy },
        ],
      });

      fixture = TestBed.createComponent(AddEditStandingOrderDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('shows error message and sets loading false when load fails', () => {
      expect(component.error()).toBe('Failed to load standing order details');
      expect(component.loading()).toBeFalse();
    });
  });

  describe('Edit mode — null weekDay', () => {
    beforeEach(() => {
      serviceSpy = jasmine.createSpyObj('StandingOrderService', [
        'getStandingOrderById',
        'createStandingOrder',
        'updateStandingOrder',
        'serializeDateForApi',
      ]);

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

      TestBed.configureTestingModule({
        imports: [AddEditStandingOrderDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          {
            provide: MAT_DIALOG_DATA,
            useValue: { mode: 'edit', contractId: 'CON001', consigneeId: 'CSG001', weekDay: null },
          },
          { provide: StandingOrderService, useValue: serviceSpy },
        ],
      });

      fixture = TestBed.createComponent(AddEditStandingOrderDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('does not call getStandingOrderById when weekDay is null', () => {
      expect(serviceSpy.getStandingOrderById).not.toHaveBeenCalled();
    });
  });
});
