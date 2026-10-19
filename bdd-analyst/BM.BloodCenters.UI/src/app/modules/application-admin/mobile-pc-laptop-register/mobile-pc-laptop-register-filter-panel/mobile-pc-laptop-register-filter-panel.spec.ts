import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MobilePcLaptopRegisterFilterPanel } from './mobile-pc-laptop-register-filter-panel';
import { MobilePcLaptopRegisterService } from '../services/mobile-pc-laptop-register.service';
import { of } from 'rxjs';

describe('MobilePcLaptopRegisterFilterPanel', () => {
  let component: MobilePcLaptopRegisterFilterPanel;
  let fixture: ComponentFixture<MobilePcLaptopRegisterFilterPanel>;
  let mockService: jasmine.SpyObj<MobilePcLaptopRegisterService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('MobilePcLaptopRegisterService', ['getChapters']);
    mockService.getChapters.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        MobilePcLaptopRegisterFilterPanel,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: MobilePcLaptopRegisterService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MobilePcLaptopRegisterFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should populate existing filters', () => {
    component.currentFilters = {
      chapter: 'CH001'
    };

    component.ngOnInit();

    expect(component.filterForm.get('chapter')?.value).toBe('CH001');
  });




  it('should detect changes correctly', () => {
    expect(component.hasChanges()).toBeFalse();

    component.filterForm.patchValue({ chapter: 'CH001' });

    expect(component.hasChanges()).toBeTrue();
  });
});
