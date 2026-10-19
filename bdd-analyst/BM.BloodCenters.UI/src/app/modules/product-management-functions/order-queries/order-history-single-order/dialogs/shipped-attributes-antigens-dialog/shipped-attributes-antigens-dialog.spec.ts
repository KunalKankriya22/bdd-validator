import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ShippedAttributesAntigensDialogComponent } from './shipped-attributes-antigens-dialog';
import { ShippedAttributesAntigensDialogData } from '../../models/order-history-single-order.model';

describe('ShippedAttributesAntigensDialogComponent', () => {
  let component: ShippedAttributesAntigensDialogComponent;
  let fixture: ComponentFixture<ShippedAttributesAntigensDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ShippedAttributesAntigensDialogComponent>>;

  const mockData: ShippedAttributesAntigensDialogData = {
    antigens: [
      { unitId: 'UNIT-001', product: 'RBC', testId: 'TEST-01', result: 'Positive' },
      { unitId: 'UNIT-002', product: 'Platelets', testId: 'TEST-02', result: 'Negative' },
    ],
    attributes: [
      { unitId: 'UNIT-001', product: 'RBC', attributeGroup: 'Blood', attributeCode: 'XM' },
      { unitId: 'UNIT-002', product: 'Platelets', attributeGroup: 'Special', attributeCode: 'IRR' },
    ],
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ShippedAttributesAntigensDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShippedAttributesAntigensDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct antigen data', () => {
    expect(component.data.antigens[0].unitId).toBe('UNIT-001');
    expect(component.data.antigens[0].testId).toBe('TEST-01');
    expect(component.data.antigens[0].result).toBe('Positive');
  });

  it('should have correct attribute data', () => {
    expect(component.data.attributes[0].unitId).toBe('UNIT-001');
    expect(component.data.attributes[0].attributeGroup).toBe('Blood');
    expect(component.data.attributes[0].attributeCode).toBe('XM');
  });

  it('should have multiple antigen records', () => {
    expect(component.data.antigens.length).toBe(2);
  });

  it('should have multiple attribute records', () => {
    expect(component.data.attributes.length).toBe(2);
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  describe('Template Rendering', () => {
    it('should display dialog title', () => {
      const title = fixture.nativeElement.querySelector('.dialog-header h2');
      expect(title.textContent).toContain('Shipped Attributes & Antigens');
    });

    it('should render antigens section title', () => {
      const titles = fixture.nativeElement.querySelectorAll('.table-section__title');
      expect(titles[0].textContent).toContain('Shipped Product Antigens');
    });

    it('should render attributes section title', () => {
      const titles = fixture.nativeElement.querySelectorAll('.table-section__title');
      expect(titles[1].textContent).toContain('Shipped Product Attributes');
    });

    it('should render antigen table headers', () => {
      const antigenTable = fixture.nativeElement.querySelectorAll('.table-section')[0];
      const headers = antigenTable.querySelectorAll('th');
      const headerTexts = Array.from(headers).map((h: any) => h.textContent.trim());
      expect(headerTexts).toContain('Unit ID');
      expect(headerTexts).toContain('Product');
      expect(headerTexts).toContain('Test ID');
      expect(headerTexts).toContain('Result');
    });

    it('should render attribute table headers', () => {
      const attrTable = fixture.nativeElement.querySelectorAll('.table-section')[1];
      const headers = attrTable.querySelectorAll('th');
      const headerTexts = Array.from(headers).map((h: any) => h.textContent.trim());
      expect(headerTexts).toContain('Attribute Group');
      expect(headerTexts).toContain('Attribute Code');
    });

    it('should render antigen rows', () => {
      const antigenTable = fixture.nativeElement.querySelectorAll('.table-section')[0];
      const rows = antigenTable.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should render attribute rows', () => {
      const attrTable = fixture.nativeElement.querySelectorAll('.table-section')[1];
      const rows = attrTable.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should have a close button', () => {
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

describe('ShippedAttributesAntigensDialogComponent - Empty Antigens', () => {
  let fixture: ComponentFixture<ShippedAttributesAntigensDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShippedAttributesAntigensDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { antigens: [], attributes: [{ unitId: 'U1', product: 'P', attributeGroup: 'G', attributeCode: 'C' }] } },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShippedAttributesAntigensDialogComponent);
    fixture.detectChanges();
  });

  it('should show empty message for antigens', () => {
    const antigenTable = fixture.nativeElement.querySelectorAll('.table-section')[0];
    const emptyRow = antigenTable.querySelector('.empty-row');
    expect(emptyRow.textContent).toContain('No antigen records found.');
  });

  it('should render attribute rows normally', () => {
    const attrTable = fixture.nativeElement.querySelectorAll('.table-section')[1];
    const rows = attrTable.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
  });
});

describe('ShippedAttributesAntigensDialogComponent - Empty Attributes', () => {
  let fixture: ComponentFixture<ShippedAttributesAntigensDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShippedAttributesAntigensDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { antigens: [{ unitId: 'U1', product: 'P', testId: 'T', result: 'R' }], attributes: [] } },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShippedAttributesAntigensDialogComponent);
    fixture.detectChanges();
  });

  it('should show empty message for attributes', () => {
    const attrTable = fixture.nativeElement.querySelectorAll('.table-section')[1];
    const emptyRow = attrTable.querySelector('.empty-row');
    expect(emptyRow.textContent).toContain('No attribute records found.');
  });

  it('should render antigen rows normally', () => {
    const antigenTable = fixture.nativeElement.querySelectorAll('.table-section')[0];
    const rows = antigenTable.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
  });
});

describe('ShippedAttributesAntigensDialogComponent - Both Empty', () => {
  let fixture: ComponentFixture<ShippedAttributesAntigensDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShippedAttributesAntigensDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { antigens: [], attributes: [] } },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShippedAttributesAntigensDialogComponent);
    fixture.detectChanges();
  });

  it('should show empty messages for both tables', () => {
    const emptyRows = fixture.nativeElement.querySelectorAll('.empty-row');
    expect(emptyRows.length).toBe(2);
    expect(emptyRows[0].textContent).toContain('No antigen records found.');
    expect(emptyRows[1].textContent).toContain('No attribute records found.');
  });
});
