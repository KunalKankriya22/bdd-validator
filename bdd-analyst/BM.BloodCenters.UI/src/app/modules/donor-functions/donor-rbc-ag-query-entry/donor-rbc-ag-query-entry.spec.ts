import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DonorRbcAgQueryEntryComponent } from './donor-rbc-ag-query-entry';
import { PageHeaderService } from '@shared/services/page-header.service';
import { of } from 'rxjs';
import { createMockMatSnackBar, createMockPageHeaderService } from '@shared/testing/common-mocks';

describe('DonorRbcAgQueryEntryComponent', () => {
  let component: DonorRbcAgQueryEntryComponent;
  let fixture: ComponentFixture<DonorRbcAgQueryEntryComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSnackBar = createMockMatSnackBar();
    const pageHeaderServiceSpy = createMockPageHeaderService();
    Object.defineProperty(pageHeaderServiceSpy, 'pageHeaderData', {
      get: () => of({ title: '', subtitle: '' })
    });

    await TestBed.configureTestingModule({
      imports: [
        DonorRbcAgQueryEntryComponent,
      ],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorRbcAgQueryEntryComponent);
    component = fixture.componentInstance;
  });

  it('should have donorIdForm', () => {
    expect(component['donorIdForm']).toBeTruthy();
  });

  it('should have donorId control', () => {
    const control = component['donorIdForm'].get('donorId');
    expect(control).toBeTruthy();
  });
});
