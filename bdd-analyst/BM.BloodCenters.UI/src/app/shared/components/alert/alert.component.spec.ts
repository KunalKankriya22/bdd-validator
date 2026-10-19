import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AlertComponent } from './alert.component';

describe('AlertComponent', () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;

  beforeAll(async () => {

      await TestBed.configureTestingModule({
        teardown: { destroyAfterEach: false },
      imports: [AlertComponent],
    }).compileComponents();

    });

  beforeEach(() => {

    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should default to info type', () => {
      expect(component.type).toBe('info');
    });

    it('should default to polite aria-live', () => {
      expect(component.ariaLive).toBe('polite');
    });

    it('should default to not dismissible', () => {
      expect(component.dismissible).toBe(false);
    });
  });

  describe('type CSS classes', () => {
    it('should apply alert--info class by default', () => {
      const alertEl = fixture.nativeElement.querySelector('.alert');
      expect(alertEl.classList.contains('alert--info')).toBe(true);
    });

    it('should apply alert--success class for success type', () => {
      component.type = 'success';
      fixture.detectChanges();
      const alertEl = fixture.nativeElement.querySelector('.alert');
      expect(alertEl.classList.contains('alert--success')).toBe(true);
    });

    it('should apply alert--error class for error type', () => {
      component.type = 'error';
      fixture.detectChanges();
      const alertEl = fixture.nativeElement.querySelector('.alert');
      expect(alertEl.classList.contains('alert--error')).toBe(true);
    });

    it('should apply alert--warning class for warning type', () => {
      component.type = 'warning';
      fixture.detectChanges();
      const alertEl = fixture.nativeElement.querySelector('.alert');
      expect(alertEl.classList.contains('alert--warning')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should have role="alert"', () => {
      const alertEl = fixture.nativeElement.querySelector('.alert');
      expect(alertEl.getAttribute('role')).toBe('alert');
    });

    it('should set aria-live attribute', () => {
      const alertEl = fixture.nativeElement.querySelector('.alert');
      expect(alertEl.getAttribute('aria-live')).toBe('polite');
    });

    it('should update aria-live when changed', () => {
      component.ariaLive = 'assertive';
      fixture.detectChanges();
      const alertEl = fixture.nativeElement.querySelector('.alert');
      expect(alertEl.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('dismiss button', () => {
    it('should not show dismiss button when not dismissible', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeNull();
    });

    it('should show dismiss button when dismissible', () => {
      component.dismissible = true;
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('should emit dismissed event on dismiss click', () => {
      component.dismissible = true;
      fixture.detectChanges();
      const spy = jest.spyOn(component.dismissed, 'emit');
      const button = fixture.nativeElement.querySelector('button');
      button.click();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('content projection', () => {
    it('should project content into alert__content', () => {
      const contentEl = fixture.nativeElement.querySelector('.alert__content');
      expect(contentEl).toBeTruthy();
    });
  });
});
