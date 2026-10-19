package oracle.forms.fd;

import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GraphicsConfiguration;
import java.awt.GraphicsDevice;
import java.awt.GraphicsEnvironment;
import java.awt.HeadlessException;
import java.awt.Image;
import java.awt.Insets;
import java.awt.Point;
import java.awt.Polygon;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.TexturePaint;
import java.awt.Transparency;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.font.FontRenderContext;
import java.awt.geom.AffineTransform;
import java.awt.geom.Ellipse2D;
import java.awt.geom.GeneralPath;
import java.awt.geom.Line2D;
import java.awt.geom.PathIterator;
import java.awt.geom.Rectangle2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.awt.image.ColorModel;
import java.awt.image.PixelGrabber;

import java.net.URL;

import java.util.StringTokenizer;

import javax.swing.ImageIcon;
import javax.swing.border.AbstractBorder;

import oracle.forms.handler.IHandler;
import oracle.forms.properties.ID;
import oracle.forms.ui.VButton;


/**
 * A non rectangular Push Button
 *
 * @author   Francois Degrelle
 * creation  february 2008
 * @version  1.5
 *
 * january   2009 - the TEXT BUTTON takes into acount, now
 *                  the text position (left-center-right)
 *
 * jully     2010 - Shaped buttons can have
 *                  image in the background
 *
 */
   
public class FunButton extends VButton implements FocusListener
{
  private static final   ID SETIMAGEON         = ID.registerProperty("SET_IMAGE_ON");
  private static final   ID SETIMAGEOFF        = ID.registerProperty("SET_IMAGE_OFF");
  private static final   ID SETDEBUG           = ID.registerProperty("SET_DEBUG");
  private static final   ID SETBACKGROUNDCOLOR = ID.registerProperty("SET_BACKGROUND_COLOR");
  private static final   ID SETBORDERCOLOR     = ID.registerProperty("SET_BORDER_COLOR");
  private static final   ID SETROTATION        = ID.registerProperty("SET_ROTATION");  
  private static final   ID SETCIRCLE          = ID.registerProperty("SET_CIRCLE");  
  private static final   ID SETSCALE           = ID.registerProperty("SCALE");    
  private static final   ID SETPOLYGON         = ID.registerProperty("SET_POLYGON");  
  private static final   ID SETRELIEF          = ID.registerProperty("SET_RELIEF");  
  private static final   ID SETSHADOWSHIFT     = ID.registerProperty("SET_SHADOW_SHIFT");    
  private static final   ID SETRELIEFALL       = ID.registerProperty("SET_RELIEF_ALL");  
  private static final   ID SETRELIEFWIDTH     = ID.registerProperty("SET_RELIEF_WIDTH");    
  private static final   ID SETLOSANGE         = ID.registerProperty("SET_LOSANGE");    
  private static final   ID SETTEXT            = ID.registerProperty("SET_TEXT");      
  private static final   ID SETTEXTAT          = ID.registerProperty("SET_TEXT_AT");  
  private static final   ID SETTEXTSHADOW      = ID.registerProperty("SET_TEXT_SHADOW");        
  private static final   ID SETTEXTCOLOR       = ID.registerProperty("SET_TEXT_COLOR");
  private static final   ID SETTEXTPOS         = ID.registerProperty("SET_TEXT_POSITION");    
  private static final   ID SETTEXTTHICKNESS   = ID.registerProperty("SET_TEXT_THICKNESS");    
  private static final   ID SETSHADOWCOLOR     = ID.registerProperty("SET_SHADOW_COLOR");  
  private static final   ID DRAWBORDER         = ID.registerProperty("DRAW_BORDER");  
  private static final   ID DRAWOUTLINE        = ID.registerProperty("DRAW_OUTLINE");    
  private static final   ID DRAWBORDERALL      = ID.registerProperty("DRAW_BORDER_ALL");    
  private static final   ID DRAWCLIPBORDER     = ID.registerProperty("DRAW_CLIP_BORDER");    
  private static final   ID DRAWCLIPBORDERALL  = ID.registerProperty("DRAW_CLIP_BORDER_ALL");      
  private static final   ID SETIMAGE           = ID.registerProperty("SET_IMAGE");  
  private static final   ID SETIMAGEORDER      = ID.registerProperty("SET_IMAGE_ORDER");    
  private static final   ID SETIMAGEPOS        = ID.registerProperty("SET_IMAGE_POSITION");  
  private static final   ID SETGRADIENT        = ID.registerProperty("SET_GRADIENT");    
  private static final   ID setSeparator       = ID.registerProperty("SET_SEPARATOR");      
  
