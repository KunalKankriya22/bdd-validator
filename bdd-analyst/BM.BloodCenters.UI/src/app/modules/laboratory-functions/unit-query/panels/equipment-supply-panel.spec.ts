import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { EquipmentSupplyPanelComponent } from './equipment-supply-panel';
import { UnitQueryService } from '../unit-query.service';
import { UnitQueryPanelRecord } from '../unit-query.model';

describe('EquipmentSupplyPanelComponent', () => {
  let component: EquipmentSupplyPanelComponent;
  let fixture: ComponentFixture<EquipmentSupplyPanelComponent>;
  let mockService: jasmine.SpyObj<UnitQueryService>;

  const mockRecord: UnitQueryPanelRecord = {
    unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1', unitSchemeType: null, noteId: null,
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('UnitQueryService', ['getEquipmentSupply']);
    mockService.getEquipmentSupply.and.returnValue(of({ componentCgmpRecords: [], equipmentRecords: [], supplyRecords: [], driveId: null }));

    await TestBed.configureTestingModule({
      imports: [EquipmentSupplyPanelComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: UnitQueryService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentSupplyPanelComponent);
    component = fixture.componentInstance;
    component.record = mockRecord;
  });

  it('should load equipment and supply on init', () => {
    const mockData = {
      componentCgmpRecords: [],
      equipmentRecords: [{ equipReference: 'E1' }],
      supplyRecords: [{ equipReference: 'S1' }],
      driveId: null,
    };
    mockService.getEquipmentSupply.and.returnValue(of(mockData));
    fixture.detectChanges();
    expect(component.equipment.length).toBe(1);
    expect(component.supply.length).toBe(1);
    expect(component.loading).toBeFalse();
  });


});
