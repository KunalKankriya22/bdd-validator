package oracle.forms.fd;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.Point;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;

import java.io.File;
import java.io.FileInputStream;

import java.net.URL;

import java.util.StringTokenizer;

import javax.swing.BorderFactory;
import javax.swing.ImageIcon;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.ScrollPaneConstants;
import javax.swing.border.EtchedBorder;

import oracle.forms.engine.Main;
import oracle.forms.handler.IHandler;

import java.util.Base64; //MLT-7702


/**
 * A class to handle dynamic created Images
 * <br />
 * @author   Francois Degrelle
 * creation  May 2010
 * @version  1.3
 *
 */

public class NewImage extends JPanel implements KeyListener {

    public String sName = null;
    public JScrollPane jsp = null;
    private java.util.ArrayList list_msg = new java.util.ArrayList(10);
    private String sFileChooserTitle = "Select an image file";
    private String sFileStartDir = "";
    private String sLegend = null;
    private IHandler m_handler;
    private Image imgReal = null;
    private Image imgShown = null;
    private String sChooserLAF = "SYSTEM";
    private Color cDefaultColor = Color.white;
    private boolean bLog = false;
    private boolean bImg = false;
    private boolean bTrsp = false;
    private boolean bFocus = false;
    private boolean bCenter = false;
    private boolean bAllowDnD = false;
    protected boolean bDblClickShowImg = false;
    private URL m_codeBase;
    private File file_image = null;
    private FileInputStream fis = null;
    private int iMageSize = 0;
    private int numBytesRead = 0;
    private int iImgX = 0;
    private int iImgY = 0;
    private int iImgWidth = 0;
    private int iImgHeight = 0;
    private int iScaleWidth = -1, iScaleHeight = -1;
    private int iImgStart = 0, iImgEnd = 0;
    private byte[] bImage;
    private StringBuffer sbImage = new StringBuffer();
    private NewImage NEWIMAGE;
    private ImageKit ik = new ImageKit();

    private Image img = null;
    private Color colorBG = null;
    private int iImageWidth = 0, iImageHeight = 0;
    private int iInitialWidth = 0, iInitialHeight = 0;

    private KeyListener kl;
    private Main formsMain = null;
    private char cChar;
    private int iModifier = 0;
    private String sModifier = "";
    private DrawLAF dBean;

