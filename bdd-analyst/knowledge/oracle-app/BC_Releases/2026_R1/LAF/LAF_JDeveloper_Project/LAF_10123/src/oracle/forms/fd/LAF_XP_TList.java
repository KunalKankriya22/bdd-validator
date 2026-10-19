package oracle.forms.fd;

import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Component;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Insets;
import java.awt.Point;
import java.awt.Rectangle;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;

import java.net.URL;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.SortedSet;
import java.util.StringTokenizer;
import java.util.TreeSet;

import javax.swing.AbstractListModel;
import javax.swing.DefaultListModel;
import javax.swing.JLabel;
import javax.swing.JList;
import javax.swing.JScrollPane;
import javax.swing.ListCellRenderer;
import javax.swing.ListSelectionModel;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.border.AbstractBorder;
import javax.swing.border.Border;
import javax.swing.event.ListDataEvent;
import javax.swing.event.ListDataListener;
import javax.swing.event.ListSelectionEvent;
import javax.swing.event.ListSelectionListener;

import oracle.forms.handler.IHandler;
import oracle.forms.properties.ID;
import oracle.forms.ui.VTList;


/**
 * A XP like TList
 *
 * @author   Francois Degrelle
 * creation  february 2007
 * @version  1.6
 *
 * modified  June 2009 : bug correction on values selected
 *                       and background/foreground color
 *                       for enhanced Tlist
 */
     
public class LAF_XP_TList extends VTList implements FocusListener
{
  private static final ID SETIMAGEON        = ID.registerProperty("SET_IMAGE_ON");
  private static final ID SETDEBUG          = ID.registerProperty("SET_DEBUG");
  private static final ID SETCOLOR          = ID.registerProperty("SET_COLOR");  
  private static final ID setScheme         = ID.registerProperty("SET_SCHEME");    
  private static final ID setSorted         = ID.registerProperty("SET_SORTED_LIST");    
  private static final ID getSorted         = ID.registerProperty("GET_SORTED_LIST");      
  private static final ID setEnhanced       = ID.registerProperty("SET_ENHANCED");    
  private static final ID setEnhancedAll    = ID.registerProperty("SET_ENHANCED_ALL");      
  private static final ID setMaxRows        = ID.registerProperty("SET_MAX_ROWS");  
  private static final ID setTimeKeySel     = ID.registerProperty("SET_TIME_KEY_SELECT");    
  private static final ID multiSelection    = ID.registerProperty("SET_MULTI_SELECTION");  
  private static final ID getMultiSelect    = ID.registerProperty("GET_MULTI_SELECTION");    
  private static final ID listSelection     = ID.registerProperty("GET_LIST_SELECTION");  
  private static final ID listOrientation   = ID.registerProperty("SET_LIST_ORIENTATION");    
  private static final ID getOrientation    = ID.registerProperty("GET_LIST_ORIENTATION");    
  private static final ID clearSelection    = ID.registerProperty("CLEAR_LIST_SELECTION");    
  // mouse events
  public final static ID pSetEvent         = ID.registerProperty("ENABLE_EVENTS");
  public final static ID pItemName         = ID.registerProperty("ITEM_NAME");    
  public final static ID pItemValue        = ID.registerProperty("ITEM_VALUE");    
  public final static ID pItemSelection    = ID.registerProperty("ITEM_SELECTION");    
  public final static ID pSetMouseEvents   = ID.registerProperty("SET_MOUSE_EVENTS");  
  public final static ID pEventMouseEvent  = ID.registerProperty("MOUSEEVENT_MESSAGE");  
  public final static ID pEventMouseMsg    = ID.registerProperty("MOUSE_EVENT");      

