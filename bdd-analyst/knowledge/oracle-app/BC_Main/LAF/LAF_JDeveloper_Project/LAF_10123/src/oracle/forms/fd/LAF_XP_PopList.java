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
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;

import java.net.URL;

import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;

import javax.swing.ComboBoxModel;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JList;
import javax.swing.ListCellRenderer;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.border.AbstractBorder;
import javax.swing.border.Border;

import oracle.ewt.button.PushButton;

import oracle.forms.handler.IHandler;
import oracle.forms.properties.ID;
import oracle.forms.ui.VPopList;


/**
 * A XP like PopList
 *
 * @author   Francois Degrelle
 * creation  february 2007
 * @version  1.6
 *
 * modified  June 2009 : bug correction on values selected
 *                       and background/foreground color
 *                       for enhanced poplist
 */
     
public class LAF_XP_PopList extends VPopList implements FocusListener
{
  private static final ID SETIMAGEON        = ID.registerProperty("SET_IMAGE_ON");
  private static final ID SETDEBUG          = ID.registerProperty("SET_DEBUG");
  private static final ID SETCOLOR          = ID.registerProperty("SET_COLOR");  
  private static final ID setScheme         = ID.registerProperty("SET_SCHEME");    
  private static final ID setEnhanced       = ID.registerProperty("SET_ENHANCED");    
  private static final ID setEnhancedAll    = ID.registerProperty("SET_ENHANCED_ALL");      
  private static final ID setMaxRows        = ID.registerProperty("SET_MAX_ROWS");  
  private static final ID getMaxRows        = ID.registerProperty("GET_MAX_ROWS");    
  private static final ID setTimeKeySel     = ID.registerProperty("SET_TIME_KEY_SELECT");    
  private static final ID getTimeKeySel     = ID.registerProperty("GET_TIME_KEY_SELECT");  
  // mouse events
  public final static ID pSetEvent         = ID.registerProperty("ENABLE_EVENTS");
  public final static ID pItemName         = ID.registerProperty("ITEM_NAME");    
  public final static ID pSetMouseEvents   = ID.registerProperty("SET_MOUSE_EVENTS");  
  public final static ID pEventMouseEvent  = ID.registerProperty("MOUSEEVENT_MESSAGE");  
  public final static ID pEventMouseMsg    = ID.registerProperty("MOUSE_EVENT");        

  private final String   CLASSNAME          = this.getDefaultName();
  private DrawLAF        dBean;  
  private IHandler       m_handler;
  // standard combo
  private VPopList       vpp           = this ;
  private boolean        bFocus        = false ;
  private boolean        bRollover     = false ;  
  private boolean        bSelect       = false ;    
  private boolean        bEnabled      = true ;      
  private Rectangle      stdRect       = new Rectangle() ;
  private int            iNbRows       = 0 ;
  // enhanced combo
  private boolean        beFocus       = false ;
  private boolean        beRollover    = false ;  
  private boolean        beParent      = false ;      
  protected Color        cFocus        = DrawLAF.cFocus != null ? DrawLAF.cFocus : new Color(255,214,47);
  protected Color        cListFocus    = DrawLAF.cSelect != null ? DrawLAF.cSelect : cFocus;
  protected Color        cGreenXP      = new Color(0,230,0) ;
  static protected Color cSelect  = new Color(0,230,0) ;
  private boolean        bDisplay      = false ;
  private URL            m_codeBase;
  private static boolean bDebug        = false ;
  private int            iMaxRows      = 6 ;
  private int            iIndex        = 0 ;  
  // millisecond between two key hits
  protected int          iTimeKeySel   = 100 ; 
  // adds
  private JComboBox      jcb ;
  private boolean        bFirst        = true ;
  private LAF_XP_PopList pl            = this ;
  private KeyListener    kl ;  
  // font
  private Font           normalFont    = null ;
  private Font           selectFont    = null ;
  private ImageKit       ik = new ImageKit();
  // mouse events
  private String      sItemName    = null ;
  private boolean     bSendEvents  = false ;
  private boolean     bMouseEnter  = false ;
  private boolean     bMouseClick  = false ;
  private boolean     bMouseExit   = false ;   
  private List        list_msg     = new ArrayList(10) ;      

