import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';

export function createMockHeaderService(overrides?: Partial<Record<string, any>>): jasmine.SpyObj<HeaderService> {
  const props = {
    chapterId: signal('TST'),
    warehouseId: signal('WH01'),
    chapterName: signal('Test Chapter'),
    warehouseName: signal('Test Warehouse'),
    chapterTimeZone: signal('America/New_York'),
    chapterPrintHdr: signal(''),
    databasePrefix: signal(''),
    databaseName: signal(''),
    headerConfig: signal({ title: 'Blood Centers', subtitle: '', logoUrl: '' }),
    institutionLogoUrl: signal(''),
    chapterChanged$: new Subject<void>().asObservable(),
    ...overrides,
  };

  const spy = jasmine.createSpyObj('HeaderService', [
    'getCurrentChapterId',
    'getCurrentWarehouseId',
    'getCurrentChapterName',
    'getCurrentChapterTimezone',
    'getCurrentUsername',
    'fetchSystemUser',
    'fetchSystemUserByEmail',
    'loadUserData',
    'updateChapterAndWarehouse',
    'updateHeaderConfig',
    'updateHeaderFromApiResponse',
    'loadInstitutionLogo',
    'clearCookies',
    'clearSession',
    'loadFromCookies',
  ]);
  Object.assign(spy, props);

  const readSignal = (v: any) => typeof v === 'function' ? v() : v;
  spy.getCurrentChapterId.and.returnValue(readSignal(props.chapterId) || 'TST');
  spy.getCurrentWarehouseId.and.returnValue(readSignal(props.warehouseId) || 'WH01');
  spy.getCurrentChapterName.and.returnValue(readSignal(props.chapterName) || 'Test Chapter');
  spy.getCurrentChapterTimezone.and.returnValue(readSignal(props.chapterTimeZone) || 'America/New_York');
  spy.getCurrentUsername.and.returnValue('testuser');
  spy.fetchSystemUser.and.returnValue(of({} as any));
  spy.fetchSystemUserByEmail.and.returnValue(of({} as any));

  return spy;
}

export function createMockSnackbarService(): jasmine.SpyObj<SnackbarService> {
  return jasmine.createSpyObj('SnackbarService', [
    'showSuccess',
    'showError',
    'showInfo',
  ]);
}

export function createMockPageHeaderService(): jasmine.SpyObj<PageHeaderService> {
  const spy = jasmine.createSpyObj('PageHeaderService', [
    'getCurrentMenuItem',
    'getTitle',
    'getSubtitle',
    'pageHeaderData',
  ]);

  spy.getCurrentMenuItem.and.returnValue({ label: 'Test', link: null });
  spy.getTitle.and.returnValue('Test Page');
  spy.getSubtitle.and.returnValue('');

  return spy;
}

export function createMockActivatedRoute(params: Record<string, string> = {}, queryParams: Record<string, string> = {}): Partial<ActivatedRoute> {
  return {
    snapshot: { params, queryParams } as any,
    params: of(params),
    queryParams: of(queryParams),
  } as Partial<ActivatedRoute>;
}

export function createMockMatDialog(): jasmine.SpyObj<any> {
  const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
  dialogRefSpy.afterClosed.and.returnValue(of(null));

  const spy = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
  spy.open.and.returnValue(dialogRefSpy);

  return spy;
}

export function createMockMatSnackBar(): jasmine.SpyObj<any> {
  return jasmine.createSpyObj('MatSnackBar', ['open', 'dismiss']);
}

export function createMockTranslateService(): jasmine.SpyObj<any> {
  const spy = jasmine.createSpyObj('TranslateService', ['instant', 'get']);
  spy.instant.and.returnValue('');
  spy.get.and.returnValue(of(''));
  return spy;
}