  private final String    CLASSNAME         = this.getDefaultName();
  private DrawLAF   dBean;  
  private IHandler  m_handler;
  private String    sSelection   = "" ;
  private String    sSeparator   = "," ;
  private boolean   bMultiSel    = true ;
  // standard list
  private boolean   bFocus       = false ;
  private boolean   bRollover    = false ;  
  private boolean   bSelect      = false ;    
  private Rectangle stdRect      = new Rectangle() ;
  private int       iNbRows      = 0 ;
  // enhanced JList
  private boolean   beFocus      = false ;
  private boolean   beRollover   = false ;  
  private boolean   beParent     = false ;      
  private boolean   bSorted      = false ;
  private boolean   bEnabled     = true ;  
  private int       iOrient      = JList.VERTICAL ;
  private int       iIndex       = 0 ;
  protected Color   cFocus       = DrawLAF.cFocus != null ? DrawLAF.cFocus : new Color(255,214,47);
  protected Color   cListFocus   = cFocus;  
  protected Color   cGreenXP     = new Color(0,230,0) ;
  protected ListSelectionModel listSelectionModel ;
  protected JScrollPane scrollingList = null ;
  private SortedListModel smodel = new SortedListModel();
  private DefaultListModel model = new DefaultListModel() ;
  static protected Color cSelect = DrawLAF.cSelect != null ? DrawLAF.cSelect : new Color(0,230,0) ;
  private boolean   bDisplay     = false ;
  private URL       m_codeBase;
  private static boolean bDebug  = false;
  private int       iMaxRows     = 6 ;
  // millisecond between two key hits
  private int       iTimeKeySel  = 100 ; 
  // adds
  public JList     list ;
  private boolean   bFirst       = true ;
  private LAF_XP_TList pl        = this ;
  // font
  private Font      normalFont   = null ;
  private Font      selectFont   = null ;
  private ImageKit  ik           = new ImageKit();
  
  // mouse events
  private String      sItemName    = null ;
  private boolean     bSendEvents  = false ;
  private boolean     bMouseEnter  = false ;
  private boolean     bMouseClick  = false ;
  private boolean     bMouseExit   = false ;   
  private List        list_msg     = new ArrayList(10) ;    

  // constructor
  public LAF_XP_TList()
  {
    super();
    if(DrawLAF.bSystemLookAndFeel)
    {
        try
          {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            SwingUtilities.updateComponentTreeUI(this);
          }
        catch (Exception ex)
          {
            ex.printStackTrace();
          }       
    }
  }

  public void init(IHandler handler)
  {
    m_handler = handler;
    m_codeBase = handler.getCodeBase();
    super.init(handler);
    addMouseListener(new ButtonMouseAdapter());
    addFocusListener(this);
    DrawLAF.add_PJC("LAF_XP_TList", this) ;
    if(DrawLAF.bMultiSelect) bMultiSel = true ;
  }
  
    public void destroy() {
        dBean = null ;
    }

    void setLAFBean (DrawLAF DF) { dBean = DF ;}    
    DrawLAF getLAFBean() { return dBean; }   

  /*---------------------------------------------*
   *   paint either the standard poplist or the
   *   Swing corresponding component
   *---------------------------------------------*/
  public void paint(Graphics g)
  {
      /*
       *  colorize the scrollbar background
       */
      Component [] cp = this.getComponents() ;
      for(int i=0; i<cp.length;i++)
      {
        if(cp[i].getClass().getName().equalsIgnoreCase("oracle.ewt.scrolling.scrollBox.ScrollBox"))
        {
          oracle.ewt.scrolling.scrollBox.ScrollBox sb = (oracle.ewt.scrolling.scrollBox.ScrollBox)cp[i];
          Component [] cp2 = sb.getComponents() ; 
          for(int j=0; j<cp2.length;j++)
          {
             if(cp2[j].getClass().getName().equalsIgnoreCase("oracle.ewt.scrolling.scrollBox.EwtLWScrollbar"))
             {
               Component sb2 = (Component)cp2[j] ;
               sb2.setBackground(DrawLAF.Current_Color_Light);
             }
          }
        }
      }  
    
    if(bFirst) 
    {
      /*-----------------------------------------*
       *  creation of the overloading JComboBox
       *-----------------------------------------*/
      list = new JList()
      {      
          public void paint(Graphics g) 
          {
            if(bDisplay || DrawLAF.bEnhancedLists)
            {
              pl.setBounds(1,1,1,1); // hide the standard poplist
              Graphics gg = this.getParent().getParent().getGraphics() ; // to draw on canevas
              Graphics2D g2 = (Graphics2D) gg ;
              super.paint(g);
              if(list != null && !bEnabled) list.setBackground(new Color(230,230,230));
              else list.setBackground(Color.white);
              // draw the focus mark
              if((beFocus || beRollover) && DrawLAF.bDrawFocusLine) 
              {
                g2.setColor(cFocus);    
                g2.setStroke(new BasicStroke(1f)); 
                g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.8f));
                g2.drawRoundRect(
                          (int)this.getBounds().x-1,
                          (int)this.getBounds().y-1,
                          (int)this.getBounds().getWidth()+1,
                          (int)this.getBounds().getHeight()+1,
                          6,6);    
              }         
              // erase the focus mark
              if(beParent) 
              {
                 log("beParent");
                 beParent = false ;
                 g2.setColor(this.getParent().getBackground());    
                 g2.setStroke(new BasicStroke(1f)); 
                 g2.drawRoundRect(
                            (int)this.getBounds().x-1,
                            (int)this.getBounds().y-1,
                            (int)this.getBounds().getWidth()+1,
                            (int)this.getBounds().getHeight()+1,
                            6,6);                     
              }
            }
          }
          public void update(Graphics g)
          {
            paint(g);
          }
      };

