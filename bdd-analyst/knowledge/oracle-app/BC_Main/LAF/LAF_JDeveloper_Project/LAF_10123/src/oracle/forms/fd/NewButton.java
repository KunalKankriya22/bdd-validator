package oracle.forms.fd;

import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Component;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.Insets;
import java.awt.Point;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.geom.Rectangle2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.swing.ImageIcon;
import javax.swing.border.AbstractBorder;
import javax.swing.border.Border;

import oracle.forms.handler.IHandler;
import oracle.forms.properties.ID;
import oracle.forms.ui.FormsToolTip;
import oracle.forms.ui.VButton;


/**
 * A class to handle dynamic created LAF buttons
 * <br />
 * @author   Francois Degrelle
 * creation  May 2010
 * @version  1.1
 *
 */
 
public class NewButton extends VButton  implements FocusListener, KeyListener
{
  protected String    sButtonName = null ;
  protected boolean   bGradient = true ;
  protected float     fWidth = 1.0f ;
  protected float     fStroke = 1.5f ;
  // gradient positions
  public static int   LeftToRight = 1 ;
  public static int   RightToLeft = 2 ;
  public static int   UpToDown = 3 ;
  public static int   DownToUp = 4 ;
  public static int   UpLeftToDownRight = 5 ;  
  // text position
  public static int   Left   = 1 ;
  public static int   Center = 2 ;
  public static int   Right  = 3 ;
  // colors
  protected Color     cStart   = new Color(255,255,255) ;
  protected Color     cEnd     = DrawLAF.Current_Color ;
  protected Color     cDefault = new Color(51,133,255);
  protected Color     cFocus   = DrawLAF.cFocus ;
  protected Color     cDisable = DrawLAF.cDisable != null ? DrawLAF.cDisable : new Color(100,100,100);  
  protected Color     cFG      = Color.black ;
  protected Color     cBG      = Color.white ;
  protected Color     cBack    = Color.white ;
  protected Color     cBorder  = Color.gray ;  
  protected int       igrDir   = UpToDown ;
  protected int       iTextPos = Center ;
  protected int       iImgPos  = Left ;
  protected Font      font     = new Font("Arial", Font.PLAIN, 12) ;
  // image
  private   static HashMap    hIcons         = new HashMap() ;
  private   static HashMap    hIconsOn       = new HashMap() ;
  private   static HashMap    hIconsOff      = new HashMap() ;
  private   static HashMap    hIconsPressed  = new HashMap() ;    
  private   static HashMap    hIconsDisable  = new HashMap() ;  
  protected Image     image = null ;
  protected ImageIcon ic    = null ;
  protected ImageIcon[] tic    = {null,null,null,null,null} ;
  protected int       iImg = 0 ;
  protected String    sImgPos = "CM" ;
  protected int       iX=0, iY=0, iW=0,iH=0 ;
  protected int       iImgW=0, iImgH=0 ;
  protected int[]     tiImgW={0,0,0,0,0},tiImgH={0,0,0,0,0} ;  
  protected boolean   bGrayDisableImages = true ;
  // rounded parameters
  protected int       iArcWidth  = 10 ;
  protected int       iArcHeight = 10 ;
  protected int       iDec = 6 ;
  protected boolean   bFocus    = false ;
  protected boolean   bDefault  = false ;
  protected boolean   bEnable   = true ;
  protected boolean   bPressed  = false ;
  protected boolean   bOverflew = false ; 
  protected boolean   bRolloverMark = true ;
  protected BasicStroke focusStroke=null;
  protected static boolean   bLog = false ;
  protected String    sAction = null ;
  private IHandler    m_handler;  
  private   DrawLAF   dBean;  
  
  // constructor
  public NewButton(String sLabel)
  {
    Border br1 = new RoundBorder ( ) ;
    setLabel(sLabel);
    setNumImage(0);
    addMouseListener(new ButtonMouseAdapter());
    addFocusListener(this);
    addKeyListener(this);
  }
  
