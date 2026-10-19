import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViewAttributeAntigenDialogComponent } from './view-attribute-antigen-dialog';
import { ViewAttributeAntigenDialogData } from '../../models/initiate-hospital-transfer.model';

describe('ViewAttributeAntigenDialogComponent', () => {
  let component: ViewAttributeAntigenDialogComponent;
  let fixture: ComponentFixture<ViewAttributeAntigenDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewAttributeAntigenDialogComponent>>;

  const mockData: ViewAttributeAntigenDialogData = {
    orderNo: 'ORD-001',
    itemNo: 1,
    productType: 'RBC - Red Blood Cells',
    attributes: [
      { group: 'GRP1', attributeCode: 'A01', attributeDescription: 'Attribute One' },
      { group: 'GRP2', attributeCode: 'A02', attributeDescription: 'Attribute Two' },
    ],
    antigens: [
      { antigenCode: 'AG01', antigenDescription: 'Antigen One' },
    ],
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ViewAttributeAntigenDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewAttributeAntigenDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have injected dialog data with correct values', () => {
    expect(component.data.orderNo).toBe('ORD-001');
    expect(component.data.itemNo).toBe(1);
    expect(component.data.productType).toBe('RBC - Red Blood Cells');
    expect(component.data.attributes.length).toBe(2);
    expect(component.data.antigens.length).toBe(1);
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});
