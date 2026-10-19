package oracle.forms.fd;

import java.awt.Color;
import java.awt.Component;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;

import java.util.ArrayList;
import java.util.List;

import javax.swing.JSlider;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;


/**
 * A class to handle dynamic created Swing JSlider
 * <br />
 * @author   Francois Degrelle
 * creation  August 2010
 * @version  1.0
 *
 */
 
public class NewJSlider extends JSlider implements ChangeListener,FocusListener,KeyListener{
   
  private  DrawLAF    dBean; 
  private  List       list_msg     = new ArrayList(10) ; 
 
  protected String    sSliderName = null ;
  protected int       iValue = 0 ;        // current value variable
  protected JSlider   slide  ;            // Slider pointer
  protected Color     BGcolor, FGcolor  ; // Slider colors
  protected int       iX=0, iY=0, iW=0,iH=0 ;
  protected int       iMin=0, iMax=0;
  protected int       iMajor=0, iMinor=0;
 
  public NewJSlider(
     String sName,
     int    iOrientation,
     int x, int y,
     int w, int h,
     int ival, int min, int max
  )
  {
    super();
    iX=x; iY=y; iW=w; iH=h;
    iValue = ival ;
    iMin = min; iMax=max ;
    this.setName(sName);
    addFocusListener(this);
    addChangeListener(this);
    addKeyListener(this);   
    this.setMinimum(iMin);
    this.setMaximum(iMax);
    this.setValue(iValue);
    this.setOrientation(iOrientation);
    this.setBackground(null);
    this.setOpaque(false);
    this.setBounds(iX,iY,iW,iH);
    this.setPaintTrack(true);
    this.setPaintTicks(true);
    this.setPaintLabels(true);
  }   
 
   
    public void destroy() {
        dBean = null ;
    }
   
    void setLAFBean (DrawLAF DF) { dBean = DF ;}   
   
    void setOrientation (String s) {
      if(s.equalsIgnoreCase("h")) this.setOrientation(JSlider.HORIZONTAL);
      else this.setOrientation(JSlider.VERTICAL);
    }   
   
    void setValues (int i1, int i2) {
      iMin=i1;
      iMax=i2;
    }
 
    void setCurrentValue (int i1) {
      this.setValue(i1);
    }
   
    void setTicks (int i1, int i2) {
      iMajor = i1;
      iMinor = i2;
      if(iMajor != 0) this.setMajorTickSpacing(iMajor);
      if(iMinor != 0) this.setMinorTickSpacing(iMinor);
    }   
   
    void setSize (int x, int y, int w, int h) {
      iX=x; iY=y; iW=w; iH=h ;
      this.setBounds(iX,iY,iW,iH);
    }
    void setBGColor(Color c) { BGcolor = c ; this.setBackground(c);}
    void setFGColor(Color c) { FGcolor = c ; this.setForeground(c);}
   
      // Fires when the JSlider is modified
      public void stateChanged(ChangeEvent e) {
          JSlider source = (JSlider)e.getSource();
          if (!source.getValueIsAdjusting()) {
              iValue = (int)source.getValue();
              // Dispatch event
              sendMessage( source.getName(), "content", "slider", ""+iValue ) ;
          }
      }   
     
      // send a message back to Forms
      void sendMessage( String s1, String s2, String s3, String s4 )
      {
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
 
     public void focusGained(FocusEvent e)
     {
         if (e.getComponent() == this)
         {
             // put the focus on the component
             if(this.isEnabled())
             {
                e.getComponent().requestFocus();
                sendMessage( e.getComponent().getName(), "focus", "slider", "gained" ) ;
             }
         }
     }
   
     public void focusLost(FocusEvent e)
     {    
        sendMessage( e.getComponent().getName(), "focus", "slider", "lost" ) ;
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
 