package oracle.forms.fd;

import java.awt.AWTException;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.Point;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.Robot;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.ComponentAdapter;
import java.awt.event.ComponentEvent;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.font.FontRenderContext;
import java.awt.geom.AffineTransform;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;

import java.io.File;
import java.io.IOException;

import java.text.DateFormat;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.NumberFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;

import java.util.ArrayList;
import java.util.Date;
import java.util.EventObject;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.StringTokenizer;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

import javax.swing.AbstractAction;
import javax.swing.BorderFactory;
import javax.swing.DefaultCellEditor;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.KeyStroke;
import javax.swing.ListSelectionModel;
import javax.swing.RowFilter;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.border.Border;
import javax.swing.border.EtchedBorder;
import javax.swing.border.LineBorder;
import javax.swing.event.CellEditorListener;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ListSelectionEvent;
import javax.swing.event.ListSelectionListener;
import javax.swing.event.TableColumnModelEvent;
import javax.swing.event.TableColumnModelListener;
import javax.swing.event.UndoableEditEvent;
import javax.swing.event.UndoableEditListener;
import javax.swing.table.AbstractTableModel;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.TableCellEditor;
import javax.swing.table.TableCellRenderer;
import javax.swing.table.TableColumn;
import javax.swing.table.TableModel;
import javax.swing.table.TableRowSorter;
import javax.swing.text.BadLocationException;
import javax.swing.text.DefaultHighlighter;
import javax.swing.text.Document;
import javax.swing.text.Highlighter;
import javax.swing.undo.CannotRedoException;
import javax.swing.undo.CannotUndoException;
import javax.swing.undo.UndoManager;

import oracle.forms.properties.ID;

// MLT-7702
//import sun.misc.BASE64Decoder;
//import sun.misc.BASE64Encoder;
import java.util.Base64;

/*
 uncomment the following 2 imports to
 use the Oracle Look and Feel
*/ 
//import javax.swing.UIManager;
//import oracle.bali.ewt.olaf.OracleLookAndFeel;

  /**
   * A javabean that displays a JTable
   * inside or outside the Forms frame
   *
   * @author Francois Degrelle
   */

public class DynTable extends JPanel implements FocusListener{
    @SuppressWarnings("compatibility")
    private static final long serialVersionUID = -2033772986355741539L;
    private String  sVersion = "1.2" ;
    private static String   sCurrentJRE = System.getProperty("java.version") ;
    private String sTableName;
    private transient TableRowSorter sorter = null;
    private StringBuffer sbImage =new StringBuffer();
    private boolean bSeperateFrame = false ;      // popup in a seperate frame
    private boolean bUpdate = true ;              // can update the table
    private boolean bInsert = true ;              // can insert the table
    private boolean bDelete = true ;              // can delete the table
    private boolean bReorder = true ;             // can reorder the columns
    private boolean bResize = true ;              // can resize the columns
    private boolean bLog = false ;                // output to java console
    private boolean bExtend = false ;             // can extend the panel
    private boolean bEditExtend = false ;         // can extend CLOB editor
    private boolean bRefresh = true ;             // can refresh pages
    private boolean bTitle = true ;               // display title with table
    private boolean isExtended = false ;
    private boolean bTotalLine = false ;
    private boolean bROWID = true ;
    private boolean bComboBox = false;
    private boolean bIdentifiedLine = false ;
    private boolean bImgMagnifier = true ;
    private boolean bSendEvent = true ;
    private boolean bZoom = true ;
    private int     iJRE=0; 
    private int     x=0,y=0,w=0,h=0;
    private int     xF=10, yF=10, wF=500, hF=400 ; // separate frame bounding box
    private int     xP=10, yP=10, wP=500, hP=400 ; // parent canvas bounding box
    private int     xS=0, yS=0, wS=0, hS=0 ;       // current table size    
    private int     iNbRows = 0, iNbCols = 0 ;     // table dimensions
    private int     iCurLine = 0 ;                 // current line selected
    private int     iCurPage = 1 ;                 // current page
    private int     iRowPos = 0, iCellPos = 0 ;    // current row, cell selected
    private int     iCurRow = 0, iCurCell = 0 ;    // current row, cell
    private int     iRowHeight = -1 ;              // current row height
    private int     iTotalLines = 0 ;
    private int     iTotalHeight = 20 ;
    private int     iPageSize = -1 ;
    private int     iNbFetchedRows = 0 ;
    private int     iSens  = 1 ;    
    private int     iCurImageRow  = -1 ;
    private int     iCurImageCell = -1 ;
    private int     iImageWidth  = 100 ;
    private int     iImageHeight = -1 ;
    private int     iHeaderHeight = -1 ;
    private int     iTotalHeaderHeight = -1 ;
    private int     iResizeMode = JTable.AUTO_RESIZE_OFF ;
    private int     iVisibleRows = 0 ;
    private int     iColsMaxWidth = -1 ;
    private int     iNbInsert = 0 ;
    private int     iNbUpdate = 0;
    private int     iNbDelete = 0 ;
    private int     numBytesRead = 0;
    private int     iStartT = 0 ;
    private int     iChunk  = 8192 ;
    private int     iTitleAlign = JLabel.LEFT;
    private int     iSearchStart = 0;
    private Rectangle rTable;
    private Rectangle rTable2;
    private Rectangle rPanel;
    private String  separator = "^" ;              // current separator
    private String  sTitle = "" ;                  // separate frame title
    private String  sDateFormat = "dd/MM/yyyy" ;   // default date format
    private String  sIntFormat  = "#" ;            //  default integer format    
    private String  sNumFormat  = "#.##" ;         //  default number format
    private String  sFilter     = null ;           // filter
    private String  sAlertMsg = "Delete this image ?";
    private String  sAlertYes = "&Yes";
    private String  sAlertNo  = "&No";
    private String  sExtClose = "Save";    // save editor button label
    private String  sExtCancel = "Cancel"; // cancel editor button label
    private String  sExtWrap  = "Wrap"; // wrap editor button label
    private String  sFindTitle = "Find"; // find box title
    private String  sFindMsg = "Text to find"; // find box message
    private String  sTextSearch = ""; // text to find in CLOB
    private StringBuffer sb   = new StringBuffer(); 
    private Locale  locale = Locale.getDefault();
    private DecimalFormatSymbols DecimalSymbols = new DecimalFormatSymbols(locale); 
    private Color   HeadBGColor, HeadFGColor, DataBGColor, DataFGColor, GridColor;
    private Color   SelBGColor = new Color(206,232,255), SelFGColor=new Color(0,64,128) ;
    private Color   cTotalBG = new Color(240,240,240);
    private Color   cTotalFG = Color.black;
    private Color   cTableBG = Color.white ;
    private int     iImgStart = 0, iImgEnd = 0;
    private JComboBox comboBox;
    private JLabel  jbl;
    private HashMap hCellProps = new HashMap() ;
    private HashMap hCellInstProps = new HashMap() ;
    private HashMap hFormulas = new HashMap() ;
    private static HashMap hTables = new HashMap() ;    
    private transient ListSelectionModel listSelectionModel;    
    private Container contentpane ;
    private JScrollPane scrollPane, scrollPane2 ;
    private transient Border borderPanel = BorderFactory.createEmptyBorder();
    private JTable  table ;
    private JTable  tableT ;
    private MyTableModel  model ;    
    private JFrame  frame ;
    private int[] iRowsChanged ;
    private int[] iColWidth ;
    private HashMap hRowsChanged = new HashMap();
    private HashMap hRowsDeleted = new HashMap();
    private Font[] fColFont ;
    private transient Border borderT = BorderFactory.createEmptyBorder();
    private String[] colnames ;
    private String[] colnamesT ; 
    private String[] libOP = {"Count","Sum","Avg","Max","Min"} ;
    private transient Object[][] data;
    private transient Object[][] dataT;    
    private String[] coltypes ;
    private String[] colTab ;
    private transient Image[][] images;
    private byte[]    bImage ;
    List    list_msg = new ArrayList(10) ; 
    private String  sCellValue = "" ;
    private JTextArea jtCLOB;
    private transient KeyListener kl;
    private transient MouseListener ml;
    private JPanel jp = null;
    private transient ImageKit ik = new ImageKit();
    private transient BufferedImage bi = null; 
    private Color  hilit_color   = DrawLAF.cFocus;
    private transient Highlighter hilit;
    private transient Highlighter.HighlightPainter painter;
    private static String FIND_ACTION = "find";
    private static String CANCEL_ACTION = "cancel";
    private static String NEXT_ACTION = "next";
    private Rectangle rComponent,rSource, rTarget;
    DrawLAF dBean;  