      scrollingList = new JScrollPane(list);
      if(bSorted)
      {
        list.setModel(smodel);
        smodel.addListDataListener(new JListDataListener());
      }
      else
      {
        list.setModel(model);
        model.addListDataListener(new JListDataListener());
      }
      // default JList is not visible
      if(! bDisplay && ! DrawLAF.bEnhancedLists)
         scrollingList.setVisible(false);
          
      
      listSelectionModel = list.getSelectionModel();
      // set the the JList values
      synchronizeLists(iIndex) ;

      if(bMultiSel || DrawLAF.bMultiSelect) list.setSelectionMode(ListSelectionModel.MULTIPLE_INTERVAL_SELECTION);
      else list.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
      list.setLayoutOrientation(iOrient);
      list.setVisibleRowCount(-1);
      list.setCellRenderer(new MyCellRenderer());
      list.setBackground(this.getBackground());
      list.setForeground(this.getForeground());
      list.setFont(this.getFont());
      // List display fonts
      normalFont = this.getFont() ;
      selectFont = normalFont.deriveFont(Font.BOLD) ;
      // Combo border
      Border border = new RoundBorder() ;
      list.setBorder(border);
      scrollingList.setBorder(border);
      scrollingList.setBounds(stdRect);
      
      /*----------------------------*
       *  add an selection listener
       *----------------------------*/      
      list.addListSelectionListener(new ListSelectionListener() {
          public void valueChanged(ListSelectionEvent e) {
              int iCurIndex = list.getSelectedIndex() ;
              int iTindexs[] = list.getSelectedIndices() ;
              Object iObj[]  = list.getSelectedValues() ;
              int iSel = iCurIndex ;
              sSelection = "" ;
              int iLenght = iTindexs.length ;
              if(iLenght > 0)
              {
                  StringBuffer returnList = new StringBuffer();
                  for( int j = 0; j< iTindexs.length; j++)
                  {
                    // sorted list ?
                    if(bSorted)
                    {
                      // retrieve correspondances with
                      // original non-sorted list
                      for( int k = 0; k< pl.getItemCount(); k++)
                      {
                        if(pl.getItem(k).equalsIgnoreCase(iObj[j].toString()))
                        {
                          returnList.append(""+k + sSeparator);
                          iSel = k ;
                          break ;
                        }
                      }
                    }
                    else
                    {
                      returnList.append(iTindexs[j] + sSeparator);
                      log("index selected:"+iTindexs[j]) ;                      
                    }
                  }
                  sSelection = returnList.toString().substring(0,(returnList.length()-1));
                  pl.setProperty( ID.SELECT, new Integer(iCurIndex) ) ;
                  if(dBean != null){
                   list_msg.clear();
                   Messages msg = new Messages(pEventMouseMsg, "TLIST_INDEX");
                   list_msg.add(msg);          
                   msg = new Messages(pItemName, sItemName);
                   list_msg.add(msg);
                   msg = new Messages(pItemValue, ""+iSel);
                   list_msg.add(msg);
                   msg = new Messages(pItemSelection, sSelection);
                   list_msg.add(msg);                                                
                   try{
                        dBean.dispatchanevent(pEventMouseEvent, list_msg);           
                   } catch (Exception ex) {};               
                 }
              }
              log("Swing list index selection:"+sSelection) ;
          }      
      });
      
      /*-----------------------*
       *  add a focus listener
       *-----------------------*/
      list.addFocusListener(new FocusListener() {
         public void focusGained(FocusEvent e) {
            log("list focus gained");
            /*
            try {
                e.getComponent().requestFocus();
            }
            catch (Exception ex) { }
            */
            beFocus = true ;
            if(bDisplay || DrawLAF.bEnhancedLists) list.repaint();
        }

         public void focusLost(FocusEvent e) {
            log("list focus lost");
            beFocus = false ; 
            if(bDisplay || DrawLAF.bEnhancedLists) list.repaint();
        }
       });      

