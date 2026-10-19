import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AttributesInterdictionsPanelComponent } from './attributes-interdictions-panel';
import { InterdictionQueryApiService } from '../../attributes-and-interdictions/interdiction-query/services/interdiction-query-api.service';
import { UnitQueryPanelRecord } from '../unit-query.model';

describe('AttributesInterdictionsPanelComponent', () => {
  let component: AttributesInterdictionsPanelComponent;
  let fixture: ComponentFixture<AttributesInterdictionsPanelComponent>;
  let mockService: jasmine.SpyObj<InterdictionQueryApiService>;

  const mockRecord: UnitQueryPanelRecord = {
    unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1', unitSchemeType: null, noteId: null,
  };

  const emptyResponse = {
    unitId: '', collectionDate: '', isArchived: false,
    unitInterdictions: [], componentInterdictions: [],
    unitAttributes: [], componentAttributes: [],
  } as any;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('InterdictionQueryApiService', ['queryInterdictions']);
    mockService.queryInterdictions.and.returnValue(of(emptyResponse));

    await TestBed.configureTestingModule({
      imports: [AttributesInterdictionsPanelComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: InterdictionQueryApiService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AttributesInterdictionsPanelComponent);
    component = fixture.componentInstance;
    component.record = mockRecord;
  });

  it('should show unit attrib/inter when no component selected', () => {
    const mockResponse = {
      ...emptyResponse,
      unitAttributes: [{ attribGroup: 'G1', attribCode: 'C1', attribDesc: 'Desc' }],
      unitInterdictions: [{ interCode: 'I1', interDesc: 'Inter Desc', interType: 'Hold' }],
    } as any;
    mockService.queryInterdictions.and.returnValue(of(mockResponse));
    fixture.detectChanges();
    expect(component.isComponentContext).toBeFalse();
    expect(component.unitAttributes.length).toBe(1);
    expect(component.unitInterdictions.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should show component attrib/inter when component selected', () => {
    component.selectedProductCode = 'RBC';
    const mockResponse = {
      ...emptyResponse,
      componentAttributes: [{ productCode: 'RBC', attribGroup: 'G1', attribCode: 'C1', attribDesc: 'Desc' }],
      componentInterdictions: [{ productCode: 'RBC', interCode: 'I1', interDesc: 'Desc', interType: 'NFT' }],
    } as any;
    mockService.queryInterdictions.and.returnValue(of(mockResponse));
    fixture.detectChanges();
    expect(component.isComponentContext).toBeTrue();
    expect(component.componentAttributes.length).toBe(1);
    expect(component.componentInterdictions.length).toBe(1);
  });

  it('should pass productCode to API when component selected', () => {
    component.selectedProductCode = 'RBC';
    mockService.queryInterdictions.and.returnValue(of(emptyResponse));
    fixture.detectChanges();
    expect(mockService.queryInterdictions).toHaveBeenCalledWith(
      jasmine.objectContaining({ unitId: 'U001', productCode: 'RBC' }),
    );
  });


});