  // constructor
  public LAF_XP_PopList()
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
    setKeyListener() ;
    DrawLAF.add_PJC("LAF_XP_PopList", this) ;
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
  public void paint(Graphics g1)
  {

      PushButton pb = (PushButton)this.getComponent(0) ;
      pb.setBackground(DrawLAF.Current_Color_Light); 

    if(bFirst) 
    {
        createCombo();
        bFirst = false ;       
    }
    if(jcb != null) {
        jcb.setEnabled(this.isEnabled());
    }
    // ComboBox colors
    cListFocus = cSelect ;
    if(DrawLAF.Current_Color == DrawLAF.SILVER_SCHEME) { cSelect = Color.gray ; cListFocus = new Color(230,230,230) ; }
    else if(DrawLAF.Current_Color == DrawLAF.YELLOW_SCHEME) { cSelect = new Color(150,150,0) ; cListFocus = new Color(255,255,170) ; }
    else if(DrawLAF.Current_Color == DrawLAF.XP_SCHEME) cSelect = cGreenXP ;    
    else cSelect = DrawLAF.Current_Color ;
    cFocus = cSelect ;
    if(DrawLAF.cSelect != null) {cSelect = DrawLAF.cSelect ; cListFocus = cSelect ;}
    if(DrawLAF.cFocus != null)  cFocus = DrawLAF.cFocus ;
    if(DrawLAF.cListSelect != null)  cListFocus = DrawLAF.cListSelect ;
    
    /*-----------------------------*
     *  standard Poplist painting
     *-----------------------------*/
    if(! bDisplay && ! DrawLAF.bEnhancedLists)
    {
        pl.setBounds(stdRect);
        Graphics2D g2 = (Graphics2D) g1 ;
        super.paint(g1);
        if(bFocus || bRollover) 
        {
          log("standard paint");
          g2.setColor(cFocus);    
          g2.setStroke(new BasicStroke(1.5f)); 
          g2.drawRect(0,0,(int)this.getBounds().getWidth(),(int)this.getBounds().getHeight());
        }
    }
  }
  
