package oracle.forms.fd;

import java.awt.Component;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.util.ArrayList;
import java.util.List;

import oracle.forms.handler.IHandler;
import oracle.forms.ui.VTextArea;
import oracle.forms.properties.ID;
import oracle.ewt.lwAWT.lwText.LWCommonText;

import oracle.forms.ui.FormsToolTip;

/**
 * A class to handle dynamic created awt Forms TextArea
 * <br />
 * @author   Francois Degrelle
 * creation  May 2010
 * @version  1.1
 * 
 */

public class NewTextArea extends VTextArea  implements FocusListener, KeyListener{
    
    private DrawLAF        dBean;  
    private List           list_msg     = new ArrayList(10) ; 
    private LWCommonText   mTextArea = null;
    private String         sOldValue = "";
    
    public NewTextArea() {
    }
    
  public void init(IHandler handler)
  {
    super.init(handler);
    addFocusListener(this);
    addKeyListener(this);    
  }    
  
    public void destroy() {
        dBean = null ;
    }

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
  
    void setLAFBean (DrawLAF DF) { dBean = DF ;}    
    
    void setText(String s) { if(mTextArea != null) mTextArea.setText(s);}
    
    String getText() { 
      if(mTextArea != null) return mTextArea.getText();
      else return "" ;
    }
    
  protected LWCommonText getTextArea() { return mTextArea ; }    

  public boolean setProperty(ID pId, Object pValue)
  {

    if (mTextArea == null)
    {
      mTextArea = (LWCommonText)this.getComponent(0);
      //addKeyListener(mTextArea);    
    }

    return super.setProperty(pId, pValue);

  } 

  public void focusGained(FocusEvent e)
     {
         if (e.getComponent() == this)
         {
             // put the focus on the component
             if(this.isEnabled()) 
             {
               e.getComponent().requestFocus();
               sendMessage( e.getComponent().getName(), "focus", "textfield", "gained" ) ;
             }
         }
     }
    
  public void focusLost(FocusEvent e)
     {     
               sendMessage( e.getComponent().getName(), "focus", "textfield", "lost" ) ;
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
          e.consume();       
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
          if(mTextArea.getText().compareTo(sOldValue) != 0) {
            sOldValue = mTextArea.getText() ;
            sendMessage( e.getComponent().getName(), "content", "textfield", "changed" ) ;
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
