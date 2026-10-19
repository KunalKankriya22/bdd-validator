import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { InstrumentInterfaceApiManager } from './instrument-interface-api-manager';
import { InstrumentInterfaceService } from './services/instrument-interface.service';
import { RawDataTab } from './components/raw-data-tab/raw-data-tab';
import { UploadStatusTab } from './components/upload-status-tab/upload-status-tab';
import { ManualUploadTab } from './components/manual-upload-tab/manual-upload-tab';
import { ViewLogPrintTab } from './components/view-log-print-tab/view-log-print-tab';
import { ManageErrorsTab } from './components/manage-errors-tab/manage-errors-tab';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';

@Component({ selector: 'app-raw-data-tab', standalone: true, template: '' })
class RawDataTabStub {
  @Input() chapterId = '';
  @Input() instrumentId = '';
}

@Component({ selector: 'app-upload-status-tab', standalone: true, template: '' })
class UploadStatusTabStub {
  @Input() chapterId = '';
  @Input() instrumentId = '';
}

@Component({ selector: 'app-manual-upload-tab', standalone: true, template: '' })
class ManualUploadTabStub {
  @Input() chapterId = '';
  @Input() instrumentId = '';
}

@Component({ selector: 'app-view-log-print-tab', standalone: true, template: '' })
class ViewLogPrintTabStub {
  @Input() chapterId = '';
  @Input() instrumentId = '';
}

@Component({ selector: 'app-manage-errors-tab', standalone: true, template: '' })
class ManageErrorsTabStub {
  @Input() chapterId = '';
  @Input() instrumentId = '';
}

@Component({ selector: 'app-page-header-with-breadcrumb', standalone: true, template: '' })
class PageHeaderWithBreadcrumbStub {
  @Input() config: unknown;
}

describe('InstrumentInterfaceApiManager', () => {
  let component: InstrumentInterfaceApiManager;
  let fixture: ComponentFixture<InstrumentInterfaceApiManager>;
  let mockInstrumentService: jasmine.SpyObj<InstrumentInterfaceService>;
  let mockCookieService: jasmine.SpyObj<CookieService>;

  beforeEach(() => {

    mockInstrumentService = jasmine.createSpyObj('InstrumentInterfaceService', [
      'getChapters',
      'getInstruments',
      'getUserDetails',
    ]);

    mockCookieService = jasmine.createSpyObj('CookieService', ['get']);
    mockCookieService.get.and.returnValue('');

    mockInstrumentService.getChapters.and.returnValue(
      of([
        { id: 'DAL', name: 'DAL' },
        { id: 'NYC', name: 'NYC' },
      ])
    );

    mockInstrumentService.getInstruments.and.returnValue(
      of([{ id: 'S201', name: 'S201 - Cobas s 201', chapterId: '' }])
    );

    mockInstrumentService.getUserDetails.and.returnValue(
      of({
        success: true,
        message: '',
        statusCode: 200,
        item: { userId: 'user1', userName: 'User 1', staffNo: '001', accPriv: 0 },
        errorResponse: { errorCode: '', error: '' },
      })
    );



      TestBed.configureTestingModule({
      imports: [InstrumentInterfaceApiManager, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: InstrumentInterfaceService, useValue: mockInstrumentService },
        { provide: CookieService, useValue: mockCookieService },
      ],
    })
      .overrideComponent(InstrumentInterfaceApiManager, {
        remove: {
          imports: [
            RawDataTab,
            UploadStatusTab,
            ManualUploadTab,
            ViewLogPrintTab,
            ManageErrorsTab,
            PageHeaderWithBreadcrumb,
          ],
        },
        add: {
          imports: [
            RawDataTabStub,
            UploadStatusTabStub,
            ManualUploadTabStub,
            ViewLogPrintTabStub,
            ManageErrorsTabStub,
            PageHeaderWithBreadcrumbStub,
          ],
        },
      });


    


      mockInstrumentService.getChapters.calls.reset();


      mockInstrumentService.getInstruments.calls.reset();


      mockInstrumentService.getUserDetails.calls.reset();


      mockCookieService.get.calls.reset();


      mockCookieService.get.and.returnValue('');


    fixture = TestBed.createComponent(InstrumentInterfaceApiManager);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should load chapters on init', () => {
    expect(mockInstrumentService.getChapters).toHaveBeenCalled();
    expect(component.chapters().length).toBe(2);
  });

  it('should load instruments on init', () => {
    expect(mockInstrumentService.getInstruments).toHaveBeenCalled();
    expect(component.instruments().length).toBe(1);
  });



  it('should enable retrieve button when both chapter and instrument are selected', () => {
    component.selectedChapterId.set('DAL');
    component.selectedInstrumentId.set('S201');

    expect(component.isRetrieveEnabled()).toBeTruthy();
  });

  it('should disable retrieve button when chapter or instrument is not selected', () => {
    component.selectedChapterId.set('DAL');
    component.selectedInstrumentId.set('');

    expect(component.isRetrieveEnabled()).toBeFalsy();
  });
});
