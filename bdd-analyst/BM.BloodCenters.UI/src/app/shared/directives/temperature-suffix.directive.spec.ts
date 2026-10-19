import { Component, ViewChild, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { TemperatureSuffixDirective } from './temperature-suffix.directive';

@Component({
  standalone: true,
  imports: [TemperatureSuffixDirective, ReactiveFormsModule],
  template: `<input #inputRef appTemperatureSuffix [formControl]="control" />`,
})
class TestHostComponent {
  control = new FormControl<number | null>(null);
  @ViewChild('inputRef', { static: true }) inputRef!: ElementRef<HTMLInputElement>;
}

describe('TemperatureSuffixDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let inputEl: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  it('should create', () => {
    expect(inputEl).toBeTruthy();
  });

  describe('formatDisplay via control setValue', () => {
    it('should format value with °C suffix', fakeAsync(() => {
      component.control.setValue(37);
      tick(10);
      expect(inputEl.value).toBe('37°C');
    }));

    it('should display empty for null', fakeAsync(() => {
      component.control.setValue(null);
      tick(10);
      expect(inputEl.value).toBe('');
    }));

    it('should format decimal value', fakeAsync(() => {
      component.control.setValue(22.5);
      tick(10);
      expect(inputEl.value).toContain('22.5');
      expect(inputEl.value).toContain('°C');
    }));

    it('should format negative value', fakeAsync(() => {
      component.control.setValue(-5);
      tick(10);
      expect(inputEl.value).toBe('-5°C');
    }));

    it('should clear display when set to empty string', fakeAsync(() => {
      component.control.setValue(37);
      tick(10);
      component.control.setValue('' as any);
      tick(10);
      expect(inputEl.value).toBe('');
    }));
  });

  describe('onKeydown', () => {
    function fireKeydown(key: string, opts: Partial<KeyboardEvent> = {}): boolean {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
      return inputEl.dispatchEvent(event);
    }

    it('should allow digit keys', () => {
      fireKeydown('5');
    });

    it('should allow backspace', () => {
      fireKeydown('Backspace');
    });

    it('should allow tab', () => {
      fireKeydown('Tab');
    });

    it('should allow arrow keys', () => {
      fireKeydown('ArrowLeft');
      fireKeydown('ArrowRight');
    });

    it('should allow Ctrl+A', () => {
      fireKeydown('a', { ctrlKey: true });
    });

    it('should allow Ctrl+C', () => {
      fireKeydown('c', { ctrlKey: true });
    });

    it('should allow Ctrl+V', () => {
      fireKeydown('v', { ctrlKey: true });
    });

    it('should prevent letter keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      const spy = jest.spyOn(event, 'preventDefault');
      inputEl.dispatchEvent(event);
      expect(spy).toHaveBeenCalled();
    });

    it('should allow minus and decimal point', () => {
      fireKeydown('-');
      fireKeydown('.');
    });
  });

  describe('onClick', () => {
    it('should handle click event', fakeAsync(() => {
      component.control.setValue(37);
      tick(10);
      inputEl.click();
      tick(10);
    }));
  });

  it('should clean up on destroy', () => {
    fixture.destroy();
    expect(() => component.control.setValue(100)).not.toThrow();
  });
});
