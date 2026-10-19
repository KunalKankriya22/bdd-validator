import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { NotificationLogDialogPage } from './notification-log-dialog-page';
import { NotificationLogDialogComponent } from './notification-log-dialog';
import { PageHeaderService } from '@shared/services/page-header.service';

describe('NotificationLogDialogPage', () => {
  let component: NotificationLogDialogPage;
  let fixture: ComponentFixture<NotificationLogDialogPage>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let queryParamsSubject: Subject<any>;

  function createComponent(queryParams: any = {}) {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['getCurrentNavigation']);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [
      'getCurrentMenuItem',
      'getTitle',
      'getSubtitle',
    ], {
      pageHeaderData: signal(null),
    });
    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue({ label: 'Test', link: null });
    pageHeaderServiceSpy.getTitle.and.returnValue('Test Page');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('');
    queryParamsSubject = new Subject<any>();

    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef.afterClosed.and.returnValue(of(undefined));
    dialogSpy.open.and.returnValue(mockDialogRef);

    TestBed.configureTestingModule({
      imports: [NotificationLogDialogPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable() } },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(NotificationLogDialogPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty donorId', () => {
    expect(component.donorId).toBe('');
  });

  it('should initialize headerConfig with empty values', () => {
    expect(component.headerConfig.title).toBe('');
    expect(component.headerConfig.subtitle).toBe('');
    expect(component.headerConfig.breadcrumbs).toEqual([]);
  });

  it('should open notification log dialog with correct config', () => {
    component.donorId = 'D12345';
    component.openNotificationLog();

    expect(dialogSpy.open).toHaveBeenCalledWith(
      NotificationLogDialogComponent,
      jasmine.objectContaining({
        width: '960px',
        data: { donorId: 'D12345' },
        autoFocus: false,
        disableClose: true,
      }),
    );
  });

  it('should auto-open dialog when donorId is in query params', fakeAsync(() => {
    queryParamsSubject.next({ donorId: 'Q999' });
    tick();

    expect(component.donorId).toBe('Q999');
    expect(dialogSpy.open).toHaveBeenCalled();
  }));

  it('should not open dialog when query params have no donorId', fakeAsync(() => {
    queryParamsSubject.next({});
    tick();

    expect(dialogSpy.open).not.toHaveBeenCalled();
  }));

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
  });
});
