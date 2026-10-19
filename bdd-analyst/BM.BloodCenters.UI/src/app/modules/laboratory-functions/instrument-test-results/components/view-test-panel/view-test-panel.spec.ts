import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTestPanelComponent } from './view-test-panel';
import { ValidInstrumentTestScheduleDto } from '../../models/instrument-test-results.model';

describe('ViewTestPanelComponent', () => {
  let component: ViewTestPanelComponent;
  let fixture: ComponentFixture<ViewTestPanelComponent>;

  const mockTestData: ValidInstrumentTestScheduleDto = {
    machineId: 'AX200',
    chapterId: 'CH01',
    machineTestId: 'HIVAB',
    testId1: 'HIV',
    testId1Res: 'POS',
    effDate: '2025-01-01',
    termDate: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ViewTestPanelComponent],
    });

    fixture = TestBed.createComponent(ViewTestPanelComponent);
    component = fixture.componentInstance;
    component.testData = { ...mockTestData };
    component.machineName = 'Analyzer X200';
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('fmtDate with null returns em-dash', () => {
    expect((component as any).fmtDate(null)).toBe('—');
  });

  it('fmtDate with undefined returns em-dash', () => {
    expect((component as any).fmtDate(undefined)).toBe('—');
  });

  it('fmtDate with empty string returns em-dash', () => {
    expect((component as any).fmtDate('')).toBe('—');
  });

  it('fmtDate with valid date string', () => {
    expect((component as any).fmtDate('2025-01-15')).toBe('15-Jan-2025');
  });

  it('fmtDate with ISO date string', () => {
    expect((component as any).fmtDate('2025-06-01T00:00:00Z')).toContain('Jun');
  });

  it('onClose emits closePanel', () => {
    spyOn(component.closePanel, 'emit');
    component.onClose();
    expect(component.closePanel.emit).toHaveBeenCalled();
  });

  it('should display machineId in template', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('AX200');
  });

  it('should display machineName in template', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Analyzer X200');
  });

  it('should render close button', () => {
    const closeBtn = fixture.nativeElement.querySelector('.close-btn');
    expect(closeBtn).toBeTruthy();
  });
});
