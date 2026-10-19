import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UnitInterdictionFilterPanelComponent } from './unit-interdiction-filter-panel';

describe('UnitInterdictionFilterPanelComponent', () => {
  let component: UnitInterdictionFilterPanelComponent;
  let fixture: ComponentFixture<UnitInterdictionFilterPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UnitInterdictionFilterPanelComponent,
        HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(UnitInterdictionFilterPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize filter form', () => {
    expect(component.filterForm).toBeDefined();
  });
});
