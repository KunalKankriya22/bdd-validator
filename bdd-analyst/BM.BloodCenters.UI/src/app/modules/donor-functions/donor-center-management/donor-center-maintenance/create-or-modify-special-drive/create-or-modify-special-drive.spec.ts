import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CollStaffDocErrorsSpecialDriveComponent } from './create-or-modify-special-drive';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { signal, reflectComponentType } from '@angular/core';
import { PageHeaderService } from '@shared/services/page-header.service';

describe('CollStaffDocErrorsSpecialDriveComponent', () => {
  let component: CollStaffDocErrorsSpecialDriveComponent;
  let fixture: ComponentFixture<CollStaffDocErrorsSpecialDriveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CollStaffDocErrorsSpecialDriveComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PageHeaderService, useValue: jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], { pageHeaderData: signal(undefined) }) },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CollStaffDocErrorsSpecialDriveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the create-or-modify-special-drive component', () => {
    const inner = fixture.nativeElement.querySelector('app-create-or-modify-special-drive');
    expect(inner).toBeTruthy();
  });

  it('should have correct selector', () => {
    const mirror = reflectComponentType(CollStaffDocErrorsSpecialDriveComponent);
    expect(mirror?.selector).toBe('app-coll-staff-doc-errors-special-drive');
  });

  it('should render without errors on subsequent change detection', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should be an instance of the correct class', () => {
    expect(component).toBeInstanceOf(CollStaffDocErrorsSpecialDriveComponent);
  });
});