  public NewButton(
     String sName,
     String sLabel,
     String sAction,
     int x, int y,
     int w, int h,
     IHandler handler
     )
  {
    Border br1 = new RoundBorder ( ) ;
    setName(sName);
    setLabel(sLabel);
    setNumImage(0);
    setLocation (x,y);
    setSize(w,h);
    this.sAction = sAction ;
    m_handler = handler ;
    addMouseListener(new ButtonMouseAdapter());
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
  protected void setButtonName( String sName ) { sButtonName = sName; }
  protected void setFGcolor( Color c ) { cFG = c ; this.setForeground(c);}
  protected void setBGcolor( Color c ) 
  { 
    /*
    if(c.getBlue() > 0 && c.getRed() > 0 && c.getGreen() > 0){cBG = c ; this.setBackground(c);}
    else {cBG = Color.white ; this.setBackground(c);}
    bGradient = false ;
    */
    cEnd = c ;
  }
  protected int getIconWidth(){
      if(tic[0] != null) {
          return tic[0].getIconWidth() ;
      }
      else return 0 ;
  }
  protected String getAction() { return sAction ; }  
  protected void setShadowcolor( Color c ) { cBack = c ; }  
  protected void setBackgroundcolor( Color c ) { cEnd = c ; }    
  protected void setDirection(int iDirection) { igrDir = iDirection ; }
  protected void setTextPosition(int iPos) { iTextPos = iPos ; }
  protected void setImagePosition(String sPos) { sImgPos = sPos ; }  
  protected void setFonte(Font f) { font = f ; }
  protected void setEnable(boolean b) { bEnable = b ; }
  //protected void setVisible(boolean b) { this.setVisible(b); }
  protected void setGrayDisable(boolean b) { bGrayDisableImages = b ; }  
  protected void setRolloverMark(boolean b) { bRolloverMark = b ; }  
  protected boolean isImageLoaded( int iType, String sName ) {
      switch(iType) {
          case 0: if(hIcons.get(sName) != null)        return true; else return false ; 
          case 1: if(hIconsOn.get(sName) != null)      return true; else return false ;
          case 2: if(hIconsOff.get(sName) != null)     return true; else return false ;
          case 3: if(hIconsPressed.get(sName) != null) return true; else return false ;
          case 4: if(hIconsDisable.get(sName) != null) return true; else return false ;
      }
      return false ;
  }
  protected void setPressed(boolean b) { 
    bPressed = b ; 
    if(b) setNumImage(3);
    else  setNumImage(0);
  }    
  protected void setBTImage(Image i) 
  { 
    tic[0]  = null;
    if(i != null)
    {
      if(sButtonName == null) {
        tic[0]   = new ImageIcon(i);
        tiImgW[0] = tic[0].getIconWidth() ;
        tiImgH[0] = tic[0].getIconHeight() ;
      }
      else {
        ImageIcon ii = (ImageIcon)hIcons.get(sButtonName);
        if(ii == null) {
          ii = new ImageIcon(i) ;
          hIcons.put(sButtonName, ii);
          tiImgW[0] = ii.getIconWidth() ;
          tiImgH[0] = ii.getIconHeight() ;          
          log("Shared image added to button:"+sButtonName+"  "+this.getName());
        }  
      }
    }
    setNumImage(0);
    setImageON(i);
    repaint();
  }
  protected void setImageON(Image i) 
  { 
    tic[1]  = null;
   
    if(i != null)
    {
      if(sButtonName == null) {
        tic[1]  = new ImageIcon(i);
        tiImgW[1] = tic[1].getIconWidth() ;
        tiImgH[1] = tic[1].getIconHeight() ;
      }
      else {
        ImageIcon ii = (ImageIcon)hIconsOn.get(sButtonName);
        if(ii == null) {
          ii = new ImageIcon(i) ;
          hIconsOn.put(sButtonName, ii);
          tiImgW[1] = ii.getIconWidth() ;
          tiImgH[1] = ii.getIconHeight() ;                    
          log("ON Shared image added to button:"+sButtonName+"  "+this.getName());
        }  
      }
    }  
  }
  protected void setImageOFF(Image i) 
  { 
    tic[2] = null;
   
    if(i != null)
    {
      if(sButtonName == null) {
        tic[2] = new ImageIcon(i);
        tiImgW[2] = tic[2].getIconWidth() ;
        tiImgH[2] = tic[2].getIconHeight() ;
      }
      else {
        ImageIcon ii = (ImageIcon)hIconsOff.get(sButtonName);
        if(ii == null) {
          ii = new ImageIcon(i) ;
          hIconsOff.put(sButtonName, ii);
          tiImgW[2] = ii.getIconWidth() ;
          tiImgH[2] = ii.getIconHeight() ;                    
          log("OFF Shared image added to button:"+sButtonName+"  "+this.getName());
        }  
      }          
    }  
  }
  
  protected void setImagePressed(Image i) 
  { 
      tic[3] = null;
     
      if(i != null)
      {
        if(sButtonName == null) {
          tic[3] = new ImageIcon(i);
          tiImgW[3] = tic[3].getIconWidth() ;
          tiImgH[3] = tic[3].getIconHeight() ;
        }
      else {
        ImageIcon ii = (ImageIcon)hIconsPressed.get(sButtonName);
        if(ii == null) {
          ii = new ImageIcon(i) ;
          hIconsPressed.put(sButtonName, ii);
          tiImgW[3] = ii.getIconWidth() ;
          tiImgH[3] = ii.getIconHeight() ;
          log("PRESSED Shared image added to button:"+sButtonName+"  "+this.getName());
        }  
      }                  
      }  
  }

  protected void setImageDisabled(Image i) 
  { 
        tic[4] = null;
       
        if(i != null)
        {
          if(sButtonName == null) {
            tic[4] = new ImageIcon(i);
            tiImgW[4] = tic[4].getIconWidth() ;
            tiImgH[4] = tic[4].getIconHeight() ;
          }
          else {
            ImageIcon ii = (ImageIcon)hIconsDisable.get(sButtonName);
            if(ii == null) {
              ii = new ImageIcon(i) ;
              hIconsDisable.put(sButtonName, ii);
              tiImgW[4] = ii.getIconWidth() ;
              tiImgH[4] = ii.getIconHeight() ;                    
              log("DISABLE Shared image added to button:"+sButtonName+"  "+this.getName());
            }  
          }                            
        }  
  }
    
  protected void mouseON()
  {
     setNumImage(1);
     repaint();
  }
  protected void mouseOFF()
  {
     setNumImage(2);
     repaint();
  }
  protected void setNumImage(int iNum)
  {
    int i = iNum ;
    if(sButtonName == null) { 
      ic = tic[iNum];
      if(ic == null && i > 0) { ic = tic[0] ; i = 0 ; }
    }  
    else {
        switch(iNum) {
            case 0: if(hIcons.get(sButtonName) != null) ic = (ImageIcon)hIcons.get(sButtonName); break ;
            case 1: if(hIconsOn.get(sButtonName) != null) ic = (ImageIcon)hIconsOn.get(sButtonName); break ;
            case 2: if(hIconsOff.get(sButtonName) != null) ic = (ImageIcon)hIconsOff.get(sButtonName); break ;
            case 3: if(bPressed && hIconsPressed.get(sButtonName) != null) ic = (ImageIcon)hIconsPressed.get(sButtonName); 
                    else if(hIcons.get(sButtonName) != null) ic = (ImageIcon)hIcons.get(sButtonName); 
                    break ;    
            case 4: if(!bEnable && hIconsDisable.get(sButtonName) != null) ic = (ImageIcon)hIconsDisable.get(sButtonName); break ;            
        }
    }
    iImgW = tiImgW[i] ;
    iImgH = tiImgH[i] ;
  }
  
  public boolean setProperty(ID property, Object value)
  {
  
    if (property == ID.IS_DEFAULT)  
    {
     bDefault = true ;
     return super.setProperty(property, value);
    }
    
    else
    {
     return super.setProperty(property, value);
    }
  }
  
  
  /*------------------------*
   *   Paint the component
   *------------------------*/
  public void paint (Graphics g)  
  {
      Graphics2D g2 = (Graphics2D) g ;
      g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
      Object rh = g2.getRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING);
      g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,RenderingHints.VALUE_TEXT_ANTIALIAS_ON);     
      
