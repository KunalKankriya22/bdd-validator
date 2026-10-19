package oracle.forms.fd;


import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Event;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GraphicsEnvironment;
import java.awt.GridLayout;
import java.awt.Point;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;

import java.lang.reflect.Method;

import java.net.URL;

import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.ActionMap;
import javax.swing.BorderFactory;
import javax.swing.InputMap;
import javax.swing.JButton;
import javax.swing.JColorChooser;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JEditorPane;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextPane;
import javax.swing.KeyStroke;
import javax.swing.SwingUtilities;
import javax.swing.ToolTipManager;
import javax.swing.UIManager;
import javax.swing.border.EtchedBorder;
import javax.swing.event.HyperlinkEvent;
import javax.swing.event.HyperlinkListener;
import javax.swing.event.UndoableEditEvent;
import javax.swing.event.UndoableEditListener;
import javax.swing.text.AttributeSet;
import javax.swing.text.BadLocationException;
import javax.swing.text.DefaultHighlighter;
import javax.swing.text.Document;
import javax.swing.text.Element;
import javax.swing.text.Highlighter;
import javax.swing.text.MutableAttributeSet;
import javax.swing.text.SimpleAttributeSet;
import javax.swing.text.StyleConstants;
import javax.swing.text.StyledDocument;
import javax.swing.text.StyledEditorKit;
import javax.swing.text.html.HTMLDocument;
import javax.swing.text.html.HTMLEditorKit;
import javax.swing.text.html.HTMLFrameHyperlinkEvent;
import javax.swing.undo.CannotRedoException;
import javax.swing.undo.CannotUndoException;
import javax.swing.undo.UndoManager;

import oracle.ewt.lwAWT.lwText.LWCommonText;

import oracle.forms.engine.Main;
import oracle.forms.handler.IHandler;
import oracle.forms.properties.ID;
import oracle.forms.ui.VTextArea;


/**
 * A XP like multi-line Text Item
 *
 *   uses the Dispatching Bean from <b>Tom Cleymans</b>
 *   to send back messages to Form
 *   (see DrawLAF.java and DispatchingPJC.java)
 *
 * @author   Francois Degrelle
 * creation  june 2007
 * @version  2.1  (902,904,1012)
 */
   
public class LAF_XP_TextArea extends VTextArea implements FocusListener, HyperlinkListener, ActionListener
{
  // regular expression properties
  public final static ID setProp           = ID.registerProperty("SET");        
  public final static ID setRegexKeep      = ID.registerProperty("SET_REGEX_ERROR_BLOCKING");
  public final static ID setRegexModel     = ID.registerProperty("SET_REGEX_PATTERN");
  public final static ID setRegexMessage   = ID.registerProperty("SET_REGEX_MESSAGE");  
  public final static ID getRegexString    = ID.registerProperty("GET_REGEX_STRING");  
  public final static ID getRegexResult    = ID.registerProperty("GET_REGEX_RESULT");  
  public final static ID getRegexGroup     = ID.registerProperty("GET_REGEX_GROUP");    
  public final static ID getRegexPos       = ID.registerProperty("GET_REGEX_POSITION");    
  public final static ID pRegexMsg         = ID.registerProperty("REGEX_MSG");  
  
  // messages
  public final static ID pSetEvent         = ID.registerProperty("ENABLE_EVENTS");
  public final static ID pItemName         = ID.registerProperty("ITEM_NAME"); 
  public final static ID pSendMsg          = ID.registerProperty("SEND_MESSAGE");
  public final static ID pSendMsgBlocking  = ID.registerProperty("SEND_MESSAGE_BLOCKING");    
  public final static ID pMessage          = ID.registerProperty("SEND_TEXTITEM_MSG");    
  public final static ID pCursorMsg        = ID.registerProperty("CURSOR_MESSAGE");
  public final static ID pCursorPos        = ID.registerProperty("CURSOR_POSITION");  
  public final static ID pKeyMsg           = ID.registerProperty("KEY_MESSAGE");  
  public final static ID pKeyCode          = ID.registerProperty("KEY_CODE");  
  public final static ID pKeyChar          = ID.registerProperty("KEY_CHAR");  
  public final static ID pKeyModifier      = ID.registerProperty("KEY_MODIFIER"); 
  public final static ID pBigUpdated       = ID.registerProperty("BIG_UPDATED");    
  public final static ID pBigTrgName       = ID.registerProperty("BIG_TRG_NAME");
  // mouse events
  public final static ID pSetMouseEvents   = ID.registerProperty("SET_MOUSE_EVENTS");  
  public final static ID pEventMouseEvent  = ID.registerProperty("MOUSEEVENT_MESSAGE");  
  public final static ID pEventMouseMsg    = ID.registerProperty("MOUSE_EVENT");  
  
  // max char property
  public final static ID pSetMaxChar       = ID.registerProperty("SET_MAX_CHAR");  
  
  // cursor/selection positionning
  public final static ID pSetCurPos        = ID.registerProperty("SET_CURSOR_POSITION");  
  public final static ID pGetCurPos        = ID.registerProperty("GET_CURSOR_POSITION");  
  public final static ID pInsertText       = ID.registerProperty("INSERT_TEXT");  
  public final static ID pInsertTextAtPos  = ID.registerProperty("INSERT_TEXT_AT_POSITION");  
  public final static ID pSetSelIndex      = ID.registerProperty("SET_SELECTION_INDEX");  
  public final static ID pGetSelIndex      = ID.registerProperty("GET_SELECTION_INDEX");  
  public final static ID pGetSelValue      = ID.registerProperty("GET_SELECTION_VALUE");  
  
  // scrollbars
  public final static ID setHScrollBar     = ID.registerProperty("SET_HORIZONTAL_SCROLLBAR");       
  public final static ID setVScrollBar     = ID.registerProperty("SET_VERTICAL_SCROLLBAR");
  
  // wrap style
  public final static ID setWrapStyle      = ID.registerProperty("SET_WRAP_STYLE");  
  
  // paint focus background
  public final static ID setFocusBG        = ID.registerProperty("SET_FOCUS_BACKGROUND");  
    
  // log
  public final static ID pSetLog           = ID.registerProperty("SET_LOG"); 
  
  // big text
  public final static ID pSetBigText       = ID.registerProperty("SET_BIG_TEXT");  
  public final static ID pBigAddText       = ID.registerProperty("BIG_ADD_TEXT");  
  public final static ID pBigShow          = ID.registerProperty("BIG_SHOW");        
  public final static ID pBigClear         = ID.registerProperty("BIG_CLEAR");
  public final static ID pBigGetText       = ID.registerProperty("BIG_GET_TEXT");    
  public final static ID pBigIsUpdated     = ID.registerProperty("BIG_IS_UPDATED");    
  public final static ID pBigUpdatable     = ID.registerProperty("BIG_SET_UPDATABLE");
  public final static ID pBigGetLength     = ID.registerProperty("BIG_GET_LENGTH");
  public final static ID pBigGetHash       = ID.registerProperty("BIG_GET_HASH");
  public final static ID pBigLostFocus     = ID.registerProperty("BIG_FOCUS_LOST");
  public final static ID pBigTextOpaque    = ID.registerProperty("BIG_SET_OPAQUE");
  public final static ID pBigSearch        = ID.registerProperty("BIG_SEARCH");
  public final static ID pBigSearchColor   = ID.registerProperty("BIG_SEARCH_COLOR");
  public final static ID pSetFile          = ID.registerProperty("BIG_SET_FILE_NAME");      
  public final static ID pBigReadFile      = ID.registerProperty("BIG_READ_FROM_FILE");      
  public final static ID pBigWriteFile     = ID.registerProperty("BIG_WRITE_TO_FILE");        
  public final static ID pBigAppendFile    = ID.registerProperty("BIG_APPEND_TO_FILE");          
  public final static ID pBigValidateTrg   = ID.registerProperty("BIG_VALIDATION_TRIGGER");  
  public final static ID pBigSetBorder     = ID.registerProperty("BIG_SET_BORDER");  
  