  final int           iStandard = 0 ;
  final int           iPolygon  = 1 ;
  final int           iCircle   = 2 ;
  final int           iLosange  = 3 ;  
  final int           iString   = 4 ;    
  protected int       iForm = iStandard ;
  protected int       iBorderGlow = 4 ;
  protected boolean   bGradient = true ;
  protected String    sOrder = "background" ;
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
  protected Color     cStart    = new Color(255,255,255) ;
  protected Color     cEnd      = new Color(160,160,160);  
  protected Color     cDefault  = new Color(51,133,255);
  protected Color     cFocus    = new Color(255,214,47);
  protected Color     cDisable  = new Color(100,100,100);  
  protected Color     cFG       = Color.black ;
  protected Color     cBG       = Color.white ;
  protected Color     cBack     = Color.white ;
  protected Color     cBorder   = Color.gray ;  
  protected Color     gradient1 = null;//Color.white ;  
  protected Color     gradient2 = null;//Color.black ;    
  protected int       igrDir    = UpToDown ;
  protected int       iTextPos  = Center ;
  protected int       iImgPos   = Left ;
  protected Font      font      = null ;
  private Color clrGlowInnerHi  = null;//gradient1.brighter();
  private Color clrGlowInnerLo  = null;//gradient1.darker();
  private Color clrGlowOuterHi  = null;//gradient1.darker();
  private Color clrGlowOuterLo  = null;//gradient1.brighter();
  // image
  protected Image[]     m_images = { null, null };
  protected Image       image    = null ;
  private   ImageIcon   icon     = null ;
  private   ImageIcon[] tic      = {null,null,null} ;
  protected int         iImg     = 0 ;
  protected String      sImgPos  = "CM" ;
  protected int         iX=0, iY=0, iW=0,iH=0 ;
  protected int         iImgW=0, iImgH=0 ;
  protected int[]       tiImgW={0,0,0},tiImgH={0,0,0} ;  
  // rounded parameters
  protected int       iArcWidth   = 10 ;
  protected int       iArcHeight  = 10 ;
  protected int       iDec        = 6 ;
  protected boolean   bFocus      = false ;
  protected boolean   bDefault    = false ;
  protected boolean   bEnable     = true ;  
  protected boolean   bPressed    = false ;    
  protected boolean   bBorder     = false ;    
  protected boolean   bOutline    = true ;      
  protected boolean   bRelief     = false ;      
  protected boolean   bClipBorder = false ;    
  protected static boolean   bReliefAll     = false ;        
  protected static boolean   bBorderAll     = false ;    
  protected static boolean   bClipBorderAll = false ;        
  protected int       iTextPosX=0, iTextPosY=0 ;
  protected double    dShadowX = 4d, dShadowY = 3d ;
  protected boolean   bScale      = true ;
  protected boolean   bLog        = false ;  
  protected Polygon   poly = new Polygon();
  protected BasicStroke focusStroke=null;
  protected double    dRotation   = 0.0d ;
  protected GeneralPath path = new GeneralPath( );   
  private IHandler       m_handler;
  private URL            m_codeBase;
  private String         sInitialLabel = "" ;
  private char           cSeparator = '|' ;    
  
  // letter button variables
  private Shape shape, tshape;
  private Shape ribbon;
  private int fontSize = 50;
  private int iShadowThickH = 4;
  private int iShadowThickV = 4;
  private AffineTransform at = AffineTransform.getTranslateInstance(-iShadowThickH, -iShadowThickV);  
  private String text = "Z";  
  private Color  cShadow = new Color(80,80,80);
  private Font fTextFont = new Font("Tahoma", Font.BOLD, fontSize);
  
  // constructor
  public FunButton()
  {
    super();
  }  
  
  public void init(IHandler handler)
  {
    m_handler = handler;
    super.init(handler);
    addMouseListener(new ButtonMouseAdapter());
    addFocusListener(this);
  }  
  
  protected void setFGcolor( Color c ) { cFG = c ; this.setForeground(c);}
  protected void setBGcolor( Color c ) { /*cBG = c ; this.setBackground(c);*/}
  protected void setShadowcolor( Color c ) { cBack = c ; }  
  protected void setBackgroundcolor( Color c ) { cEnd = c ; }    
  protected void setDirection(int iDirection) { igrDir = iDirection ; }
  protected void setTextPosition(int iPos) { iTextPos = iPos ; }
  protected void setImagePosition(String sPos) { sImgPos = sPos ; }  
  protected void setFonte(Font f) { font = f ; }
  protected void setEnable(boolean b) { bEnable = b ; }
  protected void setBTImage(Image i) 
  { 
    tic[0]  = null;
   
    if(i != null)
    {
      tic[0]   = new ImageIcon(i);
      tiImgW[0] = tic[0].getIconWidth() ;
      tiImgH[0] = tic[0].getIconHeight() ;
    }
    else icon = null ;
    setNumImage(0);
  }
  protected void setImageON(Image i) 
  { 
    tic[1]  = null;
   
    if(i != null)
    {
      tic[1]  = new ImageIcon(i);
      tiImgW[1] = tic[1].getIconWidth() ;
      tiImgH[1] = tic[1].getIconHeight() ;
    }
  }
  protected void setImageOFF(Image i) 
  { 
    tic[2] = null;
   
    if(i != null)
    {
      tic[2] = new ImageIcon(i);
      tiImgW[2] = tic[2].getIconWidth() ;
      tiImgH[2] = tic[2].getIconHeight() ;
    }
  }
  protected void mouseON()
  {
     if(tic[1] != null)
      {
        setNumImage(1);       
      }    
      repaint();
  }
  protected void mouseOFF()
  {
     if(tic[2] != null)
      {
        setNumImage(2);
      }    
      else if(tic[0] != null) setNumImage(0);
      else icon = null ;
      repaint();
  }
  protected void setNumImage(int iNum)
  {
    icon  = tic[iNum];
    iImgW = tiImgW[iNum] ;
    iImgH = tiImgH[iNum] ;
  }
  
