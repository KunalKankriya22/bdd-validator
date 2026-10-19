package oracle.forms.fd;

import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Component;
import java.awt.Cursor;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Insets;
import java.awt.Point;
import java.awt.RenderingHints;
import java.awt.datatransfer.Clipboard;
import java.awt.datatransfer.StringSelection;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.geom.Rectangle2D;

import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.swing.JTextField;
import javax.swing.border.Border;

import oracle.ewt.util.ClipboardProxy;

import oracle.forms.handler.IHandler;
import oracle.forms.properties.ID;
import oracle.forms.ui.VTextField;


/**
 * A XP like single-line Text Item
 * <br />
 * uses the Dispatching Bean from <b>Tom Cleymans</b>
 * to send back messages to Form
 * (see DrawLAF.java and DispatchingPJC.java).
 *
 * @author Francois Degrelle
 * creation  june 2007
 * @version 1.9
 *
 * August  10 2007 : add the Boilerplate feature that allows to have
 * a transparent single line with no border
 * and no background
 * June       2008 : add the focus painting background
 * July       2008 : switch HyperLink LABEL to JLabel
 * (to have transparent background)
 *
 */

public class LAF_XP_TextField extends VTextField implements FocusListener, KeyListener, Runnable {
    // regular expression properties
    public final static ID setProp = ID.registerProperty("SET");
    public final static ID setRegexKeep = ID.registerProperty("SET_REGEX_ERROR_BLOCKING");
    public final static ID setRegexModel = ID.registerProperty("SET_REGEX_PATTERN");
    public final static ID setRegexMessage = ID.registerProperty("SET_REGEX_MESSAGE");
    public final static ID getRegexString = ID.registerProperty("GET_REGEX_STRING");
    public final static ID getRegexResult = ID.registerProperty("GET_REGEX_RESULT");
    public final static ID getRegexGroup = ID.registerProperty("GET_REGEX_GROUP");
    public final static ID getRegexPos = ID.registerProperty("GET_REGEX_POSITION");
    public final static ID pRegexMsg = ID.registerProperty("REGEX_MSG");
    // messages
    public final static ID pSetEvent = ID.registerProperty("ENABLE_EVENTS");
    public final static ID pItemName = ID.registerProperty("ITEM_NAME");
    public final static ID pSendMsg = ID.registerProperty("SEND_MESSAGE");
    public final static ID pSendMsgBlocking = ID.registerProperty("SEND_MESSAGE_BLOCKING");
    public final static ID pMessage = ID.registerProperty("SEND_TEXTITEM_MSG");
    public final static ID pCursorMsg = ID.registerProperty("CURSOR_MESSAGE");
    public final static ID pCursorPos = ID.registerProperty("CURSOR_POSITION");
    public final static ID pKeyMsg = ID.registerProperty("KEY_MESSAGE");
    public final static ID pKeyCode = ID.registerProperty("KEY_CODE");
    public final static ID pKeyChar = ID.registerProperty("KEY_CHAR");
    public final static ID pKeyModifier = ID.registerProperty("KEY_MODIFIER");
    public final static ID pKeyChanged = ID.registerProperty("VALUE_CHANGED");
    // mouse events
    public final static ID pSetMouseEvents = ID.registerProperty("SET_MOUSE_EVENTS");
    public final static ID pEventMouseEvent = ID.registerProperty("MOUSEEVENT_MESSAGE");
    public final static ID pEventMouseMsg = ID.registerProperty("MOUSE_EVENT");
    // blinking properties
    public final static ID pStartBlink = ID.registerProperty("START_BLINK");
    public final static ID pStopBlink = ID.registerProperty("STOP_BLINK");
    public final static ID pSetBlinkFGColor = ID.registerProperty("SET_BLINK_FG_COLOR");
    public final static ID pSetBlinkBGColor = ID.registerProperty("SET_BLINK_BG_COLOR");
    public final static ID pSetBlinkRate = ID.registerProperty("SET_BLINK_RATE");
    // max char property
    public final static ID pSetMaxChar = ID.registerProperty("SET_MAX_CHAR");
    // cursor/selection positionning
    public final static ID pSetCurPos = ID.registerProperty("SET_CURSOR_POSITION");
    public final static ID pGetCurPos = ID.registerProperty("GET_CURSOR_POSITION");
    public final static ID pInsertText = ID.registerProperty("INSERT_TEXT");
    public final static ID pInsertTextAtPos = ID.registerProperty("INSERT_TEXT_AT_POSITION");
    public final static ID pSetSelIndex = ID.registerProperty("SET_SELECTION_INDEX");
    public final static ID pGetSelIndex = ID.registerProperty("GET_SELECTION_INDEX");
    public final static ID pGetSelValue = ID.registerProperty("GET_SELECTION_VALUE");
    // hyperlink
    public final static ID pSetHyperLink = ID.registerProperty("SET_HYPER_LINK");
    public final static ID pSetHLColors = ID.registerProperty("SET_HYPER_LINK_COLORS");
    public final static ID pSendHyperlink = ID.registerProperty("HYPER_LINK");
    public final static ID pSendHyperText = ID.registerProperty("HYPER_TEXT");
    // Boilerplate
    public final static ID setBoilerplate = ID.registerProperty("SET_BOILERPLATE");
    public final static ID setTransparent = ID.registerProperty("SET_TRANSPARENT");
    // gradient
    public final static ID setCurrent = ID.registerProperty("SET_CURRENT");
    public final static ID setGradient = ID.registerProperty("SET_GRADIENT");
    public final static ID setGradientSelColors = ID.registerProperty("SET_GRADIENT_SEL_COLORS");
    public final static ID setBorder = ID.registerProperty("SET_BORDER");
    // paint focus background
    public final static ID setFocusBG = ID.registerProperty("SET_FOCUS_BACKGROUND");
    // log
    public final static ID pSetLog = ID.registerProperty("SET_LOG");
    // enable/disable clipboard copy()/cut() and paste()
    public final static ID setCopyPaste = ID.registerProperty("SET_COPY_PASTE");
    // secret text
    public final static ID setSecretRange  = ID.registerProperty("SET_SECRET_RANGE");

