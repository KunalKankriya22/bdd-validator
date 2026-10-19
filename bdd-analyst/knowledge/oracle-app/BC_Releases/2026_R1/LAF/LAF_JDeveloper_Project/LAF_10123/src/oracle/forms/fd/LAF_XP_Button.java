package oracle.forms.fd;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Image;
import java.awt.Point;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

import java.net.URL;

import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;

import oracle.forms.handler.IHandler;
import oracle.forms.properties.ID;
import oracle.forms.ui.VButton;


/**
 * A XP like Swing JButton's PJC
 * <br />
 * the standard Forms button is overloaded
 * by a Swing JButton to allow
 * the XP L&F style
 * <br />
 * need the JRE 1.4 to use Gradient feature
 *
 * @author   Francois Degrelle
 * creation  february 2007
 * @version  1.6
 *
 */
     
public class LAF_XP_Button extends VButton implements FocusListener
{
  private static final   ID SETIMAGE           = ID.registerProperty("SET_IMAGE");  
  private static final   ID SETIMAGEON         = ID.registerProperty("SET_IMAGE_ON");
  private static final   ID SETIMAGEOFF        = ID.registerProperty("SET_IMAGE_OFF");
  private static final   ID SETBORDER          = ID.registerProperty("SET_BORDER");
  private static final   ID SETSHAREDIMAGENAME = ID.registerProperty("SET_SHARED_IMAGE_NAME");      
  private static final   ID SETDEBUG           = ID.registerProperty("SET_DEBUG");
  private static final   ID SETBACKGROUNDCOLOR = ID.registerProperty("SET_BACKGROUND_COLOR");
  private static final   ID SETTEXTPOS         = ID.registerProperty("SET_TEXT_POSITION");  
  private static final   ID SETFOCUSCOLOR      = ID.registerProperty("SET_FOCUS_COLOR");    
  private static final   ID SETSHADOWCOLOR     = ID.registerProperty("SET_SHADOW_COLOR");  
  private static final   ID SETIMAGEPOS        = ID.registerProperty("SET_IMAGE_POSITION");  
  private static final   ID setScheme          = ID.registerProperty("SET_SCHEME");    
  private static final   ID setSeparator       = ID.registerProperty("SET_SEPARATOR");      
  private static final   ID setDisableImage    = ID.registerProperty("SET_DISABLE_IMAGE");
  private static final   ID setPressedImage    = ID.registerProperty("SET_IMAGE_PRESSED");          
  private static final   ID setDisabledImage   = ID.registerProperty("SET_IMAGE_DISABLED");            
  private static final   ID setRolloverMark    = ID.registerProperty("SET_ROLLOVER_MARK");
    // mouse events
  public final static ID pSetEvent         = ID.registerProperty("ENABLE_EVENTS");
  public final static ID pSetMouseEvents   = ID.registerProperty("SET_MOUSE_EVENTS");  
  public final static ID pEventMouseEvent  = ID.registerProperty("MOUSEEVENT_MESSAGE");  
  public final static ID pEventMouseMsg    = ID.registerProperty("MOUSE_EVENT"); 
  public final static ID pItemName         = ID.registerProperty("ITEM_NAME");  
  
  private final String   CLASSNAME = this.getDefaultName();
  private DrawLAF        dBean;  
  private String         sInitialLabel = "" ;
  private IHandler       m_handler;
  private URL            m_codeBase;
  private boolean        bDebug = false;
  public  XPButton       pb ;
  private boolean        bFirst = true ;
  private boolean        bInit = true ;
  private char           cSeparator = '|' ;
  private String         sButtonName = null ;
  private ImageKit       ik = new ImageKit();
  private ButtonMouseAdapter bma = null ;
  // mouse events
  private String         sItemName     = null ;
  private boolean        bSendEvents   = false ;
  private boolean        bMouseEnter  = false ;
  private boolean        bMouseClick  = false ;
  private boolean        bMouseExit   = false ;    
  private List           list_msg     = new ArrayList(10) ;    


  public LAF_XP_Button()
  {
    super();
    pb = new XPButton("");
  }

  public void init(IHandler handler)
  {
    m_handler = handler;
    try {
      m_codeBase = handler.getCodeBase();
    }
    catch(Exception ex) {}
    super.init(handler);
    bma = new ButtonMouseAdapter() ;
    addMouseListener(bma);
    addFocusListener(this);
  }
  
