package oracle.forms.fd;

import java.awt.AWTEvent;
import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Cursor;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Point;
import java.awt.Polygon;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.event.AWTEventListener;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import java.awt.event.MouseEvent;

import java.awt.geom.GeneralPath;

import java.awt.geom.Rectangle2D;

import java.util.StringTokenizer;

import javax.swing.JPanel;
import javax.swing.SwingUtilities;
import javax.swing.Timer;


/**
 * A JPanel to draw shapes
 * with the Robot feature
 * 
 * @author   Francois Degrelle
 * creation  February 2010
 * @version  1.4
 * 
 */


public class LAFPanel extends JPanel implements AWTEventListener, ActionListener{
    
    private Point point = new Point(); 

    String      sShape      = null ;
    String      sText       = "" ;
    int         iPoints[]   = new int[2000] ;
    int         iWidth      = 1 ;
    int         iGap        = 80 ;
    Color       cLine       = Color.black ;
    Color       cText       = new Color(85,85,255) ;
    Color       cFill       = null ;
    Color       cShadow     = Color.white ;
    Color       cPanelLine  = null;
    Color       cPanelBack  = null;
    float       fDash[]     = {1.0f,0.0f} ;
    Timer       timer       = null ;
    float       fAlpha      = 1.0f ;
    float       fBgTrsp     = 0.3f ;    
    JPanel      jp          = null ;
    boolean     bShadow     = false ;
    boolean     bFinish     = false ;    
    boolean     bBlink      = false ;    
    boolean     bGo         = true ;
    boolean     bPanel      = true ;
    Font        fText       = new Font("Verdana",Font.PLAIN,14);
    Polygon     poly = new Polygon();
    GeneralPath path = new GeneralPath( );   
    
    public LAFPanel() {  
       this.setLayout(new BorderLayout());
       jp = this ; 
    }
    
    public void setPoint(Point point) { 
        this.point = point; 
    } 
    