  // HTML content
  public final static ID pSetHTMLContent   = ID.registerProperty("SET_HTML_CONTENT");    
  public final static ID pSetHTMLGrants    = ID.registerProperty("SET_HTML_GRANTS");      
  public final static ID pSetHTMLEdAttrs   = ID.registerProperty("SET_HTML_EDIT_ATTRS");
  public final static ID pGetHTMLContent   = ID.registerProperty("GET_HTML_CONTENT");
  public final static ID pSetHTMLBorder    = ID.registerProperty("SET_HTML_BORDER");    
  
  // gradient background
  public final static ID setCurrent            = ID.registerProperty("SET_CURRENT");  
  public final static ID setGradient           = ID.registerProperty("SET_GRADIENT");  
  public final static ID setGradientSelColors  = ID.registerProperty("SET_GRADIENT_SEL_COLORS");  
  public final static ID setBorder             = ID.registerProperty("SET_BORDER");  
  
  private    JEditorPane   htmlPane;
  private    JScrollPane   scrollPane;
  private    String        initialURL;
  private    HTMLEditorKit m_kit;  
  private    boolean       bHTMLEdit = false ;
  private    boolean       bHTMLExtend = false ;
  private    boolean       bHTMLCanExtend = true ;
  private    Rectangle     rHTMLFrame  ;
  // end HTML content
  
  private DrawLAF     dBean;  
  private Pattern     pattern;
  private Matcher     matcher;
  private String      sRegexGroup  = "";
  private String      sRegexModel  = null ;
  private String      sRegexMsg    = null ;
  private boolean     bLog         = false ;
  private boolean     bIsRegex     = false ;
  private boolean     bRegexOk     = true ;  
  private boolean     bSendEvents  = false ;
  private boolean     bFocus       = false ;
  private boolean     bRollover    = false ;    
  private boolean     bFocusBG     = false ;
  private boolean     bHTML        = false ;
  private boolean     bExtended    = false;
  private int         iStart       = 0 ;
  private int         iEnd         = 0 ;
  private int         iCaretPos    = -1 ;
  private Color       cdefFG       = this.getForeground() ; // default background color
  private Color       cdefBG       = this.getBackground() ; // default foreground color
  private String      sItemName    = null ;
  private int         iKey         = -1 ;
  private int         iCode        = -1 ;
  private int         iModifier    = -1 ;
  private int         iBorder      = 1 ;
  private String      sModifier    = null ;  
  private char        cChar ;
  private Color       cFocus       = DrawLAF.cFocus != null ? DrawLAF.cFocus : new Color(255,214,47);
  private Color       cSelect      = DrawLAF.cSelect != null ? DrawLAF.cSelect : new Color(0,230,0) ;    
  private Color       cBorder      = null ;
  private Color       cBak         = null ;
  
  private List        list_msg     = new ArrayList(10) ;    
  protected oracle.ewt.lwAWT.lwText.LWCommonText ta ;
  private VTextArea   VTA ;
  
  // mouse events
  private boolean     bMouseEnter  = false ;
  private boolean     bMouseClick  = false ;
  private boolean     bMouseExit   = false ;
  
  private KeyListener kl = null ;
  
  // big text
  private   boolean bBigExtend = false ;
  private   boolean bBigCanExtend = true ;  
  private   boolean bBigText     = false ;
  private   boolean bBigUpdated  = false ;
  private   int iStartT          = 0 ;
  private   int iChunk           = 8192 ;
  private   int jtpHash          = 0;
  private   int iSearchStart     = 0;
  private   StringBuffer sb      = new StringBuffer(); 
  protected JTextPane jtp        = null ;
  private   JScrollPane ps       = null ;
  private   String  sFileName    = "" ;
  private   String  sCurValue    = "" ;
  private   String  sValidateTrg = "" ;
  private   String  sBigSearch   = "" ;
  private   Color  hilit_color   = DrawLAF.Current_Color;
  private   Highlighter hilit;
  private   Highlighter.HighlightPainter painter;
  private   static String CANCEL_ACTION = "cancel";
  private   static String NEXT_ACTION = "next";
  
  private IHandler  m_handler;  
  private Main      formsMain = null;
  
  private ImageKit  ik             = null;
  private javax.swing.JTextArea jt = null;
  final   UndoManager undo = new UndoManager();

