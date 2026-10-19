package oracle.forms.fd;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Image;
import java.awt.Rectangle;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.ComponentAdapter;
import java.awt.event.ComponentEvent;
import java.awt.event.ComponentListener;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;

import java.text.DateFormat;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.NumberFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;

import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.StringTokenizer;

import javax.swing.BorderFactory;
import javax.swing.DefaultCellEditor;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JMenuItem;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPopupMenu;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.ListSelectionModel;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;
import javax.swing.border.LineBorder;
import javax.swing.event.ListSelectionEvent;
import javax.swing.event.ListSelectionListener;
import javax.swing.table.AbstractTableModel;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.JTableHeader;
import javax.swing.table.TableColumn;
import javax.swing.table.TableColumnModel;

import oracle.forms.handler.IHandler;
import oracle.forms.properties.ID;
import oracle.forms.ui.CustomEvent;
import oracle.forms.ui.VBean;

// MLT-7702
//import sun.misc.BASE64Decoder;
//import sun.misc.BASE64Encoder;
import java.util.Base64;

/**
 * A javabean to displays a LOV
 * as a Swing JTable
 *
 * <br />
 * @author   Francois Degrelle
 * creation  June 2009
 * @version  1.4
 *
 * The end-user can sort the JTable on every column by left-clicking the header
 * and also chose whatever column to search by right-clicking the header
 * columns can be resized and reorganized.
 *
 */

public class LAF_LOV extends VBean implements FocusListener {
    public final static ID setLOVHeader                 = ID.registerProperty("SET_LOV_HEADER");  
    public final static ID setLOVFormats                = ID.registerProperty("SET_LOV_FORMATS");
    public final static ID setLOVScheme                 = ID.registerProperty("SET_LOV_SCHEME");    
    public final static ID setLOVColsType               = ID.registerProperty("SET_LOV_COLS_TYPE");      
    public final static ID setLOVButtonLabels           = ID.registerProperty("SET_LOV_BUTTON_LABELS");          
    public final static ID setLOVButtonIcons            = ID.registerProperty("SET_LOV_BUTTON_ICONS");    
    public final static ID setLOVCellProperty           = ID.registerProperty("SET_LOV_CELL_PROPERTY");
    public final static ID setLOVCellValue              = ID.registerProperty("SET_LOV_CELL_VALUE");    
    public final static ID setLOVColSearch              = ID.registerProperty("SET_LOV_COL_SEARCH");        
    public final static ID setLOVAutoWidth              = ID.registerProperty("SET_LOV_AUTO_WIDTH");            
    public final static ID setLOVValidation             = ID.registerProperty("SET_LOV_VALIDATION");        
    public final static ID setLOVCurrCellValue          = ID.registerProperty("SET_LOV_CURRENT_CELL_VALUE");    
    public final static ID setLOVRowProperty            = ID.registerProperty("SET_LOV_ROW_PROPERTY");
    public final static ID setLOVData                   = ID.registerProperty("SET_LOV_DATA");    
    public final static ID setLOVDateFormat             = ID.registerProperty("SET_LOV_DATE_FORMAT");    
    public final static ID setLOVNumFormat              = ID.registerProperty("SET_LOV_NUM_FORMAT");        
    public final static ID setLOVIntFormat              = ID.registerProperty("SET_LOV_INT_FORMAT");        
    public final static ID setLOVAddRow                 = ID.registerProperty("SET_LOV_ADD_ROW");    
    public final static ID setLOVTitle                  = ID.registerProperty("SET_LOV_TITLE");      
    public final static ID setLOVPrompt                 = ID.registerProperty("SET_LOV_PROMPT");          
    public final static ID setLOVMaxColWidth            = ID.registerProperty("SET_LOV_MAX_COL_WIDTH");    
    public final static ID setLOVNbPages                = ID.registerProperty("SET_LOV_NB_PAGES");        
    public final static ID setLOVArraySize              = ID.registerProperty("SET_LOV_ARRAY_SIZE");
    public final static ID setLOVNumRows                = ID.registerProperty("SET_LOV_NUM_ROWS");    
    public final static ID setLOVRefresh                = ID.registerProperty("SET_LOV_REFRESH");        
    public final static ID setLOVBounds                 = ID.registerProperty("SET_LOV_BOUNDS");              
    public final static ID setLOVHeadBG                 = ID.registerProperty("SET_LOV_HEADBG");    
    public final static ID setLOVHeadFG                 = ID.registerProperty("SET_LOV_HEADFG");    
    public final static ID setLOVDataBG                 = ID.registerProperty("SET_LOV_DATABG");        
    public final static ID setLOVDataFG                 = ID.registerProperty("SET_LOV_DATAFG");    
    public final static ID setLOVGridFG                 = ID.registerProperty("SET_LOV_GRIDFG");        
    public final static ID setLOVUpdate                 = ID.registerProperty("SET_LOV_UPDATE"); 
    public final static ID setLOVCellPos                = ID.registerProperty("SET_LOV_CELLPOS");    
    public final static ID setLOVRowPos                 = ID.registerProperty("SET_LOV_ROWPOS");        
    public final static ID setLOVSeparator              = ID.registerProperty("SET_LOV_SEPARATOR");    
    public final static ID setLOVImageSize              = ID.registerProperty("SET_LOV_IMAGE_SIZE");
    public final static ID setLOVReorderColumns         = ID.registerProperty("SET_LOV_REORDER_COLUMNS");    
    public final static ID setLOVResizeColumns          = ID.registerProperty("SET_LOV_RESIZE_COLUMNS");    
    public final static ID setLOVSelBackground          = ID.registerProperty("SET_LOV_SELECTION_BACKGROUND");        
    public final static ID setLOVSelForeground          = ID.registerProperty("SET_LOV_SELECTION_FOREGROUND");        
    public final static ID setLOVDecimalSeparators      = ID.registerProperty("SET_LOV_DECIMAL_SEPARATORS");            
    public final static ID setLOVLocale                 = ID.registerProperty("SET_LOV_LOCALE");            
    public final static ID setLOVFilter                 = ID.registerProperty("SET_LOV_FILTER");
    public final static ID setLOVVerticalLine           = ID.registerProperty("SET_LOV_VERTICAL_LINE");        
    public final static ID setLOVHorizontalLine         = ID.registerProperty("SET_LOV_HORIZONTAL_LINE");            
    public final static ID setLOVLog                    = ID.registerProperty("SET_LOV_LOG");        
    public final static ID getLOVCellVal                = ID.registerProperty("GET_LOV_CELLVAL");    
    public final static ID getLOVRowVal                 = ID.registerProperty("GET_LOV_ROWVAL");        
    public final static ID initLOV                      = ID.registerProperty("INIT_LOV");    
    public final static ID setLOVShow                   = ID.registerProperty("SHOW_LOV");      
    public final static ID SETIMAGE                     = ID.registerProperty("LOV_SET_IMAGE");      
    public final static ID SetSortable                  = ID.registerProperty("SET_LOV_SORTABLE");
    // event fired
    public final static ID MSG_LOV                      = ID.registerProperty("MSG_LOV");          
    public final static ID MSG_LOV_NAME                 = ID.registerProperty("LOV_NAME");              
    public final static ID TRG_WNRI                     = ID.registerProperty("LOV_NEW_RECORD_INSTANCE");          
    public final static ID TRG_WNII                     = ID.registerProperty("LOV_NEW_ITEM_INSTANCE");
    public final static ID TRG_WMC                      = ID.registerProperty("LOV_WHEN-MOUSE-CLICK");
    // paging properties
    public final static ID TRG_PAGE                     = ID.registerProperty("LOV_GET_PAGE");
    public final static ID TRG_NUM_PAGE                 = ID.registerProperty("LOV_NUM_PAGE");
    // search column properties
    public final static ID TRG_COL_SEARCH               = ID.registerProperty("LOV_TRG_COL_SEARCH");
    public final static ID TRG_COL_SEARCH_NAME          = ID.registerProperty("LOV_TRG_COL_SEARCH_NAME");    
    // sort order column properties
    public final static ID TRG_ORDER_BY                 = ID.registerProperty("LOV_TRG_ORDER_BY");
    public final static ID TRG_ORDER_BY_VALUE           = ID.registerProperty("LOV_TRG_ORDER_BY_VALUE");        
    // search value properties
    public final static ID TRG_VALUE_SEARCH             = ID.registerProperty("LOV_TRG_VALUE_SEARCH");
    public final static ID TRG_VALUE                    = ID.registerProperty("LOV_TRG_VALUE");        
    // LOV selection properties
    public final static ID TRG_WMDC                     = ID.registerProperty("LOV_SELECTION");
    public final static ID TABLE_EVENT                  = ID.registerProperty("LOV_POST_CHANGE");    
    public final static ID TABLE_EVENT_MSG              = ID.registerProperty("LOV_TABLE_EVENT_MSG");    
    public final static ID GETROWSCHANGED               = ID.registerProperty("LOV_GET_ROWS_CHANGED");        

    private String  sLOVName = "" ;
    private StringBuffer sbImage =new StringBuffer();
    private boolean bSeperateFrame = true ;       // popup in a seperate frame
    private boolean bUpdatable = false ;           // can update the table
    private boolean bReorder = true ;              // can reorder the columns
    private boolean bResize = true ;               // can resize the columns
    private boolean bLog = false ;                 // output to java console
    private boolean bCustomButtons = false ;       // dialog box uses custom buttons
    private boolean isAscent = true;               // sort flag (ACS or DESC)
    private boolean bAutoWidth = true ;            // LOV auto width
    private boolean isSortable = true ;            // LOV sortable