    private DrawLAF dBean=null;
    private VTextField VTF;
    private Pattern pattern;
    private Matcher matcher;
    private String sRegexGroup = "";
    private String sRegexModel = null;
    private String sRegexMsg = null;
    private boolean bLog = false;
    private boolean bIsRegex = false;
    private boolean bRegexOk = true;
    private boolean bSendEvents = false;
    private boolean bFocus = false;
    private boolean bRollover = false;
    private boolean bVisible = true;
    private boolean bVisited = false;
    private boolean bFocusBG = false;
    private boolean bCanCopy = true;
    private boolean bCanPaste = true;
    private boolean bSecret = false;
    private boolean bCrypted = false;
    private boolean bExtended = false;
    private int iStart = 0;
    private int iEnd = 0;
    private int iCaretPos = -1;
    private int iSelStart = -1;
    private int iSelEnd = -1;
    private String sSelValue = null;
    private String sItemName = null;
    private int iKey = -1;
    private int iCode = -1;
    private int iModifier = -1;
    private int iBorder = 1;
    private int iSecretStart = -1;
    private int iSecretEnd = -1;
    private int iCurrent = -1;
    private String sOriginal = "";
    private String sCrypted = null;
    private String sModifier = null;
    private String sSecretChar = "*";
    private char cChar;
    private Color cFocus = DrawLAF.cFocus != null ? DrawLAF.cFocus : new Color(255, 214, 47);
    private Color cSelect = DrawLAF.cSelect != null ? DrawLAF.cSelect : new Color(0, 230, 0);
    private Color cHyperLink = Color.blue;
    private Color cLinkVisited = new Color(155, 0, 155);
    private Color cBorder = null;
    private Color cBak = null;
    private Color bgColor = null;
    private Color fgColor = null;
    private static boolean bAllLinksUseColors = false;
    public static Color cAllHyperLink = Color.blue;
    public static Color cAllLinkVisited = new Color(155, 0, 155);

    private Thread runner;
    private int seconds = 400; // blinking time in milliseconds
    private Color cdefFG = this.getForeground(); // default background color
    private Color cdefBG = this.getBackground(); // default foreground color
    private Color cFore = this.getBackground(); // blinking foreground color
    private Color cBack = null; // blinking background color
    private boolean bSwitch = true;

    private boolean bHyperLink = false;
    private String sHyperLink = null;
    private String sLink = null;
    private HyperLink Link = null;
    private Process p = null;
    private javax.swing.JTextField jt = null;

    private List list_msg = new ArrayList(10);
    private boolean bFirst = true;
    private ImageKit ik = null;

    // mouse events
    private boolean bMouseEnter = false;
    private boolean bMouseClick = false;
    private boolean bMouseExit = false;

    public void init(IHandler handler) {
        super.init(handler);
        // add mouse listener
        addMouseListener(new ButtonMouseAdapter());
        // add focus listener
        addFocusListener(this);
        // add key listener
        addKeyListener(this);
        VTF = this;
    }

    public void destroy() {
        dBean = null;
    }

    public void cut() {
        canCopyPaste("cut");
    }

    public void copy() {
        canCopyPaste("copy");
    }

    public void paste() {
        canCopyPaste("paste");
    }

    void setLAFBean(DrawLAF DF) {
        dBean = DF;
    }

    DrawLAF getLAFBean() {
        return dBean;
    }

    void setTextContent(String s) {
        this.setText(s);
    }

    // set colors for every link

    public static void setAllHLColors(Color c1, Color c2) {
        cAllHyperLink = c1;
        cAllLinkVisited = c2;
        bAllLinksUseColors = true;
    }

