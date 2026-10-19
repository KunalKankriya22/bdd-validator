package oracle.forms.fd;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Point;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.geom.Rectangle2D;
import java.awt.geom.RoundRectangle2D;
import javax.swing.Icon;
import javax.swing.JButton;

public class LAFButton extends JButton {
  public static final int NONE = 0;
  public static final int DOWN = 1;
  public static final int UP   = 2;
  protected Icon ic = null ;
  protected int       iImgW=0, iImgH=0 ;
  protected Icon icDown = new BevelArrowIcon(BevelArrowIcon.DOWN, false, false) ;
  protected Icon icUp   = new BevelArrowIcon(BevelArrowIcon.UP, false, false) ;



  public LAFButton() {     
  }
  
  public LAFButton(String sText) {
    this.setText(sText);
  }  
  
  protected void setImage( Icon ii ) { ic = ii ; }  
  
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
      Color cEnd = DrawLAF.Current_Color ;
      Color cStart = Color.white ;
      Color cBack  = Color.white ;
      Color cFG    = DrawLAF.Current_Color.darker() ;
      int iX = (int)this.getBounds().getX() ;
      int iY = (int)this.getBounds().getY() ;
      int iW = (int)this.getBounds().getWidth() ;
      int iH = (int)this.getBounds().getHeight() ;
      int x=0, y=01 ;
      BasicStroke focusStroke=null;
      g2.setColor(Color.white);
        
      g2.fill(new RoundRectangle2D.Double(1,1,iW-2,iH-2,8,8));
      

      //GradientPaint gradient = new GradientPaint(2,iH/2,cStart,2,iH,cEnd);
      GradientPaint gradient = new GradientPaint(2,iH/2,cStart,2,iH,cEnd);
      g2.setPaint(gradient);
      g2.fill(new RoundRectangle2D.Double(1,iH/2,iW,(iH/2),8,8)) ;

      
      // draw border
      focusStroke=new BasicStroke(1f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL);
      focusRect = this.getBounds();
      g2.setStroke(focusStroke);
      g.setColor(Color.gray);
      g2.drawRoundRect ( 1 , 1 , focusRect.width-2 , focusRect.height-2 , 8, 8) ;       
      
      if (ic != null)
      {
         // paint the image
         iImgW = ic.getIconWidth() ;
         iImgH = ic.getIconHeight() ;
         x = (iW)-(iImgW)-3; y = (iH/2)-(iImgH/2); 
         Point p = new Point(x,y);
         ic.paintIcon(this,g2,p.x,p.y);
      }

      if(this.getText() == null) return ;
      
      //
      // label
      // 
      String sLabel     = this.getText() ;
      String tLabels[]  = new String[10] ;
      Font font         = this.getFont();
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
           
      int iTextPos = 1 ;
      // Center text horizontally
      if(iTextPos == 1)
      {
        iTx = 6;
        iTy = (this.getHeight() - textHeight) / 2  + fm.getAscent();
      }
      else if(iTextPos == 2)
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
      g2.setColor(cFG);
      
      // draw text
      posF = iTy ;
      for(int i=0 ; i<=iIndice; i++)
      {
       g2.drawString(tLabels[i], iTx, posF);
       if(iPosAmp > -1) g2.drawLine(iTx+iPosAmp,posF+2,iTx+iPosAmp+iLen,posF+2);             
       posF += tHeight[i] + 2 ;
      }           
      
      // draw default/focus mark
      focusStroke=new BasicStroke(1.5f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL);

      g2.setStroke(focusStroke);

      g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,rh);
      g2.dispose();
  }  

  public void update(Graphics g)
  {
    paint(g);
  }
  

}
