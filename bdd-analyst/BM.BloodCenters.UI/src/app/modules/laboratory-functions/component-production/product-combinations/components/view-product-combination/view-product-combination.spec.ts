import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ViewProductCombinationComponent } from './view-product-combination';
import { ProductCombinationTableModel } from '../../models/product-combinations.model';

describe('ViewProductCombinationComponent', () => {
  let component: ViewProductCombinationComponent;
  let fixture: ComponentFixture<ViewProductCombinationComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewProductCombinationComponent>>;

  const mockData: ProductCombinationTableModel = {
    bagCode: '2',
    setId: 1,
    bagCount: 2,
    productTypesDisplay: 'RBC - Red Blood Cells, PLT - Platelets',
    productTypes: [
      { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' },
      { productTypeCode: 'PLT', productTypeDesc: 'Platelets' }
    ]
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [ViewProductCombinationComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(ViewProductCombinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have data from injected MAT_DIALOG_DATA', () => {
    expect(component.data.setId).toBe(1);
    expect(component.data.bagCode).toBe('2');
    expect(component.data.productTypes.length).toBe(2);
  });

  it('should close dialog on onClose', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should generate unique element IDs', () => {
    const id = (component as any).elementId('test');
    expect(id).toContain('view-product-combination-');
    expect(id).toContain('-test');
  });
});