    public void paint(Graphics g) {
        if (!bHyperLink) {
            if (DrawLAF.cSelect != null)
                cSelect = DrawLAF.cSelect;
            else {
                if (DrawLAF.Current_Color == DrawLAF.SILVER_SCHEME) {
                    cSelect = Color.gray;
                } else if (DrawLAF.Current_Color == DrawLAF.YELLOW_SCHEME) {
                    cSelect = new Color(150, 150, 0);
                } else if (DrawLAF.Current_Color == DrawLAF.XP_SCHEME)
                    cSelect = DrawLAF.XP_SCHEME;
                else
                    cSelect = DrawLAF.Current_Color;
            }
            cFocus = cSelect;
            if (this.isVisible())
                super.paint(g);
            // draw the focus mark
            Graphics gg = this.getParent().getGraphics(); // to draw on canevas
            Graphics2D g2 = (Graphics2D)gg.create();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            if ((bRollover || bFocus) && DrawLAF.bDrawFocusLine) {
                g2.setColor(cFocus);
                g2.setStroke(new BasicStroke(1f));
                g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.8f));
                g2.drawRoundRect((int)this.getBounds().x - 1, (int)this.getBounds().y - 1,
                                 (int)this.getBounds().getWidth() + 1, (int)this.getBounds().getHeight() + 1, 6, 6);
            }
            g2.dispose();
        }
    }


   /*---------------------------*
   *    Set some properties    *
   *---------------------------*/
    public boolean setProperty(ID property, Object value) {
        log(property + ":" + value);

        if (property == setSecretRange) {
            String s = value.toString();
            String s1 = null, s2 = null;
            int i1, i2;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                try {
                    s1 = st.nextToken();
                    s2 = st.nextToken();
                    i1 = Integer.parseInt(s1);
                    i2 = Integer.parseInt(s2);
                    if ((i1 == 0) && (i2 == 0)) {
                        bSecret = false;
                        VTF.setText(sOriginal);
                        return true;
                    }
                    if (i1 < 1) {
                        System.out.println("setSecretRange() start must be >= 1");
                        bSecret = false;
                        return false;
                    }
                    if (i2 < 1) {
                        System.out.println("setSecretRange() end must be >= 1");
                        bSecret = false;
                        return false;
                    }
                    if (i2 < i1) {
                        System.out.println("setSecretRange() end must be greater or equal than start");
                        bSecret = false;
                        return false;
                    }
                    bSecret = true;
                    iSecretStart = i1 - 1;
                    iSecretEnd = i2 - 1;
                    sCrypted = getCrypted();
                    VTF.setText(sCrypted);
                } catch (Exception ex) {
                    System.out.println("setSecretRange() incorrect values: " + s + "  should be: start,end[,secret_char]");
                    ex.printStackTrace();
                    bSecret = false;
                }
                if (st.hasMoreTokens()) {
                    s1 = st.nextToken();
                    if(s1.length()==1) {
                        sSecretChar = s1 ;
                    }
                }
            }
            return true;
        }
        // set the pattern model
        else if (property == setRegexModel) {
            sRegexModel = value.toString();
            if (sRegexModel != null)
                bIsRegex = true;
            else
                bIsRegex = false;
            return true;
        }
        // set boilerplate (not editable, transparent and no border)
        else if (property == setBoilerplate) {
            String s = value.toString();
            if (s.equalsIgnoreCase("off")) {
                if (null != jt) {
                    this.setText(jt.getText());
                    this.getParent().remove(jt);
                    this.setVisible(true);
                }
            } else {
                log("boilerplate");
                jt = new javax.swing.JTextField();
                jt.setBounds(this.getBounds());
                jt.setBackground(null);
                jt.setOpaque(false);
                jt.setText(this.getText());
                jt.setBorder(null);
                jt.setEditable(false);
                jt.setFont(this.getFont());
                jt.setForeground(this.getForeground());
                this.getParent().add(jt);
                this.setVisible(false);
            }
            return true;
        }
        // set transparent
        else if (property == setTransparent) {
            String s = value.toString();
            if (s.equalsIgnoreCase("off")) {
                if (null != jt) {
                    this.setText(jt.getText());
                    this.getParent().remove(jt);
                    this.setVisible(true);
                }
            } else {
                log("transparent");
                jt = new NewTextField2(this);
                jt.setBounds(this.getBounds());
                this.setBackground(null);
                if (this.getAlignment() <= 1)
                    jt.setHorizontalAlignment(JTextField.LEFT);
                else if (this.getAlignment() == 2)
                    jt.setHorizontalAlignment(JTextField.RIGHT);
                else if (this.getAlignment() == 3)
                    jt.setHorizontalAlignment(JTextField.CENTER);
                jt.setBackground(null);
                jt.setOpaque(false);
                jt.setText(this.getText());
                jt.setBorder(null);
                jt.setEditable(false);
                jt.setFont(this.getFont());
                jt.setForeground(this.getForeground());
                this.getParent().add(jt, 0);
                this.setVisible(false);
            }
            return true;
        }
        // set gradient
        else if (property == setGradient) {
            String s = value.toString();
            String s1 = null, s2 = null, s3 = null, s4 = null, s5 = "null";
            StringTokenizer st = new StringTokenizer(s, ",");
            if (s.equalsIgnoreCase("null")) {
                if (null != jt) {
                    this.getParent().remove(jt);
                    jt = null;
                    this.setVisible(true);
                    bExtended = false ;
                }
                return true;
            }
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
            } else
                return false;
            if (st.hasMoreTokens()) {
                s2 = st.nextToken();
            } else
                return false;
            if (st.hasMoreTokens()) {
                s3 = st.nextToken();
                if(s3.equalsIgnoreCase("-")) s3 = null ;
            }
            if (st.hasMoreTokens()) {
                s4 = st.nextToken();
                if(s4.equalsIgnoreCase("-")) s4 = null ;
            }
            if (st.hasMoreTokens()) {
                s5 = st.nextToken();
            }            
            jt = new NewTextField2(this);
            bExtended = true ;
            ((NewTextField2)jt).setLAFBean(dBean);
            jt.setBounds(this.getBounds());
            if (this.getAlignment() <= 1)
                jt.setHorizontalAlignment(JTextField.LEFT);
            else if (this.getAlignment() == 2)
                jt.setHorizontalAlignment(JTextField.RIGHT);
            else if (this.getAlignment() == 3)
                jt.setHorizontalAlignment(JTextField.CENTER);
            jt.setBackground(null);
            jt.setOpaque(false);
            jt.setText(this.getText());
            jt.setBorder(null);
            jt.setEditable(true);
            jt.setFont(this.getFont());
            jt.setForeground(this.getForeground());
            jt.setEditable(this.isEditable());
            Color c1 = null, c2 = null, c3 = null, c4 = null;
            if (null != s1 && null != s2) {
                c1 = ik.getInstance().makeColor(s1);
                c2 = ik.getInstance().makeColor(s2);
                if (null != s3)
                    c3 = ik.getInstance().makeColor(s3);
                if (null != s4)
                    c4 = ik.getInstance().makeColor(s4);
                ((NewTextField2)jt).setGradient(c1, c2, c3, c4, s5);
                jt.invalidate();
            }
            this.getParent().add(jt,0);
            this.setVisible(false);
            return true;
        }
        // Gradient select colors
        else if (property == setGradientSelColors) {
            String s = value.toString();
            String s1 = null;
            Color cBak,cFore;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                cBak = ik.getInstance().makeColor(s1);
            }
            else {
                return false ;
            }
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                cFore = ik.getInstance().makeColor(s1);
            }
            else {
                return false ;
            }            
            if(jt != null){
                jt.setSelectionColor(cBak);
                jt.setSelectedTextColor(cFore);            
            }
            return true ;
        }
        // set the border
        else if (property == setBorder) {
            String s = value.toString();
            String s1 = null, s2 = null;
            int w = 1;
            Color c = Color.black;
            int iPos = s.indexOf(",");
            if (iPos < 0)
                return false;
            s1 = s.substring(0, iPos);
            s2 = s.substring(iPos + 1);
            try {
                w = Integer.parseInt(s1);
                c = ik.getInstance().makeColor(s2);
            } catch (Exception ex) {
                return false;
            }
            if (null != jt) {
                cBorder = c;
                iBorder = w;
                ((NewTextField2)jt).setBorder(w, c);
            }
            return true;
        }
        // current record
        else if (property == setCurrent) {
            String s = value.toString();
            if (null != jt) {
                if (s.equalsIgnoreCase("true"))
                    ((NewTextField2)jt).setCurrent(true);
                else
                    ((NewTextField2)jt).setCurrent(false);
            }
            return true;
        }
        // set the error message
        else if (property == setRegexMessage) {
            sRegexMsg = value.toString();
            return true;
        }
        // enable events ?
        else if (property == pSetEvent) {
            String s = value.toString(), sVal = "";
            int iPos;
            iPos = s.indexOf(",");
            if (iPos < 0)
                return false;
            sItemName = s.substring(0, iPos);
            sVal = s.substring(iPos + 1);
            if (sVal.equalsIgnoreCase("true"))
                bSendEvents = true;
            else
                bSendEvents = false;
            return true;
        }
        //
        //
        // blinking properties
        //
        else if (property == pStartBlink) // start the blinking
        {
            cdefFG = this.getForeground();
            cdefBG = this.getBackground();
            startTimer();
            return true;
        } else if (property == pStopBlink) // stop the blinking
        {
            stopTimer();
            this.setBackground(cdefBG);
            this.setForeground(cdefFG);
            return true;
        } else if (property == pSetBlinkRate) // set the cursor blink rate
        {
            try {
                int i = Integer.parseInt(value.toString());
                seconds = i;
            } catch (Exception e) {
                return false;
            }
            return true;
        } else if (property == pSetBlinkFGColor) // set the foreground color
        {
            cFore = ik.getInstance().makeColor(value.toString());
            return true;
        } else if (property == pSetBlinkFGColor) // set the background color
        {
            cBack = ik.getInstance().makeColor(value.toString());
            return true;
        }
        //
        // set the maximum characters
        //
        else if (property == pSetMaxChar) {
            int iMax = Integer.parseInt(value.toString());
            if (this.getText().length() > iMax)
                setText(this.getText().substring(0, iMax));
            this.setMaximumChars(iMax);
            return true;
        }

        //
        //   cursor/selection properties
        //
        // caret position
        else if (property == pSetCurPos) {
            int iPos = 0;
            try {
                iPos = Integer.parseInt(value.toString()) - 1;
                this.requestFocus();
                this.setCaretPosition(iPos);
            } catch (Exception e) {
            }
            return true;
        }

        // insert text
        else if (property == pInsertText) {
            String s = value.toString();
            try {
                this.requestFocus();
                this.insert(s, this.getCaretPosition() + 1);
            } catch (Exception e) {
            }
            return true;
        }

        // insert text at position
        else if (property == pInsertTextAtPos) {
            String s = value.toString();
            String sText = "", sPos = "";
            int iPos;
            iPos = s.indexOf(",");
            if (iPos < 0)
                return false;
            sPos = s.substring(0, iPos);
            sText = s.substring(iPos + 1);
            try {
                iPos = Integer.parseInt(sPos);
            } catch (Exception e) {
                return false;
            }
            try {
                this.requestFocus();
                this.insert(sText, iPos - 1);
            } catch (Exception e) {
            }
            return true;
        }

        // selection bounds
        else if (property == pSetSelIndex) {
            String s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            int iStart = 0, iEnd = 0;
            if (st.hasMoreTokens()) {
                try {
                    iStart = Integer.parseInt(st.nextToken()) - 1;
                } catch (Exception e) {
                }
            } else
                return false;
            if (st.hasMoreTokens()) {
                try {
                    iEnd = Integer.parseInt(st.nextToken());
                } catch (Exception e) {
                }
            } else
                return false;
            if (iStart > -1 && iEnd > -1) {
                this.requestFocus();
                this.setSelectionStart(iStart);
                this.setSelectionEnd(iEnd);
            }
            return true;
        }

        // hyperlink
        else if (property == pSetHyperLink) {
            if (bAllLinksUseColors) {
                cHyperLink = cAllHyperLink;
                cLinkVisited = cAllLinkVisited;
            }
            String sL = "";
            String s = value.toString();
            if (s == null) {
                bHyperLink = false;
                sHyperLink = null;
                Link = null;
                sLink = null;
                this.setCursor(new Cursor(Cursor.DEFAULT_CURSOR));
                return true;
            }
            StringTokenizer st = new StringTokenizer(s, ",");
            // link
            if (st.hasMoreTokens()) {
                sL = st.nextToken();
            } else
                return false;

            sHyperLink = sL;
            bHyperLink = true;
            // use a Label to simulate the HyperLink
            sLink = getText();
            Link = new HyperLink();
            Link.setLocation((this.getBounds().x + 10), this.getBounds().y);
            Link.setForeground(cHyperLink);
            Link.setFont(getFont());
            Link.setSize(getSize());
            Link.addMouseListener(new ButtonMouseAdapter());
            Link.setCursor(new Cursor(Cursor.HAND_CURSOR));
            this.setVisible(false);
            this.getParent().add(Link, 0);
            Link.repaint();
            return true;
        }

        // hyper link colors
        else if (property == pSetHLColors) {
            String s = value.toString(), sColor = "";
            StringTokenizer st = new StringTokenizer(s, ",");
            // link
            if (st.hasMoreTokens()) {
                sColor = st.nextToken();
                cAllHyperLink = cHyperLink = ik.getInstance().makeColor(sColor);
                this.setForeground(cHyperLink);
            } else
                return false;

            // link visited
            if (st.hasMoreTokens()) {
                sColor = st.nextToken();
                cAllLinkVisited = cLinkVisited = ik.getInstance().makeColor(sColor);
            }
            if (Link != null)
                Link.repaint();
            return true;
        }

        // value changed
        else if (property == ID.VALUE) {
            if (Link != null) {
                sLink = value.toString();
                Link.repaint();
            }
            if (jt != null) {
                jt.setText(value.toString());
            }
            if (bSecret) {
                fgColor = this.getForeground();
                bgColor = this.getBackground();
                super.setProperty(property, value);
                sOriginal = value.toString();
                sCrypted = getCrypted();
                VTF.setText(sCrypted);
                iCurrent = sOriginal.length() + 1;
                return true;
            }
            super.setProperty(property, value);
            return true;
        }

        // background color
        else if (property == ID.BACKGROUND) {
            cdefBG = (Color)value;
            return super.setProperty(property, value);
        }

        // foreground color
        else if (property == ID.FOREGROUND) {
            cdefFG = (Color)value;
            return super.setProperty(property, value);
        }

        else if (property == ID.FOCUS) {
            if (null != jt && (value.equals(new Boolean("true")))) {
                if(!bExtended) jt.requestFocus();
            }     
            return super.setProperty(property, value);
        }

        // visible
        else if (property == ID.VISIBLE) {
            if (value.toString().equalsIgnoreCase("true"))
                bVisible = true;
            else
                bVisible = false;
            if (Link != null) {
                //Link.setVisible(bVisible);
                if (bVisible)
                    Link.setForeground(cHyperLink);
                else
                    Link.setForeground(this.getBackground());
            }
            if (jt != null)
                jt.setVisible(bVisible);

            return super.setProperty(property, value);
        }

        // enable
        else if (property == ID.ENABLED) {
            if (Link != null && bVisible) {
                if (value.toString().equalsIgnoreCase("true"))
                    Link.setEnabled(true);
                else
                    Link.setEnabled(false);
                Link.repaint();
            }
            return super.setProperty(property, value);
        }

        // position
        else if (property == ID.LOCATION) {
            if (Link != null) {
                Point pt = (Point)value;
                Link.setLocation(pt);
            }
            if (jt != null) {
                Point pt = (Point)value;
                jt.setLocation(pt);
            }
            return super.setProperty(property, value);
        }

        // paint the focus background ?
        else if (property == setFocusBG) {
            String s = value.toString();
            if (s.equalsIgnoreCase("true"))
                bFocusBG = true;
            else
                bFocusBG = false;
            return true;
        }

        // log
        else if (property == pSetLog) {
            String s = value.toString();
            if (s.equalsIgnoreCase("true"))
                bLog = true;
            else
                bLog = false;
            return true;
        }

        // enable/disable clipboard copy()/cut() and paste()
        else if (property == setCopyPaste) {
            String s = value.toString(), s1 = "-", s2 = "-";
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                s1 = st.nextToken();
            if (st.hasMoreTokens())
                s2 = st.nextToken();
            if (s1.equalsIgnoreCase("true"))
                bCanCopy = true;
            else if (s1.equalsIgnoreCase("false"))
                bCanCopy = false;
            if (s2.equalsIgnoreCase("true"))
                bCanPaste = true;
            else if (s2.equalsIgnoreCase("false"))
                bCanPaste = false;
            return true;
        }

        // mouse events
        else if (property == pSetMouseEvents) {
            String s = (String)value;
            String s1 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                // mouse enter
                s1 = st.nextToken();
                if (s1.equalsIgnoreCase("true")) {
                    bMouseEnter = true;
                } else {
                    bMouseEnter = false;
                }
            }
            if (st.hasMoreTokens()) {
                // mouse exit
                s1 = st.nextToken();
                if (s1.equalsIgnoreCase("true")) {
                    bMouseExit = true;
                } else {
                    bMouseExit = false;
                }
            }
            if (st.hasMoreTokens()) {
                // mouse click
                s1 = st.nextToken();
                if (s1.equalsIgnoreCase("true")) {
                    bMouseClick = true;
                } else {
                    bMouseClick = false;
                }
            }
            return true;
        }

        else {
            return super.setProperty(property, value);
        }
    }

  /*-------------------------
   *   Get the properties
   *------------------------*/
    public Object getProperty(ID pId) // Get the current pressed button ID
    {

        //
        // get the boolean result
        //
        if (pId == getRegexResult) {
            return "" + bRegexMatch(sRegexModel, this.getText());
        }

        //
        // get the corresponding group
        //
        else if (pId == getRegexGroup) {
            return "" + sRegexGroup;
        }

        //
        // get the start and end position in the string
        //
        else if (pId == getRegexPos) {
            if (iStart > -1)
                return "" + iStart + "," + iEnd;
            else
                return "";
        }

        //
        // get selection index
        //
        else if (pId == pGetSelIndex) {
            return "" + (this.getSelectionStart() + 1) + "," + (this.getSelectionEnd() + 1);
        }

        //
        // get selection value
        //
        else if (pId == pGetSelValue) {
            return "" + this.getSelectedText();
        }

        //
        // get cursor position
        //
        else if (pId == pGetCurPos) {
            return "" + this.getCaretPosition() + 1;
        } 
        
        else if (pId == ID.VALUE) {
            if (bSecret) {
                return sOriginal;
            }
            else {
                return super.getProperty(pId);
            }
        }

        else {
            return super.getProperty(pId);
        }

    }

  /*---------------------------------*
   *   Regular expression matching   *
   *---------------------------------*/
    public boolean bRegexMatch(String p_pattern, String p_string) {
        if (p_pattern == null || p_string == null)
            return true;
        pattern = Pattern.compile(p_pattern);
        matcher = pattern.matcher(p_string);
        if (matcher.find()) {
            sRegexGroup = matcher.group();
            iStart = matcher.start();
            iEnd = matcher.end();
            bRegexOk = true;
            return true;
        } else {
            sRegexGroup = "";
            iStart = -1;
            iEnd = -1;
            if (sRegexMsg != null) {
                bRegexOk = false;
                log("Regex error : dispatch event");
                if (bSendEvents) {
                    list_msg.clear();
                    Messages msg = new Messages(pKeyCode, "" + iCode);
                    msg = new Messages(pItemName, sItemName);
                    list_msg.add(msg);
                    msg = new Messages(pMessage, sRegexMsg);
                    list_msg.add(msg);
                    try {
                        if (dBean != null)
                            dBean.dispatchanevent(pSendMsg, list_msg);
                    } catch (Exception e) {
                    }
                    ;
                }
            }
            return false;
        }
    }

    private void repaintParent() {
        try {
            this.getParent().repaint((int)this.getBounds().x - 5, (int)this.getBounds().y - 5,
                                     (int)this.getBounds().getWidth() + 10, (int)this.getBounds().getHeight() + 10);
            repaint();
        } catch (Exception e) {
            ;
        }
    }
    /*---------------------------------------------*
     * Private class to handle user mouse actions
     *---------------------------------------------*/
    class ButtonMouseAdapter extends MouseAdapter {
        /*
         * User moved the mouse over the component
         */

        public void mouseEntered(MouseEvent me) {
            bRollover = true;
            if (bHyperLink)
                VTF.setForeground(cHyperLink);
            repaint();
            if (bMouseEnter) {
                if (dBean != null) {
                    list_msg.clear();
                    Messages msg = new Messages(pEventMouseMsg, "ENTER");
                    list_msg.add(msg);
                    msg = new Messages(pItemName, sItemName);
                    list_msg.add(msg);
                    try {
                        dBean.dispatchanevent(pEventMouseEvent, list_msg);
                    } catch (Exception ex) {
                    }
                    ;
                }
            }
        }

        /*
         * User moved the mouse out of the component
         */

        public void mouseExited(MouseEvent me) {
            bRollover = false;
            if (bHyperLink)
                VTF.setForeground(cHyperLink);
            repaintParent();
            if (bMouseEnter) {
                if (dBean != null) {
                    list_msg.clear();
                    Messages msg = new Messages(pEventMouseMsg, "EXIT");
                    list_msg.add(msg);
                    msg = new Messages(pItemName, sItemName);
                    list_msg.add(msg);
                    try {
                        dBean.dispatchanevent(pEventMouseEvent, list_msg);
                    } catch (Exception ex) {
                    }
                    ;
                }
            }
        }

        /*
         * User click
         */

        public void mouseClicked(MouseEvent me) {
            if (bHyperLink) {
                log("link->" + sHyperLink);
                bVisited = true;
                if (bSendEvents) {
                    list_msg.clear();
                    Messages msg = new Messages(pItemName, sItemName);
                    list_msg.add(msg);
                    msg = new Messages(pSendHyperText, sHyperLink);
                    list_msg.add(msg);
                    try {
                        if (dBean != null)
                            dBean.dispatchanevent(pSendHyperlink, list_msg);
                    } catch (Exception e) {
                    }
                    ;
                }
                Point pt = new Point(0, 0);
                VTF.setProperty(ID.SELECTION, pt);
            }
            if (bMouseClick) {
                if (dBean != null) {
                    list_msg.clear();
                    Messages msg = new Messages(pEventMouseMsg, "CLICK");
                    list_msg.add(msg);
                    msg = new Messages(pItemName, sItemName);
                    list_msg.add(msg);
                    try {
                        dBean.dispatchanevent(pEventMouseEvent, list_msg);
                    } catch (Exception ex) {
                    }
                    ;
                }
            }
        }
    }

    /*----------------------------------*
     *  Standard component focus handle
     *----------------------------------*/
    public void focusGained(FocusEvent e) {
        try {
            bFocus = true;
            if (bFocusBG || DrawLAF.bFocusBG) {
                this.setBackground(DrawLAF.Current_Color_Light);
                this.setForeground(Color.BLACK);
            }
            if (bHyperLink) {
                Point pt = new Point(0, 0);
                this.setProperty(ID.SELECTION, pt);
            }
            if (this.isEnabled())
                repaint();
        } catch (Exception ex) {
        }
    }

    public void focusLost(FocusEvent e) {
        if (bFocusBG || DrawLAF.bFocusBG) {
            this.setBackground(cdefBG);
            this.setForeground(cdefFG);
        }
        if (this.isEnabled())
            repaintParent();
        bFocus = false;
        Point pt = new Point(0, 0);
        this.setProperty(ID.SELECTION, pt);
    }


    /**
     * Utility function to print out a debug message to the Java Console
     * @param msg string to display, this will be prefixed with the classname of the PJC
     */
    public void log(String msg) {
        if (bLog)
            System.out.println("LAF_XP_TextField(): " + msg);
    }


    //
    // Handle the key typed event from the text field.
    //
    public void keyTyped(KeyEvent e) {
    }

    //
    // Handle the key pressed event from the text field.
    //
    public void keyPressed(KeyEvent e) {
        iKey = e.getKeyChar();
        iCode = e.getKeyCode();
        cChar = e.getKeyChar();
        // get the modifier
        iModifier = e.getModifiers();
        sModifier = KeyEvent.getKeyModifiersText(iModifier);
        iCaretPos = VTF.getCaretPosition();
        if (bSecret) {
            if ((iCode == KeyEvent.VK_HOME || iCode == KeyEvent.VK_END || iCode == KeyEvent.VK_RIGHT ||
                 iCode == KeyEvent.VK_LEFT) &&
                (iModifier == KeyEvent.SHIFT_MASK || iModifier == (KeyEvent.CTRL_MASK + KeyEvent.SHIFT_MASK))) {
                e.consume();
                return;
            }
            iCurrent = VTF.getCaretPosition();
            if (bFocusBG || DrawLAF.bFocusBG) {
                VTF.setForeground(DrawLAF.Current_Color_Light);
            } else {
                VTF.setForeground(this.getBackground());
            }
            bCrypted = false;
            VTF.setText(sOriginal);
            try {
                VTF.setCaretPosition(iCurrent);
            } catch (Exception ex) {
            }
            return;
        } else {
            if (iCode >= 32) {
                log("caret position=" + iCaretPos);
                log("key pressed=" + iCode);
                log("char=" + cChar);
                log("modifier=" + sModifier);
            }
            if (bSendEvents) {
                // cursor position
                list_msg.clear();
                Messages msg = new Messages(pCursorPos, "" + (iCaretPos - 1));
                list_msg.add(msg);
                msg = new Messages(pItemName, sItemName);
                list_msg.add(msg);
                try {
                    if (dBean != null)
                        dBean.dispatchanevent(pCursorMsg, list_msg);
                } catch (Exception ex) {
                }
                ;
                // key pressed
                list_msg.clear();
                msg = new Messages(pKeyCode, "" + iCode);
                list_msg.add(msg);
                msg = new Messages(pKeyChar, "" + cChar);
                list_msg.add(msg);
                msg = new Messages(pKeyModifier, sModifier);
                list_msg.add(msg);
                msg = new Messages(pItemName, sItemName);
                list_msg.add(msg);
                // send back the event to Forms
                try {
                    if (dBean != null)
                        dBean.dispatchanevent(pKeyMsg, list_msg);
                } catch (Exception ex) {
                }
                ;
            }
        }
    }

    //
    // Handle the key released event from the text field.
    //
    public void keyReleased(KeyEvent e) {
        if (null != jt) {
            jt.setText(VTF.getText());
        }
        if (bSecret) {
            VTF.setForeground(fgColor);
            iCurrent = VTF.getCaretPosition();
            sCrypted = getCrypted();
            VTF.setText(sCrypted);
            bCrypted = true;
            VTF.setCaretPosition(iCurrent);
        }
    }

    /*--------------------------------------------------*
     *   switch color to simulate the blinking process  *
     *--------------------------------------------------*/
    public void run() {
        Thread theThread = Thread.currentThread();
        while (runner == theThread) {
            try {
                Thread.sleep(seconds);
            } catch (InterruptedException e) {
            }
            if (bSwitch) {
                if (cBack != null)
                    this.setBackground(cBack);
                if (cFore != null)
                    this.setForeground(cFore);
            } else {
                this.setBackground(cdefBG);
                this.setForeground(cdefFG);
            }
            bSwitch = !bSwitch;
        }
    }

    private void startTimer() {
        if (runner == null) {
            runner = new Thread(this);
            runner.start();
        }
    }

    private void stopTimer() {
        if (runner != null) {
            runner = null;
            try {
                Thread.sleep(seconds);
            } catch (InterruptedException e) {
            }
            this.setBackground(cdefBG);
            this.setForeground(cdefFG);
        }
    }

   /*------------------------------*
    *  class to draw the hyperlink
    *------------------------------*/
    class HyperLink extends javax.swing.JLabel {
        public HyperLink() {
        }

        public void paint(Graphics g) {
            if (sLink == null)
                return;
            Graphics2D g2 = (Graphics2D)g;
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g2.setFont(VTF.getFont());
            if (VTF.isEnabled()) {
                if (bAllLinksUseColors) {
                    cHyperLink = cAllHyperLink;
                    cLinkVisited = cAllLinkVisited;
                }
                if (bVisited)
                    g2.setColor(cLinkVisited);
                else
                    g2.setColor(cHyperLink);
            } else
                g2.setColor(Color.gray);
            oracle.ewt.util.ImmInsets imm = VTF.getBorderInsets();
            int iGap = imm.left;
            Font f = getFont();
            FontMetrics fm = getFontMetrics(f);
            int x1 = iGap;
            int y1 = (int)(VTF.getBounds().getHeight() / 2) + (int)(fm.getHeight() / 2);
            int x2 = fm.stringWidth(sLink);
            if (VTF.getAlignment() == 2)
                x1 = (int)(VTF.getBounds().getWidth() - x2 - iGap);
            else if (VTF.getAlignment() == 3)
                x1 = (int)(VTF.getBounds().getWidth() / 2 - (x2 / 2));
            g2.drawString(sLink, x1, y1 - 2);
            g2.drawLine(x1, y1 - 1, x1 + x2, y1 - 1);
            g2.dispose();
            if (null != jt) {
                jt.setBounds(this.getBounds());
            }
        }
    }

    // enable/disable clipboard operations
    private void canCopyPaste(String s) {
        StringSelection lss = null;
        if (s.equalsIgnoreCase("paste")) {
            if (bCanPaste)
                super.paste();
        } else {
            if (!bCanCopy) {
                lss = new StringSelection("");
                Clipboard localClipboard = ClipboardProxy.getSystemClipboard();
                localClipboard.setContents(lss, lss);
            } else if (s.equalsIgnoreCase("copy"))
                super.copy();
            else
                super.cut();
        }
    }

  /*
   * encrypt the string
   */
    String getCrypted() {
        StringBuffer sb = new StringBuffer();
        int i = 0;
        if (!bCrypted)
            sOriginal = this.getText();
        if (iSecretStart + iSecretEnd == -2) {
            sb.append(sOriginal);
        } else {
            try {
                for (i = 0; i < sOriginal.length(); i++) {
                    if (i >= iSecretStart && i <= iSecretEnd)
                        sb.append(sSecretChar);
                    else
                        sb.append(sOriginal.charAt(i));
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
        log("original(" + sOriginal + ")");
        log("crypted (" + sb.toString() + ")");
        return sb.toString();
    }

    public static class PulsatingBorder implements Border {
        private float thickness = 0.0f;
        private Component c;

        public PulsatingBorder(Component c) {
            this.c = c;
        }

        public void paintBorder(Component c, Graphics g, int x, int y, int width, int height) {
            Graphics2D g2 = (Graphics2D)g.create();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            Rectangle2D r = new Rectangle2D.Double(x, y, width - 1, height - 1);
            g2.setStroke(new BasicStroke(2.0f * getThickness()));
            g2.setColor(new Color(0x54A4DE));
            g2.draw(r);
        }

        public Insets getBorderInsets(Component c) {
            return new Insets(2, 2, 2, 2);
        }

        public boolean isBorderOpaque() {
            return false;
        }

        public float getThickness() {
            return thickness;
        }

        public void setThickness(float thicness) {
            this.thickness = thickness;
            c.repaint();
        }
    }
}
