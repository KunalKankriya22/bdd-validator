import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { RegisterSpecialDonationRequestComponent } from './register-special-donation-request';

describe('RegisterSpecialDonationRequestComponent', () => {
  let component: RegisterSpecialDonationRequestComponent;
  let fixture: ComponentFixture<RegisterSpecialDonationRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterSpecialDonationRequestComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterSpecialDonationRequestComponent);
    component = fixture.componentInstance;
  });



  it('should format patient name correctly', () => {
    const name = component.getPatientName({
      patId: 'PAT001',
      patLastName: 'Smith',
      patFirstName: 'John',
    });
    expect(name).toBe('Smith, John');
  });

  it('should update search text and reset page on search', () => {
    component.onSearch('test');
    expect(component.searchText).toBe('test');
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
  });
});
