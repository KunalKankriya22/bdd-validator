import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, EventEmitter, Output } from '@angular/core';
import { AboLabelingIsbtComponent } from './abo-labeling-isbt.component';
import { PrinterInfo } from './models/abo-labeling.model';

@Component({ selector: 'app-printer-selection', standalone: true, template: '' })
class PrinterSelectionStubComponent {
  @Output() printerSelected = new EventEmitter<PrinterInfo>();
  @Output() facilitySelected = new EventEmitter<void>();
  @Output() tieTagPrinterSelected = new EventEmitter<void>();
}

@Component({ selector: 'app-abo-labeling-form', standalone: true, template: '' })
class AboLabelingFormStubComponent {}

describe('AboLabelingIsbtComponent', () => {
  let component: any;
  let fixture: ComponentFixture<AboLabelingIsbtComponent>;

  beforeEach(() => {



      TestBed.configureTestingModule({
      imports: [AboLabelingIsbtComponent, NoopAnimationsModule],
    })
      .overrideComponent(AboLabelingIsbtComponent, {
        set: {
          imports: [PrinterSelectionStubComponent, AboLabelingFormStubComponent],
        },
      });


    



    fixture = TestBed.createComponent(AboLabelingIsbtComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should show printer selection by default', () => {
      fixture.detectChanges();
      expect((component as any).showPrinterSelection()).toBeTrue();
    });


  });

  describe('View Switching', () => {
    it('should switch to ABO labeling form after printer selection', () => {
      fixture.detectChanges();

      const mockPrinter: PrinterInfo = {
        id: '1',
        name: 'SATO 4x4',
        description: 'Lenexa - 4X4',
        isSelected: true,
      };

      component.onPrinterSelected(mockPrinter);
      fixture.detectChanges();

      expect((component as any).showPrinterSelection()).toBeFalse();
      expect((component as any).selectedPrinter()).toBe(mockPrinter);

      const aboForm = fixture.debugElement.query(By.css('app-abo-labeling-form'));
      expect(aboForm).toBeTruthy();
    });

    it('should switch back to printer selection when requested', () => {
      (component as any).showPrinterSelection.set(false);
      fixture.detectChanges();

      component.onChangePrinter();
      fixture.detectChanges();

      expect((component as any).showPrinterSelection()).toBeTrue();

      const printerSelection = fixture.debugElement.query(
        By.css('app-printer-selection')
      );
      expect(printerSelection).toBeTruthy();
    });
  });

  describe('Printer Selection Events', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle facility selection event', () => {
      spyOn(console, 'log');
      component.onFacilitySelected();
      expect(console.log).toHaveBeenCalledWith('Select processing facility');
    });

    it('should handle tie tag printer selection event', () => {
      spyOn(console, 'log');
      component.onTieTagPrinterSelected();
      expect(console.log).toHaveBeenCalledWith('Select tie tag printer');
    });
  });

  describe('Component Display', () => {
    it('should not show both components at the same time', () => {
      fixture.detectChanges();

      const printerSelection = fixture.debugElement.query(
        By.css('app-printer-selection')
      );
      const aboForm = fixture.debugElement.query(By.css('app-abo-labeling-form'));

      expect(printerSelection).toBeTruthy();
      expect(aboForm).toBeFalsy();

      (component as any).showPrinterSelection.set(false);
      fixture.detectChanges();

      const printerSelection2 = fixture.debugElement.query(
        By.css('app-printer-selection')
      );
      const aboForm2 = fixture.debugElement.query(By.css('app-abo-labeling-form'));

      expect(printerSelection2).toBeFalsy();
      expect(aboForm2).toBeTruthy();
    });
  });
});
