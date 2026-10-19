package oracle.forms.fd;

import java.awt.*;
import java.awt.event.*;
import java.awt.geom.Rectangle2D;
import java.net.URL;

import java.util.ArrayList;
import java.util.List;

import java.util.StringTokenizer;

import oracle.forms.ui.VCheckbox;
import oracle.forms.handler.IHandler;
import oracle.forms.properties.ID;
import oracle.forms.ui.FormsToolTip;

/**
 * A XP like Check box
 * 
 * @author   Francois Degrelle
 * creation  february 2007     
 * @version  1.6
 */
     
public class LAF_XP_CBox extends VCheckbox implements FocusListener, KeyListener
{
  private static final ID SETDEBUG          = ID.registerProperty("SET_DEBUG");
  private static final ID SETCOLOR          = ID.registerProperty("SET_COLOR");  
  private static final ID setScheme         = ID.registerProperty("SET_SCHEME");    
  private static final ID setOpaque         = ID.registerProperty("SET_OPAQUE");        
  private static final ID setOpaqueAll      = ID.registerProperty("SET_OPAQUE_ALL");
  private static final ID setShadow         = ID.registerProperty("SET_SHADOW");  
  private static final ID setBoxBGColor     = ID.registerProperty("SET_CBOX_BG_COLOR");  
  // mouse events
  public final static ID pSetEvent         = ID.registerProperty("ENABLE_EVENTS");
  public final static ID pItemName         = ID.registerProperty("ITEM_NAME");    
  public final static ID pSetMouseEvents   = ID.registerProperty("SET_MOUSE_EVENTS");  
  public final static ID pEventMouseEvent  = ID.registerProperty("MOUSEEVENT_MESSAGE");  
  public final static ID pEventMouseMsg    = ID.registerProperty("MOUSE_EVENT");      
  private final String     CLASSNAME   = this.getDefaultName();
  private       List       list_msg     = new ArrayList(10) ; 
  private IHandler         m_handler;
  private DrawLAF          dBean = null;  
  private boolean          bFocus      = false ;
  private boolean          bRollover   = false ;  
  private boolean          bSelect     = false ;    
  private boolean          bOpaque     = true ;
  private boolean          bFirst      = true ;
  private boolean          bEnabled    = true ;  
  private boolean          bChanged    = false ;    
  static private boolean   bShadow     = true ;    
  static private boolean   bOpaqueAll  = false;
  protected Color          cBoxBGColor = null ;
  protected Color          cFocus      = DrawLAF.cFocus != null ? DrawLAF.cFocus : new Color(255,214,47);
  protected Color          cGreenXP    = new Color(0,230,0) ;
  static protected Color   cSelect     = DrawLAF.cSelect != null ? DrawLAF.cSelect : new Color(0,230,0) ;
  private URL              m_codeBase;
  private ImageKit         ik = new ImageKit();
  static protected boolean bDebug      = false;
  // mouse events
  private boolean     bSendEvents   = false ;
  private String      sItemName     = null ;  
  private boolean     bMouseEnter  = false ;
  private boolean     bMouseClick  = false ;
  private boolean     bMouseExit   = false ;    


  public LAF_XP_CBox()
  {
    super();
  }
  
  public LAF_XP_CBox(DrawLAF dl)
  {
    super();
    dBean = dl ;
  }  

  public void init(IHandler handler)
  {
    m_handler = handler;
    m_codeBase = handler.getCodeBase();
    super.init(handler);
    addMouseListener(new ButtonMouseAdapter());
    addFocusListener(this);
    addKeyListener(this);
  }
  
    public void destroy() {
        dBean = null ;
    }

    void setLAFBean (DrawLAF DF) { dBean = DF ;}    
    DrawLAF getLAFBean() { return dBean; }   

  protected void setTooltipText (String s)
  {
     Object o = s;
     FormsToolTip ftp = (FormsToolTip)this.getToolTipValue() ;
     if(ftp == null) {
       ftp = new FormsToolTip();
       ftp.setToolTipValue(o);
       this.setProperty(ID.POPUPHELP_ID,ftp);
     }
     else {
       ftp.setToolTipValue(o);
     }
  }  
  
