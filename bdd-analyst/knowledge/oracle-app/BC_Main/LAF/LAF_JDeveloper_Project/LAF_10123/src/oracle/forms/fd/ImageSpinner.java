package oracle.forms.fd;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Image;
import java.awt.Point;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.image.BufferedImage;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;

import java.util.ArrayList;
import java.util.List;

import javax.imageio.ImageIO;

import javax.swing.BorderFactory;
import javax.swing.Icon;
import javax.swing.ImageIcon;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JProgressBar;
import javax.swing.JScrollPane;
import javax.swing.JSpinner;
import javax.swing.JTextField;
import javax.swing.SpinnerListModel;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.border.Border;
import javax.swing.border.EtchedBorder;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;

// MLT-7702
//import sun.misc.BASE64Decoder;
//import sun.misc.BASE64Encoder;
import java.util.Base64;


/**
 * A component to show images in a JSpinner
 *
 * @author   Francois Degrelle
 * @version  1.3
 *
 */

public class ImageSpinner extends JPanel {

  JSpinner      spin = null ;
  JTextField    legend = new JTextField();
  int           iMaxImages = 0 ;
  Color         cPanel = Color.WHITE ;
  Color         cLegendFG = Color.BLACK ;
  Color         cLegendBG = Color.WHITE ;
  Color         cButtonColor = null ;
  Color         cCanvasColor = null ;
  String        sLegendPosition = "BOTTOM";
  String        sNewImageTitle = "New Images properties" ;
  String []     labels = null;
  String []     URLs = null;
  String [][]   result = null;
  JScrollPane   jsp = null;
  String        sScale = "none";
  String        sCurrent = "" ;
  String        sSpinName = "";
  Border        border = BorderFactory.createLineBorder(Color.black) ;
  Border        emptyborder = BorderFactory.createEmptyBorder() ;
  boolean       bTrsp = false ;
  boolean       bBorder = true ;
  boolean       bLegend = true ;
  boolean       bMustScale = false ;
  boolean       bImgMagnifier = false ;  
  boolean       bKeepImageSize = true ;
  int           iLegendAlign = JTextField.LEFT;
  int           iIndice = 0 ;
  int           iMaxWidth=2000, iMaxHeight=2000;
  int           iMaxImgWidth=0, iMaxImgHeight=0;
  int           iPanelWidth=0, iPanelHeight=0 ;
  int           iSpinWidth=0, iSpinHeight=0;
  int           iCurrentImageIndice = -1 ;
  int           iLegendHeight = 0 ;
  int           numBytesRead = 0;
  int           iImgStart=0, iImgEnd=0 ;
  int           ind=0;
  byte[]        bImage ;
  ImageKit      ik = new ImageKit() ;
  List          vImg = new ArrayList(10) ;
  List          vImgInit = new ArrayList(10) ;
  List          vImgProps = new ArrayList(10) ;
  List          list_msg = new ArrayList(10) ; 
  DrawLAF       dBean;  
  JPanel        jp;
  SpinnerListModel slm = new SpinnerListModel();
  StringBuffer  sbImage = new StringBuffer(); 
  JProgressBar  progressBar=null;
  InputStream   fis = null;
  BufferedImage bi = null;  
 
  /**
   * set the legend font
   */
  void setLegendFont(Font f){
    legend.setFont(f);
    if(bLegend) iLegendHeight = (int)legend.getPreferredSize().getHeight();
  }
  
  /**
   * set the new image table labels
   */
  void setLabels(String title,String name, String legend, String tooltip){
     if(title != null){
         sNewImageTitle = title;
         int nb = -1;
         if(name != null) nb++ ;
         if(legend != null) nb++;
         if(tooltip != null) nb++;
         if(nb>-1){
             labels = new String[nb+1];
             nb = 0;
             if(name != null) labels[nb++] = name ;
             if(legend != null) labels[nb++] = legend ;
             if(tooltip != null) labels[nb++] = tooltip ;         
         }
         else labels = null;
     }
     else labels = null;
  }
  
  /**
   * set the legend foreground color
   */
  void setLegendFGColor(Color c){
      cLegendFG = c ;
  }
  
  /**
   * keep/loose initial image size
   */  
  void setKeepImageSize(boolean b){
      bKeepImageSize = b ;
  }
  
