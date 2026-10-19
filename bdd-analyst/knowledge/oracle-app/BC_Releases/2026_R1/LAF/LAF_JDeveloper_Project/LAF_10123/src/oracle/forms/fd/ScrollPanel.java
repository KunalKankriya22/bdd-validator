package oracle.forms.fd;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

import java.awt.geom.Rectangle2D;

import java.io.IOException;

import java.net.URL;

import javax.swing.border.Border;
import javax.swing.border.EtchedBorder;
import javax.swing.event.HyperlinkEvent;
import javax.swing.event.HyperlinkListener;
import javax.swing.text.Document;
import javax.swing.text.html.HTMLDocument;
import javax.swing.text.html.HTMLEditorKit;

/**
 * A HTML Scrolling Panel
 * 
 * @author   Francois Degrelle
 * creation  january 2010
 * @version  1.2
 * 
 */
 
public class ScrollPanel extends JPanel implements ActionListener, HyperlinkListener
{

    protected Timer timer;
    // private variables
    private JEditorPane htmlPane = new JEditorPane(new HTMLEditorKit().getContentType(),"");
    private String initialURL = null;
    private JScrollPane scrollPane = new JScrollPane(htmlPane);
    private int iX=0, iY=0, iWidth=-1, iHeight=200;
    private int iX2=-1, iY2=-1, iWidth2=-1, iHeight2=-1;
    private String  sFont = "Label.font" ;
    private String  sWarningText = null ;
    private int     iFontSize = 12 ;
    private int     iDelay = 25 ;
    private boolean bFollowLinks = false ;
    private boolean bOk  = true ;
    private boolean bLog = false ;
    private boolean bHorToolbar = false ;
    private boolean bVerToolbar = false ;    
    private boolean bEscape = false ;
    private boolean bExtend = false ;
    private boolean bExtended = false ;
    private Font    fBackground = new Font("Verdana",Font.PLAIN,12) ;
    private Color   cPanelBackground = Color.white ;
    private Color   cWarningText = Color.black ;
    private Color   cWarningTextBG = new Color(240,240,240) ;        
    private String  sPageNotFound = "<html><body bgcolor='#ffffff'><font color='#ff0000' size='2' face='Verdana'><strong>Sorry, the requested page was not found</strong></font></body></html>" ;
    private Border  border = BorderFactory.createLineBorder(Color.black);
    private JPanel  jp = null;
    private ScrollPanel sp = null ;
    private JFrame  jframe = null ;

    public ScrollPanel() {}
        
	public ScrollPanel 
         (
           int initialTime, 
           int delay, 
           int p_x, 
           int p_y, 
           int p_width, 
           int p_height
         )
	{	
          init(initialTime,delay,p_x,p_y,p_width,p_height);
	}
        
