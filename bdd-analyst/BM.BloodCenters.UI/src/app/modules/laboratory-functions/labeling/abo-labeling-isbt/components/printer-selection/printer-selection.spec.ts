import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PrinterSelectionComponent } from './printer-selection';

describe('PrinterSelectionComponent', () => {
  let component: any;
  let fixture: ComponentFixture<PrinterSelectionComponent>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [PrinterSelectionComponent, NoopAnimationsModule],
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(PrinterSelectionComponent);
    component = fixture.componentInstance as any;


    });

  describe('Initialization', () => {

    it('should load printers on init', () => {
      fixture.detectChanges();
      expect(component.printers().length).toBe(4);
    });

    it('should set default printer selection', () => {
      fixture.detectChanges();
      const selected = component.selectedPrinter();
      expect(selected).toBeTruthy();
      expect(selected?.name).toBe('SATO 4x4');
    });

    it('should display current printer', () => {
      fixture.detectChanges();
      expect(component.currentPrinter()).toBe('KAS 4x2');
    });

  });

  describe('Current Settings Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show current printer label and value', () => {
      const currentPrinter = fixture.nativeElement.querySelector('.current-printer .value');
      expect(currentPrinter.textContent).toBe('KAS 4x2');
    });

    it('should show current facility name and address', () => {
      const currentFacility = fixture.nativeElement.querySelector('.current-facility .value');
      expect(currentFacility.textContent).toContain('Central Blood Center');
      expect(currentFacility.textContent).toContain('3851 Roger Brooke Drive Dallas, US, 78234');
    });
  });

  describe('Printer Table', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should show printer names', () => {
      const printerNames = Array.from(
        fixture.nativeElement.querySelectorAll('td:nth-child(2)')
      ).map((el: any) => el.textContent.trim());

      expect(printerNames).toContain('SATO 4x4');
      expect(printerNames).toContain('CO 4x2');
      expect(printerNames).toContain('KAS-4x4');
      expect(printerNames).toContain('CO 4x4');
    });

    it('should show printer descriptions', () => {
      const descriptions = Array.from(
        fixture.nativeElement.querySelectorAll('td:nth-child(3)')
      ).map((el: any) => el.textContent.trim());

      expect(descriptions).toContain('Lenexa - 4X4');
      expect(descriptions).toContain('Colorado 4x2');
    });

  });

  describe('Printer Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should select printer on radio button change', () => {
      const printers = component.printers();
      const secondPrinter = printers[1];

      component.onPrinterSelect(secondPrinter);
      fixture.detectChanges();

      expect(component.selectedPrinter()).toBe(secondPrinter);
    });

    it('should select printer on row click', () => {
      const rows = fixture.debugElement.queryAll(By.css('.printer-row'));
      const secondRow = rows[1];

      secondRow.nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedPrinter()?.id).toBe('2');
    });

    it('should update hasSelection computed signal', () => {
      expect(component.hasSelection()).toBeTrue();

      component.selectedPrinter.set(null);
      expect(component.hasSelection()).toBeFalse();
    });

    it('should check correct radio button', () => {
      const radioButtons = fixture.debugElement.queryAll(By.css('mat-radio-button'));
      const firstRadio = radioButtons[0].componentInstance;

      expect(firstRadio.checked).toBeTrue();
    });
  });

  describe('Error State', () => {
    it('should show error message when error exists', () => {
      component.error.set('Failed to load printers');
      component.loading.set(false);
      fixture.detectChanges();

      const errorContainer = fixture.nativeElement.querySelector('.error-container');
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.textContent).toContain('Failed to load printers');
    });

  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should have tabindex on table rows', () => {
      const row = fixture.nativeElement.querySelector('.printer-row');
      expect(row.getAttribute('tabindex')).toBe('0');
    });

  });
});