  /**
   * set the legend colors
   */
  void setLegendColors(Color fg, Color bg){
      cLegendFG = fg ;
      cLegendBG = bg ;
  }  
  
  /**
   * set the legend background color
   */
  void setLegendBGColor(Color c){
      cLegendBG = c ;
  } 
  
  /**
   * switch the image magnifier feature on/off
   */
  void setImageMagnifier(boolean b){
      bImgMagnifier = b ;
  }   
  
  /**
   * show/hide the legend
   */
  void setLegend(boolean b){
    bLegend = b;
    if(b){
       if(!bLegend) {
         if(sLegendPosition.equalsIgnoreCase("bottom")) add(legend,BorderLayout.PAGE_END);    
         else add(legend,BorderLayout.PAGE_START); 
         iLegendHeight = (int)legend.getPreferredSize().getHeight();
         bLegend = true ;
       } 
    }
    else
    {
      remove(legend);
      bLegend = false ;
      iLegendHeight = 0 ;
    }
  }
  
  /**
   * set the spinner border type
   */
  void setBorderType(String sBorder, Color c, int iWidth){
    if(sBorder.equalsIgnoreCase("line")) {         
        if(c != null) {
          border = BorderFactory.createLineBorder(c,iWidth) ;
        }
        else {
          border = BorderFactory.createLineBorder(Color.black) ;
        }
    }    
    else if(sBorder.equalsIgnoreCase("raisedetched"))  
        border = BorderFactory.createEtchedBorder(EtchedBorder.RAISED) ;
    else if(sBorder.equalsIgnoreCase("loweredetched")) 
        border = BorderFactory.createEtchedBorder(EtchedBorder.LOWERED) ;
    else if(sBorder.equalsIgnoreCase("raisedbevel"))   
        border = BorderFactory.createRaisedBevelBorder() ;
    else if(sBorder.equalsIgnoreCase("loweredbevel"))  
        border = BorderFactory.createLoweredBevelBorder() ;
    else if(sBorder.equalsIgnoreCase("empty"))         
        border = BorderFactory.createEmptyBorder() ;      
    else if(sBorder.equalsIgnoreCase("null"))         
        border = null ;              
  }
  
  /**
   * set the legend horizontal position
   */
  void setLegendPosition(String s){
      if(s.equalsIgnoreCase("bottom")) sLegendPosition = "BOTTOM" ;
      else if(s.equalsIgnoreCase("top")) sLegendPosition = "TOP" ;
  }
  
  /**
   * set the legend alignment
   */
  void setLegendAlignment(String s){
      if(s.equalsIgnoreCase("left")) iLegendAlign = JTextField.LEFT ;
      else if(s.equalsIgnoreCase("center")) iLegendAlign = JTextField.CENTER ;
      else if(s.equalsIgnoreCase("right")) iLegendAlign = JTextField.RIGHT ;
  }
  
  /**
   * set the component background color
   */
  void setPanelBackground(Color c){
      if(c == null) bTrsp = true ;
      else{
          bTrsp = false;
          cPanel = c ;
          setBackground(cPanel);
      }
  }
  
  // current selected image name
  String getCurrentImageName(){
    return sCurrent ;
  }
  
  /**
   * add image from URL
   */
  void setImage(String name, String url, String legend, String tooltip){
      if(iIndice == 1){
        String s = (String)((objImage)vImgProps.get(0)).sName;
        if(s.equals("--blank--")){
            iIndice = 0;
            vImg = new ArrayList(10);
            vImgInit = new ArrayList(10);
            vImgProps = new ArrayList(10);
        }
      }  
      
      vImgProps.add(
             new objImage
             (
               iIndice,
               name,
               url,
               legend,
               tooltip,
               "new"
             )
         );
      iIndice++;  
  }
  
  /**
   * get image indice by name
   */
  int getImageIndice(String sImageName){
    String s = "";
    for(int i=0; i<vImg.size();i++){
       s = (String)((objImage)vImgProps.get(i)).sName;
       if(s.equalsIgnoreCase(sImageName)){
           return i ;
       }
    }
    return -1;
  }
  