    public void init(IHandler handler) {
        super.init(handler);
        m_handler = handler;
        VTA = this;
        ta = (LWCommonText)this.getComponent(0);
        // add mouse listener
        addMouseListener(new ButtonMouseAdapter());
        // add focus listener
        addFocusListener(this);
        // add key listener
        createKeyListener();
        addKeyListener(kl);
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            SwingUtilities.updateComponentTreeUI(this);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

   void setLAFBean (DrawLAF DF) { dBean = DF ;}
   DrawLAF getLAFBean() { return dBean; }

    public void paint(Graphics g) {
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
        super.paint(g);
        // draw the focus mark
        if ((bRollover || bFocus) && DrawLAF.bDrawFocusLine) {
            Graphics gg = this.getParent().getGraphics(); // to draw on canevas
            Graphics2D g2 = (Graphics2D)gg;
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2.setColor(cFocus);
            g2.setStroke(new BasicStroke(1f));
            g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.8f));
            g2.drawRoundRect((int)this.getBounds().x - 1, (int)this.getBounds().y - 1,
                             (int)this.getBounds().getWidth() + 1, (int)this.getBounds().getHeight() + 1, 6, 6);
            g2.dispose();
        }
    }

  /*---------------------------*
   *  Set the PJC properties   *
   *---------------------------*/
  public boolean setProperty(ID property, Object value)
  {
    log(property+":"+value);

    // set the horizontal scrollbar
    if (property == setHScrollBar) {
        String s = value.toString();
        if (s.equalsIgnoreCase("true")) {
            if (bBigText)
                ps.setHorizontalScrollBarPolicy(1);
            else
                this.setHDisplayPolicy(1);
        } else {
            if (bBigText)
                ps.setHorizontalScrollBarPolicy(2);
            else
                this.setHDisplayPolicy(2);
        }
        return true;
    }

    // set the vertical scrollbar
    else if (property == setVScrollBar) {
        String s = value.toString();
        if (s.equalsIgnoreCase("true")) {
            if (bBigText)
                ps.setVerticalScrollBarPolicy(1);
            else
                this.setVDisplayPolicy(1);
        } else {
            if (bBigText)
                ps.setVerticalScrollBarPolicy(2);
            else
                this.setVDisplayPolicy(2);
        }
        return true;
    }

      // set gradient
      else if( property == setGradient )
      {
        String s = value.toString();
        String s1=null,s2=null,s3=null,s4=null;
        float f=1.0f;
        StringTokenizer st = new StringTokenizer(s,",");
        if(s.equalsIgnoreCase("null")){
            if(null != jt){
                this.getParent().remove(jt);
                jt = null;
                this.setVisible(true);
                bExtended = false;
            }
            return true;
        }
        if(null != jt) this.getParent().remove(jt);
        jt = new NewTextArea2(this);
        bExtended = true ;
        jt.setBounds(this.getBounds());
        jt.setBackground(null);
        jt.setOpaque(false);
        jt.setText(this.ta.getText());
        jt.setBorder(null);
        jt.setEditable(true);
        jt.setFont(this.getFont());
        jt.setForeground(this.ta.getForeground());
        jt.setEditable(this.ta.isEditable());
        Color c1=null, c2=null,c3=null, c4=null;
        if(st.hasMoreTokens()){
            s1 = st.nextToken();
        } else return false ;
        if(st.hasMoreTokens()){
            s2 = st.nextToken();
        } else return false ;   
        if(st.hasMoreTokens()){
            s3 = st.nextToken();
        }
        if(st.hasMoreTokens()){
            s4 = st.nextToken();
        }           
        if(null != s1 && null != s2){
            c1 = ik.getInstance().makeColor(s1);
            c2 = ik.getInstance().makeColor(s2);
            if(null != s3) c3 = ik.getInstance().makeColor(s3);
            if(null != s4) c4 = ik.getInstance().makeColor(s4);            
            ((NewTextArea2)jt).setGradient(c1, c2, c3, c4);
            jt.invalidate();
        }
        jt.setWrapStyleWord(true);
        jt.setLineWrap(true);
        JScrollPane gsp = new JScrollPane(jt);
        gsp.setBounds(this.getBounds());
        gsp.setBorder(null);
        gsp.setBackground(null); 
        this.getParent().add(gsp,0); 
        this.setVisible(false);
        return true ;
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
            ((NewTextArea2)jt).setBorder(w, c);
        }
        return true;
    }

    // current record
    else if (property == setCurrent) {
        String s = value.toString(), sVal = "";
        if (null != jt) {
            if (s.equalsIgnoreCase("true"))
                ((NewTextArea2)jt).setCurrent(true);
            else
                ((NewTextArea2)jt).setCurrent(false);
        }
        return true;
    }

    // set the wrap style
    else if (property == setWrapStyle) {
        // allowed wrap style are : NONE, CHARACTER, WORD
        String s = value.toString();
        Object obj = null;
        if (s.equalsIgnoreCase("NONE"))
            obj = oracle.forms.properties.WrapStyle.NONE;
        else if (s.equalsIgnoreCase("CHARACTER"))
            obj = oracle.forms.properties.WrapStyle.CHARACTER;
        else if (s.equalsIgnoreCase("WORD"))
            obj = oracle.forms.properties.WrapStyle.WORD;
        else
            return false;
        setProperty(ID.WRAP_STYLE, obj);
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
    // set the maximum characters
    //
    else if (property == pSetMaxChar) {
        if (bBigText)
            return false;
        int iMax = Integer.parseInt(value.toString());
        if (ta.getText().length() > iMax)
            ta.setText(ta.getText().substring(0, iMax));
        ta.setMaximumChars(iMax);
        return true;
    }

    //
    //   cursor/selection properties
    //

    // caret position
    else if (property == pSetCurPos) {
        int iPos = 0;
        String s = value.toString();
        if (s.equalsIgnoreCase("START"))
            iPos = 0;
        else if (s.equalsIgnoreCase("END")) {
            if (bBigText)
                iPos = jtp.getText().length();
            else
                iPos = ta.getText().length() - 1;
        } else
            try {
                iPos = Integer.parseInt(s) - 1;
            } catch (Exception e) {
            }
        try {
            this.requestFocus();
            ta.setCaretPosition(iPos);
        } catch (Exception e) {
        }
        if (bBigText) {
            try {
                jtp.setCaretPosition(iPos);
            } catch (Exception e) {
            }
        }
        return true;
    }

    // insert text
    else if (property == pInsertText) {
        String s = value.toString();
        if (bBigText) {
            jtp.requestFocus();
            Document doc = jtp.getDocument();
            try {
                doc.insertString(jtp.getCaretPosition(), s, jtp.getStyle("plain"));
            } catch (BadLocationException ble) {
            }
        } else {
            try {
                this.requestFocus();
                ta.insert(s, ta.getCaretPosition());
            } catch (Exception e) {
            }
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
        if (bBigText) {
            jtp.requestFocus();
            Document doc = jtp.getDocument();
            try {
                doc.insertString(iPos, sText, jtp.getStyle("plain"));
            } catch (BadLocationException ble) {
            }
        } else {
            try {
                this.requestFocus();
                ta.insert(sText, iPos - 1);
            } catch (Exception e) {
            }
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
            Point pt = new Point(iStart, iEnd);
            try {
                setProperty(ID.SELECTION, pt);
            } catch (Exception e) {
            }
            if (bBigText) {
                try {
                    jtp.setSelectionStart(iStart);
                    jtp.setSelectionEnd(iEnd);
                } catch (Exception e) {
                }
            }
        }
        return true;
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

    // background color
    else if (property == ID.BACKGROUND) {
        cdefBG = (Color)value;
        if (bBigText)
            jtp.setBackground(cdefBG);
        return super.setProperty(property, value);
    }

    // foreground color
    else if (property == ID.FOREGROUND) {
        cdefFG = (Color)value;
        if (bBigText)
            jtp.setForeground(cdefFG);
        return super.setProperty(property, value);
    }

    // Visible
    else if (property == ID.VISIBLE) {
        Boolean b = (Boolean)value;
        if (bBigText) {
            if (b.toString().equalsIgnoreCase("true"))
                ps.setVisible(true);
            else
                ps.setVisible(false);
        }
        return super.setProperty(property, value);
    }

    // location
    else if (property == ID.LOCATION) {
        Point p = (Point)value;
        if (bBigText) {
            ps.setLocation(p);
            return true;
        } else
            return super.setProperty(property, value);
    }

    // size
    else if (property == ID.OUTERSIZE) {
        Point p = (Point)value;
        if (bBigText) {
            ps.setSize(p.x, p.y);
            return true;
        } else
            return super.setProperty(property, value);
    }

    // Tooltip
    else if (property == ID.POPUPHELP_ID) {
        oracle.forms.ui.FormsToolTip tp = (oracle.forms.ui.FormsToolTip)value;
        String s = (String)tp.getToolTipProperty(ID.INDEX_POPUPHELP_STRING);
        if (htmlPane != null) {
            htmlPane.setToolTipText(s.replace((char)10, '\n'));
            ToolTipManager.sharedInstance().setDismissDelay(5000);
        }
        return super.setProperty(property, value);
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

    // set the big text
    else if (property == pSetBigText) {
        bBigText = true;
        bHTML = false;
        rHTMLFrame = this.getBounds();
        jtp = new JTextPane();
        jtp.setBackground(this.getBackground());
        jtp.setForeground(this.getForeground());
        jtp.setFont(this.getFont());
        jtp.setName(this.getName());
        ps = new JScrollPane(jtp);
        ps.setBackground(this.getBackground());
        ps.setBorder(BorderFactory.createLoweredBevelBorder());
        ps.setBounds(this.getBounds());
        // add focus listener the the JTextPane
        jtp.addFocusListener(new FocusListener() {
            public void focusGained(FocusEvent e) {
                log("Big Text Focus gained:" + e.getComponent().getName());
            }

            public void focusLost(FocusEvent e) {
                log("Big Text Focus lost:" + e.getComponent().getName());
                int iHashnew = jtp.getText().hashCode();
                if (iHashnew != jtpHash) {
                    bBigUpdated = true;
                } else
                    bBigUpdated = false;
                log("Big Text content changed:" + bBigUpdated);
                jtpHash = iHashnew;
                try {
                    if (dBean != null) {
                        list_msg.clear();
                        Messages msg = new Messages(pItemName, sItemName);
                        list_msg.add(msg);
                        msg = new Messages(pBigUpdated, bBigUpdated ? "true" : "false");
                        list_msg.add(msg);
                        msg = new Messages(pBigTrgName, sValidateTrg);
                        list_msg.add(msg);

                        try {
                            if (dBean != null)
                                dBean.dispatchanevent(pBigLostFocus, list_msg);
                        } catch (Exception ex) {;}
                    }
                } catch (Exception ex) {
                }
            }
        });
        // add key listener the the JTextArea
        jtp.addKeyListener(kl);
        jtp.addMouseListener(mouseListener);
        // undo
        Document doc = jtp.getDocument();
        // Listen for undo and redo events
        doc.addUndoableEditListener(new UndoableEditListener() {
            public void undoableEditHappened(UndoableEditEvent evt) {
                undo.addEdit(evt.getEdit());
            }
        });                    
        // Create an undo action and add it to the text component
        jtp.getActionMap().put("Undo",
            new AbstractAction("Undo") {
                public void actionPerformed(ActionEvent evt) {
                    try {
                        if (undo.canUndo()) {
                            undo.undo();
                        }
                    } catch (CannotUndoException e) {
                    }
                }
           });
        // Bind the undo action to ctl-Z
        jtp.getInputMap().put(KeyStroke.getKeyStroke("control Z"), "Undo");
        // Create a redo action and add it to the text component
        jtp.getActionMap().put("Redo",
            new AbstractAction("Redo") {
                public void actionPerformed(ActionEvent evt) {
                    try {
                        if (undo.canRedo()) {
                            undo.redo();
                        }
                    } catch (CannotRedoException e) {
                    }
                }
            });
        // Bind the redo action to ctl-Y
        jtp.getInputMap().put(KeyStroke.getKeyStroke("control Y"), "Redo");
        // add highlight for search feature
        hilit = new DefaultHighlighter();
        painter = new DefaultHighlighter.DefaultHighlightPainter(hilit_color);
        jtp.setHighlighter(hilit);
        InputMap im = jtp.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW);
        ActionMap am = jtp.getActionMap();
        im.put(KeyStroke.getKeyStroke("ESCAPE"), CANCEL_ACTION);
        am.put(CANCEL_ACTION, new CancelAction());        
        im.put(KeyStroke.getKeyStroke("F3"), NEXT_ACTION);
        am.put(NEXT_ACTION, new NextAction());                      
        this.getParent().add(ps, 0);
        this.setBounds(1,1,1,1);
        return true;
    }

    // set the big text validation trigger name
    else if (property == pBigValidateTrg) {
        sValidateTrg = (String)value;
        return true;
    }

    // set the big text search
    else if (property == pBigSearch) {
        if (!bBigText)
            return false;
        sBigSearch = (String)value;
        iSearchStart = 0;
        search();
        return true;
    }

    // set the big text border
    else if (property == pBigSetBorder) {
        if (!bBigText)
            return false;
        String sval = (String)value;
        String s = null, s1 = null, s2 = null;
        int iWidth=1;
        Color c = Color.black;
        StringTokenizer st = new StringTokenizer(sval, ",");
        if (st.hasMoreTokens())
            s = st.nextToken();
        else
            return false;
        // line width
        if (st.hasMoreTokens()) {
            s1 = st.nextToken();
            try {
                iWidth = Integer.parseInt(s1);
            }
            catch(Exception e){;}
        }
        // line color
        if (st.hasMoreTokens()) {
            s2 = st.nextToken(); 
            c = ik.getInstance().makeColor(s2);
        }    
        if(s.equalsIgnoreCase("line")) {
            ps.setBorder(BorderFactory.createLineBorder(c,iWidth)) ;
        }    
        else if(s.equalsIgnoreCase("raisedetched"))  ps.setBorder(BorderFactory.createEtchedBorder(EtchedBorder.RAISED)) ;
        else if(s.equalsIgnoreCase("loweredetched")) ps.setBorder(BorderFactory.createEtchedBorder(EtchedBorder.LOWERED)) ;
        else if(s.equalsIgnoreCase("raisedbevel"))   ps.setBorder(BorderFactory.createRaisedBevelBorder()) ;
        else if(s.equalsIgnoreCase("loweredbevel"))  ps.setBorder(BorderFactory.createLoweredBevelBorder()) ;
        else if(s.equalsIgnoreCase("null"))          ps.setBorder(BorderFactory.createEmptyBorder());
        return true;
    }                 
                 
    // set the big text search color
    else if (property == pBigSearchColor) {
        if (!bBigText)
            return false;
        String s = (String)value;
        hilit_color = ik.getInstance().makeColor(s);
        painter = new DefaultHighlighter.DefaultHighlightPainter(hilit_color);
        return true;
    }       
    
    // set the big text updatable
    else if (property == pBigUpdatable) {
        String s = (String)value;
        if (bBigText) {
            if (s.equalsIgnoreCase("true"))
                jtp.setEditable(true);
            else if (s.equalsIgnoreCase("false"))
                jtp.setEditable(false);        
        }
        return true;
    }    

    // set the big text opaque
    else if (property == pBigTextOpaque) {
        if (!bBigText)
            return false;
        String s = (String)value;
        if (s.equalsIgnoreCase("true")) {
            jtp.setBackground(null);
            jtp.setOpaque(false);
            ps.setBackground(null);
            ps.setOpaque(false);
            ps.getViewport().setBackground(null);
            ps.getViewport().setOpaque(false);
        } else {
            jtp.setBackground(this.getBackground());
            jtp.setOpaque(true);
            ps.setBackground(this.getBackground());
            ps.setOpaque(true);
            ps.getViewport().setBackground(this.getBackground());
            ps.getViewport().setOpaque(true);
        }
        ps.repaint();
        return true;
    }

    //
    // add text to the TextArea
    //
    else if (property == pBigAddText) {
        if (!bBigText)
            return false;
        sb.append(value.toString());
        return true;
    }

    //
    // display the whole text
    //
    else if (property == pBigShow) {
        if (!bBigText)
            return false;
        jtp.setText(sb.toString());
        jtpHash = jtp.getText().hashCode();
        jtp.setCaretPosition(0);
        sb = new StringBuffer();
        bBigUpdated = false;
        System.gc();
        return true;
    }

    //
    // clear the TextArea
    //
    else if (property == pBigClear) {
        if (!bBigText)
            return false;
        jtp.setText("");
        jtpHash = 0;
        sb = new StringBuffer();
        return true;
    }

    // read the file
    else if (property == pBigReadFile) {
        if (!bBigText)
            return false;
        sFileName = (String)value;
        if (sFileName != null) {
            jtp.setText(readFromFile());
            jtpHash = jtp.getText().hashCode();
            bBigUpdated = false;
        }
        return true;
    }

    // Write the file
    else if (property == pBigWriteFile) {
        if (!bBigText)
            return false;
        sFileName = (String)value;
        if (sFileName != null)
            writeToFile(jtp.getText());
        return true;
    }

    // Write append the file
    else if (property == pBigAppendFile) {
        if (!bBigText)
            return false;
        sFileName = (String)value;
        if (sFileName != null)
            writeAppendToFile(jtp.getText());
        return true;
    }

    // set the file name
    else if (property == pSetFile) {
        if (!bBigText)
            return false;
        log("SetFile=" + (String)value);
        sFileName = (String)value;
        return true;
    }

    // set HTML content
    else if (property == pSetHTMLContent) {
        bBigText = false;
        bHTML = true ;
        String s = (String)value;
        int iSize = 12;
        String sEdit = "", sLink = "", sExtend = "";
        StringTokenizer st = new StringTokenizer(s, ",");
        if (st.hasMoreTokens())
            sEdit = st.nextToken();
        if (st.hasMoreTokens())
            sLink = st.nextToken();
        if (st.hasMoreTokens())
            sExtend = st.nextToken();
        initialURL = "";
        htmlPane = new JEditorPane();
        m_kit = new HTMLEditorKit();
        htmlPane.setEditorKit(m_kit);
        //htmlPane.setBorder(BorderFactory.createLoweredBevelBorder());
        //htmlPane.setContentType("text/html");
        Font font = UIManager.getFont("Label.font");
        String bodyRule =
            "body { font-family: " + font.getFamily() + "; " + "font-size: " + font.getSize() + "pt; }";
        ((HTMLDocument)htmlPane.getDocument()).getStyleSheet().addRule(bodyRule);

        if (sEdit.equalsIgnoreCase("true")) {
            bHTMLEdit = true;
            htmlPane.setEditable(true);
        } else if (sEdit.equalsIgnoreCase("false")) {
            bHTMLEdit = false;
            htmlPane.setEditable(false);
        }

        if (sExtend.equalsIgnoreCase("true"))
            bHTMLCanExtend = true;
        else if (sExtend.equalsIgnoreCase("false"))
            bHTMLCanExtend = false;

        if (sLink.equalsIgnoreCase("true")) {
            htmlPane.addHyperlinkListener(this);
            log("set HyperLink");
        }

        // add focus listener the the JTextPane
        htmlPane.addFocusListener(new FocusListener() {
            public void focusGained(FocusEvent e) {
                log("htmlPane Focus gained:");
                htmlPane.setCaretPosition(0);
                htmlPane.setSelectionStart(0);
                htmlPane.setSelectionEnd(1);
            }

            public void focusLost(FocusEvent e) {
                log("htmlPane Focus lost:");
                VTA.setProperty(ID.VALUE, htmlPane.getText());
                VTA.setProperty(ID.FOCUS, new Boolean("false"));
            }
        });
        htmlPane.addMouseListener(mouseListener);

        // Bind some standard actions
        setEditAttributes("style", bHTMLEdit);
        setEditAttributes("align", bHTMLEdit);
        setEditAttributes("font", bHTMLEdit);
        setEditAttributes("color", bHTMLEdit);

        scrollPane = new JScrollPane(htmlPane);
        scrollPane.setBorder(BorderFactory.createLoweredBevelBorder());
        scrollPane.setBounds(this.getBounds());
        scrollPane.getViewport().setBackground(this.getBackground());
        rHTMLFrame = this.getBounds();
        scrollPane.setBorder(null);
        this.getParent().add(scrollPane, 1);
        this.setSize(1, 1);
        return true;
    }

    // set HTML edition attributes
    else if (property == pSetHTMLEdAttrs) {
        if (htmlPane == null)
            return false;
        if (!bHTMLEdit)
            return false;
        String s = (String)value;
        String s1 = null, s2 = null;
        int iPos = 0;
        boolean b = false;
        StringTokenizer st = new StringTokenizer(s, ",");
        if (st.hasMoreTokens()) {
            while (st.hasMoreTokens()) {
                b = false;
                s1 = st.nextToken().toLowerCase();
                iPos = s1.indexOf("=");
                if (iPos > -1) {
                    s2 = s1.substring(iPos + 1);
                    if (s2.equalsIgnoreCase("yes"))
                        b = true;
                    if (s1.startsWith("style")) {
                        setEditAttributes("style", b);
                    }
                    if (s1.startsWith("align")) {
                        setEditAttributes("align", b);
                    }
                    if (s1.startsWith("font")) {
                        setEditAttributes("font", b);
                    }
                    if (s1.startsWith("color")) {
                        setEditAttributes("color", b);
                    }
                }
            }
        }

        return true;
    }

    // set HTML grants
    else if (property == pSetHTMLGrants) {
        if (htmlPane == null)
            return false;
        String s = (String)value;
        String sEdit = "", sLink = "", sExtend = "";
        StringTokenizer st = new StringTokenizer(s, ",");

        if (st.hasMoreTokens())
            sEdit = st.nextToken();
        if (st.hasMoreTokens())
            sLink = st.nextToken();
        if (st.hasMoreTokens())
            sExtend = st.nextToken();

        if (sEdit.equalsIgnoreCase("true"))
            htmlPane.setEditable(true);
        else if (sEdit.equalsIgnoreCase("false"))
            htmlPane.setEditable(false);

        if (sEdit.equalsIgnoreCase("true"))
            bHTMLEdit = true;
        else if (sEdit.equalsIgnoreCase("false"))
            bHTMLEdit = false;

        if (sExtend.equalsIgnoreCase("true"))
            bHTMLCanExtend = true;
        else if (sExtend.equalsIgnoreCase("false"))
            bHTMLCanExtend = false;

        // Bind some standard actions
        setEditAttributes("style", bHTMLEdit);
        setEditAttributes("align", bHTMLEdit);
        setEditAttributes("font", bHTMLEdit);
        setEditAttributes("color", bHTMLEdit);

        if (sLink.equalsIgnoreCase("true"))
            htmlPane.addHyperlinkListener(this);
        else
            try {
                htmlPane.removeHyperlinkListener(htmlPane.getHyperlinkListeners()[0]);
            } catch (Exception ex) {
            }
        return true;
    }
    
    // set the big text border
    else if (property == pSetHTMLBorder) {
        if (htmlPane == null)
            return false;
        String sval = (String)value;
        String s = null, s1 = null, s2 = null;
        int iWidth=1;
        Color c = Color.black;
        StringTokenizer st = new StringTokenizer(sval, ",");
        if (st.hasMoreTokens())
            s = st.nextToken();
        else
            return false;
        // line width
        if (st.hasMoreTokens()) {
            s1 = st.nextToken();
            try {
                iWidth = Integer.parseInt(s1);
            }
            catch(Exception e){;}
        }
        // line color
        if (st.hasMoreTokens()) {
            s2 = st.nextToken(); 
            c = ik.getInstance().makeColor(s2);
        }    
        if(s.equalsIgnoreCase("line")) {
            ps.setBorder(BorderFactory.createLineBorder(c,iWidth)) ;
        }    
        else if(s.equalsIgnoreCase("raisedetched"))  scrollPane.setBorder(BorderFactory.createEtchedBorder(EtchedBorder.RAISED)) ;
        else if(s.equalsIgnoreCase("loweredetched")) scrollPane.setBorder(BorderFactory.createEtchedBorder(EtchedBorder.LOWERED)) ;
        else if(s.equalsIgnoreCase("raisedbevel"))   scrollPane.setBorder(BorderFactory.createRaisedBevelBorder()) ;
        else if(s.equalsIgnoreCase("loweredbevel"))  scrollPane.setBorder(BorderFactory.createLoweredBevelBorder()) ;
        else if(s.equalsIgnoreCase("null"))          scrollPane.setBorder(BorderFactory.createEmptyBorder());
        return true;
    }                 
              

    else if (property == ID.VALUE) {
        String s = (String)value;
        if (htmlPane != null) {
            Document doc = htmlPane.getDocument();
            doc.putProperty(Document.StreamDescriptionProperty, null);
            try {
                if (s.startsWith("http:") || s.startsWith("ftp:") || s.startsWith("www.") ||
                    s.startsWith("file:") || s.startsWith("/forms")) {
                    initialURL = s;
                    URL url = null;
                    if (s.startsWith("/forms")) {
                        // getting the Forms Main class
                        try {
                            Method method = m_handler.getClass().getMethod("getApplet", new Class[0]);
                            Object applet = method.invoke(m_handler, new Object[0]);
                            if (applet instanceof Main) {
                                formsMain = (Main)applet;
                                String sDocBase = formsMain.getDocumentBase().toString();
                                int i = sDocBase.indexOf("/forms/");
                                sDocBase = sDocBase.substring(0, i);
                                initialURL = sDocBase + s;
                            }
                        } catch (Exception ex) {
                            System.err.println(" !!! HTMLContent() Unable reach the link\n\t" + ex.toString());
                        }
                    }
                    url = new URL(initialURL);
                    try {
                        htmlPane.setText(null);
                        htmlPane.setPage(url);
                    } catch (IOException ioe) {
                        System.out.println(" !!! HTMLContent() Unable to follow the link to " + initialURL + ": " +
                                           ioe);
                    }
                } else {
                    htmlPane.setContentType("text/html");
                    htmlPane.setText(s);
                }
            } catch (Exception ex) {
                System.out.println(" !!! HTMLContent() Unable to read the HTML content " + s + ": " + ex);
            }
        }
        if (null != jt) {
            jt.setText(s);
        }
        this.ta.setText(s);
        super.setProperty(property, value);
        return true;
    }

    else if (property == ID.FOCUS) {
        if (null != jt && (value.equals(new Boolean("true")))) {
            if(!bExtended) jt.requestFocus();
            return true;
        }
        else if (null != jtp) {
            jtp.requestFocus();
            return true;
        }        
        else
        return super.setProperty(property, value);
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
            if (bBigText)
                return "" + bRegexMatch(sRegexModel, jtp.getText());
            else
                return "" + bRegexMatch(sRegexModel, ta.getText());
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
            String sRes = null;
            if (bBigText)
                sRes = jtp.getSelectionStart() + 1 + "," + jtp.getSelectionEnd() + 1;
            else
                sRes = ta.getSelectionStart() + 1 + "," + ta.getSelectionEnd() + 1;
            return "" + sRes;
        }

        //
        // get selection value
        //
        else if (pId == pGetSelValue) {
            String sRes = null;
            if (bBigText)
                sRes = jtp.getSelectedText();
            else
                sRes = ta.getSelectedText();
            return "" + sRes;
        }

        //
        // get cursor position
        //
        else if (pId == pGetCurPos) {
            String sRes = null;
            if (bBigText)
                sRes = "" + jtp.getCaretPosition() + 1;
            else
                sRes = "" + ta.getCaretPosition() + 1;
            return sRes;
        }

        //
        // returns the text length
        //
        else if (pId == pBigGetLength) {
            String sRes = null;
            if (bBigText)
                sRes = "" + jtp.getText().length();
            else
                sRes = "" + ta.getText().length();
            return sRes;
        }

        //
        // returns the updated flag
        //
        else if (pId == pBigIsUpdated) {
            return bBigUpdated ? "true" : "false";
        }

        //
        // returns the BIG Text hash
        //
        else if (pId == pBigGetHash) {
            return "" + jtpHash;
        }

        //
        // returns the chunks
        //
        else if (pId == pBigGetText) {
            if (!bBigText)
                return "";
            String s = "";
            int iLen = jtp.getText().length();
            while (iStartT < iLen) {
                try {
                    if (iStartT + iChunk <= iLen)
                        s = jtp.getText(iStartT, iChunk);
                    else
                        s = jtp.getText(iStartT, iLen - iStartT);
                    iStartT += iChunk;
                    return s;
                } catch (BadLocationException ble) {
                    ble.printStackTrace();
                    return "";
                }
            }
            iStartT = 0;
            return "";
        }

        // HTML content
        else if (pId == pGetHTMLContent) {
            String s = "";
            if (htmlPane != null)
                s = htmlPane.getText();
            return s;
        }
        
        // Value
        else if (pId == ID.VALUE) {
            String s = "";
            if (htmlPane != null) {
                s = htmlPane.getText();
            }
            else if (jt != null) {
                s = jt.getText();
            }         
            else {
                s = ta.getText();
            }
            return s;
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
                    Messages msg = new Messages(pItemName, sItemName);
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
        } catch (Exception ex) {
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

        public void mouseClicked(MouseEvent e) {
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
            if (bBigText)
                jtp.requestFocus();
            else if (htmlPane != null)
                htmlPane.requestFocus();
            //else e.getComponent().requestFocus();
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
    }
    

    /**
      * Utility function to print out a debug message to the Java Console
      * @param msg string to display, this will be prefixed with the classname of the PJC
      */
     public void log(String msg){
       if(bLog) System.out.println("LAF_XP_TextArea(): " + msg);
     }

    // KeyListener
    void createKeyListener() {
        kl = new KeyListener() {
                public void keyPressed(KeyEvent e) {
                    iKey = (int)(e.getKeyChar());
                    iCode = e.getKeyCode();
                    cChar = e.getKeyChar();
                    // get the modifier
                    iModifier = e.getModifiers();
                    int modifiersEx;
                    if (System.getProperty("java.version").startsWith("1.3"))
                        modifiersEx = e.getModifiers();
                    else
                        modifiersEx = e.getModifiersEx();
                    sModifier = KeyEvent.getKeyModifiersText(iModifier);
                    if (bBigText)
                        iCaretPos = jtp.getCaretPosition();
                    else
                        iCaretPos = ta.getCaretPosition();
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
                        try {
                            if (dBean != null)
                                dBean.dispatchanevent(pKeyMsg, list_msg);
                        } catch (Exception ex) {
                        }
                        ;
                    }
                    if ((e.getKeyCode() == KeyEvent.VK_TAB) && (modifiersEx == 128)) {
                        e.consume();
                        e.getComponent().transferFocus();
                    }
                }

                public void keyTyped(KeyEvent e) {
                }

                public void keyReleased(KeyEvent e) {
                    if (null != jt) {
                        jt.setText(ta.getText());
                    }
                }
            };
    }
  
    public void setFileName( String p_filename ) {
         sFileName = p_filename ;
         log( "Filename : " + p_filename ) ;
    }
    
    public void writeToFile( String p_text ) {
         sCurValue = p_text ;
         writeFile( 1, false ) ;
    }  
  
    public void writeAppendToFile( String p_text ) {
         sCurValue = p_text ;
         writeFile( 1, true ) ;
    }  
    
    public String readFromFile() {
         boolean bStatus = false ;
         bStatus = readFile() ;
         if( bStatus ) return sCurValue ;
         else return "" ;
    }    
    
    /****************************
     *  Write a text to a file  *
     ***************************/
    private void writeFile(int iAction, boolean bAppend) {
        PrintWriter fileOut = null;
        String line = "";
        boolean b = false;
        if (dBean != null)
            b = dBean.bDialogUseScheme;

        // open the file
        log("writeFile : try to open : " + sFileName);
        try {
            fileOut = new PrintWriter(new FileWriter(sFileName, bAppend));
        } catch (Exception e) {
            System.out.println("writeFile opening error:" + e);
        }
        // write to the file
        if (iAction == 1) {
            try {
                log("writeFile : try to write to : " + sFileName);
                fileOut.println(sCurValue);
            } catch (Exception e) {
                System.out.println("LAF_XP_TextArea : writeFile writing error:" + e);
                if (dBean != null) {
                    dBean.setProperty(dBean.setApplyScheme, "dialog,true");
                    dBean.setProperty(dBean.pDisplayDialog,
                                      "0,0,480,160,error,Write File,Error writing file: " + sFileName);
                    dBean.setProperty(dBean.setApplyScheme, "dialog," + b);
                }
            }
        }
        // close the file
        try {
            fileOut.close();
        } catch (Exception e) {
            System.out.println("LAF_XP_TextArea : writeFile closing error:" + e);
        }
        //JOptionPane.showMessageDialog(this, "File : "+sFileName+" created", "Write", JOptionPane.PLAIN_MESSAGE);
    }

    /*****************************
     *  read a text from a file  *
     ****************************/
    private boolean readFile() {
        BufferedReader fileIn = null;
        String line = "";
        sCurValue = "";
        StringBuffer sb = new StringBuffer();
        URL url = null;
        boolean b = false;
        if (dBean != null)
            b = dBean.bDialogUseScheme;

        // Open the file
        log("readFile : try to open : " + sFileName);
        try {
            url = new URL(sFileName);
        } catch (Exception e) {
        }
        try {
            if (url != null)
                fileIn = new BufferedReader(new InputStreamReader(url.openStream()));
            else
                fileIn = new BufferedReader(new FileReader(sFileName));
        } catch (Exception ex) {
            System.out.println("LAF_XP_TextArea : readFile open error : " + sFileName + " not found ");
            if (dBean != null) {
                dBean.setProperty(dBean.setApplyScheme, "dialog,true");
                dBean.setProperty(dBean.pDisplayDialog,
                                  "0,0,480,160,error,Open File,File: " + sFileName + " not found");
                dBean.setProperty(dBean.setApplyScheme, "dialog," + b);
            }
            return false;
        }

        // read the file
        log("readFile : try to read from : " + sFileName);
        try {
            while ((line = fileIn.readLine()) != null) {
                sb.append(line).append('\n');
            }
            sCurValue = sb.toString();
        } catch (Exception e) {
            System.out.println("LAF_XP_TextArea : readFile reading error:" + e);
            return false;
        }
        try {
            fileIn.close();
        } catch (Exception e) {
            System.out.println("LAF_XP_TextArea : readFile closing error:" + e);
            return false;
        }
        return true;
    }

    public void actionPerformed(ActionEvent event) {
        log("actionPerformed ");
        String url = initialURL;
        try {
            htmlPane.setPage(new URL(url));
        } catch (IOException ioe) {
            System.out.println("Unable to follow the link to " + url + ": " + ioe);
        }
    }

    // try to follow the selected link
    public void hyperlinkUpdate(HyperlinkEvent event) {
        if (event.getEventType() == HyperlinkEvent.EventType.ACTIVATED) {
            JEditorPane pane = (JEditorPane) event.getSource();
            if (event instanceof HTMLFrameHyperlinkEvent) {
                HTMLFrameHyperlinkEvent  evt = (HTMLFrameHyperlinkEvent)event;
                HTMLDocument doc = (HTMLDocument)pane.getDocument();
                doc.processHTMLFrameHyperlinkEvent(evt);
            }
            else {
                try {
                    htmlPane.setPage(event.getURL());
                } catch (IOException ioe) {
                    System.out.println("Unable to follow the link to " + event.getURL().toExternalForm() + ": " + ioe);
                }
            }
        }
    }

    // allow the user to change the Font face and size

    class FontAndSizeAction extends StyledEditorKit.StyledTextAction {

        private String family;
        private int fontSize;
        JDialog formatText;
        private boolean accept = false;
        JComboBox fontFamilyChooser;
        JComboBox fontSizeChooser;

        public FontAndSizeAction() {
            super("Font and Size");
        }

        public String toString() {
            return "Font and Size";
        }

        public void actionPerformed(ActionEvent e) {
            JEditorPane editor = (JEditorPane)getEditor(e);
            int pStart = editor.getSelectionStart();
            int pEnd = editor.getSelectionEnd();
            int l = pEnd - pStart;
            Point pt = VTA.getLocationOnScreen();
            StyledDocument doc = getStyledDocument(editor);
            Element paragraph = doc.getCharacterElement(pStart);
            AttributeSet as = paragraph.getAttributes();

            family = StyleConstants.getFontFamily(as);
            fontSize = StyleConstants.getFontSize(as);

            formatText = new JDialog(new JFrame(), "Font and Size", true);
            formatText.getContentPane().setLayout(new BorderLayout());

            JPanel choosers = new JPanel();
            choosers.setLayout(new GridLayout(2, 1));

            JPanel fontFamilyPanel = new JPanel();
            fontFamilyPanel.add(new JLabel("Font"));

            GraphicsEnvironment ge = GraphicsEnvironment.getLocalGraphicsEnvironment();
            String[] fontNames = ge.getAvailableFontFamilyNames();

            fontFamilyChooser = new JComboBox();
            for (int i = 0; i < fontNames.length; i++) {
                fontFamilyChooser.addItem(fontNames[i]);
            }
            fontFamilyChooser.setSelectedItem(family);
            fontFamilyPanel.add(fontFamilyChooser);
            choosers.add(fontFamilyPanel);

            JPanel fontSizePanel = new JPanel();
            fontSizePanel.add(new JLabel("Size"));
            fontSizeChooser = new JComboBox();
            fontSizeChooser.setEditable(true);
            fontSizeChooser.addItem(new Integer(4));
            fontSizeChooser.addItem(new Integer(6));
            fontSizeChooser.addItem(new Integer(8));
            fontSizeChooser.addItem(new Integer(9));
            fontSizeChooser.addItem(new Integer(10));
            fontSizeChooser.addItem(new Integer(11));
            fontSizeChooser.addItem(new Integer(12));
            fontSizeChooser.addItem(new Integer(14));
            fontSizeChooser.addItem(new Integer(16));
            fontSizeChooser.addItem(new Integer(20));
            fontSizeChooser.addItem(new Integer(24));
            fontSizeChooser.setSelectedItem(new Integer(fontSize));
            fontSizePanel.add(fontSizeChooser);
            choosers.add(fontSizePanel);

            JButton ok = new JButton("OK");
            ok.addActionListener(new ActionListener() {
                public void actionPerformed(ActionEvent ae) {
                    accept = true;
                    formatText.dispose();
                    family = (String)fontFamilyChooser.getSelectedItem();
                    fontSize = Integer.parseInt(fontSizeChooser.getSelectedItem().toString());
                }
            });

            JButton cancel = new JButton("Cancel");
            cancel.addActionListener(new ActionListener() {
                public void actionPerformed(ActionEvent ae) {
                    formatText.dispose();
                }
            });

            JPanel buttons = new JPanel();
            buttons.add(ok);
            buttons.add(cancel);
            formatText.getContentPane().add(choosers, BorderLayout.CENTER);
            formatText.getContentPane().add(buttons, BorderLayout.SOUTH);
            formatText.pack();
            formatText.setLocation((pt.x + 50), (pt.y + 50));
            formatText.setVisible(true);

            MutableAttributeSet attr = null;
            if (editor != null && accept) {
                attr = new SimpleAttributeSet();
                StyleConstants.setFontFamily(attr, family);
                StyleConstants.setFontSize(attr, (int)fontSize);
                doc.setCharacterAttributes(pStart, l, attr, false);
            }

        }
    }

    // allow the user to change the Font color

    class TextColorAction extends StyledEditorKit.StyledTextAction {

        JColorChooser colorChooser = new JColorChooser();
        JDialog dialog = new JDialog();
        boolean noChange = false;
        boolean cancelled = false;

        public TextColorAction() {
            super("color");
        }

        public void actionPerformed(ActionEvent e) {
            JEditorPane editor = (JEditorPane)getEditor(e);

            if (editor == null) {
                return;
            }
            int pStart = editor.getSelectionStart();
            int pEnd = editor.getSelectionEnd();
            int l = pEnd - pStart;
            Point pt = VTA.getLocationOnScreen();
            StyledDocument doc = getStyledDocument(editor);
            Element paragraph = doc.getCharacterElement(pStart);
            AttributeSet as = paragraph.getAttributes();
            fg = StyleConstants.getForeground(as);
            if (fg == null) {
                fg = Color.BLACK;
            }
            colorChooser.setColor(fg);

            JButton accept = new JButton("OK");
            accept.addActionListener(new ActionListener() {
                public void actionPerformed(ActionEvent ae) {
                    fg = colorChooser.getColor();
                    dialog.dispose();
                }
            });

            JButton cancel = new JButton("Cancel");
            cancel.addActionListener(new ActionListener() {
                public void actionPerformed(ActionEvent ae) {
                    cancelled = true;
                    dialog.dispose();
                }
            });

            JButton none = new JButton("None");
            none.addActionListener(new ActionListener() {
                public void actionPerformed(ActionEvent ae) {
                    noChange = true;
                    dialog.dispose();
                }
            });

            JPanel buttons = new JPanel();
            buttons.add(accept);
            buttons.add(none);
            buttons.add(cancel);

            dialog.getContentPane().setLayout(new BorderLayout());
            dialog.getContentPane().add(colorChooser, BorderLayout.CENTER);
            dialog.getContentPane().add(buttons, BorderLayout.SOUTH);
            dialog.setModal(true);
            dialog.pack();
            dialog.setLocation((pt.x + 50), (pt.y + 50));
            dialog.setVisible(true);

            if (!cancelled) {

                MutableAttributeSet attr = null;
                if (editor != null) {
                    if (fg != null && !noChange) {
                        attr = new SimpleAttributeSet();
                        StyleConstants.setForeground(attr, fg);
                        doc.setCharacterAttributes(pStart, l, attr, false);
                    }
                }
            }
            noChange = false;
            cancelled = false;
        }

        private Color fg;
    }

    void setEditAttributes(String sType, boolean b) {
        Action a = null;
        log("Edit atribute: " + sType + "," + b);
        if (b) {
            // Bind some standard actions
            if (sType.equalsIgnoreCase("style")) {
                // Set the Bold action
                a = new HTMLEditorKit.BoldAction();
                htmlPane.getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_B, Event.CTRL_MASK), "Bold");
                htmlPane.getActionMap().put("Bold", a);

                // Set the Italic action
                a = new HTMLEditorKit.ItalicAction();
                htmlPane.getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_I, Event.CTRL_MASK), "Italic");
                htmlPane.getActionMap().put("Italic", a);

                // Set the Underline action
                a = new HTMLEditorKit.UnderlineAction();
                htmlPane.getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_U, Event.CTRL_MASK), "Underline");
                htmlPane.getActionMap().put("Underline", a);
            }

            if (sType.equalsIgnoreCase("align")) {
                // Set the left alignment action
                a = new HTMLEditorKit.AlignmentAction("left-justify", StyleConstants.ALIGN_LEFT);
                htmlPane.getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_L, Event.CTRL_MASK), "Left");
                htmlPane.getActionMap().put("Left", a);
                // Set the left alignment action
                a = new HTMLEditorKit.AlignmentAction("right-justify", StyleConstants.ALIGN_RIGHT);
                htmlPane.getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_R, Event.CTRL_MASK), "Right");
                htmlPane.getActionMap().put("Right", a);
                // Set the left alignment action
                a = new HTMLEditorKit.AlignmentAction("center-justify", StyleConstants.ALIGN_CENTER);
                htmlPane.getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_C, Event.CTRL_MASK), "Center");
                htmlPane.getActionMap().put("Center", a);
            }

            if (sType.equalsIgnoreCase("font")) {
                // Set the font family/size action
                a = new FontAndSizeAction();
                htmlPane.getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_F, Event.CTRL_MASK), "Font");
                htmlPane.getActionMap().put("Font", a);
            }

            if (sType.equalsIgnoreCase("color")) {
                // Set the font color action
                a = new TextColorAction();
                htmlPane.getInputMap().put(KeyStroke.getKeyStroke(KeyEvent.VK_O, Event.CTRL_MASK), "Color");
                htmlPane.getActionMap().put("Color", a);
            }
        } else {
            if (sType.equalsIgnoreCase("style")) {
                htmlPane.getActionMap().remove("Bold");
                htmlPane.getActionMap().remove("Italic");
                htmlPane.getActionMap().remove("Underline");
            }
            if (sType.equalsIgnoreCase("align")) {
                htmlPane.getActionMap().remove("Left");
                htmlPane.getActionMap().remove("Center");
                htmlPane.getActionMap().remove("Right");
            }
            if (sType.equalsIgnoreCase("font"))
                htmlPane.getActionMap().remove("Font");
            if (sType.equalsIgnoreCase("color"))
                htmlPane.getActionMap().remove("Color");
        }
    }
 
    // mouse listener
    MouseListener mouseListener = new MouseListener() {
        public void mouseClicked(MouseEvent e) {
            log("mouse-clicked:" + e.getClickCount());
            Rectangle r = null;
            if (bHTML && bHTMLCanExtend) {
                if (e.getClickCount() > 1) {
                    if (!bHTMLExtend) {
                        r = VTA.getParent().getBounds();
                        extendPanel(5, 5, r.width - 5, r.height - 5);
                    } else {
                        extendPanel(rHTMLFrame.x, rHTMLFrame.y, rHTMLFrame.width, rHTMLFrame.height);
                    }
                    bHTMLExtend = !bHTMLExtend;
                }
            }
            if (bBigText && bBigCanExtend) {
                if (e.getClickCount() > 1) {
                    if (!bBigExtend) {
                        r = VTA.getParent().getBounds();
                        extendBigPanel(5, 5, r.width - 5, r.height - 5);
                    } else {
                        extendBigPanel(rHTMLFrame.x, rHTMLFrame.y, rHTMLFrame.width, rHTMLFrame.height);
                    }
                    bBigExtend = !bBigExtend;
                }
            }            
        }

        public void mouseEntered(MouseEvent e) {
            if (bMouseEnter) {
                if (dBean != null) {
                    list_msg.clear();
                    Messages msg = new Messages(pEventMouseMsg, "ENTER");
                    list_msg.add(msg);
                    msg = new Messages(pItemName, sItemName);
                    list_msg.add(msg);
                    try {
                        if (dBean != null)
                            dBean.dispatchanevent(pEventMouseEvent, list_msg);
                    } catch (Exception ex) {
                    }
                    ;
                }
            }
        }

        public void mouseExited(MouseEvent e) {
            if (bMouseExit) {
                if (dBean != null) {
                    list_msg.clear();
                    Messages msg = new Messages(pEventMouseMsg, "EXIT");
                    list_msg.add(msg);
                    msg = new Messages(pItemName, sItemName);
                    list_msg.add(msg);
                    try {
                        if (dBean != null)
                            dBean.dispatchanevent(pEventMouseEvent, list_msg);
                    } catch (Exception ex) {
                    }
                    ;
                }
            }
        }

        public void mouseReleased(MouseEvent e) {
            if (bMouseClick) {
                if (dBean != null) {
                    list_msg.clear();
                    Messages msg = new Messages(pEventMouseMsg, "CLICK");
                    list_msg.add(msg);
                    msg = new Messages(pItemName, sItemName);
                    list_msg.add(msg);
                    try {
                        if (dBean != null)
                            dBean.dispatchanevent(pEventMouseEvent, list_msg);
                    } catch (Exception ex) {
                    }
                    ;
                }
            }
        }

        public void mousePressed(MouseEvent e) {
        }
    };
    
    // extended panel
    void extendPanel(int x, int y, int w, int h) {
        scrollPane.setLocation(x,y);
        Dimension dim = new Dimension(w, h) ;
        htmlPane.setSize(dim);
        dim.width  = dim.width  - 6 - (htmlPane.getInsets().left + htmlPane.getInsets().right);
        dim.height = dim.height - 6 - (htmlPane.getInsets().top + htmlPane.getInsets().bottom);
        scrollPane.setSize(dim); 
        htmlPane.setSize(dim);
        htmlPane.repaint();
    }
    
    // extended Big text panel
    void extendBigPanel(int x, int y, int w, int h) {
        ps.setLocation(x,y);
        Dimension dim = new Dimension(w, h) ;
        jtp.setSize(dim);
        dim.width  = dim.width  - 6 - (jtp.getInsets().left + jtp.getInsets().right);
        dim.height = dim.height - 6 - (jtp.getInsets().top + jtp.getInsets().bottom);
        ps.setSize(dim); 
        jtp.setSize(dim);
        jtp.repaint();
    }    
    
    // seach a string in BIG text and highlight token found
    public void search() {
        hilit.removeAllHighlights();
        
        String s = sBigSearch;
        if (s.length() <= 0) {
            log("Nothing to search");
            return;
        }
        
        String content = jtp.getText();
        int index = content.indexOf(s, iSearchStart);
        if (index >= 0) {   // match found
            try {
                int end = index + s.length();
                iSearchStart = end ;
                hilit.addHighlight(index, end, painter);
                jtp.setCaretPosition(end);
                log("'" + s + "' found. Press F3 to search next or ESC to stop");
            } catch (BadLocationException e) {
                e.printStackTrace();
            }
        } else {
            iSearchStart = 0;
        }
    }    
    
    // stop higlighting on search
    class CancelAction extends AbstractAction {
        public void actionPerformed(ActionEvent ev) {
            hilit.removeAllHighlights();
        }
    }
    // search next token
    class NextAction extends AbstractAction {
        public void actionPerformed(ActionEvent ev) {
            search();
        }
    }     
    
}