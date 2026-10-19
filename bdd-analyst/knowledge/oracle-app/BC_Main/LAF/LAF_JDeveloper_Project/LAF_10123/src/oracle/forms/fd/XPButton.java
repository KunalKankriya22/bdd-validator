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
import java.awt.geom.Rectangle2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;

import java.util.HashMap;

import javax.swing.ImageIcon;
import javax.swing.border.AbstractBorder;
import javax.swing.border.Border;

import oracle.forms.ui.VButton;


/**
 * A XP like Command button
 *
 * @author   Francois Degrelle
 * creation  february 2007
 * @version  1.5
 *
 * bug correction  May 2007
 *     Swing JButton replaced by standard Forms VButton
 *     to avoid widget overlap when multiple windows opened
 * bug correction  Decembre 2008
 *     When IMAGE_ON icon set, the image is not
 *     erased when the mouse leaves the button
 *  February 2009    : turn colored icons to grayscale
 *                     when button is disabled
 *  May      2009    : change gray color to brighter color
 *                     when button is disable, because
 *                     grayscale give troubles with transparent GIFs
 */
   
public class XPButton extends VButton
{
  protected String    sButtonName = null ;
  protected boolean   bGradient = true ;
  protected float     fWidth = 1.0f ;
  protected float     fStroke = 1.0f ;
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
  protected Font      font = null ;
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
  protected boolean   bBorder   = true ;
  protected boolean   bFocus    = false ;
  protected boolean   bDefault  = false ;
  protected boolean   bEnable   = true ;
  protected boolean   bPressed  = false ;
  protected boolean   bOverflew = false ; 
  protected boolean   bRolloverMark = true ;
  protected BasicStroke focusStroke=null;
  protected static boolean   bLog = false ;
  
  // constructor
  public XPButton(String sLabel)
  {
    Border br1 = new RoundBorder ( ) ;
    font = this.getFont() ;
    setLabel(sLabel);
    setNumImage(0);
  }
  protected void setButtonName( String sName ) { sButtonName = sName; log("Shared image name:"+sButtonName+"  "+this.getName());}
  protected void setFGcolor( Color c ) { cFG = c ; this.setForeground(c);}
  protected void setFocusColor( Color c ) { cFocus = c ;}
  protected void setBGcolor( Color c ) 
  { 
    cBG = c ;
    if(null != c) {
      if(c.getBlue() > 0 && c.getRed() > 0 && c.getGreen() > 0){cBG = c ; this.setBackground(c);}
      else {cBG = Color.white ; this.setBackground(c);}
    }
    else bGradient = false ;
  }
  protected void setBorder(boolean b) { bBorder = b; }
  protected void setShadowcolor( Color c ) { cBack = c ; }  
  protected void setBackgroundcolor( Color c ) { cEnd = c ; }    
  protected void setDirection(int iDirection) { igrDir = iDirection ; }
  protected void setTextPosition(int iPos) { iTextPos = iPos ; }
  protected void setImagePosition(String sPos) { sImgPos = sPos ; }  
  protected void setFonte(Font f) { font = f ; }
  protected void setEnable(boolean b) { bEnable = b ; }
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
      cEnd = DrawLAF.Current_Color ;
      iX = (int)this.getBounds().getX() ;
      iY = (int)this.getBounds().getY() ;
      iW = (int)this.getBounds().getWidth() ;
      iH = (int)this.getBounds().getHeight() ;
      g2.setColor(cBG);
      if(bOverflew && bEnable)
        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.7f));
      if(null != cBG)  
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
      if(null != cBG && bBorder) {
          focusStroke=new BasicStroke(1f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL);
          focusRect = this.getBounds();
          g2.setStroke(focusStroke);
          g2.setColor(Color.gray);
          g2.drawRoundRect ( 2 , 2 , focusRect.width-4 , focusRect.height-4 , 8, 8) ;       
      }
      else{
          focusStroke=new BasicStroke(0f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL);
          focusRect = this.getBounds();
          g2.setStroke(focusStroke);
          g2.setColor(Color.white);
          g2.drawRoundRect ( iW/2 , iH/2 , 0 , 0 , 1, 1) ;       
      }

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
         iImgW = ic.getIconWidth() ;
         iImgH = ic.getIconHeight() ;         
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
      if(this.getLabel() != null){      
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
      }
      
      // draw default/focus mark
      focusStroke=new BasicStroke(fStroke,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL);

      g2.setStroke(focusStroke);
      if((bRolloverMark && DrawLAF.bRolloverAllMark) && bDefault && bEnable)
      {
	  g2.setColor(cFocus);
          g2.drawRoundRect ( 1 , 1 , focusRect.width-2 , focusRect.height-2 , 5, 5) ;
      }    

      if((bRolloverMark && DrawLAF.bRolloverAllMark) && ((bFocus && bEnable) || (bOverflew && bEnable)))
      {
	  g2.setColor(cFocus);
          g2.drawRoundRect ( 1 , 1 , focusRect.width-2 , focusRect.height-2 , 5, 5) ;
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

 /**
   * Utility function to print out a debug message to the Java Console
   * @param msg string to display, this will be prefixed with the classname of the PJC
   */
  public void log(String msg)
  {
    if(bLog) System.out.println("XPButton(): " + msg);
  }


}