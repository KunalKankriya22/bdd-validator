package oracle.forms.fd;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.GraphicsConfiguration;
import java.awt.GraphicsDevice;
import java.awt.GraphicsEnvironment;
import java.awt.HeadlessException;
import java.awt.Image;
import java.awt.Transparency;
import java.awt.image.BufferedImage;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.net.URL;

import java.util.StringTokenizer;
import java.util.regex.Pattern;

import javax.imageio.ImageIO;

import javax.swing.ImageIcon;


public class ImageKit 
{
  
  private URL       m_codeBase;
  private static    ImageKit instance;
  private static final String HEX_PATTERN = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$";
  protected boolean bLog = true ;

  public ImageKit()
  {
  }

      public static synchronized ImageKit getInstance() {
          if (instance == null) {
                instance = new ImageKit();
          }
          return instance;
     }
      
      protected void setLog(boolean b){
          bLog = b ;
      }
  
    /*--------------------------------------------------------------*
     *  Load an image from JAR file, Client machine or Internet URL 
     *--------------------------------------------------------------*/
    public Image loadImage(String p_imageName)
    {
      URL imageURL = null;
      boolean loadSuccess = false;
      Image img = null ;
      String imageName = p_imageName ;
      imageName = p_imageName ;

      //JAR
      if( p_imageName.toLowerCase().startsWith("/")
       && (!p_imageName.toLowerCase().startsWith("/forms/"))) {
          imageURL = getClass().getResource(imageName);
          if (imageURL != null)
          {
            try
            {
              //img = Toolkit.getDefaultToolkit().getImage(imageURL);
              img = ImageIO.read(imageURL);
              loadSuccess = true;
              return img ;
            }
            catch (Exception ilex)
            {
            }
          }
          else{
          }
      }

      //DOCBASE
      if (loadSuccess == false)
      {
        try
        {
         if (
              (p_imageName.toLowerCase().startsWith("a:"))
            ||(p_imageName.toLowerCase().startsWith("b:"))         
            ||(p_imageName.toLowerCase().startsWith("c:"))         
            ||(p_imageName.toLowerCase().startsWith("d:"))                  
            ||(p_imageName.toLowerCase().startsWith("e:"))         
            ||(p_imageName.toLowerCase().startsWith("f:"))         
            ||(p_imageName.toLowerCase().startsWith("g:"))
            ||(p_imageName.toLowerCase().startsWith("h:"))         
            ||(p_imageName.toLowerCase().startsWith("i:"))         
            ||(p_imageName.toLowerCase().startsWith("j:"))                  
            ||(p_imageName.toLowerCase().startsWith("k:"))         
            ||(p_imageName.toLowerCase().startsWith("l:"))         
            ||(p_imageName.toLowerCase().startsWith("m:"))
            ||(p_imageName.toLowerCase().startsWith("n:"))         
            ||(p_imageName.toLowerCase().startsWith("o:"))         
            ||(p_imageName.toLowerCase().startsWith("p:"))                  
            ||(p_imageName.toLowerCase().startsWith("q:"))         
            ||(p_imageName.toLowerCase().startsWith("r:"))         
            ||(p_imageName.toLowerCase().startsWith("s:"))
            ||(p_imageName.toLowerCase().startsWith("t:"))         
            ||(p_imageName.toLowerCase().startsWith("u:"))         
            ||(p_imageName.toLowerCase().startsWith("v:"))                  
            ||(p_imageName.toLowerCase().startsWith("w:"))         
            ||(p_imageName.toLowerCase().startsWith("x:"))         
            ||(p_imageName.toLowerCase().startsWith("y:"))
            ||(p_imageName.toLowerCase().startsWith("z:"))         
         ){
           p_imageName = "file:///" + p_imageName;
         }
             
         if (p_imageName.toLowerCase().startsWith("http://")
          || p_imageName.toLowerCase().startsWith("https://")){
            imageURL = new URL(p_imageName);
          }
          else if(p_imageName.toLowerCase().startsWith("file:"))
          {
            //imageURL = new URL("file:///" + p_imageName);
            imageURL = new URL(p_imageName);
          }
          else if(p_imageName.toLowerCase().startsWith("/forms/"))
          {
            imageURL = new URL(DrawLAF.sDocBase + p_imageName);
          }         
//          else
//          {
//            imageURL = new URL(m_codeBase.getProtocol() + "://" +m_codeBase.getHost() + ":" + m_codeBase.getPort() + p_imageName);
//          }
          try
          {
            if(imageURL != null)
            {
              //img = Toolkit.getDefaultToolkit().getImage(imageURL);
              img = ImageIO.read(imageURL);
              if(img.getWidth(null) == -1) return null ;
              loadSuccess = true;
              return img ;
            }
          }
          catch (Exception ilex)
          {
          }

        }
        catch (java.net.MalformedURLException urlex)
        {
          log("!!! LAF ImageKit() Error creating URL - " + urlex.toString());
        }
      }

      //CODEBASE
      if (loadSuccess == false)
      {
        try
        {
          imageURL = new URL(m_codeBase, imageName);
          try
          {
            img = ImageIO.read(imageURL);
            loadSuccess = true;
            return img ;
          }
          catch (Exception ilex)
          {
             log("!!! LAF ImageKit() Error reading image - " + ilex.toString());
          }
        }
        catch (java.net.MalformedURLException urlex)
        {
          log("Error creating URL - " + urlex.toString());
        }
      }

      if (loadSuccess == false)
      {
        log("!!! LAF ImageKit() Error image " + imageName + " could not be located");
      }
      return img ;
    }

