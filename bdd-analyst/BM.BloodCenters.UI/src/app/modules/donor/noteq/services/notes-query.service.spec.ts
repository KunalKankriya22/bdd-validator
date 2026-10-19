import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotesQueryService } from './notes-query.service';
import { ApiService } from '@shared/services/api.service';

describe('NotesQueryService', () => {
  let service: NotesQueryService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [
        NotesQueryService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });
    service = TestBed.inject(NotesQueryService);
  });

  describe('searchNotes', () => {
    it('returns response.item when success is true and item exists', (done) => {
      const item = { notes: [{ id: '1' }], userCounts: [], programCounts: [], totalNotes: 1, totalCount: 1 };
      apiSpy.post.and.returnValue(of({ success: true, item }));

      service.searchNotes({} as any).subscribe((result) => {
        expect(result).toEqual(item);
        done();
      });
    });

    it('returns empty structure when success is true but item is null', (done) => {
      apiSpy.post.and.returnValue(of({ success: true, item: null }));

      service.searchNotes({} as any).subscribe((result) => {
        expect(result.notes).toEqual([]);
        expect(result.totalNotes).toBe(0);
        expect(result.totalCount).toBe(0);
        done();
      });
    });

    it('returns empty structure when success is false', (done) => {
      apiSpy.post.and.returnValue(of({ success: false, item: null }));

      service.searchNotes({} as any).subscribe((result) => {
        expect(result.notes).toEqual([]);
        expect(result.totalCount).toBe(0);
        done();
      });
    });

    it('propagates API errors via catchError', (done) => {
      apiSpy.post.and.returnValue(throwError(() => new Error('Network failure')));

      service.searchNotes({} as any).subscribe({
        error: (e) => {
          expect(e.message).toBe('Network failure');
          done();
        },
      });
    });
  });

  describe('getUsers and getPrograms (LOV endpoints)', () => {
    const lovMethods: { name: string; call: () => any }[] = [
      { name: 'getUsers', call: () => service.getUsers({} as any) },
      { name: 'getPrograms', call: () => service.getPrograms({} as any) },
    ];

    lovMethods.forEach(({ name, call }) => {
      it(`${name} extracts data array from response`, (done) => {
        const items = [{ id: '1', name: 'Test' }];
        apiSpy.post.and.returnValue(of({ data: items }));

        call().subscribe((result: any) => {
          expect(result).toEqual(items);
          done();
        });
      });

      it(`${name} returns empty array when data is nullish`, (done) => {
        apiSpy.post.and.returnValue(of({ data: null }));

        call().subscribe((result: any) => {
          expect(result).toEqual([]);
          done();
        });
      });

      it(`${name} propagates errors`, (done) => {
        apiSpy.post.and.returnValue(throwError(() => new Error('fail')));

        call().subscribe({
          error: (e: any) => {
            expect(e.message).toBe('fail');
            done();
          },
        });
      });
    });
  });
});
