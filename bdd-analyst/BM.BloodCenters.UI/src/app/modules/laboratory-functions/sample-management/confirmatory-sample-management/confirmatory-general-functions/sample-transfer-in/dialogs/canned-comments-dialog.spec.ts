import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import {
  CannedCommentsDialogComponent,
  CannedCommentsDialogData,
} from './canned-comments-dialog';

describe('CannedCommentsDialogComponent', () => {
  let component: CannedCommentsDialogComponent;
  let fixture: ComponentFixture<CannedCommentsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CannedCommentsDialogComponent>>;

  const mockItems = [
    { code: 'C001', codeDesc: 'Sample received in good condition' },
    { code: 'C002', codeDesc: 'Sample requires further testing' },
    { code: 'C003', codeDesc: 'Sample rejected due to hemolysis' },
  ];

  const defaultDialogData: CannedCommentsDialogData = {
    items: mockItems,
    previouslySelected: ['C001'],
  };

  function createComponent(data: CannedCommentsDialogData = defaultDialogData) {
    TestBed.resetTestingModule();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [CannedCommentsDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(CannedCommentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should populate allItems from dialog data on init', () => {
    expect(component.allItems().length).toBe(3);
  });

  it('should initialize checkedCodes from previouslySelected', () => {
    expect(component.isChecked('C001')).toBeTrue();
    expect(component.isChecked('C002')).toBeFalse();
  });

  it('should toggle item selection on', () => {
    component.toggleItem('C002');
    expect(component.isChecked('C002')).toBeTrue();
  });

  it('should toggle item selection off', () => {
    component.toggleItem('C001');
    expect(component.isChecked('C001')).toBeFalse();
  });

  it('should filter items by search text', () => {
    component.searchCtrl.setValue('REJECT');
    // Trigger signal-based re-evaluation since computed() does not track FormControl changes
    component.allItems.set([...component.allItems()]);
    const filtered = component.filteredItems();
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('C003');
  });

  it('should show all items when search is empty', () => {
    component.searchCtrl.setValue('');
    expect(component.filteredItems().length).toBe(3);
  });

  it('should show all items when search is percent wildcard', () => {
    component.searchCtrl.setValue('%');
    expect(component.filteredItems().length).toBe(3);
  });

  it('should close dialog with selected descriptions on select', () => {
    component.toggleItem('C002');
    component.onSelect();

    expect(dialogRefSpy.close).toHaveBeenCalled();
    const result = dialogRefSpy.close.calls.mostRecent().args[0];
    expect(result.selectedDescriptions).toContain('Sample received in good condition');
    expect(result.selectedDescriptions).toContain('Sample requires further testing');
  });

  it('should close dialog with null on exit', () => {
    component.onExit();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });

  it('should handle empty previouslySelected', () => {
    createComponent({ items: mockItems, previouslySelected: [] });
    expect(component.checkedCodes().size).toBe(0);
  });
});
