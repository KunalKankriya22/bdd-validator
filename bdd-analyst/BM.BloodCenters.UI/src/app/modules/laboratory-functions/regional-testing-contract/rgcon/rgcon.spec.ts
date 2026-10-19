import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { EnterRegionalTestingContractComponent } from './rgcon';
import { HeaderService } from '../../../../shared/services/header.service';
import { MenuService } from '../../../../shared/services/menu.service';
import { RegionalTestingContractApiService } from './services/regional-testing-contract-api.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('EnterRegionalTestingContractComponent', () => {
  let component: EnterRegionalTestingContractComponent;
  let fixture: ComponentFixture<EnterRegionalTestingContractComponent>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let apiServiceSpy: jasmine.SpyObj<RegionalTestingContractApiService>;

  beforeEach(async () => {
    headerServiceSpy = createMockHeaderService();
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    menuServiceSpy.getMenuItemsSignal.and.returnValue(() => []);

    apiServiceSpy = jasmine.createSpyObj('RegionalTestingContractApiService', ['getAllContracts']);
    apiServiceSpy.getAllContracts.and.returnValue(of({ data: [], total: 0 }));

    await TestBed.configureTestingModule({
      imports: [EnterRegionalTestingContractComponent,
        NoopAnimationsModule
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: RegionalTestingContractApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnterRegionalTestingContractComponent);
    component = fixture.componentInstance;
  });

  it('should have Show Terminated control defaulting to No', () => {
    fixture.detectChanges();
    expect(component.showTerminatedCtrl.value).toBe('No');
  });

  it('should clear filters when onClear is called', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.showTerminatedCtrl.setValue('Yes');
    component.onSearch('test');

    component.onClear();
    tick();

    expect(component.showTerminatedCtrl.value).toBe('No');
    expect(component.searchTextValue).toBe('');
  }));
});
