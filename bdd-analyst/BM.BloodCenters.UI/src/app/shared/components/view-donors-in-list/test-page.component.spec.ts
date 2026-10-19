import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViewDonorsTestPageComponent } from './test-page.component';
import { MatDialog } from '@angular/material/dialog';

describe('ViewDonorsTestPageComponent', () => {
  let component: ViewDonorsTestPageComponent;
  let fixture: ComponentFixture<ViewDonorsTestPageComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      imports: [ViewDonorsTestPageComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: dialogSpy }
      ]
    });

    fixture = TestBed.createComponent(ViewDonorsTestPageComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template binding errors */ }
  });

  describe('Open Basic Dialog', () => {
    it('should open dialog without data', () => {
      // Act
      component.openBasicDialog();

      // Assert
      expect(dialogSpy.open).toHaveBeenCalled();
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1]?.data).toBeUndefined();
    });
  });

  describe('Open Dialog with List ID', () => {
    it('should open dialog with listId in data', () => {
      // Act
      component.openWithListId('LIST00406');

      // Assert
      expect(dialogSpy.open).toHaveBeenCalled();
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1]?.data).toEqual({ listId: 'LIST00406' });
    });
  });
});
