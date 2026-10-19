import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should default to medium size', () => {
      expect(component.size).toBe('medium');
    });

    it('should default to empty message', () => {
      expect(component.message).toBe('');
    });

    it('should default to blue color', () => {
      expect(component.color).toBe('#1976d2');
    });
  });

  describe('rendering', () => {
    it('should render the spinner container', () => {
      const container = fixture.nativeElement.querySelector('.spinner-container');
      expect(container).toBeTruthy();
    });

    it('should apply medium size class by default', () => {
      const spinner = fixture.nativeElement.querySelector('.spinner-medium');
      expect(spinner).toBeTruthy();
    });

    it('should apply small size class', () => {
      component.size = 'small';
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('.spinner-small');
      expect(spinner).toBeTruthy();
    });

    it('should apply large size class', () => {
      component.size = 'large';
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('.spinner-large');
      expect(spinner).toBeTruthy();
    });

    it('should not show message by default', () => {
      const message = fixture.nativeElement.querySelector('.spinner-message');
      expect(message).toBeFalsy();
    });

    it('should show message when provided', () => {
      component.message = 'Loading...';
      fixture.detectChanges();
      const message = fixture.nativeElement.querySelector('.spinner-message');
      expect(message).toBeTruthy();
      expect(message.textContent).toContain('Loading...');
    });
  });
});
