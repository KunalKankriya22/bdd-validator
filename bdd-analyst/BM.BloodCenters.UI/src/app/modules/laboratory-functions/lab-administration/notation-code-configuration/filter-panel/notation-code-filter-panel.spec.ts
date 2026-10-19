import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NotationCodeFilterPanel } from './notation-code-filter-panel';
import { NotationCodeFilterValue } from '../models/notation-code.model';

describe('NotationCodeFilterPanel', () => {
  let component: NotationCodeFilterPanel;
  let fixture: ComponentFixture<NotationCodeFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotationCodeFilterPanel, ReactiveFormsModule, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(NotationCodeFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should initialize with empty form when no current filters provided', () => {
      fixture.detectChanges();

      expect(component.filterForm.value).toEqual({
        notationCode: null,
        notationType: null
      });
    });

    it('should initialize with current filters when provided', () => {
      const currentFilters: NotationCodeFilterValue = {
        notationCode: 'TEST01',
        notationType: 'S'
      };

      component.currentFilters = currentFilters;
      fixture.detectChanges();

      expect(component.filterForm.value).toEqual({
        notationCode: 'TEST01',
        notationType: 'S'
      });
    });

    it('should have notation type options', () => {
      fixture.detectChanges();

      expect(component.notationTypeOptions.length).toBe(2);
      expect(component.notationTypeOptions[0]).toEqual({ key: 'S', value: 'S - Sample' });
      expect(component.notationTypeOptions[1]).toEqual({ key: 'R', value: 'R - Result' });
    });
  });



});