    /*-------------------------------*
     * method to transform an image
     * to a byte[] array
     *-------------------------------*/
    public byte[] imageIconToByteArray(ImageIcon icon) {

    BufferedImage bi=new BufferedImage(icon.getIconWidth(),
    icon.getIconHeight(), BufferedImage.TYPE_INT_RGB);

    Graphics g = bi.createGraphics();

    g.drawImage(icon.getImage(), 0, 0, null);
    g.dispose();

    ByteArrayOutputStream stream = new ByteArrayOutputStream();
    try {
      ImageIO.write(bi, "jpeg", stream);
    } catch (IOException ex1) {;}

    return stream.toByteArray();

    } 
    
    // This method returns a buffered image with the contents of an image
    public static BufferedImage toBufferedImage(Image image) {
        if (image instanceof BufferedImage) {
            return (BufferedImage)image;
        }
    
        // This code ensures that all the pixels in the image are loaded
        image = new ImageIcon(image).getImage();
    
        // Determine if the image has transparent pixels; for this method's
        // implementation, see Determining If an Image Has Transparent Pixels
        //boolean hasAlpha = hasAlpha(image);
    
        // Create a buffered image with a format that's compatible with the screen
        BufferedImage bimage = null;
        GraphicsEnvironment ge = GraphicsEnvironment.getLocalGraphicsEnvironment();
        try {
            // Determine the type of transparency of the new buffered image
            int transparency = Transparency.OPAQUE;
//            if (hasAlpha) {
//                transparency = Transparency.BITMASK;
//            }
    
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
//            if (hasAlpha) {
//                type = BufferedImage.TYPE_INT_ARGB;
//            }
            bimage = new BufferedImage(image.getWidth(null), image.getHeight(null), type);
        }
    
        // Copy image to buffered image
        Graphics g = bimage.createGraphics();
    
        // Paint the image onto the buffered image
        g.drawImage(image, 0, 0, null);
        g.dispose();
    
        return bimage;
    }
    
    
  /*----------------------------------------*
   *  Make a color from a RGB string
   *  Color c = makeColor( "r128g25b100" ); 
   *----------------------------------------*/
  public Color makeColor(String s)
  {
    int r=-1, g=-1, b=-1 ;
    String sR = "255", sG = "255", sB = "255" ;
    int iR=255, iG=255, iB=255 ;
    Color c = Color.white ;
    if(s.startsWith("#")) {
        boolean bool = Pattern.matches(HEX_PATTERN, s);
        if (bool) {
            // get the hexa color
            sR = s.replaceFirst("#","");
            if(sR.length()==3) sR += sR ;
            try
            {
              int intValue = Integer.parseInt( sR,16);
              c = new Color( intValue );
            }
            catch (Exception e){ }
        }        
    }
    else {
        r = s.indexOf("r") ;
        g = s.indexOf("g") ;
        b = s.indexOf("b") ;
        if( r>-1 && g>-1 && b>-1 ){
          iR = Integer.parseInt(s.substring(r+1,g)) ;
          iG = Integer.parseInt(s.substring(g+1,b)) ;
          iB = Integer.parseInt(s.substring(b+1)) ;
          try{
            c = new Color(iR,iG,iB) ;
          }
          catch( Exception e) {} ;
        }
        else{
            r = -1;
            g = -1;
            b = -1;
            StringTokenizer st = new StringTokenizer(s, ",");
            try{
                r = Integer.parseInt(st.nextToken());
                g = Integer.parseInt(st.nextToken());
                b = Integer.parseInt(st.nextToken());
                c = new Color(r, g, b);
            }
            catch(Exception e){}
        }
    }
    return c ;
  }

   protected Color getDarkColor(Color c, double f) {
           return new Color(Math.max((int)(c.getRed()  * f), 0),
                            Math.max((int)(c.getGreen()* f), 0),
                            Math.max((int)(c.getBlue() * f), 0),
                            c.getAlpha());
    }
   
    protected Color getBrightColor(Color c, double f) {
        int r = c.getRed();
        int g = c.getGreen();
        int b = c.getBlue();
        int alpha = c.getAlpha();

        int i = (int)(1.0/(1.0-f));
        if ( r == 0 && g == 0 && b == 0) {
            return new Color(i, i, i, alpha);
        }
        if ( r > 0 && r < i ) r = i;
        if ( g > 0 && g < i ) g = i;
        if ( b > 0 && b < i ) b = i;

        return new Color(Math.min((int)(r/f), 255),
                         Math.min((int)(g/f), 255),
                         Math.min((int)(b/f), 255),
                         alpha);
    }   
    
    protected void log (String s){
        if(bLog){
            System.out.println(s);
        }
    }
  
  
}