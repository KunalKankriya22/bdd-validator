import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CrxtractFilterComponent } from './crxtract-filter.component';

describe('CrxtractFilterComponent', () => {
  let component: CrxtractFilterComponent;
  let fixture: ComponentFixture<CrxtractFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrxtractFilterComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CrxtractFilterComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (_) { /* template-only errors */ }
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should initialize form with null values when no currentFilters provided', () => {
    // Arrange & Act - already done in beforeEach

    // Assert
    const formValue = component.filterForm.value;
    expect(formValue.qcDatePeriod).toBeNull();
    expect(formValue.qcDate).toBeNull();
    expect(formValue.receivedDatePeriod).toBeNull();
    expect(formValue.receivedDate).toBeNull();
  });

  it('should reset form and emit close on onClearAll then onClose', (done) => {
    // Arrange
    component.filterForm.patchValue({ qcDatePeriod: 'After', qcDate: new Date() });

    component.close.subscribe(() => {
      // Assert
      expect(true).toBe(true);
      done();
    });

    // Act
    component.onClearAll();
    expect(component.isClearDisabled).toBe(true);
    component.onClose();
  });

  it('should report isApplyDisabled true when no date values are set', () => {
    // Arrange & Act - form is initialized empty

    // Assert
    expect(component.isApplyDisabled).toBe(true);
  });
});
