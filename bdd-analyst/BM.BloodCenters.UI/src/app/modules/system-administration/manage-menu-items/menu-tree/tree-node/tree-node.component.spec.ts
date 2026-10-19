import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TreeNodeComponent } from './tree-node.component';
import { NavigationNode } from '../../models/menu-item.model';

describe('TreeNodeComponent', () => {
  let component: TreeNodeComponent;
  let fixture: ComponentFixture<TreeNodeComponent>;

  const mockNode: NavigationNode = {
    id: '1',
    label: 'Test Node',
    type: 'Menu',
    sequence: 1,
    access_lvl: 5,
    hidden: false,
    function_name: 'TEST_FUNCTION',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeNodeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TreeNodeComponent);
    component = fixture.componentInstance;
    component.node = { ...mockNode };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return true from isSelected when selectedNodeId matches node id', () => {
    // Arrange
    component.selectedNodeId = '1';

    // Act
    const result = component.isSelected();

    // Assert
    expect(result).toBeTrue();
  });

  it('should return false from isSelected when selectedNodeId does not match node id', () => {
    // Arrange
    component.selectedNodeId = '999';

    // Act
    const result = component.isSelected();

    // Assert
    expect(result).toBeFalse();
  });

  it('should return true from hasChildren when node has children array with items', () => {
    // Arrange
    component.node = {
      ...mockNode,
      children: [
        { id: '2', label: 'Child', type: 'Page', sequence: 1, access_lvl: 3, hidden: false, function_name: 'CHILD_FN' },
      ],
    };

    // Act
    const result = component.hasChildren();

    // Assert
    expect(result).toBeTrue();
  });

  it('should return false from hasChildren when node has no children', () => {
    // Arrange
    component.node = { ...mockNode, children: undefined };

    // Act
    const result = component.hasChildren();

    // Assert
    expect(result).toBeFalse();
  });

  it('should return true from isExpanded when _isExpanded is true', () => {
    // Arrange
    component.node = { ...mockNode, _isExpanded: true };

    // Act
    const result = component.isExpanded();

    // Assert
    expect(result).toBeTrue();
  });

  it('should return false from isExpanded when _isExpanded is not set', () => {
    // Arrange
    component.node = { ...mockNode };

    // Act
    const result = component.isExpanded();

    // Assert
    expect(result).toBeFalse();
  });

  it('should display only the sequence number when no parentSequence is provided', () => {
    // Arrange
    component.parentSequence = '';
    component.node = { ...mockNode, sequence: 3 };

    // Act
    const result = component.displaySequence;

    // Assert
    expect(result).toBe('3');
  });

  it('should display parentSequence.sequence when parentSequence is provided', () => {
    // Arrange
    component.parentSequence = '2';
    component.node = { ...mockNode, sequence: 5 };

    // Act
    const result = component.displaySequence;

    // Assert
    expect(result).toBe('2.5');
  });

  it('should return expand_more chevron icon when node is expanded', () => {
    // Arrange
    component.node = { ...mockNode, _isExpanded: true };

    // Act
    const result = component.chevronIcon;

    // Assert
    expect(result).toBe('expand_more');
  });

  it('should emit nodeSelected with the node when onNodeClick is called', () => {
    // Arrange
    spyOn(component.nodeSelected, 'emit');

    // Act
    component.onNodeClick();

    // Assert
    expect(component.nodeSelected.emit).toHaveBeenCalledWith(component.node);
  });

  it('should stop event propagation and emit toggleExpanded when chevron is clicked', () => {
    // Arrange
    const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
    spyOn(component.toggleExpanded, 'emit');

    // Act
    component.onChevronClick(mockEvent);

    // Assert
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.toggleExpanded.emit).toHaveBeenCalledWith(component.node);
  });

  it('should emit accessLevelChanged with node and new level on access level change', () => {
    // Arrange
    spyOn(component.accessLevelChanged, 'emit');

    // Act
    component.onAccessLevelChange(7);

    // Assert
    expect(component.accessLevelChanged.emit).toHaveBeenCalledWith({
      node: component.node,
      newLevel: 7,
    });
  });
});
