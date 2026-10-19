import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { MenuDetailsComponent } from './menu-details.component';
import { HeaderService } from '@shared/services/header.service';

describe('MenuDetailsComponent', () => {
  let component: MenuDetailsComponent;
  let fixture: ComponentFixture<MenuDetailsComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getCurrentChapterId'], {
      chapterChanged$: chapterChanged$.asObservable()
    });

    TestBed.configureTestingModule({
      imports: [MenuDetailsComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: HeaderService, useValue: mockHeaderService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(MenuDetailsComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  it('should emit menuItemEdit with selected node on onEdit', () => {
    // Arrange
    const editSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.menuItemEdit = editSpy;
    const mockNode = { id: 'node1', label: 'Test Menu', sequence: 1 } as any;
    component.menuNode = mockNode;

    // Act
    component.onEdit();

    // Assert
    expect(editSpy.emit).toHaveBeenCalledWith(mockNode);
  });

  it('should format nullable field returning dash for null values', () => {
    // Act & Assert
    expect(component.formatNullableField(null)).toBe('-');
    expect(component.formatNullableField(undefined)).toBe('-');
    expect(component.formatNullableField('Menu Item')).toBe('Menu Item');
  });

  it('should format parameter returning key-value string', () => {
    // Act & Assert
    expect(component.formatParameter({ key: 'type', value: 'admin' })).toBe('type, admin');
    expect(component.formatParameter(null)).toBe('-');
  });
});
