package oracle.forms.fd;

import java.awt.*;
import java.awt.event.*;
import java.awt.geom.*;
import java.io.*;
import java.net.*;
import java.util.*;
import java.util.List;
import javax.swing.*;
import javax.swing.border.*;
import oracle.forms.handler.*;
import oracle.forms.properties.*;
import oracle.forms.ui.*;
import sun.misc.*;


/**
 * A javabean to display a scrolling image slideshow
 *
 * @author Francois Degrelle
 * @version 1.1
 * 
 * January   2009  - Creation
 * February  2000  - add a key listener to the bean
 *                   to be able to navigate through the images
 *                   with the keyboard
 */
   
  public class ImageViewer extends VBean implements ComponentListener, ActionListener, KeyListener
  {
      public final static ID readImageFile         = ID.registerProperty("READ_IMAGE_FILE");   
      public final static ID readImageBase         = ID.registerProperty("READ_IMAGE_BASE");
      public final static ID setNumberIcons        = ID.registerProperty("SET_NUMBER_ICONS");   
      public final static ID setNewSize            = ID.registerProperty("SET_NEW_SIZE");         
      public final static ID showPanel             = ID.registerProperty("SHOW_PANEL");      
      public final static ID setOrientation        = ID.registerProperty("SET_ORIENTATION");
      public final static ID setIconDimension      = ID.registerProperty("SET_ICON_DIMENSION");
      public final static ID setImageDimension     = ID.registerProperty("SET_IMAGE_DIMENSION");      
      public final static ID setImageShift         = ID.registerProperty("SET_IMAGE_SHIFT");            
      public final static ID setFrameWidth         = ID.registerProperty("SET_FRAME_WIDTH");
      public final static ID setFrameColor         = ID.registerProperty("SET_FRAME_COLOR");      
      public final static ID setFrameMirror        = ID.registerProperty("SET_FRAME_MIRROR");      
      public final static ID setPanelColor         = ID.registerProperty("SET_PANEL_COLOR");
      public final static ID setPanelBorderColor   = ID.registerProperty("SET_PANEL_BORDER_COLOR");      
      public final static ID setButtonColor        = ID.registerProperty("SET_BUTTON_COLOR");      
      public final static ID setBeanColor          = ID.registerProperty("SET_BEAN_COLOR");
      public final static ID setBeanBorder         = ID.registerProperty("SET_BEAN_BORDER");
      public final static ID setIconSelectedColor  = ID.registerProperty("SET_ICON_SELECTED_COLOR");      
      public final static ID SetBeanGradientColors = ID.registerProperty("SET_BEAN_GRADIENT_COLORS");      
      public final static ID SetTooltipDisplayTime = ID.registerProperty("SET_TOOLTIP_DISPLAY_TIME");      
      public final static ID ClearImages           = ID.registerProperty("CLEAR_IMAGES");            
      public final static ID refreshScreen         = ID.registerProperty("REFRESH_SCREEN");                  
      public final static ID VIEWER_MESSAGE        = ID.registerProperty("VIEWER_MESSAGE");                  
      public final static ID VIEWER_VALUE          = ID.registerProperty("VIEWER_VALUE");
      public final static ID setLog                = ID.registerProperty("SET_LOG");            
      
    // gradient positions
    protected static int   LeftToRight = 1 ;
    protected static int   UpToDown = 2 ;
    protected static int   LeftUpToRightDown = 3 ;
    protected static int   LeftDownToRightUp = 4 ;
    protected int          iDirection = LeftToRight ;
    
    public final static int iNORTH = 1 ;
    public final static int iSOUTH = 2 ;
    public final static int iWEST = 3 ;
    public final static int iEST = 4 ;
    private int    iOrientation = iNORTH ;
    private JPanel jp = null ;
    private VBean  vb = null ;
    private Image  img = null ;
    private List   list_images  = new ArrayList(10) ;            
    private Color  colorBG = null ;
    private Color  cFrameColor = null ;
    private Color  cPanelColor = Color.white ;
    private Color  cButtonColor = Color.white ;    
    private Color  cBeanColor = Color.black ;   
    private Color  cIconSelected = new Color(100,100,100) ;
    private Color  cGradientStart = null, cGradientStop = null ;
    private int    iPanelWidth = 200, iPanelHeight = 60 ;
    private int    iMaxImages =  5, iLoadedImages = 0, iImageDisplayed = 0 ;
    private int    iImgMaxWidth  = 200 ;
    private int    iImgMaxHeight = 200 ;    
    private int    iImageShift = 20 ;
    private int    iImgStart = 0, iCurrentImage = 0, iOverImage = 0 ;
    private int    iX = 5, iY = 5 ;
    private int    iIconWidth = 40, iIconHeight = 40 ;
    private int    iImageWidth = 0, iImageHeight = 0 ;
    private int    iCanvasWidth = 0, iCanvasHeight = 0;
    private int    iMaxImagesDrawn = 0 ;
    private int    iFrameWidth = 0 ;
    private int    iClickedImage = 0 ;
    private int    iTooltipTime  = 8000 ; // tooltip displays 8 seconds
    private String sCommand = "" ;
    private String sTooltip = "" ;
    private JButton jbNext = null ;
    private JButton jbPrec = null ;
    private Rectangle rectBig = null ;
    private Rectangle rect[]  = new Rectangle[50];
    private boolean bLog = false ;
    private boolean bFound = false ;
    private boolean bPaint = true ;
    private boolean bMirror = false ;
    private StringBuffer sbImage = new StringBuffer();
    private JFrame jf = null ;
    private JScrollPane jsp = null ;
    private javax.swing.JLayeredPane jlp = null ;
    private JButton labels[] = new JButton[20] ;
    private IHandler  m_handler;  
    private ImageKit  ik = new ImageKit() ;
    
    private   File        file_image = null ;
    private   FileInputStream fis = null ;    
    private   URL         m_codeBase;    
    
    public ImageViewer()
    {
      super();
      vb = this ;
      // create the panel
      jp = new ThumbNail();
      jp.setLayout(null);
      jp.setVisible(false);
      // create the JScrollPane and associate with the panel
      jsp =  new JScrollPane(jp) ;
      jsp.setBackground(Color.white);
      jsp.setBorder(null);
      jsp.setVisible(false);
      jsp.setVerticalScrollBarPolicy(ScrollPaneConstants.VERTICAL_SCROLLBAR_NEVER);
      jsp.setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_NEVER);
      this.setLayout(null);
      this.add(jsp);
      this.setBGColor(cPanelColor);
      addKeyListener(this);
      
    }
    
    public void init(IHandler handler)
    {
        m_handler = handler;        
        super.init(handler);
        ToolTipManager.sharedInstance().setDismissDelay(iTooltipTime);
    }  
    

    /*-----------------------------------*
     *  set the properties of the bean   *
     *-----------------------------------*/
    public boolean setProperty(ID property, Object value)
    {
      if(property != readImageBase) log(property + ":" + value);
      
      // get image from disk - url
      if(property == readImageFile)
      {
        String s = (String)value ;
        String sFileName="", sCommand="", sTooltip="" ;
        StringTokenizer st = new StringTokenizer(s,"|");
        if (st.hasMoreTokens()) sFileName = st.nextToken() ;        
        if (st.hasMoreTokens()) sCommand  = st.nextToken() ;        
        if (st.hasMoreTokens()) sTooltip  = st.nextToken() ;        
        readImageFile(sFileName, sCommand, sTooltip) ;
        return true ;
      }
      
      // get image from database
      if(property == readImageBase)
      {
        log("readImageBase");
        String s = (String)value ;
        String sFileName="", sCommand="", sTooltip="" ;
        StringTokenizer st = new StringTokenizer(s,"|");
        if (st.hasMoreTokens()) sFileName = st.nextToken() ;        
        if (st.hasMoreTokens()) sCommand  = st.nextToken() ;        
        if (st.hasMoreTokens()) sTooltip  = st.nextToken() ;        
        readImageBase(sFileName, sCommand, sTooltip) ;
        return true ;
      }
      
      // set number of icons displayed
      if(property == setNumberIcons)
      {
        String s = (String)value ;
        int i ;
        try{
           i = Integer.parseInt(s);
           setNumberIcons(i) ;
        }
        catch(Exception e) {System.out.println("setNumberIcons() invalid number:"+s);}
        return true ;
      }
      
      // set the tooltip displaying time
      // value given in seconds
      if(property == SetTooltipDisplayTime)
      {
          String s = (String)value ;
          int i ;
          try{
             i = Integer.parseInt(s);
             if(i != -1 && i < 5) return false ;
             if(i == -1) i = Integer.MAX_VALUE ;
             else iTooltipTime = i * 1000 ;
             ToolTipManager.sharedInstance().setDismissDelay(iTooltipTime);
          }
          catch(Exception e) {System.out.println("SetTooltipDisplayTime() invalid number:"+s);}
      }
      
      // set new panel size
      if(property == setNewSize)
      {
        String s = (String)value ;
        String s1="", s2="" ;
        int i1=0, i2=0;
        StringTokenizer st = new StringTokenizer(s,",");
        if (st.hasMoreTokens()) s1 = st.nextToken() ;
        else return false ;
        if (st.hasMoreTokens()) s2 = st.nextToken() ;
        else return false ;      
        try{
          i1 = Integer.parseInt(s1);
          i2 = Integer.parseInt(s2);
          setNewSize(i1,i2);
        }  
        catch(Exception e) {System.out.println("setNewSize() invalid number:"+s);}
        return true ;
      }
      
      // show the panel
      if(property == showPanel)
      {
        //String s = (String)value ;
        showFrame(true);
        return true ;
      }
      
      // set the orientation
      if(property == setOrientation)
      {
        String s = (String)value ;
        if(s.equalsIgnoreCase("NORTH"))      setOrientation(1) ;
        else if(s.equalsIgnoreCase("SOUTH")) setOrientation(2) ;
        else if(s.equalsIgnoreCase("WEST"))  setOrientation(3) ;
        else if(s.equalsIgnoreCase("EST"))   setOrientation(4) ;
        else System.out.println("setOrientation() valid choice is: NORTH - SOUITH - WEST - EST");
        return true ;
      }
      
      // set the icon dimension
      if(property == setIconDimension)
      {
        String s = (String)value ;
        int i1=0, i2=0;
        String s1="", s2="" ;
        StringTokenizer st = new StringTokenizer(s,",");
        if (st.hasMoreTokens()) s1 = st.nextToken() ;
        else return false ;
        if (st.hasMoreTokens()) s2 = st.nextToken() ;
        else return false ;      
        try{
          i1 = Integer.parseInt(s1);
          i2 = Integer.parseInt(s2);
          setIconDimension(i1,i2);
        }  
        catch(Exception e) {System.out.println("setIconDimension() invalid number:"+s);}      
        return true ;
      }
      
      // set the image dimension
      if(property == setImageDimension)
      {
        String s = (String)value ;
        int i1=0, i2=0;
        String s1="", s2="" ;
        StringTokenizer st = new StringTokenizer(s,",");
        if (st.hasMoreTokens()) s1 = st.nextToken() ;
        else return false ;
        if (st.hasMoreTokens()) s2 = st.nextToken() ;
        else return false ;      
        try{
          i1 = Integer.parseInt(s1);
          i2 = Integer.parseInt(s2);
          setImageDimension(i1,i2);
        }  
        catch(Exception e) {System.out.println("setImageDimension() invalid number:"+s);}       
        return true ;
      }      
      
      // set the image shift
      if(property == setImageShift)
      {
        String s = (String)value ;
        int i ;
        try{
           i = Integer.parseInt(s);
           if(i > 0 && i < 100) iImageShift = i ;
        }
        catch(Exception e) {System.out.println("setImageShift() invalid number:"+s);}
        return true ;
      }
      
      // set the image frame width
      if(property == setFrameWidth)
      {
        String s = (String)value ;
        int i ;
        try{
           i = Integer.parseInt(s);
           setFrameWidth(i) ;
        }
        catch(Exception e) {System.out.println("setOrientation() invalid number:"+s);}
        return true ;
      }
      
      // set the image frame color
      if(property == setFrameColor)
      {
        String s = (String)value ;
        setFrameColor(s) ;
        return true ;
      }
      
      // set the main image mirror
      if(property == setFrameMirror)
      { 
        String s = (String)value ;
        if(s.equalsIgnoreCase("true")) bMirror = true ;
        else bMirror = false ;
        return true ;
      }

      // set the panel color
      if(property == setPanelColor)
      {
        String s = (String)value ;
        cPanelColor = ik.makeColor(s) ;
        return true ;
      }
      
      // set the panel border color
      if(property == setPanelBorderColor)
      {
        String s = (String)value ;
        Color c = ik.makeColor(s) ;
        jsp.setBorder(BorderFactory.createLineBorder(c,2));
        return true ;
      }
        
      // set the button color
      if(property == setButtonColor)
      {
        String s = (String)value ;
        cButtonColor = ik.makeColor(s) ;
        return true ;
      }
      
      // set the bean frame
      if(property == setBeanBorder)
      {
        log("Vbean component:"+this.getComponent(0));
        String s = (String)value ;
        String sType="", sColor="", sWidth="" ;
        int iWidth = 1 ;
        Color c = Color.black;
        Border border = null ;
        StringTokenizer st = new StringTokenizer(s,",");
        // border type
        if (st.hasMoreTokens())
        {
           sType = st.nextToken() ;
        } else return false ;
        // border color
        if (st.hasMoreTokens())
        {
           sColor = st.nextToken() ;
           c = ik.makeColor(sColor);
        } 
        // border width
        if (st.hasMoreTokens())
        {
           sWidth = st.nextToken() ;
           try
           {
             iWidth = Integer.parseInt(sWidth) ;
           }
           catch(Exception e){System.out.println("setBeanBorder() wrong width parameter:"+sWidth);}
        }

        if(sType.equalsIgnoreCase("line")) border = BorderFactory.createLineBorder(c,iWidth);
        else if(sType.equalsIgnoreCase("raised")) border = BorderFactory.createEtchedBorder(EtchedBorder.RAISED);
        else if(sType.equalsIgnoreCase("lowered")) border = BorderFactory.createEtchedBorder(EtchedBorder.LOWERED);
        else if(sType.equalsIgnoreCase("raisedbevel")) border = BorderFactory.createRaisedBevelBorder();
        else if(sType.equalsIgnoreCase("loweredbevel")) border = BorderFactory.createLoweredBevelBorder();        
        else return false ;
        //this.setBorder(border); 

        return true ;
      }
      
     /*---------------------------------*
      *  set the bean shadow gradient   *
      *---------------------------------*/
     else if (property == SetBeanGradientColors)
     {
       Color c1=null, c2=null;
       String s = value.toString().trim();
       String sCol1 =null, sCol2= null, sDir=null ;
       StringTokenizer st = new StringTokenizer(s,",");

       if (st.hasMoreTokens())
       {
         sCol1 = st.nextToken() ;
         c1 = ik.makeColor(sCol1) ;
       }
       else return false ;
       if (st.hasMoreTokens()) 
       {
         sCol2 = st.nextToken() ;
         c2 = ik.makeColor(sCol2) ;
       }
       else return false ;
       if (st.hasMoreTokens())
       {
         sDir = st.nextToken() ;
         if(sDir.equalsIgnoreCase("LeftToRight")) iDirection = LeftToRight ;
         else if(sDir.equalsIgnoreCase("UpToDown")) iDirection = UpToDown ;
         else if(sDir.equalsIgnoreCase("LeftUpToRightDown")) iDirection = LeftUpToRightDown ;
         else if(sDir.equalsIgnoreCase("LeftDownToRightUp")) iDirection = LeftDownToRightUp ;       
       }
       cGradientStart = c1 ;
       cGradientStop  = c2 ;

       return true;
     }         
   
      // set the bean background color
      if(property == setBeanColor)
      {
        String s = (String)value ;
        cBeanColor = ik.makeColor(s) ;
        return true ;
      }
      
      // set the selected icon color
      if(property == setIconSelectedColor)
      {
        String s = (String)value ;
        setIconSelectedColor(s) ;
        return true ;
      }
      
      // erase images
      if(property == ClearImages)
      {
        //String s = (String)value ;
        list_images.clear();
        iLoadedImages = 0 ;
        iImageDisplayed = 0 ;
        iCurrentImage = 0 ;
        this.repaint();
        return true ;
      }      
      
      // refresh screen
      if(property == refreshScreen)
      {
        this.repaint();
        return true ;
      }      
      // set the log
      if(property == setLog)
      {
        String s = (String)value ;
        if(s.equalsIgnoreCase("true")) bLog = true ;
        else bLog = false ;
        return true ;
      }      
      
      else
      {
       return super.setProperty(property, value);
      }      
    } 
    
    //----------------      i n t e r n a l   f u n c t i o n s  -----------------------
    // read an image from file 
    void readImageFile( String s_image_path, String s_command, String s_tooltip )
    {
          //log("readImageFile() "+s_image_path);
          Image img = ik.loadImage( s_image_path ) ;
          if(img != null)
          {
            addImageList(img, s_command, s_tooltip);
            iLoadedImages++;
          }  
    }
    
    // read image from database
    //
    // the image is received as succeeding chunks
    //
    void readImageBase( String sImage, String s_command, String s_tooltip )
    {
          if( ! sImage.equalsIgnoreCase("[END_IMAGE]"))
          {
            sbImage.append(sImage) ;
          }
          else
          {
            // BASE64Decoder decoder = new BASE64Decoder(); // MLT-7702
            try{
              // byte[] decodedStr = decoder.decodeBuffer(sbImage.toString()); // MLT-7702
              byte[] decodedStr =  Base64.getDecoder().decode(sbImage.toString());
              ImageIcon ii = new ImageIcon(decodedStr);
              Image img = ii.getImage() ;
              if(img != null) 
              {
                addImageList(img, s_command, s_tooltip);
                iLoadedImages++;
              }  
            } catch(Exception e){;}
            finally{ sbImage = new StringBuffer(); }
          }    
    }
    
    // set the image
    void addImageList( Image p_image, String s_command, String s_tooltip )
    {
      if( p_image != null )
      {
        // create the iconic image
        ImageIcon ii = new ImageIcon(p_image.getScaledInstance(iIconWidth, iIconHeight, Image.SCALE_SMOOTH));

        // add image + icon to the list
        ImageObject imgobj = new ImageObject(p_image, ii.getImage(), s_command, s_tooltip);
        list_images.add(imgobj);
      }
      //this.repaint();
    }
    
    // set the number of icons to display
    void setNumberIcons( int iNbre )
    {
      if(iNbre >= 2)
      {
        iMaxImages = iNbre ;
        iMaxImagesDrawn = iNbre ;
      }  
    }
    
    // set the panel size
    void setNewSize(int iWidth, int iHeight)
    {
      log("setNewSize()"+iWidth+"x"+iHeight);
      jp.setSize(iWidth, iHeight);  
      jsp.setSize(iWidth, iHeight);  
    }
    
    // set the parent JScrollPane
    void setJFrame()
    {
      iCanvasWidth  = this.getWidth();
      iCanvasHeight = this.getHeight();
      rectBig = new Rectangle(this.getSize());
      cBeanColor = this.getParent().getBackground();
      log("canvas: "+iCanvasWidth+"x"+iCanvasHeight);
    }
    
    // set the parent JScrollPane
    void setScrollPane(JScrollPane _jsp)
    {
      jsp = _jsp ;  
      log("jsp x="+jsp.getLocation()+ "  width="+jsp.getSize());
    }
    
    // show the frame
    void showFrame(boolean b)
    {
      setPanelLocation();
      jp.setVisible(true);
      jsp.setVisible(true);
    }
    
    // set the orientation
    void setOrientation(int iOrient)
    {
       log("setOrientation()");
       if(iOrient >= 1 && iOrient <= 4)
       {
         iOrientation = iOrient ;
       }  
    }
    
    // set the icon dimensions
    void setIconDimension( int iWidth, int iHeight )
    {
      log("setIconDimension()");
      if(iWidth > 10 && iHeight > 10)
      {
        iIconWidth  = iWidth ;
        iIconHeight = iHeight ;
        if(iOrientation == iNORTH || iOrientation == iSOUTH) 
           setNewSize(6 + (iMaxImages * iIconWidth) + (iMaxImages * 5),iIconHeight + 14);
        else 
           setNewSize(iIconWidth + 14,6 + (iMaxImages * iIconHeight) + (iMaxImages * 5));
      }  
    }
    
    // set the main image dimension
    void setImageDimension(int iWidth, int iHeight )
    {
       if(iWidth > 40 && iHeight > 40)  
       {
          iImgMaxWidth  = iWidth ;
          iImgMaxHeight = iHeight ;
       } 
    }
    
    // set the background color
    void setBGColor( Color p_color )
    {
      colorBG = p_color ;
    }
    
    // set the frame width
    void setFrameWidth( int iWidth )
    {
       if(iWidth > -1 && iWidth < 10) iFrameWidth = iWidth ;
    }
    
    // set the frame color
    void setFrameColor( String sColor )
    {
      cFrameColor = ik.makeColor(sColor);
    }
    
    // set the icon selected frame color
    void setIconSelectedColor( String sColor )
    {
      cIconSelected = ik.makeColor(sColor);
    }
    
    
    // set the thumbnail location
    void setPanelLocation()
    {
      int iX=0, iY=0 ;
      Image img = null ;
      
      switch(iOrientation)
      {
         case iNORTH: iX = (int)((iCanvasWidth / 2)-(jsp.getSize().width / 2)); 
                      iY = 10;
                      break ;
         case iSOUTH: iX = (int)((iCanvasWidth / 2)-(jsp.getSize().width / 2));
                      iY = (int)(iCanvasHeight - jsp.getSize().height - 10); 
                      break ;
         case iWEST:  iX = 10;
                      iY = (int)((iCanvasHeight / 2)-(jsp.getSize().height / 2 ));
                      break ;
         case iEST:   iX = (int)(iCanvasWidth - jsp.getSize().width - 10) ;
                      iY = (int)((iCanvasHeight / 2)-(jsp.getSize().height / 2 ));
                      break ;        
      }
      log("setPanelLocation()  iX="+iX+"  iY="+iY);
      jp.setLocation(iX,iY);
      jsp.setLocation(iX,iY);
      
      // buttons Next - Previous
      jbNext = new JButton();
      jbNext.setBorder(null);
      jbNext.setBackground(cButtonColor);
      jbNext.setVisible(true);     
      jbNext.setToolTipText("<HTML>Next images</HTML>");      
      jbPrec = new JButton();
      jbPrec.setBorder(null);
      jbPrec.setBackground(cButtonColor);
      jbPrec.setVisible(true);
      jbPrec.setToolTipText("<HTML>Previous images</HTML>");      
      if(iOrientation == iNORTH || iOrientation == iSOUTH)
      {
        img = ik.loadImage("/prev_h.png");
        if(img != null) jbPrec.setIcon(new ImageIcon(img));
        img = ik.loadImage("/next_h.png");
        if(img != null) jbNext.setIcon(new ImageIcon(img));        
        jbPrec.setSize(new Dimension(20,jsp.getSize().height));
        jbPrec.setLocation(iX-20,iY);
        jbNext.setSize(new Dimension(20,jsp.getSize().height));
        jbNext.setLocation(iX+jsp.getSize().width,iY);
      }
      else
      {
        img = ik.loadImage("/prev_v.png");
        if(img != null) jbPrec.setIcon(new ImageIcon(img));
        img = ik.loadImage("/next_v.png");
        if(img != null) jbNext.setIcon(new ImageIcon(img));        
        jbPrec.setSize(new Dimension(jsp.getSize().width,20));
        jbPrec.setLocation(iX,iY-20);
        jbNext.setSize(new Dimension(jsp.getSize().width,20));
        jbNext.setLocation(iX,iY+jsp.getSize().height);
      }
      jbPrec.addActionListener(this);
      jbPrec.setActionCommand("PREV");
      jbNext.addActionListener(this);
      jbNext.setActionCommand("NEXT");
      this.add(jbNext);
      this.add(jbPrec);
      for(int c=0; c<iMaxImages;c++)
      {
        labels[c] = new JButton();
        labels[c].setOpaque(false);
        labels[c].setBackground(null);
        labels[c].setSize(iIconWidth,iIconHeight);
        labels[c].addActionListener(this);
        jp.add(labels[c],0);
      }
    }
    
    // get the image width
    int getImageWidth()
    {
      return iImageWidth ;
    }  
    
    // get the image height
    int getImageHeight()
    {
      return iImageHeight ;
    }    
    

    /*-------------------------*
     *   draw the main image
     *-------------------------*/
    public void paint(Graphics g) {
      
      if( ! bPaint ) return ;
      if(iCanvasWidth == 0)
      {
        bPaint = false ;
        setJFrame();
        bPaint = true ;
        setPanelLocation();
      }
      if(jsp.getSize().width == 0) return ;

      int iX1 = (int)this.getBounds().getX() ;
      int iY1 = (int)this.getBounds().getY() ;
      int iW1 = (int)this.getBounds().getWidth() ;
      int iH1 = (int)this.getBounds().getHeight() ;
           
      Graphics2D g2 = (Graphics2D) g ;
      if( cBeanColor != null )
        {
           g2.setBackground(cBeanColor);
        }  
       // clear
       g2.clearRect(this.getLocation().x,this.getLocation().y,this.getSize().width,this.getSize().height);      
       int x1=0,y1=0,w=0,h=0;
       GradientPaint gp = null ;
       
       // any gradient background ?
       if(cGradientStart != null && cGradientStop != null)
       {
         if(iDirection == LeftToRight)
         {
           x1 = 0; y1 = 0; w = iW1 ; h = 0 ;
         }
         else if(iDirection == UpToDown)
         {
           x1 = 0; y1 = 0; w = 0 ; h = iH1 ;
         }             
         else if(iDirection == LeftUpToRightDown)
         {
           x1 = 0; y1 = 0; w = iW1 ; h = iH1 ;
         }                          
         else if(iDirection == LeftDownToRightUp)
         {
           x1 = 0; y1 = iH1; w = iW1 ; h = 0 ;
         }                          

         g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1.0f));

         // create the gradient
         gp = null ;
         int iHcycle=0, iVcycle=0;
         if(iHcycle+iVcycle == 0)
         {
           gp = new GradientPaint(x1,y1,cGradientStart,w,h,cGradientStop);
         }
         else
         {
           gp = new GradientPaint(0,0,cGradientStart,iHcycle,iVcycle,cGradientStop,true);
         }
         g2.setPaint(gp);
         // fill the canevas
         g2.fill(new RoundRectangle2D.Double(0,0,iW1,iH1,5,5)) ;
         g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1.0f));
       }      

      int iX = 5, iY = 5 ;

      if(! bFound)
      {
        // add mouseListener on Canvas
        this.addMouseListener(new MouseListener(){
              public void mouseClicked(MouseEvent e) {
                // big image ?
                if(rectBig.contains(e.getPoint()))
                {
                   ImageObject imgobj = (ImageObject) list_images.get(iClickedImage);
                   log("Main Image clicked:"+iClickedImage);
                   if(imgobj != null)
                   {
                       // send command back to the Forms Bean Area
                       SendMessage(imgobj.sCommand);
                       log("  command:"+imgobj.sCommand);
                   }  
                }  
              }
              public void mouseEntered(MouseEvent e) {}
              public void mouseExited(MouseEvent e) {}
              public void mousePressed(MouseEvent e) {}
              public void mouseReleased(MouseEvent e) {}
        });                    
        bFound = true ;
      }
      
      //log("maximum images to draw:"+iMaxImagesDrawn);
      int iStop = (iImgStart + (iMaxImagesDrawn-1)) < (list_images.size()-1) ? iImgStart + (iMaxImagesDrawn-1) : list_images.size()-1 ;
      
      // draw image
      int j=0, x=0, y=0;
      int iDec = 0;
      int iWidth = 0, iHeight = 0 ;
      for(int i = iImgStart; i <= iStop; i++)
      {
        
        ImageObject imgobj = (ImageObject) list_images.get(i) ;
        if( imgobj != null && imgobj.icon != null )
        {
          // draw frame around selected icon
          if(j==iCurrentImage)
          {
            // draw main image
            iWidth  = imgobj.img.getWidth(this) ;
            iHeight = imgobj.img.getHeight(this) ;
            sCommand = imgobj.sCommand ;
            sTooltip = imgobj.sTooltip ;
            iClickedImage = i ;
        
            if((iWidth > iImgMaxWidth) &&
              (iWidth > iImgMaxWidth))
            {
              iWidth  = iImgMaxWidth ;
              iHeight = iImgMaxHeight ;
            }
            else if(iWidth > iImgMaxWidth)
            {
              iWidth  = iImgMaxWidth ;
            }
            else if(iHeight > iImgMaxHeight)
            {
              iHeight = iImgMaxHeight ;
            }

            switch (iOrientation)
            {
              case iNORTH: iDec = jsp.getLocation().y + jp.getSize().height + iImageShift ; break ;
              case iSOUTH: iDec = jsp.getLocation().y - iHeight - iImageShift ; 
                           if(bMirror) iDec -= (int)(iHeight / 2);  break ;
              case iWEST:  iDec = jsp.getLocation().x + jp.getSize().width + iImageShift ; break ;
              case iEST:   iDec = jsp.getLocation().x - jp.getSize().width - iWidth - iImageShift ; break ;
            }

            // draw image

            g2.setColor(cFrameColor);
            if(iFrameWidth > 0) g2.setStroke(new BasicStroke(iFrameWidth));
            if(iOrientation == iNORTH || iOrientation == iSOUTH)
            {
              x = (int)((jsp.getLocation().x + jsp.getWidth() / 2) - (iWidth / 2) );
              if(iFrameWidth > 0)
              {
                g2.drawRect(x - iFrameWidth,
                            iDec - iFrameWidth,
                            iWidth + (iFrameWidth * 2),
                            iHeight + (iFrameWidth * 2) );
              }
              //log("** Draw main image **  "+x+","+iDec+","+iWidth+","+iHeight);
              if(bMirror)
              {
                ImageReflexion irflx = new ImageReflexion();
                Image image = irflx.createReflection(irflx.buildBufferedImage(imgobj.img)) ;
                g2.drawImage(image, x, iDec, iWidth, iHeight * 2, this);
              }
              else
              {
                g2.drawImage(imgobj.img, 
                             x, 
                             iDec,
                             iWidth, iHeight, this); 
              }
              rectBig = new Rectangle(x,iDec,iWidth,iHeight);
            }
            else
            {
              y = (int)((jsp.getLocation().y + (jsp.getHeight() / 2)) - (iHeight / 2) );
              if(iFrameWidth > 0)
              {
                g2.drawRect(iDec - iFrameWidth,
                            y - iFrameWidth,
                            iWidth + (iFrameWidth * 2),
                            iHeight + (iFrameWidth * 2) );
              }
              //log("** Draw main image **  "+iDec+","+y+","+iWidth+","+iHeight);
              if(bMirror)
              {
                 ImageReflexion irflx = new ImageReflexion();
                 Image image = irflx.createReflection(irflx.buildBufferedImage(imgobj.img)) ;
                 g2.drawImage(image, iDec, y, iWidth, iHeight * 2, this);
              }              
              else
              {
                 g2.drawImage(imgobj.img, 
                              iDec, 
                              y ,
                             iWidth, iHeight, this); 
              }
              rectBig = new Rectangle(x,iDec,iWidth,iHeight);
            }            
            g2.dispose();
          }
        }  
        j++;
      }
      g2.dispose();

      jp.repaint();
      jsp.repaint();
      jbPrec.repaint();
      jbNext.repaint();
    }  

    
  /*------------------------------------*
   *  object to store an image object
   *------------------------------------*/
  class ImageObject extends Object
  {
      String  sName = "" ;
      String  sCommand = "" ;
      String  sTooltip = "" ;
      Image   img = null ;
      Image   icon = null ;

      ImageObject( Image p_img, Image p_icon, String p_command, String p_tooltip )
      {
        this.img      = p_img ;
        this.icon     = p_icon ;
        this.sCommand = p_command ;
        this.sTooltip = p_tooltip ;
      }      
  }
  

  public void log( String sMessage )
  {
    if( bLog) System.out.println( "L&F ImageViewer : " + sMessage ) ;
  }   
  
    public void componentHidden(ComponentEvent e) {
        //log("componentHidden()"+e.getComponent().getClass().getName() + " --- Hidden");
        this.repaint();
    }

    public void componentMoved(ComponentEvent e) {
        //log("componentMoved()"+e.getComponent().getClass().getName() + " --- Moved");
        this.repaint();
    }

    public void componentResized(ComponentEvent e) {
        //log("componentResized()"+e.getComponent().getClass().getName() + " --- Resized "); 
        this.repaint();
    }

    public void componentShown(ComponentEvent e) {
        //log("componentShown()"+e.getComponent().getClass().getName() + " --- Shown");
        this.repaint();

    }

    // manage buttons Next / Previous
    public void actionPerformed(ActionEvent e) {
        log( "Button pressed="+e.getActionCommand()) ;
        // PREV button clicked
        if(e.getActionCommand().equalsIgnoreCase("PREV"))
        {
          if(iImgStart > 0) iImgStart--;
        }
        // NEXT button clicked
        else if(e.getActionCommand().equalsIgnoreCase("NEXT"))
        {
          if((iImgStart + (iMaxImagesDrawn-1)) < (list_images.size()-1)) iImgStart++ ;
        }
        // icon button clicked
        else
        {
            iCurrentImage = Integer.parseInt(e.getActionCommand());
            vb.repaint();
        }
        this.repaint();
        this.requestFocus();
    }    

  // send message back to Forms
  private void SendMessage(String sValue) 
  {
    try{
      CustomEvent ce = new CustomEvent(m_handler, VIEWER_MESSAGE);
      m_handler.setProperty( VIEWER_VALUE, sValue );
      dispatchCustomEvent(ce);  
    }
    catch (Exception e)
    {
      e.printStackTrace();
    }    
  }
      
    
    /*---------------------------------*
     *  class to show the icons panel
     *---------------------------------*/
    class ThumbNail extends JPanel
    {
         public ThumbNail()
         {
            super();           
         }
         
        public void paint(Graphics g) {

          Graphics2D g2 = (Graphics2D) g ;
          g2.setBackground(cPanelColor);
          g2.clearRect(0, 0, this.getSize().width,this.getSize().height);
          
          // draw image
          int j=0, x=0, y=0;
          int iDec = 0;
          int iWidth = 0, iHeight = 0 ;
          int iX = 5, iY = 5 ;
          
          //log("maximum images to draw:"+iMaxImagesDrawn);
          int iStop = (iImgStart + (iMaxImagesDrawn-1)) < (list_images.size()-1) ? iImgStart + (iMaxImagesDrawn-1) : list_images.size()-1 ;
          if(iImgStart == 0) jbPrec.setEnabled(false); else jbPrec.setEnabled(true);
          if(iStop == list_images.size()-1) jbNext.setEnabled(false); else jbNext.setEnabled(true);
          log("start:"+iImgStart+"  stop:"+iStop+"  current:"+iCurrentImage);
          
          for(int i = iImgStart; i <= iStop; i++)
          {
            //log("drawing image:"+i);
            if(j==iCurrentImage)
            {
              g2.setColor(cIconSelected);
              if(iOrientation == iNORTH || iOrientation == iSOUTH)
                g2.fillRect(iX-2,3,iIconWidth+4, iIconHeight+4);
              else
                g2.fillRect(3,iY-2,iIconWidth+4, iIconHeight+4);
            }
            ImageObject imgobj = (ImageObject) list_images.get(i) ;
            if( imgobj != null && imgobj.icon != null )
            {
              // set the tooltip buton properties
              labels[j].setToolTipText(imgobj.sTooltip);
              labels[j].setActionCommand(""+j);
              // draw icons
              if(iOrientation == iNORTH || iOrientation == iSOUTH)
              {
                g2.drawImage(imgobj.icon, iX, iY, this); 
                rect[j] = new Rectangle(iX,iY,iIconWidth,iIconHeight);
                labels[j].setLocation(iX,iY);
                iX += (iIconWidth + 5) ;
              }  
              else
              {
                g2.drawImage(imgobj.icon, iX, iY, this); 
                rect[j] = new Rectangle(iX,iY,iIconWidth,iIconHeight);
                labels[j].setLocation(iX,iY);
                iY += (iIconHeight + 5) ;
              }            
            }  
            j++;
          }          
          g2.dispose();
          if(jbPrec != null) jbPrec.repaint();
          if(jbNext != null) jbNext.repaint();          
        } 
        
    }

      public void keyTyped(KeyEvent e) {}
      public void keyReleased(KeyEvent e) {}
      public void keyPressed(KeyEvent e) {
         int iKey = e.getKeyCode() ;
         log("KeyPressed:"+iKey);
         // first image
         if(iKey == e.VK_HOME)   
         {
           iImgStart = 0 ;
           iCurrentImage = 0 ;
           iImageDisplayed = 0 ;
           vb.repaint();
         }  
         // last image
         else if(iKey == e.VK_END)
         {
           if(list_images.size() >= iMaxImagesDrawn) 
           {
             iImgStart = list_images.size() - iMaxImagesDrawn ;
             iCurrentImage = iMaxImagesDrawn-1 ;
           }  
           else {
             iImgStart = 0 ;
             iCurrentImage = list_images.size()-1 ;
           }
           iImageDisplayed = iLoadedImages-1 ;
           vb.repaint();
         }  
         // next image
         else if(iKey == e.VK_RIGHT) 
         {
           if(iImageDisplayed < (iLoadedImages-1))
           {

              iImageDisplayed++ ;
              iCurrentImage++;
              if(iCurrentImage > (iMaxImagesDrawn-1)) {
                 iImgStart++ ;  
                 iCurrentImage-- ;
              }
              vb.repaint();
           }
         }  
         // previous image
         else if(iKey == e.VK_LEFT)  
         {
           if(iCurrentImage >0 )
           {
             iCurrentImage--;
             iImageDisplayed--;
           }
           else {
              if(iImgStart > 0)
              {
                iImgStart-- ; 
                iImageDisplayed-- ;
              } 
           }
           vb.repaint();           
         }  
         // sent other keys back to Forms
         else {
             try
              {
                m_handler.setProperty(KEY_EVENT, e);
              }
              catch ( Exception ex ){ System.out.println("L&F ImageViewer : Unable to send key to Forms");}                
         }
         
         vb.requestFocus(); 
         vb.requestFocusInWindow();
      }        
  
  }