    public void destroy() {
        dBean = null ;
    }

    void setLAFBean (DrawLAF DF) { dBean = DF ;}    
    DrawLAF getLAFBean() { return dBean; }   

  public void paint(Graphics p0)
  {
    if(bFirst)
    {
       // get the native button info
       log("paint() first");
       pb.setBounds(this.getBounds());
       this.getParent().add(pb);
       bFirst = false ;
    }
  }

  /*----------------------------*
   * set the needed properties
   *----------------------------*/
  public boolean setProperty(ID property, Object value)
  {
    log(property+":"+value);
    // set the label
    if (property == ID.LABEL)
    {
      log("Setting Label to : " + value.toString());
      String label = value.toString();
      if(label.equalsIgnoreCase("null")) label = null ;
      if(pb != null)
      {
        // replace separator by carriage return
        pb.setLabel(label.replace(cSeparator, '\n'));
        sInitialLabel = label ;
        pb.invalidate();
      }
      return super.setProperty(property, label);
    }

    // Visible
    else if (property == ID.VISIBLE)
    {
      String s = value.toString();
      if(s.equalsIgnoreCase("true"))
      {
          if(pb != null){
              pb.setVisible(true);
          }
          removeMouseListener(bma);
          removeFocusListener(this);
          addMouseListener(bma);
          addFocusListener(this);          
      }
      else
          if(pb != null){
              pb.setVisible(false);
          }      
      return super.setProperty(property, value);
    }
        
    // set the NewLine separator
    else if (property == setSeparator)
    {
      log(property+":"+value);
      String s = value.toString() ;
      String label = sInitialLabel ;
      char c ;
      try 
      {
         c = s.charAt(0) ;
         cSeparator = c ;
         // replace separator by carriage return
         if(label != null)
         {
           pb.setLabel(label.replace(cSeparator, '\n'));
           pb.invalidate();
         }
      }
      catch (Exception e) { System.out.println(e.toString()); }
      return true ;
    }
    //
    // original iconic bouton ?
    //
    else if (property == ID.IMAGE)
      {
        try{
          Image img = (Image)value ;
          pb.setBTImage(img) ;
          pb.invalidate();        
        }
        catch(Exception e){System.out.println("LAF_XP_Button Image:"+e.toString());}
        return super.setProperty(property, value);
    }
    else if (property == ID.FOREGROUND)
    {
      log("Setting Foreground to " + value.toString());
      Color c = (Color)value;
      if(pb != null && c != null)
      {
        pb.setFGcolor(c);
        pb.invalidate();
      }
      return super.setProperty(property, c);
    }    
    else if (property == ID.BACKGROUND)
    {
      Color c = (Color)value;
      if( ! bFirst)
      {
          log("Setting Background to " + value.toString());
          if(pb != null && c != null)
          {
            pb.setBGcolor(c);
            pb.invalidate();
          }
      }
      return super.setProperty(property, c);
    }
    else if (property == ID.FONT)
    {
      log("Setting Font to " + value.toString());
      Font f = (Font)value;
      if(pb != null && f != null)
      {
        pb.setFonte(f);
        pb.invalidate();
      }
      return super.setProperty(property, f);
    }  
    else if (property == ID.LOCATION)
    {
      log("Setting Location to " + value.toString());
      Point p = (Point)value;
      if(pb != null && p != null)
      {
        pb.setLocation(p);
        pb.invalidate();
      }
      return super.setProperty(property, p);
    }            
    //
    // set the debug mode
    //
    else if (property == SETDEBUG)
    {
      if (value.toString().equalsIgnoreCase("true"))
        bDebug = true;
      else
        bDebug = false;

      log("Debugging " + bDebug);
      return true;
    }

     //
     // gray icon when button is disabled
     //
     else if (property == setDisableImage)
     {
       if (value.toString().equalsIgnoreCase("true"))
         pb.setGrayDisable(true);
       else
         pb.setGrayDisable(false);
       return true;
     }    
      
    //
    // set the label position
    //
    else if (property == SETTEXTPOS)
    {
      String s = value.toString() ;
      if(s.equalsIgnoreCase("left")) pb.setTextPosition(1);
      else if(s.equalsIgnoreCase("center")) pb.setTextPosition(2);
      else if(s.equalsIgnoreCase("right")) pb.setTextPosition(3);
      log("setProperty - SETTEXTPOS value=" + value.toString());
      pb.invalidate();
      return true;
    }
    //
    // set the shadow color
    //
    else if (property == SETSHADOWCOLOR)
    {
      log("setProperty - SETSHADOWCOLOR value=" + value.toString());
          String sColor = value.toString().trim();
          Color c = ik.getInstance().makeColor(sColor);
          pb.setShadowcolor(c);
          pb.invalidate();                 
      return true;
    }    
    //
    // set the border color
    //
    else if (property == SETBACKGROUNDCOLOR)
    {
      log("setProperty - SETBACKGROUNDCOLOR value=" + value.toString());
          String sColor = value.toString().trim();
          if(sColor.equalsIgnoreCase("null")){
              pb.setBackgroundcolor(null);
              pb.setBGcolor(null);
              return true;
          }
          Color c = ik.getInstance().makeColor(sColor);
          pb.setBackgroundcolor(c);
          pb.invalidate();       
      return true;
    }  
    
      //
      // set the focus color
      //
      else if (property == SETFOCUSCOLOR)
      {
        log("setProperty - SETFOCUSCOLOR value=" + value.toString());
            String sColor = value.toString().trim();
            Color c = ik.getInstance().makeColor(sColor);
            pb.setFocusColor(c);
        return true;
      }     
    //
    // read an image from a file
    //
    else if (property == SETIMAGE)  
        {
          String s = value.toString() ;
          String sPos = null ;
          Image img = null ;
          log("setProperty - SETIMAGE value=" + s);
          String sFileName = s ;
          int    iPos = s.indexOf(",");
          if(iPos > -1)
          {
            sFileName = s.substring(0,iPos) ;
            sPos = (s.substring(iPos+1));
            log("filename="+sFileName+" position="+sPos);            
          }
          if(! sFileName.equalsIgnoreCase("null") && (! pb.isImageLoaded(0, sButtonName))) {
            System.out.println("loading (shared) icon filename="+sFileName);                            
            img = ik.loadImage( sFileName ) ;
            pb.setBTImage(img) ;
          }  
          if(sPos != null) pb.setImagePosition(sPos.toUpperCase());
          pb.mouseON();
          pb.invalidate();
          return true;
    }
    //
    // set the IMAGE ON image
    //
    else if (property == SETIMAGEON)  
        {
          String sFileName = value.toString() ;
          Image img = null ;
          log("setProperty - SETIMAGEON value=" + sFileName);
          if(! sFileName.equalsIgnoreCase("null") && (! pb.isImageLoaded(1, sButtonName))) {
            System.out.println("loading (shared) icon filename="+sFileName);                            
            img = ik.loadImage( sFileName ) ;
            if(img != null) pb.setImageON(img) ;
          }                      
          /*
          img = ik.loadImage( sFileName ) ;
          pb.setImageON(img) ;
          pb.invalidate();
          */
          return true;
    } 
    
    //
    // set the IMAGE OFF image
    //
    else if (property == SETIMAGEOFF)  
        {
          String sFileName = value.toString() ;
          Image img = null ;
          log("setProperty - SETIMAGEOFF value=" + sFileName);
          if(! sFileName.equalsIgnoreCase("null") && (! pb.isImageLoaded(2, sButtonName))) {
            System.out.println("loading (shared) icon filename="+sFileName);                            
            img = ik.loadImage( sFileName ) ;
            if(img != null) pb.setImageOFF(img) ;
          }                                
          /*
          img = ik.loadImage( sFileName ) ;
          pb.setImageOFF(img) ;
          pb.invalidate();
          */
          return true;
    }        

    //
    // set image for button collection
    //
    else if (property == SETSHAREDIMAGENAME)  
        {
          String s = value.toString() ;
          log("setProperty - SETSHAREDIMAGENAME value=" + s);          
          if(s != null) {
            sButtonName = s ;
            pb.setButtonName(s);
          }  
          return true ;
    }    
    
    //
    // icon when button is pressed
    //
    else if (property == setPressedImage)
    {
        String sFileName = value.toString() ;
        Image img = null ;
        log("setProperty - SetPressedImage value=" + sFileName);
        if(! sFileName.equalsIgnoreCase("null") && (! pb.isImageLoaded(3, sButtonName))) {
            System.out.println("loading (shared) icon filename="+sFileName);                            
            img = ik.loadImage( sFileName ) ;
            if(img != null) pb.setImagePressed(img) ;
        }        
        /*
        img = ik.loadImage( sFileName ) ;
        pb.setImagePressed(img) ;
        */
      return true;
    }    

    //
    // icon when button is disabled
    //
    else if (property == setDisabledImage)
    {
        String sFileName = value.toString() ;
        Image img = null ;
        log("setProperty - SetDisabledImage value=" + sFileName);
        if(! sFileName.equalsIgnoreCase("null") && (! pb.isImageLoaded(4, sButtonName))) {
            System.out.println("loading (shared) icon filename="+sFileName);                            
            img = ik.loadImage( sFileName ) ;
            if(img != null) pb.setImageDisabled(img) ;
        }        
      return true;
    }    
    
    //
    // draw/hide the rollover yellow mark
    //
    else if (property == setRolloverMark) 
     {
         String s = value.toString() ;
         if(s.equalsIgnoreCase("true")) 
            pb.setRolloverMark(true);
         else 
            pb.setRolloverMark(false);
         pb.invalidate();
         return true;         
     }
    
    //
    // draw/hide the border
    //
    else if (property == SETBORDER) 
     {
         String s = value.toString() ;
         if(s.equalsIgnoreCase("true")) 
            pb.setBorder(true);
         else 
            pb.setBorder(false);
         pb.invalidate();
         return true;         
     }     
    //
    // set the image position
    //
    else if (property == SETIMAGEPOS)  
        {
          String s = value.toString() ;
          log("setProperty - SETIMAGEPOS value=" + s);
          pb.setImagePosition(s);
          pb.invalidate();
          return true;
    }
    else if (property == ID.IS_DEFAULT)  
    {
     pb.bDefault = true ;
     return super.setProperty(property, value);
    }
    //
    // enable ?
    //
    else if (property == ID.ENABLED)  
      {
       log(property+":"+value);
       super.setProperty(property, value);
       if(value.toString().equalsIgnoreCase("true")) pb.setEnable(true) ;
       else if(value.toString().equalsIgnoreCase("false")) pb.setEnable(false) ;
       else return false ;
       pb.invalidate();
       return true;
      }    
    //
    // visible ?
    //
    else if (property == ID.VISIBLE)  
     {
       log(property+":"+value);
       if(value.toString().equalsIgnoreCase("true")) pb.setVisible(true) ;
       else pb.setVisible(false) ;
       pb.invalidate();
       return super.setProperty(property, value);
     }        
    //
    // WIDTH
    //

    else if (property == ID.OUTERSIZE)  
     {
       log(property+":"+value);
       Point p = (Point)value ;
       pb.setSize(p.x, p.y);
       pb.invalidate();
       return super.setProperty(property, value);
     }

    //
    // set the current scheme 
    //
    else if (property == setScheme) 
    {
      DrawLAF.setScheme(value.toString().trim());
      log("SET_SCHEME final color:"+DrawLAF.Current_Color);
      pb.setBackgroundcolor(DrawLAF.Current_Color);
      pb.invalidate();
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


  public void focusGained(FocusEvent e)
     {
         try {
             if (e.getComponent() == this)
             {
                 // put the focus on the component
                 if(this.isEnabled()) 
                 {
                   //e.getComponent().requestFocus();
                   pb.bFocus = true ;
                 }
             }
         }
         catch (Exception ex) { }
     }
    
  public void focusLost(FocusEvent e)
     {     
       pb.bFocus = false ;
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
      pb.bOverflew=true ;
      pb.mouseON();
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
      pb.bOverflew=false ;
      pb.mouseOFF();
      if(bMouseEnter){
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
    public void mouseClicked(MouseEvent e) {
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
    
    public void mousePressed(MouseEvent e) {
        pb.setPressed(true) ;
    }

    public void mouseReleased(MouseEvent e) {
        pb.setPressed(false) ;
    }
    
  }

}