	public void init 
         (
           int p_initialTime, 
           int p_delay, 
           int p_x, 
           int p_y, 
           int p_width, 
           int p_height
         )
	{	
          log("init()");
          jp = this ;
          sp = this ;
          iDelay     = p_delay ;
          iX         = p_x ;
          iY         = p_y ;
          iWidth     = p_width ;
          iHeight    = p_height ;
          this.iWidth  = iWidth ;
          this.iHeight = iHeight ;
          this.setLocation(iX, iY);
          this.setPreferredSize(new Dimension(iWidth, iHeight));
          this.setBackground(cPanelBackground);
          this.timer = new Timer (iDelay, this);
          this.timer.setInitialDelay(p_initialTime);
          this.setBorder(border);
          
          htmlPane.setEditable(false);
          htmlPane.setBorder(null);
          htmlPane.setLocation(0,0);
          // add a CSS rule to force body tags to use the default label font
          // instead of the value in javax.swing.text.html.default.css
          String bodyRule = null ;
          if(sFont.equalsIgnoreCase("Label.font")) {
            Font font = UIManager.getFont(sFont);
            bodyRule = "body { font-family: " + font.getFamily() + "; " +
                "font-size: " + font.getSize() + "pt; }";
          }
          else {
            bodyRule = "body { font-family: " + sFont + "; " +
                    "font-size: " + iFontSize + "pt; }";              
          }
          ((HTMLDocument)htmlPane.getDocument()).getStyleSheet().addRule(bodyRule);
          setContent(initialURL);

          htmlPane.addHyperlinkListener(this);
          htmlPane.addMouseListener(mouseListener);
          htmlPane.addKeyListener(keyListener);
          //htmlPane.setOpaque(false);
          htmlPane.setBackground(cPanelBackground);
          scrollPane = new JScrollPane(htmlPane);
          scrollPane.setBorder(null);
          scrollPane.getViewport().setBackground(cPanelBackground);
          scrollPane.setBackground(cPanelBackground);
          Dimension dim = this.getPreferredSize() ;
          dim.width  = dim.width  - 6 - (this.getInsets().left + this.getInsets().right);
          dim.height = dim.height - 6 - (this.getInsets().top + this.getInsets().bottom);

          scrollPane.setPreferredSize(dim);
          if(bHorToolbar) scrollPane.setHorizontalScrollBarPolicy(scrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED);
          else scrollPane.setHorizontalScrollBarPolicy(scrollPane.HORIZONTAL_SCROLLBAR_NEVER);
          if(bVerToolbar) scrollPane.setVerticalScrollBarPolicy(scrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
          else scrollPane.setVerticalScrollBarPolicy(scrollPane.VERTICAL_SCROLLBAR_NEVER);          
          
          this.add(scrollPane);
	}        
	
	// choose the content type
        public void setContent( String sContent) {
           log("ScrollPanel setContent():"+sContent);
           if(sContent != null) {
              Document doc = htmlPane.getDocument();
              doc.putProperty(Document.StreamDescriptionProperty, null);           
              if( (sContent.startsWith("http:"))
                ||(sContent.startsWith("/"))
                ||(sContent.startsWith("file:")) ) {
                  if(sContent.startsWith("/")) setUrl(DrawLAF.sDocBase + sContent);
                  else setUrl(sContent);
              }
              else
                  setText(sContent);
                  htmlPane.setCaretPosition(0);
           }
        }
        
        // set an URL centant
        public void setUrl(String sUrl) {
        log("ScrollPanel setUrl():"+sUrl);
        try {
            htmlPane.setPage(new URL(sUrl));
            bOk = true ;
          } catch(IOException ioe) {
            System.out.println("LAF - ScrollPanel : Unable to follow the link to " + sUrl + ": " + ioe);
            bOk = false ;
            try {
              htmlPane.setContentType("text/html");
              htmlPane.setText(sPageNotFound);
              htmlPane.setCaretPosition(0);
            } catch(Exception ex) {
              System.out.println("LAF - ScrollPanel : Unable to set the HTML text ");
             }       
        } 
        }
        
        // set extend values
        public void setExtends (int x, int y, int w, int h) {
            log("ScrollPanel setExtends():"+x+","+y+","+w+","+h);
            iX2      = x ;
            iY2      = y ;
            iWidth2  = w ;
            iHeight2 = h ;
            bExtend  = true ;
        }
        
        // set Page Not Found text
        public void setNotFoundText (String s) {
            log("ScrollPanel setNotFoundText():"+s);
            sPageNotFound = s ;
        }
        
        // set JFrame
        public void setJFrame (JFrame jf) {
            jframe = jf ;
        }        
        
	      // set a text content
        public void setText(String sTxt) {
            log("ScrollPanel setText():"+sTxt);
            try {
               htmlPane.setContentType("text/html");
               htmlPane.setText(sTxt);
               htmlPane.setCaretPosition(0);
          } catch(Exception ex) {
            System.out.println("LAF - ScrollPanel : Unable to set the text ");
          } 
        }        
        
        // set Font for single text
        public void setFont(String p_font, int p_size) {
          log("ScrollPanel setFont():"+p_font+","+p_size);
          sFont     = p_font ;
          iFontSize = p_size ;
        }
        
        // set panel opaque
        public void setPanelOpaque(boolean b) {
          this.setOpaque(b);
          htmlPane.setOpaque(b);
          scrollPane.setOpaque(b);
          scrollPane.getViewport().setOpaque(b);
        }
        
        // set panel background color
        public void setPanelColor(Color c) {
          Component cps[] = this.getComponents() ;
          for(int x=0; x<cps.length;x++)
          {
            System.out.println(""+cps[x]);
          }
          log("ScrollPanel setPanelColor():"+c);
          cPanelBackground = c ;
          this.setBackground(cPanelBackground);
          scrollPane.setBackground(cPanelBackground);
          htmlPane.setBackground(cPanelBackground);
          scrollPane.getViewport().setBackground(cPanelBackground);
        }        
        
        // allow Horizontal toolbar
        public void setHorizontalToolbar(boolean b) {
            bHorToolbar = b ;
        }
        
        // allow Vertical toolbar
        public void setVerticalToolbar(boolean b) {
            bVerToolbar = b ;
        }        
        
        // allow to manage links
        public void setLinks(boolean b) {
            bFollowLinks = b ;
        }    
        
        // allow user to escape
        public void setEscape(boolean b) {
            bEscape = b ;
        }    
        
        // set panel size
        public void setNewSize(int w, int h) {
           scrollPane.setSize(w,h); 
           htmlPane.setSize(w,h);
        }
        
        // set panel location
        public void setNewLocation(int w, int h) {
           scrollPane.setLocation(w,h); 
           //htmlPane.setSize(w,h);
        }                  
        
        // set the border
        public void setBorderPanel(String sBorder, Color c, int i) {
          if(sBorder.equalsIgnoreCase("line")){
              if(c != null  && i > 0) border = BorderFactory.createLineBorder(c,i);
          }
          else if(sBorder.equalsIgnoreCase("raisedetched")) border = BorderFactory.createEtchedBorder(EtchedBorder.RAISED);
          else if(sBorder.equalsIgnoreCase("loweredetched")) border = BorderFactory.createEtchedBorder(EtchedBorder.LOWERED);
          else if(sBorder.equalsIgnoreCase("raisedbevel")) border = BorderFactory.createRaisedBevelBorder();
          else if(sBorder.equalsIgnoreCase("loweredbevel")) border = BorderFactory.createLoweredBevelBorder();          
          else if(sBorder.equalsIgnoreCase("empty")) border = BorderFactory.createEmptyBorder();          
          this.setBorder(border);
          scrollPane.setBorder(border);
        }
        
        // set the information test
        public void setInfoText(String s) {
            log("ScrollPanel setInfoText():"+s);
            sWarningText = s ;
        }
        
        // set the information properties
        public void setInfoProperties(Font f, Color c1, Color c2) {
           fBackground = f ;
           if(c1 != null) cWarningText   = c1 ;
           if(c2 != null) cWarningTextBG = c2 ;        
        }        
        
        // start the timer
	public void startTimer ()
	{	
            if(bOk) this.timer.start ();
	}
	
	// stop the timer
	public void stopTimer ()
	{	
            this.timer.stop ();
	}

	// Timer activity
	public boolean isRunning ()
	{	
           return ( this.timer.isRunning () );
	}
	
	// raised by the timer
        public void actionPerformed (ActionEvent e)
	{	
                Point p = htmlPane.getLocation() ;
                htmlPane.setLocation(p.x, (p.y)-1);
                if(p.y < (htmlPane.getHeight() * -1))
                  htmlPane.setLocation(p.x, scrollPane.getHeight());
	}
        
        // the logging mode
        public void setLog (boolean b) {
            bLog = b ;
        }


      // Follow the clicked link
      public void hyperlinkUpdate(HyperlinkEvent e) {
        log("hyperlinkUpdate():"+e.getURL());
        if(bFollowLinks)
        {
            try {
              if(e.getEventType() == HyperlinkEvent.EventType.ACTIVATED)
              {
                htmlPane.setPage(e.getURL());
                timer.setDelay(iDelay);
              }  
            } catch (java.io.IOException e2) {} 
        }
      }

    // extended panel
    void extendPanel(int x, int y, int w, int h) {
        jp.setLocation(x,y);
        Dimension dim = new Dimension(w, h) ;
        jp.setSize(dim);
        dim.width  = dim.width  - 6 - (jp.getInsets().left + jp.getInsets().right);
        dim.height = dim.height - 6 - (jp.getInsets().top + jp.getInsets().bottom);
        scrollPane.setSize(dim); 
        htmlPane.setSize(dim);
        jp.repaint();
    }
    
    // mouse listener
    MouseListener mouseListener = new MouseListener() {
        public void mouseClicked(MouseEvent e) {
          log("mouse-clicked:"+e.getClickCount());
          if(bExtend && (jframe == null)) {
              if(e.getClickCount() > 1) {
                  log("Double-click");
                  if(! bExtended) {
                    if(iX2+iY2+iWidth2+iHeight2 == -4) {
                       extendPanel(5,5,jp.getParent().getSize().width - 10,jp.getParent().getSize().height - 10) ;
                    }
                    else extendPanel(iX2,iY2,iWidth2,iHeight2) ;
                  }
                  else {
                    extendPanel(iX,iY,iWidth,iHeight) ;
                  }
                  bExtended = !bExtended ;
              }
          }
        }
        public void mouseEntered(MouseEvent e) {
            timer.setDelay(100);
        }
        public void mouseExited(MouseEvent e) {
            timer.setDelay(iDelay);
        }
        public void mousePressed(MouseEvent e) {
        }
        public void mouseReleased(MouseEvent e) {
        }
    };


    KeyListener keyListener = new KeyListener() {
    //
    // Handle the key typed event from the text field.
    //
    public void keyTyped(KeyEvent e) {
        }
        
    //
    // Handle the key pressed event from the text field. 
    //
    public void keyPressed(KeyEvent e) {
       int iCode = e.getKeyCode();
       if(iCode == KeyEvent.VK_ESCAPE && bEscape)
       {
          sp.stopTimer ();
          sp.remove(scrollPane);
          sp.setVisible(false);
          sp = null ;
          if(jframe != null) { 
            jframe.setVisible(false);
          }
       }
    }

    //
    // Handle the key released event from the text field. 
    //
    public void keyReleased(KeyEvent e) {
    }
    };    
    
    // draw text on the panel
    public void paint(Graphics g) {
        super.paint(g);
        if(sWarningText != null) {
            Graphics2D g2 = (Graphics2D) g ;
            g2.setFont(fBackground);
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
             g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,RenderingHints.VALUE_TEXT_ANTIALIAS_ON);             
            FontMetrics fm = g2.getFontMetrics(fBackground); 
            Rectangle2D rect = fm.getStringBounds(sWarningText, g2);
            int textHeight  = (int)(rect.getHeight());
            int textWidth   = (int)(rect.getWidth());            
            g2.setColor(cWarningTextBG);
            g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, .7f));
            g2.fillRoundRect(2,5,textWidth+5,textHeight+5,12,12);
            g2.setColor(cWarningText);
            g2.drawString(sWarningText,5,textHeight+5);    
            g2.dispose();
        }
    }
    
    
   private void log(String sMessage)
   {
     if(bLog) System.out.println("LAF ScrollPanel(): " + sMessage);
   }
   
}