    private int     xPos=-1, yPos=-1, w=600, h=400 ;     // LOV frame bounding box
    private int     iNbRows = 0, iNbCols = 0 ;     // table dimensions
    private int     iNbFetchedRows = 0 ;
    private int     iCurLine = 0 ;                 // current line selected
    private int     iRowPos = 0, iCellPos = 0 ;    // current row, cell selected
    private int     iCurRow = 0, iCurCell = 0 ;    // current row, cell
    private int     iRowHeight = -1 ;              // current row height
    private int     iCurImageRow  = -1 ;
    private int     iCurImageCell = -1 ;
    private int     iImageWidth  = 100 ;
    private int     iImageHeight = -1 ;
    private int     iMaxColWidth = -1 ;
    private int     iColSearch   = 0 ;
    private int     iNextColSearch   = 0 ;   
    private int     iTotalLines = 0 ;
    private int     iNbPages = 1 ;
    private int     iCurPage = 1 ;
    private int     iLinesPerPage = 0 ;
    private int     iSens  = 1 ;
    private int     iSearchLength = 0 ;
    private String  sScheme = "" ;
    private String  sButton1Label = "" ;
    private String  sButton2Label = "" ;
    private String  sSearchColumn  = null ;
    private String  separator = "^" ;              // current separator
    private String  sTitle = "" ;                  // LOV title
    private String  sPrompt = null ;                 // LOV prompt    
    private String  sDateFormat = "dd/MM/yyyy" ;   // default date format
    private String  sIntFormat  = "#" ;            //  default integer format    
    private String  sNumFormat  = "#.##" ;         //  default number format
    private ImageIcon iIcon1 = null ;
    private ImageIcon iIcon2 = null ;
    private Locale  locale = Locale.getDefault();
    private DecimalFormatSymbols DecimalSymbols = new DecimalFormatSymbols(locale); 
    private Color   HeadBGColor = DrawLAF.SILVER_SCHEME; // silver scheme default color
    private Color   HeadFGColor = DrawLAF.SILVER_LIGHT;  // silver scheme default color
    private Color   DataBGColor; 
    private Color   DataFGColor;
    private Color   GridColor;
    private Color   SelBGColor = new Color(206,232,255), SelFGColor=new Color(0,64,128) ;
    private Color   cDialogFore   = DrawLAF.Current_Color.darker() ;
    private Color   cDialogBack   = DrawLAF.Current_Color.brighter() ;          
    private SortButtonRenderer renderer = null;//new SortButtonRenderer();
    private JPopupMenu popupMenu = new JPopupMenu();
    private HashMap hCellProps = new HashMap() ;
    private ListSelectionModel listSelectionModel;    
    private IHandler           m_handler; 
    private Container          contentpane ;
    private JScrollPane        scrollPane ;
    private JTable             table ;
    private MyTableModel       model ;    
    private SortableTableModel dm ;
    private JFrame             frame ;
    private JDialog            dlgLOV = null ;
    private JPanel             jp = null ;
    private JOptionPane        jop = null ;
    private JTextField         jtf = null ;
    private String             sFilter = null ;
    private int[] iRowsChanged ;
    private int[] iColWidth ;
    private Font[] fColFont ;
    private String[] colnames ;
    private Object[][] data ;
    private String[] coltypes ;
    private int     iImageIndex = 0 ;
    private String  sCellValue = "" ;
    private KeyListener kl, kl2 ;
    private MouseListener ml ;
    private java.io.OutputStream os;
    private MemoryTool memory = new MemoryTool();
    private ImageKit  ik = new ImageKit();
    private JTableHeader header = null;
    private HeaderListener headListener = null;

    public LAF_LOV() {
        super();
             
        contentpane = this ;
        model = new MyTableModel(); 
        
        dm = new SortableTableModel() {
          public Class getColumnClass(int col) {
                Object o = getValueAt(0, col);
                if(o == null) {
                    if("INTEGER".equalsIgnoreCase(coltypes[col])) return Integer.class;
                    else if("DATE".equalsIgnoreCase(coltypes[col])) return Date.class;
                    else return Double.class;
                }
                return o.getClass();
          }
          public boolean isCellEditable(int row, int col) {
              return false ;
          }  
          public void setValueAt(Object obj, int row, int col) {
            super.setValueAt(obj, row, col); return;
          }
        };

        table = new JTable(dm);
        table.setAutoResizeMode(table.AUTO_RESIZE_OFF);
        table.setPreferredScrollableViewportSize(new Dimension(400, 70));
        table.setAutoCreateColumnsFromModel(true);        
        table.setShowVerticalLines(false);
        table.setShowHorizontalLines(false);
        listSelectionModel = table.getSelectionModel();
        listSelectionModel.addListSelectionListener(new SharedListSelectionHandler());
        table.setSelectionModel(listSelectionModel); 
        scrollPane = new JScrollPane(table);
    }
    
  public void destroy() {
      super.destroy();
      System.gc();
      memory.printMemory(this.getName(),"LAF_LOV destroy()");
  }
  
  public void init(IHandler handler)
  {
    m_handler = handler;
    super.init(handler);
    addFocusListener(this);
    setKeyListener() ;
    setTextKeyListener() ;
    setMouseListener() ;
    memory.printMemory(this.getName(),"LAF_LOV Init()");    
  }      
      

  /*----------------------------------------*
   *  Method to print the table's content
   *----------------------------------------*/
  private void printDebugData(JTable table) {
        int numRows = table.getRowCount();
        int numCols = table.getColumnCount();
        javax.swing.table.TableModel model = table.getModel();

        log("Value of data: ");
        for (int i=0; i < numRows; i++) {
            log("    row " + i + ":");
            for (int j=0; j < numCols; j++) {
                log("  " + model.getValueAt(i, j));
            }
            log("");
        }
        log("--------------------------");
    }


