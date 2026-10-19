import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AttributesAntigensDialogComponent } from './attributes-antigens-dialog';
import { AttributesAntigensDialogData, ItemAntigenDto, ItemAttributeDto } from '../../models/enter-order-charges.model';

describe('AttributesAntigensDialogComponent', () => {
  let component: AttributesAntigensDialogComponent;
  let fixture: ComponentFixture<AttributesAntigensDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AttributesAntigensDialogComponent>>;

  const mockAntigens: ItemAntigenDto[] = [
    { itemNo: 1, antigen: 'A', result: 'Positive', unitPrice: 10 },
    { itemNo: 2, antigen: 'B', result: 'Negative', unitPrice: 15 },
  ];

  const mockAttributes: ItemAttributeDto[] = [
    { itemNo: 1, group: 'Rh', code: 'D', unitPrice: 5 },
    { itemNo: 2, group: 'Kell', code: 'K', unitPrice: 8 },
  ];

  const dialogData: AttributesAntigensDialogData = {
    antigens: mockAntigens,
    attributes: mockAttributes,
  };

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).overrideComponent(AttributesAntigensDialogComponent, {
      set: {
        imports: [CommonModule],
        template: '',
      },
    });

    fixture = TestBed.createComponent(AttributesAntigensDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have access to antigens data', () => {
    expect(component.data.antigens).toEqual(mockAntigens);
    expect(component.data.antigens.length).toBe(2);
  });

  it('should have access to attributes data', () => {
    expect(component.data.attributes).toEqual(mockAttributes);
    expect(component.data.attributes.length).toBe(2);
  });

  describe('antigensTableConfig', () => {
    it('should define 4 columns', () => {
      expect(component.antigensTableConfig.columns.length).toBe(4);
      expect(component.antigensTableConfig.columns.map(c => c.key)).toEqual([
        'itemNo', 'antigen', 'result', 'unitPrice',
      ]);
    });

    it('should format unit price via valueFormatter', () => {
      const unitPriceCol = component.antigensTableConfig.columns.find(c => c.key === 'unitPrice');
      expect(unitPriceCol?.valueFormatter?.(10, {} as any)).toBe('$10.00');
      expect(unitPriceCol?.valueFormatter?.(null, {} as any)).toBe('$0.00');
    });

    it('should show table on empty with message', () => {
      expect(component.antigensTableConfig.showTableOnEmpty).toBeTrue();
      expect(component.antigensTableConfig.emptyMessage).toBe('No antigens found.');
    });
  });

  describe('attributesTableConfig', () => {
    it('should define 4 columns', () => {
      expect(component.attributesTableConfig.columns.length).toBe(4);
      expect(component.attributesTableConfig.columns.map(c => c.key)).toEqual([
        'itemNo', 'group', 'code', 'unitPrice',
      ]);
    });

    it('should format unit price via valueFormatter', () => {
      const unitPriceCol = component.attributesTableConfig.columns.find(c => c.key === 'unitPrice');
      expect(unitPriceCol?.valueFormatter?.(5, {} as any)).toBe('$5.00');
      expect(unitPriceCol?.valueFormatter?.(null, {} as any)).toBe('$0.00');
    });

    it('should show table on empty with message', () => {
      expect(component.attributesTableConfig.showTableOnEmpty).toBeTrue();
      expect(component.attributesTableConfig.emptyMessage).toBe('No attributes found.');
    });
  });

  describe('onGoBack', () => {
    it('should close the dialog', () => {
      component.onGoBack();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('with empty data', () => {
    it('should handle empty antigens and attributes', () => {
      TestBed.resetTestingModule();
      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

      TestBed.configureTestingModule({
        imports: [NoopAnimationsModule],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: { antigens: [], attributes: [] } },
          { provide: MatDialogRef, useValue: mockDialogRef },
        ],
      }).overrideComponent(AttributesAntigensDialogComponent, {
        set: {
          imports: [CommonModule],
          template: '',
        },
      });

      const emptyFixture = TestBed.createComponent(AttributesAntigensDialogComponent);
      const emptyComponent = emptyFixture.componentInstance;
      emptyFixture.detectChanges();

      expect(emptyComponent.data.antigens.length).toBe(0);
      expect(emptyComponent.data.attributes.length).toBe(0);
    });
  });
});
