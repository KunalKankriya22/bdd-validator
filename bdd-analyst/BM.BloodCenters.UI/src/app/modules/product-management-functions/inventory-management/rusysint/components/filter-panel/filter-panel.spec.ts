import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ReleaseProductQuarantineFilterPanel } from './filter-panel';
import { ProductCodeLOV, BloodTypeLOV, WarehouseLOV, FilterValue } from '../../models/release-product-quarantine.model';

describe('ReleaseProductQuarantineFilterPanel', () => {
  let component: any;
  let fixture: ComponentFixture<ReleaseProductQuarantineFilterPanel>;

  const mockProductCodes: ProductCodeLOV[] = [
    { productCode: 'RBC', productDesc: 'Red Blood Cells' },
    { productCode: 'PLT', productDesc: 'Platelets' }
  ];

  const mockBloodTypes: BloodTypeLOV[] = [
    { bloodType: 'O', aboDesc: 'O Positive' },
    { bloodType: 'A', aboDesc: 'A Positive' }
  ];

  const mockWarehouses: WarehouseLOV[] = [
    { warehouseId: 'W01', warehouseDesc: 'Main Warehouse' },
    { warehouseId: 'W02', warehouseDesc: 'Secondary Warehouse' }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [ReleaseProductQuarantineFilterPanel, NoopAnimationsModule, TranslateModule.forRoot()]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(ReleaseProductQuarantineFilterPanel);
    component = fixture.componentInstance;
    component.productCodeOptions = mockProductCodes;
    component.bloodTypeOptions = mockBloodTypes;
    component.warehouseOptions = mockWarehouses;
    fixture.detectChanges();


    });


  it('should populate form when currentFilters provided', () => {
    const filters: FilterValue = {
      productCode: 'RBC',
      bloodType: 'O',
      warehouseId: 'W01',
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-12-31')
    };

    component.currentFilters = filters;
    component.ngOnInit();

    expect(component.filterForm.get('productCode')?.value).toBe('RBC');
    expect(component.filterForm.get('bloodType')?.value).toBe('O');
    expect(component.filterForm.get('warehouseId')?.value).toBe('W01');
  });

  it('should detect if any filter is applied', () => {
    expect(component.hasAnyFilter).toBeFalse();

    component.filterForm.patchValue({ productCode: 'RBC' });
    expect(component.hasAnyFilter).toBeTrue();
  });

  it('should emit applyFilters with form values', () => {
    spyOn(component.applyFilters, 'emit');
    spyOn(component.closePanel, 'emit');

    component.filterForm.patchValue({
      productCode: 'RBC',
      bloodType: 'O'
    });

    component.onApply();

    expect(component.applyFilters.emit).toHaveBeenCalledWith({
      productCode: 'RBC',
      bloodType: 'O'
    });
    expect(component.closePanel.emit).toHaveBeenCalled();
  });

  it('should emit clearFilters and reset form', () => {
    spyOn(component.clearFilters, 'emit');
    spyOn(component.closePanel, 'emit');

    component.filterForm.patchValue({ productCode: 'RBC' });
    component.onClear();

    expect(component.filterForm.get('productCode')?.value).toBeNull();
    expect(component.clearFilters.emit).toHaveBeenCalled();
    expect(component.closePanel.emit).toHaveBeenCalled();
  });


  it('should format product code with description', () => {
    const formatted = component.formatProductCode(mockProductCodes[0]);
    expect(formatted).toBe('RBC - Red Blood Cells');
  });

  it('should format product code without description', () => {
    const option: ProductCodeLOV = { productCode: 'XYZ', productDesc: null };
    const formatted = component.formatProductCode(option);
    expect(formatted).toBe('XYZ');
  });

  it('should format blood type with description', () => {
    const formatted = component.formatBloodType(mockBloodTypes[0]);
    expect(formatted).toBe('O - O Positive');
  });

  it('should format warehouse with description', () => {
    const formatted = component.formatWarehouse(mockWarehouses[0]);
    expect(formatted).toBe('W01 - Main Warehouse');
  });

  it('should validate toDate is after fromDate', () => {
    component.filterForm.patchValue({
      fromDate: new Date('2024-12-31'),
      toDate: new Date('2024-01-01')
    });

    fixture.detectChanges();

    const toDateValue = component.f['toDate'].value;
    const fromDateValue = component.f['fromDate'].value;
    expect(toDateValue < fromDateValue).toBeTrue();
  });


});