    void init(String sName, DrawLAF laf) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            SwingUtilities.updateComponentTreeUI(this);
        } catch (Exception ex) {
            ex.printStackTrace();
        } 
        //
        //  uncomment the following lines to
        //  use the Oracle Look and Feel
        //  (must add the share.jar and jewt4.jar files to the archive tags)
        /*
        try{
           // use the Oracle Look and Feel
           UIManager.setLookAndFeel(new OracleLookAndFeel());
        }
        catch(Exception e) {}        
        */
          jp = this;
          contentpane = this ;
          sTableName = sName;
          hTables.put(sName.toUpperCase(), this);
          dBean = laf;
          if(null != dBean){
              xP=dBean.getParent().getX(); 
              yP=dBean.getParent().getY(); 
              wP=dBean.getParent().getWidth();
              hP=dBean.getParent().getHeight();
          }
          this.setBackground(Color.white);
          this.setBorder(borderPanel);
          SelBGColor = DrawLAF.Current_Color.darker();
          SelFGColor = DrawLAF.Current_Color_Light;
          addFocusListener(this);
          setKeyListener() ;
          setMouseListener() ;
          // JRE version
          String sJRE = sCurrentJRE.substring(0,1) + sCurrentJRE.substring(2,3) ;
          try{
            iJRE = Integer.parseInt(sJRE);
            System.out.println("***");  
            System.out.println("***   LAF DynTable version: "+sVersion);  
            System.out.println("***");
            if(iJRE < 16) {
              System.out.println("   !!! This Java Bean Needs the JRE 1.6 at least !!!");
            }
          } catch(Exception e){} 
    } 
    
  // send a message back to Forms
  void SendMessage( ID id, String s1 )
  {
      if(bSendEvent) {
          list_msg.clear();
          Messages msg = new Messages(DrawLAF.TBTABLE_NAME, sTableName);
          list_msg.add(msg);           
          msg = new Messages(DrawLAF.TBTABLE_EVENT_MSG, s1);
          list_msg.add(msg);      
          try{
            dBean.dispatchanevent(id, list_msg);          
          } catch (Exception ex) {};     
      }
  }    
      

  /**
   *  Method to print the table's content
   */
  private void printDebugData(JTable table) {
        int numRows = table.getRowCount();
        int numCols = table.getColumnCount();
        javax.swing.table.TableModel model = table.getModel();

        log("Value of data: ");
        for (int i=0; i < numRows; i++) {
            log("    row " + i + ":");
            for (int j=0; j < numCols; j++) {
                log("  " + model.getValueAt(table.convertRowIndexToModel(i), table.convertColumnIndexToModel(j)));
            }
            log("");
        }
        log("--------------------------");
    }

  /*-----------------------------------*
   *  All the properties you can set
   *-----------------------------------*/
    //
    // set the header
    //
    boolean setHeader(String value)
    {
      hCellProps = new HashMap() ;
      hCellInstProps = new HashMap() ;
      String label = value.toString();
      StringTokenizer st ;
      int i = 0 ; String title ;
      st = new StringTokenizer(label, separator);
      while (st.hasMoreTokens()) {
         title = st.nextToken() ;
         i++ ;
      }
      i = 0 ;
      st = new StringTokenizer(label, separator);
      while (st.hasMoreTokens()) {
         colnames[i] = (st.nextToken()) ;
         colnamesT[i] = "" ;          
         CellProp cp = new CellProp(colnames[i]);
         hCellProps.put(colnames[i],cp);
         i++;
      }
      return true;
    }
    //
    // remove table
    //
    void setRemove(String sName) {
        hTables.remove(sName.toUpperCase());
    }
    //
    // set the alert translations
    //
    boolean setAlertStrings(String s) 
    {
      StringTokenizer st = new StringTokenizer(s, ",");
      if (st.hasMoreTokens()) {
          sAlertMsg = st.nextToken();
      }
      if (st.hasMoreTokens()) {
          sAlertYes = st.nextToken();
      }
      if (st.hasMoreTokens()) {
          sAlertNo = st.nextToken();
      }      
      return true ;
    } 
    //
    // set the CLOB Editor close button translation
    //
    boolean setEditorButtonLabels(String s) 
    {
        if(null != s){
          StringTokenizer st = new StringTokenizer(s, ",");
          if (st.hasMoreTokens()) {
              sExtClose = st.nextToken();
          }
          if (st.hasMoreTokens()) {
              sExtCancel = st.nextToken();
          }
          if (st.hasMoreTokens()) {
              sExtWrap = st.nextToken();
          }             
        }
      return true ;
    }
    //
    // set the CLOB Editor Find box translations
    //
    boolean setEditorFindLabels(String s) 
    {
        if(null != s){
          StringTokenizer st = new StringTokenizer(s, ",");
          if (st.hasMoreTokens()) {
              sFindTitle = st.nextToken();
          }
          if (st.hasMoreTokens()) {
              sFindMsg = st.nextToken();
          }
        }
      return true ;
    }      
    //
    // add CLOB/NCLOB text
    //
    boolean addText(String s) 
    {
        if(s.equalsIgnoreCase("[^START-TEXT^]"))
        {
            sb = new StringBuffer();
        }
        else if(s.startsWith("[^END-TEXT^]")) {
            StringTokenizer st ;
            int iRow = 0, iCell = 0 ;
            st = new StringTokenizer(s,",");
            st.nextToken() ;
            if(st.hasMoreTokens())
            {
              try{iRow = Integer.parseInt(st.nextToken());}
              catch(Exception e){err("addText() Unable to get the Row index"); return false ;}
            } else return false ;
            if(st.hasMoreTokens())
            {
              try{iCell = Integer.parseInt(st.nextToken());}
              catch(Exception e){err("addText() Unable to get the Cell index"); return false ;}
            } else return false ;
            if((iRow-1) < 0 || (iRow > iNbRows)) return false ;
            if((iCell-1) < 0 || (iCell > iNbCols)) return false ;
            data[iRow - 1][iCell - 1] = sb.toString();
        }
        else {
            sb.append(s);
        }
        return true;
    }    
    //
    // refresh the list
    //
    boolean setTableRefresh(String page) {
        int iPage = 0;
        log("setTableRefresh() page:(" + page + ")");
        try {
            iPage = Integer.parseInt(page);
            if (iPage > 0) {
                iCurPage = iPage;
                model.setDataVector(data, colnames);
                table.revalidate();
                if (iSens < 0) {
                    iRowPos = table.getRowCount() - 1;
                }
                else {
                    iRowPos = 0 ;
                }
                iCurRow = iRowPos;
                table.changeSelection(iRowPos,iCellPos,false,false);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return true;
    }
    //
    // put the focus
    //
    boolean setFocus(String page) 
    {
      int iLine = 0 ;
      log("setFocus() line:("+iLine+")");
      try {
          iLine = Integer.parseInt(page);
          if(iLine > 0) {
            iCurRow = iLine-1 ;           
            table.changeSelection(iCurRow, 0, false, false);
            table.requestFocus();
          }
      }
      catch(Exception e) {e.printStackTrace();}
      return true ;
    }        
    void setROWID(String value) {
        if(value.equalsIgnoreCase("true")) {
            bROWID = true ;
        }
        else {
            bROWID = false ;
            bInsert = false ;
            bUpdate = false ;
            bDelete = false ;
        }
    }
    //
    // set the image
    //
    boolean setImage(String value)
    {
      
      String sImage = value.toString();
      if(sImage.startsWith("[INDEX_IMAGE]"))
      {
        StringTokenizer st ;
        int iRow = 0, iCell = 0 ;
        st = new StringTokenizer(sImage,",");
        st.nextToken() ;
        if(st.hasMoreTokens())
        {
          try{iRow = Integer.parseInt(st.nextToken());}
          catch(Exception e){err("Set_Image() Unable to get the Row index"); return false ;}
        } else return false ;
        if(st.hasMoreTokens())
        {
          try{iCell = Integer.parseInt(st.nextToken());}
          catch(Exception e){err("Set_Image() Unable to get the Cell index"); return false ;}
        } else return false ;
        if((iRow-1) < 0 || (iRow > iNbRows)) return false ;
        if((iCell-1) < 0 || (iCell > iNbCols)) return false ;
        iCurImageRow  = iRow - 1 ;
        iCurImageCell = iCell - 1 ;
      }
      else if(!sImage.equalsIgnoreCase("[END_IMAGE]"))
      {
        sbImage.append(sImage) ;
      }
      else
      {
        // BASE64Decoder decoder = new BASE64Decoder(); // MLT-7702
        try{
          // byte[] decodedStr = decoder.decodeBuffer(sbImage.toString()); 
          byte[] decodedStr =  Base64.getDecoder().decode(sbImage.toString()); // MLT-7702
          ImageIcon ii = new ImageIcon(decodedStr);
          Image img = ii.getImage() ;     
          images[iCurImageRow][iCurImageCell] = img;
          //images[table.convertRowIndexToModel(iCurImageRow)][table.convertColumnIndexToModel(iCurImageCell)] = img;
          // scale the image
          CellProp cp = (CellProp)hCellProps.get(colnames[iCurImageCell]);  
          if(table.getColumnModel().getColumnCount() > 0 ) {  
            TableColumn tabcol = table.getColumnModel().getColumn(iCurImageCell) ;
            ii = getScaledIcon(img, cp, tabcol);  
          }
          else {
              ii = new ImageIcon(img);
          }
          if(ii != null && iCurImageRow > -1 && iCurImageCell > -1)
          {
            data[iCurImageRow][iCurImageCell] = ii ;
          }  
        } catch(Exception e){e.printStackTrace();}
        finally{ 
           sbImage =new StringBuffer(); 
           iCurImageRow = iCurImageCell = -1 ;
        }
      }
      return true ;
    }
    
    //
    // image size
    //
    boolean setImageSize(String value)
    {
      String label = value.toString();
      StringTokenizer st ;
      int iW = 0, iH = 0 ;
      st = new StringTokenizer(label,",");
      if(st.hasMoreTokens()) 
      {
        try{
          iW = Integer.parseInt(st.nextToken());
        } catch(Exception e){err("SetImageSize Unable to set the image width"); return false;}  
      } else return false ;
      if(st.hasMoreTokens()) 
      {
        try{
          iH = Integer.parseInt(st.nextToken());
        } catch(Exception e){err("SetImageSize Unable to set the image height"); return false;}  
      } else return false ;
      iImageWidth  = iW ;
      iImageHeight = iH ;
      return true ;
    }
    //
    // column auto resize mode
    //
    boolean setResizeMode(String value)
    {
      String label = value.toString();
      if(label.equalsIgnoreCase("ALL_COLUMNS")) iResizeMode = JTable.AUTO_RESIZE_ALL_COLUMNS;
      else if(label.equalsIgnoreCase("LAST_COLUMN")) iResizeMode = JTable.AUTO_RESIZE_LAST_COLUMN;
      else if(label.equalsIgnoreCase("NEXT_COLUMNS")) iResizeMode = JTable.AUTO_RESIZE_NEXT_COLUMN;
      else if(label.equalsIgnoreCase("OFF")) iResizeMode = JTable.AUTO_RESIZE_OFF;
      else if(label.equalsIgnoreCase("SUBSEQUENT_COLUMNS")) iResizeMode = JTable.AUTO_RESIZE_SUBSEQUENT_COLUMNS;
      return true ;
    }    
    //
    // # visible rows
    //
    boolean setVisibleRows(String value)
    {
      String s = value.toString();
      try{
          iVisibleRows = Integer.parseInt(s);
          if(table != null && table.getTableHeader() != null){
            if(iVisibleRows > 0) {
                int i=0;
                if(bTitle) i++;
                if(bTotalLine) i++;
                int iH=0;
                iH = ((iVisibleRows-i)*table.getRowHeight()) + table.getTableHeader().getBounds().height ;
                if(bTitle) iH += (jbl.getHeight()-(jbl.getHeight()-table.getRowHeight()));
                if(bTotalLine) iH +=(20-(jbl.getHeight()-table.getRowHeight()));
                scrollPane.setSize(this.getWidth(),iH < this.getHeight() ? iH : this.getHeight());
                table.setSize(scrollPane.getSize());
                if(bTotalLine) {
                   scrollPane2.setLocation(scrollPane.getInsets().left,scrollPane.getHeight()+ jbl.getHeight()-1);
                }
                iTotalLines = iVisibleRows;
                rTable = scrollPane.getBounds();
            }
          }
      }
      catch(Exception e) {}
      return true ;
    }   
    //
    // set the table border
    //
    boolean setBorder(String value)
    { 
      String label = value.toString();
      String sBorder;
      StringTokenizer st ;
      int i = 1 ; Color c = Color.black ;
      st = new StringTokenizer(label, ",");        
        if (st.hasMoreElements()) {
            sBorder = st.nextToken(); // panel border
            if (sBorder.equalsIgnoreCase("line")){
                if (st.hasMoreElements()) {
                    try{
                        i = Integer.parseInt(st.nextToken());
                    }
                    catch(Exception ex){}
                }
                if (st.hasMoreElements()) {
                    c = getColor(st.nextToken());
                }                 
                borderT = BorderFactory.createLineBorder(c, i);
            }
            else if (sBorder.equalsIgnoreCase("raisedetched"))
                borderT = BorderFactory.createEtchedBorder(EtchedBorder.RAISED);
            else if (sBorder.equalsIgnoreCase("loweredetched"))
                borderT = BorderFactory.createEtchedBorder(EtchedBorder.LOWERED);
            else if (sBorder.equalsIgnoreCase("raisedbevel"))
                borderT = BorderFactory.createRaisedBevelBorder();
            else if (sBorder.equalsIgnoreCase("loweredbevel"))
                borderT = BorderFactory.createLoweredBevelBorder();
            else if (sBorder.equalsIgnoreCase("empty")) {
                borderT = BorderFactory.createEmptyBorder();
            }
        } 

      return true;
    }             
    //
    // set the panel border
    //
    boolean setPanelBorder(String value)
    { 
      String label = value.toString();
      String sBorder;
      StringTokenizer st ;
      int i = 1 ; Color c = Color.black ;
      st = new StringTokenizer(label, ",");        
        if (st.hasMoreElements()) {
            sBorder = st.nextToken(); // panel border
            if (sBorder.equalsIgnoreCase("line")){
                if (st.hasMoreElements()) {
                    try{
                        i = Integer.parseInt(st.nextToken());
                    }
                    catch(Exception ex){}
                }
                if (st.hasMoreElements()) {
                    c = getColor(st.nextToken());
                }                 
                borderPanel = BorderFactory.createLineBorder(c, i);
            }
            else if (sBorder.equalsIgnoreCase("raisedetched"))
                borderPanel = BorderFactory.createEtchedBorder(EtchedBorder.RAISED);
            else if (sBorder.equalsIgnoreCase("loweredetched"))
                borderPanel = BorderFactory.createEtchedBorder(EtchedBorder.LOWERED);
            else if (sBorder.equalsIgnoreCase("raisedbevel"))
                borderPanel = BorderFactory.createRaisedBevelBorder();
            else if (sBorder.equalsIgnoreCase("loweredbevel"))
                borderPanel = BorderFactory.createLoweredBevelBorder();
            else if (sBorder.equalsIgnoreCase("empty"))
                borderPanel = BorderFactory.createEmptyBorder();
            this.setBorder(borderPanel);
        } 
      return true;
    }             
    
    //
    // set the columns type
    //
    boolean setColsType(String value)
    {
      String label = value.toString();
      StringTokenizer st ;
      int i = 0 ;
      st = new StringTokenizer(label, separator);
      while (st.hasMoreTokens()) {
         coltypes[i] = (st.nextToken()) ;
         i++;
      }

      return true;
    }    
 
    //
    // set the current cell value
    //
    boolean setCurCellValue(String value)
    {
      int iRow = iCurRow + 1 ;
      int iCell = iCurCell + 2 ;
      String sValue = "^" + iRow + "^" + iCell + "^" + value.toString();
      boolean b = setCellValue(sValue);
      table.repaint();
      return b ;
    }
     
    //
    // set the Cell value
    //
    boolean setCellValue(String value)
    {
        // params Row and Cell given
        // are starting at 1,1
        // JTable starts at 0,0 so we have
        // to supress 1 from arguments
        String s = value.toString();
        String s1="", s2="", s3="", s4="" ;
        int iRow=0, iCell=0 ;
        Double   fValue = new Double(0d) ;
        Integer  iValue = new Integer(0);
        DateFormat sdf = null ;
        Date   dValue ;        
        boolean bFocus = false ;
        String sep = "" + s.charAt(0);
        StringTokenizer st = new StringTokenizer(s,sep);
        s = s.substring(1,s.length());
        st = new StringTokenizer(s,sep);
        // row index
        if(st.hasMoreTokens()) s1 = st.nextToken() ;
        else return false ;
        // cell index
        if(st.hasMoreTokens()) s2 = st.nextToken() ;
        else return false ;
        // value
        if(st.hasMoreTokens()) s3 = st.nextToken() ;
        else return false ;      
        // focus
        if(st.hasMoreTokens())
        {
          s4 = st.nextToken() ;
          if(s4.equalsIgnoreCase("true")) bFocus = true ;
        }  
        try{
          iRow  = Integer.parseInt(s1);
          iCell = Integer.parseInt(s2);
        }
        catch(Exception e){
            err("SetCellValue: Unable to get row,cell ccordinate");
        }
        iRow--;
        iCell--;
        err("setCellValue() set value:"+s3+" for "+iRow+","+iCell);        
        if((iRow  < 0 || iRow  > iNbRows)
        || (iCell < 0 || iCell > iNbCols))
          return false ;
        CellProp cp = getCellProp(iCell);
        try{
        //
        // NUMBER column
        //
        if(coltypes[iCell].equalsIgnoreCase("NUMBER"))
        {
          if(!s3.equalsIgnoreCase(" "))
            fValue = new Double(Double.parseDouble(s3)) ;
          data[iRow][iCell] = fValue ;
        }
        //
        // INTEGER column
        //
        else if(coltypes[iCell].equalsIgnoreCase("INTEGER"))
        {
          if(!s3.equalsIgnoreCase(" "))
            iValue = new Integer(Integer.parseInt(s3)) ;
          data[iRow][iCell] = iValue ;
        }           
        //
        // DATE column
        //
        else if(coltypes[iCell].equalsIgnoreCase("DATE"))
        {
          if((cp.sFormat != null) && (!cp.sFormat.equalsIgnoreCase(" ")))
            sdf = new SimpleDateFormat(cp.sFormat);
          else
            sdf = new SimpleDateFormat(sDateFormat);
          if(!s3.equalsIgnoreCase(" ")) 
          {
           try{
             dValue = sdf.parse(s3); 
             data[iRow][iCell] = dValue ;
            } catch (Exception e){
                err(" ! SetCellValue:Unable to format Date value:"+s3);
            };            
          }
        }
        //
        // IMAGE column
        //
        else if(coltypes[iCell].equalsIgnoreCase("IMAGE"))
        {
          log("clear image:"+s3);
          if(s3.equalsIgnoreCase("NULL"))
              log("clear image at:"+iRow+","+iCell);
              // BASE64Decoder decoder = new BASE64Decoder(); // MLT-7702

              try {
                  // byte[] dStr = decoder.decodeBuffer(""); // MLT-7702
                  byte[] dStr =  Base64.getDecoder().decode(""); // MLT-7702                  
                  ImageIcon ic = new ImageIcon(dStr);
                  Image img = ic.getImage() ;
                  //images[iRow][iCell] = img ;
                  images[table.convertRowIndexToModel(iRow)][table.convertColumnIndexToModel(iCell)] = img;
                  table.setValueAt(ic,iRow,iCell);                              
              } catch (Exception ioe) {
                        ioe.printStackTrace();
              }
        }          
        // CHAR column
        else
          data[iRow][iCell] = s3 ;
        }
        catch(Exception e){err("setCellValue():"+e.getMessage());}
        if(bFocus)
        {
          table.changeSelection(iRow,iCell,true,true);
          table.setRowSelectionInterval(iRow,iRow);          
          iRowPos = iRow; iCurRow = iRow ;
          iCellPos = iCell; iCurCell = iCell ;
        }    
        return true;
    }
    
    //
    // set the row properties
    //
    boolean setRowProp(String value)
    {
      String s = value.toString();
      String s1="", s2="" ;
      int iVal = -1 ;
      StringTokenizer st = new StringTokenizer(s,",");
      if(st.hasMoreTokens()) s1= st.nextToken() ;
      else return false ;
      if(st.hasMoreTokens()) s2 = st.nextToken() ;
      else return false ;
      if(s1.equalsIgnoreCase("HEIGHT"))
      {
         try { 
           iVal = Integer.parseInt(s2);
           if(iVal > 0) {
             iRowHeight = iVal ;
             if(null != table) table.setRowHeight(iRowHeight);
           }
         }
         catch(Exception e){ return false ;}        
      }
      return true ;
    }
    
    //
    // set the cell properties
    //
    boolean setCellProp(String value)
    {
      String sColName="" ;
      String s = value.toString();
      String s1="", s2="", s3="", s4="" ;
      int iVal = -1 ;
      StringTokenizer st = new StringTokenizer(s,",");
      int iColPos = -1 ;
      if(st.hasMoreTokens()) sColName = st.nextToken() ;
      else return false ;
      if(st.hasMoreTokens()) s1 = st.nextToken() ; // key
      else return false ;
      if(st.hasMoreTokens()) s2 = st.nextToken() ; // val1
      else return false ;
      if(st.hasMoreTokens()) s3 = st.nextToken() ; // val2      
      if(st.hasMoreTokens()) s4 = st.nextToken() ; // val3     
      log("prop="+s1+"  value:"+s2);
      // search column position
      for(int i=0; i<colnames.length;i++)
        {
          if(colnames[i].equalsIgnoreCase(sColName))
          {
            iColPos = i ;
            sColName = colnames[i];
            break;
          }
      }
      if(iColPos < 0)
      {
        err("SetCellProperty(): Colulmn: "+sColName+" not found. Unable to set property");
        return false ; // column not found
      }  
      CellProp cp = (CellProp)hCellProps.get(sColName);
      if(cp != null)
      {
        // visible property
        if(s1.equalsIgnoreCase("VISIBLE"))
        {
           if(s2.equalsIgnoreCase("true")) {
                cp.bVisible = true ; 
                cp.iWidth = 40 ;
                cp.iMinWidth = 40 ;
                cp.iMaxWidth = 40 ;                
           }
           else if(s2.equalsIgnoreCase("false")) {
                cp.bVisible = false ; 
                cp.iWidth = 1 ;
                cp.iMinWidth = 1 ;
                cp.iMaxWidth = 1 ;
                cp.bEnabled = false;
                cp.bResize = false;
           }
        }        
        // enable property
        else if(s1.equalsIgnoreCase("ENABLE"))
        {
           if(s2.equalsIgnoreCase("true")) cp.bEnabled = true ; 
           else if(s2.equalsIgnoreCase("false")) cp.bEnabled = false ; 
        }
        // resizable property
        else if(s1.equalsIgnoreCase("RESIZE"))
        {
           if(s2.equalsIgnoreCase("true")) cp.bResize = true ; 
           else if(s2.equalsIgnoreCase("false")) cp.bResize = false ; 
        }
        // width property
        else if(s1.equalsIgnoreCase("WIDTH"))
        {
           try { 
             iVal = Integer.parseInt(s2);
             if(iVal >0) cp.iWidth = iVal ;
           }
           catch(Exception e){ return false ;}
        }
        // minimum width property
        else if(s1.equalsIgnoreCase("MIN_WIDTH"))
        {
           try { 
             iVal = Integer.parseInt(s2);
             if(iVal >0) cp.iMinWidth = iVal ;
           }
           catch(Exception e){ return false ;}
        }        
        // maximum width property
        else if(s1.equalsIgnoreCase("MAX_WIDTH"))
        {
           try { 
             iVal = Integer.parseInt(s2);
             if(iVal >0) cp.iMaxWidth = iVal ;
           }
           catch(Exception e){ return false ;}
        }        
        // height property
        else if(s1.equalsIgnoreCase("HEIGHT"))
        {
           try { 
             iVal = Integer.parseInt(s2);
             if(iVal >0) cp.iHeight = iVal ;
           }
           catch(Exception e){ return false ;}
        }
        // format property
        else if(s1.equalsIgnoreCase("FORMAT"))
        {
           cp.sFormat = s2 ;
        }
        // title property
        if(s1.equalsIgnoreCase("TITLE"))
        {
           cp.sHeader = s2 ;
        }
        // background color property
        else if(s1.equalsIgnoreCase("BG_COLOR"))
        {
           cp.cBack = getColor(s2) ;
        }
        // foreground color property
        else if(s1.equalsIgnoreCase("FG_COLOR"))
        {
           cp.cFore = getColor(s2) ;
        }                
        // alignment property
        else if(s1.equalsIgnoreCase("ALIGNMENT"))
        {
           if(s2.equalsIgnoreCase("LEFT"))        cp.iAlign = SwingConstants.LEFT ;
           else if(s2.equalsIgnoreCase("CENTER")) cp.iAlign = SwingConstants.CENTER ;
           else if(s2.equalsIgnoreCase("RIGHT"))  cp.iAlign = SwingConstants.RIGHT ;
        }   
        // CLOB scrollbars
        else if(s1.equalsIgnoreCase("SCROLLBARS"))
        {
           if(s2.equalsIgnoreCase("ALWAYS"))         cp.iScrollH = JScrollPane.HORIZONTAL_SCROLLBAR_ALWAYS;
           else if(s2.equalsIgnoreCase("AS_NEEDED")) cp.iScrollH = JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED;
           else if(s2.equalsIgnoreCase("NEVER"))     cp.iScrollH = JScrollPane.HORIZONTAL_SCROLLBAR_NEVER;
           if(s3.equalsIgnoreCase("ALWAYS"))         cp.iScrollV = JScrollPane.VERTICAL_SCROLLBAR_ALWAYS;
           else if(s3.equalsIgnoreCase("AS_NEEDED")) cp.iScrollV = JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED;
           else if(s3.equalsIgnoreCase("NEVER"))     cp.iScrollV = JScrollPane.VERTICAL_SCROLLBAR_NEVER;           
        }            
        // CheckBox property
        else if(s1.equalsIgnoreCase("CHECKBOX"))
        {
           if(s2 != null && s3 != null) {
             cp.setCheckBoxValues(s2,s3);
             coltypes[iColPos] = "CHECKBOX" ;
             log("SetCellProperty(): - CHECKBOX:"+s2+" / "+s3);
           }                                   
           else {
               err("SetCellProperty(): - CHECKBOX: both checked and uncheked values must be provided");
           }
        } 
        // ComboBox property
        else if(s1.equalsIgnoreCase("COMBOBOX"))
        {
           // get the values
           if((!s2.equalsIgnoreCase("true")) && (!s2.equalsIgnoreCase("false"))){
              err("SetCellProperty(): - COMBOBOX - first argument must be true or false:"+s2);    
              return false;
           }
           StringTokenizer st2 = new StringTokenizer(s3,"^");
           comboBox = new JComboBox();
           while(st2.hasMoreTokens()) {
               comboBox.addItem(st2.nextToken());
           }
           if(s2.equalsIgnoreCase("true")) comboBox.addItem("");
           coltypes[iColPos] = "COMBOBOX" ;
           bComboBox = true ;
           comboBox.addComponentListener(new ComponentAdapter() {
              public void componentShown(ComponentEvent e) {
                final JComponent c = (JComponent) e.getSource();
                SwingUtilities.invokeLater(new Runnable() {
                  public void run() {
                    c.requestFocus();
                    if (c instanceof JComboBox) {
                    }
                  }
                });
              }
            });
        }          
        // image scalling
        else if(s1.equalsIgnoreCase("IMAGE_SCALE"))
        {      
           int iX = 0, iY = 0;
           try { 
               iX = Integer.parseInt(s2);
               if(iX < -1) {
                   err("SetCellProperty() image scale X incorrect scale information. must be -1, >= 0 or WIDTH");
                   return false;                   
               }
           } 
           catch (NumberFormatException nfe) {
               if(!s2.equalsIgnoreCase("WIDTH"))  {
                   err("SetCellProperty() image scale X incorrect scale information. must be -1, >= 0 or WIDTH");
                   return false;
               }
           }
           try { 
               iY = Integer.parseInt(s3);
               if(iY < -1) {
                   err("SetCellProperty() image scale Y incorrect scale information. must be -1, >= 0 or HEIGHT");
                   return false;                   
               }
           } 
           catch (NumberFormatException nfe) {
               if(!s3.equalsIgnoreCase("HEIGHT"))  {
                   err("SetCellProperty() image scale Y incorrect scale information. must be -1, >= 0 or HEIGHT");
                   return false;
               }
           }           
           cp.sImgScaleX = s2 ;
           cp.sImgScaleY = s3 ;
        }          
        // font property
        else if(s1.equalsIgnoreCase("FONT"))
        {
           int iFontSize ;
           Font fFont ;
           try{ iFontSize= Integer.parseInt(s3) ;}
           catch (Exception e){ return false ;}
           int iWeight = Font.PLAIN ;
           if( s4.equalsIgnoreCase("N")) iWeight = Font.PLAIN ;
           else if( s4.equalsIgnoreCase("B"))  iWeight = Font.BOLD ;
           else if( s4.equalsIgnoreCase("I"))  iWeight = Font.ITALIC ;
           else if( s4.equalsIgnoreCase("BI")) iWeight = Font.BOLD + Font.ITALIC ; 
           if( s2 != null ) 
           { 
             try{
                fFont = new Font(s2, iWeight, iFontSize) ; 
                cp.fFont = fFont ;
                fColFont[iColPos] = fFont ;
             }
             catch (Exception e) {
               err("SetCellProperty(): Unable to set Font:"+value);
             };
           }           
        }                
        
        hCellProps.put(sColName,cp);
      }
      else
          err("SetCellProperty(): Header column not found: "+sColName);
      return true ;
    }
    //
    // set the cell instance properties
    //
    boolean setCellInstProp(String value) {
        String sColName = "";
        String s1 = "", s2 = "", s3 = "", s4 = "";
        StringTokenizer st = new StringTokenizer(value, ",");
        int iColPos = -1;
        if (st.hasMoreTokens())
            sColName = st.nextToken().toUpperCase();
        else
            return false;
        if (st.hasMoreTokens())
            s1 = st.nextToken(); // key
        else
            return false;
        if (st.hasMoreTokens())
            s2 = st.nextToken(); // val1
        else
            return false;
        if (st.hasMoreTokens())
            s3 = st.nextToken(); // val2
        if (st.hasMoreTokens())
            s4 = st.nextToken(); // val3
        CellProp cp = (CellProp)hCellInstProps.get(sColName);
        if (cp == null) {
            cp = new CellProp(sColName);
        }
        // enable property
        if (s1.equalsIgnoreCase("ENABLE")) {
            if (s2.equalsIgnoreCase("true"))
                cp.bEnabled = true;
            else if (s2.equalsIgnoreCase("false"))
                cp.bEnabled = false;
        }
        // background color property
        else if (s1.equalsIgnoreCase("BG_COLOR")) {
            cp.cBack = getColor(s2);
        }
        // foreground color property
        else if (s1.equalsIgnoreCase("FG_COLOR")) {
            cp.cFore = getColor(s2);
        }
        // alignment property
        else if (s1.equalsIgnoreCase("ALIGNMENT")) {
            if (s2.equalsIgnoreCase("LEFT"))
                cp.iAlign = SwingConstants.LEFT;
            else if (s2.equalsIgnoreCase("CENTER"))
                cp.iAlign = SwingConstants.CENTER;
            else if (s2.equalsIgnoreCase("RIGHT"))
                cp.iAlign = SwingConstants.RIGHT;
        }
        // font property
        else if (s1.equalsIgnoreCase("FONT")) {
            int iFontSize;
            Font fFont;
            try {
                iFontSize = Integer.parseInt(s3);
            } catch (Exception e) {
                return false;
            }
            int iWeight = Font.PLAIN;
            if (s4.equalsIgnoreCase("N"))
                iWeight = Font.PLAIN;
            else if (s4.equalsIgnoreCase("B"))
                iWeight = Font.BOLD;
            else if (s4.equalsIgnoreCase("I"))
                iWeight = Font.ITALIC;
            else if (s4.equalsIgnoreCase("BI"))
                iWeight = Font.BOLD + Font.ITALIC;
            if (s2 != null) {
                try {
                    fFont = new Font(s2, iWeight, iFontSize);
                    cp.fFont = fFont;
                    fColFont[iColPos] = fFont;
                } catch (Exception e) {
                    err("SetCellInstProperty(): Unable to set Font:" + value);
                }
                ;
            }
        }
        hCellInstProps.put(sColName, cp);
        return true;
    }

    //
    // set the data
    //
    boolean setData(String value)
    {
      String label = value.toString();
      StringTokenizer st ;
      String sValue ;
      String sFormatedValue = "" ;
      Double   fValue = new Double(0d) ;
      Integer  iValue = new Integer(0);
      DateFormat sdf = null ;
      Date   dValue ;
      int i = 0 ;
      st = new StringTokenizer(label, separator);
      while (st.hasMoreTokens()) {
         sValue = st.nextToken() ;
         fValue = null ;
         dValue = null ;
         iValue = null;
         CellProp cp = getCellProp(i);

         try{
         if(cp.bCheckBox){
           if(sValue.equalsIgnoreCase(cp.sCheck))
             data[iCurLine][i] = true;
           else
             data[iCurLine][i] = false;      
         }
         //
         // IMAGE column
         //
         else if(coltypes[i].equalsIgnoreCase("IMAGE"))
         {
         }
         //
         // CLOB column
         //
         else if(coltypes[i].equalsIgnoreCase("CLOB"))
         {
         }         
         //
         // NUMBER column
         //
         else if(coltypes[i].equalsIgnoreCase("NUMBER"))
         {
           if(!sValue.equalsIgnoreCase(" "))
             fValue = new Double(Double.parseDouble(sValue)) ;
           data[iCurLine][i] = fValue ;
           sFormatedValue = fValue.toString() ;
         }
         //
         // INTEGER column
         //
         else if(coltypes[i].equalsIgnoreCase("INTEGER"))
         {
           if(!sValue.equalsIgnoreCase(" "))
             iValue = new Integer(Integer.parseInt(sValue)) ;
           data[iCurLine][i] = iValue ;
           sFormatedValue = iValue.toString() ;
         }           
         //
         // DATE column
         //
         else if(coltypes[i].equalsIgnoreCase("DATE"))
         {
           if(cp.sFormat != null)
             sdf = new SimpleDateFormat(cp.sFormat);
           else
             sdf = new SimpleDateFormat(sDateFormat);
           if(!sValue.equalsIgnoreCase(" ")) 
           {
            try{
              dValue = sdf.parse(sValue); 
              data[iCurLine][i] = dValue ;
              sFormatedValue = sValue ;
             } catch (Exception e){
                 err(" ! SetData:Unable to format Date value:"+sValue);
             };            
           }
         }
         // CHAR column
         else
          {
           data[iCurLine][i] = sValue ;
           sFormatedValue = sValue ;
          }
         // real data width
         FontMetrics fm = getFontMetrics(fColFont[i]);
	       int width = fm.stringWidth( sFormatedValue );
         if(width > iColWidth[i])
         {
           iColWidth[i] = width ;
         }
         }
         catch(Exception e){}
         i++;
      }
      SendMessage(DrawLAF.TBTRG_WNRI, ""+(iCurLine+1)); 
      iCurLine++ ;
      return true;
    }
    //
    // set the default date format
    //
    boolean setDateFormat(String value)
    {
      sDateFormat = value ;
      return true ;
    }    
    //
    // set the default number format
    //
    boolean setNumFormat(String value)
    {
      sNumFormat = value ;
      return true ;
    }    
    //
    // set the default integer format
    //
    boolean setIntFormat(String value)
    {
      sIntFormat = value ;
      return true ;
    }        
    //
    // add a blank row
    //
    boolean setAddRow(String value)
    {
      if(bInsert) {
          model.addRow();
          if(bComboBox)
          {
                ComboRowEditor rowEditor = new ComboRowEditor(table);
                rowEditor.setEditorAt(table.getRowCount()-1, new DefaultCellEditor(comboBox)); 
          }            
          table.changeSelection(table.getRowCount()-1, 0, false, false);
      }
      else {
          err("Insert no allowed for this table");
      }
      return true ;
    }
    //
    // delete a row
    //
    boolean setDelRow(String value)
    {
      if(bDelete) {
          int iRow = iCurRow;
          if(null != value){
                try {
                    iRow = Integer.parseInt(value);
                } catch (NumberFormatException nfe) {
                    err("DEL_ROW() invalid row number:"+value);
                    return false;
                }
          }
          iRow--;
          if(iRow > -1) model.delRow(iRow);
      }
      else {
          err("Delete no allowed for this table");
      }      
      return true ;
    }    
    //
    // set the log trace
    //
    boolean setLog(String value)
    {
      if(value.toString().equalsIgnoreCase("true")) bLog = true ;
      else bLog = false ;
      return true ;
    }
    //
    // set the table extend flag
    //
    boolean setExtend(String value)
    {
      if(value.toString().equalsIgnoreCase("true")) bExtend = true ;
      else bExtend = false ;
      return true ;
    }   
    //
    // set the CLOB editor extend flag
    //
    boolean setCLOBExtend(String value)
    {
      if(value.toString().equalsIgnoreCase("true")) bEditExtend = true ;
      else bEditExtend = false ;
      return true ;
    }       
    //
    // set the vertical lines
    //
    boolean setVLine(String value)
    {
      if(value.toString().equalsIgnoreCase("true")) table.setShowVerticalLines(true);
      else if(value.toString().equalsIgnoreCase("false")) table.setShowVerticalLines(false);
      return true ;
    }    
    //
    // set the vertical lines
    //
    boolean setHLine(String value)
    {
      if(value.toString().equalsIgnoreCase("true")) table.setShowHorizontalLines(true);
      else if(value.toString().equalsIgnoreCase("false")) table.setShowHorizontalLines(false);
      return true ;
    }    
    //
    // set the title
    //
    boolean setTitle(String value)
    {
      sTitle = value.toString();
      jbl.setText(sTitle);
      return true ;
    }
    //
    // set the title font
    //
    boolean setTitleFont(String value)
    {
      String s1="", s2="",s3="";
      int iSize=0;
      StringTokenizer st ;
      st = new StringTokenizer(value,",");
      if(st.hasMoreElements()){
          s1 = st.nextToken(); // font name
      }else {err("setTitleFont() incorrect setting:"+value);return false;}
      if(st.hasMoreElements()){
          s2 = st.nextToken(); // font weight
      }else {err("setTitleFont() incorrect setting:"+value);return false;}
      if(st.hasMoreElements()){
          s3 = st.nextToken(); // font size
      }else {err("setTitleFont() incorrect setting:"+value);return false;}      
      try {
            iSize = Integer.parseInt(s3);
      } catch (NumberFormatException nfe) { err("setTitleFont() incorrect font size:"+value);return false;}
       Font fFont ;
       int iWeight = Font.PLAIN ;
       if( s2.equalsIgnoreCase("N")) iWeight = Font.PLAIN ;
       else if( s2.equalsIgnoreCase("B"))  iWeight = Font.BOLD ;
       else if( s2.equalsIgnoreCase("I"))  iWeight = Font.ITALIC ;
       else if( s2.equalsIgnoreCase("BI")) iWeight = Font.BOLD + Font.ITALIC ; 
       if( s2 != null ) 
       { 
         try{
            fFont = new Font(s1, iWeight, iSize) ; 
            if(null != jbl) {
                jbl.setFont(fFont);
            }
            else {
                err("setTitleFont() Use SET_TB_TITLE before setting other title properties");
                return false;
            }
         }
         catch (Exception e) { err("setTitleFont() unable to set Font:"+value);return false;}
       }           
      return true ;
    }    
    //
    // show the title
    //
    boolean setTitleShow(String value)
    {
      if(value.equalsIgnoreCase("true"))  bTitle = true ;
      if(value.equalsIgnoreCase("false")) bTitle = false ;
      return true ;
    }    
    //
    // set the title alignment
    //
    boolean setTitleAlign(String value)
    {
      if(value.equalsIgnoreCase("LEFT")) iTitleAlign = JLabel.LEFT ;
      else if(value.equalsIgnoreCase("CENTER")) iTitleAlign = JLabel.CENTER ;
      else if(value.equalsIgnoreCase("RIGHT")) iTitleAlign = JLabel.RIGHT ;
      jbl.setHorizontalAlignment(iTitleAlign);
      return true ;
    } 
    //
    // set the title colors
    //
    boolean setTitleColors(String value)
    {
        String sFore="", sBack="";
        Color cF = Color.black, cB = Color.white;
        int i = value.indexOf(",");
        if (i > -1) {
            sFore = value.substring(0, i);
            sBack = value.substring(i + 1);
            cF = ik.makeColor(sFore);
            cB = ik.makeColor(sBack);
            jbl.setOpaque(true);
            jbl.setForeground(cF);
            jbl.setBackground(cB);
        }
        else {
            sFore = value;
            cF = ik.makeColor(sFore);
            jbl.setOpaque(false);
            jbl.setForeground(cF);
        }
      return true ;
    } 
    //
    // set the title colors
    //
    boolean setTotalColors(String value)
    {
        String sFore="", sBack="";
        int i = value.indexOf(",");
        if (i > -1) {
            sFore = value.substring(0, i);
            sBack = value.substring(i + 1);
            cTotalFG = ik.makeColor(sFore);
            cTotalBG = ik.makeColor(sBack);
        }
        else {
            sFore = value;
            cTotalFG = ik.makeColor(sFore);
        }
      return true ;
    }          
    //
    // set the filter
    //
    boolean setFilter(String value)
    {
      String s = value.toString();   
      int icol =-1 ;
      int ipos =-1 ;
      int[] ii = new int[iNbCols];
      String sColName = null ;
      ipos = s.indexOf(",");
      if(ipos > -1) {
         sColName = s.substring(0, ipos) ;
         sFilter  = s.substring(ipos+1) ;
         // search column position
         for(int i=0; i<colnames.length;i++)
           {
             if(colnames[i].equalsIgnoreCase(sColName))
             {
               icol = i ;
               break;
             }
         }
         if(icol < 0)
         {
           err("Column: "+sColName+" not found. Unable to set filter");
           return false ; // column not found
         } 
        if(!sFilter.equalsIgnoreCase("null")) {
          try {
            sorter.setRowFilter(RowFilter.regexFilter(sFilter,icol));
          } catch (PatternSyntaxException pse) {System.err.println("Bad regex pattern");}
        }
        else sorter.setRowFilter(null);         
      }
      else {        
        sFilter = s ;
        if(!sFilter.equalsIgnoreCase("null")) {
          try {
              for(int j=0; j<(iNbCols-2);j++){
                ii[j] = (j+1) ;  
              }
              sorter.setRowFilter(RowFilter.regexFilter(sFilter,ii));  
          } catch (PatternSyntaxException pse) {System.err.println("Bad regex pattern");}
        }
        else sorter.setRowFilter(null);
      }    
      totalize(table.getModel(),tableT.getModel());
      return true ;
    }    
    //
    // set the reorder flag
    //
    boolean setReorder(String value)
    {
      String s = value.toString();
      if(s.equalsIgnoreCase("true"))       bReorder = true ;
      else if(s.equalsIgnoreCase("false")) bReorder = false ;
      return true ;
    }    
    //
    // set the resize flag
    //
    boolean setResize(String value)
    {
      String s = value.toString();
      if(s.equalsIgnoreCase("true"))       bResize = true ;
      else if(s.equalsIgnoreCase("false")) bResize = false ;
      return true ;
    }        
    //
    // set the array size
    //
    boolean setArraySize(String value)
    {
      String label = value.toString();
      StringTokenizer st ;
      st = new StringTokenizer(label,",");
      x = Integer.parseInt(st.nextToken()) ;
      y = Integer.parseInt(st.nextToken()) ;
      iCurLine = 0;
      iNbCols = ( x > 0 ? x : 1 );
      iNbRows = ( y > 0 ? y : 1 );      
      colnames = new String[iNbCols] ;
      colnamesT = new String[iNbCols] ;      
      coltypes = new String[iNbCols] ;
      colTab = new String[iNbCols] ;
      iColWidth = new int[iNbCols] ;
      fColFont  = new Font[iNbCols] ;
      data = new Object[iNbRows][iNbCols] ;
      images = new Image[iNbRows][iNbCols] ;
      dataT = new Object[1][iNbCols] ;
      for(int i =0; i<iNbCols;i++)
      {
        coltypes[i]  = "CHAR" ;
        iColWidth[i] = 0 ;
        fColFont[i]  = table.getFont();
      }  
      log("ArraySize : "+iNbCols+" columns  "+iNbRows+" rows");
      return true ;
    }        
    //
    // set the frame bounds
    //
    boolean setBounds(String value)
    {
      String label = value.toString();
      StringTokenizer st ;
      st = new StringTokenizer(label,",");
      x = Integer.parseInt(st.nextToken()) ;
      y = Integer.parseInt(st.nextToken()) ;
      w = Integer.parseInt(st.nextToken()) ;
      h = Integer.parseInt(st.nextToken()) ;     
      log("x="+x+" y="+y+" w="+w+" h="+h);
      this.setBounds(x, y, w, h);
      rComponent = this.getBounds();
      return true ;
    }  
    //
    // set the selection background color
    //
    boolean setBackground(String value)
    {
      Color c = getColor(value.toString()) ;
      this.setBackground(c);
      repaint();
      return true ;
    }    
    //
    // set the selection background color
    //
    boolean setSelectBack(String value)
    {
      SelBGColor = getColor(value.toString()) ;
      table.setSelectionBackground(SelBGColor);
      return true ;
    }
    //
    // set the selection foreground color
    //
    boolean setSelectFore(String value)
    {
      SelFGColor = getColor(value.toString()) ;
      table.setSelectionForeground(SelFGColor);      
      return true ;
    } 
    //
    // set the number of rows
    // returned by the cursor
    //
    boolean setTableNumRows(String value)
    {
      String s = value.toString();    
      log("setTABNumRows():"+s);      
      try {
          iNbFetchedRows = Integer.parseInt(s);
          if(iNbFetchedRows > 0) {
            data = null ;
            System.gc();
            data = new Object[iNbFetchedRows][iNbCols] ;
            images = new Image[iNbFetchedRows][iNbCols] ;
            iCurLine = iCurRow = 0 ;
            iTotalLines = iNbFetchedRows ;
          }
      }
      catch(Exception e) {err("setTABNumRows() invalid argument: "+s);}
      return true ;
    }
    //
    // set the page size
    //
    boolean setTablePageSize(String value)
    {
      String s = value.toString();    
      log("setTablePageSize():"+s);      
      try {
          iPageSize = Integer.parseInt(s);
          if(iPageSize == -1) {
            bRefresh = false ;
          }
          else {
            bRefresh = true;
          }
      }
      catch(Exception e) {err("setTablePageSize() invalid argument: "+s);}
      return true ;
    }     
    //    
    // set the header background color
    //
    boolean setHeadBG(String value)
    {
      HeadBGColor = getColor(value.toString()) ;
      return true ;
    }
    //    
    // set the columns max width
    //
    boolean setColsMaxWidth(String value)
    {
      String s = value.toString() ;
      int i = 0 ;
      try {
        i = Integer.parseInt(s);
        iColsMaxWidth = i ;  
      }
      catch(Exception ex){err(" ! Set Cols Max Width - Wrong size given:"+s); return false;}
      return true ;
    }       
    //    
    // set the header height
    //
    boolean setHeadHeight(String value)
    {
      String s = value.toString() ;
      int i = 0 ;
      try {
        i = Integer.parseInt(s);
        iHeaderHeight = i ;  
      }
      catch(Exception ex){err(" ! Set Header Height - Wrong size given:"+s); return false;}
      return true ;
    }   
    //    
    // set the total header height
    //
    boolean setTotalHeadHeight(String value)
    {
      String s = value.toString() ;
      int i = 0 ;
      try {
        i = Integer.parseInt(s);
        iTotalHeaderHeight = i ;  
      }
      catch(Exception ex){err(" ! Set Total Header Height - Wrong size given:"+s); return false;}
      if(iTotalHeaderHeight < 1 && (null != tableT)){
          tableT.setTableHeader(null);
      }
      return true ;
    }       
    //    
    // set the total line
    //
    boolean setTotalLine(String value)
    {
      String s = value.toString() ;
      String scol=null,s1=null,s2=null;
      int ipos;
      int iNbre=0 ;
      boolean bFound=false ;
      boolean bOk=false;
      StringTokenizer st = new StringTokenizer(s,",");
      if(colnames == null) {
        err(" ! Set_Total_Line() you must use this method after the column header is defined (SETHEADER)");
        return false; 
      }
      while (st.hasMoreTokens()) {
         scol = st.nextToken(); 
         ipos = scol.indexOf("=");
          if(ipos == -1) {
             err(" ! Set Total Line() - wrong couple COLNAME=FORMULA:"+scol);
             return false;
          }
         s1 = scol.substring(0, ipos) ;
         s2 = scol.substring(ipos+1) ;
         bFound=false ;
         bOk=true;
         iNbre++;
         for(int i=0; i<colnames.length;i++) {
            if((null != colnames[i]) && colnames[i].equalsIgnoreCase(s1))
            {
              if(s2.equalsIgnoreCase("COUNT")) colnamesT[i] = libOP[0] ;
              else if(s2.equalsIgnoreCase("SUM")) colnamesT[i] = libOP[1] ;
              else if(s2.equalsIgnoreCase("AVG")) colnamesT[i] = libOP[2] ;
              else if(s2.equalsIgnoreCase("MAX")) colnamesT[i] = libOP[3] ;
              else if(s2.equalsIgnoreCase("MIN")) colnamesT[i] = libOP[4] ;

              // column type number ?
              if(!s2.equalsIgnoreCase("COUNT")) {
                if(  !coltypes[i].equalsIgnoreCase("INTEGER")
                  && !coltypes[i].equalsIgnoreCase("NUMBER") ) {
                  err(" ! Set Total Line() - only COUNT can be used on a non-numeric column ("+s1+")");
                  iNbre-- ;
                  colnamesT[i] = "" ;
                  bOk=false;
                }
              }
              bFound = true ;
              break;
            }
         }
          if(!bFound) {
              iNbre-- ;
              bOk=false;
              err(" ! Set Total Line() column not found:"+s1);          
          }
          if(
                 ! s2.equalsIgnoreCase("SUM") 
              && ! s2.equalsIgnoreCase("COUNT") 
              && ! s2.equalsIgnoreCase("MAX") 
              && ! s2.equalsIgnoreCase("MIN")               
              && ! s2.equalsIgnoreCase("AVG")               
          ) {
            err(" ! Set Total Line() formula must be:SUM,COUNT,MAX,MIN or AVG:"+s1);
            iNbre--;
            bOk=false;
          }
          log("Set Total Line - "+s2+" on "+s1);
          if(bOk) hFormulas.put(s1.toUpperCase(), s2);
      }
      if(iNbre>0) bTotalLine = true ;
      return true ;
    }  
    
    //    
    // set the total line labels
    //
    boolean setTotalLineLabels(String value)
    {
      String s = value.toString() ;
      String scol=null,s1=null,s2=null;
      int ipos;
      StringTokenizer st = new StringTokenizer(s,",");

      while (st.hasMoreTokens()) {
         scol = st.nextToken(); 
         ipos = scol.indexOf("=");
          if(ipos == -1) {
             err(" ! Set Total Line() - wrong couple KEY=LABEL:"+scol);
             return false;
          }
         s1 = scol.substring(0, ipos) ;
         s2 = scol.substring(ipos+1) ;
         if(s1.equalsIgnoreCase("COUNT"))    libOP[0] = s2 ;
         else if(s1.equalsIgnoreCase("SUM")) libOP[1] = s2 ;
         else if(s1.equalsIgnoreCase("AVG")) libOP[2] = s2 ;
         else if(s1.equalsIgnoreCase("MAX")) libOP[3] = s2;
         else if(s1.equalsIgnoreCase("MIN")) libOP[4] = s2;
      }
      return true ;
    }         
    
    //
    // set the header foreground color
    //
    boolean setHeadFG(String value)
    {
      HeadFGColor = getColor(value.toString()) ;
      return true ;
    }    
    //
    // set the header background color
    //
    boolean setDataBG(String value)
    {
      DataBGColor = getColor(value.toString()) ;
      return true ;
    }
    //
    // set the table background color
    //
    boolean setTableBG(String value)
    {
      cTableBG = getColor(value.toString()) ;
      if(null != scrollPane) {
        scrollPane.getViewport().setBackground(cTableBG);
        table.setBackground(cTableBG);
      }
      return true ;
    }    
    //
    // set the header foreground color
    //
    boolean setDataFG(String value)
    {
      DataFGColor = getColor(value.toString()) ;
      return true ;
    } 
    //
    // set the grid color
    //
    boolean setGridFG(String value)
    {
      GridColor = getColor(value.toString()) ;
      return true ;
    } 
    //
    // can update the table ?
    //
    boolean setUpdate(String value)
    {
      if( value.toString().toUpperCase().equals("TRUE") )
        if(bROWID) bUpdate = true ;
      else
        bUpdate = false ;
          
      return true ;
    }
    //
    // can insert the table ?
    //
    boolean setInsert(String value)
    {
      if( value.toString().toUpperCase().equals("TRUE") )
        if(bROWID) bInsert = true ;
      else
        bInsert = false ;          
      return true ;
    } 
    //
    // can delete the table ?
    //
    boolean setDelete(String value)
    {
      if( value.toString().toUpperCase().equals("TRUE") )
        if(bROWID) bDelete = true ;
      else
        bDelete = false ;          
      return true ;
    } 
    //
    // insert a row
    //
    boolean setInsertRow(String value)
    {
        if(bInsert){
            //model.insertRow(model.getRowCount(), new Object[][]);
        }         
      return true ;
    }     
    //
    // raz the values
    //
    boolean init(String value)
    {
      raz() ;
      return true ;
    } 
    //
    // set the separator character
    //
    boolean setSeparator(String value)
    {
      separator = value.toString() ;
      return true ;
    } 
    //
    // get the value of a particular cell
    //
    boolean setCellPos(String value)
    {
      StringTokenizer st ;
      String sCell=null;
      int row, cell ;
      if(colnames.length == 0) return false;
      st = new StringTokenizer(value.toString(),",");
      try{ 
        row  = Integer.parseInt(st.nextToken()) ;
      } catch(Exception ex){return false;}    
      sCell = st.nextToken() ;
      try{
        cell = Integer.parseInt(sCell) ;
      } catch(Exception ex){ 
          // Cell given by name
          // search column position
          cell = -1 ;
          for(int i=0; i<colnames.length;i++)
          {
              if(colnames[table.convertColumnIndexToModel(i)].equalsIgnoreCase(sCell))
              {
                cell = (i+1) ;
                break;
              }
          }          
          if(cell == -1) return false;
      }    
      if( ((row < 0)  || (row > table.getRowCount()))  ||
          ((cell < 0) || (cell > table.getColumnCount())) )
      {
        return false ;
      }
      else
      { 
        iRowPos = row - 1;
        iCellPos = cell - 1 ;
        iCurRow = iRowPos ;
        iCurCell = iCellPos ;
      }
      log("SETCELLPOS row="+iCurRow+" cell="+iCurCell);
      bSendEvent = false;
      table.changeSelection(iRowPos,iCellPos,false,false);
      bSendEvent = true;
      return true ;
    }     
    //
    // set the pointer on a particular row
    //
    boolean setRowPos(String value)
    {
      try{
        iRowPos = Integer.parseInt(value.toString()) ;
      }
      catch(Exception e)
      {
        err(" ! setRowPos : Unable to set Row position:"+iRowPos);
        bIdentifiedLine = false ;
        return false ;
      }
      if( (iRowPos < 1) ) return false ;
      else iRowPos-- ;
      iCurRow = iRowPos ;
      table.changeSelection(iRowPos,iCellPos,false,false);
      table.setRowSelectionInterval(iRowPos,iRowPos);
      log("setRowPos():"+iRowPos);
      bIdentifiedLine = true ;
      return true ;
    }
    //
    // mark the new row as inserted
    //
    boolean setInsertDone(String value)
    {
        if(bIdentifiedLine && (null == model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(0)))) {
            model.setValueAt(value, iRowPos, 0);
            iNbInsert--;
        }
      log("setInsertDone()"+value);
      return true ;
    } 
    //
    // mark the new row as updated
    //
    boolean setUpdateDone(String value)
    {
        String s = (String)hRowsChanged.get(value); 
        if(null != s) {
           hRowsChanged.remove(value) ;
           iNbUpdate--;
        }
        log("setUpdateDone()"+value);
      return true ;
    } 
    //
    // mark the new row as deleted
    //
    boolean setDeleteDone(String value)
    {
        String s = (String)hRowsDeleted.get(value);
        if (null != s) {
            hRowsDeleted.remove(value);
            iNbDelete--;
        }
        log("setDeleteDone()"+value);
      return true ;
    }     
    //
    // set the pointer on a particular rowid
    //
    boolean setRowIdPos(String value)
    {
      log("setRowIdPos() search for:"+value);
      for(int i=0; i < table.getRowCount(); i++){
          if(null != model.getValueAt(table.convertRowIndexToModel(i), table.convertColumnIndexToModel(0)) 
             && (value.equalsIgnoreCase((String)model.getValueAt(table.convertRowIndexToModel(i), table.convertColumnIndexToModel(0))))) {
             iCurRow = i;
             iRowPos = i;
             table.changeSelection(iCurRow,iCellPos,true,true);
             table.setRowSelectionInterval(iCurRow,iCurRow);             
             log("setRowIdPos() found at:"+iCurRow);
             bIdentifiedLine = true ;
             return true ;
          }
      }    
      err("setRowIdPos() rowid not found:"+value);
      bIdentifiedLine = false ;
      return true ;
    }
    // is pointed row identified ?
    String getIdentifiedRow() {
        if(bIdentifiedLine) return "true";
        else return "false" ;
    }
    //
    // set the locale
    //
    boolean setLocale(String value)
    {
      try
      {
        locale = new Locale(value.toString());
        Locale.setDefault(locale);
        DecimalSymbols = new DecimalFormatSymbols(locale); 
      }
      catch (Exception e) {err(" ! Unable to set locale:"+value);}
      return true;
    }
    //
    // set the decimal separators
    //
    boolean setDecSeparators(String value)
    {
      String label = value.toString();
        char c1 = '.';
        char c2 = ',';
        try {
            c1 = label.charAt(0);
            c2 = label.charAt(1);
        } catch (Exception e) {
            err("LAF Table wrong decimal separators: "+label);
        }
      DecimalSymbols.setDecimalSeparator(c1);
      DecimalSymbols.setGroupingSeparator(c2);
      return true ;
    }
    
    JTable getTable(){
        return table;
    }
    
    //
    // show the JTable
    // 
    boolean showTable(String value)
    {
        rPanel = this.getBounds();
        if(bTitle && (sTitle.length()>0) ){
            Rectangle2D rect = jbl.getFont().getStringBounds(jbl.getText(), new FontRenderContext(new AffineTransform(), true, true));
            int iH = (int)(rect.getHeight()+4);
            jbl.setLocation(0,1);
            jbl.setHorizontalAlignment(iTitleAlign);
            jbl.setSize(jp.getWidth(), iH < 20.0 ? 20 : iH);
            scrollPane.setLocation(0,jbl.getHeight());
        }
        else {
            jbl.setSize(jp.getWidth(),0);
            scrollPane.setLocation(0,0);
        }
        table.setLocation(scrollPane.getLocation());
        wS = scrollPane.getWidth();
        hS = scrollPane.getHeight();
        scrollPane.setSize(this.getWidth(),this.getHeight()-jbl.getHeight());
        table.setSize(scrollPane.getSize());
        table.setBorder(BorderFactory.createEmptyBorder());
        scrollPane.setBorder(borderT);
        scrollPane.getViewport().setBackground(cTableBG);
        scrollPane.setBackground(cTableBG);
        TableColumn tabcol = null, tabcolT = null ;
        String sFormat = sNumFormat ;
        model = new MyTableModel(data,colnames) ;
        table.setModel(model); 
        // auto resize columns ?
        table.setAutoResizeMode(iResizeMode);      
        // set the reorder flag
        table.getTableHeader().setReorderingAllowed(bReorder);
        // set the resize flag
        table.getTableHeader().setResizingAllowed(bResize);
        // set the header height
        if(iHeaderHeight > -1) table.getTableHeader().setPreferredSize(new Dimension(0,iHeaderHeight));
        // set the row height
        if(iRowHeight > 0) table.setRowHeight(iRowHeight);
        
        Rectangle2D rect = null;
        Font ft = table.getTableHeader().getFont() ;
                    
        // set special cell format
        for(int z=0; z<colnames.length; z++)
        {
          CellProp cp = getCellProp(z) ;
          tabcol = table.getColumnModel().getColumn(z) ;
          // adjust cell width
          rect = ft.getStringBounds(colnames[z], new FontRenderContext(new AffineTransform(), true, true));
          if(rect.getWidth() > iColWidth[z]) {
            tabcol.setPreferredWidth((int)(rect.getWidth())+16);
          }
          else {
            tabcol.setPreferredWidth((int)(iColWidth[z])+16);  
          }           
          if(coltypes[z].equalsIgnoreCase("IMAGE"))
          {
            tabcol.setCellRenderer(new ImageTableRenderer());
          }
          // general properties
          if(cp != null)
          {
            if(cp.iWidth > -1) tabcol.setPreferredWidth(cp.iWidth);
            if(cp.iMinWidth > -1) tabcol.setMinWidth(cp.iMinWidth);
            if(cp.iMaxWidth > -1) tabcol.setMaxWidth(cp.iMaxWidth);
            if(iColsMaxWidth > -1) tabcol.setMaxWidth(iColsMaxWidth);
            if(cp.sHeader != null) tabcol.setHeaderValue(cp.sHeader);
            tabcol.setResizable(cp.bResize);
          }
          if(coltypes[z].equalsIgnoreCase("COMBOBOX"))
          {
                ComboRowEditor rowEditor = new ComboRowEditor(table);
                for(int j=0; j<iNbRows;j++) {
                   rowEditor.setEditorAt(j, new DefaultCellEditor(comboBox)); 
                }
                tabcol.setCellEditor(rowEditor);
                tabcol.setCellRenderer(new CharRenderer(colnames[z]));
          }                          
          if(cp.sFormat != null)
          {
            log("set format for "+colnames[z]+" format:"+cp.sFormat);
            sFormat = cp.sFormat ;
            if(coltypes[z].equalsIgnoreCase("DATE"))
            {
              DateColumnFormat dateColumnFormat = new DateColumnFormat(cp.sFormat,cp.sFormat,colnames[z]); 
              tabcol.setCellRenderer(dateColumnFormat.getRenderer());
              tabcol.setCellEditor(dateColumnFormat.getEditor());
            }
            else if(coltypes[z].equalsIgnoreCase("NUMBER"))
            {
              NumberColumnFormat numColumnFormat = new NumberColumnFormat(cp.sFormat,cp.sFormat); 
              tabcol.setCellRenderer(numColumnFormat.getRenderer());
              tabcol.setCellEditor(numColumnFormat.getEditor());
            }
            else if(coltypes[z].equalsIgnoreCase("INTEGER"))
            {
              tabcol.setCellRenderer(new IntegerRenderer(cp.sFormat));
            }            
          }
          else
          {
            if(coltypes[z].equalsIgnoreCase("DATE"))
            {
              DateColumnFormat dateColumnFormat = new DateColumnFormat(sDateFormat,sDateFormat,colnames[z]); 
              tabcol.setCellRenderer(dateColumnFormat.getRenderer());
              tabcol.setCellEditor(dateColumnFormat.getEditor());
            }  
            else if(coltypes[z].equalsIgnoreCase("NUMBER"))
            {
              NumberColumnFormat numColumnFormat = new NumberColumnFormat(sNumFormat,sNumFormat,colnames[z]); 
              tabcol.setCellRenderer(numColumnFormat.getRenderer());
              tabcol.setCellEditor(numColumnFormat.getEditor());            
            }
            else if(coltypes[z].equalsIgnoreCase("INTEGER"))
            {
              tabcol.setCellRenderer(new IntegerRenderer(sIntFormat,colnames[z]));
            }             
            else if(coltypes[z].equalsIgnoreCase("CHAR"))
            {
              tabcol.setCellRenderer(new CharRenderer(colnames[z]));
            } 
            else if(coltypes[z].equalsIgnoreCase("CLOB"))
            {
              tabcol.setCellRenderer(new CLOBRenderer(colnames[z]));
              tabcol.setCellEditor(new CLOBEditor(colnames[z]));
            }                
          }
        }
                
        iRowsChanged = new int[iNbRows]; 

        // seperate frame ?
        if( value.toString().equalsIgnoreCase("true") ) {
          bSeperateFrame = true ;
        }
        log("separateFrame="+value.toString().toUpperCase());
        if( HeadBGColor != null )
          table.getTableHeader().setBackground(HeadBGColor);
        if( HeadFGColor != null )          
          table.getTableHeader().setForeground(HeadFGColor);
        if( DataBGColor != null )
          table.setBackground(DataBGColor);
        if( DataFGColor != null )          
          table.setForeground(DataFGColor);          
        if( GridColor != null )                    
          table.setGridColor(GridColor);

        table.setRowSelectionAllowed(true);
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);        
        // set the focus on current cell
        table.changeSelection(0,0,false,false);
        try{
          table.setRowSelectionInterval(1,1);
        } catch(Exception e){}    
        
        table.setAutoCreateRowSorter(true);
        sorter = new TableRowSorter(model);
        table.setRowSorter(sorter);
        
        //
        // add a mouse and key listener to the table
        //
        try{
          table.removeKeyListener(kl);
          table.removeMouseListener(ml);
        }
        catch(Exception e){}
        table.addKeyListener(kl);
        table.addMouseListener(ml);
        
        // show the totalization table ?
        if(bTotalLine) {
           scrollPane.setSize(this.getWidth(),this.getHeight()-iTotalHeight-jbl.getHeight());           
           table.setSize(scrollPane.getSize());           
           tableT = new JTable(dataT,colnamesT);
           tableT.setName("TOTAL");
           tableT.setBackground(cTotalBG);
           tableT.setAutoResizeMode(iResizeMode);      
           String op = null ;
           for(int z=0; z<colnames.length; z++) {
              tabcol  = table.getColumnModel().getColumn(z) ;
              tabcolT = tableT.getColumnModel().getColumn(z) ;
              if(coltypes[z].equalsIgnoreCase("IMAGE")){
                tabcolT.setCellRenderer(new NULLImageRenderer(colnames[z]));
              }
              op = (String)hFormulas.get(colnames[z].toUpperCase());
              if(op != null && (!coltypes[z].equalsIgnoreCase("IMAGE"))) { 
                 if( op.equalsIgnoreCase("COUNT") ) { 
                   tabcolT.setCellRenderer(new IntegerRenderer(sIntFormat,colnames[z]));
                 }
                 else if(coltypes[z].equalsIgnoreCase("NUMBER"))
                 {
                   NumberColumnFormat numColumnFormat = new NumberColumnFormat(sNumFormat,sNumFormat,colnames[z]); 
                   tabcolT.setCellRenderer(numColumnFormat.getRenderer());
                 }
                 else if(coltypes[z].equalsIgnoreCase("INTEGER"))
                 {
                   tabcolT.setCellRenderer(new IntegerRenderer(sIntFormat,colnames[z]));
                 }
                 else if(!coltypes[z].equalsIgnoreCase("IMAGE"))
                 {
                   tabcolT.setCellRenderer(new CharRenderer(colnames[z]));
                 }
                 // total cell tooltips
                 JComponent jc = (JComponent)tabcolT.getCellRenderer(); 
                 if( op.equalsIgnoreCase("COUNT") ) { 
                   if(null != jc) jc.setToolTipText(libOP[0]);
                 }
                 else if( op.equalsIgnoreCase("SUM") ) { 
                   if(null != jc) jc.setToolTipText(libOP[1]);
                 }                 
                 else if( op.equalsIgnoreCase("AVG") ) { 
                   if(null != jc) jc.setToolTipText(libOP[2]);
                 }                 
                 else if( op.equalsIgnoreCase("MAX") ) { 
                   if(null != jc) jc.setToolTipText(libOP[3]);
                 }                 
                 else if( op.equalsIgnoreCase("MIN") ) { 
                   if(null != jc) jc.setToolTipText(libOP[4]);
                 } 
              }
              else if(!coltypes[z].equalsIgnoreCase("IMAGE")) {
                tabcolT.setCellRenderer(new CharRenderer(colnames[z]));
              }
              tabcolT.setPreferredWidth(tabcol.getPreferredWidth());
              tabcolT.setMinWidth(tabcol.getMinWidth());
              tabcolT.setMaxWidth(tabcol.getMaxWidth()); 
           }    
           /*
           if(iTotalHeaderHeight > -1) 
             tableT.getTableHeader().setPreferredSize(new Dimension(0,iTotalHeaderHeight));
           */
           tableT.setAutoCreateColumnsFromModel(true);     
           tableT.setRowSelectionAllowed(false);
           tableT.setBorder(BorderFactory.createEmptyBorder());
           tableT.getTableHeader().setBackground(cTableBG);
           tableT.getTableHeader().setPreferredSize(new Dimension(0,0));
           tableT.setEnabled(false);
           scrollPane2 = new JScrollPane(tableT);
           scrollPane2.setBorder(BorderFactory.createEmptyBorder());
           scrollPane2.getViewport().setBackground(cTableBG);
           scrollPane2.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
           scrollPane2.setLocation(scrollPane.getInsets().left,scrollPane.getHeight()+ jbl.getHeight()-1);
           scrollPane2.setSize(this.getWidth(),iTotalHeight);  
           scrollPane2.getHorizontalScrollBar().setModel(scrollPane.getHorizontalScrollBar().getModel());
           tableT.setSize(scrollPane2.getSize());
           this.add(scrollPane2); 
           totalize(table.getModel(),tableT.getModel());

           TableColumnModelListener tableColumnModelListener = new TableColumnModelListener() {
            public void columnAdded(TableColumnModelEvent e) {
            }
            public void columnMarginChanged(ChangeEvent e) {
              synchronizeHeaders() ;
            }
            public void columnMoved(TableColumnModelEvent e) {
              synchronizeHeaders() ;
            }
            public void columnRemoved(TableColumnModelEvent e) {
            }
            public void columnSelectionChanged(ListSelectionEvent e) {
            }
          };

          table.getColumnModel().addColumnModelListener(tableColumnModelListener);
        }
        if(iVisibleRows > 0) {
            int iH = iVisibleRows*table.getRowHeight() + (table.getTableHeader().getBounds().height + jbl.getHeight()) ;
            if(bTotalLine) iH += 36 ;
            scrollPane.setSize(this.getWidth(),iH < this.getHeight() ? iH : this.getHeight());
            table.setSize(scrollPane.getSize());
            iTotalLines = iVisibleRows;
        }
        else {
            iTotalLines = (int)((scrollPane.getHeight() - table.getTableHeader().getBounds().height + jbl.getHeight()) / table.getRowHeight()) ;
        }
        if(bTotalLine && (scrollPane.getViewport().getWidth() < scrollPane.getWidth())){
          int dif = scrollPane.getWidth() - scrollPane.getViewport().getWidth();
          scrollPane2.setSize(scrollPane.getWidth()-dif,iTotalHeight);  
          rTable2 = scrollPane2.getBounds();
        }
        table.changeSelection(0, 0, false, false);
        rTable = scrollPane.getBounds();
        FileDrop fdp = new FileDrop(table, new FileDrop.Listener() {
                public void filesDropped(java.io.File[] files, Point pt) {
                    String sExt = null;
                    if ("IMAGE".equalsIgnoreCase(coltypes[pt.y])/*bAllowDnD*/ && files.length > 0) {
                        File fx = files[0];
                        log("fileDropped:"+fx);
                        if (!fx.isDirectory()) {
                            try {
                                int dot = files[0].getName().toLowerCase().lastIndexOf(".");
                                sExt = files[0].getName().toLowerCase().substring(dot + 1);
                                if (sExt.equals("gif") || sExt.equals("jpeg") || sExt.equals("jpg") ||
                                    sExt.equals("png")) {
                                    // read image file
                                    log("readImage at:"+pt.x+","+pt.y);
                                    readImageFile(files[0].getCanonicalPath(), pt.x, pt.y);
                                } else {
                                    err("DynTable Image drop [" + files[0].getCanonicalPath() +
                                                       "] is probably not an image the component can read");
                                }
                            } catch (java.io.IOException e) {
                            }
                        }
                    }
                }
            });        
        this.repaint();

        // if Seperate frame
        if( bSeperateFrame )
        {
          frame = new JFrame();
          frame.setTitle(sTitle);
          frame.setContentPane(contentpane);
          wF = this.getWidth() + 10 ;
          hF = this.getHeight() + 36 ;
          frame.setPreferredSize(new Dimension(wF,hF));
          frame.setLocation(xF,yF);
          frame.pack();
          frame.setVisible(true);
        }
        else frame = null ;
      return true ;
    }


   /*----------------------------------*
    * synchronize the 2 table headers
    *----------------------------------*/
   void synchronizeHeaders() {
     if(tableT == null) return ;
     tableT.setColumnModel(table.getColumnModel());
     tableT.getTableHeader().setDefaultRenderer(
         new DelegateHeaderRenderer(table.getTableHeader().getDefaultRenderer())); 
   }

   static class DelegateHeaderRenderer extends DefaultTableCellRenderer {

        @SuppressWarnings("compatibility:4225969496687341475")
        private static final long serialVersionUID = 4823540041219189737L;
        transient TableCellRenderer delegate;
   
    public DelegateHeaderRenderer(TableCellRenderer delegate) {
      this.delegate = delegate;
    }
   
    @Override
    public Component getTableCellRendererComponent(JTable table,
      Object value, boolean isSelected, boolean hasFocus, int row, int column) {
      try{
        String columnName = table.getColumnName(column);
        setBackground(Color.lightGray);  
        return delegate.getTableCellRendererComponent(table, columnName,
            isSelected, hasFocus, row, column);
      }   
      catch(Exception e){return null;}
    }
   }
     
   /*---------------------------------------*
    *   create a KeyListener for the table
    *---------------------------------------*/
   void setKeyListener()
   {
        kl = new KeyListener(){
	       public void keyPressed(KeyEvent e) {
           int key = e.getKeyCode() ;
           log( "Key:    " + key);
           int modifiersEx = e.getModifiersEx();
           log("ActionKey:"+e.isActionKey()+ "  modifier:"+modifiersEx);
           switch(key)
           {
             case KeyEvent.VK_PAGE_DOWN: 
                if((iCurRow + iTotalLines) > iTotalLines) {
                  iSens = 1 ;
                  e.consume();
                  setPageRequest(iCurPage + 1);
                }  
                break;
             case KeyEvent.VK_PAGE_UP: 
                if(((iCurRow - iTotalLines) < 1) && iCurPage > 1 ) {
                  iSens = -1 ;
                  e.consume();
                  setPageRequest(iCurPage - 1);
                }  
                break;
             case KeyEvent.VK_HOME: 
               if(modifiersEx != KeyEvent.CTRL_DOWN_MASK)
               {
                 iCurCell = 0 ; 
                 while(!isCellVisible(iCurCell)){
                     iCurCell++;
                 }
               }  
               SendMessage(DrawLAF.TBTRG_WNII, ""+(iCurCell+1)); 
               break ;
             case KeyEvent.VK_END: 
               if(modifiersEx != KeyEvent.CTRL_DOWN_MASK)
               {               
                 iCurCell = table.getColumnCount()-1 ; 
                 while(!isCellVisible(iCurCell)){
                     iCurCell--;
                 }                 
               }  
               SendMessage(DrawLAF.TBTRG_WNII, ""+(iCurCell+1)); 
               break ;
             case KeyEvent.VK_UP: 
                  if(((iCurRow - 1) < 0) && iCurPage > 1 ) {
                    iSens = -1 ;
                    e.consume();
                    setPageRequest(iCurPage - 1);
                  }  
                  else {
                    iCurRow-- ; 
                  }
               break ;
             case KeyEvent.VK_DOWN: 
                  if(iCurRow + 1 > (table.getRowCount()-1)) {
                    iSens = 1 ;
                    e.consume();
                    setPageRequest(iCurPage + 1);
                  }  
                  else {
                    iCurRow++ ; 
                  }
               break ;
             case KeyEvent.VK_RIGHT:
                  if(iCurCell < table.getColumnCount()-1 && (isCellVisible(iCurCell+1))) 
                  { 
                    iCurCell++ ;
                  }
                  SendMessage(DrawLAF.TBTRG_WNII, ""+(iCurCell+1)); 
                  break ;
             case KeyEvent.VK_LEFT:
                  if(iCurCell > 0 && isCellVisible(iCurCell-1))
                  { 
                    iCurCell-- ;
                  }
                  SendMessage(DrawLAF.TBTRG_WNII, ""+(iCurCell+1)); 
                  break ;
             case KeyEvent.VK_TAB:
                   if(modifiersEx == 0) {
                      if(iCurCell < table.getColumnCount()-1) iCurCell++;
                      else iCurCell = 1 ;
                   }
                   else if(modifiersEx == 64) {
                      if(iCurCell > 1) iCurCell-- ;  
                      else iCurCell = table.getColumnCount()-1;
                   }  
                   SendMessage(DrawLAF.TBTRG_WNII, ""+(iCurCell+1)); 
                  break ; 
             case KeyEvent.VK_DELETE:
                  if(coltypes[iCurCell].equalsIgnoreCase("IMAGE")) {
                      String s = "false,0,0,400,140,question," + sAlertYes + "|" + sAlertNo + ",2,Image," + sAlertMsg;
                      dBean.setProperty( DrawLAF.pDisplayAlert, s ) ;
                      s = (String)dBean.getProperty(DrawLAF.pGetAlertButton);
                      if(s.equalsIgnoreCase("1")){
                          // delete the image
                          log("delete image at:"+iCurRow+","+iCurCell);
                          // BASE64Decoder decoder = new BASE64Decoder();
                          try {
                              byte[] dStr =  Base64.getDecoder().decode(""); // MLT-7702
                              // byte[] dStr = decoder.decodeBuffer("");
                              ImageIcon ic = new ImageIcon(dStr);
                              Image img = ic.getImage() ;
                              //images[iCurRow][iCurCell] = img ;
                              images[table.convertRowIndexToModel(iCurRow)][table.convertColumnIndexToModel(iCurCell)] = img;
                              table.setValueAt(ic,iCurRow,iCurCell);                              
                          } catch (Exception ioe) {
                                    // TODO: Add catch code
                                    ioe.printStackTrace();
                          }
                      }
                  }
                  break ;           
             /*
             default: // send key to Forms
                  if(  
                        (key == KeyEvent.VK_TAB) 
                     || (key >= KeyEvent.VK_F1 && key <= KeyEvent.VK_F24) 
                     || (e.isActionKey())
                    )
                  {
                      try
                       {
                         m_handler.setProperty(KEY_EVENT, e);
                         sendMessage( sSpinName, sCurrent ); 
                       }
                       catch ( Exception ex ){ err("Unable to send key to Forms");}                
                  }
               */
           }
           }
           public void keyReleased(KeyEvent e) {
           }
           public void keyTyped(KeyEvent e) {
           }
        };             
   }
   
   /*-----------------------------------------*
    *   create a MouseListener for the table
    *-----------------------------------------*/
   void setMouseListener()
   {
         ml = new MouseListener(){
          public void mouseClicked (MouseEvent me) 
          {
            int iButton = me.getButton() ;
            //err(sTableName+" button:"+iButton);
            iCurRow  = table.rowAtPoint(me.getPoint());
            iCurCell = table.columnAtPoint(me.getPoint());
            if(iButton==MouseEvent.BUTTON3 || (0==iButton)){
                // extend the panel
                if(bExtend){
                    if(!isExtended) {
                        // extend panel
                        xS = jp.getX();yS = jp.getY();wS = scrollPane.getWidth();hS = scrollPane.getHeight(); 
                        rSource = new Rectangle(xS,yS,wS,hS);
                        rTarget = new Rectangle(xP,yP,wP,hP);
                        bZoom = true ;
                        zoomPanel();
                        jp.setBounds(xP, yP, wP, hP);
                        if(!bTotalLine) {
                            table.setSize(new Dimension(wP, hP-jbl.getHeight()));
                            scrollPane.setSize(new Dimension(wP, hP-jbl.getHeight()));
                        }
                        else {
                            table.setSize(new Dimension(wP, hP-iTotalHeight-jbl.getHeight()));
                            scrollPane.setSize(new Dimension(wP, hP-iTotalHeight-jbl.getHeight()));
                            scrollPane2.setSize(jp.getWidth(),iTotalHeight);
                            tableT.setSize(jp.getWidth(),iTotalHeight);
                            scrollPane2.setLocation(scrollPane.getInsets().left,scrollPane.getHeight()+ jbl.getHeight()+1);    
                        }
                        // hide other tables
                        Iterator it = hTables.entrySet().iterator();
                        while (it.hasNext()) {
                           Map.Entry pairs = (Map.Entry)it.next();
                            if(! sTableName.equalsIgnoreCase((String)pairs.getKey())){
                                ((DynTable)pairs.getValue()).setVisible(false);
                            }
                        } 
                    }
                    else {
                        rSource = new Rectangle(xP,yP,wP,hP);
                        rTarget = new Rectangle(xS,yS,wS,hS);
                        bZoom = false ;
                        zoomPanel();    
                        jp.setBounds(rPanel);
                        table.setBounds(rTable);
                        scrollPane.setBounds(rTable);
                        if(bTotalLine) {
                            tableT.setBounds(rTable2);
                            scrollPane2.setBounds(rTable2);                        
                            scrollPane2.setLocation(scrollPane.getInsets().left,scrollPane.getHeight()+ jbl.getHeight()-1);
                        }
                        // show other tables
                        Iterator it = hTables.entrySet().iterator();
                        while (it.hasNext()) {
                           Map.Entry pairs = (Map.Entry)it.next();
                            if(! sTableName.equalsIgnoreCase((String)pairs.getKey())){
                                ((DynTable)pairs.getValue()).setVisible(true);
                            }
                        }                         
                    }                      
                    isExtended = !isExtended;
                    iTotalLines = (int)((scrollPane.getHeight() - table.getTableHeader().getBounds().height) / table.getRowHeight()) ;
                    jp.getParent().invalidate();
                    jp.invalidate();                  
                }
            } 
            else {
                if(me.getClickCount() > 1) {
                  // send multiple click event
                  SendMessage(DrawLAF.TBTRG_WMC, ""+iButton);
                  // image to display ?
                  if(coltypes[iCurCell].equalsIgnoreCase("IMAGE")) {
                      if(bImgMagnifier) displayFullSizeImage(iCurRow, iCurCell);
                  }    
                }
                else {
                  // send single click event
                  SendMessage(DrawLAF.TBTRG_WMC, ""+iButton);                       
                }
                SendMessage(DrawLAF.TBTRG_WNII, ""+(iCurCell+1)); 
            }
        
          }
          public void mouseEntered (MouseEvent me) {}
          public void mousePressed (MouseEvent me) {}
          public void mouseReleased (MouseEvent me) {} 
          public void mouseExited (MouseEvent me) {} 
        };     
   }   
   
   /*-----------------------*
    *  Get the properties
    *-----------------------*/
      //
      // get the current cell value
      //
      String getCellVal()
      {
        sCellValue = "" ;
        String sValue = "" ;
        log("GetCellVal:"+iCellPos);
        DateFormat df = new SimpleDateFormat(sDateFormat);
        DecimalFormat nf = new DecimalFormat(sNumFormat,DecimalSymbols);
        Double db = null ;
        if( (iRowPos > -1) && (iCellPos > -1) )
        {
          // stop cell edtiting
          if (table.isEditing())
          {
            table.getCellEditor().stopCellEditing();
          }            
          if(coltypes[table.convertColumnIndexToModel(iCellPos)].equalsIgnoreCase("DATE"))
          {
            Date d = (Date)model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(iCellPos));
            sValue += df.format(d);
          }
          else if(coltypes[table.convertColumnIndexToModel(iCellPos)].equalsIgnoreCase("NUMBER"))
          {
            Double f = (Double)model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(iCellPos));
            if(f == null) sValue += "null";
            else 
            {
              if(model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(iCellPos)) instanceof Long) db = Double.valueOf(model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(iCellPos)).toString());
              else db = (Double)model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(iCellPos)) ;
              sValue += nf.format(db);
            }  
          }
          else if(coltypes[table.convertColumnIndexToModel(iCellPos)].equalsIgnoreCase("CHECKBOX")){
            Object o = model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(iCellPos));
            boolean b = ((Boolean) o).booleanValue();  
            CellProp cp = (CellProp)hCellProps.get(colnames[table.convertColumnIndexToModel(iCellPos)]);
            if(cp != null) {
              if(b) sValue = cp.sCheck ;
              else  sValue = cp.sUnCheck ;
            }
          }
          else if( !coltypes[table.convertColumnIndexToModel(iCellPos)].equalsIgnoreCase("IMAGE")
                && !coltypes[table.convertColumnIndexToModel(iCellPos)].equalsIgnoreCase("CLOB"))
            sValue += model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(iCellPos)) ;          
          return "" + sValue ;    
        }  
        return "" ;
      }
      //
      // get the current row values
      //
      String getRowVal()
      {
        StringBuffer sb = new StringBuffer();
        DateFormat df = new SimpleDateFormat(sDateFormat);
        DecimalFormat nf = new DecimalFormat(sNumFormat,DecimalSymbols);
        Double db = null ;
        int it ;
        if( iRowPos > -1)
        {
          // stop cell edtiting
          if (table.isEditing())
          {
            table.getCellEditor().stopCellEditing();
          }  
          for( int i=0 ; i<table.getColumnCount(); i++ )
          {
            db = null ;
            colTab[table.convertColumnIndexToModel(i)] = "" ;              
            CellProp cp = getCellProp(table.convertColumnIndexToModel(i)) ;
            if( (i>0) && (!coltypes[table.convertColumnIndexToModel(i)].equalsIgnoreCase("IMAGE"))
                      && (!coltypes[table.convertColumnIndexToModel(i)].equalsIgnoreCase("CLOB"))) { 
               sb.append(separator);
               colTab[table.convertColumnIndexToModel(i)] += separator ;
            }      
            if(coltypes[table.convertColumnIndexToModel(i)].equalsIgnoreCase("DATE"))
            {
              if(cp.sFormat != null) df = new SimpleDateFormat(cp.sFormat);
              else df = new SimpleDateFormat(sDateFormat);
              if(model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)) == null) sb.append("null");
              else
              {                  
                Date d = (Date)model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)) ;
                colTab[table.convertColumnIndexToModel(i)] += df.format(d) ;
                sb.append(df.format(d));
              }  
            }
            else if(coltypes[table.convertColumnIndexToModel(i)].equalsIgnoreCase("INTEGER"))
            {
              if(cp.sFormat != null) nf = new DecimalFormat(cp.sFormat);
              else nf = new DecimalFormat(sNumFormat);
              if(model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)) == null || model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)).equals(" ")) sb.append("null");
              else 
              {
                if(model.getValueAt(table.convertRowIndexToModel(iRowPos), i) instanceof Integer) it = Integer.valueOf(model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)).toString());
                else it = (Integer)model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)) ;
                sb.append(nf.format(it));
                if(cp.sFormat != null) colTab[table.convertColumnIndexToModel(i)] += nf.format(it) ;
                else colTab[table.convertColumnIndexToModel(i)] += String.valueOf(it);
              }  
            }            
            else if(coltypes[table.convertColumnIndexToModel(i)].equalsIgnoreCase("NUMBER"))
            {
              if(cp.sFormat != null) nf = new DecimalFormat(cp.sFormat,DecimalSymbols);
              else nf = new DecimalFormat(sNumFormat,DecimalSymbols);
              if(model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)) == null || model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)).equals(" ")) sb.append("null");
              else 
              {
                if(model.getValueAt(table.convertRowIndexToModel(iRowPos), i) instanceof Long) db = Double.valueOf(model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)).toString());
                else db = (Double)model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)) ;
                sb.append(nf.format(db));
                colTab[table.convertColumnIndexToModel(i)] += nf.format(db) ;
              }  
            }
            else if(coltypes[table.convertColumnIndexToModel(i)].equalsIgnoreCase("CHECKBOX")){
              Object o = model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i));
              if(null == o) o = false;
              boolean b = ((Boolean) o).booleanValue();  
              if(cp != null) {
                if(b) { sb.append(cp.sCheck) ; colTab[table.convertColumnIndexToModel(i)] += cp.sCheck ;}
                else  { sb.append(cp.sUnCheck); colTab[table.convertColumnIndexToModel(i)] += cp.sUnCheck ;}
              }
            }            
            else if( !coltypes[table.convertColumnIndexToModel(i)].equalsIgnoreCase("IMAGE")
                 && (!coltypes[table.convertColumnIndexToModel(i)].equalsIgnoreCase("CLOB"))) { 
                sb.append(model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)));
                colTab[table.convertColumnIndexToModel(i)] += (String)model.getValueAt(table.convertRowIndexToModel(iRowPos), table.convertColumnIndexToModel(i)) ;
            }    
          }
        }
        sb = new StringBuffer();
        for( int i=0 ; i<table.getColumnCount(); i++ ) {
            sb.append(colTab[i]);
        }    
        log("GetRowVal("+iRowPos+"):"+sb.toString());
        return sb.toString();
      }
      //
      // get the total cell value
      //
      String getTotalCellVal()
      {
        if(! bTotalLine) return "" ;
        sCellValue = "" ;
        String sValue = "" ;
        String sVal = null ;
        log("GetTotalCellVal:"+iCellPos);
        Double db = null ;
        Long   lg = null ;
        if( iCellPos > -1 )
        {
            if(tableT.getModel().getValueAt(0, tableT.convertColumnIndexToModel(iCellPos)) != null) 
            {              
              sVal = tableT.getModel().getValueAt(0, tableT.convertColumnIndexToModel(iCellPos)).toString();
              if(tableT.getModel().getValueAt(0, tableT.convertColumnIndexToModel(iCellPos)) instanceof Long) {
                db = Double.valueOf(tableT.getModel().getValueAt(0, tableT.convertColumnIndexToModel(iCellPos)).toString());
                sValue += sVal;
              }      
              else if(tableT.getModel().getValueAt(0, tableT.convertColumnIndexToModel(iCellPos)) instanceof Integer) { 
                lg = Long.valueOf(tableT.getModel().getValueAt(0, tableT.convertColumnIndexToModel(iCellPos)).toString());
                sValue += sVal;
              }
              else { 
                db = (Double)tableT.getModel().getValueAt(0, tableT.convertColumnIndexToModel(iCellPos)) ;
                sValue += sVal;
              }
            }            
          return "" + sValue ;    
        }  
        return "" ;
      }      
      
      //
      // get the name of current column
      //
      String getCellName()
      {          
          return colnames[table.convertColumnIndexToModel(iCurCell)];
      }  
      //
      // get count for insert, update and delete rows
      //
      String getCountInsert()
      {          
          return "" + iNbInsert;
      }
      String getCountUpdate()
      {          
          return "" + iNbUpdate;
      }        
      String getCountDelete()
      {          
          return "" + iNbDelete;
      }
      String getCountChanges()
      {          
          return "" + (iNbInsert+iNbUpdate+iNbDelete);
      }                    
      
      //
      // get the list of updated rows
      //
      String getRowsChanged()
      {
        // stop cell edtiting
        if (table.isEditing())
        {
          table.getCellEditor().stopCellEditing();
        }  
        boolean bFirst = true ;
        StringBuffer sb = new StringBuffer();
        Iterator it = hRowsChanged.entrySet().iterator();
        while (it.hasNext()) {
           Map.Entry pairs = (Map.Entry)it.next();
           if(bFirst) {bFirst=false ;sb.append(""+pairs.getKey());}
           else sb.append(","+pairs.getKey());
        } 
        log("getRowsChanged():"+sb.toString());        
        return sb.toString() ;
      }
      
      //
      // get the list of inserted rows
      //
      String getRowsInserted()
      {
        // stop cell edtiting
        if (table.isEditing())
        {
          table.getCellEditor().stopCellEditing();
        }  
        boolean bFirst = true ;
        StringBuffer sb = new StringBuffer();
        for(int i=0; i < table.getRowCount();i++) {
            if(null == model.getValueAt(table.convertRowIndexToModel(i), table.convertColumnIndexToModel(0))) {
                if(bFirst) {bFirst=false ;sb.append(""+(i+1));}
                else sb.append(","+(i+1));
            }
        }
        log("getRowsInserted():"+sb.toString());        
        return sb.toString() ;
      } 
      
      //
      // get the list of deleted rows
      //
      String getRowsDeleted()
      {
        // stop cell edtiting
        if (table.isEditing())
        {
          table.getCellEditor().stopCellEditing();
        }  
        boolean bFirst = true ;
        StringBuffer sb = new StringBuffer();
        Iterator it = hRowsDeleted.entrySet().iterator();
        while (it.hasNext()) {
           Map.Entry pairs = (Map.Entry)it.next();
           if(bFirst) {bFirst=false ;sb.append(""+pairs.getKey());}
           else sb.append(","+pairs.getKey());
        }       
        log("getRowsDeleted():"+sb.toString());        
        return sb.toString() ;
      }      


  /*----------------------------------------*
   *  Make a color from a RGB string
   *  Color c = makeColor( "r128g25b100" ); 
   *----------------------------------------*/
  public Color getColor(String s)
  {
    String HEX_PATTERN = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$";
    int r=-1, g=-1, b=-1 ;
    String sR = "255" ;
    int iR=255, iG=255, iB=255 ;
    Color c = Color.white ;
    if(s.startsWith("#")) {
        boolean bool = Pattern.matches(HEX_PATTERN, s);
        if (bool) {
            // get the hexa color
            sR = s.replaceFirst("#","");
            if(sR.length()==3) sR += sR ;
            try
            {
              int intValue = Integer.parseInt( sR,16);
              c = new Color( intValue );
            }
            catch (Exception e){ }
        }        
    }
    else {
        r = s.indexOf("r") ;
        g = s.indexOf("g") ;
        b = s.indexOf("b") ;
        if( r>-1 && g>-1 && b>-1 ){
          iR = Integer.parseInt(s.substring(r+1,g)) ;
          iG = Integer.parseInt(s.substring(g+1,b)) ;
          iB = Integer.parseInt(s.substring(b+1)) ;
          try{
            c = new Color(iR,iG,iB) ;
          }
          catch( Exception e) {} ;
        }
        else{
            r = -1;
            g = -1;
            b = -1;
            StringTokenizer st = new StringTokenizer(s, ",");
            try{
                r = Integer.parseInt(st.nextToken());
                g = Integer.parseInt(st.nextToken());
                b = Integer.parseInt(st.nextToken());
                c = new Color(r, g, b);
            }
            catch(Exception e){}
        }
    }
    return c ;
  }

  void clearRefresh() {
        data = new Object[0][0] ;
        dataT = new Object[1][0] ;  
        iNbRows = 0; iNbCols = 0 ;
        iCurLine = 0 ;
        iRowPos = iCellPos = 0 ;
        iCurCell = iCurRow = 0 ; 
        colnames = new String[0] ;
        colnamesT = new String[0] ;      
        coltypes = new String[0] ;
        colTab = new String[0] ;
        iColWidth = new int[0] ;  
        images = new Image[0][0] ;
  }
  
    /*----------------------*
     *  reset the variables
     *----------------------*/
    public void raz()
    {
        log("*** raz ***");
        xF=10; yF=10; wF=500; hF=100 ;
        iNbRows = 0; iNbCols = 0 ;
        iCurLine = 0 ;
        iRowPos = iCellPos = 0 ;
        iCurCell = iCurRow = 0 ;
        sTitle = "" ; separator = "^" ;
        HeadBGColor =  HeadFGColor = DataBGColor=  DataFGColor =  GridColor = null ;
        bSeperateFrame = false ;
        bTotalLine = false ;
        if(tableT != null) tableT = null ;
        if(scrollPane2 != null) scrollPane2 = null ;
        hRowsChanged = new HashMap();
        hRowsDeleted = new HashMap();
        iNbInsert = 0 ;
        iNbUpdate = 0;
        iNbDelete = 0 ;
        colnames = new String[0] ;
        colnamesT = new String[0] ;      
        coltypes = new String[0] ;
        colTab = new String[0] ;
        iColWidth = new int[0] ;
        fColFont  = new Font[0] ;
        data = new Object[0][0] ;
        dataT = new Object[1][0] ; 
        images = new Image[0][0];
        System.gc();
        this.setLayout(null);
        this.setBackground(cTableBG);
        jbl = new JLabel();
        table = new JTable(model);
        table.setName("TABLE");
        table.setAutoResizeMode(table.AUTO_RESIZE_OFF);
        table.setAutoCreateColumnsFromModel(true);        
        table.setSelectionBackground(SelBGColor);
        table.setSelectionForeground(SelFGColor);
        table.setFillsViewportHeight(true);
        listSelectionModel = table.getSelectionModel();
        listSelectionModel.addListSelectionListener(new SharedListSelectionHandler());
        table.setSelectionModel(listSelectionModel);
        scrollPane = new JScrollPane(table);   
        scrollPane.getViewport().setBackground(cTableBG);
        this.add(jbl);
        this.add(scrollPane);
    }


 /*---------------------------------------
  *  TableModel class to allow updates
  *--------------------------------------*/
 class MyTableModel extends AbstractTableModel {

        private static final long serialVersionUID = 4690151811471029412L;
        private String[] columnNames = {" "};
        private transient Object[][] datas = { { " ", " " } };
        
        public MyTableModel()
        {
          super();
        }
        
        public MyTableModel(Object[][] dataVector,Object[] columnIdentifiers)
        {
            super();
            columnNames = (String[])columnIdentifiers ;
            datas = dataVector;
        }
        
        public int getColumnCount() {
            return columnNames.length;
        }

        public int getRowCount() {
            if (datas != null) return datas.length;
            else return 0;
        }

        public String getColumnName(int col) {
            return columnNames[col];
        }

        public Object getValueAt(int row, int col) {
            return datas[row][col];
        }
        
        public void setDataVector(Object[][] dataVector,
                          Object[] columnIdentifiers) {
            columnNames = (String[])columnIdentifiers ;
            datas = dataVector;
            fireTableDataChanged();
        }

        public Class getColumnClass(int c) {
            Object o = getValueAt(0, c);
            if(o == null) {
                if("INTEGER".equalsIgnoreCase(coltypes[c])) return Integer.class;
                else if("DATE".equalsIgnoreCase(coltypes[c])) return Date.class;
                else return Double.class;
            }
            return o.getClass();
        }

        public boolean isCellEditable(int row, int col) {
            String sCol= colnames[col].toUpperCase();
            CellProp cp = (CellProp)hCellInstProps.get("R"+(row+1)+sCol);
            if (null != cp) {
                if (!bUpdate || "IMAGE".equalsIgnoreCase(coltypes[col])
                             || !cp.bEnabled) {
                    return false;
                } else {
                    return true;
                }
            }
            else {
                cp = (CellProp)hCellProps.get(colnames[col]);
                if (!bUpdate || "IMAGE".equalsIgnoreCase(coltypes[col])
                             || !cp.bEnabled) {
                    return false;
                } else {
                    return true;
                }
            }
        }

        public void setValueAt(Object value, int row, int col) {
            datas[row][col] = value;
            if(bUpdate) {
                String s = (String)hRowsChanged.get(datas[row][0]);            
                if((null != datas[row][0]) && (null == s) && (col > 0)) {
                    hRowsChanged.put(datas[row][0],datas[row][0]);
                    iNbUpdate++;
                }
            }
            fireTableCellUpdated(row, col);
            SendMessage(DrawLAF.TBTABLE_CHANGE, ""+(row+1)+","+(col+1));
        }
        
        public void addRow(){
            if(!bInsert) return ;
            Object[][] dataTmp = new Object[iNbRows+1][iNbCols] ;
            for (int i=0; i< iNbRows;i++){
                for (int j=0; j< iNbCols;j++){
                    dataTmp[i][j] = datas[i][j];
                }
            }
            datas = dataTmp;
            iNbRows++;  
            iNbInsert++;
            fireTableDataChanged();
        }
        
        public void delRow(int row){
            if(!bDelete) return ;
            if(null != datas[row][0]) {
                hRowsDeleted.put(datas[row][0],datas[row][0]);
                fireTableDataChanged();
            }
            Object[][] dataTmp = new Object[iNbRows-1][iNbCols] ;
            int k = 0 ;
            for (int i=0; i< iNbRows;i++){
                if(row != i) {
                    for (int j=0; j< iNbCols;j++){
                        dataTmp[k][j] = datas[i][j];
                    }
                    k++;
                }
            }
            datas = dataTmp;
            iNbRows--; 
            iNbDelete++;
            table.changeSelection(row, 0, false, false);
        }        
       
        
        private void printDebugData() {
            int numRows = getRowCount();
            int numCols = getColumnCount();

            for (int i=0; i < numRows; i++) {
                System.out.println("    row " + i + ":");
                for (int j=0; j < numCols; j++) {
                    System.out.println("  " + data[i][j]);
                }
                System.out.println("");
            }
            System.out.println("--------------------------");
        }

    }

  private void totalize(TableModel ml,TableModel mlt) {
    if (ml == null || (!bTotalLine)) return;
    int j = 0 ;
    double total = 0.0;
    double d = 0.0 ;
    boolean bFirst = true ;
    int x = 0 ;
    int iTot[] = new int[iNbCols] ;
    double res[] = new double[iNbCols] ;
    for (j=1; j<iNbCols; j++) {res[j] = 0.0 ;iTot[j] = 0 ;}
    String op=null;
    for (int i=0;i<data.length;i++) {
        if(table.getRowSorter().convertRowIndexToView(i) > -1)
        {    
        for (j=1; j<iNbCols; j++) {
            op = (String)hFormulas.get(colnames[j].toUpperCase());
            if(op != null && (ml.getValueAt(i,j)!= null)) {
                iTot[j]++;
                try{
                  if((op.equalsIgnoreCase("SUM"))
                  || (op.equalsIgnoreCase("AVG"))) {
                    if(ml.getValueAt(i,j) instanceof Double)
                      res[j] += ((Double)ml.getValueAt(i,j)).doubleValue();
                    else
                      res[j] += (Integer)ml.getValueAt(i,j) ;
                  }
                  else if( op.equalsIgnoreCase("MIN")) {
                      if(ml.getValueAt(i,j) instanceof Double) {
                        d = ((Double)ml.getValueAt(i,j)).doubleValue();
                        if(bFirst) {res[j] = d ; bFirst = false; }
                        else if(d<res[j]) res[j] = d ;                    
                      }
                      else {
                        x = (Integer)ml.getValueAt(i,j) ;
                          if(bFirst) {res[j] = x ; bFirst = false; }
                        else if(x<res[j]) res[j] = x ;  
                      }
                    }
                  else if( op.equalsIgnoreCase("MAX")) {
                    if(ml.getValueAt(i,j) instanceof Double) {
                      d = ((Double)ml.getValueAt(i,j)).doubleValue();
                        if(bFirst) {res[j] = d ; bFirst = false; }
                      else if(d>res[j]) res[j] = d ;                    
                    }
                    else {
                      x = (Integer)ml.getValueAt(i,j) ;
                        if(bFirst) {res[j] = x ; bFirst = false; }
                      else if(x>res[j]) res[j] = x ;                      
                    }
                  }
                  else if( op.equalsIgnoreCase("COUNT")) 
                      res[j]++;
                }catch(Exception ex){ex.printStackTrace();}              
            }
         }  
        }
    }
    for (j=1; j<iNbCols; j++) {
      if(iTot[j]==0) iTot[j] = 1 ;
      op = (String)hFormulas.get(colnames[j].toUpperCase());
      if(op != null && (!coltypes[j].equalsIgnoreCase("IMAGE"))) {
         if(op.equalsIgnoreCase("AVG")) total = (double)(res[j] / iTot[j]);         
         else  total = res[j];        
         if(op.equalsIgnoreCase("COUNT"))
            mlt.setValueAt((int)total,0,j);
         else
            mlt.setValueAt(new Double(total),0,j);
      }  
    }
  }

    
  void log(String sMessage)
  {
    if(bLog) System.out.println("- LAF DynTable "+ sMessage);
  }

    // image cell renderer
    class ImageTableRenderer extends DefaultTableCellRenderer {

        @SuppressWarnings("compatibility:-316842800074410581")
        private static final long serialVersionUID = 1L;

        public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected,
                                                       boolean hasFocus, int row, int column) {
            if (hasFocus) {
                setBorder(UIManager.getBorder("Table.focusCellHighlightBorder"));
                if (table.isCellEditable(row, column)) {
                    setForeground(UIManager.getColor("Table.focusCellForeground"));
                    setBackground(UIManager.getColor("Table.focusCellBackground"));
                }
            } else {
                setBorder(BorderFactory.createEmptyBorder());
            }
            if (isSelected) {
                super.setForeground(table.getSelectionForeground());
                super.setBackground(table.getSelectionBackground());
	    }
            else {
                super.setBackground(Color.white);
            }
            ImageIcon icon = (ImageIcon)value;
            if (null != icon) {
                TableColumn tabcol = table.getColumnModel().getColumn(column);
                CellProp cp = (CellProp)hCellProps.get(colnames[column]);
                ImageIcon ic = getScaledIcon(images[table.convertRowIndexToModel(row)][table.convertColumnIndexToModel(column)], cp, tabcol);
                //ImageIcon ic = getScaledIcon(images[row][column], cp, tabcol);
                if (ic != null) {
                    setIcon(ic);
                    setHorizontalAlignment(SwingConstants.LEFT);
                    setVerticalAlignment(SwingConstants.TOP);
                }
            }
            return this;
        }
    }

  
  /*---------------------------
   *  set the Integer renderer
   *-------------------------*/  
  class IntegerRenderer extends DefaultTableCellRenderer {
        NumberFormat nf = NumberFormat.getInstance();
      String sFormat = sIntFormat ;
      String sColName = null ;
      Font f = null ;
      
      public IntegerRenderer() { super(); }
      
      public IntegerRenderer(String sFormat) 
      { 
        super(); 
        this.sFormat = sFormat;
      }
      
      public IntegerRenderer(String sFormat, String sCol) 
      { 
        super(); 
        this.sFormat = sFormat;
        this.sColName = sCol ;
      }      
  
      public void setValue(Object value) {
          String s = "" ;
          setHorizontalAlignment(RIGHT);
          if (sFormat.equalsIgnoreCase("")) {
              s = (value == null) ? "" : value.toString() ;
          }
          else
          {
             nf = new DecimalFormat(sFormat);
             s = (value == null) ? "" : nf.format(value) ;
          }   
          setText((value == null) ? "" : s);
      } 
      
        public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected,
                                                       boolean hasFocus, int row, int column) {
            String sCol= colnames[column].toUpperCase();
            if (hasFocus) {
                setBorder(UIManager.getBorder("Table.focusCellHighlightBorder"));
                if (table.isCellEditable(row, column)) {
                    setForeground(UIManager.getColor("Table.focusCellForeground"));
                    setBackground(UIManager.getColor("Table.focusCellBackground"));
                }
            } else {
                setBorder(BorderFactory.createEmptyBorder());
            }
            setText((value == null) ? "" : value.toString());
            if (isSelected) {
                super.setForeground(table.getSelectionForeground());
                super.setBackground(table.getSelectionBackground());
	    } else {
                CellProp cp = (CellProp)hCellInstProps.get("R"+(row+1)+sCol);
                if (null != cp) {
                    if (cp.cBack != null)
                        setBackground(cp.cBack);
                    if (cp.cFore != null)
                        setForeground(cp.cFore);
                    if (cp.fFont != null)
                        setFont(cp.fFont);
                }
                else {
                    cp = (CellProp)hCellProps.get(sColName);
                    if (cp != null) {
                        if (cp.cBack != null)
                            setBackground(cp.cBack);
                        if (cp.cFore != null)
                            setForeground(cp.cFore);
                        if (cp.fFont != null)
                            setFont(cp.fFont);
                    }
                }
            }
            if(table.getName().equals("TOTAL")) {
                setBackground(cTotalBG);
                setForeground(cTotalFG);
            }
            return this;
        }      
      
  }

    /*---------------------------
     *  set the Char renderer
     *-------------------------*/  
    class CharRenderer extends DefaultTableCellRenderer {
        String sFormat = sIntFormat ;
        String sColName = null ;
        Font f = null ;
        
        public CharRenderer() { super(); }
        
        public CharRenderer(String sCol) 
        { 
          super(); 
          this.sColName = sCol ;
        }

        public void setValue(Object value) {
            String s = "" ;
            setHorizontalAlignment(LEFT);
            if(sColName != null)
            {
              CellProp cp = (CellProp)hCellProps.get(sColName);
              if(cp != null)
              {
                if(cp.cBack != null) setBackground(cp.cBack);
                if(cp.cFore != null) setForeground(cp.cFore);
                if(cp.iAlign != -1)  setHorizontalAlignment(cp.iAlign);
                if(cp.fFont != null) setFont(cp.fFont);
              }
              else{err("--> CharRenderer.setValue "+sColName+" cp not found ***");}
            }
            else{err("--> CharRenderer.setValue : sColName = NULL ***");}
            s = (value == null) ? "" : value.toString() ;
            setText((value == null) ? "" : s);
        }
        
        public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected,
                                                       boolean hasFocus, int row, int column) {

            String sCol= colnames[column].toUpperCase();
            if (hasFocus) {
                setBorder(UIManager.getBorder("Table.focusCellHighlightBorder"));
                if (table.isCellEditable(row, column)) {
                    setForeground(UIManager.getColor("Table.focusCellForeground"));
                    setBackground(UIManager.getColor("Table.focusCellBackground"));
                }
            } else {
                setBorder(BorderFactory.createEmptyBorder());
            }
            setText((value == null) ? "" : value.toString());
            if (isSelected) {
                super.setForeground(table.getSelectionForeground());
                super.setBackground(table.getSelectionBackground());
	    } else {
                CellProp cp = (CellProp)hCellInstProps.get("R"+(row+1)+sCol);
                if (null != cp) {
                    if (cp.cBack != null)
                        setBackground(cp.cBack);
                    if (cp.cFore != null)
                        setForeground(cp.cFore);
                    if (cp.fFont != null)
                        setFont(cp.fFont);
                }
                else {
                    cp = (CellProp)hCellProps.get(sColName);
                    if (cp != null) {
                        if (cp.cBack != null)
                            setBackground(cp.cBack);
                        if (cp.cFore != null)
                            setForeground(cp.cFore);
                        if (cp.fFont != null)
                            setFont(cp.fFont);
                    }
                }
            }
            if(table.getName().equals("TOTAL")) {
                setBackground(cTotalBG);
                setForeground(cTotalFG);
            }
            return this;
        }             
        
    }
    /*---------------------------
     *  set the CLOB renderer
     *-------------------------*/
    class CLOBRenderer extends JTextArea implements TableCellRenderer {
        JScrollPane scrollPane;
        JTextArea textArea;
        String sColName = null;

        public CLOBRenderer(String sCol) {
            setBackground(Color.white);
            setFont(new Font("Arial", Font.PLAIN, 12));
            setLineWrap(true);
            setBorder(BorderFactory.createEmptyBorder());
            setWrapStyleWord(true);
            textArea = (JTextArea)this;
            scrollPane = new JScrollPane(this);
            scrollPane.getViewport().setBackground(Color.white);
            scrollPane.setBorder(BorderFactory.createLineBorder(Color.BLACK, 0));
            this.sColName = sCol;
        }

        public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected,
                                                       boolean hasFocus, int row, int column) {

            String sCol= colnames[column].toUpperCase();
            boolean bFound = false ;
            if (hasFocus) {
                setBorder(UIManager.getBorder("Table.focusCellHighlightBorder"));
                if (table.isCellEditable(row, column)) {
                    setForeground(UIManager.getColor("Table.focusCellForeground"));
                    setBackground(UIManager.getColor("Table.focusCellBackground"));
                }
            } else {
                setBorder(BorderFactory.createEmptyBorder());
            }
            setText((value == null) ? "" : value.toString());
            this.setCaretPosition(0);
            if (sColName != null) {
            CellProp cp = (CellProp)hCellInstProps.get("R"+(row+1)+sCol);
            if (null != cp) {
                bFound = true ;
                if (cp.cBack != null)
                    setBackground(cp.cBack);
                if (cp.cFore != null)
                    setForeground(cp.cFore);
                if (cp.fFont != null)
                    setFont(cp.fFont);
            }
            else {
                cp = (CellProp)hCellProps.get(sColName);
                if (cp != null) {
                    if(!bFound) {
                        if (cp.cBack != null)
                            setBackground(cp.cBack);
                        if (cp.cFore != null)
                            setForeground(cp.cFore);
                        if (cp.fFont != null)
                            setFont(cp.fFont);
                    }
                    if (!bEditExtend) {
                        scrollPane.setHorizontalScrollBarPolicy(cp.iScrollH);
                        scrollPane.setVerticalScrollBarPolicy(cp.iScrollV);
                    }
                } else {
                    err("--> CLOBRenderer.setValue " + sColName + " cp not found ***");
                }
            }
            } else {
                err("--> CLOBRenderer.setValue : sColName = NULL ***");
            }
            if (bEditExtend) {
                scrollPane.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
                scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_NEVER);
            }
            if (isSelected) {
                setForeground(table.getSelectionForeground());
                setBackground(table.getSelectionBackground());
	    }
            if(table.getName().equals("TOTAL")) {
                setBackground(cTotalBG);
                setForeground(cTotalFG);
            }
            return scrollPane;
        }
    }

    //
    // CLOB Editor
    //
    class CLOBEditor extends JTextArea implements TableCellEditor, ActionListener   
    {
        JTextArea textArea;  
        //JTextArea jt;
        JScrollPane scrollPane;
        JScrollPane sp;
        String sColName = null ;
        JPanel jpn = new JPanel(new BorderLayout());
        transient protected ChangeEvent changeEvent = null;
        // undo
        final UndoManager undo = new UndoManager();
       
        public CLOBEditor(String sCol)  
        {  
            sColName = sCol;
            setBackground(Color.white);
            setFont(new Font("Arial",Font.PLAIN,12));
            scrollPane = new JScrollPane(this);  
            scrollPane.getViewport().setBackground(Color.white);
            setLineWrap(true);
            setWrapStyleWord(true);              
        }  
       
        public Component getTableCellEditorComponent(JTable table,  
                                                     Object value,  
                                                     boolean isSelected,  
                                                     int row, int column)  
        {  
            boolean bFound = false;
            setText((value == null) ? "" : value.toString());
            SendMessage(DrawLAF.TBTRG_WNII, ""+(column+1)); 
            if(sColName != null)
            {
              String sCol= colnames[column].toUpperCase();
              CellProp cp = (CellProp)hCellInstProps.get("R"+(row+1)+sCol);
              if (null != cp) {
                bFound = true;
                if(cp.cBack != null) setBackground(cp.cBack);
                if(cp.cFore != null) setForeground(cp.cFore);
                if(cp.fFont != null) setFont(cp.fFont);              
              }
              else {
                  cp = (CellProp)hCellProps.get(sColName);
                  if(cp != null)
                  {
                    if(!bFound) {
                        if(cp.cBack != null) setBackground(cp.cBack);
                        if(cp.cFore != null) setForeground(cp.cFore);
                        if(cp.fFont != null) setFont(cp.fFont);
                    }
                    scrollPane.setHorizontalScrollBarPolicy(cp.iScrollH); 
                    scrollPane.setVerticalScrollBarPolicy(cp.iScrollV);
                    if(bEditExtend) {
                        // Text editor panel
                        scrollPane.setVisible(false);
                        jpn = new JPanel(new BorderLayout());
                        jpn.setBorder(BorderFactory.createRaisedBevelBorder());
                        int w = jp.getParent().getWidth() - 40 ;
                        int h = jp.getParent().getHeight() - 40 ;
                        jpn.setSize(w,h);
                        jpn.setLocation(20, 20);
                        jtCLOB = new JTextArea(value.toString());
                        // undo managment
                        Document doc = jtCLOB.getDocument();
                        // Listen for undo and redo events
                        doc.addUndoableEditListener(new UndoableEditListener() {
                            public void undoableEditHappened(UndoableEditEvent evt) {
                                undo.addEdit(evt.getEdit());
                            }
                        });                    
                        // Create an undo action and add it to the text component
                        jtCLOB.getActionMap().put("Undo",
                            new AbstractAction("Undo") {
                                public void actionPerformed(ActionEvent evt) {
                                    try {
                                        if (undo.canUndo()) {
                                            undo.undo();
                                        }
                                    } catch (CannotUndoException e) {
                                    }
                                }
                           });
                        // Bind the undo action to ctl-Z
                        jtCLOB.getInputMap().put(KeyStroke.getKeyStroke("control Z"), "Undo");
                        // Create a redo action and add it to the text component
                        jtCLOB.getActionMap().put("Redo",
                            new AbstractAction("Redo") {
                                public void actionPerformed(ActionEvent evt) {
                                    try {
                                        if (undo.canRedo()) {
                                            undo.redo();
                                        }
                                    } catch (CannotRedoException e) {
                                    }
                                }
                            });
                        // Bind the redo action to ctl-Y
                        jtCLOB.getInputMap().put(KeyStroke.getKeyStroke("control Y"), "Redo");
                        // end undo
                        // find box
                        hilit = new DefaultHighlighter();
                        painter = new DefaultHighlighter.DefaultHighlightPainter(hilit_color);
                        jtCLOB.setHighlighter(hilit);
                        jtCLOB.getInputMap().put(KeyStroke.getKeyStroke("control F"), FIND_ACTION);
                        jtCLOB.getActionMap().put(FIND_ACTION, new SearchAction());        
                        jtCLOB.getInputMap().put(KeyStroke.getKeyStroke("ESCAPE"), CANCEL_ACTION);
                        jtCLOB.getActionMap().put(CANCEL_ACTION, new CancelAction());        
                        jtCLOB.getInputMap().put(KeyStroke.getKeyStroke("F3"), NEXT_ACTION);
                        jtCLOB.getActionMap().put(NEXT_ACTION, new NextAction());   
                        jtCLOB.setBackground(new Color(214,225,234));
                        jtCLOB.setFont(new Font("Arial",Font.PLAIN,12));
                        sp = new JScrollPane(jtCLOB);  
                        sp.getViewport().setBackground(jtCLOB.getBackground());            
                        sp.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED); 
                        sp.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);               
                        sp.setPreferredSize(new Dimension(w, h-30));
                        sp.setBorder(BorderFactory.createLineBorder(new Color(102,129,236), 2));
                        jpn.add(sp,BorderLayout.PAGE_START);
                        // buttons' bar
                        JButton jb = new JButton(sExtClose);
                        jb.setPreferredSize(new Dimension((int)(w*.45), 30));
                        jb.setFont(jb.getFont().deriveFont(Font.BOLD));
                        jb.addActionListener(this);
                        jpn.add(jb,BorderLayout.LINE_START);                    
                        jb = new JButton(sExtCancel);
                        jb.setPreferredSize(new Dimension((int)(w*.4), 30));
                        jb.addActionListener(this);                    
                        jpn.add(jb,BorderLayout.CENTER);
                        jb = new JButton(sExtWrap);
                        jb.setPreferredSize(new Dimension((int)(w*.15), 30));
                        jb.addActionListener(this);     
                        jpn.add(jb,BorderLayout.LINE_END);
                        jp.getParent().add(jpn,0);
                        jtCLOB.requestFocus();
                    }
                  }
                  else{err("--> CLOBEditor.setValue "+sColName+" cp not found ***");}
                }
            }
            else{err("--> CLOBEditor.setValue : sColName = NULL ***");}
            
            return scrollPane;
        }  
        
        public void actionPerformed(ActionEvent e) {
            if (e.getActionCommand().equals(sExtClose)) {
                jp.getParent().remove(jpn);
                jpn=null;
                setText(jtCLOB.getText());
                scrollPane.setVisible(true);
                scrollPane.repaint();
            }
            else if (e.getActionCommand().equals(sExtCancel)) {
                jp.getParent().remove(jpn);
                jpn=null;
                scrollPane.setVisible(true);
                scrollPane.repaint();
            }            
            else {
                jtCLOB.setLineWrap(!jtCLOB.getLineWrap());
            }
        }        
       
        public Object getCellEditorValue() {
            return getText();
        }
     
        public boolean isCellEditable(EventObject anEvent) {
            return true;
        }
     
        public boolean shouldSelectCell(EventObject anEvent) {
            return true;
        }
     
        public boolean stopCellEditing() {
            fireEditingStopped();
            return true;
        }
     
        public void cancelCellEditing() {
            return ;
        }
     
        public void addCellEditorListener(CellEditorListener l) {
            listenerList.add(CellEditorListener.class, l);
     
        }
     
        public void removeCellEditorListener(CellEditorListener l) {
            listenerList.remove(CellEditorListener.class, l);
        }
     
        protected void fireEditingStopped() {
            Object[] listeners = listenerList.getListenerList();
            for (int i = listeners.length - 2; i >= 0; i -= 2) {
                if (listeners[i] == CellEditorListener.class) {
                    if (changeEvent == null) {
                        changeEvent = new ChangeEvent(this);
                    }
                    ((CellEditorListener) listeners[i + 1]).editingStopped(changeEvent);
                }
            }
        }
    
    } 
    
    // seach a string in BIG text and highlight token found
    public void search() {
        hilit.removeAllHighlights();
        
        String s = sTextSearch;
        if (s.length() <= 0) {
            log("Nothing to search");
            return;
        }
        
        String content = jtCLOB.getText();
        int index = content.indexOf(s, iSearchStart);
        if (index >= 0) {   // match found
            try {
                int end = index + s.length();
                iSearchStart = end ;
                hilit.addHighlight(index, end, painter);
                jtCLOB.setCaretPosition(end);
                log("'" + s + "' found. Press F3 to search next or ESC to stop");
            } catch (BadLocationException e) {
                e.printStackTrace();
            }
        } else {
            iSearchStart = 0;
        }
    }        
    
    class SearchAction extends AbstractAction {
        private static final long serialVersionUID = -8079539929983397769L;

        public void actionPerformed(ActionEvent ev) {
            // input dialog box
            dBean.setProperty(DrawLAF.pInputDialog, sFindTitle + "," + sFindMsg + ",false,-1,-1,300");
            sTextSearch = (String)dBean.getProperty(DrawLAF.pDialogGetString);
            if(sTextSearch.length()>0) {
                search();
            }
        }
    }    
    
    // stop higlighting on search
    class CancelAction extends AbstractAction {
        private static final long serialVersionUID = 6797131044624782228L;

        public void actionPerformed(ActionEvent ev) {
            hilit.removeAllHighlights();
        }
    }
    // search next token
    class NextAction extends AbstractAction {
        private static final long serialVersionUID = 7691313103294824531L;

        public void actionPerformed(ActionEvent ev) {
            search();
        }
    }         
    
    class NULLImageRenderer extends DefaultTableCellRenderer {

        @SuppressWarnings("compatibility:-5702170905333581226")
        private static final long serialVersionUID = 6171369645269755930L;
        String sColName = null ;
        public NULLImageRenderer() { super(); }
        
        public NULLImageRenderer(String sCol) 
        { 
          super(); 
          this.sColName = sCol ;
        }

        public void setValue(Object value) {
            setIcon(null);
            setText(null);
        }
        
    }    
    
  /*-----------------------------------
   *  Class to render a list values
   *----------------------------------*/ 
    class ComboRowEditor implements TableCellEditor {
      protected Hashtable editors;
    
      protected TableCellEditor editor, defaultEditor;
    
      JTable table;
    
      public ComboRowEditor(JTable table) {
        this.table = table;
        editors = new Hashtable();
        defaultEditor = new DefaultCellEditor(new JTextField());
      }
    
      public void setEditorAt(int row, TableCellEditor editor) {
        editors.put(new Integer(row), editor);
      }
    
      public Component getTableCellEditorComponent(JTable table, Object value,
          boolean isSelected, int row, int column) {
        return editor.getTableCellEditorComponent(table, value, isSelected,
            row, column);
      }
    
      public Object getCellEditorValue() {
        return editor.getCellEditorValue();
      }
    
      public boolean stopCellEditing() {
        return editor.stopCellEditing();
      }
    
      public void cancelCellEditing() {
        editor.cancelCellEditing();
      }
    
      public boolean isCellEditable(EventObject anEvent) {
        if (anEvent instanceof java.awt.event.MouseEvent) {
            selectEditor((MouseEvent) anEvent);
        }
        if(null != editor) return editor.isCellEditable(anEvent);
        else return true;
      }
      
        public boolean isCellEditable(EventObject anEvent,int row, int col) {
            if (anEvent instanceof java.awt.event.MouseEvent) {
                selectEditor((MouseEvent) anEvent);
            }
            String sCol= colnames[col].toUpperCase();
            CellProp cp = (CellProp)hCellInstProps.get("R"+(row+1)+sCol);
            if (null != cp) {
                if (!bUpdate || !cp.bEnabled) {
                    return false;
                } else {
                    if(null != editor) return editor.isCellEditable(anEvent);
                }            
            }
            else {
                cp = (CellProp)hCellProps.get(colnames[col]);
                if (!bUpdate || !cp.bEnabled) {
                    return false;
                } else {
                    if(null != editor) return editor.isCellEditable(anEvent);
                }
            }
            return true;
        }      
    
      public void addCellEditorListener(CellEditorListener l) {
        editor.addCellEditorListener(l);
      }
    
      public void removeCellEditorListener(CellEditorListener l) {
        editor.removeCellEditorListener(l);
      }
    
      public boolean shouldSelectCell(EventObject anEvent) {
        if (anEvent instanceof java.awt.event.MouseEvent) {
            selectEditor((MouseEvent) anEvent);
        }
        return editor.shouldSelectCell(anEvent);
      }
    
      protected void selectEditor(MouseEvent e) {
        int row;
        if (e == null) {
          row = table.getSelectionModel().getAnchorSelectionIndex();
        } else {
          row = table.rowAtPoint(e.getPoint());
        }
        editor = (TableCellEditor) editors.get(new Integer(row));
        if (editor == null) {
          editor = defaultEditor;
        }
      }

    }

 
  /*-----------------------------------
   *  Class to render the Date values
   *----------------------------------*/
  class DateColumnFormat { 
      private SimpleDateFormat formatterR, formatterE; 
      private DefaultTableCellRenderer renderer; 
      private DefaultCellEditor editor; 
      private String sColName = null ;

      public DateColumnFormat(String pattern, String sCol){ 
          this(pattern, pattern,sCol); 
      } 

      public DateColumnFormat(String patternR, String patternE, String sCol){ 
          if(patternR == null) patternR = sDateFormat; 
          formatterR = new SimpleDateFormat(patternR); 
          formatterR.setLenient(false); 
          if(patternE == null) patternE = sDateFormat; 
          formatterE = new SimpleDateFormat(patternE); 
          formatterE.setLenient(false); 
          renderer = new DateRenderer(); 
          editor = new DateEditor(); 
          sColName = sCol ;
      } 
      
      public DefaultTableCellRenderer getRenderer(){ 
          return renderer; 
      } 

      public DefaultCellEditor getEditor(){ 
          return editor; 
      } 

      private class DateRenderer extends DefaultTableCellRenderer {
            @SuppressWarnings("compatibility:-7426509839135411659")
            private static final long serialVersionUID = -4358033316441816645L;

            public DateRenderer() { 
              super();
          } 

      public void setValue(Object value) { 
              setText((value == null) ? "" : formatterR.format(value)); 
          } 
        
        public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected,
                                                       boolean hasFocus, int row, int column) {

            setHorizontalAlignment(CENTER);
            String sCol= colnames[column].toUpperCase();
            if (hasFocus) {
                setBorder(UIManager.getBorder("Table.focusCellHighlightBorder"));
                if (table.isCellEditable(row, column)) {
                    setForeground(UIManager.getColor("Table.focusCellForeground"));
                    setBackground(UIManager.getColor("Table.focusCellBackground"));
                }
            } else {
                setBorder(BorderFactory.createEmptyBorder());
            }
              try { 
                  setText(formatterE.format(value)); 
              } catch (Exception e) { 
                  setText(""); 
              } 
            if (isSelected) {
                super.setForeground(table.getSelectionForeground());
                super.setBackground(table.getSelectionBackground());
	    } else {
                CellProp cp = (CellProp)hCellInstProps.get("R"+(row+1)+sCol);
                if (null != cp) {
                    if (cp.cBack != null)
                        setBackground(cp.cBack);
                    if (cp.cFore != null)
                        setForeground(cp.cFore);
                    if (cp.fFont != null)
                        setFont(cp.fFont);
                    if(cp.iAlign != -1)  setHorizontalAlignment(cp.iAlign);
                }
                else {
                    cp = (CellProp)hCellProps.get(sColName);
                    if (cp != null) {
                        if (cp.cBack != null)
                            setBackground(cp.cBack);
                        if (cp.cFore != null)
                            setForeground(cp.cFore);
                        if (cp.fFont != null)
                            setFont(cp.fFont);
                        if(cp.iAlign != -1)  setHorizontalAlignment(cp.iAlign);
                    }
                }
            }
            if(table.getName().equals("TOTAL")) {
                setBackground(cTotalBG);
                setForeground(cTotalFG);
            }
            return this;
        }           
      } 

      private class DateEditor extends DefaultCellEditor {
            @SuppressWarnings("compatibility:-720011820025614901")
            private static final long serialVersionUID = -5650795971441913028L;

            public DateEditor() { 
              super(new JTextField()); 
          } 

          public boolean stopCellEditing() { 
              String value = ((JTextField)getComponent()).getText(); 
              if(!value.equals("")) { 
                  try { 
                      formatterE.parse(value); 
                  } catch (ParseException e) { 
                      ((JComponent)getComponent()).setBorder(new LineBorder(Color.red)); 
                      return false; 
                  } 
              } 
              return super.stopCellEditing(); 
          } 
          public Component getTableCellEditorComponent(final JTable table, final Object value, 
          final boolean isSelected, final int row, final int column) { 
              JTextField tf =((JTextField)getComponent()); 
              tf.setBorder(new LineBorder(Color.black));                     
              try { 
                  tf.setText(formatterE.format(value)); 
              } catch (Exception e) { 
                  tf.setText(""); 
              } 
              return tf; 
          } 
          public Object getCellEditorValue() { 
              try { 
                  Date value = formatterE.parse(((JTextField)getComponent()).getText()); 
                  return value; 
              } catch (ParseException ex) { 
                  return null; 
              } 
          } 
      } 
   }



  /*-------------------------------------
   *  Class to render the Number values
   *------------------------------------*/
  class NumberColumnFormat { 
      private DecimalFormat formatterR, formatterE; 
      private DefaultTableCellRenderer renderer; 
      private DefaultCellEditor editor; 
      private String sColName = null ;

      public NumberColumnFormat(){ 
          this(null,null,null); 
      } 

      public NumberColumnFormat(String pattern, String sCol){ 
          this(pattern, pattern, sCol); 
      } 

      public NumberColumnFormat(String patternR, String patternE, String sCol){ 
          String spatR = patternR == null ? sNumFormat : patternR ;
          String spatE = patternE == null ? sNumFormat : patternE ;
          formatterR = new DecimalFormat(spatR,DecimalSymbols); 
          formatterE = new DecimalFormat(spatE,DecimalSymbols); 
          renderer = new NumRenderer(); 
          editor = new NumEditor(); 
          sColName = sCol ;
      } 

      public DefaultTableCellRenderer getRenderer(){ 
          return renderer; 
      } 

      public DefaultCellEditor getEditor(){ 
          return editor; 
      } 

      private class NumRenderer extends DefaultTableCellRenderer {
            @SuppressWarnings("compatibility:-5071019839227085676")
            private static final long serialVersionUID = -6985340609982681769L;

            public NumRenderer() { 
              super();

          } 
      
      public void setValue(Object value) { 
              setText((value == null) ? "" : formatterR.format(value)); 
          } 
        public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected,
                                                       boolean hasFocus, int row, int column) {

            setHorizontalAlignment(RIGHT);
            String sCol= colnames[column].toUpperCase();
            if (hasFocus) {
                setBorder(UIManager.getBorder("Table.focusCellHighlightBorder"));
                if (table.isCellEditable(row, column)) {
                    setForeground(UIManager.getColor("Table.focusCellForeground"));
                    setBackground(UIManager.getColor("Table.focusCellBackground"));
                }
            } else {
                setBorder(BorderFactory.createEmptyBorder());
            }
            setText((value == null) ? "" : formatterR.format(value)); 
            if (isSelected) {
                super.setForeground(table.getSelectionForeground());
                super.setBackground(table.getSelectionBackground());
	    } else {
                CellProp cp = (CellProp)hCellInstProps.get("R"+(row+1)+sCol);
                if (null != cp) {
                    if (cp.cBack != null)
                        setBackground(cp.cBack);
                    if (cp.cFore != null)
                        setForeground(cp.cFore);
                    if (cp.fFont != null)
                        setFont(cp.fFont);
                    if(cp.iAlign != -1)  setHorizontalAlignment(cp.iAlign);
                }
                else {
                    cp = (CellProp)hCellProps.get(sColName);
                    if (cp != null) {
                        if (cp.cBack != null)
                            setBackground(cp.cBack);
                        if (cp.cFore != null)
                            setForeground(cp.cFore);
                        if (cp.fFont != null)
                            setFont(cp.fFont);
                        if(cp.iAlign != -1)  setHorizontalAlignment(cp.iAlign);
                    }
                }
            }
            if(table.getName().equals("TOTAL")) {
                setBackground(cTotalBG);
                setForeground(cTotalFG);
            }
            return this;
        }        
      } 
      

      private class NumEditor extends DefaultCellEditor {
            private static final long serialVersionUID = 8661290992696514284L;

            public NumEditor() { 
              super(new JTextField()); 
          } 

          public boolean stopCellEditing() { 
              String value = ((JTextField)getComponent()).getText(); 
              if(!value.equals("")) { 
                  try { 
                      formatterE.parse(value); 
                  } catch (ParseException e) { 
                      ((JComponent)getComponent()).setBorder(new LineBorder(Color.red)); 
                      return false; 
                  } 
              } 
              return super.stopCellEditing(); 
          } 
          public Component getTableCellEditorComponent(final JTable table, final Object value, 
          final boolean isSelected, final int row, final int column) { 
              JTextField tf =((JTextField)getComponent()); 
              tf.setBorder(new LineBorder(Color.black)); 
              try { 
                  tf.setText(formatterE.format(value)); 
              } catch (Exception e) { 
                  tf.setText(""); 
              } 
              return tf; 
          } 
          public Object getCellEditorValue() { 
              try { 
                  Number value = formatterE.parse(((JTextField)getComponent()).getText()); 
                  return value; 
              } catch (ParseException ex) { 
                  return null; 
              } 
          } 
      } 
    }

    // read an image from the file system
    void readImageFile(String s, int iRow, int iCell) {
        log("readImageFile(" + s + ")");
        String sFileName = s;
        CellProp cp = (CellProp)hCellProps.get(colnames[iCell]);
        if(cp != null && cp.bEnabled) {
            Image imgReal = ik.loadImage(sFileName);
            if (null != imgReal) {
                TableColumn tabcol = table.getColumnModel().getColumn(iRow) ;
                //images[iRow][iCell] = imgReal ;
                images[table.convertRowIndexToModel(iRow)][table.convertColumnIndexToModel(iCell)] = imgReal ;
                ImageIcon ic = getScaledIcon(imgReal, cp, tabcol);
                if(null != ic) {
                    log("readImageFile() set image at:"+iRow+","+iCell+ " image size:"+imgReal.getWidth(null)+","+imgReal.getHeight(null));
                    table.setValueAt(ic, iRow, iCell);
                }
            }
        }
    }
    
    // return a scaled image
    ImageIcon getScaledIcon(Image img, CellProp cp, TableColumn tabcol) {
        int iScaleX = 0 ;
        int iScaleY = 0 ;
        ImageIcon ic = null ;
        try {
            if(cp.sImgScaleX.equalsIgnoreCase("0")) iScaleX = img.getWidth(null);
            else if(cp.sImgScaleX.equalsIgnoreCase("WIDTH")) iScaleX = tabcol.getPreferredWidth();
            else {
                iScaleX = Integer.parseInt(cp.sImgScaleX);
            }
            if(cp.sImgScaleY.equalsIgnoreCase("0")) iScaleY = img.getHeight(null);
            else if(cp.sImgScaleY.equalsIgnoreCase("HEIGHT")) iScaleY = table.getRowHeight();
            else {
                iScaleY = Integer.parseInt(cp.sImgScaleY);
            } 
            ic = new ImageIcon(img.getScaledInstance(iScaleX, iScaleY, Image.SCALE_SMOOTH));
        } catch(Exception ex){err("getScaledIcon() bad scale settings:"+cp.sImgScaleX+","+cp.sImgScaleY);} 
        return ic;
    }
    
    /*-----------------------------------------*
     *   Object to handle cell properties      *
     *-----------------------------------------*/
    class CellProp extends Object 
    {
        protected String      sName      = "" ;
        protected String      sHeader    = null ;        
        protected boolean     bEnabled   = true ;
        protected boolean     bResize    = true ;        
        protected boolean     bVisible   = true ;
        protected boolean     bCheckBox  = false ;
        protected String      sFormat    = null ;
        protected int         iAlign     = -1 ;
        protected int         iWidth     = -1 ;
        protected int         iMinWidth  = -1 ;
        protected int         iMaxWidth  = -1 ;
        protected int         iHeight    = -1 ;  
        protected int         iScrollH   = JScrollPane.HORIZONTAL_SCROLLBAR_NEVER;
        protected int         iScrollV   = JScrollPane.VERTICAL_SCROLLBAR_NEVER;
        protected Color       cBack      = Color.white ;
        protected Color       cFore      = Color.black ;
        protected Font        fFont      = new Font("Tahoma", Font.PLAIN,11) ;
        protected String      sCheck     = null ;
        protected String      sUnCheck   = null ;
        protected String      sImgScaleX = "0";
        protected String      sImgScaleY = "0";        
        
        CellProp(String sName) { this.sName = sName ; }
        
        void setCheckBoxValues(String s1, String s2) {
           sCheck   = s1 ;
           sUnCheck = s2 ;
           bCheckBox = true ;
        }
    }    

    CellProp getCellProp( int iNumCol )
    {
      String sColName = colnames[iNumCol] ;
      return (CellProp)hCellProps.get(sColName);
    }
    
    boolean isCellVisible(int iCell) {
        CellProp cp = getCellProp(iCell);
        if(null != cp){
            return cp.bVisible;
        }
        else {
            return false;
        }
    }
    
    /*----------------------------
     *  Table selection listener
     *---------------------------*/
    class SharedListSelectionHandler implements ListSelectionListener {
            public void valueChanged(ListSelectionEvent e) { 
                ListSelectionModel lsm = (ListSelectionModel)e.getSource();
                if(lsm.getMinSelectionIndex() >= 0)
                {
                  iCurRow = lsm.getMinSelectionIndex() ;
                  SendMessage(DrawLAF.TBTRG_WNRI, ""+(iCurRow+1)); 
                }
            }
        }

    public void focusGained(FocusEvent e)
     {
         if (e.getComponent() == this)
         {
             table.requestFocus();
         }
     }
        
     public void focusLost(FocusEvent e)
     {
     }  
     
    //
    // set the image to read
    // 
    boolean setImageToRead(String s){
       log("setImageToRead() search for:"+s);
       String s1,s2;
       int ipos = s.indexOf(",");
       int row=0, column=0;
       bIdentifiedLine = false ;
       if(ipos == -1) {
           err("SetImageToRead(): - Invalid row,column definition:"+s);
           return false;
        }
       s1 = s.substring(0, ipos) ; 
       s2 = s.substring(ipos+1) ; 
       try{
           row = Integer.parseInt(s1);
       }
       catch(Exception ex){
           err("SetImageToRead(): - Invalid row definition:"+s1);
           return false;
       }
       try{
           column = Integer.parseInt(s2);
       }
       catch(Exception ex){
           err("SetImageToRead(): - Invalid column definition:"+s2);
           return false;
       }       
      if((row) < 0 || (row >= iNbRows)){
        err("SetImageToRead(): - Invalid row number:"+row);
        bIdentifiedLine = false ;
        return false;
      }
      if((column) < 0 || (column >= iNbCols)){
        err("SetImageToRead(): - Invalid column number:"+row);
        bIdentifiedLine = false ;
        return false;
      }
      log("setImageToRead() read image at "+row+","+column);
      ImageIcon ii = new ImageIcon(images[row][column]);
    
      bIdentifiedLine = true ;
      if(null != ii && ii.getIconWidth() > -1) {
          log("SetImageToRead(): - Image size:"+ii.getIconWidth()+","+ii.getIconHeight());
          bImage = ik.imageIconToByteArray(ii);
          bi=new BufferedImage(ii.getImage().getWidth(null),
              ii.getImage().getHeight(null), BufferedImage.TYPE_INT_RGB); 
          numBytesRead = 0;
          log("setImageToRead() identified for size:"+bi.getWidth()+","+bi.getHeight());
      }
      else{
          log("setImageToRead() icon is null at:"+row+","+column);
      }
      return true;
    }     

  //
  // returns the current image chunks
  //
    String getImageContent() {
        try {
            log("Start GetImage()");
            // BASE64Encoder encoder = new BASE64Encoder(); // MLT-7702
            if ((null != bImage) && numBytesRead < bImage.length) {
                if ((numBytesRead + 16384) < (bImage.length - 1)) {
                    iImgEnd = numBytesRead + 16384;
                } else
                    iImgEnd = bImage.length - 1;
                byte[] buf = new byte[16384];
                int j = 0;
                for (int i = iImgStart; i < iImgEnd; i++)
                    buf[j++] = bImage[i];
                iImgStart += iImgEnd;
                numBytesRead += iImgEnd;
                // return encoder.encodeBuffer(buf);
                return Base64.getEncoder().encodeToString(buf); // MLT-7702
            } else {
                iImgStart = iImgEnd = 0;
                numBytesRead = 0;
                return "";
            }
        } catch (Exception e) {
            err("getImageContent(): "+e.toString());
            e.printStackTrace();
        }

        return "";
    }
    
  // return the CLOB content
  String getCLOBContent() {    
        String s = "";
        String sContent = (String)table.getValueAt(iCurRow,iCurCell);
        int iLen = sContent.length();
        while (iStartT < iLen) {
            if (iStartT + iChunk <= iLen)
                s = sContent.substring(iStartT, iChunk);
            else
                s = sContent.substring(iStartT, iLen - iStartT);
            iStartT += iChunk;
            return s;
        }
        iStartT = 0;
        return ""; 
  }          

  // get the current row
  String getCurrentRow() {
      return ""+iRowPos;
  }

    //
    // display image full size
    //
    void displayFullSizeImage(int row, int column) {
      if(null != images[row][column] && (images[row][column].getWidth(null) > -1)){
        new DisplayImage(images[row][column],"");
      }
    }
    
   /*-----------------------*
    *   new page request    *
    *-----------------------*/
    void setPageRequest( int iPage ) {
       if(bRefresh) {   
          SendMessage(DrawLAF.TBTRG_PAGE, ""+iPage); 
       }
    }
    
    /*
     *  zoom the table at expend time
     */
    public void zoomPanel(){
        try {
            new Thread() {
                public void run() {
                    ImagePanel ip= new ImagePanel();
                    double dX, dY;
                    if(bZoom) {
                        ip.setBounds(rTarget);
                    }
                    else{
                        ip.setBounds(rSource);
                        ip.setLocation(0, 0);
                    }
                    dBean.getParent().add(ip,0);        
                    BufferedImage img = getTableScreenShot();
                    ip.setImage(img);
                    int w = img.getWidth();
                    int h = img.getHeight();
                    //System.out.println("*** initial img size:"+w+","+h);
                    double diffX = 0.0d;
                    double diffY = 0.0d;
                    int iX=0, iY=0, stepX=1, stepY=1;
                    if(bZoom) {
                        diffX = (double)(((double)rTarget.width / (double)rSource.width)) / 10.0d ;
                        diffY = (double)(((double)rTarget.height / (double)rSource.height))  / 10.0d ;
                        dX = 1.0 + diffX;
                        dY = 1.0 + diffY;            
                        stepX = (int)((rSource.x) / 10) ;
                        stepY = (int)((rSource.y) / 10) ;                        
                    }
                    else {
                        //System.out.println("*** w:"+w+"  target:"+rTarget.width);
                        diffX = (double)(((double)rTarget.width / (double)w)) / 10.0d ;
                        diffY = (double)(((double)rTarget.height / (double)w))  / 10.0d ;
                        //System.out.println("*** diff:"+diffX+","+diffY);                                
                        dX = 1.0 - diffX;
                        dY = 1.0 - diffY;            
                        stepX = (int)((rTarget.x) / 10) ;
                        stepY = (int)((rTarget.y) / 10) ;                        
                    }
                    iX = stepX;
                    iY = stepY;
                    for (int i=1; i<9; i++){
                        //System.out.println("*** scale:"+dX+","+dY);                                
                        //System.out.println("*** image size after:"+(w*dX)+","+(h*dY));
                        if((w*dX > 0.0) && (h*dY > 0.0)){
                            if(bZoom) {
                                ip.setLocation(rComponent.x-iX,rComponent.y-iY);
                                ip.setSize(rTarget.width,rTarget.height);
                            }
                            else{
                                ip.setLocation(iX,iY);
                            }
                            //System.out.println("*** repaint at:"+(rComponent.x-iX)+","+(rComponent.y-iY));
                            ip.repaint();
                            if(bZoom) {
                                dX = 1.0 + (diffX*(i+1));
                                dY = 1.0 + (diffY*(i+1));
                            }
                            else{
                                dX = 1.0 - (diffX*(i+1));
                                dY = 1.0 - (diffY*(i+1));
                            }
                            iX += stepX;
                            iY += stepY;
                        }
                        if(bZoom){
                            try {
                                Thread.sleep(10);
                            } catch (Exception ex) {;}
                        }
                        else{
                            try {
                                Thread.sleep(20);
                            } catch (Exception ex) {;}                            
                        }
                    } 
                    dBean.getParent().remove(ip);
                    jp.repaint();
                }
            }.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /*
     *  scale an image
     */
    public BufferedImage scaleBuffImage(BufferedImage img, int width, int height,Color background) {
        int imgWidth = img.getWidth();
        int imgHeight = img.getHeight();
        if (imgWidth*height < imgHeight*width) {
            width = imgWidth*height/imgHeight;
        } else {
            height = imgHeight*width/imgWidth;
        }
        BufferedImage newImage = new BufferedImage(width, height,
                BufferedImage.TYPE_INT_RGB);
        Graphics2D g = newImage.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                    RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setBackground(background);
            g.clearRect(0, 0, width, height);
            g.drawImage(img, 0, 0, width, height, null);
        } finally {
            g.dispose();
        }
        return newImage;
    }
    
    /*
     * get the table screenshot
     */
    BufferedImage getTableScreenShot(){
        BufferedImage image = null;
        try {
            if(bZoom){
                Point pt = new Point(rComponent.x,rComponent.y);
                SwingUtilities.convertPointToScreen(pt, scrollPane);
                image = new Robot().createScreenCapture(
                    new Rectangle( pt.x, pt.y, rTable.width, rTable.height ) );
            }
            else {
                Point pt = new Point(xP,yP);
                SwingUtilities.convertPointToScreen(pt, dBean.getParent());
                image = new Robot().createScreenCapture( new Rectangle( pt.x, pt.y, dBean.getParent().getWidth()-20,dBean.getParent().getHeight()-20 ) );                
            }
        } catch (AWTException e) {
        }
        return image;
    }
    
    /*
     * panel for image transition
     */
    private class ImagePanel extends JPanel{
        @SuppressWarnings("compatibility:-4428864352160842219")
        private static final long serialVersionUID = 5908735216955046995L;
        BufferedImage bi = null ;
        public ImagePanel(){
            this.setBorder(null);
            this.setBackground(cTableBG);
        }
        void setImage(BufferedImage bi){
            this.bi = bi ;
        }
        public void paintComponent(Graphics g) {
            super.paintComponent(g);       
            Graphics2D g2 = (Graphics2D)g ;
            if(null != bi){
                try {
                    g2.drawImage((Image)bi, 0, 0, this);
                } catch (Exception e) {;}
            }
            g2.dispose();
        }         
    }
   
    void err(String s){
        System.out.println("-  LAF DynTable "+s);
    }
}
