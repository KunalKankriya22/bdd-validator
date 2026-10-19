import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { AuthLayoutComponent } from './auth-layout.component';
import { provideRouter } from '@angular/router';

describe('AuthLayoutComponent', () => {
  let component: AuthLayoutComponent;
  let fixture: ComponentFixture<AuthLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent
        TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should render auth-footer component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('auth-footer');
    expect(footer).toBeTruthy();
  });

  it('should have router-outlet for child routes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const outlet = compiled.querySelector('router-outlet');
    expect(outlet).toBeTruthy();
  });

  it('should have proper layout structure', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const layoutContainer = compiled.querySelector('.auth-layout');
    expect(layoutContainer).toBeTruthy();
  });

  it('should render background elements', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const background = compiled.querySelector('.auth-layout__background');
    expect(background).toBeTruthy();
  });

  it('should have content area for router outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const contentArea = compiled.querySelector('.auth-layout__content');
    expect(contentArea).toBeTruthy();
  });
});
