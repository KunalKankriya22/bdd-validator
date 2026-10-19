import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClickOutsideDirective } from './click-outside.directive';

@Component({
  standalone: true,
  imports: [ClickOutsideDirective],
  template: `<div appClickOutside (clickOutside)="onClickOutside()">Content</div>`,
})
class TestHostComponent {
  onClickOutside = jest.fn();
}

describe('ClickOutsideDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the directive', () => {
    expect(fixture.nativeElement.querySelector('[appClickOutside]')).toBeTruthy();
  });

  it('should emit clickOutside on document click', () => {
    document.dispatchEvent(new MouseEvent('click'));
    expect(component.onClickOutside).toHaveBeenCalled();
  });

  it('should emit on each click', () => {
    document.dispatchEvent(new MouseEvent('click'));
    document.dispatchEvent(new MouseEvent('click'));
    expect(component.onClickOutside).toHaveBeenCalledTimes(2);
  });
});
