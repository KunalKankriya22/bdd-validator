import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ExpiryWarningDialogComponent } from './expiry-warning-dialog';

describe('ExpiryWarningDialogComponent', () => {
  let component: any; // typed as any to access protected members in tests
  let fixture: ComponentFixture<ExpiryWarningDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ExpiryWarningDialogComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ExpiryWarningDialogComponent, NoopAnimationsModule],
      providers: [{ provide: MatDialogRef, useValue: dialogRefSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpiryWarningDialogComponent);
    component = fixture.componentInstance as any;
    fixture.detectChanges();
  });
  describe('Dialog Content', () => {
    it('should display warning title', () => {
      const titleElement = fixture.nativeElement.querySelector('h2');
      expect(titleElement.textContent).toBe('Warning');
    });

    it('should display expiry message', () => {
      const messageElement = fixture.nativeElement.querySelector('p');
      expect(messageElement.textContent).toBe('Product has already expired. Do you want to continue?');
    });
  });
  describe('Accessibility', () => {



    it('should have cdkFocusInitial on No button', () => {
      const noButton = fixture.nativeElement.querySelector('[cdkFocusInitial]');
      expect(noButton.textContent.trim()).toBe('No');
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate unique IDs across multiple instances', () => {
      const fixture2 = TestBed.createComponent(ExpiryWarningDialogComponent);
      const component2: any = fixture2.componentInstance as any;

      expect(component.componentId).not.toBe(component2.componentId);
      expect(component.elementId('title')).not.toBe(component2.elementId('title'));
    });
  });
});
