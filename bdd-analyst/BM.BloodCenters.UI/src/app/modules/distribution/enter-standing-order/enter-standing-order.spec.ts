import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { EnterStandingOrderComponent } from './enter-standing-order';

describe('EnterStandingOrderComponent', () => {
  let component: EnterStandingOrderComponent;
  let fixture: ComponentFixture<EnterStandingOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterStandingOrderComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(EnterStandingOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render router-outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