      int iTx,iTy ;
      Rectangle focusRect = null;
      //cEnd = DrawLAF.Current_Color ;
      iX = (int)this.getBounds().getX() ;
      iY = (int)this.getBounds().getY() ;
      iW = (int)this.getBounds().getWidth() ;
      iH = (int)this.getBounds().getHeight() ;
      g2.setColor(cBG);
      if(bOverflew && bEnable)
        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.7f));
        
      g2.fill(new RoundRectangle2D.Double(3,3,iW-4,iH-4,iArcWidth,iArcHeight));
      
      if(bGradient)
      {
        if(igrDir == LeftToRight)
        {
          GradientPaint gradient = new GradientPaint(0,0,cStart,iW,iH,cEnd);
          g2.setPaint(gradient);
          g2.fill(new RoundRectangle2D.Double(3,3,iW-4,iH-5,10,10)) ;
        }
        else if(igrDir == RightToLeft)
        {
          GradientPaint gradient = new GradientPaint(iW,iH,cStart,0,0,cEnd);
          g2.setPaint(gradient);
          g2.fill(new RoundRectangle2D.Double(3,3,iW-4,iH-5,10,10)) ;
        }
        else if(igrDir == UpToDown) // default
        {
          GradientPaint gradient = new GradientPaint(2,iH/2,cStart,2,iH,cEnd);
          g2.setPaint(gradient);
          g2.fill(new RoundRectangle2D.Double(3,iH/2,iW-6,(iH/2)-1,10,10)) ;
        }        
        else if(igrDir == DownToUp)
        {
          GradientPaint gradient = new GradientPaint(0,iH,cStart,0,0,cEnd);
          g2.setPaint(gradient);
          g2.fill(new RoundRectangle2D.Double(3,3,iW-4,iH-5,10,10)) ;
        }            
      }
      
      // draw border
      focusStroke=new BasicStroke(1f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL);
      focusRect = this.getBounds();
      g2.setStroke(focusStroke);
      g.setColor(Color.gray);
      g2.drawRoundRect ( 3 , 3 , focusRect.width-5 , focusRect.height-5 , 8, 8) ;       

      ImageIcon icbak = ic ;
      // image to draw ?

      if(!bEnable) {
        if(sButtonName != null) {
          ImageIcon ii = (ImageIcon)hIconsDisable.get(sButtonName);
          if(ii != null) ic = ii ; else ic = tic[4] ; 
        }
        else if((tic[4] != null)) ic = tic[4] ; 
      }

      if (ic != null)
      {
         // paint the image
         Point p = SetImgCoordinate();
         if(! bEnable && bGrayDisableImages && (tic[4] == null)) {
             BufferedImage image = new BufferedImage(ic.getIconWidth(), ic.getIconHeight(), BufferedImage.TYPE_INT_ARGB); 
             Graphics2D gc = (Graphics2D)image.getGraphics();
             gc.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_IN, 0.6f));
             ic.paintIcon(null, image.getGraphics() , 0 , 0 );
             gc.drawImage(image, 0, 0, null);  
             gc.dispose();
             ImageIcon ic2 = new ImageIcon(image);
             ic2.paintIcon(this,g2,p.x,p.y);
         }
         else ic.paintIcon(this,g2,p.x,p.y);
      }
      ic = icbak ;
      if(this.getLabel() == null) return ;
      
      //
      // label
      // 
      String sLabel     = this.getLabel() ;
      String tLabels[]  = new String[10] ;
      int    tHeight[]  = new int[10] ;
      int    iIndice    = -1 ;
      int    textHeight = 0;
      int    textWidth  = 0;       
      int    iPos = 0;
      int    posY       = (this.getBounds().height/2) -6 ;
      int    posF       = (this.getBounds().height/2) - (textHeight/2) ;      

      // '&' elimination
      int iLen = 0 ;
      int iPosAmp = sLabel.indexOf('&') ;
      if(iPosAmp > -1)
      {
        FontMetrics fm = g2.getFontMetrics(font);
        Rectangle2D rect = null ;
        String sLetter = sLabel.substring(iPosAmp+1,iPosAmp+2) ;
        rect = fm.getStringBounds(sLetter, g2);
        iLen = (int)rect.getWidth() ;                
        sLabel = sLabel.substring(0,iPosAmp) + sLabel.substring(iPosAmp+1,sLabel.length());
        for(int i=0 ; i<iPosAmp; i++) {
          rect = fm.getStringBounds(sLabel.substring(i,i+1), g2);
          iPos += rect.getWidth() ;
        }
        iPosAmp = iPos ;
      }
      // check for multi-line label
      iPos = sLabel.indexOf(10) ;
      sLabel.replace('&','\0');
      FontMetrics fm = g2.getFontMetrics(font);
      while(iPos > -1)
      {
        String s = sLabel.substring(0,iPos);
        Rectangle2D rect = fm.getStringBounds(s, g2);
        if(rect.getWidth() > textWidth) textWidth = (int)rect.getWidth() ;
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
        if(rect.getWidth() > textWidth) textWidth = (int)rect.getWidth() ;
        tHeight[iIndice] = (int)rect.getHeight() ;      
        textHeight = textHeight + tHeight[iIndice] ;
      }      
           
      // Center text horizontally
      if(iTextPos == Left)
      {
        iTx = 6;
        iTy = (this.getHeight() - textHeight) / 2  + fm.getAscent();
      }
      else if(iTextPos == Center)
      {
        iTx = (this.getWidth() / 2)  - (textWidth / 2);
        iTy = (this.getHeight() - textHeight) / 2  + fm.getAscent();
      }      
      else
      {
        iTx = (this.getWidth()  - textWidth) - 10 ;
        iTy = (this.getHeight() - textHeight) / 2  + fm.getAscent();
      }                              

      g2.setFont(font);
      // draw text shadow
      if(cBack != null)
      {
        g2.setColor(cBack);
        posF = iTy ;
        for(int i=0 ; i<=iIndice; i++)
        {
         g2.drawString(tLabels[i], iTx-1, posF+1);
         posF += tHeight[i] + 2 ;
        }             
      }
      if(bEnable) g2.setColor(cFG);
      else g2.setColor(cDisable);
      
      // draw text
      posF = iTy ;
      for(int i=0 ; i<=iIndice; i++)
      {
       g2.drawString(tLabels[i], iTx, posF);
       if(iPosAmp > -1) g2.drawLine(iTx+iPosAmp,posF+2,iTx+iPosAmp+iLen,posF+2);             
       posF += tHeight[i] + 2 ;
      }           
      
      // draw default/focus mark
      focusStroke=new BasicStroke(fStroke,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL);

      g2.setStroke(focusStroke);
      if((bRolloverMark && DrawLAF.bRolloverAllMark) && bDefault && bEnable)
      {
	  g.setColor(cDefault);
          g2.drawRoundRect ( 5 , 5 , focusRect.width-8 , focusRect.height-8 , 5, 5) ;
      }    

      if((bRolloverMark && DrawLAF.bRolloverAllMark) && ((bFocus && bEnable) || (bOverflew && bEnable)))
      {
	  g.setColor(DrawLAF.cFocus);
          g2.drawRoundRect ( 5 , 4 , focusRect.width-8 , focusRect.height-7 , 5, 5) ;
      }

      g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,rh);
      g2.dispose();
  }  

  public void update(Graphics g)
  {
    paint(g);
  }
  
  /*
   * calculate the image x,y coordinate
   */
  private Point SetImgCoordinate()
  {
    int x=5, y=5 ;

    // image on top position
    if(sImgPos.equalsIgnoreCase("LT"))      { x = iDec; y = iDec; }
    else if(sImgPos.equalsIgnoreCase("CT")) { x = (iW/2)-(iImgW/2); y = iDec; }
    else if(sImgPos.equalsIgnoreCase("RT")) { x = (iW)-(iImgW)-iDec; y = iDec; }
    // image on middle position
    else if(sImgPos.equalsIgnoreCase("LM")) { x = iDec; y = (iH/2)-(iImgH/2); }
    else if(sImgPos.equalsIgnoreCase("CM")) { x = (iW/2)-(iImgW/2); y = (iH/2)-(iImgH/2); }
    else if(sImgPos.equalsIgnoreCase("RM")) { x = (iW)-(iImgW)-iDec; y = (iH/2)-(iImgH/2); }    
    // image on bottom position
    else if(sImgPos.equalsIgnoreCase("LB")) { x = iDec; y = iH-(iImgH)-iDec; }
    else if(sImgPos.equalsIgnoreCase("CB")) { x = (iW/2)-(iImgW/2); y = iH-(iImgH)-iDec; }
    else if(sImgPos.equalsIgnoreCase("RB")) { x = (iW)-(iImgW)-iDec; y = iH-(iImgH)-iDec; }
    
    if(x < 1) x=iDec ;
    if(y < 1) y=iDec ;

    Point pt = new Point(x,y);
    return pt ;
  }
  
  class RoundBorder extends AbstractBorder 
  {
    public void paintBorder(Component c, Graphics g, int x, int y, int width, int height) 
    {
      Graphics2D g2 = (Graphics2D) g ;
      g2.setColor (cBorder) ; 
      if(height < 40)
        {
         fWidth = 1.0f ;
         g2.setStroke(new BasicStroke(fWidth)); 
        }
      else
        {
          fWidth = 1.5f ;
          g2.setStroke(new BasicStroke(fWidth)); 
        }
      g.drawRoundRect ( x+2 , y+2 , width-4 , height-4 , 10, 10) ;
    }
    public Insets getBorderInsets ( ) 
    {
      return new Insets (2,2,2,2) ;
    }
  }



  public void focusGained(FocusEvent e)
     {
         if (e.getComponent() == this)
         {
             // put the focus on the component
             if(this.isEnabled()) 
             {
               e.getComponent().requestFocus();
               bFocus = true ;
             }
         }
     }
    
  public void focusLost(FocusEvent e)
     {     
       bFocus = false ;
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
      bOverflew=true ;
      mouseON();
    }

    /**
     * User moved the mouse out of the button
     */
    public void mouseExited(MouseEvent me)
    {
      bOverflew=false ;
      mouseOFF();
    }
    public void mousePressed(MouseEvent e) {
        setPressed(true) ;
    }

    public void mouseReleased(MouseEvent e) {
        setPressed(false) ;
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
       if(iKey== e.VK_TAB){
          sComp = e.getComponent().getName() ;
          if(iModifier ==  e.SHIFT_MASK) {
              // find previous item
              for(i = 0; i < DrawLAF.ListItems.size(); i++) {
                  DrawLAF.newItem  ni = (DrawLAF.newItem)DrawLAF.ListItems.get(i) ;
                  if(ni.sName.equalsIgnoreCase(sComp)) {
                      if(i> 0) {
                        bFocus = false ;
                        mouseOFF();
                        //bOverflew = false ;
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
                    if(i < DrawLAF.ListItems.size()-1) {
                      ni = (DrawLAF.newItem)DrawLAF.ListItems.get(i+1) ;
                      bFocus = false ;
                      mouseOFF();
                      //bOverflew = false ;
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
                     bFocus = false ;
                     mouseOFF();
                     //bOverflew = false ;                     
                     ((Component)ni.cp).requestFocus();
                 }
                 else {
                     // goto first item
                     DrawLAF.newItem  ni = (DrawLAF.newItem)DrawLAF.ListItems.get(0) ;
                     bFocus = false ;
                     mouseOFF();
                     //bOverflew = false ;                     
                     ((Component)ni.cp).requestFocus();
                 }
             }
             // send back the key event to Forms
             else 
               bFocus = false ;
               bOverflew = false ;                     
               DrawLAF.sendKeyBack(e);
          }
       } 
       else if(iKey== e.VK_ENTER){
           if(dBean != null){
               List list_msg = new ArrayList(10) ;    
               Messages msg = new Messages(DrawLAF.ITEM_ACTION_NAME, "");
               msg = new Messages(DrawLAF.ITEM_ACTION_NAME, sButtonName);
               list_msg.add(msg);           
               msg = new Messages(DrawLAF.ITEM_ACTION_TYPE, "mouseevent");
               list_msg.add(msg);
               msg = new Messages(DrawLAF.ITEM_ACTION_OBJECT, "button");
               list_msg.add(msg);            
               msg = new Messages(DrawLAF.ITEM_ACTION_VALUE, "clicked");
               list_msg.add(msg);
               msg = new Messages(DrawLAF.ITEM_ACTION_MOUSEPOS, "0");
               list_msg.add(msg);
               msg = new Messages(DrawLAF.ITEM_ACTION_MOUSEBUTTON, "0");
               list_msg.add(msg);               
               dBean.dispatchanevent(DrawLAF.ITEM_ACTION, list_msg);            
           }
           else{
               System.out.println("!!! DrawLAF NewButton dBean IS NULL");
           }
       }    
    }

    //
    // Handle the key released event from the text field. 
    //
    public void keyReleased(KeyEvent e) {
    }

 /**
   * Utility function to print out a debug message to the Java Console
   * @param msg string to display, this will be prefixed with the classname of the PJC
   */
  public void log(String msg)
  {
    if(bLog) System.out.println("XPButton(): " + msg);
  }


}