import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { LotFilterPanel } from './lot-filter-panel';

describe('LotFilterPanel', () => {
  let component: LotFilterPanel;
  let fixture: ComponentFixture<LotFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotFilterPanel, TranslateModule.forRoot()],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(LotFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });




  it('should disable apply when no filter selected', () => {
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should enable apply when filter selected', () => {
    component.filterForm.patchValue({ showExpired: true });
    expect(component.isApplyDisabled).toBeFalse();
  });

  it('should validate period required when date set without period', () => {
    component.filterForm.patchValue({ effDate: new Date() });
    component.validateEffectivePeriod();
    expect(component.effectivePeriodRequired).toBeTrue();
  });



});
