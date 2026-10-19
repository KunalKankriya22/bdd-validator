import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChangeChapterWarehouseService } from './change-chapter-warehouse.service';
import { LoginService } from '../../../../shared/services/login.service';
import { environment } from '../../../../../environments/environment';

describe('ChangeChapterWarehouseService', () => {
  let service: ChangeChapterWarehouseService;
  let httpMock: HttpTestingController;
  let loginSpy: jasmine.SpyObj<LoginService>;

  const BASE = `${environment.apiUrl}/api/v1/change-chapter-warehouse`;
  const ADMIN_BASE = `${environment.apiUrl}/api/v1/application-administration/change-chapter-warehouse`;

  beforeEach(() => {
    loginSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    loginSpy.getStoredUsername.and.returnValue('testuser');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChangeChapterWarehouseService,
        { provide: LoginService, useValue: loginSpy },
      ],
    });

    service = TestBed.inject(ChangeChapterWarehouseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAllChapters should GET with loggedInUserName param', () => {
    const mock = [{ chapterId: 'C1', chapterName: 'Chapter 1' }];
    service.getAllChapters().subscribe((result) => expect(result).toEqual(mock));

    const req = httpMock.expectOne(r => r.url === `${BASE}/chapters`);
    expect(req.request.params.get('loggedInUserName')).toBe('testuser');
    req.flush(mock);
  });

  it('getWarehousesByChapter should GET by chapterId', () => {
    const mock = [{ warehouseId: 'W1', warehouseName: 'WH 1' }];
    service.getWarehousesByChapter('C1').subscribe((result) => expect(result).toEqual(mock));

    const req = httpMock.expectOne(`${BASE}/chapters/C1/warehouses`);
    req.flush(mock);
  });

  it('updateChapterAndWarehouse should PUT payload', () => {
    const payload = { userId: 'U1', oldChapterId: 'C1', newChapterId: 'C2', newChapterName: 'Ch2', oldWarehouseId: 'W1', newWarehouseId: 'W2', newWarehouseName: 'WH2' };
    const mock = { message: 'OK', oldChapterId: 'C1', newChapterId: 'C2', oldWarehouseId: 'W1', newWarehouseId: 'W2' };
    service.updateChapterAndWarehouse(payload).subscribe((result) => expect(result).toEqual(mock));

    const req = httpMock.expectOne(ADMIN_BASE);
    expect(req.request.method).toBe('PUT');
    req.flush(mock);
  });

  it('getChapterDetails should GET by chapterId', () => {
    const mock = { chapterId: 'C1', chapterName: 'Ch1', chapterTimezone: 'EST' };
    service.getChapterDetails('C1').subscribe((result) => expect(result).toEqual(mock));

    const req = httpMock.expectOne(`${BASE}/chapters/details/C1`);
    req.flush(mock);
  });
});