  /**
   * get the new images list
   */
  String getNewImageList(){
    StringBuffer sb = new StringBuffer();
    String s="", st="", sLeg="", sTip="";
    int nb = 0 ;
    for(int i=0; i<vImgProps.size();i++){
       s    = (String)((objImage)vImgProps.get(i)).sName;
       st   = (String)((objImage)vImgProps.get(i)).sStatus;
       sLeg = (String)((objImage)vImgProps.get(i)).sLegend;
       sTip = (String)((objImage)vImgProps.get(i)).sToolTip;
       if(st.equalsIgnoreCase("new")){
           sb.append(nb>0 ? "~" : "").append(s).append("|").append(sLeg).append("|").append(sTip);
           nb++;
       }
    }
    return sb.toString();      
  }

  /**
   * add image given
   */
  void setImage(String name, ImageIcon ii, String legend, String tooltip){
      if(iIndice == 1){
        String s = (String)((objImage)vImgProps.get(0)).sName;
        if(s.equals("--blank--")){
            iIndice = 0;
            vImg = new ArrayList(10);
            vImgInit = new ArrayList(10);
            vImgProps = new ArrayList(10);
        }
      }  
      vImgProps.add(
             new objImage
             (
               iIndice,
               name,
               ii,
               legend,
               tooltip,
               "base"
             )
         );
      iIndice++;  
  }
  
  /**
   * spinner actualization
   */
  void refresh(boolean bResize){ 
    if(bLegend) iLegendHeight = (int)legend.getPreferredSize().getHeight();
    if(vImg.size()>0) slm.setList(vImg);
    iMaxImages = vImg.size();
    if(sScale.equalsIgnoreCase("LARGEST") && bMustScale && bResize){
        // have to scale images 
        int bX=0, bY=0;
        if(this.getBorder() != null){
          bX = this.getBorder().getBorderInsets(this).left + this.getBorder().getBorderInsets(this).right ;
          bY = this.getBorder().getBorderInsets(this).top + this.getBorder().getBorderInsets(this).bottom ;
        }        
        bMustScale = false ;
        ImageIcon ii = null ;
        for(int i=0; i<iMaxImages;i++){
          ii = ((ImageIcon)vImg.get(i)) ;
          if(ii.getIconWidth() > iMaxImgWidth){
            ii = new ImageIcon(ii.getImage().getScaledInstance(iMaxImgWidth, -1, Image.SCALE_SMOOTH));  
            ii.setDescription(""+i);
            vImg.set(i,ii);
          }
          if(ii.getIconHeight() > iMaxImgHeight){
            ii = new ImageIcon(ii.getImage().getScaledInstance(-1, iMaxImgHeight, Image.SCALE_SMOOTH));  
            ii.setDescription(""+i);
            vImg.set(i,ii);
          }          
        }
        iPanelWidth =  bX + 20 + iMaxImgWidth ;
        iPanelHeight = bY + iMaxImgHeight + iLegendHeight;
        iPanelWidth  = iPanelWidth <= iMaxWidth ? iPanelWidth : iMaxWidth ;
        iPanelHeight = iPanelHeight <= iMaxHeight ? iPanelHeight : iMaxHeight ;
        setSize(iPanelWidth,iPanelHeight);
    }
    jsp = new JScrollPane(new SpinEditor(spin));
    jsp.setBackground(null);
    jsp.getViewport().setBackground(null);
    spin.setEditor(jsp);
    this.setBorder(border);

    legend.setBorder(BorderFactory.createLineBorder(cLegendBG));
    legend.setEditable(false);
    legend.setHorizontalAlignment(iLegendAlign);
    legend.setForeground(cLegendFG);
    legend.setBackground(cLegendBG);
    
    // transparent
    if(bTrsp){
        this.setBackground(null);
        this.setOpaque(false);        
        spin.setBackground(null);
        spin.setOpaque(false);  
        spin.getComponent(0).setBackground(null);
        ((JComponent)spin.getComponent(0)).setBorder(BorderFactory.createEmptyBorder());
        spin.getComponent(1).setBackground(null);
        ((JComponent)spin.getComponent(1)).setBorder(BorderFactory.createEmptyBorder());
        legend.setBorder(null);
        legend.setBackground(null);
        legend.setForeground(cLegendFG);
        legend.setOpaque(false);                
    }
    else{
        this.setBackground(cPanel);
        spin.setBackground(cPanel);
        spin.setOpaque(true);  
        spin.getComponent(0).setBackground(cButtonColor);
        spin.getComponent(1).setBackground(cButtonColor);    
        ((JComponent)spin.getComponent(0)).setBorder(null);
        ((JComponent)spin.getComponent(1)).setBorder(null);
    } 
    spin.getComponent(1).setEnabled(false);
  }
  
