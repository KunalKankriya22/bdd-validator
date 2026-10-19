import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { Overlay } from '@angular/cdk/overlay';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { DeletePooledComponentsComponent } from './delete-pooled-components';
import { DeletePooledComponentsService } from './services/delete-pooled-components.service';
import { HeaderService } from '@shared/services/header.service';
import {
  PoolDetails,
  PooledComponentUnit,
} from './models/delete-pooled-components.model';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field';

describe('DeletePooledComponentsComponent', () => {
  let component: DeletePooledComponentsComponent;
  let fixture: ComponentFixture<DeletePooledComponentsComponent>;
  let serviceSpy: jasmine.SpyObj<DeletePooledComponentsService>;

  const mockPoolDetails: PoolDetails = {
    poolId: 'P123456789012',
    productCode: 'RBC001',
    productDescription: 'Red Blood Cells',
    unitCount: 5
  };

  const mockPooledUnits: PooledComponentUnit[] = [
    {
      unitId: 'U123456789012',
      productCode: 'RBC001',
      productDescription: 'Red Blood Cells',
      collDate: '2026-05-10',
      expiryDate: '2026-06-10',
      componentStatus: 'L'
    },
    {
      unitId: 'U987654321098',
      productCode: 'RBC001',
      productDescription: 'Red Blood Cells',
      collDate: '2026-05-11',
      expiryDate: '2026-06-11',
      componentStatus: 'L'
    }
  ];

  const mockDeletePoolResponse = {
    success: true,
    message: 'Pool deleted successfully'
  };

  function createPostValidateEvent(unitId: string): UnitIdPostValidateEvent {
    return {
      data: {
        parsedUnitId: unitId,
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: unitId,
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };
  }

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DeletePooledComponentsService', [
      'getPoolDetails',
      'getPooledUnits',
      'deletePool'
    ]);

    serviceSpy.getPoolDetails.and.returnValue(of(mockPoolDetails));
    serviceSpy.getPooledUnits.and.returnValue(of(mockPooledUnits));
    serviceSpy.deletePool.and.returnValue(of(mockDeletePoolResponse));

    const headerServiceMock = {
      chapterChanged$: new Subject<void>(),
      chapterTimeZone: () => 'UTC',
    };



      TestBed.configureTestingModule({
      imports: [DeletePooledComponentsComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        { provide: DeletePooledComponentsService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } },
        Overlay,
      ],
    });


    


      serviceSpy.getPoolDetails.calls.reset();


      serviceSpy.getPooledUnits.calls.reset();


      serviceSpy.deletePool.calls.reset();


      serviceSpy.getPoolDetails.and.returnValue(of(mockPoolDetails));


      serviceSpy.getPooledUnits.and.returnValue(of(mockPooledUnits));


      serviceSpy.deletePool.and.returnValue(of(mockDeletePoolResponse));


    fixture = TestBed.createComponent(DeletePooledComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize form with empty unitId', () => {
    expect(component.searchForm).toBeDefined();
    expect(component.searchForm.get('unitId')?.value).toBe('');
  });

  it('should initialize poolDetails signal as null', () => {
    expect(component.poolDetails()).toBeNull();
  });

  it('should initialize hasPoolDetails computed signal as false', () => {
    expect(component.hasPoolDetails()).toBe(false);
  });

  it('should initialize dataSource as empty array', () => {
    expect(component.dataSource).toEqual([]);
  });

  it('should fetch pool details on postValidate', fakeAsync(() => {
    const event = createPostValidateEvent('P123456789012');
    component.onUnitIdPostValidate(event);
    tick();

    expect(serviceSpy.getPoolDetails).toHaveBeenCalledWith('P123456789012');
    expect(component.poolDetails()).toEqual(mockPoolDetails);
    expect(component.hasPoolDetails()).toBe(true);
    expect(event.confirm).toHaveBeenCalled();
  }));

  it('should load pooled units after successful pool details fetch', fakeAsync(() => {
    const event = createPostValidateEvent('P123456789012');
    component.onUnitIdPostValidate(event);
    tick();

    expect(serviceSpy.getPooledUnits).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(2);
  }));

  it('should reject event when pool not found', fakeAsync(() => {
    serviceSpy.getPoolDetails.and.returnValue(
      throwError(() => ({ error: { message: 'Pool not found' } }))
    );

    const event = createPostValidateEvent('P123456789012');
    component.onUnitIdPostValidate(event);
    tick();

    expect(component.poolDetails()).toBeNull();
    expect(component.dataSource).toEqual([]);
    expect(event.reject).toHaveBeenCalled();
  }));

  it('should update dataSource with fetched units', fakeAsync(() => {
    const event = createPostValidateEvent('P123456789012');
    component.onUnitIdPostValidate(event);
    tick();

    expect(component.dataSource).toEqual(mockPooledUnits);
    expect(component.dataSource.length).toBe(2);
  }));

  it('should handle empty result set', fakeAsync(() => {
    serviceSpy.getPooledUnits.and.returnValue(of([]));

    const event = createPostValidateEvent('P123456789012');
    component.onUnitIdPostValidate(event);
    tick();

    expect(component.dataSource).toEqual([]);
  }));

  it('should clear pool details on chapter change', fakeAsync(() => {
    component.poolDetails.set(mockPoolDetails);
    component.dataSource = mockPooledUnits;

    const headerService = TestBed.inject(HeaderService) as any;
    headerService.chapterChanged$.next();
    tick();

    expect(component.poolDetails()).toBeNull();
    expect(component.dataSource).toEqual([]);
  }));


});
