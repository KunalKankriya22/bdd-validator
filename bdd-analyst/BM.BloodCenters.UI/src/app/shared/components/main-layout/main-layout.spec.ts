import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MainLayout } from './main-layout';
import { provideRouter } from '@angular/router';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([])
      ],
    })
    .overrideComponent(MainLayout, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });



  it('should render router outlet', () => {
    const outlet = fixture.nativeElement.querySelector('router-outlet');
    expect(outlet).toBeTruthy();
  });



  it('should render left sidenav', () => {
    const sidenav = fixture.nativeElement.querySelector('app-left-sidenav');
    expect(sidenav).toBeTruthy();
  });

  it('should have content-area for router outlet', () => {
    const contentArea = fixture.nativeElement.querySelector('.content-area');
    expect(contentArea).toBeTruthy();
  });
});