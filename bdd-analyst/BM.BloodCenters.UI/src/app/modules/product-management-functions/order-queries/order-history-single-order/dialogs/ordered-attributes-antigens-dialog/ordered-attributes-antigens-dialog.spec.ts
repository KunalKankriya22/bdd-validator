import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrderedAttributesAntigensDialogComponent } from './ordered-attributes-antigens-dialog';
import { OrderedAttributesAntigensDialogData } from '../../models/order-history-single-order.model';

describe('OrderedAttributesAntigensDialogComponent', () => {
  let component: OrderedAttributesAntigensDialogComponent;
  let fixture: ComponentFixture<OrderedAttributesAntigensDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<OrderedAttributesAntigensDialogComponent>>;

  const mockData: OrderedAttributesAntigensDialogData = {
    itemNo: 1,
    attributes: [
      { group: 'Blood Type', code: 'BT-001', description: 'Type A', quantity: 5 },
      { group: 'Special', code: 'SP-001', description: 'Irradiated', quantity: 2 },
    ],
    antigens: [
      { id: 'AG-001', description: 'Antigen Kell' },
      { id: 'AG-002', description: 'Antigen Duffy' },
    ],
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [OrderedAttributesAntigensDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderedAttributesAntigensDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct attribute data', () => {
    expect(component.data.attributes[0].group).toBe('Blood Type');
    expect(component.data.attributes[0].code).toBe('BT-001');
    expect(component.data.attributes[0].description).toBe('Type A');
    expect(component.data.attributes[0].quantity).toBe(5);
  });

  it('should have correct antigen data', () => {
    expect(component.data.antigens[0].id).toBe('AG-001');
    expect(component.data.antigens[0].description).toBe('Antigen Kell');
  });

  it('should have correct itemNo', () => {
    expect(component.data.itemNo).toBe(1);
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  describe('Template Rendering', () => {
    it('should display dialog title', () => {
      const title = fixture.nativeElement.querySelector('.dialog-header h2');
      expect(title.textContent).toContain('Ordered Attributes & Antigens');
    });

    it('should display item number', () => {
      const itemValue = fixture.nativeElement.querySelector('.item-info__value');
      expect(itemValue.textContent.trim()).toBe('1');
    });

    it('should render attribute rows', () => {
      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(4);
    });

    it('should render table headers', () => {
      const headers = fixture.nativeElement.querySelectorAll('th');
      const headerTexts = Array.from(headers).map((h: any) => h.textContent.trim());
      expect(headerTexts).toContain('Group');
      expect(headerTexts).toContain('Code');
      expect(headerTexts).toContain('Quantity');
    });

    it('should have a close button in footer', () => {
      const closeBtn = fixture.nativeElement.querySelector('.dialog-footer button');
      expect(closeBtn.textContent.trim()).toContain('CLOSE');
    });

    it('should close dialog when close icon button is clicked', () => {
      const closeIcon = fixture.nativeElement.querySelector('.dialog-header button[mat-icon-button]');
      closeIcon.click();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should close dialog when footer close button is clicked', () => {
      const closeBtn = fixture.nativeElement.querySelector('.dialog-footer button');
      closeBtn.click();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });
});

describe('OrderedAttributesAntigensDialogComponent - Empty', () => {
  let fixture: ComponentFixture<OrderedAttributesAntigensDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderedAttributesAntigensDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { itemNo: 1, attributes: [], antigens: [] } },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderedAttributesAntigensDialogComponent);
    fixture.detectChanges();
  });

  it('should show empty row message when no records', () => {
    const emptyRow = fixture.nativeElement.querySelector('.empty-row');
    expect(emptyRow.textContent).toContain('No records found.');
  });
});

describe('OrderedAttributesAntigensDialogComponent - Attributes Only', () => {
  let fixture: ComponentFixture<OrderedAttributesAntigensDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderedAttributesAntigensDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { itemNo: 2, attributes: [{ group: 'G', code: 'C' }], antigens: [] } },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderedAttributesAntigensDialogComponent);
    fixture.detectChanges();
  });

  it('should render attribute rows without empty message', () => {
    const emptyRow = fixture.nativeElement.querySelector('.empty-row');
    expect(emptyRow).toBeNull();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
  });
});
