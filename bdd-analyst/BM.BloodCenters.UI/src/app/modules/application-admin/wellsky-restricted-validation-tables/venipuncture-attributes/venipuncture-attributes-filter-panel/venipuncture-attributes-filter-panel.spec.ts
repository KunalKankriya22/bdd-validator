import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { VenipunctureAttributesFilterPanel } from './venipuncture-attributes-filter-panel';
import { VenipunctureAttributesService } from '../services/venipuncture-attributes.service';
import { of } from 'rxjs';

describe('VenipunctureAttributesFilterPanel', () => {
  let component: VenipunctureAttributesFilterPanel;
  let fixture: ComponentFixture<VenipunctureAttributesFilterPanel>;
  let service: jasmine.SpyObj<VenipunctureAttributesService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('VenipunctureAttributesService', [
      'getVenipunctureAttributesFilters'
    ]);
    serviceSpy.getVenipunctureAttributesFilters.and.returnValue(of({ data: [{ code: [] }] }));

    await TestBed.configureTestingModule({
      imports: [VenipunctureAttributesFilterPanel],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        { provide: VenipunctureAttributesService, useValue: serviceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VenipunctureAttributesFilterPanel);
    component = fixture.componentInstance;
    service = TestBed.inject(VenipunctureAttributesService) as jasmine.SpyObj<VenipunctureAttributesService>;
    fixture.detectChanges();
  });

  it('should load filter options on init', () => {
    expect(service.getVenipunctureAttributesFilters).toHaveBeenCalled();
  });
});
