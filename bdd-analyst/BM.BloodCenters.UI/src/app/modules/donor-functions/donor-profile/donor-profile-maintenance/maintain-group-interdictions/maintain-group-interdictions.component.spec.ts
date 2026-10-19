import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MaintainGroupInterdictionsComponent } from './maintain-group-interdictions.component';
import { PageHeaderService } from '@shared/services/page-header.service';
import { signal } from '@angular/core';

describe('MaintainGroupInterdictionsComponent', () => {
  let component: MaintainGroupInterdictionsComponent;
  let fixture: ComponentFixture<MaintainGroupInterdictionsComponent>;

  const mockPageHeaderService = {
    pageHeaderData: signal({ title: 'Maintain Group Interdictions', subtitle: '' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MaintainGroupInterdictionsComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MaintainGroupInterdictionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should switch to Donations tab', () => {
    component.onTabChange(1);
    expect(component.selectedTabIndex()).toBe(1);
    expect(component.currentTab()).toBe('Donations');
  });

  it('should switch back to Donors tab', () => {
    component.onTabChange(1);
    component.onTabChange(0);
    expect(component.selectedTabIndex()).toBe(0);
    expect(component.currentTab()).toBe('Donors');
  });



});
