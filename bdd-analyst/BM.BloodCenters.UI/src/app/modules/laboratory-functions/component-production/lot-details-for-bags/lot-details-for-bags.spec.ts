import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';

import { LotDetailsForBagsComponent } from './lot-details-for-bags';
import { LotDetailsForBagsService } from './services/lot-details-for-bags.service';
import { HeaderService } from '@shared/services/header.service';
import { ValidLotDto, ValidLotPaginatedResponse } from './models/lot-details-for-bags.model';

describe('LotDetailsForBagsComponent', () => {
  let component: LotDetailsForBagsComponent;
  let fixture: ComponentFixture<LotDetailsForBagsComponent>;
  let serviceSpy: jasmine.SpyObj<LotDetailsForBagsService>;

  const mockLots: ValidLotDto[] = [
    {
      lotNumber: 'LOT001', catalogNumber: 'CAT001', bagCode: '01', vendorName: 'Vendor A',
      dateReceived: '2025-03-15T00:00:00', numberOfUnits: 100, numberOfCartons: 10,
      spFlag: 'A,B', volumeTypeSet: 'VTS01', supplyCode: 'SUP01',
      effDate: '2025-01-01T00:00:00', termDate: '2025-12-31T00:00:00', lastModifiedDate: null,
    },
  ];

  const mockPaginatedResponse: ValidLotPaginatedResponse = {
    items: mockLots,
    totalRecords: 1,
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('LotDetailsForBagsService', [
      'getValidLots', 'createValidLot', 'updateValidLot',
      'getCatalogs', 'getCmcCodes', 'getVolumeTypeSets', 'getSupplyCodes',
    ]);

    serviceSpy.getValidLots.and.returnValue(of(mockPaginatedResponse));
    serviceSpy.getCatalogs.and.returnValue(of([{ catalogNumber: 'CAT001' }]));
    serviceSpy.getCmcCodes.and.returnValue(of([{ code: 'A', description: 'Type A' }]));
    serviceSpy.getVolumeTypeSets.and.returnValue(of([{ code: 'VTS01', description: 'Vol 1' }]));
    serviceSpy.getSupplyCodes.and.returnValue(of([{ code: 'SUP01', description: 'Supply 1' }]));

    const headerServiceMock = {
      chapterChanged$: new Subject<void>(),
      chapterTimeZone: () => 'UTC',
    };



      TestBed.configureTestingModule({
      imports: [LotDetailsForBagsComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        { provide: LotDetailsForBagsService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } },
        Overlay,
      ],
    });


    


      serviceSpy.getValidLots.calls.reset();


      serviceSpy.createValidLot.calls.reset();


      serviceSpy.updateValidLot.calls.reset();


      serviceSpy.getCatalogs.calls.reset();


      serviceSpy.getCmcCodes.calls.reset();


      serviceSpy.getVolumeTypeSets.calls.reset();


      serviceSpy.getSupplyCodes.calls.reset();


      serviceSpy.getValidLots.and.returnValue(of(mockPaginatedResponse));


      serviceSpy.getCatalogs.and.returnValue(of([{ catalogNumber: 'CAT001' }]));


      serviceSpy.getCmcCodes.and.returnValue(of([{ code: 'A', description: 'Type A' }]));


      serviceSpy.getVolumeTypeSets.and.returnValue(of([{ code: 'VTS01', description: 'Vol 1' }]));


      serviceSpy.getSupplyCodes.and.returnValue(of([{ code: 'SUP01', description: 'Supply 1' }]));


    fixture = TestBed.createComponent(LotDetailsForBagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should handle data loading error', () => {
    serviceSpy.getValidLots.and.returnValue(throwError(() => new Error('fail')));
    component.loadData();
    expect(component.dataSource).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });



  it('should ignore search with less than 2 chars', () => {
    component.searchKeyword = 'old';
    component.onSearch('a');
    expect(component.searchKeyword).toBe('old');
  });

  it('should allow empty search to clear', () => {
    component.searchKeyword = 'old';
    component.onSearch('');
    expect(component.searchKeyword).toBe('');
  });





  it('should split spFlag into chips', () => {
    expect(component.getSpFlagChips('A,B,C')).toEqual(['A', 'B', 'C']);
    expect(component.getSpFlagChips(null)).toEqual([]);
    expect(component.getSpFlagChips('')).toEqual([]);
  });



  it('should apply filters and reload', () => {
    component.applyFilters({ showExpired: true });
    expect(component.appliedFilters?.showExpired).toBeTrue();
    expect(component.filterChips.length).toBeGreaterThan(0);
  });



  it('should open add drawer', () => {
    component.openAddDrawer();
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  });

  it('should open edit drawer', () => {
    component.openEditDrawer(mockLots[0]);
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toBe(mockLots[0]);
  });

  it('should close side drawer', () => {
    component.sidePanelOpen = true;
    component.closeSideDrawer();
    expect(component.sidePanelOpen).toBeFalse();
    expect(component.sidePanelData).toBeNull();
  });



  it('should handle save for update', () => {
    serviceSpy.updateValidLot.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockLots[0] }));
    component.sidePanelMode = 'edit';
    component.sidePanelData = mockLots[0];
    component.sidePanelOpen = true;
    component.onSave({ lotNumber: 'LOT001', catalogNumber: 'CAT001', bagCode: '01', vendorName: 'Updated' });
    expect(serviceSpy.updateValidLot).toHaveBeenCalledWith('LOT001', 'CAT001', jasmine.any(Object));
  });







  it('should format dates for display', () => {
    expect(component['formatDateForDisplay']('2025-03-15T00:00:00')).toBe('15-MAR-2025');
    expect(component['formatDateForDisplay'](null)).toBeNull();
  });


});
