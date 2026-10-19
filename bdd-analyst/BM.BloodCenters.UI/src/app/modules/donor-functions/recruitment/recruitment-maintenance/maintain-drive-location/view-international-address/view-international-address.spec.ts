import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViewInternationalAddressComponent } from './view-international-address';

describe('ViewInternationalAddressComponent', () => {
  let component: ViewInternationalAddressComponent;
  let fixture: ComponentFixture<ViewInternationalAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewInternationalAddressComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewInternationalAddressComponent);
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
    component.locationId = 'LOC002';
    component.address = {
      address1: '456 Rue de la Paix',
      address2: '',
      address3: '',
      address4: '',
      country: 'Canada',
      postalCode: 'K1A 0A9',
      workPhoneNumber: '613-555-0100',
      extension: '',
      homePhoneNumber: '',
      mobilePhoneNumber: '',
      fax: '',
      email: 'intl@example.com'
    };
    fixture.detectChanges();

    expect(component.locationId).toBe('LOC002');
    expect(component.address?.country).toBe('Canada');
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
