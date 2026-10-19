import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import {
  CreateNewBoxDialogComponent,
  CreateNewBoxDialogData,
  CreateNewBoxDialogResult
} from './create-new-box-dialog';

describe('CreateNewBoxDialogComponent', () => {
  let component: CreateNewBoxDialogComponent;
  let fixture: ComponentFixture<CreateNewBoxDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CreateNewBoxDialogComponent>>;

  const mockDialogData: CreateNewBoxDialogData = {
    currentBoxId: 'BOX-001',
    hasPackedProducts: true
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [CreateNewBoxDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });


    


      dialogRefSpy.close.calls.reset();


    fixture = TestBed.createComponent(CreateNewBoxDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {




    it('should display current box info when provided', () => {
      const boxInfo = fixture.debugElement.query(By.css('.current-box-info'));
      expect(boxInfo).toBeTruthy();
      expect(boxInfo.nativeElement.textContent).toContain('BOX-001');
    });



    it('should initialize with null signal values', () => {
      expect(component['closeCurrentBox']()).toBeNull();
      expect(component['allProperlyPacked']()).toBeNull();
      expect(component['validationError']()).toBeNull();
    });
  });

  describe('Form Validation', () => {






    it('should be valid when both selections are made (Yes/Yes)', () => {
      component['onCloseBoxChange'](true);
      component['onProperlyPackedChange'](true);
      fixture.detectChanges();

      expect(component['isValid']()).toBeTrue();
      expect(component['validationError']()).toBeNull();
    });





    it('should be invalid when trying to close box with improperly packed products', () => {
      component['onCloseBoxChange'](true);
      component['onProperlyPackedChange'](false);
      fixture.detectChanges();

      expect(component['isValid']()).toBeFalse();
      expect(component['validationError']()).toContain('cannot be closed');

    });

    it('should display validation error for invalid combination', () => {
      component['onCloseBoxChange'](true);
      component['onProperlyPackedChange'](false);
      fixture.detectChanges();

      const errorDiv = fixture.debugElement.query(By.css('.validation-error'));
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.nativeElement.textContent).toContain('cannot be closed');
    });

    it('should have CREATE NEW button disabled when invalid', () => {
      const createBtn = fixture.debugElement.query(By.css('[id$="create-btn"]'));
      expect(createBtn.nativeElement.disabled).toBeTrue();
    });

    it('should have CREATE NEW button enabled when valid', () => {
      component['onCloseBoxChange'](false);
      component['onProperlyPackedChange'](true);
      fixture.detectChanges();

      const createBtn = fixture.debugElement.query(By.css('[id$="create-btn"]'));
      expect(createBtn.nativeElement.disabled).toBeFalse();
    });
  });

  describe('User Interactions', () => {
    it('should update closeCurrentBox signal when Yes is selected', () => {
      const yesRadio = fixture.debugElement.query(By.css('[id$="close-box-yes"]'));
      const input = yesRadio.query(By.css('input'));
      input.nativeElement.click();
      fixture.detectChanges();

      expect(component['closeCurrentBox']()).toBeTrue();
    });

    it('should update closeCurrentBox signal when No is selected', () => {
      const noRadio = fixture.debugElement.query(By.css('[id$="close-box-no"]'));
      const input = noRadio.query(By.css('input'));
      input.nativeElement.click();
      fixture.detectChanges();

      expect(component['closeCurrentBox']()).toBeFalse();
    });

    it('should update allProperlyPacked signal when Yes is selected', () => {
      const yesRadio = fixture.debugElement.query(By.css('[id$="properly-packed-yes"]'));
      const input = yesRadio.query(By.css('input'));
      input.nativeElement.click();
      fixture.detectChanges();

      expect(component['allProperlyPacked']()).toBeTrue();
    });

    it('should update allProperlyPacked signal when No is selected', () => {
      const noRadio = fixture.debugElement.query(By.css('[id$="properly-packed-no"]'));
      const input = noRadio.query(By.css('input'));
      input.nativeElement.click();
      fixture.detectChanges();

      expect(component['allProperlyPacked']()).toBeFalse();
    });



    it('should not close dialog when CREATE NEW is clicked and invalid', () => {
      const createBtn = fixture.debugElement.query(By.css('[id$="create-btn"]'));
      // Button is disabled, but let's test the method directly
      component['onCreate']();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
      expect(component['validationError']()).toBeTruthy();
    });


  });

  describe('Accessibility', () => {












    it('should have required markers for both questions', () => {
      const groups = fixture.debugElement.queryAll(By.css('mat-radio-group[aria-required="true"]'));
      expect(groups.length).toBe(2);
    });
  });
});
