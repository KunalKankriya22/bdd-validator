package oracle.forms.fd;

import javax.swing.table.DefaultTableModel;


public class SortableTableModel extends DefaultTableModel {

  private String[] columnNames = {" "};
  private Object[][] datas = {{" "," "}};
        
  int[] indexes;
  TableSorter sorter;

  public SortableTableModel() {
  }
  
    public SortableTableModel(Object[][] dataVector,Object[] columnIdentifiers)
    {
        super();
        columnNames = (String[])columnIdentifiers ;
        datas = dataVector;
    }  


  public Object getValueAt(int row, int col) {
    int rowIndex = row;
    if (indexes != null) {
      try{
        rowIndex = indexes[row];
        return super.getValueAt(rowIndex, col);
      }
      catch (Exception ex) {;}
    }
    return super.getValueAt(row, col);
  }


  public void setValueAt(Object value, int row, int col) {
    int rowIndex = row;
    if (indexes != null) {
      rowIndex = indexes[row];
    }
    super.setValueAt(value, rowIndex, col);
  }


  public void sortByColumn(int column, boolean isAscent) {
    if (sorter == null) {
      sorter = new TableSorter(this);
    }
    sorter.sort(column, isAscent);
    fireTableDataChanged();
  }

  public int[] getIndexes() {
    int n = getRowCount();
    if (indexes != null) {
      if (indexes.length == n) {
        return indexes;
      }
    }
    indexes = new int[n];
    for (int i=0; i<n; i++) {
      indexes[i] = i;
    }
    return indexes;
  }
}
