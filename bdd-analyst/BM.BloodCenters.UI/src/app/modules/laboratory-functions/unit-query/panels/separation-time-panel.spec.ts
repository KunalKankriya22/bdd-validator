import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SeparationTimePanelComponent } from './separation-time-panel';
import { UnitQueryPanelRecord } from '../unit-query.model';

describe('SeparationTimePanelComponent', () => {
  let component: SeparationTimePanelComponent;
  let fixture: ComponentFixture<SeparationTimePanelComponent>;

  const mockRecord: UnitQueryPanelRecord = {
    unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1', unitSchemeType: null, noteId: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeparationTimePanelComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SeparationTimePanelComponent);
    component = fixture.componentInstance;
    component.record = mockRecord;
  });

  it('should return table data with defaults when unitData is null', () => {
    component.unitData = null;
    const data = component.tableData;
    expect(data.length).toBe(4);
    expect(data[0].label).toBe('Centrifuge');
    expect(data[0].firstSep).toBe('--');
  });

  it('should return table data with values when unitData is provided', () => {
    component.unitData = {
      firstSepCentrifugeId: 'C1', secondSepCentrifugeId: 'C2', thirdSepCentrifugeId: null,
      firstSepWeight: 1.5, secondSepWeight: null, thirdSepWeight: null,
    } as any;
    const data = component.tableData;
    expect(data[0].firstSep).toBe('C1');
    expect(data[0].secondSep).toBe('C2');
    expect(data[0].thirdSep).toBe('--');
    expect(data[2].firstSep).toBe('1.50');
    expect(data[2].secondSep).toBe('--');
  });

});
