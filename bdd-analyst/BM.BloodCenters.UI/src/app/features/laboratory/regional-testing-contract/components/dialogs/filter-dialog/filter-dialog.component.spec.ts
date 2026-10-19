import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';

import { FilterDialogComponent } from './filter-dialog.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('FilterDialogComponent', () => {
  let component: FilterDialogComponent;
  let fixture: ComponentFixture<FilterDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<FilterDialogComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [FilterDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });




  it('should close dialog without data on cancel', () => {
    component.onCancel();

    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should have chapter options', () => {
    const chapters = (component as any).chapters();
    expect(chapters.length).toBeGreaterThan(0);
    expect(chapters[0]).toEqual({ chapterId: 'All', chapterName: 'All' });
  });

});