  /*-----------------------------------*
   *  All the properties you can set
   *-----------------------------------*/
  public boolean setProperty(ID property, Object value)
  {
    if(property != SETIMAGE) log("*LAF_LOV "+property+":"+value);
    
    //
    // set the header
    //
    if (property == setLOVHeader) 
    {
      hCellProps = new HashMap() ;
      String label = value.toString();
      int width = 0 ;
      StringTokenizer st ;
      int i = 0 ; String title ;
      st = new StringTokenizer(label, separator);
      while (st.hasMoreTokens()) {
         title = st.nextToken() ;
         i++ ;
      }
      i = 0 ;
      FontMetrics fontMetrics = getFontMetrics(table.getFont());
      st = new StringTokenizer(label, separator);
      while (st.hasMoreTokens()) {
         colnames[i] = (st.nextToken()) ;
         CellProp cp = new CellProp(colnames[i]);
         if(i == 0)  cp.bSearch = true ;
         // set minimum width to feet the header label
         width = fontMetrics.stringWidth("w"+colnames[i]+"w");         
         cp.iMinWidth = width ;
         hCellProps.put(colnames[i].toLowerCase(),cp);
         i++;
      }

      return true;
    }

    //
    // set the sortable flag
    //
    if (property == SetSortable) 
    {
      String label = value.toString();
      if ( label.equalsIgnoreCase("true")){
        isSortable = true ;
        if(headListener != null) {
            headListener.setSortable(isSortable);
        }
      }
      if ( label.equalsIgnoreCase("false")){
        isSortable = false;
        if(headListener != null) {
            headListener.setSortable(isSortable);
        }        
      }      
      return true;
    }
    
    //
    // set the LOV number of pages
    //
    else if (property == setLOVNbPages) {
        String s = value.toString();
        try{
            iNbPages = Integer.parseInt(s) ;
        }
        catch(Exception e) {System.out.println("SET_LOV_NB_PAGES() bad argument:"+s);}
        return true ;
    }
    
    //
    // set the LOV buttons' labels
    //
    else if (property == setLOVButtonLabels) {
        String label = value.toString();
        String sLab1="", sLab2="" ;
        int i = 0 ; String title ;
        StringTokenizer st = new StringTokenizer(label, ",");
        if(st.hasMoreTokens()) sLab1 = st.nextToken() ;
        else return false ;
        if(st.hasMoreTokens()) sLab2 = st.nextToken() ;
        else return false ;      
        sButton1Label = sLab1 ;
        sButton2Label = sLab2 ;
        bCustomButtons = true ;
        return true ;
    }
    //
    // set LOV buttons' icons
    //
    else if (property == setLOVButtonIcons) {
        String label = value.toString();
        String sLab1="", sLab2="" ;
        int i = 0 ; String title ;
        StringTokenizer st = new StringTokenizer(label, ",");
        if(st.hasMoreTokens()) sLab1 = st.nextToken() ;
        else return false ;
        if(st.hasMoreTokens()) sLab2 = st.nextToken() ;
        else return false ;      
        Image img = ik.loadImage(sLab1);
        if(img != null) iIcon1 = new ImageIcon(img);
        img = ik.loadImage(sLab2);
        if(img != null) iIcon2 = new ImageIcon(img);
        return true ;
    }    
    //
    // set the image
    //
    else if(property==SETIMAGE)
    {
      
      String sImage = value.toString();
      if(sImage.startsWith("[INDEX_IMAGE]"))
      {
        StringTokenizer st ;
        String sValue = "" ;
        int iRow = 0, iCell = 0 ;
        st = new StringTokenizer(sImage,",");
        st.nextToken() ;
        if(st.hasMoreTokens())
        {
          try{iRow = Integer.parseInt(st.nextToken());}
          catch(Exception e){System.out.println("Set_Image() Unable to get the Row index"); return false ;}
        } else return false ;
        if(st.hasMoreTokens())
        {
          try{iCell = Integer.parseInt(st.nextToken());}
          catch(Exception e){System.out.println("Set_Image() Unable to get the Cell index"); return false ;}
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
        // MLT-7702
        // BASE64Encoder encoder = new BASE64Encoder();
        // BASE64Decoder decoder = new BASE64Decoder();
        try{
            byte[] decodedStr =  Base64.getDecoder().decode(sbImage.toString()); // MLT-7702  
          // byte[] decodedStr = decoder.decodeBuffer(sbImage.toString());
          ImageIcon ii = new ImageIcon(decodedStr);
          Image img = ii.getImage() ;     
          // scale the image
          ii = new ImageIcon(img.getScaledInstance(iImageWidth, iImageHeight, Image.SCALE_SMOOTH));
          if(iCurImageRow > -1 && iCurImageCell > -1)
          {
            log("Set Image: "+ii.getIconWidth()+"*"+ii.getIconHeight());
            data[iCurImageRow][iCurImageCell] = ii ;
          }  
        } catch(Exception e){}
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
    else if (property == setLOVImageSize)
    {
      String label = value.toString();
      StringTokenizer st ;
      int iW = 0, iH = 0 ;
      st = new StringTokenizer(label,",");
      if(st.hasMoreTokens()) 
      {
        try{
          iW = Integer.parseInt(st.nextToken());
        } catch(Exception e){System.out.println("SetImageSize Unable to set the image width"); return false;}  
      } else return false ;
      if(st.hasMoreTokens()) 
      {
        try{
          iH = Integer.parseInt(st.nextToken());
        } catch(Exception e){System.out.println("SetImageSize Unable to set the image height"); return false;}  
      } else return false ;
      iImageWidth  = iW ;
      iImageHeight = iH ;
      return true ;
    }
    
    //
    // set the columns type
    //
    else if (property == setLOVColsType)
    {
      String label = value.toString();
      StringTokenizer st ;
      int i = 0 ; String title ;
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
    if (property == setLOVCurrCellValue) 
    {
      int iRow = iCurRow + 1 ;
      int iCell = iCurCell + 2 ;
      String sValue = "^" + iRow + "^" + iCell + "^" + value.toString();
      setProperty(setLOVCellValue,sValue);
      table.repaint();
      return true ;
    }
     
    //
    // set the Cell value
    //
    if (property == setLOVCellValue) 
    {
        // params Row and Cell given
        // are starting at 1,1
        // JTable starts at 0,0 so we have
        // to remove 1 from arguments
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
            System.out.println("SetCellValue: Unable to get row,cell ccordinate");
        }
        iRow--;
        iCell--;
        log("setCellValue() set value:"+s3+" for "+iRow+","+iCell);        
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
          data[iRow][iCell] = s3 ;
          /*
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
                System.out.println("SetCellValue:Unable to format Date value:"+s3);
            };            
          }
          */
        }
        // CHAR column
        else
          data[iRow][iCell] = s3 ;
        }
        catch(Exception e){e.printStackTrace();}
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
    if (property == setLOVRowProperty) 
    {
      String s = value.toString();
      String s1="", s2="", s3="", s4="" ;
      int iVal = -1 ;
      StringTokenizer st = new StringTokenizer(s,"|");
      if(st.hasMoreTokens()) s1= st.nextToken() ;
      else return false ;
      if(st.hasMoreTokens()) s2 = st.nextToken() ;
      else return false ;
      if(s1.equalsIgnoreCase("HEIGHT"))
      {
         try { 
           iVal = Integer.parseInt(s2);
           if(iVal > 0) iRowHeight = iVal ;
         }
         catch(Exception e){ return false ;}        
      }
      return true ;
    }
    
    //
    // set the cell properties
    //
    if (property == setLOVCellProperty) 
    {
      String sColName="" ;
      String s = value.toString();
      String s1="", s2="", s3="", s4="" ;
      int iVal = -1 ;
      StringTokenizer st = new StringTokenizer(s,"|");
      int iColPos = -1 ;
      if(st.hasMoreTokens()) sColName = st.nextToken().toLowerCase() ;
      else return false ;
      if(st.hasMoreTokens()) s1 = st.nextToken() ;
      else return false ;
      if(st.hasMoreTokens()) s2 = st.nextToken() ;
      else return false ;
      if(st.hasMoreTokens()) s3 = st.nextToken() ;      
      if(st.hasMoreTokens()) s4 = st.nextToken() ;      
      log("prop="+s1+"  value:"+s2);
      // search column position
      for(int i=0; i<colnames.length;i++)
        {
          if(colnames[i].equalsIgnoreCase(sColName))
          {
            iColPos = i ;
            break;
          }
      }
      if(iColPos < 0)
      {
        System.out.println("Colulmn: "+sColName+" not found. Unable to set property");
        return false ; // column not found
      }  
      CellProp cp = (CellProp)hCellProps.get(sColName);
      if(cp != null)
      {
        // enable property
        if(s1.equalsIgnoreCase("ENABLE"))
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
             // transform characters into pixels
             FontMetrics fontMetrics = getFontMetrics(table.getFont());
             int width = fontMetrics.stringWidth("w");
             iVal *= width ;
             cp.iWidth = iVal ;
           }
           catch(Exception e){ return false ;}
        }
        // minimum width property
        else if(s1.equalsIgnoreCase("MIN_WIDTH"))
        {
           try {
             iVal = Integer.parseInt(s2);
             // transform characters into pixels
             FontMetrics fontMetrics = getFontMetrics(table.getFont());
             int width = fontMetrics.stringWidth("w");
             iVal *= width ;             
             cp.iMinWidth = iVal ;
           }
           catch(Exception e){ return false ;}
        }       
        // maximum width property
        else if(s1.equalsIgnoreCase("MAX_WIDTH"))
        {
           try {
             iVal = Integer.parseInt(s2);
             // transform characters into pixels
             FontMetrics fontMetrics = getFontMetrics(table.getFont());
             int width = fontMetrics.stringWidth("w");
             iVal *= width ;             
             cp.iMaxWidth = iVal ;
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
           cp.cBack = ik.makeColor(s2) ; //getColor(s2) ;
        }
        // foreground color property
        else if(s1.equalsIgnoreCase("FG_COLOR"))
        {
           cp.cFore = ik.makeColor(s2) ;
        }                
        // alignment property
        else if(s1.equalsIgnoreCase("ALIGNMENT"))
        {
           if(s2.equalsIgnoreCase("LEFT"))        cp.iAlign = SwingConstants.LEFT ;
           else if(s2.equalsIgnoreCase("CENTER")) cp.iAlign = SwingConstants.CENTER ;
           else if(s2.equalsIgnoreCase("RIGHT"))  cp.iAlign = SwingConstants.RIGHT ;
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
               System.out.println("SetCellProperty:Unable to set Font:"+value);
             };
           }           
        }                
        
        hCellProps.put(sColName,cp);
      }
      else
          System.out.println("Header column not found: "+sColName);
      return true ;
    }

    //
    // set the searching column
    //
    else if (property == setLOVColSearch) 
    {    
      String label = value.toString().toLowerCase();  
      String s = null ;
      for(int z=0; z<colnames.length; z++)
      {
         CellProp cp = getCellProp(z) ;
         if(cp != null) {
             s = cp.sName.toLowerCase() ;
             if(cp.sName.equalsIgnoreCase(label)) 
             {  
               iColSearch = z ;
               cp.bSearch = true ;
               sSearchColumn = label ;
             }  
             else cp.bSearch = false ;
             hCellProps.put(s,cp);
         }
      } 
      return true ;
    }

    //
    // set the data
    //
    else if (property == setLOVData) 
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
         //
         // IMAGE column
         //
         if(coltypes[i].equalsIgnoreCase("IMAGE"))
         {
           //data[iCurLine][i] = new ImageIcon();
         }
         //
         // NUMBER column
         //
         else if(coltypes[i].equalsIgnoreCase("NUMBER"))
         {
           if(!sValue.equalsIgnoreCase(" "))
             fValue = new Double(Double.parseDouble(sValue)) ;
           data[iCurLine][i] = fValue ;
           sFormatedValue = ""+fValue ;
         }
         //
         // INTEGER column
         //
         else if(coltypes[i].equalsIgnoreCase("INTEGER"))
         {
           if(!sValue.equalsIgnoreCase(" "))
             iValue = new Integer(Integer.parseInt(sValue)) ;
           data[iCurLine][i] = iValue ;
           sFormatedValue = "" + iValue ;
         }           
         //
         // DATE column
         //
         else if(coltypes[i].equalsIgnoreCase("DATE"))
         {
           data[iCurLine][i] = sValue ;
           /*
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
                 System.out.println("SetData:Unable to format Date value:"+sValue);
             };            
           }
           */
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
         catch(Exception e){e.printStackTrace();}
         i++;
      }
      iCurLine++ ;

