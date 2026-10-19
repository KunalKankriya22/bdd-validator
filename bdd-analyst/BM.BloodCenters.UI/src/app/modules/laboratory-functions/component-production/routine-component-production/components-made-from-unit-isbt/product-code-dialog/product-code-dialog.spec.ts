import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProductCodeDialogComponent } from './product-code-dialog';

describe('ProductCodeDialogComponent', () => {
  let component: ProductCodeDialogComponent;
  let fixture: ComponentFixture<ProductCodeDialogComponent>;

  const mockOptions = [
    { productCode: 'E0385V00', productDesc: 'RED BLOOD CELLS', specificGravity: 1.053 },
    { productCode: 'E2457V00', productDesc: 'PLASMA', specificGravity: 1.026 },
    { productCode: 'E3000V00', productDesc: 'PLATELETS', specificGravity: 1.030 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductCodeDialogComponent, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductCodeDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to empty options', () => {
    expect(component.options).toEqual([]);
    expect(component.selectedProductCode()).toBeNull();
  });

  describe('ngOnInit', () => {
    it('should select first option when options are provided', () => {
      component.options = mockOptions;
      component.ngOnInit();
      expect(component.selectedProductCode()).toBe('E0385V00');
    });

    it('should not select any option when options are empty', () => {
      component.options = [];
      component.ngOnInit();
      expect(component.selectedProductCode()).toBeNull();
    });
  });

  describe('onSave', () => {
    it('should emit selected option on save', () => {
      component.options = mockOptions;
      component.ngOnInit();
      const saveSpy = jasmine.createSpy('save');
      component.save.subscribe(saveSpy);

      component.onSave();

      expect(saveSpy).toHaveBeenCalledWith(mockOptions[0]);
    });

    it('should emit second option when selected', () => {
      component.options = mockOptions;
      component.ngOnInit();
      component.selectedProductCode.set('E2457V00');
      const saveSpy = jasmine.createSpy('save');
      component.save.subscribe(saveSpy);

      component.onSave();

      expect(saveSpy).toHaveBeenCalledWith(mockOptions[1]);
    });

    it('should not emit when no selection', () => {
      component.options = mockOptions;
      component.selectedProductCode.set(null);
      const saveSpy = jasmine.createSpy('save');
      component.save.subscribe(saveSpy);

      component.onSave();

      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should not emit when selected code not found in options', () => {
      component.options = mockOptions;
      component.selectedProductCode.set('INVALID');
      const saveSpy = jasmine.createSpy('save');
      component.save.subscribe(saveSpy);

      component.onSave();

      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      const closeSpy = jasmine.createSpy('close');
      component.close.subscribe(closeSpy);

      component.onClose();

      expect(closeSpy).toHaveBeenCalled();
    });
  });
});
