import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AdditionalChargesPanel } from './additional-charges-modal';
import { OtherCharge, AntigenCharge, AttributeCharge } from '../models/order-charges.model';

describe('AdditionalChargesPanel', () => {
  let component: AdditionalChargesPanel;
  let fixture: ComponentFixture<AdditionalChargesPanel>;

  const mockOtherCharges: OtherCharge[] = [
    { chargeCode: 'B9009', chargeDesc: 'Blood Container', amount: 25.00 },
    { chargeCode: 'B9010', chargeDesc: 'Processing Fee', amount: 15.00 }
  ];

  const mockAntigens: AntigenCharge[] = [
    { unitId: 'W63331707011-H', prodCode: 'E2807100', aliquot: '00', testId: 'AG001', price: 15.00 },
    { unitId: 'W63331707012-H', prodCode: 'E2807200', aliquot: '01', testId: 'AG002', price: 20.00 }
  ];

  const mockAttributes: AttributeCharge[] = [
    {
      unitId: 'W63331803040-H',
      prodCode: 'E0385V00',
      aliquot: '00',
      attributeCode: 'XM',
      attributeDesc: 'XM',
      price: 40.00
    },
    {
      unitId: 'W63331803040-H',
      prodCode: 'E0385V00',
      aliquot: '00',
      attributeCode: 'PP04',
      attributeDesc: 'PP04',
      price: 196.00
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdditionalChargesPanel, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AdditionalChargesPanel);
    component = fixture.componentInstance;
    component.otherCharges = mockOtherCharges;
    component.antigens = mockAntigens;
    component.attributes = mockAttributes;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default empty arrays for inputs', () => {
      const freshFixture = TestBed.createComponent(AdditionalChargesPanel);
      const freshComponent = freshFixture.componentInstance;
      expect(freshComponent.otherCharges).toEqual([]);
      expect(freshComponent.antigens).toEqual([]);
      expect(freshComponent.attributes).toEqual([]);
    });
  });

  describe('Close Panel', () => {
    it('should emit closePanel event when close() is called', () => {
      spyOn(component.closePanel, 'emit');
      component.close();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should call close when close button is clicked', () => {
      spyOn(component, 'close');
      const closeButton = fixture.nativeElement.querySelector('button[aria-label="Close panel"]');
      closeButton.click();
      expect(component.close).toHaveBeenCalled();
    });

    it('should call close when CLOSE action button is clicked', () => {
      spyOn(component, 'close');
      const buttons = fixture.nativeElement.querySelectorAll('.side-panel-actions button');
      const closeBtn = buttons[buttons.length - 1];
      closeBtn.click();
      expect(component.close).toHaveBeenCalled();
    });
  });

  describe('Order Charges Section', () => {
    it('should display charges tables', () => {
      const tables = fixture.nativeElement.querySelectorAll('.charges-table');
      expect(tables.length).toBe(3);
    });

    it('should display order charge rows', () => {
      const chargesSection = fixture.nativeElement.querySelector('.charges-section');
      const rows = chargesSection.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should display charge code and description', () => {
      const chargesSection = fixture.nativeElement.querySelector('.charges-section');
      const firstRow = chargesSection.querySelector('tbody tr');
      expect(firstRow.textContent).toContain('B9009');
      expect(firstRow.textContent).toContain('Blood Container');
    });

    it('should display charge amount formatted as currency', () => {
      const chargesSection = fixture.nativeElement.querySelector('.charges-section');
      const firstRow = chargesSection.querySelector('tbody tr');
      expect(firstRow.textContent).toContain('$25.00');
    });

    it('should show "--" when charges array is empty', () => {
      component.otherCharges = [];
      component.antigens = [];
      component.attributes = [];
      fixture.detectChanges();

      const noDataCells = fixture.nativeElement.querySelectorAll('.no-data');
      expect(noDataCells.length).toBeGreaterThan(0);
    });
  });

  describe('Product Antigens Section', () => {
    it('should display antigen rows', () => {
      const sections = fixture.nativeElement.querySelectorAll('.charges-section');
      const antigenSection = sections[1];
      const rows = antigenSection.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should display antigen unit ID and test ID', () => {
      const sections = fixture.nativeElement.querySelectorAll('.charges-section');
      const antigenSection = sections[1];
      const firstRow = antigenSection.querySelector('tbody tr');
      expect(firstRow.textContent).toContain('W63331707011-H');
      expect(firstRow.textContent).toContain('AG001');
    });

    it('should display antigen price formatted as currency', () => {
      const sections = fixture.nativeElement.querySelectorAll('.charges-section');
      const antigenSection = sections[1];
      const firstRow = antigenSection.querySelector('tbody tr');
      expect(firstRow.textContent).toContain('$15.00');
    });

    it('should show "--" when antigens array is empty', () => {
      component.antigens = [];
      fixture.detectChanges();

      const sections = fixture.nativeElement.querySelectorAll('.charges-section');
      const antigenSection = sections[1];
      const noData = antigenSection.querySelector('.no-data');
      expect(noData).toBeTruthy();
    });
  });

  describe('Product Attributes Section', () => {
    it('should display attribute rows', () => {
      const sections = fixture.nativeElement.querySelectorAll('.charges-section');
      const attrSection = sections[2];
      const rows = attrSection.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should display attribute code and price', () => {
      const attrSection = fixture.nativeElement.querySelectorAll('.charges-section')[2];
      const firstRow = attrSection.querySelector('tbody tr');
      expect(firstRow.textContent).toContain('XM');
      expect(firstRow.textContent).toContain('$40.00');
    });

    it('should display second attribute row', () => {
      const attrSection = fixture.nativeElement.querySelectorAll('.charges-section')[2];
      const rows = attrSection.querySelectorAll('tbody tr');
      expect(rows[1].textContent).toContain('PP04');
      expect(rows[1].textContent).toContain('$196.00');
    });

    it('should show "--" when attributes array is empty', () => {
      component.attributes = [];
      fixture.detectChanges();

      const sections = fixture.nativeElement.querySelectorAll('.charges-section');
      const attrSection = sections[2];
      const noData = attrSection.querySelector('.no-data');
      expect(noData).toBeTruthy();
    });

    it('should display "--" for null attribute descriptions', () => {
      component.attributes = [
        { unitId: 'U1', prodCode: null, aliquot: null, attributeCode: null, attributeDesc: null, price: null }
      ];
      fixture.detectChanges();

      const attrSection = fixture.nativeElement.querySelectorAll('.charges-section')[2];
      const firstRow = attrSection.querySelector('tbody tr');
      expect(firstRow.textContent).toContain('--');
    });
  });

  describe('Currency Formatting', () => {
    it('should format positive currency correctly', () => {
      expect(component.formatCurrency(25.00)).toBe('$25.00');
      expect(component.formatCurrency(40.00)).toBe('$40.00');
    });

    it('should format zero as $0.00', () => {
      expect(component.formatCurrency(0)).toBe('$0.00');
    });

    it('should format null as $0.00', () => {
      expect(component.formatCurrency(null)).toBe('$0.00');
    });

    it('should format undefined as $0.00', () => {
      expect(component.formatCurrency(undefined)).toBe('$0.00');
    });

    it('should format decimal values correctly', () => {
      expect(component.formatCurrency(1234.5)).toBe('$1234.50');
      expect(component.formatCurrency(0.99)).toBe('$0.99');
    });
  });

  describe('Panel Header', () => {
    it('should display panel title', () => {
      const title = fixture.nativeElement.querySelector('.side-panel-header h2');
      expect(title.textContent).toContain('Additional Order Charges, Attributes, and Antigens');
    });
  });

  describe('Section Titles', () => {
    it('should display all section titles', () => {
      const titles = fixture.nativeElement.querySelectorAll('.section-title');
      expect(titles.length).toBe(3);
      expect(titles[0].textContent).toContain('Order Charges');
      expect(titles[1].textContent).toContain('Product Antigens');
      expect(titles[2].textContent).toContain('Product Attributes');
    });
  });

  describe('Table Accessibility', () => {
    it('should have aria-label on all tables', () => {
      const tables = fixture.nativeElement.querySelectorAll('.charges-table');
      expect(tables[0].getAttribute('aria-label')).toBe('Order charges table');
      expect(tables[1].getAttribute('aria-label')).toBe('Product antigens table');
      expect(tables[2].getAttribute('aria-label')).toBe('Product attributes table');
    });

    it('should have role="table" on all tables', () => {
      const tables = fixture.nativeElement.querySelectorAll('.charges-table');
      tables.forEach((table: HTMLElement) => {
        expect(table.getAttribute('role')).toBe('table');
      });
    });
  });
});
