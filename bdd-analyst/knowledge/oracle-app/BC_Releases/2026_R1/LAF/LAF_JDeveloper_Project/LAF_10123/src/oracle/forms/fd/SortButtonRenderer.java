package oracle.forms.fd;

import java.awt.Component;
import java.awt.Insets;

import java.util.Hashtable;

import javax.swing.JButton;
import javax.swing.JTable;
import javax.swing.table.TableCellRenderer;


public class SortButtonRenderer extends LAFButton implements TableCellRenderer {
  public static final int NONE = 0;
  public static final int DOWN = 1;
  public static final int UP   = 2;

  int pushedColumn;
  Hashtable state;
  LAFButton downButton,upButton;

  public SortButtonRenderer() {
    init();
  }

  public Component getTableCellRendererComponent(JTable table, Object value,
                   boolean isSelected, boolean hasFocus, int row, int column) {
    JButton button = this;
    Object obj = state.get(new Integer(column));
    if (obj != null) {
      //System.out.println("state button:"+((Integer)obj).intValue());    
      if (((Integer)obj).intValue() == DOWN) {
        button = downButton;
      } else {
        button = upButton;
      }
    }
    button.setText((value ==null) ? "" : value.toString());
    boolean isPressed = (column == pushedColumn);
    button.getModel().setPressed(isPressed);
    button.getModel().setArmed(isPressed);
    button.setForeground(DrawLAF.Current_Color.darker());
    return button;
  }

  public void setPressedColumn(int col) {
    pushedColumn = col;
  }

  public void setSelectedColumn(int col) {
    if (col < 0) return;
    Integer value = null;
    Object obj = state.get(new Integer(col));
    if (obj == null) {
      value = new Integer(DOWN);
    } else {
      if (((Integer)obj).intValue() == DOWN) {
        value = new Integer(UP);
      } else {
        value = new Integer(DOWN);
      }
    }
    //System.out.println("setSelectedColumn() value:"+value);        
    state.clear();
    state.put(new Integer(col), value);
  }

  public int getState(int col) {
    int retValue;
    Object obj = state.get(new Integer(col));
    if (obj == null) {
      retValue = NONE;
    } else {
      if (((Integer)obj).intValue() == DOWN) {
        retValue = DOWN;
      } else {
        retValue = UP;
      }
    }
    return retValue;
  }
  
  public void init(){
    pushedColumn   = -1;
    state = new Hashtable();

    setMargin(new Insets(0,0,0,0));
    setHorizontalTextPosition(LEFT);
    setIcon(new BlankIcon());

    downButton = new LAFButton();
    downButton.setForeground(DrawLAF.Current_Color.darker());
    downButton.setMargin(new Insets(0,0,0,0));
    downButton.setHorizontalTextPosition(LEFT);
    downButton.setImage(new BevelArrowIcon(BevelArrowIcon.DOWN, false, false));
    downButton.setIcon(new BevelArrowIcon(BevelArrowIcon.DOWN, false, false));
    downButton.setPressedIcon(new BevelArrowIcon(BevelArrowIcon.DOWN, false, true));

    upButton = new LAFButton();
    upButton.setForeground(DrawLAF.Current_Color.darker());
    upButton.setMargin(new Insets(0,0,0,0));
    upButton.setHorizontalTextPosition(LEFT);
    upButton.setImage(new BevelArrowIcon(BevelArrowIcon.UP, false, false));
    upButton.setIcon(new BevelArrowIcon(BevelArrowIcon.UP, false, false));
    upButton.setPressedIcon(new BevelArrowIcon(BevelArrowIcon.UP, false, true));      
  }


}
