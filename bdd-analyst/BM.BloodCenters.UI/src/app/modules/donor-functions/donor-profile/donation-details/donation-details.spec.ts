import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DonationDetailsComponent } from './donation-details';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('DonationDetailsComponent', () => {
  let component: DonationDetailsComponent;
  let fixture: ComponentFixture<DonationDetailsComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    dialogSpy = createMockMatDialog();
    await TestBed.configureTestingModule({
      imports: [DonationDetailsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: MatDialog, useValue: dialogSpy },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({}) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DonationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have search form with donorId control', () => {
    expect(component.searchForm.contains('donorId')).toBeTrue();
  });

  it('should require donorId', () => {
    const donorIdControl = component.searchForm.get('donorId');
    donorIdControl?.setValue('');
    expect(donorIdControl?.valid).toBeFalse();
    donorIdControl?.setValue('D001');
    expect(donorIdControl?.valid).toBeTrue();
  });




});