  void createCombo(){
      /*-----------------------------------------*
       *  creation of the overloading JComboBox
       *-----------------------------------------*/
      if(null != jcb) {
         this.getParent().remove(jcb); 
      }
      iIndex = 0;
      jcb = new JComboBox()
      {      
          public void paint(Graphics g) 
          { 
            if(bDisplay || DrawLAF.bEnhancedLists)
            {
              pl.setBounds(1,1,1,1); // hide the standard poplist
              Graphics gg = this.getParent().getGraphics() ; // to draw on canevas
              Graphics2D g2 = (Graphics2D) gg ;
              super.paint(g);
              
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

      // set the the Combo values
      synchronizeLists(iIndex) ;
      ComboBoxRenderer renderer = new ComboBoxRenderer() ;
      jcb.setRenderer(renderer);
      jcb.setMaximumRowCount(iMaxRows);
      jcb.setBackground(this.getBackground());
      jcb.setForeground(this.getForeground());
      jcb.setFont(this.getFont());
      // Combo display fonts
      normalFont = this.getFont() ;
      selectFont = normalFont.deriveFont(Font.BOLD) ;
      // Combo border
      Border border = new RoundBorder() ;
      jcb.setBorder(border);
      jcb.setBounds(stdRect);
      jcb.addKeyListener(kl);      
      /*-------------------------*
       *  add an action listener
       *-------------------------*/
      jcb.addActionListener(new ActionListener(){
         public void actionPerformed(ActionEvent e){
            JComboBox cb = (JComboBox)e.getSource();
            int index = cb.getSelectedIndex() ;
            Object o = new Integer(index);
            // send the new value to the standard list item
            // to make PJC fire the When-List-Changed trigger
            pl.setProperty( ID.SELECT, o) ;
            pl.fireItemEvent("",0);
        }
      });
      
      /*-----------------------*
       *  add a focus listener
       *-----------------------*/
      jcb.addFocusListener(new FocusListener() {
         public void focusGained(FocusEvent e) {
            log("jcb focus gained");
            beFocus = true ;
            jcb.repaint();
        }

         public void focusLost(FocusEvent e) {
            log("jcb focus lost");
            beFocus = false ; 
            jcb.repaint();
        }
       });      
      
      /*-----------------------*
       *  add a mouse listener
       *-----------------------*/
      jcb.addMouseListener(new MouseListener(){
        public void mouseEntered(MouseEvent e){
         log("mouse entered");
         beRollover = true ;
         jcb.repaint() ;
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
          jcb.repaint() ;
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
        public void mouseClicked(MouseEvent e){
          log("mouse click");
          beRollover = false ;
          beParent = true ;
          jcb.repaint() ;
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
        public void mousePressed(MouseEvent e){
        }
        public void mouseReleased(MouseEvent e){
        }
      });       
      
      // Install the custom key selection manager
      jcb.setKeySelectionManager(new MyKeySelectionManager());
      
      // add the JComboBox to the parent's canevas
      this.getParent().add(jcb,0);
  }
  
  /*---------------------------------*
   *  round border for the ComboBox
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
    log("SetProperty():"+property+':'+value);
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
    // native content list has changed ?
    //
    else if (property == ID.SELECT)
    {
        log(property+":"+value);
        iIndex = Integer.parseInt(value.toString()) ;
        int iNb = pl.getItemCount() ;
        if (iNb != iNbRows) 
        {
          log("!!List : content has changed !! before="+iNbRows+" after="+iNb+" current indice="+iIndex) ;
          if(jcb != null) {
              //synchronizeLists(iIndex) ;
              createCombo();
          }
        }
        if(jcb != null && iIndex < (iNb-1)) jcb.setSelectedIndex(iIndex);
        repaint();
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
    // background color
    //
    else if (property == ID.BACKGROUND)
     {
         log(property+":"+value);
         if(jcb != null)
         { 
           jcb.setBackground((Color)value);
           jcb.repaint();
         }  
         return super.setProperty(property, value);         
     }   
         
    //
    // foreground color
    //
    else if (property == ID.FOREGROUND)
     {
         log(property+":"+value);
         if(jcb != null)
         { 
           jcb.setForeground((Color)value);
           jcb.repaint();
         }  
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
    // get the focus
    //
    else if (property == ID.FOCUS)
     {
         log("setFocus:"+value);
         bFocus = true ;
         beFocus = true ;
         if(jcb != null && (bDisplay)) { jcb.requestFocus(); jcb.repaint(); }
         return super.setProperty(property, value);
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
    // visible ?
    //
    else if (property == ID.VISIBLE)  
     {
       log(property+":"+value);
       if(value.toString().equalsIgnoreCase("true")) 
       {
         if(jcb != null) { jcb.setVisible(true) ; jcb.repaint(); }
       }
       else 
       {
         if(jcb != null) { jcb.setVisible(false) ; jcb.repaint(); }
       }
       return super.setProperty(property, value);
     }           
    //
    //  set the time duration between 2 key hits
    //
    else if (property == setTimeKeySel) 
    {
         log(property+":"+value);
         String s = value.toString() ;
         int it = 0 ;
         try {
           it = Integer.parseInt(s) ;
         }
         catch (Exception e) { }
         if(it > 0) iTimeKeySel = it ;
         log("iTimeKeySel="+iTimeKeySel);
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
    // set the enhanced ComboBox 
    // for the current instance  
    //
    else if (property == setEnhanced) 
      {
          String s = value.toString();
          log("setEnhanced:"+s);        
          if(s.equalsIgnoreCase("true"))
          {
            bDisplay = true;
            if(jcb != null) jcb.setVisible(true);
          }  
          else
          { 
            bDisplay = false;
            if(jcb != null) jcb.setVisible(false);
          }  
          pl.repaint();
          return true;
      }      
    //
    // set enhanced ComboBox for all instances 
    //
    else if (property == setEnhancedAll) 
      {
          String s = value.toString();
          log("setEnhancedAll:"+s);
          if(s.equalsIgnoreCase("true"))
          {
            DrawLAF.bEnhancedLists = true;
            bDisplay = true;
            if(jcb != null) jcb.setVisible(true);
          }  
          else
          { 
            DrawLAF.bEnhancedLists = false;
            bDisplay = false;
            if(jcb != null) jcb.setVisible(false);
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
      if(iMax > 0)
        {
          iMaxRows = iMax;
          if(jcb != null) jcb.setMaximumRowCount(iMaxRows);
        }
      return true;
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
     log(property+":"+value);
     return super.setProperty(property, value);
    }
  }

    /*-----------------------*
     *  get some properties
     *-----------------------*/
    public Object getProperty(ID pid)
    {
        Object result = null;
        if(pid == getTimeKeySel)
        {
          log("getProperty() iTimeKeySel="+iTimeKeySel);
          return "" + iTimeKeySel ;
        }
        else if(pid == getMaxRows)
        {
          return "" + iMaxRows ;
        }        
        else
        result = super.getProperty(pid);
        log("getProperty() "+pid+":"+result);
        return (Object)result;
    }

  /*----------------------------------*
   *  Standard component focus handle
   *----------------------------------*/
  public void focusGained(FocusEvent e)
     {
         // put the focus on the component
         log("standard focus gained");
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
               log("dispatchEvent mouseEnter");
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
  
  /*--------------------------------------*
   *  ListCellRenderer for the JComboBox
   *--------------------------------------*/
  class ComboBoxRenderer extends JLabel
                           implements ListCellRenderer {
        public ComboBoxRenderer() {
            setOpaque(true);
            setHorizontalAlignment(LEFT);
            setVerticalAlignment(CENTER);
        }

        public Component getListCellRendererComponent(
                                           JList list,
                                           Object value,
                                           int index,
                                           boolean isSelected,
                                           boolean cellHasFocus) {
            setText(" "+value.toString());

            if (isSelected) {
                setBackground(cListFocus);
                setForeground(list.getSelectionForeground());
                if(DrawLAF.Current_Color == DrawLAF.SILVER_SCHEME || DrawLAF.Current_Color == DrawLAF.YELLOW_SCHEME)
                   setForeground(Color.black);
                setFont(selectFont);
            } 
            else if (cellHasFocus) {
                setBackground(cListFocus);
                setForeground(list.getForeground());
                setFont(selectFont);
            }            
            else {
                setBackground(list.getBackground());
                setForeground(list.getForeground());
                setFont(normalFont);
            }

            return this;
        }
    }  
 
  /*------------------------------------------*
   * key selection manager for the JComboBox 
   *------------------------------------------*/
  class MyKeySelectionManager implements JComboBox.KeySelectionManager {
    long lastKeyTime = 0;
    String pattern = "";
    int iKey=0;

    public int selectionForKey(char aKey, ComboBoxModel model) {
        iKey = (int)aKey ;
        // Find index of selected item
        log("keyPressed:"+iKey);
        int selIx = 01;
        Object sel = model.getSelectedItem();
        if (sel != null) {
            for (int i=0; i<model.getSize(); i++) {
                if (sel.equals(model.getElementAt(i))) {
                    selIx = i;
                    break;
                }
            }
        }

        // Get the current time
        long curTime = System.currentTimeMillis();

        // If last key was typed less than iTimeKeySel ms ago, append to current pattern
        if (curTime - lastKeyTime < iTimeKeySel) {
            pattern += ("" + aKey).toLowerCase();
        } else {
            pattern = ("" + aKey).toLowerCase();
        }

        // Save current time
        lastKeyTime = curTime;

        // Search forward from current selection
        for (int i=selIx+1; i<model.getSize(); i++) {
            String s = model.getElementAt(i).toString().toLowerCase();
            if (s.startsWith(pattern)) {
                return i;
            }
        }

        // Search from top to current selection
        for (int i=0; i<selIx ; i++) {
            if (model.getElementAt(i) != null) {
                String s = model.getElementAt(i).toString().toLowerCase();
                if (s.startsWith(pattern)) {
                    return i;
                }
            }
        }
        /*
        if(iKey == 9 || iKey == 10)
        {
          if(jcb != null) jcb.transferFocus();
        } 
        */
        return -1;
      }
    }

    // workaround to fix the Swing JComboBox duplicates issue
    public class StringWithoutEqual {
        private String text;

        public StringWithoutEqual(String txt) {
            text = txt;
        }

        public String toString() {
            return text;
        }
    }

    /*-----------------------------------*
    *   synchronize Swing list content
    *-----------------------------------*/
   private void synchronizeLists(int index)
   {
      iNbRows = pl.getItemCount() ;
      try
      { jcb.removeAllItems(); }
      catch (Exception e) { }
      for( int j=0 ; j<iNbRows; j++) 
      {
        jcb.addItem(new StringWithoutEqual(pl.getItem(j)));
      }
      jcb.setSelectedIndex(index);
   }
   
   private Color brightColor( Color c )
   {
      int r = c.getRed()   + 20 <= 255 ? c.getRed()   + 20 : 255 ;
      int g = c.getGreen() + 20 <= 255 ? c.getGreen() + 20 : 255 ;
      int b = c.getBlue()  + 20 <= 255 ? c.getBlue()  + 20 : 255 ;
      return new Color(r,g,b);             
   }
   
 
   /*------------------------------------------*
    *   create a KeyListener for the list
    *------------------------------------------*/
   void setKeyListener()
   {
        kl = new KeyListener(){
	       public void keyPressed(KeyEvent e) {
           boolean bFound = false ;
           int key = e.getKeyCode() ;
           log( "(1)Key:    " + key);
           int modifiersEx;           
           if(System.getProperty("java.version").startsWith("1.3"))
             modifiersEx = e.getModifiers();
           else
             modifiersEx = e.getModifiersEx();
           log("setKeyListener()  modifier:"+modifiersEx); 

           switch(key)
           {

             case KeyEvent.VK_TAB:
                  if(jcb != null && (jcb.isVisible())) {
                    if(modifiersEx == 0) vpp.transferFocus();
                    if(modifiersEx == 64) vpp.transferFocusBackward();
                  }
                  e.consume();
                  break ;

           }
           }
           public void keyReleased(KeyEvent e) {
           }
           public void keyTyped(KeyEvent e) {
           }
        };             
   }
   
  
   
}