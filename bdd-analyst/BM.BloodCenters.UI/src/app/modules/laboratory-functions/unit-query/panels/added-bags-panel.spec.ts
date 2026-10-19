import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AddedBagsPanelComponent } from './added-bags-panel';
import { UnitQueryService } from '../unit-query.service';
import { UnitQueryPanelRecord } from '../unit-query.model';

describe('AddedBagsPanelComponent', () => {
  let component: AddedBagsPanelComponent;
  let fixture: ComponentFixture<AddedBagsPanelComponent>;
  let mockService: jasmine.SpyObj<UnitQueryService>;

  const mockRecord: UnitQueryPanelRecord = {
    unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1', unitSchemeType: null, noteId: null,
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('UnitQueryService', ['getAddOnBags']);
    mockService.getAddOnBags.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AddedBagsPanelComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: UnitQueryService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddedBagsPanelComponent);
    component = fixture.componentInstance;
    component.record = mockRecord;
  });

  it('should load bags on init', () => {
    const mockBags = [{ sdcWsNumber: '123', productCode: 'P1' }];
    mockService.getAddOnBags.and.returnValue(of(mockBags));
    fixture.detectChanges();
    expect(component.bags.length).toBe(1);
    expect(component.loading).toBeFalse();
  });


});