      /*-----------------------*
       *  add a mouse listener
       *-----------------------*/
      list.addMouseListener(new MouseListener(){
        public void mouseClicked(MouseEvent e){
          if(bMouseClick){
               if(dBean != null){
                   list_msg.clear();
                   Messages msg = new Messages(pEventMouseMsg, "CLICK");
                   list_msg.add(msg);          
                   msg = new Messages(pItemName, sItemName);
                   list_msg.add(msg);          
                   try{
                        dBean.dispatchanevent(pEventMouseEvent, list_msg);           
                   } catch (Exception ex) {};               
               }
          }                   
        }
        public void mouseEntered(MouseEvent e){
         log("mouse entered");
         beRollover = true ;
         if(bDisplay || DrawLAF.bEnhancedLists) list.repaint() ;
          if(bMouseEnter){
               if(dBean != null){
                   list_msg.clear();
                   Messages msg = new Messages(pEventMouseMsg, "ENTER");
                   list_msg.add(msg);          
                   msg = new Messages(pItemName, sItemName);
                   list_msg.add(msg);          
                   try{
                        dBean.dispatchanevent(pEventMouseEvent, list_msg);           
                   } catch (Exception ex) {};               
               }
          }           
        }
        public void mouseExited(MouseEvent e){
          log("mouse exited");
          beRollover = false ;
          beParent = true ;
          if(bDisplay || DrawLAF.bEnhancedLists) list.repaint() ;
          if(bMouseExit){
               if(dBean != null){
                   list_msg.clear();
                   Messages msg = new Messages(pEventMouseMsg, "EXIT");
                   list_msg.add(msg);          
                   msg = new Messages(pItemName, sItemName);
                   list_msg.add(msg);          
                   try{
                        dBean.dispatchanevent(pEventMouseEvent, list_msg);           
                   } catch (Exception ex) {};               
               }
          }            
        }
        public void mousePressed(MouseEvent e){
        }
        public void mouseReleased(MouseEvent e){
        }
      });       
      
      
      // add the JList to the parent's canevas
      this.getParent().add(scrollingList,0);
      bFirst = false ;    
    }
    if(list != null) list.setEnabled(this.isEnabled());
    // JList colors
    cListFocus = cSelect ;
    
    if(DrawLAF.Current_Color == DrawLAF.SILVER_SCHEME) { cSelect = Color.gray ; cListFocus = new Color(230,230,230) ; }
    else if(DrawLAF.Current_Color == DrawLAF.YELLOW_SCHEME) { cSelect = new Color(150,150,0) ; cListFocus = new Color(255,255,170) ; }
    else if(DrawLAF.Current_Color == DrawLAF.XP_SCHEME) cSelect = cGreenXP ;    
    else cSelect = DrawLAF.Current_Color ;

    if(DrawLAF.cSelect != null) cSelect = DrawLAF.cSelect ;
    if(DrawLAF.cListSelect != null)  cListFocus = DrawLAF.cListSelect ;
    //cFocus = cSelect ;
    
    /*-----------------------------*
     *  standard Poplist painting
     *-----------------------------*/
    if(! bDisplay && ! DrawLAF.bEnhancedLists)
    {
        log("standard TList paint rect="+stdRect);
        Graphics2D g2 = (Graphics2D) g ;
        super.paint(g);
        if(bFocus || bRollover) 
        {
          g2.setColor(cFocus);    
          g2.setStroke(new BasicStroke(1.5f)); 
          g2.drawRect(0,0,(int)this.getBounds().getWidth(),(int)this.getBounds().getHeight());
        }
    }
  }
  
  /*--------------------------*
   *  set the Sorted property
   *--------------------------*/
  public void setSorted( boolean p_bool )
  {
    bSorted = p_bool ;  
  }
  
  /*---------------------------------*
   *  round border for the ListBox
   *---------------------------------*/
  class RoundBorder extends AbstractBorder 
    {
      public void paintBorder(Component c, Graphics g, int x, int y, int width, int height) 
      {
        Graphics2D g2 = (Graphics2D) g ;
        g2.setColor (Color.black) ; 
        g2.setStroke(new BasicStroke(1f)); 
        g.drawRoundRect ( x , y , width , height , 6, 6) ;
      }
      public Insets getBorderInsets ( ) 
      {
        return new Insets (1,1,1,1) ;
      }
  }          
    
  public void update(Graphics g)
  {
    paint(g);
  }

  /*-----------------------------*
   *  set the needed properties
   *-----------------------------*/
  public boolean setProperty(ID property, Object value)
  {
    //log("setProperty():"+property+":"+value);
    //
    // set the debug mode
    //
    if (property == SETDEBUG)
    {
      if (value.toString().equalsIgnoreCase("true"))
        bDebug = true;
      else
        bDebug = false;
      log("Debugging " + bDebug);
      return true;
    }
    //
    // TList sorted or not ?
    //
    else if (property == setSorted)
    {
      log(property+":"+value);
      if (value.toString().equalsIgnoreCase("true"))
        {
          bSorted = true;
          if(list != null) list.setModel(smodel);
        }
      else
        {
          bSorted = false;
          if(list != null) list.setModel(model);
        }
      iIndex=0;
      if(list != null) synchronizeLists(iIndex) ;
      repaint();
      return true;
    }
    //
    // native content list has changed ?
    //
    else if (property == ID.SELECT)
    {
        log(property+":"+value);
        iIndex = 0 ;
        try{
          if(value.toString() != null) iIndex = Integer.parseInt(value.toString()) ;
        }
        catch (Exception e) { System.out.println("ID.SELECT:"+e.toString()); } 
        int iNb = pl.getItemCount() ;
        if (iNb != iNbRows) 
        {
          log("!!List : content has changed !! before="+iNbRows+" after="+iNb+" indice="+iIndex) ;
          if(list != null) synchronizeLists(iIndex) ;
        }
        /*
        if(list != null) {
           list.setSelectedIndex(iIndex);
           list.ensureIndexIsVisible(iIndex);
        }
        */
        repaint();
        if(bDisplay || DrawLAF.bEnhancedLists) return true ;
        else return super.setProperty(property, value);
      } 
      
      //
      // background color
      //
      else if (property == ID.BACKGROUND)
       {
           log(property+":"+value);
           if(list != null)
           { 
             list.setBackground((Color)value);
             list.repaint();
           }  
           return super.setProperty(property, value);         
       }            
      //
      // foreground color
      //
      else if (property == ID.FOREGROUND)
       {
           log(property+":"+value);
           if(list != null)
           { 
             list.setForeground((Color)value);
             list.repaint();
           }  
           return super.setProperty(property, value);         
       }           
      
    //
    // get the poplist location
    //
    else if (property == ID.LOCATION)
     {
         log(property+":"+value);
         Point p = (Point)value ;
         stdRect.x = p.x ;         
         stdRect.y = p.y ;         
         return super.setProperty(property, value);         
     }       
    //
    // get the  poplist dimension
    //
    else if (property == ID.OUTERSIZE)
     {
         log(property+":"+value);
         Point p = (Point)value ;
         stdRect.width  = p.x ;         
         stdRect.height = p.y ;         
         return super.setProperty(property, value);         
     }   
    //
    // visible ?
    //
    else if (property == ID.VISIBLE)  
       {
         log(property+":"+value);
         if(value.toString().equalsIgnoreCase("true")) 
         {
           if(list != null) { scrollingList.setVisible(true) ; list.repaint(); }
         }
         else 
         {
           if(list != null) { scrollingList.setVisible(false) ; list.repaint(); }
         }
         return super.setProperty(property, value);
     }           
    //
    // get the focus
    //
    else if (property == ID.FOCUS)
     {
         log("standard setFocus+:"+value);
         bFocus = true ;
         beFocus = true ;
         if((bDisplay || DrawLAF.bEnhancedLists) && list != null) { list.requestFocus(); list.repaint(); }
         else return super.setProperty(property, value);         
         return true ;
      }         
    //
    // set the multi selection
    //
    else if (property == multiSelection)
    {
         log(property+":"+value);
         if(value.toString().equalsIgnoreCase("true"))
         {
            this.setMultipleMode(true);
            bMultiSel = true ;
            if(list != null) list.setSelectionMode(ListSelectionModel.MULTIPLE_INTERVAL_SELECTION);
         }
         else
         {
            this.setMultipleMode(false);
            bMultiSel = false ;
            if(list != null) list.setSelectionMode(ListSelectionModel.SINGLE_SELECTION); 
         }         
         return true ;
    }
    //
    // set the JList orientation
    //
    else if (property == listOrientation)
    {
         log(property+":"+value);
         String s = value.toString();
         if(s.equalsIgnoreCase("HORIZONTAL_WRAP"))    iOrient = JList.HORIZONTAL_WRAP;
         else if(s.equalsIgnoreCase("VERTICAL_WRAP")) iOrient = JList.VERTICAL_WRAP;
         else                                         iOrient = JList.VERTICAL;
         if(list != null) list.setLayoutOrientation(iOrient);;
         return true ;
    }
    //
    // clear the list selection
    //
    else if (property == clearSelection)
    {
         log(property+":"+value);
         this.deselectAll();
         if(listSelectionModel != null) listSelectionModel.clearSelection();
         return true ;
    }
    else if (property == SETCOLOR)
    {
         log("SET_COLOR:"+value);
         String sColor = value.toString() ;
         Color c = ik.makeColor(sColor);
         cSelect = c ;
         repaint();
         return true;  
    }       
    //
    //  set the time duration between 2 key hits
    //
    else if (property == setTimeKeySel) 
    {
         String s = value.toString() ;
         int it = 0 ;
         try {
           it = Integer.parseInt(s) ;
         }
         catch (Exception e) { }
         if(it > 0) iTimeKeySel = it ;
         return true ;
    }
    //
    // set the current scheme 
    //
    else if (property == setScheme) 
    {
      DrawLAF.setScheme(value.toString().trim());
      log("SET_SCHEME final color:"+DrawLAF.Current_Color);
      cSelect = DrawLAF.Current_Color ;
      repaint();
      return true;
    }      
    //
    // set the enhanced Jlist    
    // for the current instance 
    //
    else if (property == setEnhanced) 
      {
          String s = value.toString();
          log("setEnhanced:"+s);        
          if(s.equalsIgnoreCase("true")) 
          {
            bDisplay = true;
            if(scrollingList != null)
            {
              scrollingList.setVisible(true);
              if(list != null) {
                list.setVisible(true);
                list.repaint();
              }
            }
          }
          else
          {
            bDisplay = false;
            if(scrollingList != null && list != null)
            {
              list.setVisible(false);
              scrollingList.setVisible(false);
            }
            pl.setBounds(stdRect);
          }
          pl.repaint();
          return true;
      }      
    //
    // set enhanced JList for all instances 
    //
    else if (property == setEnhancedAll) 
      {
          String s = value.toString();
          log("setEnhancedAll:"+s);
          if(s.equalsIgnoreCase("true")) 
          {
            DrawLAF.bEnhancedLists = true;
            scrollingList.setVisible(true);
            if(list != null)  {
              list.setVisible(true);
              list.repaint();    
            }
          }
          else 
          {
            DrawLAF.bEnhancedLists = false;
            if(list != null) {
              list.setVisible(false);
              scrollingList.setVisible(false);
            }
            pl.setBounds(stdRect);            
          }
          pl.repaint();
          return true;
      }      
    //
    //  set the maximum rows displayed
    //
    else if(property == setMaxRows)
    {
      log(property+":"+value);
      String s = value.toString() ;
      int iMax = 0 ;
      try
      {
        iMax = Integer.parseInt(s);
      }
      catch (Exception ex)
      {
        System.out.println(ex.toString());  
      }
      if(iMax > 0) iMaxRows = iMax;
      return true;
    }
    else if (property == ID.ENABLED)  
      {
       log(property+":"+value);
       if(value.toString().equalsIgnoreCase("true")) bEnabled = true ;
       else bEnabled = false ;
       return super.setProperty(property, value);
      }          
    
    // enable events ?
    else if( property == pSetEvent )
    {
      String s = value.toString(), sVal="" ;
      int iPos ;
      iPos = s.indexOf(",");
      if(iPos < 0 ) return false ;
      sItemName = s.substring(0,iPos) ;
      sVal = s.substring(iPos+1) ;      
      if(sVal.equalsIgnoreCase("true")) bSendEvents = true ;
      else bSendEvents = false ;
      return true ;
    }         
    
    // mouse events
    else if( property == pSetMouseEvents ) { 
        String s = (String)value ;
        String s1=null;
        StringTokenizer st = new StringTokenizer(s,",");
        if(st.hasMoreTokens()) {
            // mouse enter
            s1 = st.nextToken() ;    
            if(s1.equalsIgnoreCase("true")){
                bMouseEnter = true ;           
            }
            else {
                bMouseEnter = false ;
            }
        }
        if(st.hasMoreTokens()) {
            // mouse exit
            s1 = st.nextToken() ;    
            if(s1.equalsIgnoreCase("true")){
                bMouseExit = true ;           
            }
            else {
                bMouseExit = false ;
            }
        }        
        if(st.hasMoreTokens()) {
            // mouse click
            s1 = st.nextToken() ;    
            if(s1.equalsIgnoreCase("true")){
                bMouseClick = true ;           
            }
            else {
                bMouseClick = false ;
            }
        } 
        return true;
    }        
      
    else
    {
     log("other property "+property+":"+value);
     return super.setProperty(property, value);
    }
  }

    /*----------------------*
     *  Properties to read
     *----------------------*/
    public Object getProperty(ID pid)
    {

        Object result = null;
        /*--------------------------------------*
         *  return the list of selected indexes
         *--------------------------------------*/
        if (pid == listSelection)
        {
          if(bDisplay || DrawLAF.bEnhancedLists) return sSelection ;
          else
          {
              if (this.getSelectedIndexes().length > 0)
              {
                StringBuffer returnList = new StringBuffer();
                for (int i = 0; i < this.getSelectedIndexes().length; i++)
                {
                  returnList.append((this.getSelectedIndexes()[i]) + sSeparator);
                }
                sSelection = returnList.toString().substring(0,(returnList.length()-1));
              }
              else
              {
                sSelection = "" ;
              }
              log("standard list index selection:"+sSelection) ;              
              return sSelection ;
          }
          //return "" ;
        }
        // multi selection true/false
        else if(pid == getMultiSelect) {
            log("multiselect="+ bMultiSel);
            return ""+ bMultiSel ;
        }
        // list sorted true/false
        else if(pid == getSorted) {
            log("sorted="+ bSorted);
            return ""+ bSorted ;
        }        
        // list orientation
        else if(pid == getOrientation) {
            String s = "" ;
            switch(iOrient)
            {
              case JList.VERTICAL:
                s =  "VERTICAL";
                break ;
              case JList.VERTICAL_WRAP:
                s =  "VERTICAL_WRAP";
                break ;
              case JList.HORIZONTAL_WRAP:
                s =  "HORIZONTAL_WRAP";
                break ;                              
            }
            return s ;
        }        
        else
        {
          result = super.getProperty(pid);
          log("getProperty() "+pid+":"+result);
          return (Object)result;
        }

    }

  /*----------------------------------*
   *  Standard component focus handle
   *----------------------------------*/
  public void focusGained(FocusEvent e)
     {
         // put the focus on the component
         log("standard : focus Gained");
         bFocus = true ;
         beFocus = true ;
         /*
         try {
             e.getComponent().requestFocus();
         }
         catch (Exception ex) { }
         */
         repaint();
     }
    
  public void focusLost(FocusEvent e)
     {     
       log("standard : focus Lost");
       bFocus = false ;
       beFocus = false ;
       repaint();
     }

 
  /*
   * Utility function to print out a debug message to the Java Console
   */
  public void log(String msg)
  {
    if(bDebug)
        System.out.println(CLASSNAME + ": " + msg);
  }

  /*---------------------------------------------*
   * Private class to handle user mouse actions
   *---------------------------------------------*/
  class ButtonMouseAdapter extends MouseAdapter
  {
    /*
     * User moved the mouse over the component
     */
    public void mouseEntered(MouseEvent me)
    {
      log("VPoplist mouseEntered");
      bRollover = true ;
      repaint();
      if(bMouseEnter){
           if(dBean != null){
               list_msg.clear();
               Messages msg = new Messages(pEventMouseMsg, "ENTER");
               list_msg.add(msg);          
               msg = new Messages(pItemName, sItemName);
               list_msg.add(msg);          
               try{
                    dBean.dispatchanevent(pEventMouseEvent, list_msg);           
               } catch (Exception ex) {};               
           }
      }                          
    }

    /*
     * User moved the mouse out of the component
     */
    public void mouseExited(MouseEvent me)
    {
      log("VPoplist mouseExited");
      bRollover = false ;
      repaint();
      if(bMouseExit){
           if(dBean != null){
               list_msg.clear();
               Messages msg = new Messages(pEventMouseMsg, "EXIT");
               list_msg.add(msg);          
               msg = new Messages(pItemName, sItemName);
               list_msg.add(msg);          
               try{
                    dBean.dispatchanevent(pEventMouseEvent, list_msg);           
               } catch (Exception ex) {};               
           }
      }                                
    }
    public void mouseClick(MouseEvent me)
    {
      log("VPoplist mouseClick");
      bRollover = false ;
      repaint();
      if(bMouseEnter){
           if(dBean != null){
               list_msg.clear();
               Messages msg = new Messages(pEventMouseMsg, "CLICK");
               list_msg.add(msg);          
               msg = new Messages(pItemName, sItemName);
               list_msg.add(msg);          
               try{
                    dBean.dispatchanevent(pEventMouseEvent, list_msg);           
               } catch (Exception ex) {};               
           }
      }                                
    }
    
  }
  
  /*-----------------------------------*
   *  ListCellRenderer for the JList
   *-----------------------------------*/
   class MyCellRenderer extends JLabel implements ListCellRenderer {
        public MyCellRenderer() {
            setOpaque(true);
        }

        public Component getListCellRendererComponent(JList list,
                                                      Object value,
                                                      int index,
                                                      boolean isSelected,
                                                      boolean cellHasFocus) {

            setText(" "+value.toString());

            Color background;
            Color foreground;

            if (isSelected) {
                background = cListFocus;
                foreground = list.getSelectionForeground();
                if(DrawLAF.Current_Color == DrawLAF.SILVER_SCHEME || DrawLAF.Current_Color == DrawLAF.YELLOW_SCHEME)
                   foreground= Color.black ;
                if(!bEnabled) background= Color.gray ;
                setFont(selectFont);

            // unselected
            } else {
                background = list.getBackground();
                foreground = list.getForeground();
                setFont(normalFont);
            };

            setBackground(background);
            setForeground(foreground);

            return this;
        }
    }   
   
   
    /*---------------------------*
     *  Model for a sorted JList
     *---------------------------*/
    class SortedListModel extends AbstractListModel {

      SortedSet model;

      public SortedListModel() {
        model = new TreeSet();
      }

      public int getSize() {
        return model.size();
      }

      public Object getElementAt(int index) {
        return model.toArray()[index];
      }

      public void add(Object element) {
        if (model.add(element)) {
          fireContentsChanged(this, 0, getSize());
        }
      }

      public void addAll(Object elements[]) {
        Collection c = Arrays.asList(elements);
        model.addAll(c);
        fireContentsChanged(this, 0, getSize());
      }

      public void clear() {
        model.clear();
        fireContentsChanged(this, 0, getSize());
      }

      public boolean contains(Object element) {
        return model.contains(element);
      }

      public Object firstElement() {
        return model.first();
      }

      public Iterator iterator() {
        return model.iterator();
      }

      public Object lastElement() {
        return model.last();
      }

      public boolean removeElement(Object element) {
        boolean removed = model.remove(element);
        if (removed) {
          fireContentsChanged(this, 0, getSize());
        }
        return removed;
      }
    } 
 
    /*------------------------------------*
     *  Add a data listener to the JList
     *------------------------------------*/
    class JListDataListener implements ListDataListener {
        public void contentsChanged(ListDataEvent e) {
            log("contentsChanged: " + e.getIndex0() +
                       ", " + e.getIndex1());
        }
        public void intervalAdded(ListDataEvent e) {
            log("intervalAdded: " + e.getIndex0() +
                       ", " + e.getIndex1());
        }
        public void intervalRemoved(ListDataEvent e) {
            log("intervalRemoved: " + e.getIndex0() +
                       ", " + e.getIndex1());
        }
    }
 
   /*-----------------------------------*
    *   synchronize Swing list content
    *-----------------------------------*/
   private void synchronizeLists(int p_index)
   {
      log("synchronizeLists()");
      iNbRows = pl.getItemCount() ;
      try
      { 
         if(bSorted) smodel.clear(); 
         else model.clear(); 
      }
      catch (Exception e) { }
      for( int j=0 ; j<iNbRows; j++) 
      {
        if(bSorted) smodel.add(pl.getItem(j));
        else model.addElement(pl.getItem(j));
        log("synchronizeLists() :"+pl.getItem(j));
      }
      list.setSelectedIndex(p_index);
   }
   
   private Color brightColor( Color c )
   {
      int r = c.getRed()   + 20 <= 255 ? c.getRed()   + 20 : 255 ;
      int g = c.getGreen() + 20 <= 255 ? c.getGreen() + 20 : 255 ;
      int b = c.getBlue()  + 20 <= 255 ? c.getBlue()  + 20 : 255 ;
      return new Color(r,g,b);             
   }
}