package oracle.forms.fd;

import java.awt.*;
import java.awt.BasicStroke;
import java.awt.event.*;
import java.awt.font.FontRenderContext;
import java.awt.font.TextLayout;
import java.awt.geom.Rectangle2D;
import java.net.*;
import java.util.*;
import javax.swing.*;
import oracle.forms.handler.IHandler;
import oracle.forms.properties.ID;
import oracle.forms.ui.CustomEvent;
import oracle.forms.ui.VBean;

  /**
   * A Java Bean to handle a HTML map
   *
   * @author Francois Degrelle
   * creation  October 2011   
   */
   
public class LAF_Map extends VBean {
  public final static ID SETPOLYGON    = ID.registerProperty("MAP_SET_POLYGON"); 
  public final static ID SETRECT       = ID.registerProperty("MAP_SET_RECT");   
  public final static ID SETIMAGE      = ID.registerProperty("MAP_SET_IMAGE");  
  public final static ID SETSHOWTTP    = ID.registerProperty("MAP_SET_TOOLTIP");   
  public final static ID MAPBORDER     = ID.registerProperty("MAP_SET_BORDER");
  public final static ID MAPSETFILL    = ID.registerProperty("MAP_SET_FILL");
  public final static ID MAPSETLOG     = ID.registerProperty("MAP_SET_LOG");
  // event raised
  public final static ID ZONECLICKED   = ID.registerProperty("MAP_ZONE_CLICKED");     
  public final static ID MAPNAME       = ID.registerProperty("MAP_NAME");       
  public final static ID MAPURL        = ID.registerProperty("MAP_URL");       
  public final static ID NULLEVENT     = ID.registerProperty("MAP_NULL");       
  
  Graphics2D g2 ;
  map_zone[] tz = new map_zone[100] ;
  public IHandler  m_handler;
  private  float dash1[] = {1.3f};
  private BasicStroke line = new BasicStroke(1.0f);
  private Color cLineColor = Color.BLACK ;
  private Color cFontFGColor = Color.BLACK; 
  private Color cFontBGColor = Color.WHITE; 
  private Color cFill = Color.WHITE;
  private JLabel bigLabel = new JLabel();
  private int iMaxZones=0, iSelectedZone = -1 ;
  private int iCurrent=-1, iOld=-1 ;
  private int iPosX=0, iPosY=0; 
  private boolean bLog = false ;
  private boolean bImageLoaded = false ;
  private boolean bFill = false ;
  private boolean bShowTP = true ;
  private float   fTrsp = .5f;
  private URL m_codeBase;  
  private ImageIcon image = null ; 
  private ImageKit  ik = new ImageKit();

   public LAF_Map() 
    {
      super();
    }
    
   public void init(IHandler handler)
   {
      m_handler = handler;
      super.init(handler);
      boolean bCont=true;
      int index = 1;
    }
 
