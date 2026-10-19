import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay } from '@angular/cdk/overlay';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { VenipunctureAttributesComponent } from './venipuncture-attributes';
import { VenipunctureAttributesService } from './services/venipuncture-attributes.service';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from '@shared/services/menu.service';
import { of } from 'rxjs';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('VenipunctureAttributesComponent', () => {
  let component: VenipunctureAttributesComponent;
  let fixture: ComponentFixture<VenipunctureAttributesComponent>;
  let service: jasmine.SpyObj<VenipunctureAttributesService>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let menuService: jasmine.SpyObj<MenuService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('VenipunctureAttributesService', [
      'getVenipunctureAttributes',
      'getVenipunctureAttributesFilters',
      'getVenipunctureAttributeByGroupAndCode'
    ]);
    serviceSpy.getVenipunctureAttributes.and.returnValue(of({ data: [], totalRecords: 0 }));
    serviceSpy.getVenipunctureAttributesFilters.and.returnValue(of({ data: [] }));

    const translateSpy = createMockTranslateService();
    const menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    const mockMenuItems = [
      {
        label: 'Venipuncture Attributes',
        path: '/application-admin/venipuncture-attributes',
        remarks: '',
        subtitle: ''
      }
    ];
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal(mockMenuItems));
    menuServiceSpy.findMenuItemByPath.and.returnValue(mockMenuItems[0]);

    await TestBed.configureTestingModule({
      imports: [
        VenipunctureAttributesComponent,
        HttpClientTestingModule],
      providers: [
        { provide: VenipunctureAttributesService, useValue: serviceSpy },
        { provide: TranslateService, useValue: translateSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            queryParams: of({}),
            params: of({})
          }
        },
        Overlay
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VenipunctureAttributesComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(VenipunctureAttributesService) as jasmine.SpyObj<VenipunctureAttributesService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    menuService = TestBed.inject(MenuService) as jasmine.SpyObj<MenuService>;
    fixture.detectChanges();
  });


  it('should have correct header title', () => {
    expect(component.headerConfig.title).toBe('Venipuncture Attributes');
  });

  it('should have correct search placeholder', () => {
    expect(component.searchConfig.placeholder).toBe('Search by Code or Description');
  });
});
