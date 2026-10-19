import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';

import { CustomerOverrideQueryDialogComponent } from './customer-override-query-dialog.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CustomerOverrideQueryDialogComponent', () => {
  let component: CustomerOverrideQueryDialogComponent;
  let fixture: ComponentFixture<CustomerOverrideQueryDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CustomerOverrideQueryDialogComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [CustomerOverrideQueryDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerOverrideQueryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have reactive tests data', () => {
    const reactiveTests = (component as any).reactiveTests();
    expect(reactiveTests.length).toBeGreaterThan(0);
  });

  it('should have confirmatory tests data', () => {
    const confirmatoryTests = (component as any).confirmatoryTests();
    expect(confirmatoryTests.length).toBeGreaterThan(0);
  });




});
