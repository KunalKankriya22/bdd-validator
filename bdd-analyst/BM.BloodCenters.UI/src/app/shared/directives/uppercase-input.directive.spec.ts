import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { UppercaseInputDirective } from './uppercase-input.directive';

@Component({
  standalone: true,
  imports: [UppercaseInputDirective, ReactiveFormsModule],
  template: `<input appUppercaseInput [formControl]="control" />`,
})
class TestHostComponent {
  control = new FormControl('');
}

describe('UppercaseInputDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let inputEl: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  it('should create the directive', () => {
    expect(inputEl).toBeTruthy();
  });

  it('should uppercase input value on input event', () => {
    inputEl.value = 'hello';
    inputEl.dispatchEvent(new Event('input'));
    expect(inputEl.value).toBe('HELLO');
  });

  it('should not modify already-uppercase value', () => {
    inputEl.value = 'HELLO';
    inputEl.dispatchEvent(new Event('input'));
    expect(inputEl.value).toBe('HELLO');
  });

  it('should uppercase mixed case input', () => {
    inputEl.value = 'Hello World';
    inputEl.dispatchEvent(new Event('input'));
    expect(inputEl.value).toBe('HELLO WORLD');
  });

  it('should update the form control value', () => {
    inputEl.value = 'test';
    inputEl.dispatchEvent(new Event('input'));
    expect(component.control.value).toBe('TEST');
  });
});