  /**
   * clean the spinner
   */
  void clean(){
        iIndice = 0;
        vImg = new ArrayList(10);
        vImgInit = new ArrayList(10);
        vImgProps = new ArrayList(10);
        sCurrent = "" ;
        if (sScale.equals("LARGEST")) bMustScale = true ;
        else bMustScale = false ;
        iMaxImgWidth = iMaxImgHeight = 0 ;
        iCurrentImageIndice = -1;
        // add a dummy blank icon
        setImage("--blank--", "", "", "");
        legend.setText("");
        numBytesRead = 0;
        iImgStart = iImgEnd = 0 ;
        refresh(false);
    }
    
  ImageIcon getBlankImageIcon(){
        ImageIcon ii;
        Icon icon = new BlankIcon(cCanvasColor, 1);
        BufferedImage image = 
            new BufferedImage(icon.getIconWidth(), icon.getIconHeight(), 
                              BufferedImage.TYPE_INT_RGB);
        icon.paintIcon(null, image.getGraphics(), 0, 0);
        ii = new ImageIcon(image);
        return ii;
  }
  
  /**
   * set the panel size
   */
  void setPanelSize(int width, int height){
      iPanelWidth  =  width;
      iPanelHeight =  height;
      setSize(iPanelWidth,iPanelHeight);
  }
  
  /**
   * set the maximum panel size (for scale = LARGEST)
   */
  void setPanelMaxSize(int width, int height){
      iMaxWidth  = width;
      iMaxHeight = height;
  }

  /**
   * image scaling
   */
  void scaleImage(String s)
  {
    if(s.equalsIgnoreCase("FIT")) sScale = "FIT";
    else if(s.equalsIgnoreCase("FITALL")) sScale = "FITALL";
    else if(s.equalsIgnoreCase("LARGEST")) {
      sScale = "LARGEST";
      bMustScale = true ;
    }  
    else sScale = "none" ;
  }

  /**
   * default constructor
   */
  public ImageSpinner(String sName, DrawLAF laf, Color cColor) {
    try
    {
      UIManager.setLookAndFeel(UIManager.getCrossPlatformLookAndFeelClassName());
      SwingUtilities.updateComponentTreeUI(this);
    }
    catch (Exception ex) 
    {
      ex.printStackTrace();
    }    
    jp = this;
    sSpinName = sName ;
    dBean = laf;
    cLegendBG = cColor ;
    cCanvasColor = cColor ;
    setLayout(new BorderLayout());
    // add a dummy blank icon
    setImage("--blank--", "", "", "");
    spin = new JSpinner(slm);
    spin.setBorder(null);
    add(spin,BorderLayout.CENTER);
    if(bLegend){
        if(sLegendPosition.equalsIgnoreCase("bottom")) add(legend,BorderLayout.PAGE_END);    
        else add(legend,BorderLayout.PAGE_START);    
    }
    setVisible(true);
    refresh(false);
  }
  
