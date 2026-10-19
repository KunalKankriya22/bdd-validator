package oracle.forms.fd;

import java.awt.*;
import java.awt.event.*;
import java.awt.geom.Rectangle2D;
import java.net.URL;

import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;

import oracle.forms.handler.IHandler;
import oracle.forms.properties.ID;
import oracle.forms.ui.VRadioButton;

/**
 * A XP like Radio button
 * 
 * @author   Francois Degrelle
 * creation  february 2007     
 * @version  1.2
 *
 */
     
public class LAF_XP_RadioButton extends VRadioButton implements FocusListener
{
  private static final ID SETDEBUG          = ID.registerProperty("SET_DEBUG");
  private static final ID SETCOLOR          = ID.registerProperty("SET_COLOR");    
  private static final ID setScheme         = ID.registerProperty("SET_SCHEME");      
  private static final ID setOpaque         = ID.registerProperty("SET_OPAQUE");        
  private static final ID setOpaqueAll      = ID.registerProperty("SET_OPAQUE_ALL"); 
  // mouse events
  public final static ID pSetEvent         = ID.registerProperty("ENABLE_EVENTS");
  public final static ID pItemName         = ID.registerProperty("ITEM_NAME");    
  public final static ID pSetMouseEvents   = ID.registerProperty("SET_MOUSE_EVENTS");  
  public final static ID pEventMouseEvent  = ID.registerProperty("MOUSEEVENT_MESSAGE");  
  public final static ID pEventMouseMsg    = ID.registerProperty("MOUSE_EVENT");   
  
  private final      String CLASSNAME = this.getDefaultName();
  private IHandler         m_handler;
  private DrawLAF          dBean = null;  
  private boolean          bFocus     = false ;
  private boolean          bRollover  = false ;  
  private boolean          bSelect    = false ;    
  private boolean          bOpaque    = true ;
  protected        Color   cFocus     = DrawLAF.cFocus != null ? DrawLAF.cFocus : new Color(255,214,47);
  protected        Color   cGreenXP   = new Color(0,230,0) ;
  static protected Color   cSelect    = DrawLAF.cSelect != null ? DrawLAF.cSelect : new Color(0,230,0) ;
  private URL              m_codeBase;
  static protected boolean bDebug     = false;
  static private boolean   bOpaqueAll = false;
  private ImageKit         ik = new ImageKit();
  // mouse events
  private List        list_msg     = new ArrayList(10) ; 
  private boolean     bSendEvents   = false ;
  private String      sItemName     = null ;  
  private boolean     bMouseEnter  = false ;
  private boolean     bMouseClick  = false ;
  private boolean     bMouseExit   = false ;    

  public LAF_XP_RadioButton()
  {
    super();
  }

  public void init(IHandler handler)
  {
    m_handler = handler;
    m_codeBase = handler.getCodeBase();
    super.init(handler);
    addMouseListener(new ButtonMouseAdapter());
    addFocusListener(this);
  }
  
    public void destroy() {
        dBean = null ;
    }

    void setLAFBean (DrawLAF DF) { dBean = DF ;}    
    DrawLAF getLAFBean() { return dBean; }   
  
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
    // draw the rounded check
    g2.setStroke(new BasicStroke(1f)); 
    g2.setColor(Color.white);
    g2.fillArc(0,posY+1,10,10,0,360);
    g2.setStroke(new BasicStroke(1.5f)); 
    g2.setColor(new Color(160,160,160));
    g2.drawArc(0,posY+1,10,10,0,360);

    if(bRollover && this.isEnabled())
    {
      g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.5f));
      g2.setColor(cSelect);
      g2.setStroke(new BasicStroke(1f)); 
      g2.drawOval(3,posY+4,5,5);
    }
    if(((bFocus || bRollover) && this.isEnabled()) && DrawLAF.bDrawFocusLine)
    {
        // draw the focus lines
        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1f));
        g2.setStroke(new BasicStroke(1f)); 
        g2.setColor(cFocus);
        g2.drawLine(1,1,textWidth+14,1);
        g2.drawLine(1,(int)this.getBounds().getHeight()-1,textWidth+14,(int)this.getBounds().getHeight()-1);
    }
    // draw the label
    g2.setColor(this.getForeground());
    for(int i=0 ; i<=iIndice; i++)
    {
        g2.drawString(tLabels[i],14,posF-4+tHeight[i]);
        posF += tHeight[i] + 2 ;
    }
    // paint the check mark
    if(super.getProperty(ID.VALUE).toString().equalsIgnoreCase("true"))
    {
      if(!this.isEnabled()) g2.setColor(Color.gray);
      else g2.setColor(cSelect);
      g2.fillOval(3,posY+4,5,5);
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
    // set the value
    //
    else if (property == ID.VALUE)
    {
        log(property+":"+value);
        if (value.toString().equalsIgnoreCase("true"))
          bSelect = true;
        else
          bSelect = false;
        invalidate();
        return super.setProperty(property, value); 
      } 
    else if (property == ID.LABEL)
    {
        log(property+":"+value);
        log("value:"+getProperty(ID.VALUE));
        return super.setProperty(property, value); 
      }       
    else if (property == SETCOLOR)
    {
        log(property+":"+value);
        String sColor = value.toString() ;
        Color c = ik.makeColor(sColor);
        cSelect = c ;
        invalidate();
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

  /*---------------*
   *   focus stuff
   *---------------*/
  public void focusGained(FocusEvent e)
     {
         // put the focus on the component
         bFocus = true ;
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
    /**
     * User clicked the mouse
     */
    public void mouseClicked(MouseEvent me)
    {
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
    
  }
}