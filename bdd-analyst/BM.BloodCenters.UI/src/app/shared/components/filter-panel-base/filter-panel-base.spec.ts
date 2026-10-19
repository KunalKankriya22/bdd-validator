import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterPanelBase } from './filter-panel-base';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

describe('FilterPanelBase', () => {
  let component: FilterPanelBase;
  let fixture: ComponentFixture<FilterPanelBase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FilterPanelBase,
        MatIconModule,
        MatButtonModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterPanelBase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should have default maxContentHeight', () => {
    expect(component.maxContentHeight).toBe(280);
  });

  it('should have default width', () => {
    expect(component.width).toBe(350);
  });




  it('should return panel width as CSS value', () => {
    component.width = 400;
    expect(component.panelWidth).toBe('400px');
  });

  it('should return content max-height as CSS value', () => {
    component.maxContentHeight = 300;
    expect(component.contentMaxHeight).toBe('300px');
  });

  it('should show clear button by default', () => {
    expect(component.showClearButton).toBe(true);
  });

});
