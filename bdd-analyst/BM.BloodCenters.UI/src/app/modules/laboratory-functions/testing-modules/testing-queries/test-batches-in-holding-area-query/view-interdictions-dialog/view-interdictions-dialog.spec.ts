import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';

import { ViewInterdictionsPanel } from './view-interdictions-dialog';
import { ViewInterdictionModel } from '../test-batches-in-holding-area-query.model';

describe('ViewInterdictionsPanel', () => {
  let component: ViewInterdictionsPanel;
  let fixture: ComponentFixture<ViewInterdictionsPanel>;

  const mockInterdictions: ViewInterdictionModel[] = [
    { unitId: 'W454509926003', collDate: '2026-06-15T10:00:00Z', interCode: 'HOLD' },
    { unitId: 'W454509926004', collDate: '2026-06-16T14:30:00Z', interCode: 'REVIEW' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewInterdictionsPanel, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewInterdictionsPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should initialize with empty interdictions array', () => {
      expect(component.interdictions).toEqual([]);
    });

  });

  describe('Display', () => {
    it('should display interdictions when provided', () => {
      component.interdictions = mockInterdictions;
      fixture.detectChanges();

      expect(component.interdictions.length).toBe(2);
    });

    it('should show empty message when no interdictions', () => {
      component.interdictions = [];
      fixture.detectChanges();

      const element = fixture.nativeElement;
      const emptyMessage = element.querySelector('.empty-message');
      expect(emptyMessage).toBeTruthy();
      expect(emptyMessage.textContent).toContain(
        'No interdictions found for this test batch'
      );
    });
  });
});
