package oracle.forms.fd;

import java.awt.BorderLayout;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;

public class TableDialog extends JPanel{
    
    private JTable table=null;
    
    public TableDialog() {
    }
    
    public TableDialog(String [] columnNames, String [][] data, int width, int height) {
       
        setLayout(new BorderLayout());
        table = new JTable(data, columnNames);

        //Create the scroll pane and add the table to it.
        JScrollPane scrollPane = new JScrollPane(table);

        //Add the scroll pane to this panel.
        add(scrollPane);     
        setBorder(null);
        setOpaque(false);
        setBackground(null);
    }
    
    JTable getTable(){
        return table ;
    }
    
}
