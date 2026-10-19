import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DonationNotesTestPage } from './test-page.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('DonationNotesTestPage', () => {
  let component: DonationNotesTestPage;
  let fixture: ComponentFixture<DonationNotesTestPage>;
  let dialogOpenSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DonationNotesTestPage, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    fixture = TestBed.createComponent(DonationNotesTestPage);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template */ }

    dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(undefined)
    });
  });

  it('should open dialog with unit ID and collection date for scenario 1', () => {
    component.openDialog('scenario1');

    expect(dialogOpenSpy).toHaveBeenCalled();
    const callArgs = dialogOpenSpy.calls.mostRecent().args;
    expect(callArgs[1]?.data).toEqual(jasmine.objectContaining({
      unitId: 'W123411201111',
      collectionDate: '2011-05-21',
      chapterId: '52'
    }));
  });

  it('should open dialog with transaction ID for scenario 2', () => {
    component.openDialog('scenario2');

    const callArgs = dialogOpenSpy.calls.mostRecent().args;
    expect(callArgs[1]?.data).toEqual(jasmine.objectContaining({
      transactionId: 'TR02858935',
      chapterId: '52'
    }));
  });

  it('should open dialog with nonexistent unit for scenario 4', () => {
    component.openDialog('scenario4');

    const callArgs = dialogOpenSpy.calls.mostRecent().args;
    expect(callArgs[1]?.data).toEqual(jasmine.objectContaining({
      unitId: 'NONEXISTENT'
    }));
  });
});
