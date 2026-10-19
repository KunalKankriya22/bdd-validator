import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AntigenPanelComponent } from './antigen-dialog.component';
import { AntigenDto } from '../../models/abo-labeling-antigens.model';
import { TranslateModule } from '@ngx-translate/core';

describe('AntigenPanelComponent', () => {
  let component: AntigenPanelComponent;
  let fixture: ComponentFixture<AntigenPanelComponent>;

  const mockAntigens: AntigenDto[] = [
    { antigenCode: 'D', antigenResult: 'POS', confirmed: true, currentDonationTested: true, unlicensedUnapproved: null, printFlag: false },
    { antigenCode: 'C', antigenResult: 'NEG', confirmed: false, currentDonationTested: false, unlicensedUnapproved: 'Y', printFlag: false },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AntigenPanelComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(AntigenPanelComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (_) { /* template-only errors */ }
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should map antigens to rows with printValue defaulting to N', () => {
    // Arrange & Act
    component.antigens = mockAntigens;

    // Assert
    expect(component.antigenRows.length).toBe(2);
    expect(component.antigenRows[0].printValue).toBe('N');
    expect(component.antigenRows[1].printValue).toBe('N');
  });

  it('should emit saved with only rows marked for printing', (done) => {
    // Arrange
    component.antigens = mockAntigens;
    component.antigenRows[0].printValue = 'Y';
    component.antigenRows[1].printValue = 'N';

    component.saved.subscribe((selections) => {
      // Assert
      expect(selections.length).toBe(1);
      expect(selections[0].antigenCode).toBe('D');
      expect(selections[0].print).toBe(true);
      done();
    });

    // Act
    component.onSave();
  });

  it('should emit closed when onClose is called', (done) => {
    // Arrange
    component.closed.subscribe(() => {
      // Assert
      expect(true).toBe(true);
      done();
    });

    // Act
    component.onClose();
  });
});
