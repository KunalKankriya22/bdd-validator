import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { of, throwError } from 'rxjs';

import { PooledComponentQueryComponent } from './pooled-component-query';
import { PooledComponentQueryApiService } from './services/pooled-component-query-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  PooledComponentDto,
  PooledComponentUnitDto,
  PooledComponentLookupDto,
  ReturnResult,
} from './models/pooled-component-query.model';

describe('PooledComponentQueryComponent', () => {
  let apiSpy: any;
  let component: PooledComponentQueryComponent;
  let fixture: ComponentFixture<PooledComponentQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<PooledComponentQueryApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerService: HeaderService;

  const mockPoolHeader: PooledComponentDto = {
    poolId: 'W454511559559',
    patientId: '65981',
    patientFirstName: 'HENRY',
    patientLastName: 'POWERS',
    facility: 'OKINAWA',
    productCode: 'E2987V00',
    productDescription: 'POOLED PLATELETS|NS/XX/20-24C',
    catalogNumber: '1PM1111111',
    lotNumber: 'PM1111111',
    filterLotNumber: undefined,
    poolDate: '2018-03-01T19:20:00',
    poolExpiryDate: '2018-06-26T15:20:00',
    totalComponentCount: 5,
  };

  const mockPoolUnits: PooledComponentUnitDto[] = [
    {
      unitId: 'W1234-18-031310-Z',
      checkDigit: 'Z',
      productCode: '12000',
      productDescription: 'Platelets',
      componentPrefix: '1',
      expiryDate: '2018-03-13T19:20:00',
      aboRhDescription: 'NFT NO',
    },
    {
      unitId: 'W1234-18-031310-Z',
      checkDigit: 'Z',
      productCode: 'E2997100',
      productDescription: 'POOLED PLATELETS|NS/XX/20-24C',
      componentPrefix: '00',
      expiryDate: '2018-03-13T19:20:00',
      aboRhDescription: 'Discard',
    },
  ];

  const mockLookupPools: PooledComponentLookupDto[] = [
    { poolId: 'W454511559559', poolDate: '03-01-18 19:20', patientLastName: 'POWERS', patientFirstName: 'HENRY' },
    { poolId: 'W123456789012', poolDate: '02-15-18 10:00', patientLastName: 'SMITH', patientFirstName: 'JOHN' },
    { poolId: 'W999888777666', poolDate: '01-20-18 08:30', patientLastName: 'DOE', patientFirstName: 'JANE' },
  ];

  const mockSearchResponse: ReturnResult<PooledComponentLookupDto> = {
    success: true,
    statusCode: 200,
    message: 'Search results',
    data: mockLookupPools,
    total: 3,
  };

  const mockHeaderResponse: ReturnResult<PooledComponentDto> = {
    success: true,
    statusCode: 200,
    message: 'Pool data retrieved successfully',
    data: [mockPoolHeader],
    total: 1,
  };

  const mockUnitsResponse: ReturnResult<PooledComponentUnitDto> = {
    success: true,
    statusCode: 200,
    message: 'Component units retrieved successfully',
    data: mockPoolUnits,
    total: 2,
  };

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('PooledComponentQueryApiService', [
      'getPoolHeader',
      'getPoolUnits',
      'searchPools',
    ]);
    const snackbarSpy = createMockSnackbarService();

    apiSpy.searchPools.and.returnValue(of(mockSearchResponse));



      TestBed.configureTestingModule({
      imports: [PooledComponentQueryComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: PooledComponentQueryApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        PageHeaderService,
        HeaderService,
      ],
    });


      apiSpy.searchPools.and.returnValue(of(mockSearchResponse));


    apiServiceSpy = TestBed.inject(PooledComponentQueryApiService) as jasmine.SpyObj<PooledComponentQueryApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    headerService = TestBed.inject(HeaderService);

    fixture = TestBed.createComponent(PooledComponentQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize with default state', () => {
    expect(component.isLoading()).toBe(false);
    expect(component.hasResults()).toBe(false);
    expect(component.poolHeader()).toBeNull();
    expect(component.poolUnits()).toEqual([]);
  });



  describe('loadPoolList', () => {
    it('should call searchPools on init', () => {
      expect(apiServiceSpy.searchPools).toHaveBeenCalledWith({}, 1000, 0);
    });

    it('should populate allPools and filteredPools on success', () => {
      expect(component.allPools().length).toBe(3);
      expect(component.filteredPools().length).toBe(3);
      expect(component.allPools()[0].poolId).toBe('W454511559559');
    });



    it('should handle failed search response', () => {
      apiServiceSpy.searchPools.and.returnValue(of({
        success: false,
        statusCode: 500,
        message: 'Error',
        data: null,
        total: 0,
      }));

      const previousPools = component.allPools();
      (component as any).loadPoolList();

      expect(component.allPools()).toEqual(previousPools);
    });
  });

  describe('autocomplete filtering', () => {
    it('should show all pools when input is empty', () => {
      component.poolIdControl.setValue('');

      expect(component.filteredPools().length).toBe(3);
    });










  });

  describe('onPoolSelected', () => {
    it('should set pool ID and trigger search', () => {
      apiServiceSpy.getPoolHeader.and.returnValue(of(mockHeaderResponse));
      apiServiceSpy.getPoolUnits.and.returnValue(of(mockUnitsResponse));

      component.onPoolSelected('W454511559559');

      expect(component.poolIdControl.value).toBe('W454511559559');
      expect(apiServiceSpy.getPoolHeader).toHaveBeenCalledWith('W454511559559');
      expect(apiServiceSpy.getPoolUnits).toHaveBeenCalledWith('W454511559559');
    });


  });

  describe('searchPool', () => {
    it('should not search when pool ID is empty', () => {
      component.poolIdControl.setValue('');
      component.searchPool();

      expect(apiServiceSpy.getPoolHeader).not.toHaveBeenCalled();
      expect(apiServiceSpy.getPoolUnits).not.toHaveBeenCalled();
    });



    it('should mark control as touched when empty', () => {
      component.poolIdControl.setValue('');
      component.searchPool();

      expect(component.poolIdControl.touched).toBe(true);
    });

    it('should call both API methods on valid pool ID', () => {
      apiServiceSpy.getPoolHeader.and.returnValue(of(mockHeaderResponse));
      apiServiceSpy.getPoolUnits.and.returnValue(of(mockUnitsResponse));

      component.poolIdControl.setValue('W454511559559');
      component.searchPool();

      expect(apiServiceSpy.getPoolHeader).toHaveBeenCalledWith('W454511559559');
      expect(apiServiceSpy.getPoolUnits).toHaveBeenCalledWith('W454511559559');
    });

    it('should populate pool header on success', () => {
      apiServiceSpy.getPoolHeader.and.returnValue(of(mockHeaderResponse));
      apiServiceSpy.getPoolUnits.and.returnValue(of(mockUnitsResponse));

      component.poolIdControl.setValue('W454511559559');
      component.searchPool();

      expect(component.poolHeader()).toEqual(mockPoolHeader);
      expect(component.hasResults()).toBe(true);
    });



    it('should update table config total records', () => {
      apiServiceSpy.getPoolHeader.and.returnValue(of(mockHeaderResponse));
      apiServiceSpy.getPoolUnits.and.returnValue(of(mockUnitsResponse));

      component.poolIdControl.setValue('W454511559559');
      component.searchPool();

      expect(component.unitsTableConfig.pagination!.totalRecords).toBe(2);
    });

    it('should update unit ID column header with count', () => {
      apiServiceSpy.getPoolHeader.and.returnValue(of(mockHeaderResponse));
      apiServiceSpy.getPoolUnits.and.returnValue(of(mockUnitsResponse));

      component.poolIdControl.setValue('W454511559559');
      component.searchPool();

      const unitIdCol = component.unitsTableConfig.columns.find(c => c.key === 'unitId');
      expect(unitIdCol!.header).toBe('Unit ID (5)');
    });








  });



  describe('onPoolIdKeydown', () => {
    it('should trigger search on Enter key', () => {
      apiServiceSpy.getPoolHeader.and.returnValue(of(mockHeaderResponse));
      apiServiceSpy.getPoolUnits.and.returnValue(of(mockUnitsResponse));
      component.poolIdControl.setValue('W454511559559');

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');
      component.onPoolIdKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(apiServiceSpy.getPoolHeader).toHaveBeenCalled();
    });

    it('should trigger search on Tab key', () => {
      apiServiceSpy.getPoolHeader.and.returnValue(of(mockHeaderResponse));
      apiServiceSpy.getPoolUnits.and.returnValue(of(mockUnitsResponse));
      component.poolIdControl.setValue('W454511559559');

      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');
      component.onPoolIdKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(apiServiceSpy.getPoolHeader).toHaveBeenCalled();
    });


  });

  describe('chapter change', () => {
    it('should clear results and reload pool list on chapter change', () => {
      apiServiceSpy.getPoolHeader.and.returnValue(of(mockHeaderResponse));
      apiServiceSpy.getPoolUnits.and.returnValue(of(mockUnitsResponse));
      component.poolIdControl.setValue('W454511559559');
      component.searchPool();

      expect(component.hasResults()).toBe(true);

      apiServiceSpy.searchPools.calls.reset();
      (headerService as any).chapterChangedSubject.next();

      expect(component.hasResults()).toBe(false);
      expect(component.poolIdControl.value).toBe('');
      expect(apiServiceSpy.searchPools).toHaveBeenCalledWith({}, 1000, 0);
    });
  });
  describe('unitId valueFormatter', () => {
    it('should concatenate unit ID with check digit', () => {
      const unitIdCol = component.unitsTableConfig.columns.find(c => c.key === 'unitId');
      const row: PooledComponentUnitDto = { ...mockPoolUnits[0], unitId: 'W1234-18-031310', checkDigit: 'Z' };

      expect(unitIdCol!.valueFormatter!('W1234-18-031310', row)).toBe('W1234-18-031310-Z');
    });

    it('should return unit ID without dash when check digit is empty', () => {
      const unitIdCol = component.unitsTableConfig.columns.find(c => c.key === 'unitId');
      const row: PooledComponentUnitDto = { ...mockPoolUnits[0], unitId: 'W1234-18-031310', checkDigit: '' };

      expect(unitIdCol!.valueFormatter!('W1234-18-031310', row)).toBe('W1234-18-031310');
    });
  });
});