  /**
   * get image from file
   */
  ImageIcon getImage(String sImage){
      ImageIcon ii = null ;
      Image img = null ;
      try {
          img = ik.loadImage(sImage);
      }
      catch (Exception e) {
          return null ;
      }
      if(img != null){
        ii = new ImageIcon(img);
        if(bKeepImageSize) vImgInit.add(ii);
        // scale required ?
        if(!sScale.equals("none")){
           int bX=0, bY=0;
           if(this.getBorder() != null){
             bX = this.getBorder().getBorderInsets(this).left + this.getBorder().getBorderInsets(this).right ;
             bY = this.getBorder().getBorderInsets(this).top + this.getBorder().getBorderInsets(this).bottom ;
           }
           int x = iPanelWidth - 20 - bX ;
           int y = iPanelHeight - iLegendHeight - bY ;

           if(sScale.equalsIgnoreCase("FIT")){
            if(ii.getIconWidth() > x) {
              ii = new ImageIcon(img.getScaledInstance(x, -1, Image.SCALE_SMOOTH));  
            }
            if(ii.getIconHeight() > y) {
              ii = new ImageIcon(ii.getImage().getScaledInstance(-1, y, Image.SCALE_SMOOTH));  
            }            
           }
           else if(sScale.equalsIgnoreCase("FITALL")){
            ii = new ImageIcon(img.getScaledInstance(x, y, Image.SCALE_SMOOTH));  
           }
           else if(sScale.equalsIgnoreCase("LARGEST")){
            int iMax = iMaxWidth - bX - 20 ;
            int yMax = iMaxHeight - bY - iLegendHeight ;
            if(!bKeepImageSize){
                if((ii.getIconWidth() > iMaxWidth) || (ii.getIconHeight() > iMaxHeight )){
                    if(ii.getIconWidth() > iMaxWidth) {
                      ii = new ImageIcon(img.getScaledInstance(iMaxWidth, -1, Image.SCALE_SMOOTH));  
                    }
                    if(ii.getIconHeight() > iMaxHeight) {
                      ii = new ImageIcon(ii.getImage().getScaledInstance(-1, iMaxHeight, Image.SCALE_SMOOTH));  
                    }                         
                }
            }
            //else {
                iMaxImgWidth = ii.getIconWidth() > iMaxImgWidth ? ii.getIconWidth() : iMaxImgWidth;
                if(iMaxImgWidth > iMax) iMaxImgWidth = iMax ;
                iMaxImgHeight = ii.getIconHeight() > iMaxImgHeight ? ii.getIconHeight() : iMaxImgHeight;
                if(iMaxImgHeight > yMax) iMaxImgHeight = yMax ; 
            //}
           }           
        }
      }
      //printMemory();
      return ii;
  }
  
   
    /**
     * read image from database
     * the image is received as succeeding chunks
     */
    void readImageBase( String sImage, String sImgName, String sLegend, String sTooltip )
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
              byte[] decodedStr =  Base64.getDecoder().decode(sbImage.toString()); // MLT-7702     
              ImageIcon ii = new ImageIcon(decodedStr);
              if(bKeepImageSize) vImgInit.add(ii);
              // scale required ?
              if(!sScale.equals("none")){
                 int bX=0, bY=0;
                 if(this.getBorder() != null){
                   bX = this.getBorder().getBorderInsets(this).left + this.getBorder().getBorderInsets(this).right ;
                   bY = this.getBorder().getBorderInsets(this).top + this.getBorder().getBorderInsets(this).bottom ;
                 }
                 int x = iSpinWidth > 1 ? iSpinWidth : iPanelWidth - 20 - bX ;
                 int y = iSpinHeight > 1 ? iSpinHeight : iPanelHeight - iLegendHeight - bY ;
      
                 if(sScale.equalsIgnoreCase("FIT")){
                  if(ii.getIconWidth() > x) {
                    ii = new ImageIcon(ii.getImage().getScaledInstance(x, -1, Image.SCALE_SMOOTH));  
                  }
                  if(ii.getIconHeight() > y) {
                    ii = new ImageIcon(ii.getImage().getScaledInstance(-1, y, Image.SCALE_SMOOTH));  
                  }            
                 }
                 else if(sScale.equalsIgnoreCase("FITALL")){
                  ii = new ImageIcon(ii.getImage().getScaledInstance(x, y, Image.SCALE_SMOOTH));  
                 }
                 else if(sScale.equalsIgnoreCase("LARGEST")){
                  int iMax = iMaxWidth - bX - 20 ;
                  int yMax = iMaxHeight - bY - iLegendHeight ;                             
                    if(!bKeepImageSize){
                        if((ii.getIconWidth() > iMaxWidth) || (ii.getIconHeight() > iMaxHeight )){
                            if(ii.getIconWidth() > iMaxWidth) {
                              ii = new ImageIcon(ii.getImage().getScaledInstance(iMaxWidth, -1, Image.SCALE_SMOOTH));  
                            }
                            if(ii.getIconHeight() > iMaxHeight) {
                              ii = new ImageIcon(ii.getImage().getScaledInstance(-1, iMaxHeight, Image.SCALE_SMOOTH));  
                            }                         
                        }
                    }
                    else {
                        iMaxImgWidth = ii.getIconWidth() > iMaxImgWidth ? ii.getIconWidth() : iMaxImgWidth;
                        if(iMaxImgWidth > iMax) iMaxImgWidth = iMax ;
                        iMaxImgHeight = ii.getIconHeight() > iMaxImgHeight ? ii.getIconHeight() : iMaxImgHeight;
                        if(iMaxImgHeight > yMax) iMaxImgHeight = yMax ; 
                    }
                 }                            
              }
              if(ii != null) 
              {
                setImage(sImgName, ii, sLegend, sTooltip);
              }  
            } catch(Exception e){;}
            finally{ sbImage = new StringBuffer(); }
          }    
          //printMemory();
    }

    /**
     * set the image to read bytes
     */
    void setImageToRead(String sName){
          int indice = getImageIndice(sName);
          if(indice > -1){
              ImageIcon ii = null;
              if(bKeepImageSize) ii = (ImageIcon)vImgInit.get(indice);
              else ii = (ImageIcon)vImg.get(indice);
              bImage = ik.imageIconToByteArray(ii);     
              bi=new BufferedImage(ii.getImage().getWidth(null),
                  ii.getImage().getHeight(null), BufferedImage.TYPE_INT_RGB);              
              numBytesRead = 0;
              iImgStart = iImgEnd = 0 ;
          }
    }
      
  //
  // returns the current image chunks
  //
    String getImageContent() {
        try {
            //BASE64Encoder encoder = new BASE64Encoder(); // MLT-7702
            if (numBytesRead < bImage.length) {
                if ((numBytesRead + 16384) < (bImage.length - 1)) {
                    iImgEnd = numBytesRead + 16384;
                } else
                    iImgEnd = bImage.length;
                byte[] buf = new byte[16384];
                int j = 0;
                for (int i = iImgStart; i < iImgEnd; i++) {
                    buf[j++] = bImage[i];
                }   
                iImgStart = iImgEnd;
                numBytesRead = iImgEnd;
                // return encoder.encodeBuffer(buf);
                return Base64.getEncoder().encodeToString(buf); // MLT-7702
            } else {
                iImgStart = iImgEnd = 0;
                numBytesRead = 0;
                return "";
            }
        } catch (Exception e) {
            System.out.println("getImageContent(): "+e.toString());
            e.printStackTrace();
        }
        return "";
    }

  /**
   *  mouse listener for new items
   * @return MouseListener
   */
  MouseListener ImageMouseListener() {
        MouseListener ml = new MouseListener(){
            public void mouseClicked(MouseEvent e) {
                    if(e.getClickCount() > 1) {
                      // open image full size
                      if(bImgMagnifier) displayFullSizeImage();
                    }
            }
            public void mouseEntered(MouseEvent e) {
            }
            public void mouseExited(MouseEvent e) {
            }
            public void mousePressed(MouseEvent e) {
            }
            public void mouseReleased(MouseEvent e) {
            }                 
        };
        return ml ;
  }

    /**
     * display image full size
     */
    void displayFullSizeImage() {
        if(iCurrentImageIndice > -1){
          Image img = null;
          if(bKeepImageSize) img = ((ImageIcon)vImgInit.get(iCurrentImageIndice)).getImage();
          else img = ((ImageIcon)vImg.get(iCurrentImageIndice)).getImage();
          String sLegend = (String)((objImage)vImgProps.get(iCurrentImageIndice)).sLegend;
          new DisplayImage(img,sLegend);
        }
    }
      
  void print(String s){
      System.out.println(s);
  }

 /**
  * JLabel to show the spinner content
  */
 class SpinEditor extends JLabel implements ChangeListener {

  JSpinner sp;
  Icon icon;
  String slabel = "" ;
  String stoolTip = "" ;
  int   indice=0;

  public SpinEditor(JSpinner s) {
    super((Icon)s.getValue(), CENTER);
    this.setOpaque(false);
    this.setBackground(null);
    icon = (Icon)s.getValue();
    sp = s;
    sp.addChangeListener(this);
    this.addMouseListener(ImageMouseListener());
    if(vImgProps.size()>0){
        try{
          indice = Integer.parseInt(((ImageIcon)sp.getValue()).getDescription());
          slabel = (String)((objImage)vImgProps.get(indice)).sLegend;
          stoolTip = (String)((objImage)vImgProps.get(indice)).sToolTip;
          if(stoolTip != null && !stoolTip.equals("")) this.setToolTipText(stoolTip);
          sCurrent = (String)((objImage)vImgProps.get(indice)).sName;
          legend.setText(slabel);
          iCurrentImageIndice = indice ;
          if(!sCurrent.equals("--blank--")) sendMessage( sSpinName, sCurrent );          
        }
        catch (Exception e){}
    }
    iSpinWidth  = (int)this.getPreferredSize().getWidth();
    iSpinHeight = (int)this.getPreferredSize().getHeight();
    // add a drag&drop listener
    new FileDrop(jp,new FileDrop.Listener() {
            public void filesDropped(java.io.File[] files, Point pt) {
                String [][] data = new String[100][];
                URLs = new String [100];
                ind = iIndice ;
                int inew = 0 ;
                int nb = 0 ;
                String sExt = null ;
                for (int i = 0; i < files.length; i++) {
                    File fx = files[i]; 
                    // directory given ?
                    if(fx.isDirectory()){
                        File folderfiles[] = fx.listFiles();
                        for(int k=0; k<folderfiles.length; k++){
                          try {
                                int dot = folderfiles[k].getName().toLowerCase().lastIndexOf(".");
                                sExt = folderfiles[k].getName().toLowerCase().substring(dot + 1);
                                if(sExt.equals("gif")||sExt.equals("jpeg")||sExt.equals("jpg")||sExt.equals("png")){
                                    data[nb] = new String [] {
                                                                folderfiles[k].getName().toString(),
                                                                "legend"+(ind+1),
                                                                "tooltip"+(ind+1)
                                                              };
                                    URLs[nb] = folderfiles[k].getCanonicalPath();
                                    ind++;
                                    inew++;
                                    nb++;
                                }
                                else {
                                    System.out.println("DrawLAF ImageSpinner ["+folderfiles[k].getCanonicalPath()+ "] is probably not an image the component can read");
                                }                              
                          }
                          catch (IOException e) {}
                        }
                    }
                    else {
                        try {
                            int dot = files[i].getName().toLowerCase().lastIndexOf(".");
                            sExt = files[i].getName().toLowerCase().substring(dot + 1);
                            if(sExt.equals("gif")||sExt.equals("jpeg")||sExt.equals("jpg")||sExt.equals("png")){
                                data[nb] = new String [] {
                                                            files[i].getName().toString(),
                                                            "legend"+(ind+1),
                                                            "tooltip"+(ind+1)
                                                          };
                                URLs[nb] = files[i].getCanonicalPath();
                                ind++;
                                inew++;
                                nb++;
                            }
                            else {
                                System.out.println("DrawLAF ImageSpinner ["+files[i].getCanonicalPath()+ "] is probably not an image the component can read");
                            }
                        } 
                        catch (java.io.IOException e) {}
                    }
                }
                // get user new image information
                if((inew > 0) && labels != null) {
                    String [][] d = new String[inew][];
                    String s1=null, s2=null;
                    for(int j=0; j<inew; j++){
                        d[j] = data[j];
                    }
                    int iHeight = 120 + (inew * 20);
                    iHeight = iHeight < 300 ? iHeight : 300 ;
                    result = DrawLAF.getInstance().DisplayTableDialog(
                            sNewImageTitle, 
                            labels,
                            d,
                            0,0, 
                            500,iHeight, 
                            "question"
                          );
                    // process the images
                    progressBar = new JProgressBar(0, result.length);
                    progressBar.setStringPainted(true);
                    progressBar.setSize(new Dimension(spin.getWidth()-30,20));
                    progressBar.setLocation(6,(int)((spin.getHeight()/2)-10));
                    Container ct = spin.getTopLevelAncestor();
                    spin.add(progressBar,0);
                    try {  
                      new Thread() 
                      {  
                        public void run() 
                        {                          

                            String s1=null, s2=null;
                            for(int i=0; i<result.length;i++){
                                if(result[i].length > 1) s1= result[i][1] ;
                                if(result[i].length > 2) s2= result[i][2] ;
                                progressBar.setValue(i+1);
                                setImage(result[i][0], URLs[i], s1, s2);
                            }
                            if(sScale.equalsIgnoreCase("LARGEST")) bMustScale = true ;
                            refresh(true);
                            // display last image added
                            spin.setValue((Icon)vImg.get(ind-1));  
                            spin.remove(progressBar);
                       }  
                     }.start(); 
                    } 
                    catch(Exception e) { e.printStackTrace(); }    
                }
                else {
                    for(int i=0; i<inew;i++){
                        setImage(data[i][0], URLs[i], null, null);
                    }                    
                    files = null ;
                    if(sScale.equalsIgnoreCase("LARGEST")) bMustScale = true ;
                    refresh(true);
                    // display last image added
                    spin.setValue((Icon)vImg.get(ind-1));                                    
                }
            }
        });
    
  }

  public void stateChanged(ChangeEvent ce) {
    icon = (Icon)sp.getValue();
    setIcon(icon);
    if(vImgProps.size()>0){
        try{
          indice = Integer.parseInt(((ImageIcon)sp.getValue()).getDescription());
          slabel = (String)((objImage)vImgProps.get(indice)).sLegend;
          stoolTip = (String)((objImage)vImgProps.get(indice)).sToolTip;
          this.setToolTipText(stoolTip);
          sCurrent = (String)((objImage)vImgProps.get(indice)).sName;
          legend.setText(slabel);
          iCurrentImageIndice = indice ;
          if(!sCurrent.equals("--blank--")) sendMessage( sSpinName, sCurrent );          
        }
        catch (Exception e){}
    }
    spin.getComponent(0).setEnabled(indice == vImgProps.size()-1 ? false : true);
    spin.getComponent(1).setEnabled(indice == 0 ? false : true);
    iSpinWidth  = (int)this.getPreferredSize().getWidth();
    iSpinHeight = (int)this.getPreferredSize().getHeight();
  }

  public JSpinner getSpinner() { return sp; }
  public Icon getIcon() { return icon; }
  
  // send a message back to Forms
  void sendMessage( String s1, String s2 )
  {
      list_msg.clear();
      Messages msg = new Messages(DrawLAF.SPINNER_NAME, s1);
      list_msg.add(msg);           
      msg = new Messages(DrawLAF.SPINNER_IMAGE_NAME, s2);
      list_msg.add(msg);
      try{
        dBean.dispatchanevent(DrawLAF.SPINNER_EVENT, list_msg);          
      } catch (Exception ex) {};     
  }
  
}
    
    /**
     * Object to store images properties
     */
    class objImage extends Object 
    {
        int         indice = 0 ;
        String      sName   = null ;
        String      sURL    = null ;
        String      sLegend = null ;
        String      sToolTip = null ;
        String      sStatus  = "none" ;
        ImageIcon   ii = null ;

        objImage(
                  int    i,
                  String name, 
                  String url, 
                  String legend,
                  String tooltip,
                  String status
                ) {
           indice = i ;
           this.sName    =  name ;
           this.sURL     =  url ;
           this.sStatus = status ;
           if(name.equalsIgnoreCase("--blank--")){
             ii = getBlankImageIcon();
           }
           else {
             ii = getImage(url);  
           }
           if(ii != null){
               ii.setDescription(""+i);
               vImg.add(ii);
           }
           else{
               return;
           }
           this.sLegend  = legend ;
           this.sToolTip =  tooltip ;
        }
        
        objImage(
                  int    i,
                  String name, 
                  ImageIcon img, 
                  String legend,
                  String tooltip,
                  String status
                ) {
           indice = i ;
           this.sName    =  name ;
           this.sStatus  = status ;
           if(img != null){
               img.setDescription(""+i);
               vImg.add(img);
               if(bKeepImageSize) vImgInit.add(img);
           }
           else{
               return;
           }
           this.sLegend  = legend ;
           this.sToolTip =  tooltip ;
        }        
    }    
    
  void printMemory(){
        Runtime runtime = Runtime.getRuntime();
        int mb = 1024*1024;
        System.out.println("##### Heap utilization statistics [MB] #####");
 
        //Print used memory
        System.out.println("Used Memory:"
            + (runtime.totalMemory() - runtime.freeMemory()) / mb);
        //Print free memory
        System.out.println("Free Memory:"
            + runtime.freeMemory() / mb);
        //Print total available memory
        System.out.println("Total Memory:" + runtime.totalMemory() / mb);
        //Print Maximum available memory
        System.out.println("Max Memory:" + runtime.maxMemory() / mb);      
  }
  
}