  /*----------------------------
   *  Set the map properties  
   *--------------------------*/
  public boolean setProperty(ID property, Object value)
  {
    log("setProperty: "+property+":"+value);
    // set a polygonal zone
    if (property == SETPOLYGON) 
    {
      String text="";
      String sUrl = "";
      String s = value.toString();
      Polygon p = new Polygon();
      try {
       StringTokenizer tokenizer = new StringTokenizer(s, ",");
       // tooltip
       text = tokenizer.nextToken() ;
       // url
       sUrl = tokenizer.nextToken() ;
       while (tokenizer.hasMoreTokens()) {
         String str = tokenizer.nextToken().trim();
         int x = Integer.parseInt(str);
         str = tokenizer.nextToken().trim();
         int y = Integer.parseInt(str);
         p.addPoint(x, y);
         }
     }
     catch (Exception ex) { }
     tz[iMaxZones++] = new map_zone(p, text, sUrl, new Rectangle(p.getBounds()));
     PolygonButton btn = new PolygonButton(p,text, sUrl, this);
     repaint();
     return true;
    }
    // set a rectangular zone
    else if (property == SETRECT) 
    {
      String text="";
      String sUrl = "";
      String s = value.toString();
      int x=0, y=0, w=0, h=0;
      Polygon p = new Polygon();
      StringTokenizer tokenizer = new StringTokenizer(s, ",");
      // tolltip
      text = tokenizer.nextToken() ;
      // url
      sUrl = tokenizer.nextToken() ;
      x = Integer.parseInt(tokenizer.nextToken().trim()); // X pos
      y = Integer.parseInt(tokenizer.nextToken().trim()); // Y pos
      w = Integer.parseInt(tokenizer.nextToken().trim()); // Width
      h = Integer.parseInt(tokenizer.nextToken().trim()); // Height
      p.addPoint(x,y);
      p.addPoint(x+w,y);
      p.addPoint(x+w,y+h);
      p.addPoint(x,y+h);
      tz[iMaxZones++] = new map_zone(p, text, sUrl, new Rectangle(p.getBounds()));
      PolygonButton btn = new PolygonButton(p,text, sUrl, this);      
      repaint();
     return true;
    }    
    // set the background image
    else if (property == SETIMAGE) 
    {
      String sImageName = value.toString() ;
      bImageLoaded = false ;
      Image img = ik.loadImage(sImageName);
      if(img != null) {
        bImageLoaded = true ;
        image = new ImageIcon(img);
      }  
      return true ;
    }
   
    // Tooltip properties
    else if (property == SETSHOWTTP) 
    {
      String s = value.toString();
      Color cF=Color.BLACK, cB=Color.WHITE;
      String s2="";
      StringTokenizer tokenizer = new StringTokenizer(s, ",");
      if (tokenizer.hasMoreTokens()) {
         s2 = tokenizer.nextToken() ;
         if(s2.equalsIgnoreCase("true")) bShowTP = true ;
         else if(s2.equalsIgnoreCase("false")) bShowTP = false ;
      }
      else return false;            
      // FG color
      if (tokenizer.hasMoreTokens()) {
         s2 = tokenizer.nextToken() ;
         cFontFGColor = ik.makeColor(s2);
      }
      // BG color
      if (tokenizer.hasMoreTokens()) {
         s2 = tokenizer.nextToken() ;
         cFontBGColor = ik.makeColor(s2);
      }            
      return true ;
    }
    // set the fill style
    else if (property == MAPSETFILL) 
    {
      String s = value.toString() ;
      String s2;
      StringTokenizer tokenizer = new StringTokenizer(s, ",");
      // draw fill ?
      if (tokenizer.hasMoreTokens()) {
         s2 = tokenizer.nextToken() ;
         if(s2.equalsIgnoreCase("true")) bFill = true ;
         else if(s2.equalsIgnoreCase("false")) bFill = false ;
      }
      else return false; 
      // transparency
      if (tokenizer.hasMoreTokens()) {
         s2 = tokenizer.nextToken() ;
         try
         {
           fTrsp = Float.parseFloat(s2) ;
           if(fTrsp <0) fTrsp = 0.0f ;
           else if(fTrsp >1) fTrsp = 1.0f ;
         }
         catch (Exception e){ System.out.println(" ** LAF_MAP() Map_Set_Fill: incorect transparency factor"); return false; }
      }
      // color
      if (tokenizer.hasMoreTokens()) {
         s2 = tokenizer.nextToken() ;
         cFill = ik.makeColor(s2);
      }                  
      return true ;
    }    
    // set the area border properties
    else if (property == MAPBORDER) 
    {
      String s = value.toString();
      String sType="", sColor="r0g0b0";
      float  fSize=1.0f;
      Color c = Color.BLACK;
      StringTokenizer tokenizer = new StringTokenizer(s, ",");
      if (tokenizer.hasMoreTokens()) {
         sType = tokenizer.nextToken() ;
      }
      else return false;      
      if (tokenizer.hasMoreTokens()) {
         try
         {
           fSize = Float.parseFloat(tokenizer.nextToken()) ;
           if(fSize < 0) fSize = 0 ;
         }
         catch (Exception e){ System.out.println(" ** LAF_MAP() Map_Set_Border: incorect size"); return false; }
      }      
      if (tokenizer.hasMoreTokens()) {
         sColor = tokenizer.nextToken() ;
         cLineColor = ik.makeColor(sColor);
      }
      if(sType.equalsIgnoreCase("line")) {
         line = new BasicStroke(fSize);        
      }
      else if(sType.equalsIgnoreCase("dash")) {
         line = new BasicStroke(fSize, BasicStroke.CAP_BUTT, 
                                      BasicStroke.JOIN_MITER, 
                                      10.0f, dash1, 0.0f);
      }      
      else if(sType.equalsIgnoreCase("none")) {
         line = null ;
      }      
      return true ;
    }     
    // show log outpur
    else if (property == MAPSETLOG) 
    {
      String s = value.toString() ;
      if(s.equalsIgnoreCase("true")) bLog = true ;
      else bLog = false ;
      return true ;
    }    
    
    // other properties
    else
    {
     return super.setProperty(property, value);
    }
  }    

    /*-------------------------
     *    Get the properties 
     *------------------------*/
    public Object getProperty(ID pId) // Get the current area name
    {
      log("getProperty: "+pId.toString());
      if (pId == MAPNAME && iCurrent >=0)
      {
        return "" + tz[iCurrent].name;
      }
      if (pId == MAPURL && iCurrent >=0)
      {
        return "" + tz[iCurrent].url;
      }      
      else
      {
        return super.getProperty(pId);
      }
    } 
    
   /*--------------------
    *  paint the areas 
    *-------------------*/
   public void paint(Graphics g) {
    image.paintIcon(null,g,0,0);
   } 