      return true;
    }
    
    //
    // set the default date format
    //
    else if (property == setLOVDateFormat)
    {
      sDateFormat = (String)value ;
      return true ;
    }    
    
    //
    // set the default number format
    //
    else if (property == setLOVNumFormat)
    {
      sNumFormat = (String)value ;
      return true ;
    }    
    
    //
    // set the default integer format
    //
    else if (property == setLOVIntFormat)
    {
      sIntFormat = (String)value ;
      return true ;
    }        
    
    //
    // add a blank row
    //
    else if (property == setLOVAddRow) 
    {
      //model.insertRow(0, new Object[]{""});
      return true ;
    }
    
    //
    // set the log trace
    //
    else if (property == setLOVLog) 
    {
      if(value.toString().equalsIgnoreCase("true")) bLog = true ;
      else bLog = false ;
      return true ;
    }
    
    //
    // set the vertical lines
    //
    else if (property == setLOVVerticalLine) 
    {
      if(value.toString().equalsIgnoreCase("true")) table.setShowVerticalLines(true);
      else if(value.toString().equalsIgnoreCase("false")) table.setShowVerticalLines(false);
      return true ;
    }    
    
    //
    // set the vertical lines
    //
    else if (property == setLOVHorizontalLine) 
    {
      if(value.toString().equalsIgnoreCase("true")) table.setShowHorizontalLines(true);
      else if(value.toString().equalsIgnoreCase("false")) table.setShowHorizontalLines(false);
      return true ;
    }
    
    //
    // set the title
    //
    else if (property == setLOVTitle) 
    {
      sTitle = value.toString();
      return true ;
    }
    
    //
    // set the LOV auto width
    //
    else if (property == setLOVTitle) 
    {
      String s = value.toString();
      if(s.equalsIgnoreCase("true"))       bAutoWidth = true ;
      else if(s.equalsIgnoreCase("false")) bAutoWidth = false ;
      return true ;
    }
    
    //
    // set the maximum column width (in characters)
    //
    else if (property == setLOVMaxColWidth) 
    {
      try{
         iMaxColWidth =  Integer.parseInt(value.toString());
         // transform characters into pixels
         FontMetrics fontMetrics = getFontMetrics(table.getFont());
         int width = fontMetrics.stringWidth("w");
         iMaxColWidth *= width ;
      }
      catch(Exception e) {;}
      return true ;
    } 
    
    //
    // set the prompt
    //
    else if (property == setLOVPrompt) 
    {
      sPrompt = value.toString();
      return true ;
    }

    //
    // set the LOV scheme colors
    //
    else if (property == setLOVScheme) 
    {
      sScheme = value.toString();
      if     (sScheme.equalsIgnoreCase("blue"))   { HeadBGColor = DrawLAF.BLUE_SCHEME ; HeadFGColor = DrawLAF.BLUE_LIGHT ;}
      else if(sScheme.equalsIgnoreCase("gray"))   { HeadBGColor = DrawLAF.GRAY_SCHEME ; HeadFGColor = DrawLAF.GRAY_LIGHT ;}      
      else if(sScheme.equalsIgnoreCase("green"))  { HeadBGColor = DrawLAF.GREEN_SCHEME ; HeadFGColor = DrawLAF.GREEN_LIGHT ;}      
      else if(sScheme.equalsIgnoreCase("orange")) { HeadBGColor = DrawLAF.ORANGE_SCHEME ; HeadFGColor = DrawLAF.ORANGE_LIGHT ;}      
      else if(sScheme.equalsIgnoreCase("purple")) { HeadBGColor = DrawLAF.PURPLE_SCHEME ; HeadFGColor = DrawLAF.PURPLE_LIGHT ;}      
      else if(sScheme.equalsIgnoreCase("red"))    { HeadBGColor = DrawLAF.RED_SCHEME ; HeadFGColor = DrawLAF.RED_LIGHT ;}      
      else if(sScheme.equalsIgnoreCase("silver")) { HeadBGColor = DrawLAF.SILVER_SCHEME ; HeadFGColor = DrawLAF.SILVER_LIGHT ;}      
      else if(sScheme.equalsIgnoreCase("XP"))     { HeadBGColor = DrawLAF.XP_SCHEME ; HeadFGColor = DrawLAF.XP_LIGHT ;}            
      else if(sScheme.equalsIgnoreCase("yellow")) { HeadBGColor = DrawLAF.YELLOW_SCHEME ; HeadFGColor = DrawLAF.YELLOW_LIGHT ;}                  
      else {
          // RGB colors ?
         if(sScheme.indexOf(",") < 0) return true ;
         StringTokenizer st ;
         String s1="", s2="" ;
         Color c1 = null, c2 = null ;
         st = new StringTokenizer(sScheme,",");
         if(st != null && st.hasMoreTokens()) {
            s1 = st.nextToken() ;
            s2 = st.nextToken() ;
            try {
                c1 = ik.makeColor(s1) ;
                c2 = ik.makeColor(s2) ;
                HeadBGColor = c1 ;
                HeadFGColor = c2 ;
            }
            catch(Exception e){;}
        }
      }
      cDialogFore   = HeadBGColor;
      cDialogBack   = HeadFGColor;
      return true ;
    }
    
    //
    // set the reorder flag
    //
    else if (property == setLOVReorderColumns) 
    {
      String s = value.toString();
      if(s.equalsIgnoreCase("true"))       bReorder = true ;
      else if(s.equalsIgnoreCase("false")) bReorder = false ;
      return true ;
    }    
    
    //
    // set the resize flag
    //
    else if (property == setLOVResizeColumns) 
    {
      String s = value.toString();
      if(s.equalsIgnoreCase("true"))       bResize = true ;
      else if(s.equalsIgnoreCase("false")) bResize = false ;
      return true ;
    }        
    
    //
    // set the number of rows
    // returned by the cursor
    //
    else if (property == setLOVNumRows) // set the number of rows
    {
      String s = value.toString();    
      log("setLOVNumRows():"+s);      
      try {
          iNbFetchedRows = Integer.parseInt(s);
          if(iNbFetchedRows > 0) {
            data = null ;
            System.gc();
            data = new Object[iNbFetchedRows][iNbCols] ;          
            iCurLine = iCurRow = 0 ;
            iTotalLines = iNbFetchedRows ;
          }
      }
      catch(Exception e) {System.out.println("setLOVNumRows() invalid argument: "+s);}
      return true ;
    }

    
    //
    // refresh LOV with new data
    //
    else if (property == setLOVRefresh) 
    {
      String s = value.toString().trim();
      int iPage = 0 ;
      log("setLOVRefresh() page:("+s+")");
      try {
          iPage = Integer.parseInt(s);
          if(iPage > 0) {
            iCurPage = iPage ;           
            dm.setDataVector(data,colnames);

            decorateTable() ;
          }
      }
      catch(Exception e) {e.printStackTrace();}//{System.out.println("setLOVRefresh() invalid argument: ("+s+")");}      
      return true ;
    }
    
    //
    // set the array size
    //
    else if (property == setLOVArraySize) // set the number of columns
    {                                  // (nbCols, nbRows)
      String label = value.toString();
      StringTokenizer st ;
      st = new StringTokenizer(label,",");
      int x = Integer.parseInt(st.nextToken()) ;
      int y = Integer.parseInt(st.nextToken()) ;
      iNbCols = ( x > 0 ? x : 1 );
      iNbRows = ( y > 0 ? y : 1 );      
      colnames = new String[iNbCols] ;
      coltypes = new String[iNbCols] ;
      iColWidth = new int[iNbCols] ;
      fColFont  = new Font[iNbCols] ;
      data = null ;
      System.gc();
      data = new Object[iNbRows][iNbCols] ;
      iTotalLines = iNbRows ;
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
    else if (property == setLOVBounds) 
    {
      String label = value.toString();
      StringTokenizer st ;
      st = new StringTokenizer(label,",");
      xPos = Integer.parseInt(st.nextToken()) ;
      yPos = Integer.parseInt(st.nextToken()) ;
      w = Integer.parseInt(st.nextToken()) ;
      h = Integer.parseInt(st.nextToken()) ;     
      log("x="+xPos+" y="+yPos+" w="+w+" h="+h);
      if(w == -1) bAutoWidth = true ;
      else        bAutoWidth = false ;
      return true ;
    }    
    
    //
    // set the selection background color
    //
    else if (property == setLOVSelBackground) 
    {
      SelBGColor = ik.makeColor(value.toString()) ;
      table.setSelectionBackground(SelBGColor);
      return true ;
    }
    
    //
    // set the selection foreground color
    //
    else if (property == setLOVSelForeground) 
    {
      SelFGColor = ik.makeColor(value.toString()) ;
      table.setSelectionForeground(SelFGColor);      
      return true ;
    } 
    
    //    
    // set the header background color
    //
    else if (property == setLOVHeadBG) 
    {
      HeadBGColor = ik.makeColor(value.toString()) ;
      return true ;
    }
    
    //
    // set the header foreground color
    //
    else if (property == setLOVHeadFG) 
    {
      HeadFGColor = ik.makeColor(value.toString()) ;
      return true ;
    }    
    
    //
    // set the header background color
    //
    else if (property == setLOVDataBG) 
    {
      DataBGColor = ik.makeColor(value.toString()) ;
      return true ;
    }
    
    //
    // set the header foreground color
    //
    else if (property == setLOVDataFG) 
    {
      DataFGColor = ik.makeColor(value.toString()) ;
      return true ;
    } 
    
    //
    // set the grid color
    //
    else if (property == setLOVGridFG) 
    {
      GridColor = ik.makeColor(value.toString()) ;
      return true ;
    } 
    
    //
    // can update the table ?
    //
    else if (property == setLOVUpdate) 
    {
      if( value.toString().toUpperCase().equals("TRUE") )
        bUpdatable = true ;
      else
        bUpdatable = false ;
      return true ;
    } 
    
    //
    // raz the values
    //
    else if (property == initLOV) 
    {
      sLOVName = value.toString() ;      
      raz() ;      
      return true ;
    } 
    
    //
    // set the separator character
    //
    else if (property == setLOVSeparator) 
    {
      separator = value.toString() ;
      return true ;
    } 
    
    //
    // get the value of a particular cell
    //
    else if (property == setLOVCellPos) 
    {
      StringTokenizer st ;
      int row, cell ;
      st = new StringTokenizer(value.toString(),",");
      row  = Integer.parseInt(st.nextToken()) ;
      cell = Integer.parseInt(st.nextToken()) ;
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
      table.changeSelection(iRowPos,iCellPos,true,true);
      return true ;
    }     
    
    //
    // set the pointer on a particular row
    //
    else if (property == setLOVRowPos) 
    {
      try{
        iRowPos = Integer.parseInt(value.toString()) ;
      }
      catch(Exception e)
      {
        System.out.println("setRowPos : Unable to set Row position");
        return false ;
      }
      if( (iRowPos < 1) || (iRowPos > table.getRowCount()) ) return false ;
      else iRowPos-- ;
      iCurRow = iRowPos ;
      table.changeSelection(iRowPos,iCellPos,true,true);
      table.setRowSelectionInterval(iRowPos,iRowPos);
      return true ;
    }    
    
    //
    // set the locale
    //
    else if (property == setLOVLocale)     
    {
      try
      {
        locale = new Locale(value.toString());
        Locale.setDefault(locale);
        DecimalSymbols = new DecimalFormatSymbols(locale); 
      }
      catch (Exception e) {System.out.println("Unable to set locale:"+value);}
      return true;
    }
    
    //
    // set the filter
    //
    else if (property == setLOVFilter)     
    {
      String s = value.toString() ; 
      if(s.equals("{NULL}")) sFilter = null ;
      else sFilter = value.toString() ;
      return true;
    }    
    
    //
    // set the decimal separators
    //
    else if (property == setLOVDecimalSeparators)     
    {
      String label = value.toString();
      char c1 = label.charAt(0) ; 
      char c2 = label.charAt(1) ;
      DecimalSymbols.setDecimalSeparator(c1);
      DecimalSymbols.setGroupingSeparator(c2);
      return true ;
    }
    
    //
    // show the JTable
    // 
    else if (property == setLOVShow) 
    {

        String s = value.toString();
        StringTokenizer st ;
        if(s != null && (! s.equalsIgnoreCase("true"))) {
          st = new StringTokenizer(s,",");
          try{
            if(st.hasMoreTokens()) xPos = Integer.parseInt(st.nextToken()) ;
            if(st.hasMoreTokens()) yPos = Integer.parseInt(st.nextToken()) ;
          }
          catch(Exception e){}
        }
        
        if(sScheme.equals("")) sScheme = DrawLAF.Current_Scheme;

        if     (sScheme.equalsIgnoreCase("blue"))   { HeadBGColor = DrawLAF.BLUE_SCHEME ; HeadFGColor = DrawLAF.BLUE_LIGHT ;}
        else if(sScheme.equalsIgnoreCase("gray"))   { HeadBGColor = DrawLAF.GRAY_SCHEME ; HeadFGColor = DrawLAF.GRAY_LIGHT ;}      
        else if(sScheme.equalsIgnoreCase("green"))  { HeadBGColor = DrawLAF.GREEN_SCHEME ; HeadFGColor = DrawLAF.GREEN_LIGHT ;}      
        else if(sScheme.equalsIgnoreCase("orange")) { HeadBGColor = DrawLAF.ORANGE_SCHEME ; HeadFGColor = DrawLAF.ORANGE_LIGHT ;}      
        else if(sScheme.equalsIgnoreCase("purple")) { HeadBGColor = DrawLAF.PURPLE_SCHEME ; HeadFGColor = DrawLAF.PURPLE_LIGHT ;}      
        else if(sScheme.equalsIgnoreCase("red"))    { HeadBGColor = DrawLAF.RED_SCHEME ; HeadFGColor = DrawLAF.RED_LIGHT ;}      
        else if(sScheme.equalsIgnoreCase("silver")) { HeadBGColor = DrawLAF.SILVER_SCHEME ; HeadFGColor = DrawLAF.SILVER_LIGHT ;}      
        else if(sScheme.equalsIgnoreCase("XP"))     { HeadBGColor = DrawLAF.XP_SCHEME ; HeadFGColor = DrawLAF.XP_LIGHT ;}            
        else if(sScheme.equalsIgnoreCase("yellow")) { HeadBGColor = DrawLAF.YELLOW_SCHEME ; HeadFGColor = DrawLAF.YELLOW_LIGHT ;}                  
        
        Object[] objs = new Object[2] ;
        if(bCustomButtons)
        {
          objs[0] = sButton1Label ;
          objs[1] = sButton2Label ;        
        }
        
        cDialogFore   = HeadBGColor;
        cDialogBack   = HeadFGColor;
        
        renderer = new SortButtonRenderer();
        TableColumn tabcol = null ; 
        model = new MyTableModel(data,colnames) ;
        dm.setDataVector(data,colnames);
        table.setModel(dm); 

        decorateTable();
        
        header = table.getTableHeader();
        headListener = new HeaderListener(header,renderer);
        //((SortableTableModel)header.getTable().getModel()).init();            
        headListener.setSortable(isSortable);
        header.addMouseListener(headListener);       

        // set the reorder flag
        table.getTableHeader().setReorderingAllowed(bReorder);
        // set the resize flag
        table.getTableHeader().setResizingAllowed(bResize);
        // set the row height
        if(iRowHeight > 0) table.setRowHeight(iRowHeight);
        
        // column width
        TableColumn tc = null ;
        int iWidth=40;
        for(int i=0; i<colnames.length;i++)
        {
          tc = table.getColumnModel().getColumn(i) ;
          CellProp cp = (CellProp)hCellProps.get(colnames[i].toLowerCase());
          if(cp != null)
          {
             if(cp.iWidth > -1) {
               if(tc.getMinWidth() > cp.iWidth)
                  tc.setMinWidth(cp.iWidth);
               tc.setPreferredWidth(cp.iWidth);
             }
             if(cp.iMinWidth > -1) tc.setMinWidth(cp.iMinWidth);
             if(cp.iMaxWidth > -1) tc.setMaxWidth(cp.iMaxWidth);
             iWidth += tc.getPreferredWidth() + 2 ;
          }
        }

        JMenuItem menuItem = new JMenuItem("Select search column");
        menuItem.addActionListener( new ActionListener() {
          public void actionPerformed(ActionEvent actionEvent) {
           sSearchColumn = colnames[iNextColSearch] ;
           table.getColumnModel().getColumn(iColSearch).setCellRenderer(new CharRenderer(colnames[iColSearch]));
           table.getColumnModel().getColumn(iNextColSearch).setCellRenderer(new CharRenderer(colnames[iNextColSearch],true));
           iColSearch = iNextColSearch ; 
           table.repaint();
           // send new search column to Forms
           // to adapt the SELECT order in the database package
           try{
              CustomEvent ce = new CustomEvent(m_handler, TRG_COL_SEARCH);
              m_handler.setProperty( MSG_LOV_NAME, sLOVName );
              m_handler.setProperty( TRG_COL_SEARCH_NAME, "" + sSearchColumn );
              dispatchCustomEvent(ce);  
           }
           catch (Exception ex)
           {
             ex.printStackTrace();
           }              
         }
        });
        popupMenu.removeAll(); // thanks to tosborn
        popupMenu.add(menuItem);

        // add the listener to the jtable
        MouseListener popupListener = new PopupListener();
        // add the listener specifically to the header
        table.addMouseListener(popupListener);
        table.getTableHeader().addMouseListener(popupListener);        

        iRowsChanged = new int[iNbRows]; 
        
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

        scrollPane.getViewport().setBackground(cDialogBack);

        // if Seperate frame
        if( bSeperateFrame )
        {
          try{
          jtf = new JTextField() ;
          if(null != sFilter)
          {
            jtf.setText(sFilter);
          }
          jtf.setSize(w-10,20);
          jtf.addKeyListener(kl2);
          jp = new JPanel();
          jp.setLayout(new BorderLayout());
          jp.setSize(w,h);
          jp.add(jtf,BorderLayout.NORTH);                    
          jp.add(scrollPane,BorderLayout.CENTER);          
          jp.setBackground(cDialogBack);
          jp.addComponentListener(componentlistener);
          JLabel jbl = null;
          if(sPrompt != null) { 
            jbl = new JLabel(sPrompt);
            jbl.setForeground(cDialogFore.darker());
          }
          jop = null ;
          if(!bCustomButtons)
          {
            jop = new JOptionPane(new Object[] {
			             jbl,
			             jp
		             },
                 JOptionPane.PLAIN_MESSAGE,
                 JOptionPane.OK_CANCEL_OPTION
            );
          }
          else
          {
            jop = new JOptionPane(new Object[] {jbl,jp},
                                 JOptionPane.PLAIN_MESSAGE,
                                 JOptionPane.DEFAULT_OPTION,
                                 null,
                                 objs,
                                 objs[0]
                                 );                         
          }                       
        jop.setBackground(cDialogBack);
        jop.setForeground(cDialogFore);

        //colorize components
        int iNumBt = 0 ;
        for(int i =0; i<jop.getComponentCount();i++) {
            Container cp = (Container)jop.getComponent(i);
            cp.setBackground(cDialogBack);
            for(int j=0;j<cp.getComponentCount();j++)
            {
              if(cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JPanel"))
              {
                JPanel jp = (JPanel)cp.getComponent(j);
                jp.setOpaque(false);
                jp.setBackground(cDialogBack);
                for(int k=0;k<jp.getComponentCount();k++) jp.getComponent(k).setBackground(cDialogBack);
              }
              else if(cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JLabel"))
              {
                  JLabel jlb = (JLabel)cp.getComponent(j);
                  jlb.setBackground(cDialogBack);
              }       
              else if( (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JButton"))
                     ||(cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.plaf.basic.BasicOptionPaneUI$ButtonFactory$ConstrainedButton")) )
              {
                  JButton jb = (JButton)cp.getComponent(j);
                  jb.setForeground(cDialogFore.darker());
                  jb.setBackground(cDialogBack);
                  Font f = jb.getFont();
                  jb.setFont(f.deriveFont(Font.BOLD));
                  if((iNumBt == 0) && (iIcon1 != null)) {
                     jb.setText(null);
                     jb.setForeground(Color.white);
                     jb.setBackground(Color.white);
                     jb.setOpaque(true);
                     jb.setIcon(iIcon1);
                     iNumBt++;
                  }
                  else if((iNumBt > 0) && (iIcon2 != null)) {
                     jb.setText(null);
                     jb.setForeground(Color.white);
                     jb.setBackground(Color.white);
                     jb.setOpaque(true);                     
                     jb.setIcon(iIcon2);
                  }
              }

              else log(cp.getComponent(j).getClass().toString());
            }
        }
                              
	  table.setRowSelectionInterval(0,0) ;

          dlgLOV = jop.createDialog(this, sTitle);
          
          dlgLOV.addComponentListener(new ComponentAdapter(){
              public void componentShown(ComponentEvent e){
                SwingUtilities.invokeLater(new Runnable(){
                  public void run(){
                    jp.requestFocusInWindow();
                    table.requestFocus();
                  }
                });
              }
          });          
          
          dlgLOV.setBounds(xPos,yPos,h,w);
          dlgLOV.setBackground(cDialogBack);
          if(bAutoWidth) dlgLOV.setSize(iWidth,h);
          else           dlgLOV.setSize(w,h);
          dlgLOV.setResizable(true);
          // center to screen
          if(xPos < 0 && yPos < 0) dlgLOV.setLocationRelativeTo(null);
          // center to Forms frame
          else if(xPos == 0 && yPos == 0) dlgLOV.setLocationRelativeTo(this.getParent());
          // locate at exact position
          else dlgLOV.setLocation(xPos, yPos);                    
           
           // display the LOV in its own thread
           try {  
    
              new Thread() 
              {  
                public void run() 
                {  
                  try 
                  {  
                      dlgLOV.setVisible(true);
                      
                    Object selectedValue = jop.getValue();
                    if (selectedValue instanceof Integer && ((Integer)selectedValue).intValue()==JOptionPane.OK_OPTION
                    || selectedValue.toString().equalsIgnoreCase(sButton1Label)) {
                        SendMessage(TRG_WMDC, ""+ getRowValues());
                    }                          
                    data = null ;
              
                  } 
                  catch(Exception e) { e.printStackTrace(); }  
               }  
             }.start(); 
    
            } 
            catch(Exception e) { e.printStackTrace(); }            
          
          }
          catch(Exception e){;}
        }
      return true ;
    }
    
    else if (property == ID.AUTOSCROLL) return true ;
    else
    {
     return super.setProperty(property, value);
    }
  }

   /*------------------------------------------*
    *   create a KeyListener for the table
    *   also used to manage the paging system
    *------------------------------------------*/
   void setKeyListener()
   {
        kl = new KeyListener(){
	       public void keyPressed(KeyEvent e) {
           boolean bFound = false ;
           int key = e.getKeyCode() ;
           log( "Key:    " + key);
           int modifiersEx;           
           if(System.getProperty("java.version").startsWith("1.3"))
             modifiersEx = e.getModifiers();
           else
             modifiersEx = e.getModifiersEx();
           log("ActionKey:"+e.isActionKey()+"  modifier:"+modifiersEx); 

           switch(key)
           {
             case KeyEvent.VK_PAGE_DOWN: 
                if(iCurRow + iLinesPerPage > iTotalLines) {
                  iSens = 1 ;
                  setPageRequest(iCurPage + 1);
                }  
                break;
             case KeyEvent.VK_PAGE_UP: 
                if(((iCurRow - iLinesPerPage) < 1) && iCurPage > 1 ) {
                  iSens = -1 ;
                  setPageRequest(iCurPage - 1);
                }  
                break;
             case KeyEvent.VK_HOME: 
               if(modifiersEx != KeyEvent.CTRL_DOWN_MASK)
               {
                 iCurCell = 0 ; 
               }  
               break ;
             case KeyEvent.VK_END: 
               if(modifiersEx != KeyEvent.CTRL_DOWN_MASK)
               {               
                 iCurCell = table.getColumnCount()-1 ; 
               }  
               break ;
             case KeyEvent.VK_UP: 
                if(iCurRow >= 0) 
                { 
                if(((iCurRow - 1) < 0) && iCurPage > 1 ) {
                  iSens = -1 ;
                  setPageRequest(iCurPage - 1);
                  e.consume();
                }  
                 // iCurRow-- ; 
                } break ;
             case KeyEvent.VK_DOWN: 
                if(iCurRow + 1 > (table.getRowCount()-1)) {
                  iSens = 1 ;
                  setPageRequest(iCurPage + 1);
                  e.consume();                  
                }  
                break ;
             case KeyEvent.VK_RIGHT:
                  if(iCurCell < table.getColumnCount()-1) 
                  { 
                    iCurCell++ ; 
                  }
                  break ;
             case KeyEvent.VK_LEFT:
                  if(iCurCell > 0)
                  { 
                    iCurCell-- ; 
                  }
                  break ;
             case KeyEvent.VK_ENTER:
                  SendMessage(TRG_WMDC, ""+ getRowValues());
                  dlgLOV.setVisible(false);
                  break ;

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
                       }
                       catch ( Exception ex ){ System.out.println("* LAF * Unable to send key to Forms");}                
                  }
                  else if ( ! e.isActionKey() 
                     && key != KeyEvent.VK_ENTER
                     && key != KeyEvent.VK_CANCEL
                     && key != KeyEvent.VK_ESCAPE                     
                     ) {
                      // find the row in the JTable
                      log("Searching in current selection..."); 
                      String s = "" + e.getKeyChar();
                      if( (key >= KeyEvent.VK_A) && (key <= KeyEvent.VK_Z)) jtf.setText(s);
                      String s2 = "" ;
                      int n = dm.getRowCount();
                      int[] indexes = dm.getIndexes();
                      for (int i=0; i< table.getRowCount(); i++) {
                          s2 = (String)(data[indexes[i]][iColSearch].toString().toLowerCase()) ;
                          if(s2.startsWith(s.toLowerCase())) {
                              log("LAF LOV row found on row:"+i);
                              bFound = true ;
                              iCurRow = i ;
                              table.setRowSelectionInterval(iCurRow, iCurRow);
                              table.scrollRectToVisible(
                                  new Rectangle(0,
                                                table.getRowHeight()*(iCurRow),
                                                0,
                                                table.getRowHeight()));                              
                              break;
                          }
                      }
                      // value found ?
                      if(! bFound && ( (key >= KeyEvent.VK_A) && (key <= KeyEvent.VK_Z))) {
                          // have to request another set from the database ?
                          log("Not found in current selection - requesting new page for:"+s+"%"); 
                          try{
                            iSens = 1 ;
                            iCurPage = 1 ;
                            CustomEvent ce = new CustomEvent(m_handler, TRG_VALUE_SEARCH);
                            m_handler.setProperty( MSG_LOV_NAME, sLOVName );
                            m_handler.setProperty( TRG_VALUE, "" + s + "%" );
                            dispatchCustomEvent(ce);  
                           }
                           catch (Exception ex)
                           {
                             ex.printStackTrace();
                           }                                     
                      }
                  }
           }
           }
           public void keyReleased(KeyEvent e) {
           }
           public void keyTyped(KeyEvent e) {
           }
        };             
   }
   

   /*--------------------------------------------*
    *   create a KeyListener for the text field
    *--------------------------------------------*/
   void setTextKeyListener()
   {
        kl2 = new KeyListener(){
	       public void keyPressed(KeyEvent e) {
           boolean bFound = false ;
           int key = e.getKeyCode() ;
           String s = null ;
           log( "Key2:    " + key);
           int modifiersEx;           
           if(System.getProperty("java.version").startsWith("1.3"))
             modifiersEx = e.getModifiers();
           else
             modifiersEx = e.getModifiersEx();
           log("ActionKey:"+e.isActionKey()+"  modifier:"+modifiersEx); 

           if(key == KeyEvent.VK_ENTER)
           {

                  s = jtf.getText() ;

                  // searching in the current selection
                  log("Searching in current selection..."); 
                  String s2 = "" ;
                  int n = dm.getRowCount();
                  int[] indexes = dm.getIndexes();
                  for (int i=0; i< iNbRows; i++) {
                      try {
                      s2 = (String)(data[indexes[i]][iColSearch].toString().toLowerCase()) ;
                      if(s2.startsWith(s.toLowerCase())) {
                          log("LAF LOV row found on row:"+i);
                          bFound = true ;
                          iCurRow = i ;
                          table.setRowSelectionInterval(iCurRow, iCurRow);
                          table.scrollRectToVisible(
                              new Rectangle(0,
                                            table.getRowHeight()*(iCurRow),
                                            0,
                                            table.getRowHeight()));                              
                          break;
                      }
                      } catch(Exception ex){}
                  }

                  iSearchLength = s.length() ;
                  // value found ?
                  if(! bFound) {
                      // have to request another set from the database ?
                      log("Not found in current selection - requesting new page for:"+s+"%"); 
                      try{
                        iSens = 1 ;
                        iCurPage = 1 ;
                        CustomEvent ce = new CustomEvent(m_handler, TRG_VALUE_SEARCH);
                        m_handler.setProperty( MSG_LOV_NAME, sLOVName );
                        m_handler.setProperty( TRG_VALUE, "" + s + "%" );
                        dispatchCustomEvent(ce);  
                       }
                       catch (Exception ex)
                       {
                         ex.printStackTrace();
                       }                                     
                  }                  
                  e.consume();
                  table.requestFocus() ;

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
            int iButton = 1 ;
            if(System.getProperty("java.version").startsWith("1.3"))
              iButton = 1 ;
            else
              iButton = me.getButton() ;
            if(me.getClickCount() > 1)
              // send multiple click event
              {
              SendMessage(TRG_WMDC, ""+ getRowValues());
              log("*LAF_LOV Double-click");
              dlgLOV.setVisible(false);
              }
            
          }
          public void mouseEntered (MouseEvent me) {}
          public void mousePressed (MouseEvent me) 
          {
           //int iBut = me.getButton() ;
           int iRow = table.rowAtPoint(me.getPoint());
           int iCell = table.columnAtPoint(me.getPoint());
           if(iRow != iCurRow)
           {
             iCurRow = iRow ;
           }
           if(iCell != iCurCell)
           {
             iCurCell = iCell ;
           }           
           log( "Row:  " + iCurRow );
           log( "Col:  " + iCurCell );
          }
          public void mouseReleased (MouseEvent me) {} 
          public void mouseExited (MouseEvent me) {} 
        };     
   }
   
   /*-----------------------*
    *  Get the properties
    *-----------------------*/
    public Object getProperty(ID pId) // Get the current cell value
    {
      //
      // get the current cell value
      //
      if (pId == getLOVCellVal)
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
          if(coltypes[iCellPos].equalsIgnoreCase("DATE"))
          {
            //Date d = (Date)data[iRowPos][iCellPos] ;
            //sValue += df.format(d);
            sValue +=  data[iRowPos][iCellPos];
          }
          else if(coltypes[iCellPos].equalsIgnoreCase("NUMBER"))
          {
            Double f = (Double)data[iRowPos][iCellPos] ;
            if(f == null) sValue += "null";
            else 
            {
              if(data[iRowPos][iCellPos] instanceof Long) db = Double.valueOf(data[iRowPos][iCellPos].toString());
              else db = (Double)data[iRowPos][iCellPos] ;
              sValue += nf.format(db);
            }  
          }
          else if(!coltypes[iCellPos].equalsIgnoreCase("IMAGE"))
            sValue += data[iRowPos][iCellPos] ; 
          return "" + sValue ;    
        }  
        return "" ;
      }
      
      //
      // get the current row values
      //
      else if (pId == getLOVRowVal) 
      {
        return getRowValues() ;
      }      
      
      //
      // get the list of updated rows
      //
      else if (pId == GETROWSCHANGED) 
      {
        // stop cell edtiting
        if (table.isEditing())
        {
          table.getCellEditor().stopCellEditing();
        }  
        boolean bFirst = true ;
        StringBuffer sb = new StringBuffer();
        for(int i=0 ; i<iRowsChanged.length;i++)
        {
          if(iRowsChanged[i] > 0)
          {
           if(bFirst) {bFirst=false ;sb.append(""+i);}
           else sb.append(","+i);
          }
        }
        return sb.toString() ;
      }
      else
      {
        return super.getProperty(pId);
      }
    } 


   /*-----------------------------
    *  get the current row values
    *----------------------------*/
   String getRowValues() {
        StringBuffer sb = new StringBuffer();
        DateFormat df = new SimpleDateFormat(sDateFormat);
        DecimalFormat nf = new DecimalFormat(sNumFormat,DecimalSymbols);
        Double db = null ;
        int[] indexes = dm.getIndexes();
        int iCurRow2 = indexes[iCurRow];
        if( iCurRow2 > -1 )
        {
          // stop cell edtiting
          if (table.isEditing())
          {
            table.getCellEditor().stopCellEditing();
          }  
          for( int i=0 ; i<table.getColumnCount(); i++ )
          {
            db = null ;
            CellProp cp = getCellProp(i) ;
            if( (i>0) && (!coltypes[i].equalsIgnoreCase("IMAGE"))) sb.append(separator);
            sb.append("<"+colnames[i].toUpperCase()+">");
            if(coltypes[i].equalsIgnoreCase("DATE"))
            {
              sb.append(data[iCurRow2][i]);
              /*
              if(cp.sFormat != null) df = new SimpleDateFormat(cp.sFormat);
              else df = new SimpleDateFormat(sDateFormat);
              if(data[iCurRow2][i] == null) sb.append("null");
              else
              {
                Date d = (Date)data[iCurRow2][i] ;
                sb.append(df.format(d));
              } 
              */
            }
            else if(coltypes[i].equalsIgnoreCase("NUMBER"))
            {
              if(cp.sFormat != null) nf = new DecimalFormat(cp.sFormat,DecimalSymbols);
              else nf = new DecimalFormat(sNumFormat,DecimalSymbols);
              if(data[iCurRow2][i] == null || data[iCurRow2][i].equals(" ")) sb.append("null");
              else 
              {
                if(data[iCurRow2][i] instanceof Long) db = Double.valueOf(data[iCurRow2][i].toString());
                else db = (Double)data[iCurRow2][i] ;
                sb.append(nf.format(db));
              }  
            }
            else if(!coltypes[i].equalsIgnoreCase("IMAGE")) 
            {
              sb.append(data[iCurRow2][i]);
            }  
          }
        }  
        return sb.toString();       
   }
    /*----------------------*
     *  reset the variables
     *----------------------*/
    public void raz()
    {
        log("*** raz ***");
        xPos=-1; yPos=-1; w=500; h=100 ;
        iNbRows = 0; iNbCols = 0 ;
        iCurLine = 0 ;
        iRowPos = iCellPos = 0 ;
        iCurCell = iCurRow = 0 ;
        sTitle = "" ; separator = "^" ;
        DataBGColor=  DataFGColor =  GridColor = null ;
        HeadBGColor = DrawLAF.SILVER_SCHEME ;
        HeadFGColor = DrawLAF.SILVER_LIGHT ;
        bSeperateFrame = true ;
        bUpdatable = false ;
        sFilter = null ;
    }


 /*---------------------------------------
  *  TableModel class to allow updates
  *--------------------------------------*/
 class MyTableModel extends AbstractTableModel {


        private String[] columnNames = {" "};
        private Object[][] datas = {{" "," "}};
        
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
            CellProp cp = (CellProp)hCellProps.get(colnames[col].toLowerCase());
            if (!cp.bEnabled) {
                return true;
            } else {
                return false;
            }
        }

        public void setValueAt(Object value, int row, int col) {
            datas[row][col] = value;
            iRowsChanged[row] = 1 ;
        }
        
        private void printDebugData() {
            int numRows = getRowCount();
            int numCols = getColumnCount();

            for (int i=0; i < numRows; i++) {
                log("    row " + i + ":");
                for (int j=0; j < numCols; j++) {
                    log("  " + data[i][j]);
                }
                log("");
            }
            log("--------------------------");
        }

    }

  
  /*-------------------------------
   *  send message back to Forms
   *------------------------------*/
  public void SendMessage( ID id1, String sMessage )
  {
    try{
      CustomEvent ce = new CustomEvent(m_handler, id1);
      m_handler.setProperty( MSG_LOV_NAME, sLOVName );
      m_handler.setProperty( TABLE_EVENT_MSG, sMessage );
      dispatchCustomEvent(ce);  
    }
    catch (Exception e)
    {
      e.printStackTrace();
    }    
  }

    
  void log(String sMessage)
  {
    if(bLog) System.out.println(sMessage);
  }

  class ImageTableRenderer extends DefaultTableCellRenderer {
    public Component getTableCellRendererComponent
    (
       JTable table,
       Object value,
       boolean isSelected,
       boolean hasFocus,
       int row,
       int column
    ) 
    {
      ImageIcon icon = (ImageIcon)value;
      if(icon != null)
      {
        setIcon(icon);
        setSize(icon.getIconWidth(),icon.getIconHeight());
        setHorizontalAlignment(SwingConstants.LEFT);
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
      
       // colorize each every row
       public Component getTableCellRendererComponent(
                   JTable table,
                   java.lang.Object value,
                   boolean isSelected,
                   boolean hasFocus,
                   int row, int column) {
          if( !isSelected ) {
             Color c = table.getBackground();
             if( (row%2)==0 )
                setBackground(cDialogBack);
             else
                setBackground(c);
          }
          return super.getTableCellRendererComponent( table,
                                    value,isSelected,hasFocus,row,column);
       }      
  
      public void setValue(Object value) {
          String s = "" ;
          setHorizontalAlignment(RIGHT);
          if(sColName != null)
          {
            CellProp cp = (CellProp)hCellProps.get(sColName.toLowerCase());
            if(cp != null)
            {
              if(cp.cBack != null) setBackground(cp.cBack);
              if(cp.cFore != null) setForeground(cp.cFore);
              if(cp.iAlign != -1)  setHorizontalAlignment(cp.iAlign);
              if(cp.fFont != null) setFont(cp.fFont);
            }
          }
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
  }

    /*---------------------------
     *  set the Char renderer
     *-------------------------*/  
    class CharRenderer extends DefaultTableCellRenderer {
        String sFormat  = sIntFormat ;
        String sColName = null ;
        boolean bBorder = false ;
        
        public CharRenderer() { super(); }
        
        public CharRenderer(String sCol) 
        { 
          super(); 
          this.sColName = sCol ;
        }
        
        public CharRenderer(String sCol, boolean b) 
        { 
          super(); 
          this.sColName = sCol ;
          this.bBorder  = b ;
        }        

        public void setValue(Object value) {
            String s = "" ;
            setHorizontalAlignment(LEFT);
            if(sColName != null)
            {
              CellProp cp = (CellProp)hCellProps.get(sColName.toLowerCase());
              if(cp != null)
              {
                if(cp.cBack != null) setBackground(cp.cBack);
                if(cp.cFore != null) setForeground(cp.cFore);
                if(cp.iAlign != -1)  setHorizontalAlignment(cp.iAlign);
                if(cp.fFont != null) setFont(cp.fFont);
              }
              else{System.out.println("--> CharRenderer.setValue "+sColName+" cp not found ***");}
            }
            else{System.out.println("--> CharRenderer.setValue : sColName = NULL ***");}
            s = (value == null) ? "" : value.toString() ;
            
            // set border on the search column
            if(bBorder) setBorder(BorderFactory.createRaisedBevelBorder());
            
            setText((value == null) ? "" : s);
        }
        
       // colorize each every row
       public Component getTableCellRendererComponent(
                   JTable table,
                   java.lang.Object value,
                   boolean isSelected,
                   boolean hasFocus,
                   int row, int column) {
          if( !isSelected ) {
             Color c = table.getBackground();
             if( (row%2)==0 )
                setBackground(cDialogBack);
             else
                setBackground(c);
          }
          return super.getTableCellRendererComponent( table,
                                    value,isSelected,hasFocus,row,column);
       }
        
    }
 
    /*---------------------------
     *  set the Date renderer
     *-------------------------*/  
    class DateRenderer extends DefaultTableCellRenderer {
        String sFormat  = sIntFormat ;
        String sColName = null ;
        boolean bBorder = false ;
        
        public DateRenderer() { super(); }
        
        public DateRenderer(String sCol) 
        { 
          super(); 
          this.sColName = sCol ;
        }
        
        public DateRenderer(String sCol, boolean b) 
        { 
          super(); 
          this.sColName = sCol ;
          this.bBorder  = b ;
        }        

        public void setValue(Object value) {
            String s = "" ;
            setHorizontalAlignment(CENTER);
            if(sColName != null)
            {
              CellProp cp = (CellProp)hCellProps.get(sColName.toLowerCase());
              if(cp != null)
              {
                if(cp.cBack != null) setBackground(cp.cBack);
                if(cp.cFore != null) setForeground(cp.cFore);
                if(cp.iAlign != -1)  setHorizontalAlignment(cp.iAlign);
                if(cp.fFont != null) setFont(cp.fFont);
              }
              else{System.out.println("--> DateRenderer.setValue "+sColName+" cp not found ***");}
            }
            else{System.out.println("--> DateRenderer.setValue : sColName = NULL ***");}
            s = (value == null) ? "" : value.toString() ;
            
            // set border on the search column
            if(bBorder) setBorder(BorderFactory.createRaisedBevelBorder());
            
            setText((value == null) ? "" : s);
        }
        
       // colorize each every row
       public Component getTableCellRendererComponent(
                   JTable table,
                   java.lang.Object value,
                   boolean isSelected,
                   boolean hasFocus,
                   int row, int column) {
          if( !isSelected ) {
             Color c = table.getBackground();
             if( (row%2)==0 )
                setBackground(cDialogBack);
             else
                setBackground(c);
          }
          return super.getTableCellRendererComponent( table,
                                    value,isSelected,hasFocus,row,column);
       }
        
    }
 

  /*-----------------------------------
   *  Class to render the Date values
   *----------------------------------*/
  class DateColumnFormat{ 
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
          public DateRenderer() { 
              super();
          } 

      public void setValue(Object value) { 
              setHorizontalAlignment(CENTER);
              if(sColName != null)
              {
                CellProp cp = (CellProp)hCellProps.get(sColName.toLowerCase());
                if(cp != null)
                {
                  if(cp.cBack != null) setBackground(cp.cBack);
                  if(cp.cFore != null) setForeground(cp.cFore);
                  if(cp.iAlign != -1)  setHorizontalAlignment(cp.iAlign);
                  if(cp.fFont != null) setFont(cp.fFont);
                }
              }
              setText((value == null) ? "" : ""+value) ; //formatterR.format(value)); 
          } 
      } 

      private class DateEditor extends DefaultCellEditor { 
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
          public NumRenderer() { 
              super();
          } 

      public void setValue(Object value) { 
              setHorizontalAlignment(RIGHT);
              if(sColName != null)
              {
                CellProp cp = (CellProp)hCellProps.get(sColName.toLowerCase());
                if(cp != null)
                {
                  if(cp.cBack != null) setBackground(cp.cBack);
                  if(cp.cFore != null) setForeground(cp.cFore);
                  if(cp.iAlign != -1)  setHorizontalAlignment(cp.iAlign);
                  if(cp.fFont != null) setFont(cp.fFont);
                }
              }
              setText((value == null) ? "" : formatterR.format(value)); 
          } 
      } 

      private class NumEditor extends DefaultCellEditor { 
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


    /*-----------------------------------------*
     *   Object to handle cell properties      *
     *-----------------------------------------*/
    class CellProp extends Object 
    {
        public String      sName        = "" ;
        public String      sHeader      = null ;        
        public boolean     bEnabled     = true ;
        public boolean     bResize      = true ;        
        public String      sFormat      = null ;
        public int         iAlign       = -1 ;
        public int         iWidth       = -1 ;
        public int         iMinWidth    = -1 ;
        public int         iMaxWidth    = iMaxColWidth ;
        public int         iHeight      = -1 ;        
        public Color       cBack        = null ;
        public Color       cFore        = null ;
        public Font        fFont        = null ;
        public boolean     bSearch      = false ;
        
        CellProp(String s) { 
           this.sName = s ; 
        }
    }    

    CellProp getCellProp( int iNumCol )
    {
      String sColName = colnames[iNumCol].toLowerCase() ;
      return (CellProp)hCellProps.get(sColName);
    }
    
    /*------------------------------
     *  Table selection listener
     *  ------------------------
     *  used to get the current row
     *  and manage the pagination
     *-----------------------------*/
    class SharedListSelectionHandler implements ListSelectionListener {
            public void valueChanged(ListSelectionEvent e) { 
                ListSelectionModel lsm = (ListSelectionModel)e.getSource();
                boolean bFetch = false ;
                int     iPage = iCurPage ;
                iCurRow = lsm.getMinSelectionIndex() ;
            }
        }

    public void focusGained(FocusEvent e)
     {
         if (e.getComponent() == this)
         {
             table.requestFocus();
         }
    
         try
         {
             m_handler.setProperty(FOCUS_EVENT, e);
         }
         catch ( Exception ex ){}
     }
    
    
     public void focusLost(FocusEvent e)
     {
     }  

      /*
       * class to handle the Header Popup Menu
       */
      class PopupListener extends MouseAdapter {
        public void mousePressed(MouseEvent e) {
          iNextColSearch = table.getTableHeader().columnAtPoint(e.getPoint());
          showPopup(e);
        }
    
        public void mouseReleased(MouseEvent e) {
          showPopup(e);
        }
    
        private void showPopup(MouseEvent e) {
          if (e.isPopupTrigger()) {
            popupMenu.show(e.getComponent(), e.getX(), e.getY());
          }
        }
      }



  class HeaderListener extends MouseAdapter {
    JTableHeader   header;
    SortButtonRenderer renderer;
    boolean isSortable = true;
  
    HeaderListener(JTableHeader header,SortButtonRenderer renderer) {
      this.header   = header;
      this.renderer = renderer;
    }
  
    public void mousePressed(MouseEvent e) {
      if(e.getButton() != MouseEvent.BUTTON1 || (! isSortable)) return ;
      int col = header.columnAtPoint(e.getPoint());
      int sortCol = header.getTable().convertColumnIndexToModel(col);
      int iWidth=0, iPointX=0;
      TableColumn tc=null ;
      boolean bResize = false ;
      // right border of buttons
      int ti[] = new int [header.getColumnModel().getColumnCount()];
      for(int i=0; i<header.getColumnModel().getColumnCount(); i++) {
        iWidth += header.getColumnModel().getColumn(i).getWidth();
        ti[i] = iWidth ;
      }  
      String sOrder = null ; 
      iWidth=0; iPointX = e.getPoint().x ;
      
      // do not sort the column
      // while resizing
      for(int i=0; i<header.getColumnModel().getColumnCount(); i++) {
        if( (iPointX >= ti[i]-5) && (iPointX <= ti[i]+5) ) {
          bResize = true ;
          break ;
        }
      }

      if(!bResize) {
        renderer.setPressedColumn(col);
        renderer.setSelectedColumn(col);
        header.repaint();
        
        if (header.getTable().isEditing()) {
          header.getTable().getCellEditor().stopCellEditing();
        }
  
        //boolean isAscent;
        if (SortButtonRenderer.DOWN == renderer.getState(col)) {
          isAscent = true;
          sOrder = " ASC " ;
        } else {
          isAscent = false;
          sOrder = " DESC " ;
        }
        ((SortableTableModel)header.getTable().getModel()).sortByColumn(sortCol, isAscent);    
         // send new ORDER BY to Forms
         // to adapt the SELECT in the database package
          try{
            CustomEvent ce = new CustomEvent(m_handler, TRG_ORDER_BY);
            m_handler.setProperty( MSG_LOV_NAME, sLOVName );
            m_handler.setProperty( TRG_ORDER_BY_VALUE, "" + (col+1) + sOrder );
            dispatchCustomEvent(ce);  
           }
           catch (Exception ex)
           {
             ex.printStackTrace();
           }        
      }     
    }
  
    public void mouseReleased(MouseEvent e) {
      if(! isSortable ) return ;
      int col = header.columnAtPoint(e.getPoint());
      renderer.setPressedColumn(-1);  // clear
      header.repaint();
    }
    
    public void setSortable(boolean bSort){
        isSortable = bSort;
        log("sortable: "+isSortable);
    }
  }


    /*----------------------------------------------------*
     *   Component listener for the scrollPane / JTable   *
     *----------------------------------------------------*/
    ComponentListener componentlistener = new ComponentListener() {
      public void componentHidden(ComponentEvent e) {
      }

      public void componentMoved(ComponentEvent e) {
      }

      public void componentResized(ComponentEvent e) {
        iLinesPerPage = 1 + (int)(scrollPane.getHeight()/table.getRowHeight()) ;
      }

      public void componentShown(ComponentEvent e) {
        iLinesPerPage = 1 + (int)(scrollPane.getHeight()/table.getRowHeight()) ;
      }

      private void dump(String type, ComponentEvent e) {
        System.out.println(e.getComponent().getName() + " : " + type);
      }
    };
    
   /*-----------------------*
    *   JTable decoration   *
    *-----------------------*/
   void decorateTable() {

        TableColumnModel model = table.getColumnModel();
        int n = colnames.length;
        for (int i=0;i<n;i++) {
           model.getColumn(i).setHeaderRenderer(renderer);
        } 
        iCurLine = iCurRow = iCurCell = 0 ;
            
        TableColumn tabcol = null ; 
        // set special cell format
        for(int z=0; z<colnames.length; z++)
        {
          CellProp cp = getCellProp(z) ;
          tabcol = table.getColumnModel().getColumn(z) ;
          // adjust cell width
          tabcol.setPreferredWidth(iColWidth[z]+15);
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
            if(cp.sHeader != null) tabcol.setHeaderValue(cp.sHeader);
            tabcol.setResizable(cp.bResize);
          }
          if(cp.sFormat != null)
          {
            log("set format for "+colnames[z]+" format:"+cp.sFormat);
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
              //tabcol.setCellRenderer(dateColumnFormat.getRenderer());
              tabcol.setCellRenderer(new DateRenderer(colnames[z]));
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
          }
          if(z == iColSearch) tabcol.setCellRenderer(new CharRenderer(colnames[z],true));
        }


        table.setBackground(HeadFGColor.brighter());
        table.setForeground(HeadBGColor.darker());
        table.setSelectionBackground(HeadBGColor.darker());
        table.setSelectionForeground(HeadFGColor.brighter());
        scrollPane.setBackground(HeadFGColor.brighter());
        
        if( HeadBGColor != null )
          table.getTableHeader().setBackground(HeadFGColor);
        if( HeadFGColor != null )          
          table.getTableHeader().setForeground(HeadFGColor);
        if( DataBGColor != null )
          table.setBackground(DataBGColor);
        if( DataFGColor != null )          
          table.setForeground(DataFGColor);          
        if( GridColor != null )                    
          table.setGridColor(GridColor);
        table.setEnabled(true);
        table.setRowSelectionAllowed(true);
        iCurRow = iCurCell = 0 ;
        if(iSens == 1) {
          table.scrollRectToVisible(
                  new Rectangle(0,
                                table.getRowHeight()*(iCurRow),
                                0,
                                table.getRowHeight()));
          table.setRowSelectionInterval(0,0) ;
        }
        else {
          table.scrollRectToVisible(
                  new Rectangle(0,
                                table.getRowHeight()*(iTotalLines),
                                0,
                                table.getRowHeight()));                                                  
          table.setRowSelectionInterval(table.getRowCount()-1,table.getRowCount()-1) ;
        }
        table.invalidate();
   }
   
   /*-----------------------*
    *   new page request    *
    *-----------------------*/
    void setPageRequest( int iPage ) {
          try{
            CustomEvent ce = new CustomEvent(m_handler, TRG_PAGE);
            m_handler.setProperty( MSG_LOV_NAME, sLOVName );
            m_handler.setProperty( TRG_NUM_PAGE, ""+iPage );
            dispatchCustomEvent(ce);  
          }
          catch (Exception ex)
          {
            ex.printStackTrace();
          }          
    }
   
}

