import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { ViewAssociatedInterdictionService } from './view-associated-interdiction.service';

describe('ViewAssociatedInterdictionService', () => {
  let service: ViewAssociatedInterdictionService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get']);

    TestBed.configureTestingModule({
      providers: [
        ViewAssociatedInterdictionService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(ViewAssociatedInterdictionService);
  });

  it('should fetch and map associated interdictions', (done) => {
    // Arrange
    const apiResponse = {
      success: true,
      message: '',
      statusCode: 200,
      data: [
        { code: 'C1', type: 'T1', description: 'Desc', viewLevel: '3', effDate: '2024-01-01' },
      ],
    };
    httpSpy.get.and.returnValue(of(apiResponse));

    // Act
    service.getAssociatedInterdictions('ACC1').subscribe((result) => {
      // Assert
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        code: 'C1',
        type: 'T1',
        description: 'Desc',
        level: 3,
        effectiveDate: '2024-01-01',
      });
      done();
    });
  });
});
