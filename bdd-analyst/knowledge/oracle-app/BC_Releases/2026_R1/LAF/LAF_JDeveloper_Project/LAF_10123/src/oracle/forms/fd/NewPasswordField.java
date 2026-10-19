package oracle.forms.fd;

import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Component;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.geom.Rectangle2D;

import java.util.ArrayList;
import java.util.List;

import javax.swing.JPasswordField;
import javax.swing.JTextField;


/**
 * A class to handle dynamic created Swing TextFields
 * <br />
 * @author   Francois Degrelle
 * creation  May 2010
 * @version  1.2
 *
 */

public class NewPasswordField extends JPasswordField  implements FocusListener, KeyListener{
    
    private  DrawLAF     dBean;  
    private  List        list_msg     = new ArrayList(10) ;        
    private  int         iMaxLength = 30000 ;
    //private  String      sText = "" ;
    private  String      sOldValue = "";  
    private  Color       cStart=null, cEnd=null;
    private  Color       cStartCur=null;
    private  Color       cEndCur=null;
    private  Color       cBorder=null;
    private  int         iBorderWidth=1;
    private  boolean     bGradient = false ;
    // gradient positions
    protected static int LeftToRight = 1;
    protected static int UpToDown = 2;
    protected static int LeftUpToRightDown = 3;
    protected static int LeftDownToRightUp = 4;
    protected int        iDirection = UpToDown;
    //private float        gfFrameTransp = .8f;
    private float        gfGradTransp  = .9f;
    private boolean      bCurrent = false ;
    private Component    cp = null;
    private JTextField   JTF=null;

    public NewPasswordField() {
      addFocusListener(this);
      addKeyListener(this);
      JTF=this;
    }
    public NewPasswordField(Component cp) {
      addFocusListener(this);
      addKeyListener(this);
      this.cp = cp;
      JTF=this;
    }    
    
    public void destroy() {
        dBean = null ;
    }
    
    void setLAFBean (DrawLAF DF) { dBean = DF ;}    
    
    void setBorder(int w, Color c){
        iBorderWidth = w;
        cBorder = c ;
    }
    
    void setCurrent(boolean b){
        bCurrent = b;
    }
    
    void setMaxLength( int i) { iMaxLength = i; }
    
    void setGradient(Color c1, Color c2, Color c3, Color c4){
        if(null != c1 && null != c2){
            this.cStart = c1;
            this.cEnd = c2;
            if(null != c3){
                cStartCur = c3 ;
                cEndCur = c4 ;
            }
            else {
                cStartCur = c2 ;
                cEndCur = c1 ;                
            }
            bGradient = true ;
        }
        else{
            bGradient = false ;
        }
    }
    
    void setGradientDirection( int i){
        if(i >0 && i < 5){
            this.iDirection = i;
        }
    }

    public void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D)g;
        int iX = (int)this.getBounds().getX();
        int iY = (int)this.getBounds().getY();
        int iW = (int)this.getBounds().getWidth();
        int iH = (int)this.getBounds().getHeight();
        // any gradient background ?
        if (bGradient) {
            int x = 0, y = 0, w = 0, h = 0;
            GradientPaint gp = null;
            if (iDirection == LeftToRight) {
                x = 0;
                y = 0;
                w = iW;
                h = 0;
            } else if (iDirection == UpToDown) {
                x = 0;
                y = 0;
                w = 0;
                h = iH;
            } else if (iDirection == LeftUpToRightDown) {
                x = 0;
                y = 0;
                w = iW;
                h = iH;
            } else if (iDirection == LeftDownToRightUp) {
                x = 0;
                y = iH;
                w = iW;
                h = 0;
            }
            // must have some transparancy to not completly
            g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, gfGradTransp));
            // create the gradient
            if(bCurrent){
                gp = new GradientPaint(x, y, cStartCur, w, h, cEndCur);
            }
            else {
                gp = new GradientPaint(x, y, cStart, w, h, cEnd);
            }
            g2.setPaint(gp);
            // fill the field
            g2.fill(new Rectangle2D.Double(0, 0, iW, iH));
            g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1.0f));
        }
        //super.paintComponent(g2);
        if (null != cBorder) {
            g2.setColor(cBorder);
            g2.setStroke(new BasicStroke((float)iBorderWidth));
            //g2.drawRoundRect(0, 0, iW, iH, 5, 5);
            g2.drawRect(0, 0, iW, iH);
        }

        super.paintComponent(g2);
        g2.dispose();
    }

    public void focusGained(FocusEvent e) {
        if (e.getComponent() == this) {
            // put the focus on the component
            if (this.isEnabled()) {
                e.getComponent().requestFocus();
                if (null != cp) {
                    setSelectionStart(0);
                    char[] input = this.getPassword();
                    String s = new String(input);
                    setSelectionEnd(s.length());
                    ((LAF_XP_TextField)cp).setProperty(oracle.forms.properties.ID.FOCUS, new Boolean("true"));
                    ((LAF_XP_TextField)cp).requestFocus();
                } else
                    sendMessage(e.getComponent().getName(), "focus", "textfield", "gained", "");
            }
        }
    }

    public void focusLost(FocusEvent e) {
        sendMessage(e.getComponent().getName(), "focus", "textfield", "lost", "");
    }

    // send a message back to Forms

    void sendMessage(String s1, String s2, String s3, String s4, String s5) {
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
        msg = new Messages(DrawLAF.ITEM_ACTION_MOUSEPOS, s5);
        list_msg.add(msg);        
        try {
            dBean.dispatchanevent(DrawLAF.ITEM_ACTION, list_msg);
        } catch (Exception ex) {
        }
        ;
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
                        repaint();
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
          if(((JTextField)e.getComponent()).getText().compareTo(sOldValue) != 0) {
            sOldValue = ((JTextField)e.getComponent()).getText() ;
            sendMessage( e.getComponent().getName(), "content", "textfield", "changed", "" ) ;
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
             else {
                 DrawLAF.sendKeyBack(e);
             }
          }
       }
       if(null != cp){
           if(e.isActionKey()){
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
