import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FilterPanelComponent } from './filter-panel';
import { OrderStatusCodeDto } from '../../models/order-processing-status.model';

describe('FilterPanelComponent', () => {
  let component: FilterPanelComponent;
  let fixture: ComponentFixture<FilterPanelComponent>;

  const mockStatusCodes: OrderStatusCodeDto[] = [
    { code: 'AL', codeDesc: 'Allocated' },
    { code: 'OP', codeDesc: 'Open' },
    { code: 'PE', codeDesc: 'Pending' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterPanelComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterPanelComponent);
    component = fixture.componentInstance;
    component.statusCodes = mockStatusCodes;
    component.currentFilters = {};
    fixture.detectChanges();
  });







  it('should validate age as non-negative', () => {
    const ageControl = component.filterForm.get('age');

    ageControl?.setValue(-1);
    expect(ageControl?.errors?.['min']).toBeTruthy();

    ageControl?.setValue(0);
    expect(ageControl?.errors).toBeNull();

    ageControl?.setValue(24);
    expect(ageControl?.errors).toBeNull();
  });


  it('should block non-numeric input in age field', () => {
    const event = new KeyboardEvent('keypress', { which: 65 }); // 'A' key
    spyOn(event, 'preventDefault');

    const result = (component as any).onlyNumbers(event);

    expect(result).toBe(false);
    expect(event.preventDefault).toHaveBeenCalled();
  });

});
