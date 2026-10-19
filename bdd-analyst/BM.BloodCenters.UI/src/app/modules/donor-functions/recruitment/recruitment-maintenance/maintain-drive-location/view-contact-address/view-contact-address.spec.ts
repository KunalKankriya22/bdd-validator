import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViewContactAddressComponent } from './view-contact-address';

describe('ViewContactAddressComponent', () => {
  let component: ViewContactAddressComponent;
  let fixture: ComponentFixture<ViewContactAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewContactAddressComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewContactAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default input values', () => {
    expect(component.locationId).toBe('');
    expect(component.address).toBeNull();
  });

  it('should accept locationId and address inputs', () => {
    component.locationId = 'LOC001';
    component.address = {
      locationName: 'Test Location',
      street: '123 Main St',
      suitApt: '',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      mapsco: '',
      county: 'Dallas',
      phone: '214-555-0100',
      fax: '',
      email: 'test@example.com',
      web: '',
      notes: ''
    };
    fixture.detectChanges();

    expect(component.locationId).toBe('LOC001');
    expect(component.address?.city).toBe('Dallas');
  });

  it('should emit closePanel on onClose()', () => {
    const emitSpy = spyOn(component.closePanel, 'emit');
    component.onClose();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroy$ = (component as any).destroy$;
    const nextSpy = spyOn(destroy$, 'next').and.callThrough();
    const completeSpy = spyOn(destroy$, 'complete').and.callThrough();
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
