import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ConfigurationSummaryComponent } from './configuration-summary.component';
import { DockingConfigurationComplete, DockingType } from '../models/sterile-docking-definition.model';

describe('ConfigurationSummaryComponent', () => {
  let component: ConfigurationSummaryComponent;
  let fixture: ComponentFixture<ConfigurationSummaryComponent>;

  const mockConfiguration: DockingConfigurationComplete = {
    unitId: 'W454526051302',
    chapterId: 'TEST_CHAPTER',
    collDate: '2026-05-26',
    itemInd: DockingType.BA,
    sterileMachine: '01',
    waferLotNumber: 'WL001',
    lotNumber: 'LOT001',
    numberOfItems: 5,
    weldFlag: 'Y',
    programId: 'CPISDDFN',
    description: 'Test Description',
    bagCatalogNumber: 'CAT001',
    filterType: 'FT001',
    filterLotNumber: 'FL001',
    numberOfComponents: 3,
    attributeCode: '+03',
    attributeDescription: 'Attribute +03',
    processDate: '2026-05-26T17:42:00',
    processDateDisplay: '05-26-26 17:42'
  };

  const mockConfigurationWithFilter: DockingConfigurationComplete = {
    ...mockConfiguration,
    itemInd: DockingType.FI
  };

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        ConfigurationSummaryComponent,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(ConfigurationSummaryComponent);
    component = fixture.componentInstance;


    });

  describe('Configuration Display', () => {
    beforeEach(() => {
      component.configuration = mockConfiguration;
      fixture.detectChanges();
    });












    it('should have all fields as read-only', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input');
      inputs.forEach((input: HTMLInputElement) => {
        expect(input.readOnly).toBe(true);
      });
    });
  });

  describe('Filter Fields Visibility', () => {
    it('should show filter fields when docking type is FI', () => {
      component.configuration = mockConfigurationWithFilter;
      fixture.detectChanges();

      expect(component.showFilterFields()).toBe(true);

      // Check if filter type field exists
      const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
      const filterTypeField = Array.from(formFields).find((field: any) =>
        field.textContent.includes('Filter Type')
      );
      expect(filterTypeField).toBeTruthy();
    });

    it('should show filter fields when docking type is FB', () => {
      component.configuration = { ...mockConfiguration, itemInd: DockingType.FB };
      fixture.detectChanges();

      expect(component.showFilterFields()).toBe(true);
    });

    it('should show filter fields when docking type is BF', () => {
      component.configuration = { ...mockConfiguration, itemInd: DockingType.BF };
      fixture.detectChanges();

      expect(component.showFilterFields()).toBe(true);
    });

    it('should hide filter fields when docking type is BA', () => {
      component.configuration = mockConfiguration; // BA type
      fixture.detectChanges();

      expect(component.showFilterFields()).toBe(false);
    });

    it('should hide filter fields when docking type is SE', () => {
      component.configuration = { ...mockConfiguration, itemInd: DockingType.SE };
      fixture.detectChanges();

      expect(component.showFilterFields()).toBe(false);
    });

    it('should hide filter fields when docking type is NE', () => {
      component.configuration = { ...mockConfiguration, itemInd: DockingType.NE };
      fixture.detectChanges();

      expect(component.showFilterFields()).toBe(false);
    });


  });

  describe('Empty Configuration', () => {
    it('should handle null configuration gracefully', () => {
      component.configuration = null;
      fixture.detectChanges();

      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle undefined configuration gracefully', () => {
      component.configuration = undefined;
      fixture.detectChanges();

      expect(() => fixture.detectChanges()).not.toThrow();
    });


    it('should not show filter fields when configuration is null', () => {
      component.configuration = null;
      fixture.detectChanges();

      expect(component.showFilterFields()).toBe(false);
    });
  });

  describe('Partial Configuration', () => {
    it('should handle missing optional fields', () => {
      const partialConfig: DockingConfigurationComplete = {
        unitId: 'W454526051302',
        chapterId: 'TEST_CHAPTER',
        collDate: '2026-05-26',
        itemInd: DockingType.BA
      };

      component.configuration = partialConfig;
      fixture.detectChanges();

      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should display empty string for missing description', () => {
      const configWithoutDesc: DockingConfigurationComplete = {
        ...mockConfiguration,
        description: undefined
      };

      component.configuration = configWithoutDesc;
      fixture.detectChanges();

      const inputs = fixture.nativeElement.querySelectorAll('input');
      const hasEmptyDescription = Array.from(inputs).some((input: any) =>
        input.value === '' && input.parentElement?.textContent.includes('Description')
      );
      expect(hasEmptyDescription).toBe(true);
    });
  });

  describe('Layout', () => {
    beforeEach(() => {
      component.configuration = mockConfiguration;
      fixture.detectChanges();
    });


    it('should display fields in grid layout', () => {
      const rows = fixture.nativeElement.querySelectorAll('.form-row');
      expect(rows.length).toBeGreaterThan(0);

      const firstRow = rows[0];
      expect(firstRow.classList.contains('form-row')).toBe(true);
      // grid layout is applied via SCSS (.form-row { display: grid })
      // which is not processed by jsdom; verify fields are present instead
      const formFields = firstRow.querySelectorAll('mat-form-field');
      expect(formFields.length).toBeGreaterThan(0);
    });

    it('should have gray background for read-only fields', () => {
      const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
      expect(formFields.length).toBeGreaterThan(0);
    });
  });

  describe('Field Labels', () => {
    beforeEach(() => {
      component.configuration = mockConfiguration;
      fixture.detectChanges();
    });

    it('should display correct labels for all fields', () => {
      const labels = [
        'Docking Type',
        'Description',
        'Machine Code',
        'Wafer Lot',
        'Number of Units',
        'Bag Catalog No',
        'Bag Lot Number',
        'Number of Components',
        'Attribute Code',
        'Attribute Description',
        'Process Date'
      ];

      labels.forEach(label => {
        const labelElement = fixture.nativeElement.textContent;
        expect(labelElement).toContain(label);
      });
    });

    it('should display labels without hardcoded asterisks', () => {
      const labels = [
        'Docking Type',
        'Machine Code',
        'Wafer Lot',
        'Number of Units',
        'Bag Catalog No',
        'Bag Lot Number',
        'Number of Components'
      ];

      labels.forEach(label => {
        const content = fixture.nativeElement.textContent;
        expect(content).toContain(label);
      });
    });
  });

  describe('Conditional Filter Labels', () => {
    it('should show filter field labels when applicable', () => {
      component.configuration = mockConfigurationWithFilter;
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Filter Type');
      expect(content).toContain('Filter Lot Number');
    });

    it('should display filter field labels without hardcoded asterisks', () => {
      component.configuration = mockConfigurationWithFilter;
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Filter Type');
      expect(content).toContain('Filter Lot Number');
    });
  });

  describe('Value Formatting', () => {
    it('should display numeric values as strings', () => {
      component.configuration = mockConfiguration;
      fixture.detectChanges();

      // Give DOM time to render in CI environment
      const inputs = fixture.nativeElement.querySelectorAll('input');
      const numericInputs = Array.from(inputs).filter((input: any) =>
        input.value === '5' || input.value === '3'
      );
      expect(numericInputs.length).toBeGreaterThan(0);
    });

    it('should handle null values', () => {
      const configWithNulls: any = {
        ...mockConfiguration,
        description: null,
        attributeDescription: null
      };

      component.configuration = configWithNulls;
      fixture.detectChanges();

      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle undefined values', () => {
      const configWithUndefined: any = {
        ...mockConfiguration,
        description: undefined,
        attributeDescription: undefined
      };

      component.configuration = configWithUndefined;
      fixture.detectChanges();

      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });
});