    public NewImage(DrawLAF VB, String s, int x, int y, int w, int h, String sImg) {
        dBean = VB;
        sName = s;
        iImgX = x;
        iImgY = y;
        iImgWidth = w;
        iImgHeight = h;
        iInitialWidth = w;
        iInitialHeight = h;
        this.setName(s);
        this.setLayout(null);
        this.setSize(new Dimension(iInitialWidth, iInitialHeight));
        NEWIMAGE = this;
        // create the panel
        setVisible(true);
        setBorder(BorderFactory.createEmptyBorder());
        setLocation(iImgX, iImgY);
        jsp = new JScrollPane(this);
        jsp.setSize(new Dimension(iImgWidth, iImgHeight));
        jsp.setLocation(iImgX, iImgY);
        jsp.setVisible(true);
        jsp.setVerticalScrollBarPolicy(ScrollPaneConstants.VERTICAL_SCROLLBAR_NEVER);
        jsp.setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_NEVER);
        this.addKeyListener(this);
        this.addFocusListener(newFocusListener());
        if (sImg != null)
            readImageFile(sImg);
        // add a drag&drop listener
        new FileDrop(this, new FileDrop.Listener() {
                public void filesDropped(java.io.File[] files, Point pt) {
                    int nb = 0;
                    String sExt = null;
                    //for (int i = 0; i < files.length; i++) {
                    if (bAllowDnD && files.length > 0) {
                        File fx = files[0];
                        if (!fx.isDirectory()) {
                            try {
                                int dot = files[0].getName().toLowerCase().lastIndexOf(".");
                                sExt = files[0].getName().toLowerCase().substring(dot + 1);
                                if (sExt.equals("gif") || sExt.equals("jpeg") || sExt.equals("jpg") ||
                                    sExt.equals("png")) {
                                    // read image file
                                    img = null;
                                    imgReal = null;
                                    imgShown = null;
                                    readImageFile(files[0].getCanonicalPath());
                                    sendMessage(NEWIMAGE.getName(), "content", "image", "changed");
                                } else {
                                    System.out.println("DrawLAF NewImage [" + files[0].getCanonicalPath() +
                                                       "] is probably not an image the component can read");
                                }
                            } catch (java.io.IOException e) {
                            }
                        }
                    }
                }
            });
    }

    // set the image
    void setImage(Image p_image) {
        img = p_image;
        if (img != null) {
            ImageIcon ii = new ImageIcon(img);
            if ((iScaleWidth != 0) && (iScaleHeight != 0)) {
                ii = new ImageIcon(img.getScaledInstance(iScaleWidth, iScaleHeight, Image.SCALE_SMOOTH));
                img = ii.getImage();
            }
            iImageWidth = ii.getIconWidth();
            iImageHeight = ii.getIconHeight();
            // ajust the panel size to the new image size
            this.setPreferredSize(new Dimension(iImageWidth, iImageHeight));
        } else {
            // restore panel size to its initial values
            this.setPreferredSize(new Dimension(iInitialWidth, iInitialHeight));
            iImageWidth = iImageHeight = 0;
            img = null;
        }
        this.revalidate();
    }

    // set the background color

    void setBGColor(Color p_color) {
        colorBG = p_color;
    }

    // allow Drag and Drop

    void setDragnDrop(boolean b) {
        bAllowDnD = b;
    }

    // get the image width
    int getImageWidth() {
        return iImageWidth;
    }
    
    // get the image width
    Point getImageLocation() {
        return jsp.getLocation();
    }    

    // get the image height
    int getImageHeight() {
        return iImageHeight;
    }

    //
    // draw the image
    //

    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D)g;
        int x = 0, y = 0;
        if (colorBG != null) {
            g2.setColor(colorBG);
        } else
            g2.setColor(cDefaultColor);
        if (!bTrsp)
            g2.fillRect(0, 0, this.getWidth(), this.getHeight());
        // draw image
        if (img != null) {
            if (!bCenter)
                g2.drawImage(img, 0, 0, this);
            else {
                if ((img.getWidth(null) > jsp.getWidth()) || (img.getHeight(null) > jsp.getHeight()))
                    g2.drawImage(img, 0, 0, this);
                else {
                    x = (jsp.getWidth() / 2) - (img.getWidth(null) / 2);
                    y = (jsp.getHeight() / 2) - (img.getHeight(null) / 2);
                    g2.drawImage(img, x, y, this);
                }
            }
        }
        if (bFocus) {
            // draw focus line
            g2.setColor(DrawLAF.cFocus);
            g2.setStroke(new BasicStroke(3f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_BEVEL));
            g2.drawRect(0, 0, jsp.getWidth() - jsp.getInsets().right - 3,
                        jsp.getHeight() - jsp.getInsets().bottom - 3);
        }
        g2.dispose();
    }


    boolean readImageFile(String s) {
        log("LAF - NewImage - readImage(" + s + ")");
        String sFileName = s;
        imgReal = ik.loadImage(sFileName);
        if (imgReal == null)
            return false;
        bImg = true;
        bImage = ik.imageIconToByteArray(new ImageIcon(imgReal));
        if ((iScaleWidth != 0) && (iScaleHeight != 0)) {
            ImageIcon icon = new ImageIcon(imgReal.getScaledInstance(iScaleWidth, iScaleHeight, Image.SCALE_SMOOTH));
            imgShown = icon.getImage();
            setImage(imgShown);
        } else
            setImage(imgReal);
        repaint();
        sendMessage(getName(), "content", "image", "changed");
        return true;
    }

    //
    // read an image from the database
    //

    void readImageBase(String s) {
        String sImage = s;
        if (!sImage.equalsIgnoreCase("[END_IMAGE]")) {
            sbImage.append(sImage);
        } else {
            // BASE64Decoder decoder = new BASE64Decoder(); // MLT-7702
            try {
                // byte[] decodedStr = decoder.decodeBuffer(sbImage.toString()); //MLT-7702
                byte[] decodedStr =  Base64.getDecoder().decode(sbImage.toString()); // MLT-7702
                ImageIcon ii = new ImageIcon(decodedStr);
                imgReal = ii.getImage();
                bImage = ik.imageIconToByteArray(new ImageIcon(imgReal));
                fis = null;
                if ((iScaleWidth != 0) && (iScaleHeight != 0)) {
                    ImageIcon icon =
                        new ImageIcon(imgReal.getScaledInstance(iScaleWidth, iScaleHeight, Image.SCALE_SMOOTH));
                    imgShown = icon.getImage();
                    setImage(imgShown);
                } else
                    setImage(imgReal);
                repaint();
                sendMessage(getName(), "content", "image", "changed");
            } catch (Exception e) {
                ;
            } finally {
                sbImage = new StringBuffer();
            }
        }
    }


    //
    // set the border
    //

    void setImageBorder(String s1, String s2) {
        log("LAF - NewImage - setImageBorder(" + s1 + "," + s2 + ")");
        //String s1="", s2=null ;
        Color c = Color.white;
        int iThick = 0;
        if (s1.equalsIgnoreCase("line"))
            jsp.setBorder(BorderFactory.createLineBorder(Color.black));
        else if (s1.equalsIgnoreCase("raisedetched"))
            jsp.setBorder(BorderFactory.createEtchedBorder(EtchedBorder.RAISED));
        else if (s1.equalsIgnoreCase("loweredetched"))
            jsp.setBorder(BorderFactory.createEtchedBorder(EtchedBorder.LOWERED));
        else if (s1.equalsIgnoreCase("raisedbevel"))
            jsp.setBorder(BorderFactory.createRaisedBevelBorder());
        else if (s1.equalsIgnoreCase("loweredbevel"))
            jsp.setBorder(BorderFactory.createLoweredBevelBorder());
        else if (s1.equalsIgnoreCase("empty"))
            jsp.setBorder(BorderFactory.createEmptyBorder());
        else if (s1.equalsIgnoreCase("0"))
            jsp.setBorder(BorderFactory.createEmptyBorder());
        else {
            try {
                iThick = Integer.parseInt(s1);
            } catch (Exception e) {
            }
        }
        if (s2 != null) {
            c = ik.makeColor(s2);
            jsp.setBorder(BorderFactory.createLineBorder(c, iThick));
        }
    }

    //
    // set the position of the image
    //

    void setImagePosition(int x, int y) {
        log("LAF - NewImage - setImagePosition(" + x + "," + y + ")");
        jsp.setLocation(x, y);
    }

    //
    // set the legend
    //

    void setLegend(String s) {
        log("LAF - NewImage - setLegend(" + s + ")");
        sLegend = s;
    }

    //
    // set the background color
    //

    void setImageBG(String s) {
        log("LAF - NewImage - setImageBG(" + s + ")");
        if (s.equalsIgnoreCase("transparent")) {
            jsp.setOpaque(false);
            jsp.getViewport().setOpaque(false);
            bTrsp = true;
        } else {
            bTrsp = false;
            setBGColor(ik.getInstance().makeColor(s));
        }
    }

    //
    // clear the image
    //

    void clearImage() {
        log("LAF - NewImage - Clear image");
        imgReal = null;
        imgShown = null;
        setImage(null);
        repaint();
        sendMessage(getName(), "content", "image", "changed");
    }

    //
    // center image
    //

    void centerImage(String s) {
        log("LAF - NewImage - centerImage(" + s + ")");
        if (s.equalsIgnoreCase("true"))
            bCenter = true;
        else if (s.equalsIgnoreCase("false"))
            bCenter = false;
    }

    //
    // display image full size
    //

    void displayFullSizeImage() {
        log("LAF - NewImage - displayFullSizeImage()");
        new DisplayImage(imgReal, sLegend, Color.white);
    }

    //
    // image scaling
    //

    boolean scaleImage(String s) {
        log("LAF - NewImage - scaleImage(" + s + ")");
        String tok = "";
        StringTokenizer st = new StringTokenizer(s, ",");
        while (st.hasMoreTokens()) {
            tok = st.nextToken().toUpperCase();
            // width ?
            if (tok.startsWith("WIDTH=")) {
                tok = tok.substring(6);
                if (tok.equalsIgnoreCase("FIT")) {
                    iScaleWidth = (int)jsp.getSize().getWidth();
                } else {
                    try {
                        iScaleWidth = Integer.parseInt(tok);
                        if (iScaleWidth < -1)
                            iScaleWidth = 0;
                    } catch (Exception e) {
                        System.out.println("SCALE_IMAGE : bad Width integer value provided");
                        return false;
                    }
                }
                log("Scale Width="+iScaleWidth);
            }
            // height ?
            if (tok.startsWith("HEIGHT=")) {
                tok = tok.substring(7);
                if (tok.equalsIgnoreCase("FIT")) {
                    iScaleHeight = (int)jsp.getSize().getHeight();
                } else {
                    try {
                        iScaleHeight = Integer.parseInt(tok);
                        if (iScaleHeight < -1)
                            iScaleHeight = 0;
                    } catch (Exception e) {
                        System.out.println("SCALE_IMAGE : bad Height integer value provided");
                        return false;
                    }
                }
                log("Scale Height=" + iScaleHeight);
            }
        }
        return true;
    }

    //
    // set the FileChooser title and starting directory
    //

    void setFileChooser(String s1, String s2) {
        log("LAF - NewImage - setFileChooser(" + s1 + "," + s2 + ")");
        if (s1 != null)
            sFileChooserTitle = s1;
        if (s2 != null)
            sFileStartDir = s2;
    }

    //
    // set the JFileChooser L&F
    //

    void setLAF(String s) {
        sChooserLAF = s;
    }

    //
    // set the Tooltip
    //

    void setTooltip(String s) {
        log("LAF - NewImage - setTooltip(" + s + ")");
        this.setToolTipText(s);
    }

    //
    // show/hide the scrollbars
    //

    void scrollImage(String s) {
        log("LAF - NewImage - scrollImage(" + s + ")");
        if (s.equalsIgnoreCase("true")) {
            jsp.setVerticalScrollBarPolicy(ScrollPaneConstants.VERTICAL_SCROLLBAR_AS_NEEDED);
            jsp.setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_AS_NEEDED);
        } else {
            jsp.setVerticalScrollBarPolicy(ScrollPaneConstants.VERTICAL_SCROLLBAR_NEVER);
            jsp.setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_NEVER);
        }
    }

    //
    // set the log flag to output the messages on the console
    //

    void setLog(String s) {
        if (s.equalsIgnoreCase("TRUE")) {
            bLog = true;
        } else {
            bLog = false;
        }
    }


    /**----------------------------------*
     * Get the properties from the bean  *
     *-----------------------------------*/

    // image size
    String getImgSize() {
        int w = 0, h = 0;
        if (imgReal != null) {
            ImageIcon icon = new ImageIcon(imgReal);
            w = icon.getIconWidth();
            h = icon.getIconHeight();
        }
        return "" + w + "," + h;
    }

    String getImgWidth() {
        int w = 0;
        if (imgReal != null) {
            ImageIcon icon = new ImageIcon(imgReal);
            w = icon.getIconWidth();
        }
        return "" + w;
    }

    String getImgHeight() {
        int h = 0;
        if (imgReal != null) {
            ImageIcon icon = new ImageIcon(imgReal);
            h = icon.getIconHeight();
        }
        return "" + h;
    }
    //
    // returns selected filename
    //

    String getFileName() {
        GetImageFileName gifn = new GetImageFileName();
        gifn.SetLAF(sChooserLAF.toUpperCase());
        return gifn.GetFile(sFileChooserTitle, sFileStartDir);
    }

  //
  // returns the image chunks
  //
    String getImage() {
        try {
            // BASE64Encoder encoder = new BASE64Encoder(); //MLT-7702
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
                // return encoder.encodeBuffer(buf); // MLT-7702
                return Base64.getEncoder().encodeToString(buf); // MLT-7702
            } else {
                iImgStart = iImgEnd = 0;
                numBytesRead = 0;
                return "";
            }
        } catch (Exception e) {
            System.out.println("getImage(): "+e.toString());
            e.printStackTrace();
        }
        return "";
    }

    // send a message back to Forms

    void sendMessage(String s1, String s2, String s3, String s4) {
        list_msg.clear();
        Messages msg = new Messages(DrawLAF.ITEM_ACTION_NAME, "");
        msg = new Messages(DrawLAF.ITEM_ACTION_NAME, s1);
        list_msg.add(msg);
        msg = new Messages(DrawLAF.ITEM_ACTION_TYPE, s2);
        list_msg.add(msg);
        msg = new Messages(DrawLAF.ITEM_ACTION_OBJECT, s3);
        list_msg.add(msg);
        msg = new Messages(DrawLAF.ITEM_ACTION_VALUE, s4);
        list_msg.add(msg);     
        try {
            dBean.dispatchanevent(DrawLAF.ITEM_ACTION, list_msg);
        } catch (Exception ex) {
        }
        ;
    }

    public void log(String sMessage) {
        if (bLog)
            System.out.println(sMessage);
    }


    /*---------------------------------------*
    *   create a KeyListener for the items
    *---------------------------------------*/

    void setKeyListener() {
        kl = new KeyListener() {
                public void keyPressed(KeyEvent e) {
                    // get the code
                    int iKey = e.getKeyCode();
                    // get the character
                    cChar = e.getKeyChar();
                    // get the modifier
                    iModifier = e.getModifiers();
                    sModifier = KeyEvent.getKeyModifiersText(iModifier);
                    /*
             * Inform Forms that a character was typed
             */
                    /*
             try{
               m_handler.setProperty(IMG_KEYCODE, ""+iKey);
               m_handler.setProperty(IMG_KEYCHAR, ""+cChar);
               m_handler.setProperty(IMG_KEYMOD, sModifier);
             }
             catch (Exception ex)
              {
                System.out.println("DispatchKeyEvent -> exception while dispatching: " + ex.toString());
              }
             CustomEvent ce = new CustomEvent(m_handler, IMG_KEYTYPED);
             dispatchCustomEvent(ce);
             */
                    switch (iKey) {
                    case KeyEvent.VK_ENTER:
                    case KeyEvent.VK_BACK_SPACE:
                    case KeyEvent.VK_TAB:
                    case KeyEvent.VK_CANCEL:
                    case KeyEvent.VK_CLEAR:
                    case KeyEvent.VK_SHIFT:
                    case KeyEvent.VK_CONTROL:
                    case KeyEvent.VK_ALT:
                    case KeyEvent.VK_PAUSE:
                    case KeyEvent.VK_CAPS_LOCK:
                    case KeyEvent.VK_ESCAPE:
                    case KeyEvent.VK_PAGE_UP:
                    case KeyEvent.VK_PAGE_DOWN:
                    case KeyEvent.VK_UP:
                    case KeyEvent.VK_DOWN:
                    case KeyEvent.VK_F1:
                    case KeyEvent.VK_F2:
                    case KeyEvent.VK_F3:
                    case KeyEvent.VK_F4:
                    case KeyEvent.VK_F5:
                    case KeyEvent.VK_F6:
                    case KeyEvent.VK_F7:
                    case KeyEvent.VK_F8:
                    case KeyEvent.VK_F9:
                    case KeyEvent.VK_F10:
                    case KeyEvent.VK_F11:
                    case KeyEvent.VK_F12:
                    case KeyEvent.VK_F13:
                    case KeyEvent.VK_F14:
                    case KeyEvent.VK_F15:
                    case KeyEvent.VK_F16:
                    case KeyEvent.VK_F17:
                    case KeyEvent.VK_F18:
                    case KeyEvent.VK_F19:
                    case KeyEvent.VK_F20:
                    case KeyEvent.VK_F21:
                    case KeyEvent.VK_F22:
                    case KeyEvent.VK_F23:
                    case KeyEvent.VK_F24:
                        try {
                            m_handler.setProperty(DrawLAF.IMG_KEYEVENT, e);
                        } catch (Exception ex) {
                            System.out.println("Unable to send key to Forms");
                        }
                    }
                }

                public void keyReleased(KeyEvent e) {
                }

                public void keyTyped(KeyEvent e) {
                }
            };
    }


    // listen to focus

    FocusListener newFocusListener() {
        return new FocusListener() {
            public void focusGained(FocusEvent e) {
                if (e.getComponent() == NEWIMAGE) {
                    bFocus = true;
                    // put the focus on the component
                    e.getComponent().requestFocus();
                    sendMessage(e.getComponent().getName(), "focus", "image", "gained");
                }
            }

            public void focusLost(FocusEvent e) {
                bFocus = false;
                sendMessage(e.getComponent().getName(), "focus", "image", "lost");
            }
        };
    }


    //
    // Handle the key typed event from the text field.
    //

    public void keyTyped(KeyEvent e) {
    }

    //
    // Handle the tabulation.
    //

    public void keyPressed(KeyEvent e) {
        int i = 0;
        String sComp = null;
        int iKey = (int)(e.getKeyChar());
        boolean bFound = false;
        // get the modifier
        int iModifier = e.getModifiers();
        String sModifier = KeyEvent.getKeyModifiersText(iModifier);
        if (iKey == e.VK_TAB) {
            sComp = e.getComponent().getName();

            e.consume();

            if (iModifier == e.SHIFT_MASK) {
                // find previous item
                for (i = 0; i < DrawLAF.ListItems.size(); i++) {
                    DrawLAF.newItem ni = (DrawLAF.newItem)DrawLAF.ListItems.get(i);
                    if (ni.sName.equalsIgnoreCase(sComp)) {
                        if (i > 0) {
                            repaint();
                            ni = (DrawLAF.newItem)DrawLAF.ListItems.get(i - 1);
                            ((Component)ni.cp).requestFocus();
                            bFound = true;
                            break;
                        }
                    }
                }
            } else {
                // find next item
                for (i = 0; i < DrawLAF.ListItems.size(); i++) {
                    DrawLAF.newItem ni = (DrawLAF.newItem)DrawLAF.ListItems.get(i);
                    if (ni.sName.equalsIgnoreCase(sComp)) {
                        if (i < DrawLAF.ListItems.size() - 1) {
                            ni = (DrawLAF.newItem)DrawLAF.ListItems.get(i + 1);
                            ((Component)ni.cp).requestFocus();
                            bFound = true;
                            break;
                        }
                    }
                }
            }
            if (!bFound) {
                if (DrawLAF.bItemNavInside) {
                    if (iModifier == e.SHIFT_MASK) {
                        // goto last item
                        DrawLAF.newItem ni = (DrawLAF.newItem)DrawLAF.ListItems.get(DrawLAF.ListItems.size() - 1);
                        ((Component)ni.cp).requestFocus();
                    } else {
                        // goto first item
                        DrawLAF.newItem ni = (DrawLAF.newItem)DrawLAF.ListItems.get(0);
                        ((Component)ni.cp).requestFocus();
                    }
                }
                // send back the key event to Forms
                else
                    DrawLAF.sendKeyBack(e);
            }
        }
    }

    //
    // Handle the key released event from the text field.
    //

    public void keyReleased(KeyEvent e) {
    }


}
