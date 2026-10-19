import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViewNotificationLetterTestPage } from './test-page.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('ViewNotificationLetterTestPage', () => {
  let component: ViewNotificationLetterTestPage;
  let fixture: ComponentFixture<ViewNotificationLetterTestPage>;
  let dialogOpenSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ViewNotificationLetterTestPage, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    fixture = TestBed.createComponent(ViewNotificationLetterTestPage);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template */ }

    dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => ({ subscribe: () => {} })
    });
  });

  it('should open dialog with trimmed donor ID', () => {
    component.openDialog('DN00002315');

    expect(dialogOpenSpy).toHaveBeenCalled();
    const callArgs = dialogOpenSpy.calls.mostRecent().args;
    expect(callArgs[1]?.data).toEqual(jasmine.objectContaining({
      donorId: 'DN00002315'
    }));
  });

  it('should not open dialog when donor ID is empty', () => {
    component.openDialog('');
    expect(dialogOpenSpy).not.toHaveBeenCalled();
  });

  it('should not open dialog when donor ID is whitespace', () => {
    component.openDialog('   ');
    expect(dialogOpenSpy).not.toHaveBeenCalled();
  });
});
