import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { AuthHeaderComponent } from './auth-header.component';
import { ROUTES } from '../../../core/constants/route.constants';
import { provideRouter } from '@angular/router';

describe('AuthHeaderComponent', () => {
  let component: AuthHeaderComponent;
  let fixture: ComponentFixture<AuthHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthHeaderComponent
        TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have ROUTES constant defined', () => {
    expect(component.ROUTES).toBeDefined();
    expect(component.ROUTES).toEqual(ROUTES);
  });


});
