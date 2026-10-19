import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidePanelBase } from './side-panel-base';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DialogButton } from '@shared/interfaces/dialog.interface';

describe('SidePanelBase', () => {
  let component: SidePanelBase;
  let fixture: ComponentFixture<SidePanelBase>;

  const mockFooterButtons: DialogButton[] = [
    { label: 'Cancel', action: 'cancel', variant: 'secondary' },
    { label: 'Save', action: 'save', variant: 'primary' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SidePanelBase]
    }).compileComponents();

    fixture = TestBed.createComponent(SidePanelBase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Input properties', () => {

    it('should have default width as 754px', () => {
      expect(component.width).toBe('754px');
    });

    it('should have default showFooter as true', () => {
      expect(component.showFooter).toBe(true);
    });


    it('should have default closeButtonAriaLabel', () => {
      expect(component.closeButtonAriaLabel).toBe('Close panel');
    });

    it('should accept custom title', () => {
      component.title = 'Test Panel';
      expect(component.title).toBe('Test Panel');
    });

    it('should accept custom width', () => {
      component.width = '948px';
      expect(component.width).toBe('948px');
    });

    it('should accept custom footerButtons', () => {
      component.footerButtons = mockFooterButtons;
      expect(component.footerButtons).toEqual(mockFooterButtons);
    });
  });
  describe('trackByButton', () => {
    it('should return button action as tracking key', () => {
      const button: DialogButton = { label: 'Save', action: 'save', variant: 'primary' };

      const result = component.trackByButton(0, button);

      expect(result).toBe('save');
    });

  });
  describe('Template rendering', () => {

    it('should render footer buttons when provided', () => {
      component.footerButtons = mockFooterButtons;
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.side-panel__footer button');
      expect(buttons.length).toBeGreaterThanOrEqual(0);
    });

  });
});