 /*------------------------------------
  *  Show/Hide the selected map part 
  *-----------------------------------*/
   void display(int iNum, boolean b) {
    if(!bImageLoaded) return ;
    int x=0;
    Graphics2D g3 = (Graphics2D) this.getGraphics();
    String sName="" ;
    // double buffering
    Image bufferImage = createImage(this.getSize().width, this.getSize().height );
    Graphics2D g2 = (Graphics2D)bufferImage.getGraphics();

    if(g2 != null && iNum >= 0)
    {
      g2.setBackground(this.getBackground());
      g2.clearRect((int)this.getX(),(int)this.getY(),(int)this.getWidth(),(int)this.getHeight());
      image.paintIcon(null,g2,0,0); 

      if(b)
      {
        if(bFill){
          g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, fTrsp));
          g2.setColor(cFill);
          g2.fillPolygon(tz[iNum].p);
        }
        
        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1f));
        if(line != null) {
          g2.setColor(cLineColor);
          g2.setStroke(line);
          g2.drawPolygon(tz[iNum].p);
        }

        sName = tz[iNum].name ;
        if(bShowTP){
          Font font = new Font("Arial",Font.BOLD,14);
          FontRenderContext frc = g2.getFontRenderContext();
          TextLayout layout = new TextLayout(tz[iNum].name, font, frc);
          Rectangle2D bounds = layout.getBounds();
          g2.setColor(cFontBGColor);
          x = (int)(tz[iNum].r.getX()+(tz[iNum].r.getWidth()/2)) ;
          // drawing outside the JPanel ?
          if((x + (bounds.getWidth()+6)) > this.getWidth()){
            x = (int)(this.getWidth() - (bounds.getWidth()+10)) ;
          }
          g2.fillRect( x-2,
                      (int)((tz[iNum].r.getY()+(tz[iNum].r.getHeight()/2))-(int)(bounds.getHeight()+2)),
                      (int)(bounds.getWidth()+6),
                      (int)(bounds.getHeight()+8));
          g2.setColor(cFontFGColor);
          g2.drawRect( x-2,
                      (int)((tz[iNum].r.getY()+(tz[iNum].r.getHeight()/2))-(int)(bounds.getHeight()+2)),
                      (int)(bounds.getWidth()+6),
                      (int)(bounds.getHeight()+8));       
          g2.setFont(font);
          g2.drawString(tz[iNum].name,x ,(int)(tz[iNum].r.getY()+(tz[iNum].r.getHeight()/2)));
        }
      }
      g3.drawImage(bufferImage, 0, 0, this);  
    }
    g2.dispose();
    g3.dispose();
   }
 
  class PolygonButton extends JComponent implements MouseListener, MouseMotionListener
  {
    int iPos = iMaxZones ;
    public PolygonButton(Polygon p,String name, String sUrl, VBean vb)
    {
      setBounds(p.getBounds());
      setName(name);
      vb.addMouseListener(this);     
      vb.addMouseMotionListener(this); 
    }
  
    /*----------------------------------
     *  Show the corresponding area  
     *--------------------------------*/
    public void mouseMoved(MouseEvent e) {
      boolean bFound=false ;
      int x = e.getX();
      int y = e.getY();
      for( int i=0; i<iMaxZones;i++)
      {
        if( tz[i].p.contains(x, y) ) 
        {
          bFound=true ;
          if(i != iCurrent)
          {
            iCurrent= i ;        
            display( iCurrent, true );   
          }      
        }
        if(bFound) break;
      }
      if(!bFound)
      {
        iCurrent = -1;
        display(0,false);
      }
    } 
    
    public void mouseDragged(MouseEvent e) {}
    
    /*----------------------------------------
     *  Inform that a zone has been clicked  
     *--------------------------------------*/
    public void mouseClicked(MouseEvent e) {
    if(iCurrent >=0 && (this.getName().equals(tz[iCurrent].name)))
    {
      log("Zone selected="+tz[iCurrent].name + " ("+tz[iCurrent].url + ")");
      try
      {
        CustomEvent ce = new CustomEvent(m_handler, ZONECLICKED);
        m_handler.setProperty(MAPNAME, tz[iCurrent].name);
        m_handler.setProperty(MAPURL, tz[iCurrent].url);
        dispatchCustomEvent(ce);    
      }
      catch (Exception ex)
      {
        System.out.println("LAF_Map(): -> exception while dispatching: " + ex);      
      }
    }
   }
   public void mousePressed(MouseEvent e) {}
   public void mouseReleased(MouseEvent e) {}
   public void mouseExited(MouseEvent e) { mouseMoved(e); }
   public void mouseEntered(MouseEvent e) { mouseMoved(e); }
  }
 
  void log( String sMessage )
  {
    if( bLog) System.out.println( "LAF_Map() " + sMessage ) ;
  }
}
