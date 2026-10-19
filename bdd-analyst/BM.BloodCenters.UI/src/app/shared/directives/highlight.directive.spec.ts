import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HighlightDirective } from './highlight.directive';

@Component({
  standalone: true,
  imports: [HighlightDirective],
  template: `
    <div id="default" appHighlight>Default</div>
    <div id="custom" appHighlight [highlightColor]="'red'">Custom</div>
  `,
})
class TestHostComponent {}

describe('HighlightDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should apply yellow background on mouseenter by default', () => {
    const el = fixture.debugElement.query(By.css('#default'));
    el.triggerEventHandler('mouseenter', null);
    expect(el.nativeElement.style.backgroundColor).toBe('yellow');
  });

  it('should remove background on mouseleave', () => {
    const el = fixture.debugElement.query(By.css('#default'));
    el.triggerEventHandler('mouseenter', null);
    el.triggerEventHandler('mouseleave', null);
    expect(el.nativeElement.style.backgroundColor).toBe('');
  });

  it('should apply custom color on mouseenter', () => {
    const el = fixture.debugElement.query(By.css('#custom'));
    el.triggerEventHandler('mouseenter', null);
    expect(el.nativeElement.style.backgroundColor).toBe('red');
  });

  it('should remove custom color on mouseleave', () => {
    const el = fixture.debugElement.query(By.css('#custom'));
    el.triggerEventHandler('mouseenter', null);
    el.triggerEventHandler('mouseleave', null);
    expect(el.nativeElement.style.backgroundColor).toBe('');
  });
});
