import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ChapterLookupService } from './chapter-lookup.service';
import { ApiService } from '@shared/services/api.service';
import { LoggingService } from '@shared/services/logging.service';

describe('ChapterLookupService', () => {
  let service: ChapterLookupService;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let loggingSpy: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get']);
    loggingSpy = jasmine.createSpyObj('LoggingService', ['log', 'error']);

    TestBed.configureTestingModule({
      providers: [
        ChapterLookupService,
        { provide: ApiService, useValue: apiSpy },
        { provide: LoggingService, useValue: loggingSpy },
      ],
    });

    service = TestBed.inject(ChapterLookupService);
  });

  it('should return chapters on success', (done) => {
    // Arrange
    const chapters = [{ chapterId: 'CH1', chapterName: 'Chapter 1' }];
    apiSpy.get.and.returnValue(of(chapters));

    // Act
    service.getChapters().subscribe((result) => {
      // Assert
      expect(result).toEqual(chapters as any);
      done();
    });
  });

  it('should return empty array on error', (done) => {
    // Arrange
    apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

    // Act
    service.getChapters().subscribe((result) => {
      // Assert
      expect(result).toEqual([]);
      expect(loggingSpy.error).toHaveBeenCalled();
      done();
    });
  });
});