  /*------------------------*
   *   Paint the component
   *------------------------*/
  public void paint(Graphics g)
  {
    if(DrawLAF.cSelect != null) cSelect = DrawLAF.cSelect ;
    else {
      if(DrawLAF.Current_Color == DrawLAF.SILVER_SCHEME) cSelect = Color.gray ;
      else if(DrawLAF.Current_Color == DrawLAF.YELLOW_SCHEME) cSelect = new Color(150,150,0) ;
      else if(DrawLAF.Current_Color == DrawLAF.XP_SCHEME) cSelect = cGreenXP ;    
      else cSelect = DrawLAF.Current_Color ;
    }
    //cFocus = cSelect ;
    Graphics2D g2 = (Graphics2D) g ;
    g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
    Object rh = g2.getRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING);
    g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,RenderingHints.VALUE_TEXT_ANTIALIAS_ON);         
    String tLabels[] = new String[10] ;
    int    tHeight[] = new int[10] ;
    int iIndice = -1 ;
    String sLabel = this.getProperty(ID.LABEL).toString() ;
    int textHeight  = 0;
    int textWidth   = 0;    
    int iPos = sLabel.indexOf(10) ;
    FontMetrics fm = g2.getFontMetrics(this.getFont());
    while(iPos > -1)
    {
        String s = sLabel.substring(0,iPos);
        Rectangle2D rect = fm.getStringBounds(s, g2);
        if(rect.getWidth() > textWidth) textWidth += rect.getWidth() ;
        tLabels[++iIndice] = s ;
        tHeight[iIndice] = (int)rect.getHeight() ;
        textHeight = textHeight + tHeight[iIndice] ;
        sLabel = sLabel.substring(iPos+1);
        iPos = sLabel.indexOf(10) ;
    }
    if(sLabel.length() > 0)
    {
      tLabels[++iIndice] = sLabel ;
      Rectangle2D rect = fm.getStringBounds(sLabel, g2);
      if(rect.getWidth() > textWidth) textWidth += (int)rect.getWidth() ;
      tHeight[iIndice] = (int)rect.getHeight() ;      
      textHeight = textHeight + tHeight[iIndice] ;
    }

    int posY = (this.getBounds().height/2) -6 ;
    int posF = (this.getBounds().height/2) - (textHeight/2) ;
    // clear the standard drawing
    if(! bOpaque)
    {
      // draw the background
      g2.setColor(this.getBackground());
      g2.fillRect(0,0,(int)this.getBounds().getWidth(),(int)this.getBounds().getHeight());
    }
    
    if(cBoxBGColor != null || DrawLAF.cCBBackgroundColor != null) {
       if(cBoxBGColor != null) g2.setColor(cBoxBGColor);
       else                    g2.setColor(DrawLAF.cCBBackgroundColor);
    }   
    else {
      GradientPaint gradient = new GradientPaint(1,1,DrawLAF.Current_Color,9,9,DrawLAF.Current_Color_Light);
      g2.setPaint(gradient);
    }
    g2.fill(new Rectangle2D.Double(1,posY,9,9)) ;    
    
    g2.setColor(Color.gray);
    g2.draw3DRect(1,posY,10,10,false);
    
    
    if(bRollover && bEnabled)
    {
      g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.5f));
      g2.setColor(cFocus);
      g2.setStroke(new BasicStroke(1.5f)); 
      g2.drawRect(2,posY+1,9,9);        
    }
    if(((bFocus || bRollover) && bEnabled) && DrawLAF.bDrawFocusLine)
    {
      // draw the focus lines
      g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1f));
      g2.setStroke(new BasicStroke(1f)); 
      g2.setColor(cFocus);
      g2.drawLine(1,posF-2,textWidth+14,posF-2);
      g2.drawLine(1,posF+textHeight,textWidth+14,posF+textHeight);      
    }
     // draw the label
     g2.setColor(this.getForeground());
     for(int i=0 ; i<=iIndice; i++)
     {
       g2.drawString(tLabels[i],14,posF-4+tHeight[i]);
       posF += tHeight[i] + 2 ;
     }
    // paint the check mark
    if(getProperty(ID.VALUE).toString().equalsIgnoreCase("true"))
    {
      // shadow ?
      if (bShadow) {
        g2.setStroke(new BasicStroke(3f)); 
        g2.setColor(new Color(40,40,40));
        g2.drawLine(3,posY+5,6,posY+8);
        g2.drawLine(6,posY+8,11,posY+2);          
      }
      g2.setStroke(new BasicStroke(3f)); 
      if(! bEnabled) g2.setColor(Color.gray);
      else g2.setColor(cSelect);
      g2.drawLine(2,posY+5,5,posY+8);
      g2.drawLine(5,posY+8,10,posY+2);
    }
      g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,rh);
      g2.dispose();
  }
  
  public void update(Graphics g)
  {
    paint(g);
  }

  /*----------------------------*
   * set the needed properties
   *----------------------------*/
  public boolean setProperty(ID property, Object value)
  {
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
    // set this component opaque ?
    //
    else if (property == setOpaque)
    {
        log(property+":"+value);
        if (value.toString().equalsIgnoreCase("true"))
          bOpaque = true;
        else
          bOpaque = false;
        repaint();
        return true;      
    }
    //
    // set all components opaque ?
    //
    else if (property == setOpaqueAll)
    {
        log(property+":"+value);
        if (value.toString().equalsIgnoreCase("true"))
          bOpaqueAll = true;
        else
          bOpaqueAll = false;
        repaint();
        return true;      
    }
    //
    // set shadow ckeck mark ?
    //
    else if (property == setShadow)
    {
        log(property+":"+value);
        if (value.toString().equalsIgnoreCase("true"))
          bShadow = true;
        else
          bShadow = false;
        repaint();
        return true;      
    }    
    //
    // set the initial state
    //
    else if (property == ID.VALUE)
    {
        log(property+":"+value);
        if (value.toString().equalsIgnoreCase("true"))
            bSelect = true;
        else
            bSelect = false;
        repaint();
        return super.setProperty(property, value);
    } 
    //
    // enabled ?
    //
    else if (property == ID.ENABLED)  
      {
       log(property+":"+value);
       if(value.toString().equalsIgnoreCase("true")) bEnabled = true ;
       else bEnabled = false ;
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
    else if (property == setBoxBGColor)
    {
          log("SET_BOX_BACKGROUND:"+value);
          String sColor = value.toString() ;
          Color c = ik.makeColor(sColor);
          cBoxBGColor = c ;
          repaint();
          return true;  
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

  // send a message back to Forms
  void sendMessage( String s1, String s2, String s3, String s4 )
  {
      if(dBean != null){
          list_msg.clear();
          Messages msg = new Messages(DrawLAF.ITEM_ACTION_NAME, "");
          msg = new Messages(DrawLAF.ITEM_ACTION_NAME, s1);
          list_msg.add(msg);           
          msg = new Messages(DrawLAF.ITEM_ACTION_TYPE, s2);
          list_msg.add(msg);
          msg = new Messages(DrawLAF.ITEM_ACTION_OBJECT, s3);
          list_msg.add(msg);            
          msg = new Messages(DrawLAF.ITEM_ACTION_VALUE, s4);
          list_msg.add(msg);
          try{
            dBean.dispatchanevent(DrawLAF.ITEM_ACTION, list_msg);          
          } catch (Exception ex) {};     
      }
  }     

  protected void setValue(String s){
    if(s.equalsIgnoreCase("true"))  
       setProperty(ID.VALUE,new Boolean(true));
    else
       setProperty(ID.VALUE,new Boolean(false));    
  }
  
  public void focusGained(FocusEvent e)
     {
         // put the focus on the component
         bFocus = true ;
         /*
         try {
             e.getComponent().requestFocus();
         }
         catch (Exception ex) {}
         */
         repaint();
     }
    
  public void focusLost(FocusEvent e)
     {     
       bFocus = false ;
       repaint();
     }

 
  /**
   * Utility function to print out a debug message to the Java Console
   */
  public void log(String msg)
  {
    if(bDebug)
        System.out.println(CLASSNAME + ": " + msg);
  }

  /**
   * Private class to handle user mouse actions
   */
  class ButtonMouseAdapter extends MouseAdapter
  {
    /**
     * User moved the mouse over the button
     */
    public void mouseEntered(MouseEvent me)
    {
      log("mouseEntered");
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

    /**
     * User clicked the mouse
     */
    public void mouseClicked(MouseEvent me)
    {
      if(bEnabled) bSelect = !bSelect ;
      log("mouseClicked bSelect="+bSelect);
      sendMessage( getName(), "content", "checkbox", bSelect ? "true" : "false" ) ;
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
      
    /**
     * User moved the mouse out of the button
     */
    public void mouseExited(MouseEvent me)
    {
      log("mouseExited");
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
  }
  
    //
    // Handle the key typed event from the text field.
    //
    public void keyTyped(KeyEvent e) {
        }
        
    //
    // Handle the tabulation. 
    //
    public void keyPressed(KeyEvent e) {
       int i = 0 ;
       String sComp = null;
       int iKey = (int)(e.getKeyChar()) ;
       boolean bFound = false ;
       // get the modifier
       int iModifier = e.getModifiers();
       String sModifier = KeyEvent.getKeyModifiersText(iModifier);       
       if(iKey== e.VK_SPACE){
          sendMessage( getName(), "content", "checkbox", bSelect ? "true" : "false" ) ;
       }
       if(iKey== e.VK_TAB){
          sComp = e.getComponent().getName() ;

          if(iModifier ==  e.SHIFT_MASK) {
              // find previous item
              for(i = 0; i < DrawLAF.ListItems.size(); i++) {
                  DrawLAF.newItem  ni = (DrawLAF.newItem)DrawLAF.ListItems.get(i) ;
                  if(ni.sName.equalsIgnoreCase(sComp)) {
                      if(i> 0) {
                        ni = (DrawLAF.newItem)DrawLAF.ListItems.get(i-1) ;
                        ((Component)ni.cp).requestFocus();
                        bFound = true ;
                        break;
                      }
                  }
              }
          }
          else {
              // find next item
              for(i = 0; i < DrawLAF.ListItems.size(); i++) {
                  DrawLAF.newItem  ni = (DrawLAF.newItem)DrawLAF.ListItems.get(i) ;
                  if(ni.sName.equalsIgnoreCase(sComp)) {
                      if(i<DrawLAF.ListItems.size()-1) {
                        ni = (DrawLAF.newItem)DrawLAF.ListItems.get(i+1) ;
                        ((Component)ni.cp).requestFocus();
                        bFound = true ;
                        break;
                      }
                  }
              }    
          }
          if( ! bFound ) {
             if(DrawLAF.bItemNavInside) {
                 if(iModifier ==  e.SHIFT_MASK) {
                     // goto last item
                     DrawLAF.newItem  ni = (DrawLAF.newItem)DrawLAF.ListItems.get(DrawLAF.ListItems.size()-1) ;
                     ((Component)ni.cp).requestFocus();
                 }
                 else {
                     // goto first item
                     DrawLAF.newItem  ni = (DrawLAF.newItem)DrawLAF.ListItems.get(0) ;
                     ((Component)ni.cp).requestFocus();
                 }
             }
             // send back the key event to Forms
             else 
               DrawLAF.sendKeyBack(e);
          }
       }   
    }

    //
    // Handle the key released event from the text field. 
    //
    public void keyReleased(KeyEvent e) {
    }
      
  
}