import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { SelectInterdictionsDialogComponent } from './select-interdictions-dialog.component';
import { MaintainGroupInterdictionsService } from '../../services/maintain-group-interdictions.service';

describe('SelectInterdictionsDialogComponent', () => {
  let component: SelectInterdictionsDialogComponent;
  let fixture: ComponentFixture<SelectInterdictionsDialogComponent>;
  let serviceSpy: jasmine.SpyObj<MaintainGroupInterdictionsService>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('MaintainGroupInterdictionsService', [
      'getInterTypes', 'getValidInterdictions'
    ]);
    serviceSpy.getInterTypes.and.returnValue(of([
      { code: 'INTER', description: 'Test Result and Registration' }
    ]));
    serviceSpy.getValidInterdictions.and.returnValue(of([
      { interCode: 'PHYTD', interDesc: 'Physical Findings Temporary Deferral', effDate: '', termDate: '', viewLevel: 1, selected: false },
      { interCode: 'DDI', interDesc: 'Deferred Indefinitely on Donation Record', effDate: '', termDate: '', viewLevel: 1, selected: false }
    ]));

    await TestBed.configureTestingModule({
      imports: [SelectInterdictionsDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MaintainGroupInterdictionsService, useValue: serviceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectInterdictionsDialogComponent);
    component = fixture.componentInstance;
    component.existingCodes = ['HBCNT'];
    fixture.detectChanges();
  });

  it('should load interdiction types on init', () => {
    expect(serviceSpy.getInterTypes).toHaveBeenCalled();
    expect(component.interdictionTypes().length).toBe(1);
  });


  it('should load available interdictions when type changes', fakeAsync(() => {
    component.onTypeChange('INTER');
    tick();
    expect(serviceSpy.getValidInterdictions).toHaveBeenCalledWith('INTER');
    expect(component.allInterdictions().length).toBe(2);
  }));









  it('should update type description when type changes', fakeAsync(() => {
    component.onTypeChange('INTER');
    tick();
    expect(component.selectedTypeDescription()).toBe('Test Result and Registration');
    flush();
  }));

});
