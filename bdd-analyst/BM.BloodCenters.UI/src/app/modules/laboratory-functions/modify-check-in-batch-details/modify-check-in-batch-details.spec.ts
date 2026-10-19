import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { ModifyCheckInBatchDetailsComponent } from './modify-check-in-batch-details';
import { ModifyCheckInBatchApiService } from './services/modify-check-in-batch-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockTranslateService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ModifyCheckInBatchDetailsComponent', () => {
  let component: ModifyCheckInBatchDetailsComponent;
  let fixture: ComponentFixture<ModifyCheckInBatchDetailsComponent>;
  let mockApiService: jasmine.SpyObj<ModifyCheckInBatchApiService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {

    mockApiService = jasmine.createSpyObj('ModifyCheckInBatchApiService', [
      'getCheckInBatches',
      'getProductTypes',
      'getProductTypeFilters',
      'getCheckinUsers',
      'updateCheckInBatch',
      'getBatchComments',
      'createBatchComment',
      'updateBatchComment',
      'deleteBatchComment',
    ]);
    mockHeaderService = createMockHeaderService();
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [
      'getCurrentMenuItem',
      'getTitle',
      'getSubtitle'
    ], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null),
    });
    mockTranslateService = createMockTranslateService();

    mockApiService.getCheckInBatches.and.returnValue(
      of({ data: [], total: 0 })
    );
    mockApiService.getProductTypes.and.returnValue(of([]));
    mockApiService.getProductTypeFilters.and.returnValue(of([]));
    mockApiService.getCheckinUsers.and.returnValue(of([]));
    mockApiService.getBatchComments.and.returnValue(of([]));
    mockPageHeaderService.getCurrentMenuItem.and.returnValue(undefined);
    mockPageHeaderService.getTitle.and.returnValue('');
    mockPageHeaderService.getSubtitle.and.returnValue('');



      TestBed.configureTestingModule({
      imports: [ModifyCheckInBatchDetailsComponent, NoopAnimationsModule],
      providers: [
        { provide: ModifyCheckInBatchApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: TranslateService, useValue: mockTranslateService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        },
      ],
    });


    


      mockApiService.getCheckInBatches.calls.reset();


      mockApiService.getProductTypes.calls.reset();


      mockApiService.getProductTypeFilters.calls.reset();


      mockApiService.getCheckinUsers.calls.reset();


      mockApiService.updateCheckInBatch.calls.reset();


      mockApiService.getBatchComments.calls.reset();


      mockApiService.createBatchComment.calls.reset();


      mockApiService.updateBatchComment.calls.reset();


      mockApiService.deleteBatchComment.calls.reset();


      mockHeaderService.getCurrentChapterTimezone.calls.reset();


      mockPageHeaderService.getCurrentMenuItem.calls.reset();


      mockPageHeaderService.getTitle.calls.reset();


      mockPageHeaderService.getSubtitle.calls.reset();
      mockApiService.getProductTypes.and.returnValue(of([]));


      mockApiService.getProductTypeFilters.and.returnValue(of([]));


      mockApiService.getCheckinUsers.and.returnValue(of([]));


      mockApiService.getBatchComments.and.returnValue(of([]));


      mockPageHeaderService.getCurrentMenuItem.and.returnValue(undefined);


      mockPageHeaderService.getTitle.and.returnValue('');


      mockPageHeaderService.getSubtitle.and.returnValue('');



    
    fixture = TestBed.createComponent(ModifyCheckInBatchDetailsComponent);
    component = fixture.componentInstance;
  });




  it('should search when search keyword is entered', () => {
    const searchKeyword = '111619';
    spyOn(component, 'loadData');

    component.onSearch(searchKeyword);

    expect(component.searchKeyword).toBe(searchKeyword);
    expect(component.loadData).toHaveBeenCalled();
  });











  it('should open comments panel when comment action is clicked', () => {
    const mockBatch = {
      batchId: '111619-CB9006',
      contractId: 'INTERNAL',
      company: 'Brooke Army Hospital',
      minTemp: 25,
      maxTemp: 25,
      productType: 'FFP - Fresh Frozen Pathogen',
      cartonCount: 1,
      numberOfUnits: 1,
      shippedDate: '2025-12-10',
      receivedDate: '2025-12-10',
      qcDate: '2025-12-10',
      batchDate: '2025-01-11',
      checkinUserId: 'CELIHUN',
      userName: 'MARINE HUNTER',
    };

    component.onRowAction({ action: 'comment', row: mockBatch });

    expect(component.commentsPanelOpen).toBe(true);
    expect(component.selectedBatch).toEqual(mockBatch);
  });
});
