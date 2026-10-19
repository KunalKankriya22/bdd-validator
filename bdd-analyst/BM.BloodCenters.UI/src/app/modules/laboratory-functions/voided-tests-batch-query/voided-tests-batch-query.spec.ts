import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VoidedTestsBatchQueryComponent } from './voided-tests-batch-query';
import { VoidedTestsBatchQueryService } from './services/voided-tests-batch-query.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  BatchIdLookupDto,
  TestIdLookupDto,
  VoidedTestResultDto,
} from './models/voided-tests-batch-query.model';

describe('VoidedTestsBatchQueryComponent', () => {
  let serviceSpy: any;
  let component: VoidedTestsBatchQueryComponent;
  let fixture: ComponentFixture<VoidedTestsBatchQueryComponent>;
  let service: jasmine.SpyObj<VoidedTestsBatchQueryService>;

  const mockBatchIds: BatchIdLookupDto[] = [
    { tbId: '092809-TB6124', chapterId: 'BOS' },
    { tbId: '092809-TB6125', chapterId: 'BOS' },
    { tbId: '100109-TB7001', chapterId: 'BOS' },
    { tbId: '100109-TB7002', chapterId: 'BOS' },
  ];

  const mockTestIds: TestIdLookupDto[] = [
    { testId: 'HBSAG' },
    { testId: 'ABORH' },
    { testId: 'HIVNAT' },
  ];

  const mockSearchResults: VoidedTestResultDto[] = [
    {
      displayUnitId: 'W454509926003 - F',
      resultStatus: 'NR',
      resultDats: '28-SEPT-2009 10:21:46',
      voidReasonCode: 'MISC',
      voidDats: '28-SEPT-2009 12:03:37',
      voidUserId: 'LCTS09',
    },
    {
      displayUnitId: 'W454509926004 - G',
      resultStatus: 'A POS',
      resultDats: '28-SEPT-2009 11:00:00',
      voidReasonCode: 'RERUN',
      voidDats: '28-SEPT-2009 13:15:22',
      voidUserId: 'LCTS10',
    },
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('VoidedTestsBatchQueryService', [
      'getBatchIds',
      'getTestIds',
      'search',
    ]);

    serviceSpy.getBatchIds.and.returnValue(of(mockBatchIds));
    serviceSpy.getTestIds.and.returnValue(of(mockTestIds));
    serviceSpy.search.and.returnValue(of(mockSearchResults));



      TestBed.configureTestingModule({
      imports: [
        VoidedTestsBatchQueryComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: VoidedTestsBatchQueryService, useValue: serviceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
    });


    


      serviceSpy.getBatchIds.calls.reset();


      serviceSpy.getTestIds.calls.reset();


      serviceSpy.search.calls.reset();


      serviceSpy.getBatchIds.and.returnValue(of(mockBatchIds));


      serviceSpy.getTestIds.and.returnValue(of(mockTestIds));


      serviceSpy.search.and.returnValue(of(mockSearchResults));


    service = TestBed.inject(VoidedTestsBatchQueryService) as jasmine.SpyObj<VoidedTestsBatchQueryService>;

    fixture = TestBed.createComponent(VoidedTestsBatchQueryComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should initialize header configuration with Home breadcrumb', () => {
      const config = component.headerConfig();
      expect(config.breadcrumbs.length).toBeGreaterThanOrEqual(1);
      expect(config.breadcrumbs[0].label).toBe('Home');
    });





    it('should initialize tbIdControl as null with required validator', () => {
      expect(component.tbIdControl.value).toBeNull();
      expect(component.tbIdControl.valid).toBe(false);
    });

    it('should initialize testIdControl as disabled', () => {
      expect(component.testIdControl.value).toBeNull();
      expect(component.testIdControl.disabled).toBe(true);
    });



    it('should populate allBatchIds signal after load', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.allBatchIds()).toEqual(mockBatchIds);
        expect(component.isLoadingBatchIds).toBe(false);
        done();
      });
    });



    it('should set hasSearched to false initially', () => {
      expect(component.hasSearched).toBe(false);
    });

    it('should set dataSource to empty initially', () => {
      expect(component.dataSource).toEqual([]);
    });
  });

  describe('Retrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call search service when retrieve is triggered', () => {
      component.tbIdControl.setValue(mockBatchIds[0]);
      component.testIdControl.enable();
      component.testIdControl.setValue(mockTestIds[0]);

      component.onRetrieve();

      expect(service.search).toHaveBeenCalledWith({
        tbId: '092809-TB6124',
        testId: 'HBSAG',
      });
    });

    it('should set hasSearched to true after retrieve', () => {
      component.tbIdControl.setValue(mockBatchIds[0]);
      component.testIdControl.enable();
      component.testIdControl.setValue(mockTestIds[0]);

      component.onRetrieve();

      expect(component.hasSearched).toBe(true);
    });

    it('should populate dataSource from response', (done) => {
      component.tbIdControl.setValue(mockBatchIds[0]);
      component.testIdControl.enable();
      component.testIdControl.setValue(mockTestIds[0]);

      component.onRetrieve();

      setTimeout(() => {
        expect(component.dataSource).toEqual(mockSearchResults);
        expect(component.isLoading).toBe(false);
        done();
      });
    });








  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should reset state flags', () => {
      component.hasSearched = true;
      component.hasError = true;
      component.dataSource = mockSearchResults;

      component.onClearAll();

      expect(component.hasSearched).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.dataSource).toEqual([]);
    });

    it('should clear test IDs signal', () => {
      component.allTestIds.set(mockTestIds);

      component.onClearAll();

      expect(component.allTestIds()).toEqual([]);
    });




  });
  describe('Cascading Dropdowns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load test IDs when batch ID is selected', () => {
      component.tbIdControl.setValue(mockBatchIds[0]);

      expect(service.getTestIds).toHaveBeenCalledWith('092809-TB6124');
    });



    it('should populate allTestIds signal after batch ID selection', (done) => {
      component.tbIdControl.setValue(mockBatchIds[0]);

      setTimeout(() => {
        expect(component.allTestIds()).toEqual(mockTestIds);
        expect(component.isLoadingTestIds).toBe(false);
        done();
      });
    });



    it('should clear allTestIds when batch ID changes', () => {
      component.allTestIds.set(mockTestIds);
      service.getTestIds.and.returnValue(EMPTY);

      component.tbIdControl.setValue(mockBatchIds[1]);

      expect(component.allTestIds()).toEqual([]);
    });




  });
  describe('Filtered Dropdowns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should return all batch IDs when search is empty', () => {
      component.allBatchIds.set(mockBatchIds);
      component.batchSearchControl.setValue('');
      component.allBatchIds.update(v => [...v]);

      const filtered = component.filteredBatchIds();

      expect(filtered.length).toBe(4);
    });



    it('should return all test IDs when search is empty', () => {
      component.allTestIds.set(mockTestIds);
      component.testSearchControl.setValue('');
      component.allTestIds.update(v => [...v]);

      const filtered = component.filteredTestIds();

      expect(filtered.length).toBe(3);
    });


  });
});
