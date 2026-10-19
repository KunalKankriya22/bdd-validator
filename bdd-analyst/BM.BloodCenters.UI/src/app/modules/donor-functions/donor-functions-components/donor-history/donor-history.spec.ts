import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, reflectComponentType } from '@angular/core';
import { PageHeaderService } from '@shared/services/page-header.service';

import { DonorHistory } from './donor-history';

describe('DonorHistory', () => {
  let component: DonorHistory;
  let fixture: ComponentFixture<DonorHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorHistory],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PageHeaderService, useValue: jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], { pageHeaderData: signal(undefined) }) },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DonorHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct selector', () => {
    const mirror = reflectComponentType(DonorHistory);
    expect(mirror?.selector).toBe('app-donor-history');
  });

  it('should render the component template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('donor-history works!');
  });
});