  /**---------------------------*
   *     Paint the component   
   *----------------------------*/
  public void paint (Graphics g)  
  {
      Graphics2D g2 = (Graphics2D) g ;
      Dimension d = getSize();
      int iTx,iTy, iDec=6 ;
      double dTranslate=.5;
      double dScaleX=1.0, dScaleY=1.0;
      Polygon p = null;
      Rectangle focusRect = null, rec=null;
      Rectangle rClip=null;
      Shape shape=null; 
      TexturePaint tp = null ;
      BufferedImage bi = null;
      AffineTransform transforms; 
      // button's bounds
      iX = (int)this.getBounds().getX() ;
      iY = (int)this.getBounds().getY() ;
      iW = (int)this.getBounds().getWidth() ;
      iH = (int)this.getBounds().getHeight() ;

      if(!bEnable){
          g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.4f));
      }
      g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
                          RenderingHints.VALUE_ANTIALIAS_ON);
      // draw bounding box
      if(bBorder || bBorderAll)
      {
        focusStroke=new BasicStroke(1f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL);
        focusRect = this.getBounds();
        g2.setStroke(focusStroke);
        g.setColor(Color.gray);
        g2.drawRoundRect ( 3 , 3 , focusRect.width-5 , focusRect.height-5 , 8, 8) ;       
      }

      if(iForm == iStandard)
      {
        shape = new Rectangle(0,0,this.getWidth(),this.getHeight());
        rec = shape.getBounds();
      }
      
      // polygon button
      else if(iForm == iPolygon)
      {
        shape = path;      
        rec = shape.getBounds();
      }

      // circle button      
      else if(iForm == iCircle)
      {
        shape = new Ellipse2D.Float(0.0f, 0.0f, iW, iH);
        rec=shape.getBounds();
        iDec=-6;
      }

      // losange button      
      else if(iForm == iLosange)
      {
        poly = new Polygon();
        poly.addPoint(iW/2,0);
        poly.addPoint(iW,iH/2);
        poly.addPoint(iW/2,iH);
        poly.addPoint(0,iH/2);
        path.append(poly,false);
        shape = path;      
        rec=shape.getBounds();
        iDec=-6;
      }

      // text button      
      else if(iForm == iString)
      {
        drawText(d.width, d.height, g2);
        return ;
      }  
      
      else return ;

      float f = (float)fStroke ;
      if(bScale) {
        dScaleX = (1.0 / ((double)rec.width*1.2/(double)(iW)));
        dScaleY = (1.0 / ((double)rec.height*1.2/(double)(iH)));       
        f = (float) (fStroke/(float)dScaleX < 2.0 ? 2.0 : fStroke/(float)dScaleX) ;
      }
      
      // center the clip in the button
      int x1 = (int) (iW-(rec.width*dScaleX)) /2 ;
      int y1 = (int) (iH-(rec.height*dScaleY))/2 ;
      g2.translate(x1,y1);
      
      g2.setStroke(new BasicStroke(f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL));      

      // log some values
      //log("Button w:"+iW+" Button h:"+iH);
      //log("Clip x:"+rec.width+" Clip y:"+rec.height);
      //log("scalex:"+dScaleX+" scaley:"+dScaleY);


      // save current context
      AffineTransform save = g2.getTransform(); 

      BufferedImage bi2 = null;
      if(bEnable){
        bi2 =  new BufferedImage(rec.width, rec.height, BufferedImage.TYPE_INT_ARGB);
      }
      else {
        bi2 =  new BufferedImage(rec.width, rec.height, BufferedImage.TYPE_BYTE_GRAY);
      }
      Graphics2D tg = bi2.createGraphics( ); // Get its Graphics for drawing
      if(gradient1 != null)
      {
        if(!bPressed)
        {
          tg.setPaint(new GradientPaint(0, 0, gradient1, 
                                        0, rec.height, gradient2));
        }
        else
        {
          tg.setPaint(new GradientPaint(0, 0, toDark(gradient1,.9f), 
                                        0, rec.height, toDark(gradient2,.9f)));
        }
        tg.fill(new RoundRectangle2D.Double(0,0,rec.width,rec.height,0,0)) ;
        // Use this image to create a gradient TexturePaint 
        g2.setPaint(new TexturePaint(bi2, new Rectangle(0, 0, rec.width+4, rec.height+4)));
      }
      //
      // scale ?
      //
      if(bScale)
      {
        transforms = AffineTransform.getScaleInstance(dScaleX,dScaleY);
        g2.transform(transforms);  // apply transform
      }

      // bounds of the shape
      rClip =  shape.getBounds();

      //
      // rotation ?
      //
      if(dRotation != 0.0)
      {
         g2.rotate(dRotation * Math.PI / 180.0,rClip.width/2,rClip.height/2);
      }
      
      // clip bounding box
      if(bClipBorder || bClipBorderAll)
      {
        focusStroke=new BasicStroke(1f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL);
        g2.setStroke(focusStroke);
        g.setColor(Color.gray);
        g2.drawRoundRect ( 0 , 0 , rClip.width , rClip.height , 8, 8) ;       
      } 

      // shadow
      if(null != cEnd) g2.setColor(cEnd);
      if(!bRelief && !bReliefAll)
      { 
          if(bPressed) g2.translate(dTranslate,dTranslate);
          g2.translate(dShadowX,dShadowY);
          g2.fill(shape);
          g2.translate(-dShadowX,-dShadowY);
      }
      else g2.fill(shape);
       
      // draw button
      g2.setPaint(new TexturePaint(bi2, new Rectangle(0, 0, rec.width+4, rec.height+4)));
      if(bPressed) g2.translate(dTranslate,dTranslate);      
      g2.fill(shape);
      if (icon != null) {
           ImageIcon icon2 = new ImageIcon(icon.getImage());
           if(bScale){
             icon2 = new ImageIcon(icon.getImage().getScaledInstance(rec.width, rec.height, Image.SCALE_SMOOTH));
           }
           icon2.paintIcon(this,g2,(this.getWidth()/2)-(icon2.getIconWidth()/2),(this.getHeight()/2)-(icon2.getIconHeight()/2));
      }      
      tp = null ;
      
      if(bRelief || bReliefAll)
      {
          // draw relief
          paintBorderGlow(shape, g2, iBorderGlow, bEnable);
      }
      
      if(bOutline)    
      {
          g2.setColor(cBorder);
          g2.draw(shape);
      }     
      
       
      // draw default/focus mark
      focusStroke=new BasicStroke(f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL);
      g2.setStroke(focusStroke);
      if(bDefault && bEnable)
      {
          g2.setColor(cDefault);
          g2.draw(shape); 
      }    
      if(bFocus && bEnable)
      {
	  g2.setColor(cFocus);
          g2.draw(shape); 
      }
      
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
        //g2.drawRect(0,0,(int)rect.getWidth(),(int)rect.getHeight());
        if(rect.getWidth() > textWidth) textWidth = (int)rect.getWidth() ;
        tHeight[iIndice] = (int)rect.getHeight() ;      
        textHeight = textHeight + tHeight[iIndice] ;
      }      
           
      if(iTextPosX + iTextPosY != 0)
      {
        iTx = iTextPosX ; 
        iTy = iTextPosY ; 
      }
      else
      {
      // Center text 
      if(iTextPos == Left)
      {
        iTx = 6;
        iTy = (this.getHeight() - textHeight) / 2  + fm.getAscent();
      }
      else if(iTextPos == Center)
      {
        iTx = (int)(rClip.getWidth() / 2)  - (textWidth / 2);
        iTy = (int)(rClip.getHeight() - textHeight) / 2  + fm.getAscent();
      }      
      else
      {
        iTx = (this.getWidth()  - textWidth) - 10 ;
        iTy = (this.getHeight() - textHeight) / 2  + fm.getAscent();
      }
      }

      g2.setFont(font);
      
      if(bPressed) g2.translate(0.5d,0.5d);

      // image to draw before text ?
      if (icon != null && sOrder.equalsIgnoreCase("middle"))
      {
         // paint the image
         Point pt = SetImgCoordinate();
         icon.paintIcon(this,g2,pt.x,pt.y);
      }
      
      //
      // draw text shadow
      //
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
      
      //
      // draw text
      //
      posF = iTy ;
      for(int i=0 ; i<=iIndice; i++)
      {
       g2.drawString(tLabels[i], iTx, posF);
       if(iPosAmp > -1) g2.drawLine(iTx+iPosAmp,posF+2,iTx+iPosAmp+iLen,posF+2);             
       posF += tHeight[i] + 2 ;
      }           
      
      // image to draw foreground ?
      if (icon != null && sOrder.equalsIgnoreCase("foreground"))
      {
         // paint the image
         log("paint the image foreground");
         Point pt = SetImgCoordinate();
         icon.paintIcon(this,g2,pt.x,pt.y);
      }
      
      g2.dispose();      
  }  

  public void update(Graphics g)
  {
    paint(g);
  }
 

   /*-----------------------------*
    *  creation of BufferedImage  *
    *-----------------------------*/
    public static BufferedImage toBufferedImage(Image image) {
        if (image instanceof BufferedImage) {
            return (BufferedImage)image;
        }
    
        boolean hasAlpha = false ;
        // This code ensures that all the pixels in the image are loaded
        image = new ImageIcon(image).getImage();
    
        try{
            hasAlpha = hasAlpha(image);
        }
        catch(Exception e){}
    
        // Create a buffered image with a format that's compatible with the screen
        BufferedImage bimage = null;
        GraphicsEnvironment ge = GraphicsEnvironment.getLocalGraphicsEnvironment();
        try {
            // Determine the type of transparency of the new buffered image
            int transparency = Transparency.OPAQUE;
            if (hasAlpha) {
                transparency = Transparency.BITMASK;
            }
    
            // Create the buffered image
            GraphicsDevice gs = ge.getDefaultScreenDevice();
            GraphicsConfiguration gc = gs.getDefaultConfiguration();
            bimage = gc.createCompatibleImage(
                image.getWidth(null), image.getHeight(null), transparency);
        } catch (HeadlessException e) {
            // The system does not have a screen
        }
    
        if (bimage == null) {
            // Create a buffered image using the default color model
            int type = BufferedImage.TYPE_INT_RGB;
            if (hasAlpha) {
                type = BufferedImage.TYPE_INT_ARGB;
            }
            bimage = new BufferedImage(image.getWidth(null), image.getHeight(null), type);
        }
    
        // Copy image to buffered image
        Graphics g = bimage.createGraphics();
    
        // Paint the image onto the buffered image
        g.drawImage(image, 0, 0, null);
        g.dispose();
    
        return bimage;
    }
         
        
    /*----------------------------------------------------------------------------*
     *   This method returns true if the specified image has transparent pixels   *
     *----------------------------------------------------------------------------*/
    public static boolean hasAlpha(Image image) {
        // If buffered image, the color model is readily available
        if (image instanceof BufferedImage) {
            BufferedImage bimage = (BufferedImage)image;
            return bimage.getColorModel().hasAlpha();
        }
    
        // Use a pixel grabber to retrieve the image's color model;
        // grabbing a single pixel is usually sufficient
         PixelGrabber pg = new PixelGrabber(image, 0, 0, 1, 1, false);
        try {
            pg.grabPixels();
        } catch (InterruptedException e) {
        }
    
        // Get the image's color model
        ColorModel cm = pg.getColorModel();
        return cm.hasAlpha();
    }
    
             
  /**
    ========================================================================================================
  */
  
  /**-------------------------------*
   *    set the needed properties
   *--------------------------------*/
  public boolean setProperty(ID property, Object value)
  {
    log(property+":"+value);
    
    // set the polygon shape
    if (property == SETPOLYGON)
    {
      iForm = iPolygon ;
      boolean bFirst = true ;
      int iX=0, iY=0 ;
      String s = value.toString();
      StringTokenizer st = new StringTokenizer(s, ",");
      path.reset();
      while(st.hasMoreTokens())
      {
        try{
          iX = Integer.parseInt(st.nextToken());
          iY = Integer.parseInt(st.nextToken());
          if(bFirst) { path.moveTo(iX,iY); bFirst = false; }
          else path.lineTo(iX,iY);
        }
        catch(Exception ex) {System.out.println("SetPolygon():"+ex.toString());return false;}
      }  
      path.closePath();
      return true ;
    } 

    // set the circle shape
    else if (property == SETCIRCLE)
    {
      iForm = iCircle ;
      return true ;
    }
    
    // set the losange shape
    else if (property == SETLOSANGE)
    {
      iForm = iLosange ;
      return true ;
    }

    // set the text shape
    else if (property == SETTEXT)
    {
      String s = value.toString() ;
      String sFont="Tahoma", sFType="" ;
      int iFType = Font.BOLD ;
      int iSize = 20 ;
      StringTokenizer st = new StringTokenizer(s, ",");
      if(st.hasMoreTokens())
      {
        if(st.hasMoreTokens()) text = st.nextToken();
        if(st.hasMoreTokens()) sFont = st.nextToken();
        if(st.hasMoreTokens()) sFType = st.nextToken();
        if(st.hasMoreTokens()) iSize = Integer.parseInt(st.nextToken());
        if(sFType.equalsIgnoreCase("B"))       iFType = Font.BOLD ;
        else if(sFType.equalsIgnoreCase("P"))  iFType = Font.PLAIN ;
        else if(sFType.equalsIgnoreCase("I"))  iFType = Font.ITALIC ;
        else if(sFType.equalsIgnoreCase("BI")) iFType = Font.BOLD + Font.ITALIC ;
        try{
          Font f = new Font(sFont,iFType, iSize);
          fTextFont = f ;
        }
        catch (Exception ex){System.out.println("setString():"+ex.toString());return false;}
      }
      iForm = iString ;
      
      return true ;
    }

    //
    // set the text x,y position
    //
    else if (property == SETTEXTAT)
    {
       String s = value.toString();
       int iX=0, iY=0;
       StringTokenizer st = new StringTokenizer(s, ",");
       try{
         if(st.hasMoreTokens()) iX = Integer.parseInt(st.nextToken()); else return false ;
         if(st.hasMoreTokens()) iY = Integer.parseInt(st.nextToken()); else return false ;
       }
       catch(Exception ex){System.out.println("SetTextAt():bad values given ["+s+"] must be x,y numeric values pair");return false;}
       iTextPosX = iX ;
       iTextPosY = iY ;
      return true;
    }    

    /*---------------------------*
     * set the text shadow color *
     *---------------------------*/
    else if (property == SETTEXTSHADOW) 
    {
      Color c=ImageKit.getInstance().makeColor(value.toString()) ;
      cShadow = c ;
      return true ;
    }
    
     /*--------------------------------*
      * set the text shadow thickness  *
      *--------------------------------*/
     else if (property == SETTEXTTHICKNESS) 
     {
       String s = value.toString() ;
       StringTokenizer st = new StringTokenizer(s, ",");
       if(st.hasMoreTokens())
       {
          if(st.hasMoreTokens()) iShadowThickH = Integer.parseInt(st.nextToken());
          if(st.hasMoreTokens()) iShadowThickV = Integer.parseInt(st.nextToken());
       }     
       at = AffineTransform.getTranslateInstance(-iShadowThickH, -iShadowThickV); 
       invalidate();
       return true ;
     }    
    
    // draw the button's bounding box
    else if (property == DRAWBORDER)
    {
      if(value.toString().equalsIgnoreCase("true")) bBorder = true ;
      else if(value.toString().equalsIgnoreCase("false")) bBorder = false ;
      return true ;
    }

    
    // draw the button's outline
    else if (property == DRAWOUTLINE)
    {
      if(value.toString().equalsIgnoreCase("true")) bOutline = true ;
      else if(value.toString().equalsIgnoreCase("false")) bOutline = false ;
      return true ;
    }

    // draw the clip's bounding box
    else if (property == DRAWCLIPBORDER)
    {
      if(value.toString().equalsIgnoreCase("true")) bClipBorder = true ;
      else if(value.toString().equalsIgnoreCase("false")) bClipBorder = false ;
      return true ;
    }

    
    // draw the button's bounding box
    else if (property == DRAWBORDERALL)
    {
      if(value.toString().equalsIgnoreCase("true")) bBorderAll = true ;
      else if(value.toString().equalsIgnoreCase("false")) bBorderAll = false ;
      return true ;
    }

    // draw the clip's bounding box
    else if (property == DRAWCLIPBORDERALL)
    {
      if(value.toString().equalsIgnoreCase("true")) bClipBorderAll = true ;
      else if(value.toString().equalsIgnoreCase("false")) bClipBorderAll = false ;
      return true ;
    }

      
    // relief
    else if (property == SETRELIEF)
    {
      if(value.toString().equalsIgnoreCase("true")) bRelief = true ;
      else if(value.toString().equalsIgnoreCase("false")) bRelief = false ;
      return true ;
    }
      
    // relief for every button
    else if (property == SETRELIEFALL)
    {
      if(value.toString().equalsIgnoreCase("true")) bReliefAll = true ;
      else if(value.toString().equalsIgnoreCase("false")) bReliefAll = false ;
    return true ;
    }


    // fit clip to button' size
    else if (property == SETSCALE)
    {
      if(value.toString().equalsIgnoreCase("true")) bScale = true ;
      else if(value.toString().equalsIgnoreCase("false")) bScale = false ;
      return true ;
    }


    // fit clip to button' size
    else if (property == SETRELIEFWIDTH)
    {
      try 
      {
        iBorderGlow = Integer.parseInt(value.toString());
      }
      catch(Exception ex){return false;}
      return true ;
    }
        
    /*-------------------------*
     * set the gradient colors *
     *-------------------------*/
    else if (property == SETGRADIENT) 
    {
        String sColor = value.toString().trim();
        String sRGB="" ;
        Color c=null ;
        StringTokenizer st = new StringTokenizer(sColor, ",");
        try
        {
            {
              // start gradient color
              sRGB = st.nextToken();
              gradient1 = ImageKit.getInstance().makeColor(sRGB);
              // end gradient color
              sRGB = st.nextToken();
              gradient2 = ImageKit.getInstance().makeColor(sRGB);
            }
        }
        catch(Exception e)
        {
            e.printStackTrace();
            return false;
        }

        clrGlowInnerHi = toDark(gradient1,.9f);
        clrGlowInnerLo = toBright(gradient1,.9f);
        clrGlowOuterHi = toDark(gradient2,.9f);
        clrGlowOuterLo = toBright(gradient2,.9f);

      return true;
    }

    /*----------------------*
     * set the border color *
     *----------------------*/
    else if (property == SETBORDERCOLOR) 
    {
      Color c=ImageKit.getInstance().makeColor(value.toString()) ;
      cBorder = c ;
      return true ;
    }
    
    // rotation degree
    else if (property == SETROTATION)
    {
      String s = value.toString() ;
      try
      {
        double d = Double.parseDouble(s);
        dRotation = d ;
        repaint();
      }
      catch (Exception ex) {System.out.println("setRotation():"+ex.toString());return false ;}
      return true ;
    }

    // set the label
    else if (property == ID.LABEL)
    {
      String label = value.toString();
      if(label.equalsIgnoreCase("null")) label = null ;
      // replace separator by carriage return
      setLabel(label.replace(cSeparator, '\n'));
      sInitialLabel = label ;
      return true ;
    }
    
    // set the NewLine separator
    else if (property == setSeparator)
    {
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
           setLabel(label.replace(cSeparator, '\n'));
           invalidate();
         }
      }
      catch (Exception e) { System.out.println(e.toString()); }
      return true ;
    }
    else if (property == ID.FOREGROUND)
    {
      Color c = (Color)value;
      setFGcolor(c);
      invalidate();
      return super.setProperty(property, c);
    }    
    else if (property == ID.BACKGROUND)
    {
      Color c = (Color)value;
        setBGcolor(c);
        invalidate();
      return super.setProperty(property, c);
    }
    else if (property == ID.FONT)
    {
      Font f = (Font)value;
        setFonte(f);
        invalidate();
      return super.setProperty(property, f);
    }  
    else if (property == ID.LOCATION)
    {
      Point p = (Point)value;
        setLocation(p);
        invalidate();
      return super.setProperty(property, p);
    }            
 
    //
    // set the label position
    //
    else if (property == SETTEXTPOS)
    {
      String s = value.toString() ;
      if(s.equalsIgnoreCase("left")) setTextPosition(1);
      else if(s.equalsIgnoreCase("center")) setTextPosition(2);
      else if(s.equalsIgnoreCase("right")) setTextPosition(3);
      log("setProperty - SETTEXTPOS value=" + value.toString());
      invalidate();
      return true;
    }
    //
    // set the shadow color
    //
    else if (property == SETSHADOWCOLOR)
    {
       Color c = ImageKit.getInstance().makeColor(value.toString()) ;
       setShadowcolor(c);
       invalidate();
      return true;
    }    
    
    //
    // set the shadow shift
    //
    else if (property == SETSHADOWSHIFT)
    {
       String s = value.toString();
       int iX=0, iY=0;
       StringTokenizer st = new StringTokenizer(s, ",");
       try{
         if(st.hasMoreTokens()) iX = Integer.parseInt(st.nextToken()); else return false ;
         if(st.hasMoreTokens()) iY = Integer.parseInt(st.nextToken()); else return false ;
       }
       catch(Exception ex){System.out.println("SetShadowShift():bad values given ["+s+"] must be x,y numeric values pair");return false;}
       dShadowX = (double)iX ;
       dShadowY = (double)iY ;
      return true;
    }    
    
    //
    // set the border color
    //
    else if (property == SETBACKGROUNDCOLOR)
    {
      String s = value.toString();
      Color c = null ;
      if( ! s.equalsIgnoreCase("null"))
      {
        c = ImageKit.getInstance().makeColor(s) ;
      }  
      setBackgroundcolor(c);
      invalidate();
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
          log("filename="+sFileName+" position="+sPos); 
          if(! sFileName.equalsIgnoreCase("null")) img = ImageKit.getInstance().loadImage( sFileName ) ;
          setBTImage(img) ;
          if(sPos != null) setImagePosition(sPos.toUpperCase());
          invalidate();
          return true;
    }
    //
    // read an image from a file
    //
    else if (property == SETIMAGEON)  
        {
          String sFileName = value.toString() ;
          Image img = null ;
          log("setProperty - SETIMAGEON value=" + sFileName);
          img = ImageKit.getInstance().loadImage( sFileName ) ;
          setImageON(img) ;
          invalidate();
          return true;
    }    
    
    else if (property == SETIMAGEOFF)  
        {
          String sFileName = value.toString() ;
          Image img = null ;
          log("setProperty - SETIMAGEOFF value=" + sFileName);
          img = ImageKit.getInstance().loadImage( sFileName ) ;
          setImageOFF(img) ;
          invalidate();
          return true;
    }    
    
    else if (property == SETIMAGEORDER)  
    {
      String s = value.toString() ;
      if(s.equalsIgnoreCase("foreground")) sOrder = "foreground" ;
      else if(s.equalsIgnoreCase("middle")) sOrder = "middle" ;
      else sOrder = "background" ;
      invalidate();
      return true ;
    }
        
    //
    // set the image position
    //
    else if (property == SETIMAGEPOS)  
        {
          String s = value.toString() ;
          setImagePosition(s);
          invalidate();
          return true;
    }
    else if (property == ID.IS_DEFAULT)  
    {
     bDefault = true ;
     return super.setProperty(property, value);
    }
    //
    // enable ?
    //
    else if (property == ID.ENABLED)  
      {
       if(value.toString().equalsIgnoreCase("true")) setEnable(true) ;
       else setEnable(false) ;
       invalidate();
       return super.setProperty(property, value);
      }    
    //
    // visible ?
    //
    else if (property == ID.VISIBLE)
     {
       if(value.toString().equalsIgnoreCase("true")) setVisible(true) ;
       else setVisible(false) ;
       invalidate();
       return super.setProperty(property, value);
     }        

    // debug mode
    else if (property == SETDEBUG)
    {
      if(value.toString().equalsIgnoreCase("true")) bLog = true ;
      else if(value.toString().equalsIgnoreCase("false")) bLog = false ;
      return true ;
    }
    
    else
    {
     return super.setProperty(property, value);
    }
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
    if(bLog) System.out.println("AmazingButton(): " + msg);
  }

 Color toDark(Color c, float factor)
 {
   return new Color(Math.max((int)(c.getRed()  * factor), 0), 
                    Math.max((int)(c.getGreen()* factor), 0),
                    Math.max((int)(c.getBlue() * factor), 0));
 }
    
  Color toBright(Color c, float factor)
  {
      int r = c.getRed();
      int g = c.getGreen();
      int b = c.getBlue();

      int i = (int)(1.0/(1.0-factor));
      if ( r == 0 && g == 0 && b == 0) {
         return new Color(i, i, i);
      }
      if ( r > 0 && r < i ) r = i;
      if ( g > 0 && g < i ) g = i;
      if ( b > 0 && b < i ) b = i;

      return new Color(Math.min((int)(r/factor), 255),
                       Math.min((int)(g/factor), 255),
                       Math.min((int)(b/factor), 255));
  } 
 
 
  public void focusGained(FocusEvent e)
     {
         try {
             if (e.getComponent() == this)
             {
                 // put the focus on the component
                 e.getComponent().requestFocus();
                 bFocus = true ;
             }
         }
         catch (Exception ex) { }
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
      log("mouseEntered()");
      bFocus=true ;
      mouseON();
    }

    /**
     * User moved the mouse out of the button
     */
    public void mouseExited(MouseEvent me)
    {
      bFocus=false ;
      mouseOFF();
    }
    /**
     * User moved the mouse out of the button
     */
    public void mousePressed(MouseEvent me)
    {
      bPressed = true ;
    }
    /**
     * User moved the mouse out of the button
     */
    public void mouseReleased(MouseEvent me)
    {
      bPressed = false ;
    }
    
  }


    public void drawText(int w, int h, Graphics2D g2) {

        Rectangle2D rect = new Rectangle2D.Double();
        FontRenderContext frc = g2.getFontRenderContext();
        
        AffineTransform save = g2.getTransform(); 
        
        if(!bEnable){
          g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.4f));
        }
        else {
            g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1f));
        }

        /*
         * gets the outline shape of the glyph vector created
         * from the current font and String
         */
        shape = fTextFont.createGlyphVector(frc, text).getOutline();

        // creates a shape transformed with the current transform
        tshape = at.createTransformedShape(shape);

        // gets a PathIterator that iterates the boundary of shape
        PathIterator pi = shape.getPathIterator(null);
        
        float seg[] = new float[6];
        float tseg[] = new float[6];
        
        GeneralPath working = new GeneralPath(GeneralPath.WIND_NON_ZERO);
        float x=0, y=0; // Current point on the path
        float tx=0, ty=0; // Transformed path point
        float cx=0, cy=0; // Last moveTo point, for SEG_CLOSE
        float tcx=0, tcy=0; // Transformed last moveTo point
        
        /*
         * iterates through the Shape and builds the ribbon
         * by adding GeneralPath objects
         */
        while(!pi.isDone()) {
            int segType = pi.currentSegment(seg);
            switch(segType) {
                case PathIterator.SEG_MOVETO:
                        at.transform(seg, 0, tseg, 0, 1);
                        x = seg[0];
                        y = seg[1];
                        tx = tseg[0];
                        ty = tseg[1];
                        cx = x;
                        cy = y;
                        tcx = tx;
                        tcy = ty;
                        break;
                case PathIterator.SEG_LINETO:
                        at.transform(seg, 0, tseg, 0, 1);
                        if (Line2D.relativeCCW(x, y, tx, ty,
                                               seg[0], seg[1]) < 0) {
                            working.moveTo(x, y);
                            working.lineTo(seg[0], seg[1]);
                            working.lineTo(tseg[0], tseg[1]);
                            working.lineTo(tx, ty);
                            working.lineTo(x, y);
                        } else {
                            working.moveTo(x, y);
                            working.lineTo(tx, ty);
                            working.lineTo(tseg[0], tseg[1]);
                            working.lineTo(seg[0], seg[1]);
                            working.lineTo(x, y);
                        }
                        
                        x = seg[0];
                        y = seg[1];
                        tx = tseg[0];
                        ty = tseg[1];
                        break;
                        
                case PathIterator.SEG_QUADTO:
                        at.transform(seg, 0, tseg, 0, 2);
                        if (Line2D.relativeCCW(x, y, tx, ty,
                                               seg[2], seg[3]) < 0) {
                            working.moveTo(x, y);
                            working.quadTo(seg[0], seg[1],
                                           seg[2], seg[3]);
                            working.lineTo(tseg[2], tseg[3]);
                            working.quadTo(tseg[0], tseg[1],
                                           tx, ty);
                            working.lineTo(x, y);
                        } else {
                            working.moveTo(x, y);
                            working.lineTo(tx, ty);
                            working.quadTo(tseg[0], tseg[1],
                                           tseg[2], tseg[3]);
                            working.lineTo(seg[2], seg[3]);
                            working.quadTo(seg[0], seg[1],
                                           x, y);
                        }
                
                        x = seg[2];
                        y = seg[3];
                        tx = tseg[2];
                        ty = tseg[3];
                        break;
        
                case PathIterator.SEG_CUBICTO:
                        at.transform(seg, 0, tseg, 0, 3);
                        if (Line2D.relativeCCW(x, y, tx, ty,
                                               seg[4], seg[5]) < 0) {
                            working.moveTo(x, y);
                            working.curveTo(seg[0], seg[1],
                                            seg[2], seg[3],
                                            seg[4], seg[5]);
                            working.lineTo(tseg[4], tseg[5]);
                            working.curveTo(tseg[2], tseg[3],
                                            tseg[0], tseg[1],
                                            tx, ty);
                            working.lineTo(x, y);
                        } else {
                            working.moveTo(x, y);
                            working.lineTo(tx, ty);
                            working.curveTo(tseg[0], tseg[1],
                                            tseg[2], tseg[3],
                                            tseg[4], tseg[5]);
                            working.lineTo(seg[4], seg[5]);
                            working.curveTo(seg[2], seg[3],
                                            seg[0], seg[1],
                                            x, y);
                        }
                
                        x = seg[4];
                        y = seg[5];
                        tx = tseg[4];
                        ty = tseg[5];
                        break;
        
                case PathIterator.SEG_CLOSE:
                        if (Line2D.relativeCCW(x, y, tx, ty,
                                               cx, cy) < 0) {
                            working.moveTo(x, y);
                            working.lineTo(cx, cy);
                            working.lineTo(tcx, tcy);
                            working.lineTo(tx, ty);
                            working.lineTo(x, y);
                        } else {
                            working.moveTo(x, y);
                            working.lineTo(tx, ty);
                            working.lineTo(tcx, tcy);
                            working.lineTo(cx, cy);
                            working.lineTo(x, y);
                        }
                        x = cx; 
                        y = cy;
                        tx = tcx;
                        ty = tcy;
            }
            pi.next();
        } // while
        ribbon = working;

        if(!bEnable){
          g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.4f));
        }
        else {
            g2.setComposite(AlphaComposite.SrcOver);
        }
        Rectangle r = shape.getBounds();
        
        // left alignement
        if(iTextPos == 1) g2.translate(1,h*.5+r.height*.5);        
        // center
        if(iTextPos == 2) g2.translate(w*.5-r.width*.5,h*.5+r.height*.5);
        // right alignement
        if(iTextPos == 3) g2.translate(w-r.width,h*.5+r.height*.5);

        
        if(bPressed) g2.translate(1,1);
        
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,RenderingHints.VALUE_TEXT_ANTIALIAS_ON);             
        
        Color c1 = new Color(100,100,100);
        
        // fills the transformed shape with shadow color
        if( ! bEnable) g2.setColor(c1.brighter()); //g2.setColor(cShadow.darker().darker());
        else if(bPressed) g2.setColor(cShadow.darker());
        else g2.setColor(cShadow);
        g2.fill(tshape);

        /* 
         * fills the shape producing the 3D effect with a 
         * partially opaque white color
         */
        if( ! bEnable) g2.setColor(c1);
        else g2.setColor(cShadow);
        g2.fill(ribbon);

        if(gradient1 != null)
        {
          //if(! bEnable) g2.setPaint(new GradientPaint(0,0,toDark(gradient1,.4f),0,r.height,toDark(gradient2,.4f)));
          if(! bEnable) g2.setPaint(new GradientPaint(0,0,c1,0,r.height,c1));
          else if(bPressed) g2.setPaint(new GradientPaint(0,0,toDark(gradient1,.9f),0,r.height,toDark(gradient2,.9f)));
          else g2.setPaint(new GradientPaint(0,0,gradient1,r.width,r.height,gradient2));
        }
        // fills the shape with gradient
        g2.fill(shape);

        // strokes the outline of shape   
        focusStroke=new BasicStroke(2.0f,BasicStroke.CAP_ROUND,BasicStroke.JOIN_BEVEL);
        g2.setStroke(focusStroke);
        if(! bEnable) g2.setColor(c1);
        else g2.setColor(cBorder);
        g2.draw(shape);
 
        if(bRelief || bReliefAll)
        {
          // draw relief
          paintBorderGlow(shape, g2, iBorderGlow, bEnable);     
        }
        
        // draw default/focus mark
        if(bDefault && bEnable)
        {
            g2.setColor(cDefault);
            g2.draw(shape); 
        }    
        if(bFocus && bEnable)
        {
            g2.setColor(cFocus);
            g2.draw(shape); 
        }            
        
      g2.setTransform(save);
  }

    private static Color getMixedColor(Color c1, float pct1, Color c2,
            float pct2) {
        float[] clr1 = c1.getComponents(null);
        float[] clr2 = c2.getComponents(null);
        for (int i = 0; i < clr1.length; i++) {
            clr1[i] = (clr1[i] * pct1) + (clr2[i] * pct2);
        }
        return new Color(clr1[0], clr1[1], clr1[2], clr1[3]);
    }
    
    private void paintBorderGlow(Shape shape,Graphics2D g2, int glowWidth, boolean bEnabled) {
        int gw = glowWidth * 2;
        for (int i = gw; i >= 2; i -= 2) {
            float pct = (float) (gw - i) / (gw - 1);
    
            Color mixHi = getMixedColor(clrGlowInnerHi, pct, clrGlowOuterHi,
                    1.0f - pct);
            Color mixLo = getMixedColor(clrGlowInnerLo, pct, clrGlowOuterLo,
                    1.0f - pct);
            if(!bEnabled) {
                mixHi = mixHi.darker() ;
                mixLo = mixLo.darker() ;
            }
            g2.setPaint(new GradientPaint(0.0f, getHeight() * 0.25f, mixHi,
                    0.0f, getHeight(), mixLo));
            if(!bEnable){
                g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_ATOP, 0.4f));
            }
            else {
                g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_ATOP,pct));
            }
            g2.setStroke(new BasicStroke(i));
            g2.draw(shape);
        }
    }

    private void paintBorderShadow(Shape shape,Graphics2D g2, int shadowWidth) {
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
                            RenderingHints.VALUE_ANTIALIAS_ON);
        int sw = shadowWidth*2;
        for (int i=sw; i >= 2; i-=2) {
            float pct = (float)(sw - i) / (sw - 1);
            g2.setColor(getMixedColor(Color.lightGray, pct,                                      
                                      Color.lightGray, 1.0f-pct));
            g2.setStroke(new BasicStroke(i));
            g2.draw(shape);
        }
    }


}