    /*-------------------*
     *  paint the shape
     *-------------------*/
    public void paintComponent(Graphics g) {

        super.paintComponent(g);       

        Graphics2D g2 = (Graphics2D)g ;

        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setColor(cLine);
        g2.setStroke(new BasicStroke((float)iPoints[0],BasicStroke.CAP_BUTT,BasicStroke.JOIN_ROUND,0, fDash,0));
        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, fAlpha));

        // Draw shape
        if(sShape != null) {
            // rectangle
            if     (sShape.equalsIgnoreCase("rectangle")) {
                if(bShadow){
                    g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, .3f));
                    g2.setColor(new Color(220,220,220));
                    g2.fillRect(iPoints[1],iPoints[2],iPoints[3],iPoints[4]);
                    g2.setColor(cLine);
                    g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, fAlpha));
                }
                g2.drawRect(iPoints[1],iPoints[2],iPoints[3],iPoints[4]);
            }
            // round rectangle
            if     (sShape.equalsIgnoreCase("roundrectangle")) {
                if(bShadow){
                    g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, .3f));
                    g2.setColor(new Color(220,220,220));
                    g2.fillRoundRect(iPoints[1],iPoints[2],iPoints[3],iPoints[4],15,15);
                    g2.setColor(cLine);
                    g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, fAlpha));
                }
                g2.drawRoundRect(iPoints[1],iPoints[2],iPoints[3],iPoints[4],15,15);
            }            
            // circle
            else if(sShape.equalsIgnoreCase("circle")) {
                g2.drawOval(iPoints[1],iPoints[2],iPoints[3],iPoints[4]);
            }
            // line
            else if(sShape.equalsIgnoreCase("line")) {
                g2.drawLine(iPoints[1],iPoints[2],iPoints[3],iPoints[4]);
            }
            // arrow
            else if(sShape.equalsIgnoreCase("arrow")) {
                double aDir=Math.atan2(iPoints[1]-iPoints[3],iPoints[2]-iPoints[4]);
                g2.drawLine(iPoints[3],iPoints[4],iPoints[1],iPoints[2]);
                Polygon tmpPoly=new Polygon();
                int i1=12+(int)(iPoints[0]*2);
                int i2=6+(int)iPoints[0];	
                tmpPoly.addPoint(iPoints[3],iPoints[4]);
                tmpPoly.addPoint(iPoints[3]+xCor(i1,aDir+.5),iPoints[4]+yCor(i1,aDir+.5));
                tmpPoly.addPoint(iPoints[3]+xCor(i2,aDir),iPoints[4]+yCor(i2,aDir));
                tmpPoly.addPoint(iPoints[3]+xCor(i1,aDir-.5),iPoints[4]+yCor(i1,aDir-.5));
                tmpPoly.addPoint(iPoints[3],iPoints[4]);
                g2.drawPolygon(tmpPoly);
                g2.fillPolygon(tmpPoly);
            }
            // polygon
            else if(sShape.equalsIgnoreCase("polygon")) {
                path.reset();
                int j = 1 ;
                while( j < iPoints.length && iPoints[j] > -1)
                {
                  try{
                    if(j==1) path.moveTo(iPoints[j],iPoints[j+1]);
                    else     {
                      if(iPoints[j] > -1 && iPoints[j+1] > -1) path.lineTo(iPoints[j],iPoints[j+1]);
                    }
                  }
                  catch(Exception ex) {System.out.println("SetPolygon():"+ex.toString());}
                  finally {j+=2;}
                }  
                path.closePath();
                Shape shape = path; 
                g2.draw(shape);
            }
            // text
            else if(sShape.equalsIgnoreCase("text")) {
              // text bounding box
              int itextWidth  = 0 ;
              int itextHeight = 0 ;
              int iPos = sText.indexOf(10) ;
              int iX = iPoints[1], iY = iPoints[2] ;
              int iYold = iY ;
              int i1=0,i2 ;
              String s = null ;
              String st = sText ;
              String  tLabels[] = new String[80] ;
              int  tHeight[] = new int[80] ;
              int  iIndice   = -1 ;

              g2.setFont(fText);              
              FontMetrics fm = g2.getFontMetrics(fText);
              if(fText.getSize() > 10)
                  g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,RenderingHints.VALUE_TEXT_ANTIALIAS_ON);              
              while(iPos > -1)
              {
                s = st.substring(0,iPos);
                Rectangle2D rect = fm.getStringBounds(s, g2);
                if(rect.getWidth() > itextWidth) itextWidth = (int)rect.getWidth() ;
                tLabels[++iIndice] = s ;
                tHeight[iIndice] = (int)rect.getHeight() ;
                itextHeight = itextHeight + tHeight[iIndice] + 2 ;
                st = st.substring(iPos+1);
                iPos = st.indexOf(10) ;
                i1++;
              }
              if(st.length() > 0)
              {
                tLabels[++iIndice] = st ;
                Rectangle2D rect = fm.getStringBounds(st, g2);
                if(rect.getWidth() > itextWidth) itextWidth = (int)rect.getWidth() ;
                tHeight[iIndice] = (int)rect.getHeight() ;      
                itextHeight = itextHeight + tHeight[iIndice];
              }
              i1 = iX ;
              i2 = iY - tHeight[0] ;
              itextHeight += tHeight[0] ;

              if(bPanel) {
                if(cPanelLine != null) {
                   g2.setColor(cPanelLine);
                   g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.6f));
                   g2.setStroke(new BasicStroke(1f,BasicStroke.CAP_BUTT,BasicStroke.JOIN_ROUND,0, fDash,0));
                   g2.drawRoundRect(i1-10,i2,itextWidth+15,itextHeight-10,15,15);
                }
                if(cPanelBack != null) {
                  g2.setColor(cPanelBack);
                  g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, fBgTrsp));
                  g2.fillRoundRect(i1-10,i2,itextWidth+15,itextHeight-10,15,15);
                  g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, fAlpha));                    
                }
              }  
              for(int i=0 ; i<=iIndice; i++)
               {
                  if(cShadow != null)
                  {
                    g2.setColor(cShadow);
                    g2.drawString(tLabels[i],(float)iX-1,(float)iY-1);              
                    g2.drawString(tLabels[i],(float)iX,(float)iY-1);              
                    g2.drawString(tLabels[i],(float)iX+1,(float)iY-1);              
                    g2.drawString(tLabels[i],(float)iX-1,(float)iY);              
                    g2.drawString(tLabels[i],(float)iX+1,(float)iY);
                    g2.drawString(tLabels[i],(float)iX-1,(float)iY+1);              
                    g2.drawString(tLabels[i],(float)iX,(float)iY+1);              
                    g2.drawString(tLabels[i],(float)iX+1,(float)iY+1);              
                  }
                  g2.setColor(cText);
                  g2.drawString(tLabels[i],(float)iX,(float)iY);
                  iY += tHeight[i] + 2 ;
               }  
               iY = iYold ;              
              
        }
            else { System.out.println("LAF Robot Shape - unknown shape:"+sShape);} ;        
        }
        
        g2.dispose();

    } 
    
    /*----------------------------*
     *     define the shape
     *----------------------------*/
    void setShape(String s) {
        String  shape = null ;
        iPoints = new int[2000];
        int i = 0 ;
        
        StringTokenizer st = new StringTokenizer(s,",");
        if(st.hasMoreTokens()) { shape = st.nextToken().toLowerCase(); }
        else return ;

        if(shape.startsWith("blink_")) {
           bBlink = true ;
           iGap = 50 ;
           shape = shape.replaceAll("blink_","") ;
        }

        // shape properties 
        while(st.hasMoreTokens()) { 
          // shape != text
          if(! shape.equalsIgnoreCase("text")) {
            try {
              iPoints[i++] = Integer.parseInt(st.nextToken());
            } catch(Exception e){return;}
          }
          else { // shape = text
            if(i<3) {
              try {
                iPoints[i++] = Integer.parseInt(st.nextToken());
              } catch(Exception e){return;}
            }  
            else {
              if(i++>3) sText += "," ;
              sText += st.nextToken() ;
            }  
          }
        }
        iPoints[i] = -1 ;
        iPoints[i+1] = -1 ;
        
        sShape = shape.toLowerCase() ;      

    }
    
    void setShadow(int i1) {
        if(i1 == 0) bShadow = false ;
        else        bShadow = true ;
    }
    
    void setBGTrsp(float f) {
        fBgTrsp = f ;
    }
    
    void setColors(Color c1, Color c2) {
        cLine = c1 ;
        cFill = c2 ;
    }
    
    void setDash(int i1, int i2) {
        fDash[0] = (float)i1 ;
        fDash[1] = (float)i2 ;
    }  
    
    void setTextFont(Font f) {
        fText = f ;
    }      
    
    void setPanel(boolean b) {
        bPanel = b ;
    }          
    
    void setTextColors(Color c1, Color c2, Color c3, Color c4) {
        cText = c1 ;
        if(c2 != null) cShadow    = c2 ;
        if(c3 != null) { cPanelBack = c3 ; cPanelLine = c3 ; }
        if(c4 != null) { cPanelLine = c4 ; }
    }    

    void setPanelColors(Color c1, Color c2) {
        if(c1 != null) cPanelBack = c1 ;
        if(c2 != null) cPanelLine = c2 ;
        bPanel = true ;
    }    
    
    public void setBlink(boolean b) { 
        bBlink = b ;
    }    
    
   void draw() {
       fAlpha = 1.0f ;
       timer = new Timer(iGap, this);
       timer.start(); 
   }
   
   void finish() {
       fAlpha = 1.0f ;
       bGo = false ;
       bFinish = true ;
       if(timer.isRunning()) timer.stop();
       timer = new Timer(50, this);
       timer.start();
   }     
   
   void destroy() {
       if(timer.isRunning()) timer.stop();
   }
   
   private static int yCor(int len, double dir) {return (int)(len * Math.cos(dir));}
   private static int xCor(int len, double dir) {return (int)(len * Math.sin(dir));}                    
   
   public void actionPerformed(ActionEvent evt) {
                if(bGo) {
                  fAlpha += .1f ;
                  jp.repaint();     
                  if(fAlpha > 1.0) {fAlpha = 1.0f ; bGo = !bGo; }
                }
                else if(bFinish) {
                  fAlpha -= .1f ;
                  jp.repaint();     
                  if(fAlpha < 0.0) {fAlpha = 0.0f ; }
                }               
                else {
                  if(bBlink) {
                    fAlpha -= .1f ;
                    jp.repaint();     
                    if(fAlpha < 0.1) {fAlpha = 0.1f ; bGo = !bGo; }
                  }
                }   
      }   

    public void eventDispatched(AWTEvent event) { 
        if (event instanceof MouseEvent) { 
            MouseEvent me = (MouseEvent) event; 
            if (!SwingUtilities.isDescendingFrom(me.getComponent(), jp)) { 
                return; 
            } 
            if (me.getID() == MouseEvent.MOUSE_EXITED && me.getComponent() == jp) { 
                point = null; 
            } 
            repaint(); 
        } 
    } 
 
    public boolean contains(int x, int y) { 
        if (getMouseListeners().length == 0 && getMouseMotionListeners().length == 0 
                && getMouseWheelListeners().length == 0 
                && getCursor() == Cursor.getPredefinedCursor(Cursor.DEFAULT_CURSOR)) { 
            return false; 
        } 
        return super.contains(x, y); 
    } 


}
