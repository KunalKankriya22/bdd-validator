package oracle.forms.fd;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Frame;
import java.awt.Image;
import java.awt.Toolkit;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

import javax.swing.ImageIcon;
import javax.swing.JLabel;
import javax.swing.JScrollPane;
import javax.swing.ScrollPaneConstants;

/**
 * A class to display an image in a Frame
 * <br />
 * @author   Francois Degrelle
 * creation  May 2010
 * @version  1.1
 *
 */

public class DisplayImage extends Frame{
  
  Image img;
  JLabel jlb = null ;
  int   iWidth=0, iHeight=0;
  

  public DisplayImage(Image img, String sTitle){
    super(sTitle);
    this.img = img ;
    jlb = new JLabel(new ImageIcon(img));
    
    // Get the size of the default screen
    Dimension dim = Toolkit.getDefaultToolkit().getScreenSize();
    iWidth  = img.getWidth(null)  > dim.width  ? dim.width - 80  : img.getWidth(null) ;
    iHeight = img.getHeight(null) > dim.height ? dim.height - 100 : img.getHeight(null) ;
          
    JScrollPane jsp =  new JScrollPane(jlb) ;
    jsp.setVisible(true);
    jsp.setVerticalScrollBarPolicy(ScrollPaneConstants.VERTICAL_SCROLLBAR_AS_NEEDED);
    jsp.setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_AS_NEEDED);
    
    this.add(jsp);      
    setSize(iWidth+15,iHeight+45);
    setLocationRelativeTo(null);
    setVisible(true);
    addWindowListener(new WindowAdapter(){
      public void windowClosing(WindowEvent we){
        dispose();
      }
    });
  }
  
  public DisplayImage(Image img, String sTitle, Color cBG){
    super(sTitle);
    this.img = img ;
    jlb = new JLabel(new ImageIcon(img));
    
    // Get the size of the default screen
    Dimension dim = Toolkit.getDefaultToolkit().getScreenSize();
    iWidth  = img.getWidth(null)  > dim.width  ? dim.width - 80  : img.getWidth(null) ;
    iHeight = img.getHeight(null) > dim.height ? dim.height - 100 : img.getHeight(null) ;
          
    JScrollPane jsp =  new JScrollPane(jlb) ;
    jsp.setVisible(true);
    jsp.setVerticalScrollBarPolicy(ScrollPaneConstants.VERTICAL_SCROLLBAR_AS_NEEDED);
    jsp.setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_AS_NEEDED);
    jsp.getViewport().setBackground(cBG);
    
    this.add(jsp);      
    setSize(iWidth+15,iHeight+45);
    setLocationRelativeTo(null);
    setVisible(true);
    addWindowListener(new WindowAdapter(){
      public void windowClosing(WindowEvent we){
        dispose();
      }
    });
  }  

}
