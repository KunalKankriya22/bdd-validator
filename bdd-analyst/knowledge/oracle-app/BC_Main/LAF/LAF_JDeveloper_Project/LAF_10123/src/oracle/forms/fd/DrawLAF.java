package oracle.forms.fd;

import java.awt.AWTException;
import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Composite;
import java.awt.Container;
import java.awt.Desktop;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Frame;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GraphicsConfiguration;
import java.awt.GraphicsDevice;
import java.awt.GraphicsEnvironment;
import java.awt.HeadlessException;
import java.awt.Image;
import java.awt.Insets;
import java.awt.Point;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.Robot;
import java.awt.Shape;
import java.awt.TexturePaint;
import java.awt.Toolkit;
import java.awt.Transparency;
import java.awt.datatransfer.Clipboard;
import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.StringSelection;
import java.awt.datatransfer.Transferable;
import java.awt.datatransfer.UnsupportedFlavorException;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.ComponentEvent;
import java.awt.event.ComponentListener;
import java.awt.event.FocusEvent;
import java.awt.event.InputEvent;
import java.awt.event.KeyEvent;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.awt.event.WindowListener;
import java.awt.font.FontRenderContext;
import java.awt.font.GlyphVector;
import java.awt.font.TextLayout;
import java.awt.geom.AffineTransform;
import java.awt.geom.Ellipse2D;
import java.awt.geom.GeneralPath;
import java.awt.geom.Line2D;
import java.awt.geom.PathIterator;
import java.awt.geom.Point2D;
import java.awt.geom.Rectangle2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.awt.image.ColorModel;
import java.awt.image.PixelGrabber;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;

import java.lang.reflect.Method;

import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.UnknownHostException;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Types;

import java.text.DateFormat;
import java.text.SimpleDateFormat;

import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.SortedMap;
import java.util.StringTokenizer;
import java.util.TreeMap;

import javax.print.PrintService;
import javax.print.PrintServiceLookup;

import javax.swing.BorderFactory;
import javax.swing.Icon;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JColorChooser;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JProgressBar;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.JTextPane;
import javax.swing.SwingUtilities;
import javax.swing.ToolTipManager;
import javax.swing.UIManager;
import javax.swing.border.AbstractBorder;
import javax.swing.border.Border;
import javax.swing.border.EtchedBorder;
import javax.swing.text.MutableAttributeSet;
import javax.swing.text.StyleConstants;
import javax.swing.text.StyledDocument;

import oracle.ewt.event.AnyEventListener;
import oracle.ewt.event.KeyStroke;
import oracle.ewt.lwAWT.lwMenu.LWMenu;
import oracle.ewt.lwAWT.lwMenu.LWMenuBar;
import oracle.ewt.lwAWT.lwMenu.LWMenuItem;
import oracle.ewt.lwAWT.lwMenu.LWPopupMenu;
import oracle.ewt.painter.BorderPainter;

import oracle.forms.engine.Main;
import oracle.forms.handler.IHandler;
import oracle.forms.properties.BorderBevel;
import oracle.forms.properties.ID;
import oracle.forms.ui.CustomEvent;
import oracle.forms.ui.ExtendedFrame;
import oracle.forms.ui.VBean;

// MLT-7702 03/12/2025
//import quicktime.QTException;
//import quicktime.QTSession;
//
//import quicktime.app.view.MoviePlayer;
//import quicktime.app.view.QTFactory;
//
//import quicktime.qd.QDRect;
//
//import quicktime.std.StdQTConstants;
//import quicktime.std.StdQTConstants4;
//import quicktime.std.StdQTException;
//import quicktime.std.movies.Movie;
//import quicktime.std.movies.media.DataRef;



/**
 * A javabean to draw on the Forms current canevas
 * <br />
 * needs, at least, the JRE 1.6
 * <br />
 * @author   Francois Degrelle
 * creation  February 2007
 */

public class DrawLAF extends VBean {
    public final static String VERSION = "1.7.7.2";
    public final static String AUTHORS[] =
        new String[] { "<b>Francois Degrelle</b>", "<b>John Vander Heyden</b> - laf.pll",
                       "<b>Albert Ellen</b> - laf.pll", "<b>Thanh H. BUI</b> - laf.pll, DrawLAF.java",
                       "<b>Tom Cleymans</b> - Dispatching Bean", "<b>Anthony Hegarty</b> - DrawLAF.java" };
    // Module content print
    public final static ID exportPutLine = ID.registerProperty("EXPORT_PUT_LINE");
    public final static ID exportSetFilename = ID.registerProperty("EXPORT_SET_FILENAME");
    public final static ID exportGetTempDir = ID.registerProperty("EXPORT_GET_TEMP_DIR");
    public final static ID pointTextLabel = ID.registerProperty("POINT_TEXT_LABEL");    
    public final static ID getTextLabel = ID.registerProperty("GET_TEXT_LABEL");
    // Canvas mouse move
    public final static ID canvasMouseMove = ID.registerProperty("CANVAS_MOUSE_MOVE");
    public final static ID canvasMouseClick = ID.registerProperty("CANVAS_MOUSE_CLICK");
    public final static ID mouseXpos = ID.registerProperty("MOUSE_X_POS");
    public final static ID mouseYpos = ID.registerProperty("MOUSE_Y_POS");
    // shape animation
    public final static ID shapeMoveTo = ID.registerProperty("SHAPE_MOVE_TO");
    public final static ID shapeRotateTo = ID.registerProperty("SHAPE_ROTATE_TO");
    public final static ID shapeStretchTo = ID.registerProperty("SHAPE_STRETCH_TO");
    public final static ID shapeMoveEvent = ID.registerProperty("SHAPE_MOVE_EVENT");
    public final static ID shapeMoveDone = ID.registerProperty("SHAPE_MOVE_DONE");
    public final static ID shapeAddAnimationStep = ID.registerProperty("SHAPE_ADD_ANIMATION_STEP");
    public final static ID shapePlayAnimation = ID.registerProperty("SHAPE_PLAY_ANIMATION");
    public final static ID shapeClearAnimation = ID.registerProperty("SHAPE_CLEAR_ANIMATION");
    public final static ID animationDelay = ID.registerProperty("ANIMATION_DELAY");
    // shape transformation
    public final static ID transformGraphic = ID.registerProperty("TRANSFORM_GRAPHIC");
    // shape properties
    public final static ID pointShapeProperty = ID.registerProperty("POINT_SHAPE_PROPERTY");
    public final static ID setShapeProperty = ID.registerProperty("SHAPE_SET_PROPERTY");    
    public final static ID getShapeProperty = ID.registerProperty("SHAPE_GET_PROPERTY");    
    
    // Draw on canvas
    public final static ID setScheme = ID.registerProperty("SET_SCHEME");
    public final static ID setSchemeColors = ID.registerProperty("SET_SCHEME_COLORS");
    public final static ID setGradient = ID.registerProperty("SET_GRADIENT_COLORS");
    public final static ID addLinearGradient = ID.registerProperty("ADD_LINEAR_GRADIENT");
    public final static ID setGradientT = ID.registerProperty("SET_GRADIENT_TEXT");
    public final static ID setDirection = ID.registerProperty("SET_GRADIENT_DIRECTION");
    public final static ID setHCycle = ID.registerProperty("SET_H_CYCLE");
    public final static ID setVCycle = ID.registerProperty("SET_V_CYCLE");
    public final static ID removeGraphic = ID.registerProperty("REMOVE_GRAPHIC");
    public final static ID removeLines = ID.registerProperty("REMOVE_LINES");
    public final static ID removeRects = ID.registerProperty("REMOVE_RECTS");
    public final static ID removeShapes = ID.registerProperty("REMOVE_SHAPES");
    public final static ID removeTexts = ID.registerProperty("REMOVE_TEXTS");
    public final static ID removeEllipses = ID.registerProperty("REMOVE_ELLIPSES");
    public final static ID addShape = ID.registerProperty("ADD_SHAPE");
    public final static ID addEllipse = ID.registerProperty("ADD_ELLIPSE");
    public final static ID addLine = ID.registerProperty("ADD_LINE");
    public final static ID addRect = ID.registerProperty("ADD_RECT");
    public final static ID addText = ID.registerProperty("ADD_TEXT");
    public final static ID addText2 = ID.registerProperty("ADD_TEXT2");
    public final static ID setTextLabel = ID.registerProperty("SET_TEXT_LABEL");
    public final static ID addImage = ID.registerProperty("ADD_IMAGE");
    public final static ID setText = ID.registerProperty("SET_TEXT");
    public final static ID getScheme = ID.registerProperty("GET_SCHEME");
    public final static ID getSchemeColor = ID.registerProperty("GET_SCHEME_COLOR");
    public final static ID getSchemeColorLight = ID.registerProperty("GET_SCHEME_COLOR_LIGHT");
    public final static ID getTextWidth = ID.registerProperty("GET_TEXT_WIDTH");
    public final static ID getTextHeight = ID.registerProperty("GET_TEXT_HEIGHT");
    public final static ID getTextSize = ID.registerProperty("GET_TEXT_SIZE");
    public final static ID clear = ID.registerProperty("CLEAR");
    public final static ID setSorted = ID.registerProperty("SET_SORTED_LIST");
    public final static ID setEPoplists = ID.registerProperty("SET_ENHANCED_POPLISTS");
    public final static ID setMultiSelect = ID.registerProperty("SET_MULTI_SELECTION");
    public final static ID setListOrient = ID.registerProperty("SET_LIST_ORIENTATION");
    public final static ID setTimeKeySel = ID.registerProperty("SET_TIME_KEY_SELECT");
    public final static ID setApplyScheme = ID.registerProperty("SET_APPLY_SCHEME");
    public final static ID setCurrentWindowIcon = ID.registerProperty("SET_CURRENT_WINDOW_ICON");
    public final static ID setWindowIcon = ID.registerProperty("SET_WINDOW_ICON");
    public final static ID setAllWindowsIcon = ID.registerProperty("SET_ALL_WINDOWS_ICON");
    public final static ID setWinMDIIcon = ID.registerProperty("SET_WIN_MDI_ICON");
    public final static ID setRolloverColor = ID.registerProperty("SET_FOCUS_BORDER_COLOR");
    public final static ID setMotif = ID.registerProperty("SET_MOTIF");
    public final static ID refresh = ID.registerProperty("REFRESH");
    public final static ID setLog = ID.registerProperty("SET_LOG");
    public final static ID setLogPaint = ID.registerProperty("SET_LOG_PAINT");

    // Status Bar properties
    public final static ID setStatusBarValue = ID.registerProperty("SET_STATUSBAR_VALUE");
    public final static ID setStatusBarIndex = ID.registerProperty("SET_STATUSBAR_INDEX");
    public final static ID getStatusBarValue = ID.registerProperty("GET_STATUSBAR_VALUE");
    public final static ID showStatusBar      = ID.registerProperty("SHOW_STATUSBAR");
    public final static ID showStatusBarLine2 = ID.registerProperty("SHOW_STATUSBAR_SECOND_LINE");

    // Flash properties
    public final static ID pFlashSetText = ID.registerProperty("SET_FLASH_TEXT");
    public final static ID pFlashSetText2 = ID.registerProperty("SET_FLASH_TEXT2");
    public final static ID pFlashSetFont = ID.registerProperty("SET_FLASH_FONT");
    public final static ID pFlashSetColors = ID.registerProperty("SET_FLASH_COLORS");
    public final static ID pFlashSetShadow = ID.registerProperty("SET_FLASH_SHADOW_COLOR");
    public final static ID psetSoundFile = ID.registerProperty("SET_SOUND_FILE");
    public final static ID psetSoundBase = ID.registerProperty("SET_SOUND_BASE");
    public final static ID pSoundplay = ID.registerProperty("PLAY_SOUND");
    public final static ID pSoundplayLoop = ID.registerProperty("PLAY_SOUND_LOOP");
    public final static ID pSoundStop = ID.registerProperty("STOP_SOUND");
    public final static ID pSoundRemoveAll = ID.registerProperty("REMOVE_ALL_SOUNDS");
    public final static ID pSoundRemove = ID.registerProperty("REMOVE_SOUND");
    public final static ID pSoundLog = ID.registerProperty("SOUND_SET_LOG");
    public final static ID pGetWindows = ID.registerProperty("GET_WINDOWS");

    // Element personalization properties
    public final static ID GetComponents = ID.registerProperty("DRAW_GUI_ELEMENTS");
    public final static ID SetCompProp = ID.registerProperty("SET_GUI_PROPERTIES");
    public final static ID CBDrawBackground = ID.registerProperty("CB_DRAW_BACKGROUND");
    public final static ID CBBackgroundColor = ID.registerProperty("SET_CBOX_BG_COLOR");

    // InputDialogBox
    public final static ID psetDialogProps = ID.registerProperty("SET_DIALOG_PROPS");
    public final static ID pInputDialog = ID.registerProperty("SET_INPUT_DIALOG");
    public final static ID pDialogGetString = ID.registerProperty("GET_INPUT_DIALOG");
    // Display message box
    public final static ID pDisplayDialog = ID.registerProperty("DISPLAY_MESSAGE");
    public final static ID pDisplayAlert = ID.registerProperty("DISPLAY_ALERT");
    public final static ID pGetAlertButton = ID.registerProperty("GET_ALERT_BUTTON");

    // Frames properties
    public final static ID pSetFrame = ID.registerProperty("SET_FRAME");
    public final static ID pSetFrameProp = ID.registerProperty("SET_FRAME_PROPERTY");
    public final static ID pSetFrameText = ID.registerProperty("SET_FRAME_TEXT");
    public final static ID pSetFrameTextAlign = ID.registerProperty("SET_FRAME_TEXT_ALIGNMENT");
    public final static ID pSetFrameTextOpaque = ID.registerProperty("SET_FRAME_TEXT_OPAQUE");
    public final static ID pSetFrameFont = ID.registerProperty("SET_FRAME_FONT");
    public final static ID pSetFrameBackground = ID.registerProperty("SET_FRAME_BACKGROUND");
    public final static ID pSetFrameColors = ID.registerProperty("SET_FRAME_COLORS");
    public final static ID pSetFrameGradOrient = ID.registerProperty("SET_FRAME_GRADIENT_ORIENTATION");
    public final static ID pSetFrameRounded = ID.registerProperty("SET_FRAME_ROUND_BORDER");
    public final static ID pSetBounds = ID.registerProperty("SET_FRAME_BOUNDS");
    public final static ID pSetFrameHCycle = ID.registerProperty("SET_FRAME_HCYCLE");
    public final static ID pSetFrameVCycle = ID.registerProperty("SET_FRAME_VCYCLE");
    public final static ID pSetFrameTitleColor = ID.registerProperty("SET_FRAME_TITLE_COLOR");
    public final static ID pShowFrame = ID.registerProperty("SHOW_FRAME");
    public final static ID pShowFrameBox = ID.registerProperty("SHOW_FRAME_BOX");
    public final static ID pHideFrame = ID.registerProperty("HIDE_FRAME");
    public final static ID pRemoveFrame = ID.registerProperty("REMOVE_FRAME");
    public final static ID pRemoveAllFrames = ID.registerProperty("REMOVE_ALL_FRAMES");
    public final static ID pPrintHashMap = ID.registerProperty("PRINT_FRAME_MAP");
    public final static ID pSetFrameBorderGradient = ID.registerProperty("SET_FRAME_BORDER_GRADIENT");
    public final static ID pSetFrameShadowGradient = ID.registerProperty("SET_FRAME_SHADOW_GRADIENT");
    // Tabs properties
    public final static ID pSetTabColors = ID.registerProperty("SET_TAB_COLORS");
    public final static ID pSetTabSelColors = ID.registerProperty("SET_TAB_SELECTED_COLORS");
    public final static ID pSetTabFont = ID.registerProperty("SET_TAB_FONT");
    public final static ID pSetTabItemIcon = ID.registerProperty("SET_TAB_ITEM_ICON");
    public final static ID pSetTabItemTooltip = ID.registerProperty("SET_TAB_ITEM_TOOLTIP");
    public final static ID pRefreshTabs = ID.registerProperty("SET_TAB_REFRESH");

    // About box
    public final static ID pShowAbout = ID.registerProperty("SHOW_ABOUT");

    // Miscellaneous
    public final static ID pSearchTextItems = ID.registerProperty("SEARCH_TEXT_ITEMS");
    public final static ID pSetRGBColor = ID.registerProperty("SET_COLORCHOOSER_VALUES");
    public final static ID pGetRGBColor = ID.registerProperty("GET_COLORCHOOSER_COLOR");
    public final static ID pDrawFocusLines = ID.registerProperty("DRAW_FOCUS_LINES");
    public final static ID pSetAllHLColors = ID.registerProperty("SET_ALL_HYPER_LINK_COLORS");
    public final static ID pSetButtonFocusMark = ID.registerProperty("SET_BUTTONS_FOCUS_MARK");
    public final static ID pSetMemoryLog = ID.registerProperty("SET_MEMORY_LOG");
    public final static ID pSetQuickExit = ID.registerProperty("SET_QUICK_EXIT");

    // restore initial menu bar, window caption, status bar font/colors
    public final static ID setInitMenu = ID.registerProperty("INITIAL_MENU_COLOR");
    public final static ID setInitWindow = ID.registerProperty("INITIAL_WINDOW_COLOR");
    public final static ID setInitStatus = ID.registerProperty("INITIAL_STATUS_COLOR");

    // dynamic menus
    public final static ID GetMenu = ID.registerProperty("GET_MENU");
    public final static ID AddMenu = ID.registerProperty("ADD_MENU");
    public final static ID AddMenuOption = ID.registerProperty("ADD_MENU_OPTION");
    public final static ID StatusMenu = ID.registerProperty("SET_STATUS_MENU");
    public final static ID StatusMenuOption = ID.registerProperty("SET_STATUS_MENU_OPTION");
    public final static ID VisibleMenu = ID.registerProperty("SET_VISIBLE_MENU");
    public final static ID VisibleMenuOption = ID.registerProperty("SET_VISIBLE_MENU_OPTION");
    public final static ID MoveWinMenuOption = ID.registerProperty("MOVE_WIN_MENU_OPTION");
    public final static ID DelMenuOption = ID.registerProperty("REMOVE_MENU_OPTION");
    public final static ID ShowMenuBar = ID.registerProperty("SHOW_MENU_BAR");
    public final static ID MENUMSG = ID.registerProperty("MENU_MSG");
    public final static ID MENUOPTION = ID.registerProperty("MENU_OPTION");

    // socket server
    public final static ID initServer = ID.registerProperty("INIT_SERVER");
    public final static ID stopServer = ID.registerProperty("STOP_SERVER");
    public final static ID serverLog = ID.registerProperty("SOCKET_SERVER_LOG");
    private LAFSocketServer SocketServer;

    // image pressed
    public final static ID IMAGECLICKED = ID.registerProperty("IMAGE_CLICKED");
    public final static ID IMAGENAME = ID.registerProperty("IMAGE_NAME");

    // paint text items focus background
    public final static ID setFocusBG = ID.registerProperty("SET_FOCUS_BACKGROUND");

    //Canvas
    public final static ID CanvasResized = ID.registerProperty("SET_CANVAS_RESIZED");

    // memory
    public final static ID printMemory = ID.registerProperty("PRINT_MEMORY");
    public final static ID getTotalMemory = ID.registerProperty("GET_TOTAL_MEMORY");
    public final static ID getFreeMemory = ID.registerProperty("GET_FREE_MEMORY");
    public final static ID getUsedMemory = ID.registerProperty("GET_USED_MEMORY");

    // Scrolling Panel
    public final static ID SET_SCROLL_PANEL = ID.registerProperty("SET_SCROLL_PANEL");
    public final static ID SET_SCROLL_DURATION = ID.registerProperty("SET_SCROLL_DURATION");
    public final static ID SET_SCROLL_BAR = ID.registerProperty("SET_SCROLL_PANEL_SCROLLBAR");
    public final static ID SET_SCROLL_TEXT = ID.registerProperty("SET_SCROLL_PANEL_TEXT");
    public final static ID SET_SCROLL_ESCAPE = ID.registerProperty("SET_SCROLL_PANEL_ESCAPE");
    public final static ID SET_SCROLL_FRAME = ID.registerProperty("SET_SCROLL_PANEL_FRAME");
    public final static ID SET_SCROLL_EXTENDS = ID.registerProperty("SET_SCROLL_PANEL_EXTENDS");
    public final static ID SET_SCROLL_COLOR = ID.registerProperty("SET_SCROLL_PANEL_COLOR");
    public final static ID SET_SCROLL_FONT = ID.registerProperty("SET_SCROLL_PANEL_FONT");
    public final static ID SET_SCROLL_LOG = ID.registerProperty("SET_SCROLL_PANEL_LOG");
    public final static ID SET_SCROLL_OPAQUE = ID.registerProperty("SET_SCROLL_PANEL_OPAQUE");
    public final static ID SET_SCROLL_BORDER = ID.registerProperty("SET_SCROLL_PANEL_BORDER");
    public final static ID SET_SCROLL_INFO_TXT = ID.registerProperty("SET_SCROLL_PANEL_INFO_TEXT");
    public final static ID SET_SCROLL_INFO_PROP = ID.registerProperty("SET_SCROLL_PANEL_INFO_PROPERTIES");
    public final static ID SET_SCROLL_HTOOLB = ID.registerProperty("SET_SCROLL_HORIZONTAL_TOOLBAR");
    public final static ID SET_SCROLL_VTOOLB = ID.registerProperty("SET_SCROLL_VERTICAL_TOOLBAR");
    public final static ID SET_SCROLL_LINKS = ID.registerProperty("SET_SCROLL_ALLOW_LINKS");
    public final static ID SET_SCROLL_ERROR = ID.registerProperty("SET_SCROLL_TEXT_ERROR");
    public final static ID SHOW_SCROLL_PANEL = ID.registerProperty("SHOW_SCROLL_PANEL");

    // Robot properties
    public final static ID CREATE_ROBOT = ID.registerProperty("CREATE_ROBOT");
    public final static ID SET_ROBOT_STEP = ID.registerProperty("SET_ROBOT_STEP");
    public final static ID SET_ROBOT_FORMS_STEP = ID.registerProperty("SET_ROBOT_FORMS_STEP");
    public final static ID SET_ROBOT_FILE_NAME = ID.registerProperty("SET_ROBOT_FILE_NAME");
    public final static ID SET_ROBOT_FORMS_STEPS = ID.registerProperty("SET_ROBOT_FORMS_STEPS");
    public final static ID SET_ROBOT_FORMS_BLT = ID.registerProperty("SET_ROBOT_FORMS_BUILTIN");
    public final static ID SET_ROBOT_FORMS_PMT = ID.registerProperty("SET_ROBOT_FORMS_PARAMETERS");
    public final static ID SET_ROBOT_INFOS = ID.registerProperty("SET_ROBOT_INFOS");
    public final static ID SET_ROBOT_INFO_MENU = ID.registerProperty("SET_ROBOT_INFO_MENU");
    public final static ID SET_ROBOT_BUBBLE = ID.registerProperty("SET_ROBOT_BUBBLE");
    public final static ID SET_ROBOT_SHAPE = ID.registerProperty("SET_ROBOT_SHAPE");
    public final static ID SET_ROBOT_ABORT_SCRIPT = ID.registerProperty("SET_ROBOT_ABORT_SCRIPT");
    public final static ID SET_ROBOT_END = ID.registerProperty("SET_ROBOT_END");
    public final static ID SET_ROBOT_TEXT_PROPS = ID.registerProperty("SET_ROBOT_TEXT_PROPERTIES");
    public final static ID SET_ROBOT_BUBBLE_PROPS = ID.registerProperty("SET_ROBOT_BUBBLE_PROPERTIES");
    public final static ID SET_ROBOT_SHAPE_PROPS = ID.registerProperty("SET_ROBOT_SHAPE_PROPERTIES");
    public final static ID DESTROY_ROBOT = ID.registerProperty("DESTROY_ROBOT");

    // TexturePaint properties
    public final static ID ADD_TEXTUREPAINT = ID.registerProperty("ADD_TEXTUREPAINT");
    public final static ID REMOVE_TEXTUREPAINT = ID.registerProperty("REMOVE_TEXTUREPAINT");
    public final static ID REMOVE_ALL_TEXTUREPAINT = ID.registerProperty("REMOVE_ALL_TEXTUREPAINT");

    // Item creation properties
    public final static ID ADD_BUTTON = ID.registerProperty("ADD_BUTTON");
    public final static ID ADD_TEXTFIELD = ID.registerProperty("ADD_TEXTFIELD");
    public final static ID ADD_TEXTFIELD2 = ID.registerProperty("ADD_TEXTFIELD2");
    public final static ID ADD_TEXTAREA = ID.registerProperty("ADD_TEXTAREA");
    public final static ID ADD_TEXTAREA2 = ID.registerProperty("ADD_TEXTAREA2");
    public final static ID ADD_PASSWORDFIELD = ID.registerProperty("ADD_PASSWORDFIELD");
    public final static ID ADD_LABEL = ID.registerProperty("ADD_LABEL");
    public final static ID ADD_CHECKBOX = ID.registerProperty("ADD_CHECKBOX");
    public final static ID ADD_SLIDER = ID.registerProperty("ADD_SLIDER");
    public final static ID DELETE_ITEM = ID.registerProperty("DELETE_ITEM");
    public final static ID DELETE_ALL_ITEMS = ID.registerProperty("DELETE_ALL_ITEMS");
    public final static ID GO_ITEM = ID.registerProperty("GO_ITEM");
    public final static ID NEW_ITEM_PROPERTY = ID.registerProperty("NEW_ITEM_PROPERTY");
    public final static ID NEW_ITEM_PANEL_PROPERTY = ID.registerProperty("NEW_ITEM_PANEL_PROPERTY");
    public final static ID ITEM_SET_PANEL = ID.registerProperty("ITEM_SET_PANEL");
    public final static ID ITEM_DELETE_PANEL = ID.registerProperty("ITEM_DELETE_PANEL");
    public final static ID ITEM_NAVIGATION_INSIDE = ID.registerProperty("ITEM_NAVIGATION_INSIDE");
    public final static ID ITEM_ACTION = ID.registerProperty("ITEM_ACTION");
    public final static ID ITEM_ACTION_NAME = ID.registerProperty("ITEM_ACTION_NAME");
    public final static ID ITEM_ACTION_TYPE = ID.registerProperty("ITEM_ACTION_TYPE");
    public final static ID ITEM_ACTION_OBJECT = ID.registerProperty("ITEM_ACTION_OBJECT");
    public final static ID ITEM_ACTION_VALUE = ID.registerProperty("ITEM_ACTION_VALUE");
    public final static ID ITEM_ACTION_MOUSEPOS = ID.registerProperty("ITEM_ACTION_MOUSEPOS");
    public final static ID ITEM_ACTION_MOUSEBUTTON = ID.registerProperty("ITEM_ACTION_MOUSEBUTTON");
    public final static ID ITEM_ACTION_ITEM_NAME = ID.registerProperty("ITEM_ACTION_ITEM_NAME");
    public final static ID ITEM_SET_INDICE = ID.registerProperty("ITEM_SET_INDICE");
    public final static ID ITEM_GET_VALUE = ID.registerProperty("ITEM_GET_VALUE");

    // Images
    public final static ID IMG_NEW = ID.registerProperty("IMG_NEW");
    public final static ID IMG_DELETE = ID.registerProperty("IMG_DELETE");
    public final static ID IMG_DELETE_ALL = ID.registerProperty("IMG_DELETE_ALL");
    public final static ID IMG_SETPOS = ID.registerProperty("IMG_SET_POSITION");
    public final static ID IMG_SETBG = ID.registerProperty("IMG_SET_BACKGROUND");
    public final static ID IMG_SETLEGEND = ID.registerProperty("IMG_SET_LEGEND");
    public final static ID IMG_SETLOG = ID.registerProperty("IMG_SET_LOG");
    public final static ID IMG_CLEAR = ID.registerProperty("IMG_CLEAR");
    public final static ID IMG_GETSIZE = ID.registerProperty("IMG_GETSIZE");
    public final static ID IMG_READIMGBASE = ID.registerProperty("IMG_READIMGBASE");
    public final static ID IMG_READIMGFILE = ID.registerProperty("IMG_READIMGFILE");
    public final static ID IMG_GETIMAGE = ID.registerProperty("IMG_GET_IMAGE");
    public final static ID IMG_GETIMAGE_SIZE = ID.registerProperty("IMG_GET_IMAGE_SIZE");
    public final static ID IMG_GETIMAGE_WIDTH = ID.registerProperty("IMG_GET_IMAGE_WIDTH");
    public final static ID IMG_GETIMAGE_HEIGHT = ID.registerProperty("IMG_GET_IMAGE_HEIGHT");
    public final static ID IMG_SCALEIMAGE = ID.registerProperty("IMG_SCALE_IMAGE");
    public final static ID IMG_CENTERIMAGE = ID.registerProperty("IMG_CENTER_IMAGE");
    public final static ID IMG_LABELCOLOR = ID.registerProperty("IMG_LABEL_COLOR");
    public final static ID IMG_SETSCROLL = ID.registerProperty("IMG_SET_SCROLLBARS");
    public final static ID IMG_SETBORDER = ID.registerProperty("IMG_SET_BORDER");
    public final static ID IMG_SETFILECHOOSER = ID.registerProperty("IMG_SET_FILECHOOSER_TITLE");
    public final static ID IMG_SETCHOOSERLAF = ID.registerProperty("IMG_SET_FILECHOOSER_LAF");
    public final static ID IMG_SETTOOLTIP = ID.registerProperty("IMG_SET_TOOLTIP");
    public final static ID IMG_SET_INDICE = ID.registerProperty("IMG_SET_INDICE");
    public final static ID IMG_GETFILENAME = ID.registerProperty("IMG_GET_FILE_NAME");
    public final static ID IMG_KEYEVENT = ID.registerProperty("IMG_KEY_EVENT");
    public final static ID IMG_KEYTYPED = ID.registerProperty("IMG_KEY_PRESSED");
    public final static ID IMG_KEYCODE = ID.registerProperty("IMG_KEY_CODE");
    public final static ID IMG_KEYCHAR = ID.registerProperty("IMG_KEY_CHAR");
    public final static ID IMG_KEYMOD = ID.registerProperty("IMG_KEY_MODIFIER");
    public final static ID IMG_SETDND = ID.registerProperty("IMG_SET_DND");
    public final static ID IMG_SETSHOW = ID.registerProperty("IMG_SET_DBLCLICK_SHOW_IMAGE");    

    // Popup menu properties
    public final static ID CREATE_POPUP_MENU = ID.registerProperty("CREATE_POPUP_MENU");
    public final static ID SET_POPUP_MENU = ID.registerProperty("SET_POPUP_MENU");
    public final static ID SET_POPUP_MENU_FONT = ID.registerProperty("SET_POPUP_MENU_FONT");
    public final static ID SET_POPUP_MENU_ICON = ID.registerProperty("SET_POPUP_MENU_ICON");
    public final static ID SET_POPUP_MENU_FONT_COLOR = ID.registerProperty("SET_POPUP_MENU_FONT_COLOR");
    public final static ID ADD_POPUP_MENU_OPTION = ID.registerProperty("ADD_POPUP_MENU_OPTION");
    public final static ID REMOVE_POPUP_MENU_OPTION = ID.registerProperty("REMOVE_POPUP_MENU_OPTION");
    public final static ID SET_POPUP_MENU_OPTION_PROPERTY = ID.registerProperty("SET_POPUP_MENU_OPTION_PROPERTY");
    public final static ID SHOW_POPUP_MENU = ID.registerProperty("SHOW_POPUP_MENU");
    public final static ID DELETE_POPUP_MENU = ID.registerProperty("DELETE_POPUP_MENU");

    // table-block sorter by Thanh Hoang BUI
    public final static ID IMG_HEADER = ID.registerProperty("IMG_HEADER");
    public final static ID IMG_HEADER_ICONS = ID.registerProperty("IMG_HEADER_ICONS");
    public final static ID IMG_HEADER_CLICKED = ID.registerProperty("IMG_HEADER_CLICKED");
    public final static ID IMG_HEADER_SORT_VALUE = ID.registerProperty("IMG_HEADER_SORT_VALUE");
    public final static ID IMG_HEADER_SORT_COL = ID.registerProperty("IMG_HEADER_SORT_COL");
    public final static ID IMG_HEADER_BLOCK_NAME = ID.registerProperty("IMG_HEADER_BLOCK_NAME");

    // window properties
    public final static ID SET_WINDOW_PROPERTY = ID.registerProperty("SET_WINDOW_PROPERTY");

    // JDBC methods
    public final static ID pDBInitProc = ID.registerProperty("DB_SET_PROCEDURE");
    public final static ID pDBInitFunc = ID.registerProperty("DB_SET_FUNCTION");
    public final static ID pDBInitConn = ID.registerProperty("DB_SET_DBINFO");
    public final static ID pDBInitUser = ID.registerProperty("DB_SET_USER");
    public final static ID pDBSetPopup = ID.registerProperty("DB_SET_POPUP");
    public final static ID pDBInitPwd = ID.registerProperty("DB_SET_PWD");
    public final static ID pDBEvent = ID.registerProperty("DB_EVENT");
    public final static ID pDBName = ID.registerProperty("DB_NAME");
    public final static ID pDBResult = ID.registerProperty("DB_RESULT");
    public final static ID pDBError = ID.registerProperty("DB_ERROR");
    public final static ID pDBStart = ID.registerProperty("DB_START");
    public final static ID pDBEnd = ID.registerProperty("DB_END");

    // exec program methods
    public final static ID SETEXTPROG = ID.registerProperty("SET_EXT_PROG");
    public final static ID EXTMSGSTND = ID.registerProperty("EXT_MSGSTND");
    public final static ID EXTMSGERROR = ID.registerProperty("EXT_MSGERROR");
    public final static ID EXTMSGTEXT = ID.registerProperty("EXT_MSGTEXT");
    public final static ID EXTMSGEND = ID.registerProperty("EXT_MSGEND");

    // Images Spinner methods
    public final static ID SpinNew = ID.registerProperty("IMAGE_SPINNER_NEW");
    public final static ID SpinRemove = ID.registerProperty("IMAGE_SPINNER_REMOVE");
    public final static ID SpinSetImage = ID.registerProperty("IMAGE_SPINNER_SET_IMAGE");
    public final static ID SpinSetImageBase = ID.registerProperty("IMAGE_SPINNER_SET_IMAGE_BASE");
    public final static ID SpinSetLocation = ID.registerProperty("IMAGE_SPINNER_SET_LOCATION");
    public final static ID SpinDisplay = ID.registerProperty("IMAGE_SPINNER_DISPLAY");
    public final static ID SpinRefresh = ID.registerProperty("IMAGE_SPINNER_REFRESH");
    public final static ID SpinClean = ID.registerProperty("IMAGE_SPINNER_CLEAN");
    public final static ID SpinSetSize = ID.registerProperty("IMAGE_SPINNER_SET_SIZE");
    public final static ID SpinSetMaxSize = ID.registerProperty("IMAGE_SPINNER_SET_MAX_SIZE");
    public final static ID SpinSetScale = ID.registerProperty("IMAGE_SPINNER_SET_SCALE");
    public final static ID SpinSetKeepSize = ID.registerProperty("IMAGE_SPINNER_SET_KEEP_SIZE");
    public final static ID SpinSetMagnifier = ID.registerProperty("IMAGE_SPINNER_SET_MAGNIFIER");
    public final static ID SpinShowLegend = ID.registerProperty("IMAGE_SPINNER_SHOW_LEGEND");
    public final static ID SpinSetLegColors = ID.registerProperty("IMAGE_SPINNER_SET_LEGEND_COLORS");
    public final static ID SpinSetLegAlign = ID.registerProperty("IMAGE_SPINNER_SET_LEGEND_HALIGN");
    public final static ID SpinSetLegendFont = ID.registerProperty("IMAGE_SPINNER_SET_LEGEND_FONT");
    public final static ID SpinSetLegendPos = ID.registerProperty("IMAGE_SPINNER_SET_LEGEND_VALIGN");
    public final static ID SpinSetPanelBG = ID.registerProperty("IMAGE_SPINNER_SET_BACKGROUND");
    public final static ID SpinSetBorder = ID.registerProperty("IMAGE_SPINNER_SET_BORDER");
    public final static ID SpinSetButtColor = ID.registerProperty("IMAGE_SPINNER_BUTTON_COLOR");
    public final static ID SpinSetSpinner = ID.registerProperty("IMAGE_SPINNER_SET_CURRENT");
    public final static ID SpinSetLabels = ID.registerProperty("IMAGE_SPINNER_SET_LABELS");
    public final static ID SpinSetCurrImage = ID.registerProperty("IMAGE_SPINNER_SET_CURRENT_IMAGE");
    public final static ID SpinGetImageName = ID.registerProperty("IMAGE_SPINNER_GET_IMAGE_NAME");
    public final static ID SpinGetImage = ID.registerProperty("IMAGE_SPINNER_GET_IMAGE");
    public final static ID SpinGetNewList = ID.registerProperty("IMAGE_SPINNER_GET_NEW_LIST");
    public final static ID SPINNER_EVENT = ID.registerProperty("SPINNER_EVENT");
    public final static ID SPINNER_NAME = ID.registerProperty("SPINNER_NAME");
    public final static ID SPINNER_IMAGE_NAME = ID.registerProperty("SPINNER_IMAGE_NAME");
    public final static ID SetTooltipDisplayTime = ID.registerProperty("SET_TOOLTIP_DISPLAY_TIME");

    // Show In Rect
    public final static ID ShowInRect = ID.registerProperty("SHOW_IN_RECT");
    public final static ID ShowInRectEvt = ID.registerProperty("SHOW_IN_RECT_EVENT");
    public final static ID ShowInRectItm = ID.registerProperty("SHOW_IN_RECT_ITEM");
    public final static ID ShowInRectSts = ID.registerProperty("SHOW_IN_RECT_STATUS");

    // Desktop
    public final static ID setDesktop = ID.registerProperty("SET_DESKTOP");
    public final static ID setPrinter = ID.registerProperty("SET_DEFAULT_PRINTER");
    public final static ID getPrinter = ID.registerProperty("GET_DEFAULT_PRINTER");
    public final static ID getPrinterList = ID.registerProperty("GET_PRINTER_LIST");

    // Open/Save dialog
    public final static ID setOpenSave = ID.registerProperty("FILE_DIALOG");
    public final static ID getFileName = ID.registerProperty("GET_FILE_NAME");
    
    // Copy/Paste fro block copy
    public final static ID pasteClip  = ID.registerProperty("PASTE_FROM_CLIPBOARD");
    public final static ID copyClip   = ID.registerProperty("COPY_TO_CLIPBOARD");
    public final static ID getClip    = ID.registerProperty("GET_CLIPBOARD");
    
    // Dynamic Tables
    public final static ID TBNEW                 = ID.registerProperty("TB_NEW");
    public final static ID TBBACKGROUND          = ID.registerProperty("SET_TB_BACKGROUND");
    public final static ID TBREMOVE              = ID.registerProperty("TB_REMOVE");
    public final static ID TBSETHEADER           = ID.registerProperty("SET_TB_HEADER");  
    public final static ID TBSETCURRENT          = ID.registerProperty("SET_TB_CURRENT");      
    public final static ID TBSETFORMATS          = ID.registerProperty("SET_TB_FORMATS");
    public final static ID TBSETCOLSTYPE         = ID.registerProperty("SET_TB_COLS_TYPE");      
    public final static ID TBSETCOLSMAXWIDTH     = ID.registerProperty("SET_TB_COLS_MAX_WIDTH");
    public final static ID TBSETCELLPROP         = ID.registerProperty("SET_TB_CELL_PROPERTY");
    public final static ID TBSETCELLINSTPROP     = ID.registerProperty("SET_TB_CELL_INST_PROPERTY");
    public final static ID TBSETCELLVALUE        = ID.registerProperty("SET_TB_CELL_VALUE");    
    public final static ID TBSETCURCELLVALUE     = ID.registerProperty("SET_TB_CURRENT_CELL_VALUE");    
    public final static ID TBSETROWPROP          = ID.registerProperty("SET_TB_ROW_PROPERTY");
    public final static ID TBSETDATA             = ID.registerProperty("SET_TB_DATA");    
    public final static ID TBSETDATEFORMAT       = ID.registerProperty("SET_TB_DATE_FORMAT");    
    public final static ID TBSETNUMFORMAT        = ID.registerProperty("SET_TB_NUM_FORMAT");        
    public final static ID TBSETINTFORMAT        = ID.registerProperty("SET_TB_INT_FORMAT");
    public final static ID TBSETTOTALLINE        = ID.registerProperty("SET_TB_TOTAL_LINE");
    public final static ID TBSETTOTALLINELABELS  = ID.registerProperty("SET_TB_TOTAL_LINE_LABELS");
    public final static ID TBSETFILTER           = ID.registerProperty("SET_TB_FILTER");
    public final static ID TBSETFOCUS            = ID.registerProperty("SET_TB_FOCUS");
    public final static ID TBADD_ROW             = ID.registerProperty("TB_ADD_ROW");    
    public final static ID TBSETTITLE            = ID.registerProperty("SET_TB_TITLE");      
    public final static ID TBSETTITLEFONT        = ID.registerProperty("SET_TB_TITLE_FONT"); 
    public final static ID TBSETSHOWTITLE        = ID.registerProperty("SET_TB_SHOW_TITLE");
    public final static ID TBSETTITLEALIGN       = ID.registerProperty("SET_TB_TITLE_ALIGN");      
    public final static ID TBSETTITLECOLORS      = ID.registerProperty("SET_TB_TITLE_COLORS");      
    public final static ID TBSETTOTALCOLORS      = ID.registerProperty("SET_TB_TOTAL_COLORS"); 
    public final static ID TBSETALERTSTRINGS     = ID.registerProperty("SET_TB_ALERT_STRINGS");
    public final static ID TBSETCLOSELABEL       = ID.registerProperty("SET_TB_EDITOR_LABELS");
    public final static ID TBSETFINDLABELS       = ID.registerProperty("SET_TB_FIND_LABELS");
    public final static ID TBSETARRAYSIZE        = ID.registerProperty("SET_TB_ARRAYSIZE");
    public final static ID TBSETBOUNDS           = ID.registerProperty("SET_TB_BOUNDS");              
    public final static ID TBSETHEADBG           = ID.registerProperty("SET_TB_HEADBG");    
    public final static ID TBSETHEADHEIGHT       = ID.registerProperty("SET_TB_HEADER_HEIGHT");    
    public final static ID TBSETTOTALHEADHEIGHT  = ID.registerProperty("SET_TB_TOTAL_HEADER_HEIGHT");
    public final static ID TBSETHEADFG           = ID.registerProperty("SET_TB_HEADFG");    
    public final static ID TBSETDATABG           = ID.registerProperty("SET_TB_DATABG");        
    public final static ID TBSETTABLEBG          = ID.registerProperty("SET_TB_TABLEBG");    
    public final static ID TBSETDATAFG           = ID.registerProperty("SET_TB_DATAFG");    
    public final static ID TBSETGRIDFG           = ID.registerProperty("SET_TB_GRIDFG");        
    public final static ID TBSETADDTEXT          = ID.registerProperty("SET_TB_ADD_TEXT");        
    public final static ID TBSETUPDATE           = ID.registerProperty("SET_TB_UPDATE"); 
    public final static ID TBSETINSERT           = ID.registerProperty("SET_TB_INSERT"); 
    public final static ID TBINSERTROW           = ID.registerProperty("SET_TB_INSERT_ROW"); 
    public final static ID TBDELETEROW           = ID.registerProperty("SET_TB_DELETE_ROW"); 
    public final static ID TBSETDELETE           = ID.registerProperty("SET_TB_DELETE"); 
    public final static ID TBSETCELLPOS          = ID.registerProperty("SET_TB_CELLPOS");    
    public final static ID TBSETROWPOS           = ID.registerProperty("SET_TB_ROWPOS");
    public final static ID TBSETINSERTDONE       = ID.registerProperty("SET_TB_INSERT_DONE");
    public final static ID TBSETUPDATEDONE       = ID.registerProperty("SET_TB_UPDATE_DONE");
    public final static ID TBSETDELETEDONE       = ID.registerProperty("SET_TB_DELETE_DONE");
    public final static ID TBSETROWIDPOS         = ID.registerProperty("SET_TB_ROWIDPOS");
    public final static ID TBSETCANEXTEND        = ID.registerProperty("SET_TB_EXTEND");        
    public final static ID TBSETEDITEXTEND       = ID.registerProperty("SET_TB_EDIT_EXTEND");
    public final static ID TBSETSEPARATOR        = ID.registerProperty("SET_TB_SEPARATOR");    
    public final static ID TBSETIMAGESIZE        = ID.registerProperty("SET_TB_IMAGE_SIZE");
    public final static ID TBSETREORDER          = ID.registerProperty("SET_TB_REORDER_COLUMNS");    
    public final static ID TBSETRESIZE           = ID.registerProperty("SET_TB_RESIZE_COLUMNS");    
    public final static ID TBSETBORDER           = ID.registerProperty("SET_TB_BORDER");
    public final static ID TBSETPANELBORDER      = ID.registerProperty("SET_TB_PANEL_BORDER");
    public final static ID TBSETSELECTBACK       = ID.registerProperty("SET_TB_SELECTION_BACKGROUND");        
    public final static ID TBSETSELECTFORE       = ID.registerProperty("SET_TB_SELECTION_FOREGROUND");        
    public final static ID TBSETDECSEPARATORS    = ID.registerProperty("SET_TB_DECIMAL_SEPARATORS");            
    public final static ID TBSETLOCALE           = ID.registerProperty("SET_TB_LOCALE");            
    public final static ID TBSETVISIBLE          = ID.registerProperty("SET_TB_VISIBLE");
    public final static ID TBSETVLINE            = ID.registerProperty("SET_TB_VERTICAL_LINE");        
    public final static ID TBSETHLINE            = ID.registerProperty("SET_TB_HORIZONTAL_LINE");            
    public final static ID TBSETRESIZEMODE       = ID.registerProperty("SET_TB_RESIZE_MODE");
    public final static ID TBSETVISIBLEROWS      = ID.registerProperty("SET_TB_VISIBLE_ROWS");
    public final static ID TBSETREFRESH          = ID.registerProperty("SET_TB_REFRESH");
    public final static ID TBSETNUMROWS          = ID.registerProperty("SET_TB_NUM_ROWS");
    public final static ID TBSETPAGESIZE         = ID.registerProperty("SET_TB_PAGE_SIZE");
    public final static ID TBSETLOG              = ID.registerProperty("SET_TB_LOG");        
    public final static ID TBGETNBINSERT         = ID.registerProperty("GET_TB_COUNT_INSERT");    
    public final static ID TBISROWID             = ID.registerProperty("SET_TB_ROWID");
    public final static ID TBGETNBUPDATE         = ID.registerProperty("GET_TB_COUNT_UPDATE");    
    public final static ID TBGETNBDELETE         = ID.registerProperty("GET_TB_COUNT_DELETE");    
    public final static ID TBGETNBCHANGES        = ID.registerProperty("GET_TB_COUNT_CHANGES");    
    public final static ID TBGETCELLVAL          = ID.registerProperty("GET_TB_CELLVAL");    
    public final static ID TBGETROWVAL           = ID.registerProperty("GET_TB_ROWVAL"); 
    public final static ID TBGETIDENTIFIEDROW    = ID.registerProperty("GET_TB_IDENTIFIED_ROW");
    public final static ID TBGETCURRENTROW       = ID.registerProperty("GET_TB_CURRENT_ROW");
    public final static ID TBGETIMAGECONTENT     = ID.registerProperty("GET_TB_IMAGE_CONTENT"); 
    public final static ID TBGETCELLNAME         = ID.registerProperty("GET_TB_CELLNAME");    
    public final static ID TBGETTEXT             = ID.registerProperty("GET_TB_TEXT");    
    public final static ID TBGETTOTALCELLVAL     = ID.registerProperty("GET_TB_TOTALCELLVAL");    
    public final static ID TBINIT                = ID.registerProperty("TB_INIT");    
    public final static ID TBCLEARREFRESH        = ID.registerProperty("TB_CLEAR_REFRESH");    
    public final static ID TBSHOW                = ID.registerProperty("TB_SHOW");      
    public final static ID TBTRG_WNRI            = ID.registerProperty("TB_NEW_RECORD_INSTANCE");          
    public final static ID TBTRG_WNII            = ID.registerProperty("TB_NEW_ITEM_INSTANCE");
    public final static ID TBTRG_WMC             = ID.registerProperty("TB_WHEN_MOUSE_CLICK");
    public final static ID TBTRG_WMDC            = ID.registerProperty("TB_WHEN_MOUSE_DOUBLECLICK");
    public final static ID TBTABLE_NAME          = ID.registerProperty("TB_NAME");    
    public final static ID TBTABLE_CHANGE        = ID.registerProperty("TB_POST_CHANGE");    
    public final static ID TBTABLE_EVENT_MSG     = ID.registerProperty("TB_TABLE_EVENT_MSG");    
    public final static ID TBGETROWSCHANGED      = ID.registerProperty("GET_TB_ROWS_CHANGED");
    public final static ID TBGETROWSINSERTED     = ID.registerProperty("GET_TB_ROWS_INSERTED");
    public final static ID TBGETROWSDELETED      = ID.registerProperty("GET_TB_ROWS_DELETED");
    public final static ID TBSETIMAGE            = ID.registerProperty("SET_TB_IMAGE");
    public final static ID TBSETIMAGETOREAD      = ID.registerProperty("SET_TB_IMAGE_TO_READ");
    public final static ID TBTRG_PAGE            = ID.registerProperty("TB_GET_PAGE");
    
    // QuickTime player
    public final static ID QTSETPANEL            = ID.registerProperty("QUICKT_SET_PANEL");
    public final static ID QTSETPANELBORDER      = ID.registerProperty("QUICKT_SET_PANEL_BORDER");
    public final static ID QTSETPANELCOLOR       = ID.registerProperty("QUICKT_SET_PANEL_COLOR");
    public final static ID QTSETPANELCONTROL     = ID.registerProperty("QUICKT_SET_PANEL_CONTROL");
    public final static ID QTSETFRAMEMOVIESIZE   = ID.registerProperty("QUICKT_SET_FRAME_MOVIE_SIZE");
    public final static ID QTSETLOADANDPLAY      = ID.registerProperty("QUICKT_SET_LOAD_AND_PLAY");
    public final static ID QTSETPREROLL          = ID.registerProperty("QUICKT_SET_PREROLL");
    public final static ID QTSETFRAMETITLE       = ID.registerProperty("QUICKT_SET_FRAME_TITLE");
    public final static ID QTSETMOVIE            = ID.registerProperty("QUICKT_SET_MOVIE");
    public final static ID QTSETMOVIEBASE        = ID.registerProperty("QUICKT_SET_MOVIE_BASE");
    public final static ID QTSTARTMOVIE          = ID.registerProperty("QUICKT_START_MOVIE");
    public final static ID QTSTOPMOVIE           = ID.registerProperty("QUICKT_STOP_MOVIE");
    public final static ID QTINCVOLUME           = ID.registerProperty("QUICKT_INC_VOLUME");
    public final static ID QTDECVOLUME           = ID.registerProperty("QUICKT_DEC_VOLUME");
    public final static ID QTREMOVEPANEL         = ID.registerProperty("QUICKT_REMOVE_PANEL");
    public final static ID QTGOTO                = ID.registerProperty("QUICKT_GOTO");    
    
    // IP Address
    public final static ID GET_USER_IP             = ID.registerProperty("GET_USER_IP");
    // Server Host
    public final static ID FORMS_SERVER_URL        = ID.registerProperty("FORMS_SERVER_URL");       

    // public color schemes
    public final static Color GREEN_SCHEME = new Color(100, 255, 100);
    public final static Color YELLOW_SCHEME = new Color(255, 255, 100);
    public final static Color ORANGE_SCHEME = new Color(255, 170, 80);
    public final static Color RED_SCHEME = new Color(255, 130, 130);
    public final static Color BLUE_SCHEME = new Color(128, 194, 255);
    public final static Color PURPLE_SCHEME = new Color(215, 175, 255);
    public final static Color GRAY_SCHEME = new Color(180, 180, 180);
    public final static Color SILVER_SCHEME = new Color(220, 220, 220);
    public final static Color XP_SCHEME = new Color(200, 200, 200);
    // light colors
    public final static Color GREEN_LIGHT = new Color(235, 255, 235);
    public final static Color YELLOW_LIGHT = new Color(255, 255, 220);
    public final static Color ORANGE_LIGHT = new Color(255, 240, 230);
    public final static Color RED_LIGHT = new Color(255, 220, 220);
    public final static Color BLUE_LIGHT = new Color(220, 240, 255);
    public final static Color PURPLE_LIGHT = new Color(250, 230, 255);
    public final static Color GRAY_LIGHT = new Color(230, 230, 230);
    public final static Color SILVER_LIGHT = new Color(250, 250, 250);
    public final static Color XP_LIGHT = new Color(240, 240, 240);
    public static boolean bUseLightColor = false;
    private       boolean bOwnerScheme = false ;

    public static Color Current_Color = XP_SCHEME;
    public static Color Current_Color_Light = XP_LIGHT;
    public static String Current_Scheme = "XP";

    // colors used by the GUI elements
    public static Color cFocus = new Color(255, 214, 47);
    public static Color cDisable = new Color(100, 100, 100);
    public static Color cSelect = null;
    public static Color cListSelect = null;

    public static String sCurrentJRE = System.getProperty("java.version");

    // component shared properties
    public static boolean bEnhancedLists = false;
    public static boolean bMultiSelect = false;
    public static boolean bSystemLookAndFeel = true;
    public static boolean bDrawFocusLine = true;
    public static boolean bCBDrawBackground = false;
    public static boolean bRolloverAllMark = true;
    public static boolean bFocusBG = false;
    public static Color cCBBackgroundColor = null;

    // vector of PJCs
    public static List vPjc = new ArrayList(10);
    public static List ListItems = new ArrayList(10);
    public static List ListFormsItems = new ArrayList(10);

    // Memory
    public static long lTotalMemory = 0l;
    public static long lFreeMemory = 0l;
    public static long lUsedMemory = 0l;

    private ImageKit ik = new ImageKit();

    // Element personalization variables
    private IHandler m_handler;
    private static IHandler m_handler2;
    private Main formsMain = null;
    private static boolean bHeaderPrint = false ;
    private int iLevel = 0;
    private static DrawLAF instance;
    private static HashMap lDrawLAFBean = new HashMap();
    cObj TextField = null;
    cObj TextArea = null;
    cObj Button = null;
    cObj CheckBox = null;
    cObj RadioB = null;
    cObj ComboBox = null;
    cObj PopList = null;
    cObj TList = null;
    cObj Tree = null;
    cObj Window = null;
    cObj MenuBar = null;
    cObj Status = null;
    cObj MenuOption = null;
    // initial values
    cObj InitWindow;
    cObj InitMenuBar;
    cObj InitStatus;
    cObj InitMenuOption;

    // Dynamic menu variables
    private HashMap hMenuBar = new HashMap();
    private HashMap hMenuOptions = new HashMap();
    private HashMap hSpinners = new HashMap();
    private HashMap hTables = new HashMap();
    public static HashMap hTextures = new HashMap();
    protected LWMenuBar pMain = null;
    protected LWMenu pWinMenu = null;
    protected LWMenuBar pMenu = null;
    protected LWPopupMenu popMenu = null;
    protected LWMenu newMenu = null;
    protected int iMenuHeight = 0;
    protected int iSBarHeight = 0;

    // gradient positions
    protected static int LeftToRight = 1;
    protected static int UpToDown = 2;
    protected static int LeftUpToRightDown = 3;
    protected static int LeftDownToRightUp = 4;
    protected int iDirection = LeftToRight;

    // other variables
    private int iCanvasWidth = 0;
    private int iCanvasHeight = 0;
    private int iJRE = 0;
    private URL m_codeBase;
    protected boolean bFirst = true;
    protected boolean bLog = false;
    protected boolean bLogTable = false;
    protected boolean bLogPaint = false;
    protected boolean bMemoryLog = false;
    protected static boolean bQuickExit = false;
    protected Color cBGColor1 = null, cBGColor2 = null;
    protected Color cT1 = null, cT2 = null;
    protected Color cBackground = null;
    protected Color cLastColor = null;
    protected String sColorChooserTitle = "Select a color";
    protected String sMotif = null;
    protected float fMotif = 1.0f;
    protected int iX = 0, iY = 0, iW = 0, iH = 0;
    protected int iHcycle = 0, iVcycle = 0;
    private JPanel jp = null;
    protected int iTextWidth = 0, iTextHeight = 0;

    // Robot variables
    protected Robot robot = null;
    protected int iRobotWait = 500;
    protected int iDash1 = 1, iDash2 = 0;
    protected float fRobotBGTrsp = 0.3f;
    protected Color cBubbleBack = Color.white;
    protected Color cBubbleFore = Color.black;
    protected Color cTextColor = Color.black;
    protected Color cTextShadow = Color.white;
    protected Color cShapeBack = null;
    protected Color cShapeFore = Color.black;
    protected Color cTextBack = null;
    protected Color cTextFore = null;
    protected Font fBubbleFont = new Font("Verdana", Font.PLAIN, 12);
    protected Font fTextFont = new Font("Verdana", Font.PLAIN, 12);
    protected String[] sRobots = new String[5];
    protected String sRobotFileName = null;
    protected boolean bRobotOK = true;
    protected boolean bInUse = false;
    protected StringBuffer sbRobot = new StringBuffer();

    protected static boolean bMenuUseScheme = false;
    protected static boolean bWindowUseScheme = false;
    protected static boolean bStatusUseScheme = false;
    protected static boolean bDialogUseScheme = false;
    protected static boolean bFrameUseScheme = false;
    protected static boolean bTabUseScheme = false;
    protected static boolean bSeparateFrame = false;


    // list of objects
    private List list_objects = new ArrayList(10);
    private HashMap list_lines = new HashMap();
    private HashMap list_polys = new HashMap();
    private HashMap list_rects = new HashMap();
    private HashMap list_circles = new HashMap();
    private List list_images = new ArrayList(10);
    private HashMap list_texts = new HashMap();
    private List list_imgs = new ArrayList(10);
    private List list_Lgradients = new ArrayList(10);
    protected int iLines = -1;
    protected int iShapes = -1;
    protected int iRects = -1;
    protected int iEllipses = -1;
    protected int iImgs = -1;
    protected int iTexts = -1;

    // Flash variables
    private String sFlashText = "";
    private int iFlashDelay = 2000;
    private Color cFlashBack = null;
    private Color cFlashText = Color.black;
    private Color cFlashShadow = Color.white;
    private Color cFlashFrame = Color.white;
    private Color cFlashFrame2 = null;
    private Color cFlashLine2 = null;
    private boolean bFlashBorder = false;
    private boolean bFlashBlink = false;
    private int iFlashRed = 0, iFlashGreen = 0, iFlashBlue = 0;
    private int iFlashX = 0, iFlashY = 0;
    private int iFlashtextWidth = 0, iFlashtextHeight = 0;
    private Font iFlashFont = new Font("Verdana", Font.PLAIN, 12);
    private String tFlashLabels[];
    private int tFlashHeight[];
    private int iFlashIndice = -1;
    private boolean bFlashRefresh = false;
    // MLT-7702 (Sound.java removed)
    // private static Sound Soundlist = new Sound();
    private oracle.forms.ui.ExtendedFrame winCurrent;
    private oracle.ewt.swing.JBufferedFrame winMDI;

    // Input Dialog Box
    private String sDialogString = "";
    private Font fDialogFont = null;
    private Color cDialogFore = new Color(20, 20, 20);
    private Color cDialogBack = new Color(210, 210, 210);

    // Status bar
    private oracle.ewt.statusBar.StatusBarTextItem statusbars[][] = new oracle.ewt.statusBar.StatusBarTextItem[2][6];
    private oracle.ewt.statusBar.StatusBar stBar=null;
    private BorderPainter stBorderPainter=null;
    private int iStatusBar = -1;
    private int iStatusBarNum = 0;
    private int iStatusBarIdx = 0;
    private boolean bInit = true ;

    // Frames
    private static int FLeftToRight = 1;
    private static int FRightToLeft = 2;
    private static int FUpToDown = 3;
    private static int FDownToUp = 4;
    private boolean bDrawFrameBounds = false;

    // global properties
    private static int gigrDir = FUpToDown;
    private static int gigrBorderDir = FUpToDown;
    private static int gigrShadowDir = FUpToDown;
    private static Color gcFrameColor = Color.gray;
    private static Color gcFrameShadow = Color.lightGray;
    private static Color gcFrameTitleFore = Color.black;
    private static Color gcFrameTitleBack = null;
    private static Color gcFrameGradient1 = null;
    private static Color gcFrameGradient2 = null;
    private static Color gcFrameColorStart = null;
    private static Color gcFrameColorEnd = null;
    private static Color gcFrameSColorStart = null;
    private static Color gcFrameSColorEnd = null;
    private static String gsFrameAligment = "L";
    private static String gsFramePosition = "T";
    private static int giFrameWidth = 2;
    private static boolean gbRoundedFrame = false;
    private static boolean gbFrameTitleOpaque = false;
    private static float gfFrameTransp = .2f;
    private static Font gfFrameFont = new Font("Verdana", Font.BOLD, 14);

    // Tabs global properties
    private static Color gcTabForeColor = null;
    private static Color gcTabBackColor = null;
    private static Color gcTabSelForeColor = null;
    private static Color gcTabSelBackColor = null;
    private static Font gfTabFont = null;
    // Tab properties
    private HashMap hTabs = new HashMap();

    // ScrollPanes
    private ScrollPanel sp = null;
    private int iScrollDuration = -1;
    private boolean bScrollFrame = false;
    private String sFrameTitle = null;

    protected static String sDocBase = "";
    private static String sName = "";
    private HashMap hFrames = new HashMap();
    private static HashMap hWindows = new HashMap();
    private oracle.forms.ui.VBean VB = null;
    private static oracle.forms.ui.VBean CurrentBean = null;
    private JComponent panel;
    private Frame formsTopFrame = null;

    // Popup menus
    private HashMap hPopups = new HashMap();
    private String sPopupMenu = null;
    private boolean bPopupDisplayed = false;

    // current Canvas
    private oracle.forms.ui.DrawnPanel canvas = null;

    // alert box properties
    private String sAlertButton = null;

    // memory
    private MemoryTool memory = new MemoryTool();

    // dynamic item creation
    private oracle.forms.handler.FormWindow w2 = null;
    private ExtendedFrame ef2 = null;
    private int iNewItemIndice = -1;
    private JPanel newItemPanel = null;
    private int iCurrentImage = -1;
    public static boolean bItemNavInside = false;
    private String sFileChooserTitle = "Select an image file";
    private String sFileStartDir = "";
    private String sChooserLAF = "SYSTEM";

    // table-block sorter
    private List arrLabelIcon = new ArrayList();
    private HashMap mapLabelIcon = new HashMap();
    private String sIconNext = "/next_v.png", sIconPrev = "/prev_v.png";
    
    // QuickTime panel
    // Commented on 03/12/2025 (MLT-7702) 
    // Remove QT References (not used)
//    private JPanel      QTPanel = null ;
//    private JPanel      QTVideo = null ;
//    private JPanel      QTCtrl  = null ;
//    private JFrame      QTFrame = null ;
//    private Rectangle   QTBounds = new Rectangle(10,10,100,100) ;
//    private Movie       QTMovie = null;
//    private MoviePlayer QTPlayer = null; 
//    private String      sQTFrameTitle = "" ;
//    private String      sQTClip = "" ;
//    private StringBuffer sbMovie  = new StringBuffer();    
//    private boolean     bQTRun = false ;
//    private boolean     bQTLoadAndPlay = false ;
//    private boolean     bQTMovieSize = false ;
//    private float       fQTpreroll = 0.5f;
//    private JProgressBar QTprogressBar = null;
//    private GlassPanel   glassPanel = null ;

    // external process
    Process process = null;

    private static final String HEX_PATTERN = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$";

    private String CLASSNAME = this.getDefaultName();

    // JDBC connection
    private String sDBConn = "";
    private String sDBUser = "";
    private String sDBPwd = "";
    private String sDBPopup = "LEFT|BOTTOM| Database function %NAME%() running... |1000|r255g255b255|r42g127b255";
    private static String[] sDBName = new String[10];
    private static String[] sDBResult = new String[10];
    private static String[] sDBError = new String[10];
    private static String[] sDBQuery = new String[10];
    private static String[] sDBStart = new String[10];
    private static String[] sDBEnd = new String[10];
    private static Connection[] DBconn = new Connection[10];
    private static boolean[] bFunction = new boolean[10];
    private static boolean[] bRunning = new boolean[10];
    private static boolean bDBPopup = true;

    // spinner current image
    private String sSpinnerName = "";
    private String sSpinnerImageName = "";

    // new item ShowInRect
    private int iNbNewItems = 0;
    private int iNbFormsItems = 0;
    private String sChoosenFileName = "";
    
    // copy/paste block
    private static JTextArea jtaClip = new JTextArea();
    private static StringBuffer sbClip = new StringBuffer();
    
    // dynamic tables
    private String sCurrentTable="" ;    
    
    // module content print
    protected StringBuffer sbModulePrint = new StringBuffer();
    private   String sTextLabel = null;
    
    // shape animation
    private boolean bMouseCanvasIdle = false, bAnimationEnded=false ;
    private Rectangle rCanvasMouseArea = new Rectangle(0,0,0,0) ;
    private String sShapeCurrentType=null;
    private String sShapeCurrentName=null;
    private String sShapeCurrentProperty=null;
    private static List vAnimationList = new ArrayList(10);
    
    private static double radiansPerDegree = -Math.PI / 180.0;

    public DrawLAF() {
        super();
        VB = this;
        CurrentBean = this ;
        CLASSNAME = this.getName();
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            SwingUtilities.updateComponentTreeUI(this);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        UIManager.put("Slider.thumb", Current_Color);
        UIManager.put("Slider.tickColor", cFocus);
        UIManager.put("Slider.highlight", Current_Color);
        UIManager.put("Slider.focus", cFocus);
        UIManager.put("ProgressBar.background", Color.white);
        UIManager.put("ProgressBar.foreground", Color.lightGray);
    }

    public static synchronized DrawLAF getInstance() {
        if (instance == null) {
            instance = new DrawLAF();
        }
        return instance;
    }

    public void init(IHandler handler) {
        m_handler = handler;
        m_handler2 = handler;
        super.init(handler);
        // add the bean to the static list
        DrawLAFBean dlb = new DrawLAFBean(this.getHandler(), this);
        lDrawLAFBean.put(this.getName(), dlb);
        //print("++ add DrawLAF bean:"+this.getName());
        // MLT-7702
//        if (m_handler.getApplet().getParameter("separateFrame").equalsIgnoreCase("true")){
//            bSeparateFrame = true;
//        }
        printHeader();
        // getting the Forms Main class
        try {
            Method method = handler.getClass().getMethod("getApplet", new Class[0]);
            Object applet = method.invoke(handler, new Object[0]);
            if (applet instanceof Main) {
                formsMain = (Main)applet;
            }
        } catch (Exception ex) {
            ;
        }
        formsTopFrame = formsMain.getFrame();
        log("Look & Feel Current JRE version:" + sCurrentJRE);
        // JRE version
        String sJRE = sCurrentJRE.substring(0, 1) + sCurrentJRE.substring(2, 3);
        try {
            iJRE = Integer.parseInt(sJRE);
        } catch (Exception e) {
        }
        UIManager.put("Button.showMnemonics", Boolean.TRUE);
        if (bMemoryLog)
            memory.printMemory(this.getName(), "DrawLAF Init()");
        sDocBase = formsMain.getDocumentBase().toString();
        int i = sDocBase.indexOf("/forms/");
        sDocBase = sDocBase.substring(0, i);
    }

    //
    // get all Forms standard Items
    //

    protected void getAllFormsItems(Component component) {
        //print(component);
        if (component instanceof oracle.forms.ui.VButton ||
            component instanceof oracle.forms.ui.VCheckbox ||
            component instanceof oracle.forms.ui.VRadioButton ||
            component instanceof oracle.forms.ui.ExtendedCheckbox ||
            component instanceof oracle.forms.ui.VTextField ||
            component instanceof oracle.forms.ui.VTextArea ||
            component instanceof oracle.forms.ui.VImage ||
            component instanceof oracle.forms.ui.VPopList ||
            component instanceof oracle.forms.fd.LAF_XP_Button ||
            component instanceof oracle.forms.fd.LAF_XP_CBox||
            component instanceof oracle.forms.fd.LAF_XP_PopList ||
            component instanceof oracle.forms.fd.LAF_XP_RadioButton ||
            component instanceof oracle.forms.fd.LAF_XP_TextArea ||
            component instanceof oracle.forms.fd.LAF_XP_TextField ||
            component instanceof oracle.forms.fd.LAF_XP_TList) {
            //print(component);
            newItem ni =
                new newItem(component, component.getName(), "button", null, null, component.getX(), component.getY(),
                            component.getWidth(), component.getHeight());
            ListFormsItems.add(ni);
        }
        if (component instanceof Container) {
            Component components[] = ((Container)component).getComponents();
            for (int i = 0; i < components.length; i++) {
                if (components[i] != null) {
                    getAllFormsItems(components[i]);
                }
            }
        }
    }

    public void destroy() {
        super.destroy();
        m_handler = null ;   
        //print("-- remove DrawLAF bean:"+this.getName());
        lDrawLAFBean.remove(this.getName());
        if (!bQuickExit) {
            setProperty(clear, null);
            if (bMemoryLog)
                memory.printMemory(this.getName(), "DrawLAF destroy()");
            robot = null;
        }
    }

    // send keyboard hit back to Forms

    public static void sendKeyBack(KeyEvent e) {
        try {
            m_handler2.setProperty(KEY_EVENT, e);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }


    /*------------------------------------------------------
   *   the location where almost everything is painted
   *-----------------------------------------------------*/

    public void paint(Graphics g) {
        this.getParent().setIgnoreRepaint(true);
        if (jp == null) {
            //bFirst = false ;
            ListFormsItems = new ArrayList(10);
            getAllFormsItems(formsMain.getFrame());
            setProperty(GetComponents, null);
            jp = new JPanel() {
                    /*--------------------------------------------*
                     *  paint the graphics objects on the canevas
                     *--------------------------------------------*/

                    public void paint(Graphics g) {
                        Graphics2D g2 = (Graphics2D)g;
                        iX = (int)this.getBounds().getX();
                        iY = (int)this.getBounds().getY();
                        iW = (int)this.getBounds().getWidth();
                        iH = (int)this.getBounds().getHeight();
                        /* removed from 1.6 to return back to 1.4
                           iX = (int)jp.getBounds().getX() ;
                           iY = (int)jp.getBounds().getY() ;
                           iW = (int)jp.getBounds().getWidth() ;
                           iH = (int)jp.getBounds().getHeight() ;
                           */
                        iCanvasWidth = iW;
                        iCanvasHeight = iH;
                        Rectangle recc = g2.getClipBounds();
                        AffineTransform oldTransform;
                        AffineTransform transform;
                        if (canvas == null) {
                            canvas = (oracle.forms.ui.DrawnPanel)VB.getParent();
                        }
                        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                        Object rh = g2.getRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING);
                        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,
                                            RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
                        g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

                        int x = 0, y = 0, w = 0, h = 0;
                        GradientPaint gp = null;
                        // any gradient background ?
                        if (cBGColor1 != null && cBGColor2 != null) {
                            if (iDirection == LeftToRight) {
                                x = 0;
                                y = 0;
                                w = iW;
                                h = 0;
                            } else if (iDirection == UpToDown) {
                                x = 0;
                                y = 0;
                                w = 0;
                                h = iH;
                            } else if (iDirection == LeftUpToRightDown) {
                                x = 0;
                                y = 0;
                                w = iW;
                                h = iH;
                            } else if (iDirection == LeftDownToRightUp) {
                                x = 0;
                                y = iH;
                                w = iW;
                                h = 0;
                            }
                            // must have some transparancy to not completly
                            // hidden the Forms prompts
                            g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, gfFrameTransp));

                            // create the gradient
                            gp = null;
                            if (iHcycle + iVcycle == 0) {
                                gp = new GradientPaint(x, y, cBGColor1, w, h, cBGColor2);
                            } else {
                                gp = new GradientPaint(0, 0, cBGColor1, iHcycle, iVcycle, cBGColor2, true);
                            }
                            g2.setPaint(gp);
                            // fill the canevas
                            g2.fill(new Rectangle2D.Double(0, 0, iW, iH));
                            g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1.0f));
                        }
                        //
                        // linear gradients to draw ?
                        //
                        if (list_Lgradients.size() > 0) {
                            int igStartX = 0, igStartY = 0, igEndX = 0, igEndY = 0;
                            int igWidth = iW, igHeight = iH;
                            int iPercent = 0;
                            int iWidth = 0, iHeight = 0;
                            Color c1 = null, c2 = null;
                            for (int i = 0; i < list_Lgradients.size(); i++) {
                                LinearGradient lg = (LinearGradient)list_Lgradients.get(i);
                                try {
                                    // start X pos
                                    if (lg.sStartX.equalsIgnoreCase("WIDTH"))
                                        igStartX = iW;
                                    else if (lg.sStartX.equalsIgnoreCase("WIDTH/2"))
                                        igStartX = iW / 2;
                                    else if (lg.sStartX.equalsIgnoreCase("WIDTH/3"))
                                        igStartX = iW / 3;
                                    else if (lg.sStartX.equalsIgnoreCase("WIDTH/4"))
                                        igStartX = iW / 4;                                        
                                    else
                                        igStartX = Integer.parseInt(lg.sStartX);
                                    // start Y pos
                                    if (lg.sStartY.equalsIgnoreCase("HEIGHT"))
                                        igStartY = iH;
                                    else if (lg.sStartY.equalsIgnoreCase("HEIGHT/2"))
                                        igStartY = iH / 2;
                                    else if (lg.sStartY.equalsIgnoreCase("HEIGHT/3"))
                                        igStartY = iH / 3;
                                    else if (lg.sStartY.equalsIgnoreCase("HEIGHT/4"))
                                        igStartY = iH / 4;                                        
                                    else
                                        igStartY = Integer.parseInt(lg.sStartY);
                                    // end X pos
                                    if (lg.sEndX.equalsIgnoreCase("WIDTH"))
                                        igEndX = iW;
                                    else if (lg.sEndX.equalsIgnoreCase("WIDTH/2"))
                                        igEndX = iW / 2;
                                    else if (lg.sEndX.equalsIgnoreCase("WIDTH/3"))
                                        igEndX = iW / 3;
                                    else if (lg.sEndX.equalsIgnoreCase("WIDTH/4"))
                                        igEndX = iW / 4;                                        
                                    else
                                        igEndX = Integer.parseInt(lg.sEndX);
                                    // end Y pos
                                    if (lg.sEndY.equalsIgnoreCase("HEIGHT"))
                                        igEndY = iH;
                                    else if (lg.sEndY.equalsIgnoreCase("HEIGHT/2"))
                                        igEndY = iH / 2;
                                    else if (lg.sEndY.equalsIgnoreCase("HEIGHT/3"))
                                        igEndY = iH / 3;
                                    else if (lg.sEndY.equalsIgnoreCase("HEIGHT/4"))
                                        igEndY = iH / 4;                                        
                                    else
                                        igEndY = Integer.parseInt(lg.sEndY);

                                    g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, lg.fTransp));
                                    // for each coefficient
                                    int j = 0;
                                    for (int c = 0; c < lg.tCoefs.length; c++) {
                                        if (lg.tCoefs[c] != null) {

                                            // percentage ?
                                            if (lg.tCoefs[c].endsWith("%")) {
                                                try {
                                                    iPercent =
                                                            Integer.parseInt(lg.tCoefs[c].substring(0, lg.tCoefs[c].indexOf("%")));
                                                    if (lg.sDirection.equalsIgnoreCase("UpToDown")) {
                                                        igHeight = (int)((iPercent / 100.0) * igEndY);
                                                        if (igHeight > igEndY)
                                                            igHeight = igEndY;
                                                        igWidth = igEndX;
                                                    } else {
                                                        igWidth = (int)((iPercent / 100.0) * igEndX);
                                                        if (igWidth > igEndX)
                                                            igWidth = igEndX;
                                                        igHeight = igEndY;
                                                    }
                                                } catch (Exception ex) {
                                                    System.out.println(" ! " + CLASSNAME +
                                                                       ": LinearGradient: Bad coefficient number:" +
                                                                       lg.tCoefs[c]);
                                                }
                                            }
                                            // real value
                                            else {
                                                if (lg.sDirection.equalsIgnoreCase("UpToDown")) {
                                                    try {
                                                        igHeight = Integer.parseInt(lg.tCoefs[c]);
                                                        if (igHeight > igEndY)
                                                            igHeight = igEndY;
                                                    } catch (Exception ex1) {
                                                        System.out.println(" ! " + CLASSNAME +
                                                                           ": LinearGradient: Bad coefficient number:" +
                                                                           lg.tCoefs[c]);
                                                    }
                                                } else {
                                                    try {
                                                        igWidth = Integer.parseInt(lg.tCoefs[c]);
                                                        if (igWidth > igEndX)
                                                            igWidth = igEndX;
                                                    } catch (Exception ex1) {
                                                        System.out.println(" ! " + CLASSNAME +
                                                                           ": LinearGradient: Bad coefficient number:" +
                                                                           lg.tCoefs[c]);
                                                    }
                                                }
                                            }
                                            c1 = lg.tColors[j++];
                                            c2 = lg.tColors[j++];

                                            // create the gradient
                                            if (lg.sDirection.equalsIgnoreCase("UpToDown")) {
                                                gp = new GradientPaint(0, igStartY, c1, 0, igStartY + igHeight, c2);
                                            } else {
                                                gp = new GradientPaint(igStartX, 0, c1, igStartX + igWidth, 0, c2);
                                            }
                                            g2.setPaint(gp);
                                            // draw the gradient
                                            g2.fill(new Rectangle2D.Double(igStartX, igStartY, igWidth, igHeight));

                                            if (lg.sDirection.equalsIgnoreCase("UpToDown"))
                                                igStartY += igHeight;
                                            else
                                                igStartX += igWidth;
                                        }
                                    }
                                    g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1.0f));
                                } catch (Exception e) {
                                    System.out.println(" ! " + CLASSNAME + ": Linear Gradient : bad parameters:" +
                                                       e.toString());
                                }
                            }
                        }

                        // Motif to draw ?
                        if (sMotif != null) {
                            TexturePaint tp = (TexturePaint)hTextures.get(sMotif);
                            if(tp != null){
                                g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, fMotif));
                                if (tp != null) {
                                    g2.setPaint(tp);
                                    g2.fillRect(jp.getBounds().x, jp.getBounds().y, jp.getBounds().width,
                                                jp.getBounds().height);
                                }
                            }
                        }

                        //
                        // objects to draw ?
                        //
                        logPaint("" + list_objects.size() + " objects to draw on canvas");
                        if (list_objects.size() > 0) {
                            int iIndex = 0;
                            int iNewX=0, iNewY=0;
                            for (int i = 0; i < list_objects.size(); i++) {
                                Typ_Objects to = (Typ_Objects)list_objects.get(i);
                                iIndex = to.iPos;
                                switch (to.iType) {
                                case 1: // line
                                    int iLimit = 0;
                                    Line ln = (Line)list_lines.get(to.sName);
                                    g2.setColor(ln.color);
                                    logPaint("Line:");
                                    oldTransform = g2.getTransform();
                                    int iNewX1=ln.pStart.x;
                                    int iNewY1=ln.pStart.y;
                                    int iNewX2=ln.pEnd.x;
                                    int iNewY2=ln.pEnd.y;
                                    if (ln.fRotate > 0.0f) {
                                        // rotation
                                        iNewX1=0;
                                        iNewY1=0;
                                        iNewX2=ln.pEnd.x-ln.pStart.x;
                                        iNewY2=ln.pEnd.y-ln.pStart.y;                                   
                                        double dCX=0.0d;
                                        double dCY=0.0d;
                                        g2.transform(AffineTransform.getTranslateInstance(ln.pStart.x, ln.pStart.y)); 
                                        if(ln.sCenterPoint.equalsIgnoreCase("ul")){
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * ln.fRotate));
                                        }
                                        else if(ln.sCenterPoint.equalsIgnoreCase("dl")){
                                            dCY = iNewY2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * ln.fRotate, dCX, dCY));
                                        }
                                        else if(ln.sCenterPoint.equalsIgnoreCase("ur")){
                                            dCX = iNewX2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * ln.fRotate, dCX, dCY));
                                        }
                                        else if(ln.sCenterPoint.equalsIgnoreCase("dr")){
                                            dCX = iNewX2 ;
                                            dCY = iNewY2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * ln.fRotate, dCX, dCY));
                                        }                                        
                                        else if(ln.sCenterPoint.equalsIgnoreCase("c")){
                                            dCX = iNewX2 / 2; dCY = iNewY2 / 2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * ln.fRotate, dCX, dCY));
                                        }                                      
                                    }                                                                
                                    if (ln.fDash[0] > 0.0f) {
                                        if (ln.iJoin == BasicStroke.JOIN_MITER)
                                            iLimit = 5;
                                        g2.setStroke(new BasicStroke((float)ln.iWidth, ln.iCap, ln.iJoin, iLimit,
                                                                     ln.fDash, 0));
                                    } else
                                        g2.setStroke(new BasicStroke((float)ln.iWidth, ln.iCap, ln.iJoin));
                                    g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, ln.f));
                                    g2.drawLine(iNewX1, iNewY1, iNewX2, iNewY2);
                                    g2.setTransform(oldTransform);
                                    break;
                                case 2: // rectangle
                                    Rect re = (Rect)list_rects.get(to.sName);
                                    logPaint("Rectangle:" + re);
                                    oldTransform = g2.getTransform();
                                    iNewX=re.iX1;
                                    iNewY=re.iY1;
                                    if (re.fRotate > 0.0f) {
                                        // rotation
                                        iNewX=0;
                                        iNewY=0;
                                        double dCX=0.0d;
                                        double dCY=0.0d;
                                        g2.transform(AffineTransform.getTranslateInstance(re.iX1, re.iY1)); 
                                        if(re.sCenterPoint.equalsIgnoreCase("ul")){
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * re.fRotate));
                                        }
                                        else if(re.sCenterPoint.equalsIgnoreCase("dl")){
                                            dCY = re.iY2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * re.fRotate, dCX, dCY));
                                        }
                                        else if(re.sCenterPoint.equalsIgnoreCase("ur")){
                                            dCX = re.iX2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * re.fRotate, dCX, dCY));
                                        }
                                        else if(re.sCenterPoint.equalsIgnoreCase("dr")){
                                            dCX = re.iX2 ;
                                            dCY = re.iY2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * re.fRotate, dCX, dCY));
                                        }                                        
                                        else if(re.sCenterPoint.equalsIgnoreCase("c")){
                                            dCX = re.iX2 / 2; dCY = re.iY2 / 2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * re.fRotate, dCX, dCY));
                                        }                                        
                                    }                                      
                                    if (re.cShade != null) {
                                        g2.setColor(re.cShade);
                                        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, .3f));
                                        if (re.iRound == 0)
                                            g2.fillRect(iNewX + 5, iNewY + 3, re.iX2 + 1, re.iY2 + 3);
                                        else
                                            g2.fill(new RoundRectangle2D.Double(iNewX + 5, iNewY + 3, re.iX2 + 1,
                                                                                re.iY2 + 3, re.iRound, re.iRound));
                                    }
                                    if (re.cStart != null && re.cEnd != null) {
                                        if (re.iDir == 1)
                                            gp = new GradientPaint(re.iX1, re.iY1, re.cStart, re.iX1 + re.iX2, re.iY1, re.cEnd);
                                        else
                                            gp = new GradientPaint(re.iX1, re.iY1, re.cStart, re.iX1, re.iY1 + re.iY2, re.cEnd);
                                        g2.setPaint(gp);
                                        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, re.f));
                                        if (re.iRound == 0)
                                            g2.fillRect(iNewX, iNewY, re.iX2, re.iY2);
                                        else
                                            g2.fill(new RoundRectangle2D.Double(iNewX, iNewY, re.iX2, re.iY2,
                                                                                re.iRound, re.iRound));
                                    } else if (re.cinside != null) {
                                        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1f));
                                        g2.setColor(re.cinside);
                                        if (re.iRound == 0)
                                            g2.fillRect(iNewX, iNewY, re.iX2, re.iY2);
                                        else
                                            g2.fill(new RoundRectangle2D.Double(iNewX, iNewY, re.iX2, re.iY2,
                                                                                re.iRound, re.iRound));
                                    }
                                    g2.setColor(re.color);
                                    g2.setStroke(new BasicStroke((float)re.iWidth));
                                    g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, re.f));
                                    if (re.iRound == 0)
                                        g2.drawRect(iNewX, iNewY, re.iX2, re.iY2);
                                    else
                                        g2.draw(new RoundRectangle2D.Double(iNewX, iNewY, re.iX2, re.iY2, re.iRound,
                                                                            re.iRound));
                                    // Motif to fill with ?
                                    if (re.sPaint != null) {
                                        TexturePaint tp = (TexturePaint)hTextures.get(re.sPaint);
                                        if (tp != null) {
                                            g2.setPaint(tp);
                                            g2.fillRect(iNewX, iNewY, re.iX2, re.iY2);
                                        }
                                    }
                                    g2.setTransform(oldTransform);
                                    break;
                                case 3: // shape
                                    Poly pol = (Poly)list_polys.get(to.sName);
                                    if(pol != null){
                                        oldTransform = g2.getTransform();
                                        TexturePaint tps = (TexturePaint)hTextures.get(pol.sTxtPaint);
                                        logPaint("Shape found:"+to.sName);
                                        iNewX=pol.iX;
                                        iNewY=pol.iY;
                                        if (pol.fRotate > 0.0f) {
                                            // rotation
                                            iNewX=0;
                                            iNewY=0;                                    
                                            double dCX=0.0d;
                                            double dCY=0.0d;
                                            g2.transform(AffineTransform.getTranslateInstance(pol.iX, pol.iY)); 
                                            if(pol.sCenterPoint.equalsIgnoreCase("ul")){
                                                g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * pol.fRotate));
                                            }
                                            else if(pol.sCenterPoint.equalsIgnoreCase("dl")){
                                                dCY = tps.getImage().getHeight() ;
                                                g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * pol.fRotate, dCX, dCY));
                                            }
                                            else if(pol.sCenterPoint.equalsIgnoreCase("ur")){
                                                dCX = tps.getImage().getWidth() ;
                                                g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * pol.fRotate, dCX, dCY));
                                            }
                                            else if(pol.sCenterPoint.equalsIgnoreCase("dr")){
                                                dCX = tps.getImage().getWidth() ;
                                                dCY = tps.getImage().getHeight() ;
                                                g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * pol.fRotate, dCX, dCY));
                                            }                                        
                                            else if(pol.sCenterPoint.equalsIgnoreCase("c")){
                                                dCX = tps.getImage().getWidth() / 2; dCY = tps.getImage().getHeight() / 2 ;
                                                g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * pol.fRotate, dCX, dCY));
                                            }                                      
                                        }                                    
                                        Composite cps = g2.getComposite();
                                        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, pol.fTrsp));
                                        if (tps != null) {
                                            logPaint("Draw Shape at "+iNewX+","+iNewY);
                                            g2.drawImage(tps.getImage(), iNewX, iNewY, null);
                                        }
                                        g2.setComposite(cps);
                                        g2.setTransform(oldTransform);
                                    }
                                    else{
                                            logPaint("Shape not found:"+iIndex);
                                    }
                                    break;  
                                case 4: // ellipse
                                    Ellipse el = (Ellipse)list_circles.get(to.sName);
                                    Ellipse2D el2;
                                    logPaint("Ellipse:" + el);
                                    oldTransform = g2.getTransform();
                                    iNewX=el.iX1;
                                    iNewY=el.iY1; 
                                    if (el.fRotate > 0.0f) {
                                        // rotation
                                        iNewX=0;
                                        iNewY=0;                                    
                                        double dCX=0.0d;
                                        double dCY=0.0d;
                                        g2.transform(AffineTransform.getTranslateInstance(el.iX1, el.iY1)); 
                                        if(el.sCenterPoint.equalsIgnoreCase("ul")){
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * el.fRotate));
                                        }
                                        else if(el.sCenterPoint.equalsIgnoreCase("dl")){
                                            dCY = el.iY2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * el.fRotate, dCX, dCY));
                                        }
                                        else if(el.sCenterPoint.equalsIgnoreCase("ur")){
                                            dCX = el.iX2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * el.fRotate, dCX, dCY));
                                        }
                                        else if(el.sCenterPoint.equalsIgnoreCase("dr")){
                                            dCX = el.iX2 ;
                                            dCY = el.iY2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * el.fRotate, dCX, dCY));
                                        }                                        
                                        else if(el.sCenterPoint.equalsIgnoreCase("c")){
                                            dCX = el.iX2 / 2; dCY = el.iY2 / 2 ;
                                            g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * el.fRotate, dCX, dCY));
                                        }                                      
                                    }
                                    if (el.cShade != null) {
                                        g2.setColor(el.cShade);
                                        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, .3f));
                                        el2 = new Ellipse2D.Double (iNewX + 5, iNewY + 3, el.iX2 + 1, el.iY2 + 3);
                                        g2.fill(el2);
                                    }
                                    el2 = new Ellipse2D.Double (iNewX,iNewY,el.iX2,el.iY2);
                                    if (el.cStart != null && el.cEnd != null) {
                                        if (el.iDir == 1)
                                            gp = new GradientPaint(el.iX1, el.iY1, el.cStart, el.iX1 + el.iX2, el.iY1, el.cEnd);
                                        else
                                            gp = new GradientPaint(el.iX1, el.iY1, el.cStart, el.iX1, el.iY1 + el.iY2, el.cEnd);
                                        g2.setPaint(gp);
                                        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, el.f));
                                        g2.fill(el2);
                                    } else if (el.cinside != null) {
                                        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1f));
                                        g2.setColor(el.cinside);
                                        g2.fill(el2);
                                    }
                                    g2.setColor(el.color);
                                    g2.setStroke(new BasicStroke((float)el.iWidth));
                                    g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, el.f));
                                    g2.draw(el2);
                                    // Motif to fill with ?
                                    if (el.sPaint != null) {
                                        TexturePaint tp = (TexturePaint)hTextures.get(el.sPaint);
                                        if (tp != null) {
                                            g2.setPaint(tp);
                                            g2.fill(el2);
                                        }
                                    }
                                    g2.setTransform(oldTransform);
                                    break;                                
                                case 9: // text
                                    Texts txt = (Texts)list_texts.get(to.sName);
                                    logPaint("text:" + txt.sLabel);
                                    recc = g2.getClipBounds();
                                    String s1="";
                                    int textHeight=0;
                                    int textWidth=0;
                                    Rectangle2D rect;
                                    if (txt.bValid && txt.bVisible) {
                                        oldTransform = g2.getTransform();
                                        transform = AffineTransform.getTranslateInstance(txt.iX, txt.iY);
                                        g2.transform(transform);
                                        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, txt.f));
                                        g2.setFont(txt.font);
                                        FontMetrics fm = g2.getFontMetrics(txt.font); // metrics for this object
                                        StringTokenizer st = new StringTokenizer(txt.sLabel, "\n");
                                        while (st.hasMoreTokens()) {
                                            s1 = st.nextToken();
                                            rect = fm.getStringBounds(s1, g2); // string size
                                            textHeight += (int)(rect.getHeight());
                                            textWidth  = rect.getWidth() > textWidth ? (int)(rect.getWidth()) : textWidth ;                                            
                                        }
                                        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,
                                                            RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
                                        g2.setRenderingHint(RenderingHints.KEY_RENDERING,
                                                            RenderingHints.VALUE_RENDER_QUALITY);
                                        if (txt.bGradient) {
                                            //gp = new GradientPaint(0, 0, txt.color1, textWidth, 0, txt.color2);
                                            gp = new GradientPaint(0, 0, txt.color1, 0, textHeight, txt.color2, true);
                                            g2.setPaint(gp);
                                        } else
                                            g2.setColor(txt.color);

                                        if (txt.fRotate > 0.0f) {
                                            // text rotation
                                            double dCX=0.0d;
                                            double dCY=0.0d;
                                            if(txt.sCenterPoint.equalsIgnoreCase("ul")){
                                                g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * txt.fRotate));
                                            }
                                            else if(txt.sCenterPoint.equalsIgnoreCase("dl")){
                                                dCY = textHeight ;
                                                g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * txt.fRotate, dCX, dCY));
                                            }
                                            else if(txt.sCenterPoint.equalsIgnoreCase("ur")){
                                                dCX = textHeight ;
                                                g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * txt.fRotate, dCX, dCY));
                                            }
                                            else if(txt.sCenterPoint.equalsIgnoreCase("dr")){
                                                dCX = textWidth ;
                                                dCY = textHeight ;
                                                g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * txt.fRotate, dCX, dCY));
                                            }                                        
                                            else if(txt.sCenterPoint.equalsIgnoreCase("c")){
                                                dCX = textWidth / 2 ; dCY = -(textHeight/2) ;
                                                g2.transform(AffineTransform.getRotateInstance(radiansPerDegree * txt.fRotate, dCX, dCY));
                                            }  
                                        }
                                        // simple text
                                        if (txt.img == null && txt.sPaint == null &&
                                            ((!txt.sType.equalsIgnoreCase("h_lines")) &&
                                             (!txt.sType.equalsIgnoreCase("v_lines"))) && txt.cOutline == null) {
                                            String s12 = null;
                                            int iLigs = 0, iz = 0;
                                            st = new StringTokenizer(txt.sLabel, "\n");
                                            while (st.hasMoreTokens()) {
                                                iLigs++;
                                                s12 = st.nextToken();
                                            }
                                            if (iLigs > 1) {
                                                iz = iLigs - 1;
                                                int _iX = 0;
                                                st = new StringTokenizer(txt.sLabel, "\n");
                                                while (st.hasMoreTokens()) {
                                                    s12 = st.nextToken();
                                                    rect = fm.getStringBounds(s12, g2); // token width
                                                    textWidth = (int)(rect.getWidth());
                                                    textHeight = (int)(rect.getHeight());
                                                    if (txt.sAlign.equalsIgnoreCase("right")) {
                                                        _iX = (txt.iEnd - txt.iStart) - textWidth;
                                                    } else if (txt.sAlign.equalsIgnoreCase("center")) {
                                                        _iX = (int)((txt.iEnd / 2) - (textWidth / 2));
                                                    }
                                                    g2.drawString(s12, (float)_iX, (float)0 - (--iLigs * textHeight));
                                                }
                                            } else
                                                g2.drawString(txt.sLabel, 0, 0);
                                        } else {
                                            // enhanced text
                                            FontRenderContext frc = g2.getFontRenderContext();
                                            String sFinalText = txt.sLabel;
                                            TextLayout tl = null;
                                            Shape shape = null;
                                            // Text justification ?
                                            if ((txt.sScale != null) && txt.sScale.equalsIgnoreCase("justify")) {
                                                logPaint("** Text to justify:" + txt.sLabel);
                                                Rectangle2D rect2 =
                                                    txt.font.getStringBounds(" ", new FontRenderContext(new AffineTransform(),
                                                                                                        true, true));
                                                int space = (int)(rect2.getWidth());
                                                int ii = 0, nbSpaces;
                                                //print("** Space requires:"+space+" pixels");
                                                tl = new TextLayout(txt.sLabel, txt.font, frc);
                                                int iSize = (int)tl.getBounds().getWidth();
                                                int reste = txt.iJustify - iSize;
                                                nbSpaces = (int)(reste / txt.sLabel.length());
                                                GlyphVector gv = txt.font.createGlyphVector(frc, txt.sLabel);
                                                reste = reste - (nbSpaces * txt.sLabel.length());
                                                Point2D p2d = null;
                                                space = (int)(nbSpaces / 2);
                                                for (ii = 0; ii < txt.sLabel.length(); ii++) {
                                                    p2d = gv.getGlyphPosition(ii);
                                                    p2d.setLocation(p2d.getX() + space, p2d.getY());
                                                    gv.setGlyphPosition(ii, p2d);
                                                    space += nbSpaces;
                                                }
                                                shape = gv.getOutline();

                                            }
                                            tl = new TextLayout(sFinalText, txt.font, frc);
                                            if (shape == null)
                                                shape = tl.getOutline(new AffineTransform());
                                            if (txt.sScale != null) {
                                                // scaling factor
                                                if ((txt.sScale.equalsIgnoreCase("scale")) && txt.fScaleX != 1.0f ||
                                                    txt.fScaleY != 1.0f) {
                                                    g2.transform(AffineTransform.getScaleInstance(txt.fScaleX,
                                                                                                  txt.fScaleY));
                                                }
                                                // scale text to fit the given box
                                                else if (txt.sScale.equalsIgnoreCase("box")) {
                                                    double dx = (double)(txt.iBoxWidth / tl.getBounds().getWidth());
                                                    double dy = (double)(txt.iBoxHeight / tl.getBounds().getHeight());
                                                    g2.transform(AffineTransform.getScaleInstance(dx, dy));
                                                }
                                            }

                                            if (txt.img != null) {
                                                // image clipping
                                                Rectangle r = shape.getBounds();
                                                Rectangle recc2 = g2.getClipBounds();
                                                g2.setClip(shape);
                                                g2.drawImage(txt.img, r.x, r.y, r.width, r.height, this);
                                                g2.setClip(recc2);
                                                if (txt.cOutline != null) {
                                                    g2.setColor(txt.cOutline);
                                                    g2.setStroke(new BasicStroke((float)txt.iOut));
                                                    g2.draw(shape);
                                                }
                                            } else if (txt.sPaint != null) {
                                                TexturePaint tp = (TexturePaint)hTextures.get(txt.sPaint);
                                                if (tp != null) {
                                                    g2.setPaint(tp);
                                                    g2.fill(shape);
                                                }
                                                if (txt.cOutline != null) {
                                                    g2.setColor(txt.cOutline);
                                                    g2.setStroke(new BasicStroke((float)txt.iOut));
                                                    g2.draw(shape);
                                                }
                                            } else if (txt.sType.equalsIgnoreCase("h_lines")) {
                                                // line motif
                                                int j = 0;
                                                float w2 = (float)shape.getBounds().width * 1.1f;
                                                Rectangle recc2 = g2.getClipBounds();
                                                g2.setClip(shape);
                                                g2.setColor(txt.color);
                                                g2.fill(shape);
                                                g2.setColor(txt.cOutline);
                                                g2.setStroke(new BasicStroke((float)txt.iOut));
                                                // Horizontal lines
                                                for (j = shape.getBounds().y;
                                                     j < shape.getBounds().y + shape.getBounds().height; j = j + 3) {
                                                    Line2D line = new Line2D.Float(0.0f, (float)j, w2, (float)j);
                                                    g2.draw(line);
                                                }
                                                g2.setClip(recc2);
                                            } else if (txt.sType.equalsIgnoreCase("v_lines")) {
                                                // line motif
                                                int j = 0;
                                                float h2 = (float)shape.getBounds().height * 1.1f;
                                                Rectangle recc2 = g2.getClipBounds();
                                                g2.setClip(shape);
                                                g2.setColor(txt.color);
                                                g2.fill(shape);
                                                g2.setColor(txt.cOutline);
                                                g2.setStroke(new BasicStroke((float)txt.iOut));
                                                // Vertical lines
                                                for (j = shape.getBounds().x;
                                                     j < shape.getBounds().x + shape.getBounds().width; j = j + 3) {
                                                    Line2D line = new Line2D.Float((float)j, 0.0f, (float)j, -h2);
                                                    g2.draw(line);
                                                }
                                                g2.setClip(recc2);
                                            } else {
                                                // shape motif
                                                if (txt.color != null) {
                                                    g2.setColor(txt.color);
                                                    g2.fill(shape);
                                                } else if (null != gp) {
                                                    g2.setPaint(gp);
                                                    g2.fill(shape);
                                                }
                                                if (txt.cOutline != null) {
                                                    g2.setColor(txt.cOutline);
                                                    g2.setStroke(new BasicStroke((float)txt.iOut));
                                                    g2.draw(shape);
                                                }
                                            }
                                        }
                                        g2.setTransform(oldTransform);
                                        g2.setClip(recc);
                                    }
                                    break;
                                case 10: // non-clickable image
                                    logPaint("Non-clickable image");
                                    Images img = (Images)list_images.get(iIndex);
                                    BufferedImage image = null;
                                    if (img.sValue == null) {
                                        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER,
                                                                                   img.fTransparency));
                                        if (img.bMirror) {
                                            ImageReflexion irflx = new ImageReflexion();
                                            image = irflx.createReflection(irflx.buildBufferedImage(img.img));
                                            g2.drawImage(image, img.iX1, img.iY1, this);
                                        } else
                                            g2.drawImage(img.img, img.iX1, img.iY1, this);
                                    }
                                    break;
                                }
                            }
                        }
                        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, rh);
                        g2.dispose();
                    }

                    public void update(Graphics g) {
                        paint(g);
                    }

                };

            //
            // MouseListener on the Canvas to trap
            // right-click for popup menus
            //
            formsMain.getCursorGrabProvider().addMouseGrab(new MouseListener() {
                public void mouseExited(MouseEvent me) {
                }

                public void mouseEntered(MouseEvent me) {
                }

                public void mousePressed(MouseEvent me) {
                }

                public void mouseReleased(MouseEvent me) {
                }

                public void mouseClicked(MouseEvent me) {
                    int x = 0, y = 0;
                    x = me.getComponent().getLocation().x + me.getPoint().x;
                    y = me.getComponent().getLocation().y + me.getPoint().y;
                    if (me.getButton() == me.BUTTON3 || (me.getButton() == 0)) {
                        HidePopupMenus();
                        if (sPopupMenu != null) {
                            setProperty(SHOW_POPUP_MENU, sPopupMenu + ",true," + x + "," + y);
                        }
                    } else {
                        if (bPopupDisplayed && (sPopupMenu != null)) {
                            setProperty(SHOW_POPUP_MENU, sPopupMenu + ",false");
                        }
                        bPopupDisplayed = false;
                    }
                    if(bMouseCanvasIdle){
                        Point p = me.getPoint();
                        if(rCanvasMouseArea.contains(p)) {
                            log("CanvasMouseClick button:"+me.getButton());
                            dispatchanevent(canvasMouseClick, ITEM_ACTION_MOUSEBUTTON, ""+me.getButton());
                        }
                    }                    
                }
            });
            //
            // MouseMotionListener for New Item ShowInRect property
            //
            formsMain.getCursorGrabProvider().addMouseMotionGrab(new MouseMotionListener() {
                public void mouseMoved(MouseEvent e) {
                    if (((e.getSource().getClass().getName().startsWith("oracle.forms.fd.DrawLAF")) ||
                         (e.getSource().getClass().getName().startsWith("javax.swing.JPanel"))) &&
                        ((iNbNewItems + iNbFormsItems) > 0)
                        || bMouseCanvasIdle) {
                        Point p = e.getPoint();
                        if(bMouseCanvasIdle){
                           if(rCanvasMouseArea.contains(p)) {
                            log("CanvasMouseMove p:"+p+ "  "+e.getSource().getClass().getName());
                            List lsParam = new ArrayList();
                            Messages mgs = new Messages(mouseXpos, ""+p.x);
                            lsParam.add(mgs);
                            mgs = new Messages(mouseYpos, ""+p.y);
                            lsParam.add(mgs);
                            dispatchanevent(canvasMouseMove, lsParam);
                           }
                        }
                        newItem ni = null;
                        // mouse located in hidden new item ?
                        for (int i = 0; i < ListItems.size(); i++) {
                            ni = (newItem)ListItems.get(i);
                            if ((ni != null) && (ni.rect != null)) {
                                if (ni.rect.contains(p)) {
                                    if (!ni.cp.isVisible()) {
                                        ni.cp.setVisible(true);
                                    }
                                } else {
                                    if (ni.cp.isVisible()) {
                                        ni.cp.setVisible(false);
                                    }
                                }
                            }
                        }
                        // hidden forms items ?
                        if (iNbFormsItems > 0) {
                            for (int i = 0; i < ListFormsItems.size(); i++) {
                                ni = (newItem)ListFormsItems.get(i);
                                if ((ni != null) && (ni.rect != null)) {
                                    if (ni.rect.contains(p)) {
                                        if (!ni.cp.isVisible()) {
                                            try {
                                                log("event: itm:" + ni.sName + " st:SHOW");
                                                CustomEvent ce = new CustomEvent(m_handler, ShowInRectEvt);
                                                m_handler.setProperty(ShowInRectItm, ni.sName);
                                                m_handler.setProperty(ShowInRectSts, "SHOW");
                                                dispatchCustomEvent(ce);
                                            } catch (Exception ex) {
                                                print("Item ShowInRect(): -> exception while dispatching: " + ex);
                                                ex.printStackTrace();
                                            }
                                        }
                                    } else {
                                        if (ni.cp.isVisible()) {
                                            try {
                                                log("event: itm:" + ni.sName + " st:HIDE");
                                                CustomEvent ce = new CustomEvent(m_handler, ShowInRectEvt);
                                                m_handler.setProperty(ShowInRectItm, ni.sName);
                                                m_handler.setProperty(ShowInRectSts, "HIDE");
                                                dispatchCustomEvent(ce);
                                            } catch (Exception ex) {
                                                print("Item ShowInRect(): -> exception while dispatching: " + ex);
                                                ex.printStackTrace();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                public void mouseDragged(MouseEvent e) {
                }
            });

            // give the JPanel the same size as the parent's canevas
            jp.setBounds(getParent().getBounds());
            jp.setBackground(null);
            jp.setOpaque(false);
            jp.setVisible(true);
            getParent().add(jp);
        }

    }


  /*----------------------------------------*
   *     set all properties for the bean
   *----------------------------------------*/

    public boolean setProperty(ID property, Object value) {

        if(property != TBSETIMAGE) {
            log(property + ":" + value);
        }

    /*------------------------------*
     * Set the frame type and title *
     *------------------------------*/
        if (property == pSetFrame) {

            Border br1 = new FrameBorderNew();
            panel = new myPanel();

            String sTitle = null, sFont = null, sJustif = null, string, sWeight = null, sPos = null, sPosition =
                "T", sFrameAlign = "L";
            int iFWidth = 1, iFontSize = 10, iWeight = Font.PLAIN, iWidth = 2;
            Font fFont = null;
            string = value.toString();
            StringTokenizer st = new StringTokenizer(string, ",");
            sName = st.nextToken(); // frame name
            panel.setName(sName);
            // create standard frame object
            objFrame of = new objFrame(sName, panel);

            try {
                iWidth = Integer.parseInt(st.nextToken());
                iFWidth = iWidth > 0 ? iWidth : 1;
                of.SetFrameWidth(iFWidth);
            } catch (Exception e) {
                ;
            }

            panel.setBorder(br1);
            panel.setOpaque(false);

            if (st.hasMoreTokens())
                sTitle = st.nextToken(); // frame Title
            if (st.hasMoreTokens()) {
                sFont = st.nextToken(); // frame Font
                if (st.hasMoreTokens()) {
                    try {
                        iFontSize = Integer.parseInt(st.nextToken()); // frame Font size
                    } catch (Exception e) {
                        return false;
                    }
                    if (st.hasMoreTokens()) {
                        sWeight = st.nextToken();
                        if (sWeight.equalsIgnoreCase("N"))
                            iWeight = Font.PLAIN;
                        else if (sWeight.equalsIgnoreCase("B"))
                            iWeight = Font.BOLD;
                        else if (sWeight.equalsIgnoreCase("I"))
                            iWeight = Font.ITALIC;
                        else if (sWeight.equalsIgnoreCase("BI"))
                            iWeight = Font.BOLD + Font.ITALIC;
                    }

                    // frame position
                    if (st.hasMoreTokens()) {
                        sPos = st.nextToken();
                        if (sPos.equalsIgnoreCase("left"))
                            sPosition = "L";
                        else if (sPos.equalsIgnoreCase("right"))
                            sPosition = "R";
                        else if (sPos.equalsIgnoreCase("top"))
                            sPosition = "T";
                        else if (sPos.equalsIgnoreCase("bottom"))
                            sPosition = "B";
                    } else
                        return false;

                    if (st.hasMoreTokens())
                        sJustif = st.nextToken(); // frame Justification

                    if (sFont != null) {
                        try {
                            fFont = new Font(sFont, iWeight, iFontSize);
                        } catch (Exception e) {
                            ;
                        }
                        ;
                    }

                    // frame alignment
                    if (sJustif != null) {
                        if (sJustif.equalsIgnoreCase("left"))
                            sFrameAlign = "L";
                        else if (sJustif.equalsIgnoreCase("right"))
                            sFrameAlign = "R";
                        else if (sJustif.equalsIgnoreCase("center"))
                            sFrameAlign = "C";
                    }
                }
            }

            if (sTitle != null)
                of.setFrameTitle(sTitle);
            if (fFont != null)
                of.setFrameFont(fFont);
            if (sJustif != null)
                of.setFrameTextAlign(sPosition, sFrameAlign);

            // add object to hash map
            hFrames.put(sName, of);
            this.getParent().add(panel);
            return true;
        }

        /*---------------------------*
         *  global frame properties  *
         *---------------------------*/
        else if (property == pSetFrameProp) {
            String s = value.toString();
            String sProp = "", sValue = "";
            String s1 = null, s2 = null, s3 = null;
            Font fFont = null;
            int iWheight = Font.PLAIN;
            int i1 = 12;
            float f1 = 1.0f;
            StringTokenizer st = new StringTokenizer(s, ":");
            if (st.hasMoreTokens())
                sProp = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sValue = st.nextToken();
            else
                return false;
            log(sProp + "=" + sValue);
            // font
            if (sProp.equalsIgnoreCase("font")) {
                StringTokenizer st2 = new StringTokenizer(sValue, ",");
                if (st2.hasMoreTokens())
                    s1 = st2.nextToken();
                else
                    return false; // font name
                if (st2.hasMoreTokens())
                    s2 = st2.nextToken(); // wheight
                if (st2.hasMoreTokens()) {
                    try {
                        i1 = Integer.parseInt(st2.nextToken()); // font size
                    } catch (Exception e) {
                        return false;
                    }
                }
                if (s2.equalsIgnoreCase("B"))
                    iWheight = Font.BOLD;
                else if (s2.equalsIgnoreCase("I"))
                    iWheight = Font.ITALIC;
                else if (s2.equalsIgnoreCase("BI"))
                    iWheight = Font.BOLD + Font.ITALIC;
                try {
                    fFont = new Font(s1, iWheight, i1);
                    gfFrameFont = fFont;
                } catch (Exception e) {
                    ;
                }
                return true;
            }
            // opaque
            else if (sProp.equalsIgnoreCase("opaque")) {
                if (sValue.equalsIgnoreCase("true"))
                    gbFrameTitleOpaque = true;
                else
                    gbFrameTitleOpaque = false;
                return true;
            }

            // round border
            else if (sProp.equalsIgnoreCase("round")) {
                if (sValue.equalsIgnoreCase("true"))
                    gbRoundedFrame = true;
                else
                    gbRoundedFrame = false;
                return true;
            }
            // frame background (inside)
            else if (sProp.equalsIgnoreCase("background")) {
                StringTokenizer st2 = new StringTokenizer(sValue, ",");
                if (st2.hasMoreTokens())
                    s1 = st2.nextToken();
                else
                    return false; // color 1
                if (st2.hasMoreTokens())
                    s2 = st2.nextToken(); // color 2
                if (st2.hasMoreTokens()) {
                    s3 = st2.nextToken(); // transparency
                    try {
                        f1 = Float.parseFloat(s3);
                        if (f1 < 0.0)
                            f1 = 0.0f;
                        if (f1 > 1.0)
                            f1 = 1.0f;
                    } catch (Exception e) {
                        ;
                    }
                }
                if (s1 != null)
                    gcFrameGradient1 = ik.makeColor(s1);
                if (s2 != null)
                    gcFrameGradient2 = ik.makeColor(s2);
                if (s3 != null)
                    gfFrameTransp = f1;
                return true;
            }
            // frame colors (border)
            else if (sProp.equalsIgnoreCase("colors") && !bFrameUseScheme) {
                StringTokenizer st2 = new StringTokenizer(sValue, ",");
                if (st2.hasMoreTokens())
                    s1 = st2.nextToken();
                else
                    return false; // color 1
                if (st2.hasMoreTokens())
                    s2 = st2.nextToken(); // color 2
                if (s1 != null)
                    gcFrameColor = ik.makeColor(s1);
                if (s2 != null)
                    gcFrameShadow = ik.makeColor(s2);
                return true;
            }
            // frame gradient colors (border)
            else if (sProp.equalsIgnoreCase("gradient_border") && !bFrameUseScheme) {
                StringTokenizer st2 = new StringTokenizer(sValue, ",");
                if (st2.hasMoreTokens())
                    s1 = st2.nextToken();
                else
                    return false; // color 1
                if (st2.hasMoreTokens())
                    s2 = st2.nextToken(); // color 2
                if (s1 != null)
                    gcFrameColorStart = ik.makeColor(s1);
                if (s2 != null)
                    gcFrameColorEnd = ik.makeColor(s2);
                return true;
            }
            // frame gradient colors (shadow)
            else if (sProp.equalsIgnoreCase("gradient_shadow") && !bFrameUseScheme) {
                StringTokenizer st2 = new StringTokenizer(sValue, ",");
                if (st2.hasMoreTokens())
                    s1 = st2.nextToken();
                else
                    return false; // color 1
                if (st2.hasMoreTokens())
                    s2 = st2.nextToken(); // color 2
                if (s1 != null)
                    gcFrameSColorStart = ik.makeColor(s1);
                if (s2 != null)
                    gcFrameSColorEnd = ik.makeColor(s2);
                return true;
            }
            // frame title position
            else if (sProp.equalsIgnoreCase("position")) {
                StringTokenizer st2 = new StringTokenizer(sValue, ",");
                if (st2.hasMoreTokens())
                    s1 = st2.nextToken();
                else
                    return false;
                if (s1.equalsIgnoreCase("left"))
                    gsFramePosition = "L";
                else if (s1.equalsIgnoreCase("right"))
                    gsFramePosition = "R";
                else if (s1.equalsIgnoreCase("top"))
                    gsFramePosition = "T";
                else if (s1.equalsIgnoreCase("bottom"))
                    gsFramePosition = "B";
                if (st2.hasMoreTokens())
                    s2 = st2.nextToken();
                else
                    return false;
                if (s2.equalsIgnoreCase("left"))
                    gsFrameAligment = "L";
                else if (s2.equalsIgnoreCase("right"))
                    gsFrameAligment = "R";
                else if (s2.equalsIgnoreCase("center"))
                    gsFrameAligment = "C";
                return true;
            }
            // frame title colors
            else if (sProp.equalsIgnoreCase("title-colors") && !bFrameUseScheme) {
                StringTokenizer st2 = new StringTokenizer(sValue, ",");
                if (st2.hasMoreTokens())
                    s1 = st2.nextToken();
                else
                    return false; // color 1
                if (st2.hasMoreTokens())
                    s2 = st2.nextToken(); // color 2
                if (s1 != null)
                    gcFrameTitleFore = ik.makeColor(s1);
                if (s2 != null)
                    gcFrameTitleBack = ik.makeColor(s2);
                return true;
            }
            // frame gradient orientation
            else if (sProp.equalsIgnoreCase("title-colors")) {
                if (sValue.equalsIgnoreCase("lefttoright"))
                    gigrDir = FLeftToRight;
                else if (sValue.equalsIgnoreCase("righttoleft"))
                    gigrDir = FRightToLeft;
                else if (sValue.equalsIgnoreCase("uptodown"))
                    gigrDir = FUpToDown;
                else if (sValue.equalsIgnoreCase("downtoup"))
                    gigrDir = FDownToUp;
                return true;
            }
            return true;
        }

        /*-------------------*
         *  title alignment  *
         *-------------------*/
        else if (property == pSetFrameTextAlign) {
            String s = value.toString();
            String sPos = "T", s2 = "", sAlign = "L";
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens()) {
                sPos = st.nextToken();
                if (sPos.equalsIgnoreCase("left"))
                    sPos = "L";
                else if (sPos.equalsIgnoreCase("right"))
                    sPos = "R";
                else if (sPos.equalsIgnoreCase("top"))
                    sPos = "T";
                else if (sPos.equalsIgnoreCase("bottom"))
                    sPos = "B";
            } else
                return false;
            if (st.hasMoreTokens()) {
                s2 = st.nextToken();
                if (s2.equalsIgnoreCase("left"))
                    sAlign = "L";
                else if (s2.equalsIgnoreCase("right"))
                    sAlign = "R";
                else if (s2.equalsIgnoreCase("center"))
                    sAlign = "C";
                else
                    return false;
                objFrame of = (objFrame)hFrames.get(sName);
                if (of != null) {
                    of.setFrameTextAlign(sPos, sAlign);
                    hFrames.put(sName, of);
                    of.panel.repaint();
                }
            }
            return true;
        }

        /*------------------------------*
         * Set the frame type and title *
         *------------------------------*/
        else if (property == pSetFrameFont) {
            String string, sFont = "", sWeight = "";
            int iFontSize = 10, iWeight = Font.PLAIN;
            Font fFont = null;
            string = value.toString();
            StringTokenizer st = new StringTokenizer(string, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sFont = st.nextToken(); // frame Font
            else
                return false;
            if (st.hasMoreTokens()) {
                try {
                    iFontSize = Integer.parseInt(st.nextToken()); // frame Font size
                } catch (Exception e) {
                    return false;
                }
            }
            if (st.hasMoreTokens()) {
                sWeight = st.nextToken();
                if (sWeight.equalsIgnoreCase("N"))
                    iWeight = Font.PLAIN;
                if (sWeight.equalsIgnoreCase("B"))
                    iWeight = Font.BOLD;
                if (sWeight.equalsIgnoreCase("I"))
                    iWeight = Font.ITALIC;
                if (sWeight.equalsIgnoreCase("BI"))
                    iWeight = Font.BOLD | Font.ITALIC;
            }
            try {
                fFont = new Font(sFont, iWeight, iFontSize);
            } catch (Exception e) {
                ;
            }
            ;
            objFrame of = (objFrame)hFrames.get(sName);
            if (of != null) {
                of.setFrameFont(fFont);
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }

        /*-----------------------------*
         *  set the frame title color  *
         *-----------------------------*/
        else if (property == pSetFrameTitleColor) {
            String s = value.toString();
            String sColor = "";
            StringTokenizer st = new StringTokenizer(s, ",");
            Color c1 = null, c2 = null;
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sColor = st.nextToken();
            else
                return false;
            c1 = ik.makeColor(sColor);
            if (st.hasMoreTokens()) {
                sColor = st.nextToken();
                c2 = ik.makeColor(sColor);
            }
            objFrame of = (objFrame)hFrames.get(sName);
            if (of != null) {
                of.setFrameTitleColors(c1, c2);
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }

        /*----------------------------------*
         *  set the frame background color  *
         *----------------------------------*/
        else if (property == pSetFrameBackground) {
            String s = value.toString().trim();
            String sCol1 = null, sCol2 = null, sFMotif = null;
            float f = .5f;
            int i = 0;
            Color cF1 = null, cF2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            // first gradient color or motif name
            if (st.hasMoreTokens()) {
                sCol1 = st.nextToken();
                if (sCol1.toLowerCase().startsWith("motif=")) {
                    i = sCol1.indexOf("=");
                    sFMotif = sCol1.substring(i + 1);
                } else
                    cF1 = ik.makeColor(sCol1);
            } else
                return false;
            // second gradient color
            if (st.hasMoreTokens()) {
                sCol2 = st.nextToken();
                if (!sCol2.equalsIgnoreCase("-"))
                    cF2 = ik.makeColor(sCol2);
                else
                    cF2 = null;
            } else
                cF2 = null;
            // transparency
            if (st.hasMoreTokens()) {
                try {
                    f = Float.parseFloat(st.nextToken());
                    if (f < 0.0)
                        f = 0.0f;
                    if (f > 1.0)
                        f = 1.0f;
                } catch (Exception e) {
                    ;
                }
            }
            objFrame of = (objFrame)hFrames.get(sName);
            if (of != null) {
                if (sFMotif != null)
                    of.setFrameMotif(sFMotif, f);
                else
                    of.setFrameBackground(cF1, cF2, f);
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }

        /*------------------------*
         *  set the frame colors  *
         *------------------------*/
        else if (property == pSetFrameColors) {
            Color c1 = null, c2 = null;
            String s = value.toString().trim();
            String sCol1 = null, sCol2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens()) {
                sCol1 = st.nextToken();
                c1 = ik.makeColor(sCol1);
            } else
                return false;
            if (st.hasMoreTokens()) {
                sCol2 = st.nextToken();
                c2 = ik.makeColor(sCol2);
            } else
                c2 = null;
            objFrame of = (objFrame)hFrames.get(sName);
            if (of != null) {
                of.setFrameColors(c1, c2);
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }

        /*---------------------------------*
         *  set the frame border gradient  *
         *---------------------------------*/
        else if (property == pSetFrameBorderGradient) {
            Color c1 = null, c2 = null;
            int iDir = UpToDown;
            String s = value.toString().trim();
            String sCol1 = null, sCol2 = null, sDir = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens()) {
                sCol1 = st.nextToken();
                c1 = ik.makeColor(sCol1);
            } else
                return false;
            if (st.hasMoreTokens()) {
                sCol2 = st.nextToken();
                c2 = ik.makeColor(sCol2);
            } else
                return false;
            if (st.hasMoreTokens()) {
                sDir = st.nextToken();
                if (sDir.equalsIgnoreCase("LeftToRight"))
                    iDir = LeftToRight;
                else if (sDir.equalsIgnoreCase("UpToDown"))
                    iDir = UpToDown;
                else if (sDir.equalsIgnoreCase("LeftUpToRightDown"))
                    iDir = LeftUpToRightDown;
                else if (sDir.equalsIgnoreCase("LeftDownToRightUp"))
                    iDir = LeftDownToRightUp;
            }
            objFrame of = (objFrame)hFrames.get(sName);
            if (of != null) {
                of.setFrameGradient(c1, c2);
                of.setFrameGradientDir(iDir);
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }

        /*---------------------------------*
         *  set the frame shadow gradient  *
         *---------------------------------*/
        else if (property == pSetFrameShadowGradient) {
            Color c1 = null, c2 = null;
            int iDir = UpToDown;
            String s = value.toString().trim();
            String sCol1 = null, sCol2 = null, sDir = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens()) {
                sCol1 = st.nextToken();
                c1 = ik.makeColor(sCol1);
            } else
                return false;
            if (st.hasMoreTokens()) {
                sCol2 = st.nextToken();
                c2 = ik.makeColor(sCol2);
            } else
                return false;
            if (st.hasMoreTokens()) {
                sDir = st.nextToken();
                if (sDir.equalsIgnoreCase("LeftToRight"))
                    iDir = LeftToRight;
                else if (sDir.equalsIgnoreCase("UpToDown"))
                    iDir = UpToDown;
                else if (sDir.equalsIgnoreCase("LeftUpToRightDown"))
                    iDir = LeftUpToRightDown;
                else if (sDir.equalsIgnoreCase("LeftDownToRightUp"))
                    iDir = LeftDownToRightUp;
            }
            objFrame of = (objFrame)hFrames.get(sName);
            if (of != null) {
                of.setFrameShadowGradient(c1, c2);
                of.setFrameShadowGradientDir(iDir);
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }

        /*------------------*
         *  set the bounds  *
         *------------------*/
        else if (property == pSetBounds) {
            int x = 0, y = 0, w = 0, h = 0;
            String s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            try {
                if (st.hasMoreTokens())
                    x = Integer.parseInt(st.nextToken());
                else
                    return false;
                if (st.hasMoreTokens())
                    y = Integer.parseInt(st.nextToken());
                else
                    return false;
                if (st.hasMoreTokens())
                    w = Integer.parseInt(st.nextToken());
                else
                    return false;
                if (st.hasMoreTokens())
                    h = Integer.parseInt(st.nextToken());
                else
                    return false;
            } catch (Exception e) {
                ;
            }
            objFrame of = (objFrame)hFrames.get(sName);
            if (of != null) {
                of.setBounds(x, y, w, h);
                of.iWFrame = w;
                of.iHFrame = h;
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }

        /*----------------------*
         *  set the title text  *
         *----------------------*/
        else if (property == pSetFrameText) {
            String title = "", sJustif = "", sPos = "T", s = value.toString();
            String sAlign = "L";
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                title = st.nextToken();
            else
                return false;
            // frame position
            if (st.hasMoreTokens()) {
                sPos = st.nextToken();
                if (sPos.equalsIgnoreCase("left"))
                    sPos = "L";
                else if (sPos.equalsIgnoreCase("right"))
                    sPos = "R";
                else if (sPos.equalsIgnoreCase("top"))
                    sPos = "T";
                else if (sPos.equalsIgnoreCase("bottom"))
                    sPos = "B";
            } else
                return false;
            // frame alignment
            if (st.hasMoreTokens()) {
                sJustif = st.nextToken(); // title Justification
                if (sJustif.equalsIgnoreCase("left"))
                    sAlign = "L";
                else if (sJustif.equalsIgnoreCase("right"))
                    sAlign = "R";
                else if (sJustif.equalsIgnoreCase("center"))
                    sAlign = "C";
                else
                    sJustif = null;
            }
            objFrame of = (objFrame)hFrames.get(sName);
            if (of != null) {
                of.setFrameTitle(title);
                if (sJustif != null)
                    of.setFrameTextAlign(sPos, sAlign);
                of.panel.repaint();
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }

        /*------------------------*
         *  Gradient orientation  *
         *------------------------*/
        else if (property == pSetFrameGradOrient) {
            String s = value.toString();
            int iDir = FLeftToRight;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens()) {
                s = st.nextToken();
                if (s.equalsIgnoreCase("LeftToRight"))
                    iDir = FLeftToRight;
                else if (s.equalsIgnoreCase("RightToLeft"))
                    iDir = FRightToLeft;
                else if (s.equalsIgnoreCase("UpToDown"))
                    iDir = FUpToDown;
                else if (s.equalsIgnoreCase("DownToUp"))
                    iDir = FDownToUp;
                else
                    return false;
                objFrame of = (objFrame)hFrames.get(sName);
                if (of != null) {
                    of.SetFrameGradOrient(iDir);
                    hFrames.put(sName, of);
                    of.panel.repaint();
                }
            }
            return true;
        }

        /*--------------------------*
         * set the horizontal cycle
         *--------------------------*/
        else if (property == pSetFrameHCycle) {
            String s = value.toString();
            String sVal = "";
            int iFH;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            objFrame of = (objFrame)hFrames.get(sName);
            if (of == null)
                return false;
            if (st.hasMoreTokens()) {
                sVal = st.nextToken();
                int i = 0;
                if (sVal.startsWith("/")) {
                    try {
                        i = Integer.parseInt(sVal.substring(1));
                        iFH = of.iHFrame / i;
                    } catch (Exception e) {
                        return false;
                    }
                } else {
                    try {
                        i = Integer.parseInt(sVal);
                        iFH = i;
                    } catch (Exception e) {
                        return false;
                    }
                }

                of.setFrameHCycle(iFH);
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }

        /*--------------------------*
         *  set the vertical cycle
         *--------------------------*/
        else if (property == pSetFrameVCycle) {
            String s = value.toString();
            String sVal = "";
            int iFV = 0;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            objFrame of = (objFrame)hFrames.get(sName);
            if (of == null)
                return false;
            if (st.hasMoreTokens()) {
                sVal = st.nextToken();
                int i = 0;
                if (sVal.startsWith("/")) {
                    try {
                        i = Integer.parseInt(sVal.substring(1));
                        iFV = of.iWFrame / i;
                    } catch (Exception e) {
                        return false;
                    }
                } else {
                    try {
                        i = Integer.parseInt(sVal);
                        iFV = i;
                    } catch (Exception e) {
                        return false;
                    }
                }

                of.setFrameVCycle(iFV);
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }

        /*------------------
         *  rounded frame
         *-----------------*/
        else if (property == pSetFrameRounded) {
            String s = value.toString();
            String sVal = "";
            boolean bR = false;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens()) {
                sVal = st.nextToken();
                if (sVal.equalsIgnoreCase("true"))
                    bR = true;
                else
                    bR = false;
                objFrame of = (objFrame)hFrames.get(sName);
                if (of != null) {
                    of.setFrameRounded(bR);
                    hFrames.put(sName, of);
                    of.panel.repaint();
                }
            }
            return true;
        }

        /*---------------------
         *  transparent title
         *--------------------*/
        else if (property == pSetFrameTextOpaque) {
            String s = value.toString();
            String sVal = "";
            boolean bO = false;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens()) {
                sVal = st.nextToken();
                if (sVal.equalsIgnoreCase("true"))
                    bO = true;
                else
                    bO = false;
                objFrame of = (objFrame)hFrames.get(sName);
                if (of != null) {
                    of.bFrameTitleOpaque = bO;
                    hFrames.put(sName, of);
                    of.panel.repaint();
                }
            }
            return true;
        }

        /*------------------*
         *  Show the frame  *
         *------------------*/
        else if (property == pShowFrame) {
            String sName = value.toString();
            objFrame of = (objFrame)hFrames.get(sName);
            if (of != null) {
                of.setVisible(true);
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }

        /*------------------*
         *  Hide the frame  *
         *------------------*/
        else if (property == pHideFrame) {
            String sName = value.toString();
            objFrame of = (objFrame)hFrames.get(sName);
            if (of != null) {
                of.setVisible(false);
                hFrames.put(sName, of);
                of.panel.repaint();
            }
            return true;
        }


        /*---------------------*
         *  show the frame box *
         *---------------------*/
        else if (property == pShowFrameBox) {
            String s = value.toString();
            if (s.equalsIgnoreCase("true"))
                bDrawFrameBounds = true;
            else
                bDrawFrameBounds = false;
            return true;
        }

        /*----------------------*
         *  Remove given frame  *
         *----------------------*/
        else if (property == pRemoveFrame) {
            String s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            objFrame of = (objFrame)hFrames.get(sName);
            if (of != null) {
                this.getParent().remove(of.panel);
            }
            hFrames.remove(sName);
            return true;
        }

        /*----------------------*
         *   Remove all frames  *
         *----------------------*/
        else if (property == pRemoveAllFrames) {
            String str = "";
            Set set = hFrames.keySet();
            Iterator itr = set.iterator();
            while (itr.hasNext()) {
                str = (String)itr.next();
                log(str + ": " + hFrames.get(str));
                objFrame of = (objFrame)hFrames.get(str);
                if (of != null) {
                    log("Frame:" + of.sName);
                    this.getParent().remove(of.panel);
                }
            }
            hFrames.clear();
            return true;
        }

        //***********************
        //    Tab properties
        //***********************

        /*------------------------*
         *   set the Tab colors   *
         *------------------------*/
        else if (property == pSetTabColors) {
            log("Set_Tab_Colors:" + value);
            Color c1 = null, c2 = null;
            String s = value.toString().trim();
            String sCol1 = null, sCol2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (bTabUseScheme)
                return false;
            if (st.hasMoreTokens()) {
                sCol1 = st.nextToken();
                c1 = ik.makeColor(sCol1);
            } else
                return false;
            if (st.hasMoreTokens()) {
                sCol2 = st.nextToken();
                c2 = ik.makeColor(sCol2);
            } else
                c2 = null;

            Set set = hTabs.keySet();
            Iterator itr = set.iterator();
            while (itr.hasNext()) {
                s = (String)itr.next();
                objTab ot = (objTab)hTabs.get(s);
                if (ot != null) {
                    log("s=" + s + " c1=" + c1);
                    ot.setTabColors(c1, c2);
                    hTabs.put(s, ot);
                }
            }
            // refresh tabs
            setProperty(GetComponents, null);
            return true;
        }

        /*---------------------------------*
         *   set the Tab selected colors   *
         *---------------------------------*/
        else if (property == pSetTabSelColors) {
            log("Set_Tab_Selected_Colors:" + value);
            Color c1 = null, c2 = null;
            String s = value.toString().trim();
            String sCol1 = null, sCol2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (bTabUseScheme)
                return false;
            if (st.hasMoreTokens()) {
                sCol1 = st.nextToken();
                c1 = ik.makeColor(sCol1);
            } else
                return false;
            if (st.hasMoreTokens()) {
                sCol2 = st.nextToken();
                c2 = ik.makeColor(sCol2);
            } else
                c2 = null;

            Set set = hTabs.keySet();
            Iterator itr = set.iterator();
            while (itr.hasNext()) {
                s = (String)itr.next();
                objTab ot = (objTab)hTabs.get(s);
                if (ot != null) {
                    ot.setTabSelColors(c1, c2);
                    hTabs.put(s, ot);
                }
            }
            // refresh tabs
            setProperty(GetComponents, null);
            return true;
        }

        /*----------------------*
         *   set the Tab font   *
         *----------------------*/
        else if (property == pSetTabFont) {
            log("Set_Tab_Font:" + value);
            String s = value.toString().trim();
            String s1 = null, s2 = null;
            int iWeight = Font.PLAIN, iSize = 12;
            Font f = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            // font name
            if (st.hasMoreTokens())
                s1 = st.nextToken();
            else
                return false;
            // font wheight
            if (st.hasMoreTokens())
                s2 = st.nextToken();
            else
                return false;
            // font size
            if (st.hasMoreTokens()) {
                try {
                    iSize = Integer.parseInt(st.nextToken());
                } catch (Exception e) {
                    return false;
                }
            } else
                return false;
            if (s2.equalsIgnoreCase("B"))
                iWeight = Font.BOLD;
            else if (s2.equalsIgnoreCase("I"))
                iWeight = Font.ITALIC;
            else if (s2.equalsIgnoreCase("BI"))
                iWeight = Font.ITALIC + Font.ITALIC;
            try {
                f = new Font(s1, iWeight, iSize);
            } catch (Exception e) {
                return false;
            }

            Set set = hTabs.keySet();
            Iterator itr = set.iterator();
            while (itr.hasNext()) {
                s = (String)itr.next();
                objTab ot = (objTab)hTabs.get(s);
                if (ot != null) {
                    ot.setTabFont(f);
                    hTabs.put(s, ot);
                }
            }
            // refresh tabs
            setProperty(GetComponents, null);
            return true;
        }

        /*--------------------------*
         *  set the Tab item icon   *
         *--------------------------*/
        else if (property == pSetTabItemIcon) {
            log("Set_Tab_Item_Icon:" + value);
            String s = value.toString().trim();
            String sT = "", sIcon = "", s1 = null;
            boolean bCont = true;
            StringTokenizer st = new StringTokenizer(s, ",");
            // tab page name
            if (st.hasMoreTokens())
                sT = st.nextToken();
            else
                return false;
            // icon name
            if (st.hasMoreTokens())
                sIcon = st.nextToken();
            else
                return false;
            // searching the corresponding page tab
            Set set = hTabs.keySet();
            Iterator itr = set.iterator();

            while (itr.hasNext()) {
                s = (String)itr.next();
                objTab ot = (objTab)hTabs.get(s);
                if (ot != null) {
                    Set set2 = ot.hTabItems.keySet();
                    Iterator itr2 = set2.iterator();
                    while (itr2.hasNext()) {
                        s1 = (String)itr2.next();
                        if (s1.equalsIgnoreCase(sT)) {
                            ot.hTabItems.put(s1, sIcon);
                            hTabs.put(s, ot);
                            bCont = false;
                            // refresh tabs
                            setProperty(GetComponents, null);
                            break;
                        }
                    }
                }
                if (!bCont)
                    break;
            }
            return true;
        }
        /*----------------------*
         *   set the Tab font   *
         *----------------------*/
        else if (property == pRefreshTabs) {
            setProperty(GetComponents, null);
            return true;
        }

        //-----------------------
        // get list components
        // to set the colors
        //----------------------
        else if (property == GetComponents) {
            if (winCurrent == null || winMDI == null)
                ;
            setProperty(pGetWindows, null);
            java.awt.Frame mFrame = formsMain.getFrame();
            Component cp[] = mFrame.getComponents();
            iStatusBar = -1;
            for (int i = 0; i < cp.length; i++) {
                getContainerContent((Container)cp[i]);
            }
            return true;
        }

        else if (property == SetCompProp) {
            String s = value.toString();
            String sType = "";
            String sFontName = null;
            String sFontWeight = null;
            String sFore = null;
            String sBack = null;
            int iW = Font.PLAIN;
            int iSize = 0;
            Font f = null;
            Color cFore = null, cBack = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sType = st.nextToken();
            if (st.hasMoreTokens())
                sFontName = st.nextToken();
            if (st.hasMoreTokens())
                sFontWeight = st.nextToken();
            if (st.hasMoreTokens()) {
                try {
                    iSize = Integer.parseInt(st.nextToken());
                } catch (Exception e) {
                    return false;
                }
            }
            if (st.hasMoreTokens())
                sFore = st.nextToken();
            if (st.hasMoreTokens())
                sBack = st.nextToken();
            if (sFontWeight.equalsIgnoreCase("P"))
                iW = Font.PLAIN;
            else if (sFontWeight.equalsIgnoreCase("B"))
                iW = Font.BOLD;
            else if (sFontWeight.equalsIgnoreCase("I"))
                iW = Font.ITALIC;
            else if (sFontWeight.equalsIgnoreCase("BI"))
                iW = Font.BOLD + Font.ITALIC;
            if (sFontName != null)
                f = new Font(sFontName, iW, iSize);
            if (sFore != null)
                cFore = ik.makeColor(sFore);
            if (sBack != null)
                cBack = ik.makeColor(sBack);
            if (sType.equalsIgnoreCase("TextField"))
                TextField = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("TextArea"))
                TextArea = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("Button"))
                Button = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("CheckBox"))
                CheckBox = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("RadioB"))
                RadioB = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("ComboBox"))
                ComboBox = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("PopList"))
                PopList = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("TList"))
                TList = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("Tree"))
                Tree = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("Window"))
                Window = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("MenuBar"))
                MenuBar = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("MenuOption"))
                MenuOption = new cObj(f, cFore, cBack);
            else if (sType.equalsIgnoreCase("Status"))
                Status = new cObj(f, cFore, cBack);
            //setProperty(GetComponents,null);
            return true;
        }


        // set initial menu colors
        else if (property == setInitMenu) {
            if (MenuBar != null) {
                MenuBar.fFont = InitMenuBar.fFont;
                MenuBar.cFore = InitMenuBar.cFore;
                MenuBar.cBack = InitMenuBar.cBack;
                MenuOption.fFont = InitMenuOption.fFont;
                MenuOption.cFore = InitMenuOption.cFore;
                MenuOption.cBack = InitMenuOption.cBack;
                setProperty(GetComponents, null);
            }
            return true;
        }

        // set initial window colors
        else if (property == setInitWindow) {
            if (Window != null) {
                Window.fFont = InitWindow.fFont;
                Window.cFore = Color.white;
                Window.cBack = InitWindow.cBack;
                setProperty(GetComponents, null);
            }
            return true;
        }

        // set initial status colors
        else if (property == setInitStatus) {
            if (Status != null) {
                Status.fFont = InitStatus.fFont;
                Status.cFore = InitStatus.cFore;
                Status.cBack = InitStatus.cBack;
                setProperty(GetComponents, null);
            }
            return true;
        }

        /*-------------------------*
         * set the gradient colors *
         *-------------------------*/
        else if (property == setGradient) {
            String sColor = value.toString().trim();
            log("SET_GRADIENT:" + sColor);
            String sRGB = "";
            float f = 1.0f;
            StringTokenizer st = new StringTokenizer(sColor, ",");
            try {
                {
                    // start gradient color
                    sRGB = st.nextToken();
                    cBGColor1 = ik.makeColor(sRGB);
                    // end gradient color
                    sRGB = st.nextToken();
                    cBGColor2 = ik.makeColor(sRGB);
                    // transparency value ?
                    if (st.hasMoreTokens()) {
                        try {
                            f = Float.parseFloat(st.nextToken());
                            if (f >= 0.0 && f <= 1.0)
                                gfFrameTransp = f;
                        } catch (Exception ex) {
                            print("setProperty():" + ex.toString());
                            return false;
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
            if (jp != null)
                jp.invalidate();
            return true;
        }
        /*------------------------------*
         * set the text gradient colors *
         *------------------------------*/
        else if (property == setGradientT) {
            String sColor = value.toString().trim();
            log("SET_GRADIENT_TEXT:" + sColor);
            String sRGB = "";
            StringTokenizer st = new StringTokenizer(sColor, ",");
            try {
                // start gradient color
                sRGB = st.nextToken();
                cT1 = ik.makeColor(sRGB);
                // end gradient color
                sRGB = st.nextToken();
                cT2 = ik.makeColor(sRGB);
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
            if (jp != null)
                jp.invalidate();
            return true;
        }

        /*-------------------------*
         *  add a linearGradient   *
         *-------------------------*/
        else if (property == addLinearGradient) {
            String s = value.toString().trim();
            log("ADD_LINEAR_GRADIENT:" + s);
            String sX1 = "", sY1 = "", sX2 = "", sY2 = "";
            String sColors = "", sCoefs = "", sDirection = "UpToRight";
            String sRGB = "";
            Color c1 = null, c2 = null;
            String tCoefs[] = new String[20];
            Color tColors[] = new Color[20];
            tCoefs[0] = "100%";
            tColors[0] = Color.WHITE;
            tColors[1] = Color.BLACK;
            float f = .5f;
            int i = 0;
            StringTokenizer st = new StringTokenizer(s, ",");
            // coordinates
            if (st.hasMoreTokens())
                sX1 = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sY1 = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sX2 = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sY2 = st.nextToken();
            else
                return false;
            // direction
            if (st.hasMoreTokens())
                sDirection = st.nextToken();
            else
                return false;
            // coefficients
            if (st.hasMoreTokens()) {
                sCoefs = st.nextToken();
                StringTokenizer st2 = new StringTokenizer(sCoefs, "-");
                while (st2.hasMoreTokens())
                    tCoefs[i++] = st2.nextToken();
            }
            // colors
            if (st.hasMoreTokens()) {
                i = 0;
                sColors = st.nextToken();
                StringTokenizer st3 = new StringTokenizer(sColors, "-");
                while (st3.hasMoreTokens()) {
                    sRGB = st3.nextToken();
                    c1 = ik.makeColor(sRGB);
                    if (st3.hasMoreTokens()) {
                        sRGB = st3.nextToken();
                        c2 = ik.makeColor(sRGB);
                        tColors[i++] = c1;
                        tColors[i++] = c2;
                    } else {
                        print("(ADD_LINEAR_GRADIENT) Gradient colors must be given by pairs");
                        return false;
                    }
                }
            }
            // transparency value ?
            if (st.hasMoreTokens()) {
                try {
                    f = Float.parseFloat(st.nextToken());
                    if (f >= 0.0 && f <= 1.0)
                        gfFrameTransp = f;
                } catch (Exception ex) {
                    print("setProperty():" + ex.toString());
                    return false;
                }
            }

            try {
                // create the gradient
                LinearGradient lg = new LinearGradient(sX1, sY1, sX2, sY2, sDirection, tCoefs, tColors, f);
                // add the gradient to the list
                list_Lgradients.add(lg);
            } catch (Exception e) {
                print(e.toString());
            }

            return true;
        }

        /*-----------------------------*
         * set the current window icon *
         *-----------------------------*/
        else if (property == setCurrentWindowIcon) {
            String s = value.toString();
            log(property + s);
            if (winCurrent == null)
                setProperty(pGetWindows, null);
            Image img = ik.loadImage(s);
            if (img != null && winCurrent != null)
                winCurrent.setIcon(img);
            return true;
        }

        /*-----------------------------*
         *  set the given window icon  *
         *-----------------------------*/
        else if (property == setWindowIcon) {
            String s = value.toString(), sWin = "", sIcon = "";
            log(property + s);
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sWin = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sIcon = st.nextToken();
            else
                return false;
            objWin obw = (objWin)hWindows.get(sWin);
            if (obw != null) {
                Image img = ik.loadImage(sIcon);
                if (img != null && obw.ef != null) {
                    obw.ef.setIcon(img);
                    obw.ef.repaint();
                }
            }
            return true;
        }

        /*------------------------*
         *  set all windows icon  *
         *------------------------*/
        else if (property == setAllWindowsIcon) {
            String sIcon = value.toString(), str = "";
            log(property + ":" + value);
            Image img = ik.loadImage(sIcon);
            if (img != null) {
                Set set = hWindows.keySet();
                Iterator itr = set.iterator();
                while (itr.hasNext()) {
                    str = (String)itr.next();
                    objWin ow = (objWin)hWindows.get(str);
                    if (ow != null) {
                        ow.ef.setIcon(img);
                    }
                }
            }
            return true;
        }

        /*-------------------------*
         * set the MDI window icon *
         *-------------------------*/
        else if (property == setWinMDIIcon) {
            String s = value.toString();
            log(property + s);
            if (winMDI == null && bSeparateFrame)
                winMDI = (oracle.ewt.swing.JBufferedFrame)formsMain.getFrame();
            Image img = ik.loadImage(s);
            if (img != null)
                formsTopFrame.setIconImage(img);
            return true;
        }

        /*-------------*
         * set the log *
         *-------------*/
        else if (property == setLog) {
            String s = value.toString();
            log(property + s);
            if (s.equalsIgnoreCase("true"))
                bLog = true;
            else
                bLog = false;
            return true;
        }

        /*-------------------*
         * set the paint log *
         *-------------------*/
        else if (property == setLogPaint) {
            String s = value.toString();
            log(property + s);
            if (s.equalsIgnoreCase("true"))
                bLogPaint = true;
            else
                bLogPaint = false;
            return true;
        }

        /*--------------------*
         * set the memory log *
         *--------------------*/
        else if (property == pSetMemoryLog) {
            String s = value.toString();
            log(property + s);
            if (s.equalsIgnoreCase("true"))
                bMemoryLog = true;
            else
                bMemoryLog = false;
            return true;
        }

        /*----------------------------------------*
         * set the menu/widow/status/frame scheme *
         *----------------------------------------*/
        else if (property == setApplyScheme) {
            String s = value.toString(), sComp = "", sFlag = "";
            boolean bFlag = false;
            Color c1 = null, c2 = null;
            log(property + ":" + s);
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sComp = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sFlag = st.nextToken();
            else
                return false;
            if (sFlag.equalsIgnoreCase("true"))
                bFlag = true;
            if (bUseLightColor) {
                c1 = Current_Color.darker();
                c2 = Current_Color_Light;
            } else {
                c1 = Color.white;
                c2 = bOwnerScheme ? Current_Color : Current_Color.darker();
            }
            // menus use color scheme
            if (sComp.equalsIgnoreCase("menu")) {
                bMenuUseScheme = bFlag;
                //MenuBar = new cObj(new Font("Verdana", Font.BOLD, 12), c1, c2);
                //MenuOption = new cObj(new Font("Verdana", Font.BOLD, 12), c1, c2);
                MenuBar = new cObj(null, c1, c2);
                MenuOption = new cObj(null, c1, c2);                
            }
            // window caption uses color scheme
            else if (sComp.equalsIgnoreCase("window")) {
                bWindowUseScheme = bFlag;
                //Window = new cObj(new Font("Verdana", Font.BOLD, 14), c1, c2);
                Window = new cObj(null, c1, c2);
            }
            // status bar uses color scheme
            else if (sComp.equalsIgnoreCase("status")) {
                bStatusUseScheme = bFlag;
                //Status = new cObj(new Font("Verdana", Font.BOLD, 12), c1, c2);
                Status = new cObj(null, c1, c2);
            }
            // input dialogs use color scheme
            else if (sComp.equalsIgnoreCase("dialog")) {
                bDialogUseScheme = bFlag;
                //cDialogFore = bOwnerScheme ? Current_Color : Current_Color.darker();
                //cDialogBack = bOwnerScheme ? Current_Color_Light : Current_Color.brighter();
                cDialogFore = Current_Color;
                cDialogBack = Current_Color_Light;     
            }
            // frames use color scheme
            else if (sComp.equalsIgnoreCase("frame")) {
                bFrameUseScheme = bFlag;
                gcFrameColor = bOwnerScheme ? Current_Color : Current_Color.darker();
                gcFrameShadow = bOwnerScheme ? Current_Color_Light : Current_Color.brighter();
                gcFrameTitleFore = bOwnerScheme ? Current_Color : Current_Color.darker();
            }
            // tabs use color scheme
            else if (sComp.equalsIgnoreCase("tab")) {
                bTabUseScheme = bFlag;
                if (bFlag) {
                    gcTabForeColor = bOwnerScheme ? Current_Color : Color.black; //Current_Color.darker();
                    gcTabBackColor = bOwnerScheme ? Current_Color_Light : Current_Color_Light;
                    gcTabSelBackColor = bOwnerScheme ? Current_Color : Current_Color.darker();
                    gcTabSelForeColor = bOwnerScheme ? Current_Color_Light : Current_Color;
                } else {
                    gcTabForeColor = null;
                    gcTabBackColor = null;
                    gcTabSelForeColor = null;
                    gcTabSelBackColor = null;
                }
                Set set = hTabs.keySet();
                Iterator itr = set.iterator();
                while (itr.hasNext()) {
                    s = (String)itr.next();
                    objTab ot = (objTab)hTabs.get(s);
                    if (ot != null) {
                        if (bFlag) {
                            ot.setTabColors(gcTabForeColor, gcTabBackColor);
                            ot.setTabSelColors(gcTabSelForeColor, gcTabSelBackColor);
                        } else
                            ot.setInitialColors();
                        hTabs.put(s, ot);
                    }
                }
                setProperty(GetComponents, null);
            }
            // use light color scheme
            else if (sComp.equalsIgnoreCase("light")) {
                bUseLightColor = bFlag;
            }
            return true;
        }

        /*------------------------*
         * set the current scheme *
         *------------------------*/
        else if (property == setScheme) {
            Color c1 = null, c2 = null;
            setScheme(value.toString().trim());
            bOwnerScheme = false ;

            if (bUseLightColor) {
                c1 = Current_Color.darker();
                c2 = Current_Color_Light;
            } else {
                c1 = Color.white;
                c2 = bOwnerScheme ? Current_Color : Current_Color.darker();
            }

            // default scheme menu and status bar properties
            if (bMenuUseScheme) {
                MenuBar = new cObj(new Font("Verdana", Font.BOLD, 12), c1, c2);
                MenuOption = new cObj(new Font("Verdana", Font.BOLD, 12), c1, c2);
            }
            if (bWindowUseScheme)
                Window = new cObj(new Font("Verdana", Font.PLAIN, 12), c1, c2);
            if (bStatusUseScheme)
                Status = new cObj(new Font("Verdana", Font.BOLD, 12), c1, c2);
            if (bDialogUseScheme) {
                cDialogFore = bOwnerScheme ? Current_Color : Current_Color.darker();
                cDialogBack = Current_Color_Light;
            }

            // frames use color scheme ?
            if (bFrameUseScheme) {
                gcFrameColor = bOwnerScheme ? Current_Color : Current_Color.darker();
                gcFrameShadow = Current_Color_Light;
                gcFrameTitleFore = bOwnerScheme ? Current_Color : Current_Color.darker();
                String str = "";
                Set set = hFrames.keySet();
                Iterator itr = set.iterator();
                while (itr.hasNext()) {
                    str = (String)itr.next();
                    objFrame of = (objFrame)hFrames.get(str);
                    if (of != null) {
                        of.setFrameColors(gcFrameColor, gcFrameShadow);
                        of.setFrameTitleColors(gcFrameTitleFore, null);
                        hFrames.put(str, of);
                    }
                }
            }

            // re-colorize GUIs items
            setProperty(GetComponents, value);

            log("SET_SCHEME final color:" + Current_Color);
            if (jp != null)
                jp.invalidate();
            return true;
        }


        /*-------------------------------*
         * set the current scheme colors *
         *-------------------------------*/
        else if (property == setSchemeColors) {
            String s = value.toString().trim().toLowerCase();
            String sColor = null, sKey = null;
            Color color = null;
            int iPos = 0;
            bOwnerScheme = true ;
            StringTokenizer st = new StringTokenizer(s, ",");
            /* list of attended colors
                color         dark color
                color_light   light color
                select        selection mark (button, checkbox, radio button)
                focus         item focus color
                disable       item disable color
                tlistselect   TList selected value color
            */
            if (st.hasMoreTokens()) {
                while (st.hasMoreTokens()) {
                    sColor = st.nextToken();
                    // find keyword
                    iPos = sColor.indexOf("=");
                    if (iPos > -1) {
                        try {
                            sKey = sColor.substring(0, iPos);
                            sColor = sColor.substring(iPos + 1);
                            color = ik.makeColor(sColor);
                            if (sKey.equalsIgnoreCase("color"))
                                Current_Color = color;
                            else if (sKey.equalsIgnoreCase("color_light"))
                                Current_Color_Light = color;
                            else if (sKey.equalsIgnoreCase("select"))
                                cSelect = color;
                            else if (sKey.equalsIgnoreCase("focus"))
                                cFocus = color;
                            else if (sKey.equalsIgnoreCase("disable"))
                                cDisable = color;
                            else if (sKey.equalsIgnoreCase("listselect"))
                                cListSelect = color;
                        } catch (Exception ex) {
                            print("SET_SCHEME_COLORS incorrect key=color: " + sColor);
                        }
                    }
                }
            }
            return true;
        }

        /*-----------------------------*
         * set the gradient direction
         *-----------------------------*/
        else if (property == setDirection) {
            String s = value.toString().trim();
            if (s.equalsIgnoreCase("LeftToRight"))
                iDirection = 1;
            else if (s.equalsIgnoreCase("UpToDown"))
                iDirection = 2;
            else if (s.equalsIgnoreCase("LeftUpToRightDown"))
                iDirection = 3;
            else if (s.equalsIgnoreCase("LeftDownToRightUp"))
                iDirection = 4;

            if (jp != null)
                jp.invalidate();
            return true;
        }

        /*--------------------------*
         * set the horizontal cycle
         *--------------------------*/
        else if (property == setHCycle) {
            String s = value.toString().trim();
            log("SET_H_CYCLE:" + s);
            int i = 0;
            if (s.startsWith("/")) {
                try {
                    i = Integer.parseInt(s.substring(1));
                    iHcycle = iW / i;
                } catch (Exception e) {
                    return false;
                }
            } else {
                try {
                    i = Integer.parseInt(s);
                    iHcycle = i;
                } catch (Exception e) {
                    return false;
                }
            }
            if (jp != null)
                jp.invalidate();
            return true;
        }

        /*--------------------------*
         *  set the vertical cycle
         *--------------------------*/
        else if (property == setVCycle) {
            String s = value.toString().trim();
            log("SET_V_CYCLE:" + s);
            int i = 0;
            if (s.startsWith("/")) {
                try {
                    i = Integer.parseInt(s.substring(1));
                    iVcycle = iH / i;
                } catch (Exception e) {
                    return false;
                }
            } else {
                try {
                    i = Integer.parseInt(s);
                    iVcycle = i;
                } catch (Exception e) {
                    return false;
                }
            }
            if (jp != null)
                jp.invalidate();
            return true;
        }
        
        /*---------------------*
         *  remove a graphic
         *---------------------*/
        else if (property == removeGraphic) {
            String s = value.toString();
            String sShape = null, sName = null ;
            int iNum=0;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                sShape = st.nextToken();
                if( !sShape.equalsIgnoreCase("line") &&
                    !sShape.equalsIgnoreCase("rect") &&
                    !sShape.equalsIgnoreCase("shape") &&                    
                    !sShape.equalsIgnoreCase("ellipse") && 
                    !sShape.equalsIgnoreCase("image") && 
                    !sShape.equalsIgnoreCase("text")
                ){
                    print("REMOVE_GRAPHIC() shape must be LINE, RECT, SHAPE, ELLIPSE, IMAGE or TEXT");
                    return false;
                }
            }
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            }    
            else {
                print("REMOVE_GRAPHIC() graphic ID must be given");
                    return false;
            }
            // find the graphic ?
            int iIndex = 0;
            for (int i = 0; i < list_objects.size(); i++) {
                Typ_Objects to = (Typ_Objects)list_objects.get(i);
                if(to != null){
                    if(to.sName.equalsIgnoreCase(sName)){
                        // found
                        list_objects.remove(to);
                        if(sShape.equalsIgnoreCase("line")){
                            list_lines.remove(sName);
                            iLines--;
                        }
                        else if(sShape.equalsIgnoreCase("rect")){
                            list_rects.remove(sName);
                            iRects--;
                        }
                        else if(sShape.equalsIgnoreCase("ellipse")){
                            list_circles.remove(sName);
                            iEllipses--;
                        }                           
                        else if(sShape.equalsIgnoreCase("shape")){
                            list_polys.remove(sName);
                            iShapes--;
                        }
                        else if(sShape.equalsIgnoreCase("text")){
                            list_texts.remove(sName);
                            iTexts--;
                        }    
                        else if(sShape.equalsIgnoreCase("image")){
                            for (int j = 0; j < list_images.size(); j++) {
                                Images img = (Images)list_images.get(j);
                                if(img != null){
                                    if(img.sPos.equalsIgnoreCase(sName)){
                                        list_images.remove(img);
                                        iImgs--;
                                    }
                                }
                            }
                        }                             
                        this.repaint();
                        return true ;
                    }
                }
            }
            log("REMOVE_GRAPHIC item not found:"+sName);
            return true ;
        }    
        /*---------------------*
         *  remove all lines
         *---------------------*/
        else if (property == removeLines) {
            list_lines.clear();
            iLines = -1;
            for (int i = list_objects.size()-1; i >= 0 ; i--) {
                Typ_Objects to = (Typ_Objects)list_objects.get(i);
                if(to != null){
                    if(to.iType == 1){
                        list_objects.remove(to);
                    }
                }
            }
            return true ;
        }    
        /*---------------------*
         *  remove all rects
         *---------------------*/
        else if (property == removeRects) {
            list_rects.clear();
            iRects = -1;
            for (int i = list_objects.size()-1; i >= 0 ; i--) {
                Typ_Objects to = (Typ_Objects)list_objects.get(i);
                if(to != null){
                    if(to.iType == 2){
                        list_objects.remove(to);
                    }
                }
            }
            return true ;
        }
        /*---------------------*
         *  remove all ellipses
         *---------------------*/
        else if (property == removeEllipses) {
            list_circles.clear();
            iEllipses = -1;
            for (int i = list_objects.size()-1; i >= 0 ; i--) {
                Typ_Objects to = (Typ_Objects)list_objects.get(i);
                if(to != null){
                    if(to.iType == 4){
                        list_objects.remove(to);
                    }
                }
            }
            return true ;
        }           
        /*---------------------*
         *  remove all shapes
         *---------------------*/
        else if (property == removeShapes) {
            list_polys.clear();
            iShapes = -1;
            for (int i = list_objects.size()-1; i >= 0 ; i--) {
                Typ_Objects to = (Typ_Objects)list_objects.get(i);
                if(to != null){
                    if(to.iType == 3){
                        list_objects.remove(to);
                    }
                }
            }
            return true ;
        } 
        /*---------------------*
         *  remove all texts
         *---------------------*/
        else if (property == removeTexts) {
            list_texts.clear();
            iTexts = -1;
            for (int i = list_objects.size()-1; i >= 0 ; i--) {
                Typ_Objects to = (Typ_Objects)list_objects.get(i);
                if(to != null){
                    if(to.iType == 9){
                        list_objects.remove(to);
                    }
                }
            }
            return true ;
        }            
        
        else if (property == addShape) {
            log(property + ":" + value);
            String s = value.toString().trim();
            String sShape = null, sID=null, se=null;
            int iX=0, iY=0;
            int iPos = -1;
            float f = 1.0f;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                sID = st.nextToken();
            }                   
            if (st.hasMoreTokens()) {
                sShape = st.nextToken();
            }
            if (st.hasMoreTokens()) {
                se = st.nextToken();
                try {
                    iX = Integer.parseInt(se);
                } catch (NumberFormatException nfe) {
                    print("ADD_SHAPE() wrong X Pos number");
                    return false;
                }
            } 
            if (st.hasMoreTokens()) {
                se = st.nextToken();
                try {
                    iY = Integer.parseInt(se);
                } catch (NumberFormatException nfe) {
                    print("ADD_SHAPE() wrong Y Pos number");
                    return false;
                }
            }    
            if (st.hasMoreTokens()) {
                se = st.nextToken();
                try {
                    f = Float.parseFloat(se);
                } catch (NumberFormatException nfe) {
                    print("ADD_SHAPE() wrong transparency factor. must be between 0.0 and 1.0");
                }
            }              
            TexturePaint tp = (TexturePaint)hTextures.get(sShape);
            if(tp == null){            
                print("ADD_SHAPE shape must have been created before with ADD_TEXTTUREPAINT()");
                return false;
            }
            iPos = ++iShapes;
            // shape already exist ?
            Poly poly = (Poly)list_polys.get(sID);
            if(poly != null){
                sID += iPos ;
            }
            poly = new Poly(sShape,iPos,iX,iY,f);
            list_polys.put(sID,poly);
            Typ_Objects to = new Typ_Objects(sID,iPos,3);
            list_objects.add(to);
            return true ;
        }                

        /*---------------*
         *   Add a line
         *---------------*/
        else if (property == addLine) {
            log(property + ":" + value);
            int iPos = -1, iX1 = -1, iY1 = -1, iX2 = -1, iY2 = -1;
            int iWidth = 1;
            int iCap = BasicStroke.CAP_SQUARE;
            int iJoin = BasicStroke.JOIN_MITER;
            int iDash1 = 0;
            int iDash2 = 0;
            float f = 1.0f;
            String sID=null;
            String sTemp = "";
            Color c = Color.white;
            ;
            String sRGB = "255,255,255";
            String s = value.toString().trim();
            Point pStart = null, pEnd = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                try {
                    //iPos = Integer.parseInt(st.nextToken());
                    sID = st.nextToken();
                    if (st.hasMoreTokens())
                        iX1 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iY1 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iX2 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iY2 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iWidth = Integer.parseInt(st.nextToken());
                    // line color
                    if (st.hasMoreTokens()) {
                        sRGB = st.nextToken();
                        if (!sRGB.equalsIgnoreCase("-"))
                            c = ik.makeColor(sRGB);
                    }
                    // transparancy
                    if (st.hasMoreTokens()) {
                        try {
                            f = Float.parseFloat(st.nextToken());
                            if (f < 0.0)
                                f = 0.0f;
                            if (f > 1.0)
                                f = 1.0f;
                        } catch (Exception ex) {
                            print("setProperty():" + ex.toString());
                            return false;
                        }
                    }
                    // end style
                    if (st.hasMoreTokens()) {
                        sTemp = st.nextToken();
                        if (sTemp.equalsIgnoreCase("BUTT"))
                            iCap = BasicStroke.CAP_BUTT;
                        else if (sTemp.equalsIgnoreCase("ROUND"))
                            iCap = BasicStroke.CAP_ROUND;
                        else if (sTemp.equalsIgnoreCase("SQUARE"))
                            iCap = BasicStroke.CAP_SQUARE;
                    }
                    // join style
                    if (st.hasMoreTokens()) {
                        sTemp = st.nextToken();
                        if (sTemp.equalsIgnoreCase("BEVEL"))
                            iJoin = BasicStroke.JOIN_BEVEL;
                        else if (sTemp.equalsIgnoreCase("ROUND"))
                            iJoin = BasicStroke.JOIN_ROUND;
                        else if (sTemp.equalsIgnoreCase("MITER"))
                            iJoin = BasicStroke.JOIN_MITER;
                    }
                    try {
                        if (st.hasMoreTokens())
                            iDash1 = Integer.parseInt(st.nextToken());
                        if (st.hasMoreTokens())
                            iDash2 = Integer.parseInt(st.nextToken());
                    } catch (Exception e) {
                        return false;
                    }
                } catch (Exception e) {
                    print("addLine ERROR :" + e.toString());
                }
                if (iX1 > -1 && iY1 > -1 && iX2 > -1 && iY2 > -1) {
                    pStart = new Point(iX1, iY1);
                    pEnd = new Point(iX2, iY2);
                    iPos = ++iLines;
                    // line already exist ?
                    Line ln = (Line)list_lines.get(sID);
                    if(ln != null){
                        sID += iPos ;
                    }
                    ln = new Line(iPos, pStart, pEnd, iWidth, c, f, iCap, iJoin, iDash1, iDash2);
                    list_lines.put(sID,ln);
                    Typ_Objects to = new Typ_Objects(sID,iPos, 1);
                    list_objects.add(to);
                }
            }
            return true;
        }

        /*-------------------*
         *  add a rectangle
         *-------------------*/
        else if (property == addRect) {
            String s = value.toString().trim();
            log("addRect()=" + s);
            int iPos = -1, iX1 = -1, iY1 = -1, iX2 = -1, iY2 = -1;
            int iWidth = 1, iRound = 0;
            float f = 1.0f;
            Color cframe = Color.black;
            Color cinside = null;
            Color cStart = null, cEnd = null, cShade = null;
            String sRGB = "255,255,255";
            String sDirection = "";
            String sPaint = null;
            String sID=null;
            int iDir = 1;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                try {
                    sID = st.nextToken();
                    if (st.hasMoreTokens())
                        iX1 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iY1 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iX2 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iY2 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iWidth = Integer.parseInt(st.nextToken());
                } catch (Exception e) {
                    print("ADD_RECT exception: "+e.toString());
                    return false;
                }
                // frame color
                if (st.hasMoreTokens()) {
                    sRGB = st.nextToken();
                    if (!sRGB.equalsIgnoreCase("-"))
                        cframe = ik.makeColor(sRGB);
                }
                // frame inside color transparancy
                if (st.hasMoreTokens()) {
                    try {
                        f = Float.parseFloat(st.nextToken());
                        if (f < 0.0)
                            f = 0.0f;
                        if (f > 1.0)
                            f = 1.0f;
                    } catch (Exception ex) {
                        print("setProperty():" + ex.toString());
                        return false;
                    }
                }
                // frame inside color
                if (st.hasMoreTokens()) {
                    sRGB = st.nextToken();
                    if (!sRGB.equalsIgnoreCase("-"))
                        cinside = ik.makeColor(sRGB);
                }
                // frame shade color
                if (st.hasMoreTokens()) {
                    sRGB = st.nextToken();
                    if (!sRGB.equalsIgnoreCase("-"))
                        cShade = ik.makeColor(sRGB);
                }
                // gradient start
                if (st.hasMoreTokens()) {
                    sRGB = st.nextToken();
                    if (!sRGB.equalsIgnoreCase("-"))
                        cStart = ik.makeColor(sRGB);
                }
                // gradient end
                if (st.hasMoreTokens()) {
                    sRGB = st.nextToken();
                    if (!sRGB.equalsIgnoreCase("-"))
                        cEnd = ik.makeColor(sRGB);
                }
                // gradient direction
                if (st.hasMoreTokens()) {
                    sDirection = st.nextToken();
                    if (sDirection.equalsIgnoreCase("uptodown"))
                        iDir = 2;
                }
                // rounded factor
                if (st.hasMoreTokens()) {
                    sRGB = st.nextToken();
                    if (!sRGB.equalsIgnoreCase("-")) {
                        try {
                            iRound = Integer.parseInt(sRGB);
                        } catch (Exception e) {
                            return false;
                        }
                    }
                }
                // paint motif ?
                if (st.hasMoreTokens()) {
                    sPaint = st.nextToken();
                }
                if (iX1 > -1 && iY1 > -1 && iX2 > -1 && iY2 > -1) {
                    iPos = ++iRects;
                    // rect already exist ?
                    Rect rt = (Rect)list_rects.get(sID);
                    if(rt != null){
                        sID += iPos ;
                    }
                    rt =
                        new Rect(iPos, iX1, iY1, iX2, iY2, iWidth, cframe, f, cinside, cShade, cStart, cEnd, iDir,
                                 iRound, sPaint);
                    list_rects.put(sID,rt);
                    Typ_Objects to = new Typ_Objects(sID,iPos, 2);
                    list_objects.add(to);
                }
            }
            return true;
        }

        /*-------------------*
         *  add an elipse
         *-------------------*/
        else if (property == addEllipse) {
            String s = value.toString().trim();
            log("addElipse()=" + s);
            int iPos = -1, iX1 = -1, iY1 = -1, iX2 = -1, iY2 = -1;
            int iWidth = 1, iRound = 0;
            float f = 1.0f;
            Color cframe = Color.black;
            Color cinside = null;
            Color cStart = null, cEnd = null, cShade = null;
            String sRGB = "255,255,255";
            String sDirection = "";
            String sPaint = null;
            String sID=null;
            int iDir = 1;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                try {
                    sID = st.nextToken();
                    if (st.hasMoreTokens())
                        iX1 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iY1 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iX2 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iY2 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iWidth = Integer.parseInt(st.nextToken());
                } catch (Exception e) {
                    print("ADD_ELIPSE exception: "+e.toString());
                    return false;
                }
                // frame color
                if (st.hasMoreTokens()) {
                    sRGB = st.nextToken();
                    if (!sRGB.equalsIgnoreCase("-"))
                        cframe = ik.makeColor(sRGB);
                }
                // frame inside color transparancy
                if (st.hasMoreTokens()) {
                    try {
                        f = Float.parseFloat(st.nextToken());
                        if (f < 0.0)
                            f = 0.0f;
                        if (f > 1.0)
                            f = 1.0f;
                    } catch (Exception ex) {
                        print("setProperty():" + ex.toString());
                        return false;
                    }
                }
                // frame inside color
                if (st.hasMoreTokens()) {
                    sRGB = st.nextToken();
                    if (!sRGB.equalsIgnoreCase("-"))
                        cinside = ik.makeColor(sRGB);
                }
                // frame shade color
                if (st.hasMoreTokens()) {
                    sRGB = st.nextToken();
                    if (!sRGB.equalsIgnoreCase("-"))
                        cShade = ik.makeColor(sRGB);
                }
                // gradient start
                if (st.hasMoreTokens()) {
                    sRGB = st.nextToken();
                    if (!sRGB.equalsIgnoreCase("-"))
                        cStart = ik.makeColor(sRGB);
                }
                // gradient end
                if (st.hasMoreTokens()) {
                    sRGB = st.nextToken();
                    if (!sRGB.equalsIgnoreCase("-"))
                        cEnd = ik.makeColor(sRGB);
                }
                // gradient direction
                if (st.hasMoreTokens()) {
                    sDirection = st.nextToken();
                    if (sDirection.equalsIgnoreCase("uptodown"))
                        iDir = 2;
                }
                // paint motif ?
                if (st.hasMoreTokens()) {
                    sPaint = st.nextToken();
                }
                if (iX1 > -1 && iY1 > -1 && iX2 > -1 && iY2 > -1) {
                    iPos = ++iEllipses;
                    // elipse already exist ?
                    Ellipse rt = (Ellipse)list_circles.get(sID);
                    if(rt != null){
                        sID += iPos ;
                    }
                    rt = new Ellipse(iPos, iX1, iY1, iX2, iY2, iWidth, cframe, f, cinside, cShade, cStart, cEnd, iDir, sPaint);
                    list_circles.put(sID,rt);
                    Typ_Objects to = new Typ_Objects(sID,iPos, 4);
                    list_objects.add(to);
                }
            }
            return true;
        }

        /*---------------*
         *  Add an image
         *---------------*/
        else if (property == addImage) {
            int iPos = -1, iX1 = -1, iY1 = -1, iWidth = 0, iHeight = 0;
            Color color = Color.black;
            String sName = "", sValue = null, s2 = "", sID = "";
            boolean bSensitive = false;
            boolean bMirror = false;
            String s = value.toString().trim();
            Point point = null;
            Images img = null;
            float fTransparency = 1.0f;
            int posW = 1, posH = 1, iNbr = 0;
            String sNbr = "";
            String[] sWidth = new String[10];
            String[] sHeight = new String[10];
            sWidth[0] = "+";
            sHeight[0] = "+";
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {

                sID = st.nextToken();
                // check if image not already loaded
                for (int j = 0; j < list_images.size(); j++) {
                    img = (Images)list_images.get(j);
                    if(img != null){
                        if(img.sPos.equalsIgnoreCase(sID)){
                            System.out.println("DrawLAF error: Image: "+sID+" already loaded");
                            return false;
                        }
                    }
                }
                if (st.hasMoreTokens())
                    sName = st.nextToken();
                if (st.hasMoreTokens()) {
                    // X position
                    posW = 1;
                    iNbr = 0;
                    sNbr = "";
                    sWidth = new String[10];
                    sWidth[0] = "+";
                    s2 = st.nextToken();
                    while (s2.length() > 0) {
                        if (split(s2, 0, 12, "IMAGEWIDTH/2")) {
                            if (iNbr == 1) {
                                sWidth[posW++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sWidth[posW++] = "W/2";
                            s2 = s2.substring(12);
                        } else if (split(s2, 0, 10, "IMAGEWIDTH")) {
                            if (iNbr == 1) {
                                sWidth[posW++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sWidth[posW++] = "W";
                            s2 = s2.substring(10);
                        } else if (split(s2, 0, 4, "LEFT")) {
                            if (iNbr == 1) {
                                sWidth[posW++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sWidth[posW++] = "1";
                            s2 = s2.substring(4);
                        } else if (split(s2, 0, 6, "CENTER")) {
                            if (iNbr == 1) {
                                sWidth[posW++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            //(String)getParent().getSize().width  / 2 ;
                            int ii = getParent().getSize().width / 2;
                            sWidth[posW++] = Integer.toString(ii);
                            s2 = s2.substring(6);
                        } else if (split(s2, 0, 5, "RIGHT")) {
                            if (iNbr == 1) {
                                sWidth[posW++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            int ii = getParent().getSize().width;
                            sWidth[posW++] = Integer.toString(ii);
                            s2 = s2.substring(5);
                        } else if (split(s2, 0, 1, "-")) {
                            if (iNbr == 1) {
                                sWidth[posW++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sWidth[posW++] = "-";
                            s2 = s2.substring(1);
                        } else if (split(s2, 0, 1, "+")) {
                            if (iNbr == 1) {
                                sWidth[posW++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sWidth[posW++] = "+";
                            s2 = s2.substring(1);
                        } else if (split(s2, 0, 1, "/")) {
                            if (iNbr == 1) {
                                sWidth[posW++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sWidth[posW++] = "/";
                            s2 = s2.substring(1);
                        } else {
                            // number ?
                            int iChar = s2.charAt(0);
                            if ((iChar >= 48) && (iChar <= 57)) {
                                iNbr = 1;
                                sNbr += s2.substring(0, 1);
                                s2 = s2.substring(1);
                            } else {
                                print("addImage() X position : unrecognized keyword (" + s2 + ")");
                                return false;
                            }
                        }

                    }
                    if (iNbr == 1)
                        sWidth[posW++] = sNbr;
                    iX1 = 1;
                }
                if (st.hasMoreTokens()) {
                    // Y position
                    posH = 1;
                    iNbr = 0;
                    sNbr = "";
                    sHeight = new String[10];
                    sHeight[0] = "+";
                    s2 = st.nextToken();
                    while (s2.length() > 0) {
                        if (split(s2, 0, 13, "IMAGEHEIGHT/2")) {
                            if (iNbr == 1) {
                                sHeight[posH++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sHeight[posH++] = "H/2";
                            s2 = s2.substring(13);
                        } else if (split(s2, 0, 11, "IMAGEHEIGHT")) {
                            if (iNbr == 1) {
                                sHeight[posH++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sHeight[posH++] = "H";
                            s2 = s2.substring(11);
                        } else if (split(s2, 0, 3, "TOP")) {
                            if (iNbr == 1) {
                                sHeight[posH++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sHeight[posH++] = "1";
                            s2 = s2.substring(3);
                        } else if (split(s2, 0, 6, "CENTER")) {
                            if (iNbr == 1) {
                                sHeight[posH++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            int ii = getParent().getSize().height / 2;
                            sHeight[posH++] = Integer.toString(ii);
                            s2 = s2.substring(6);
                        } else if (split(s2, 0, 6, "BOTTOM")) {
                            if (iNbr == 1) {
                                sHeight[posH++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            int ii = getParent().getSize().height;
                            sHeight[posH++] = Integer.toString(ii);
                            s2 = s2.substring(6);
                        } else if (split(s2, 0, 1, "-")) {
                            if (iNbr == 1) {
                                sHeight[posH++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sHeight[posH++] = "-";
                            s2 = s2.substring(1);
                        } else if (split(s2, 0, 1, "+")) {
                            if (iNbr == 1) {
                                sHeight[posH++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sHeight[posH++] = "+";
                            s2 = s2.substring(1);
                        } else if (split(s2, 0, 1, "/")) {
                            if (iNbr == 1) {
                                sHeight[posH++] = sNbr;
                                sNbr = "";
                                iNbr = 0;
                            }
                            sHeight[posH++] = "/";
                            s2 = s2.substring(1);
                        } else {
                            // number ?
                            int iChar = s2.charAt(0);
                            if ((iChar >= 48) && (iChar <= 57)) {
                                iNbr = 1;
                                sNbr += s2.substring(0, 1);
                                s2 = s2.substring(1);
                            } else {
                                print("addImage() Y position : unrecognized keyword (" + s2 + ")");
                                return false;
                            }
                        }

                    }
                    if (iNbr == 1)
                        sHeight[posH++] = sNbr;
                    iY1 = 1;
                }
                // transparency
                if (st.hasMoreTokens()) {
                    s2 = st.nextToken();
                    if (!s2.equalsIgnoreCase("-")) {
                        try {
                            fTransparency = Float.parseFloat(s2);
                            if (fTransparency < 0.0)
                                fTransparency = 0.0f;
                            if (fTransparency > 1.0)
                                fTransparency = 1.0f;
                        } catch (Exception ex) {
                            print("setProperty():" + ex.toString());
                            return false;
                        }
                    }
                }
                // image width
                if (st.hasMoreTokens()) {
                    s2 = st.nextToken();
                    if (!s2.equalsIgnoreCase("-")) {
                        try {
                            iWidth = Integer.parseInt(s2);
                        } catch (Exception e) {
                            return false;
                        }
                    }
                }
                // image height
                if (st.hasMoreTokens()) {
                    s2 = st.nextToken();
                    if (!s2.equalsIgnoreCase("-")) {
                        try {
                            iHeight = Integer.parseInt(s2);
                        } catch (Exception e) {
                            return false;
                        }
                    }

                }
                // image name (sensitive image)
                if (st.hasMoreTokens()) {
                    String s4 = st.nextToken();
                    if (!s4.equalsIgnoreCase("-"))
                        sValue = s4;
                }

                // use mirror
                if (st.hasMoreTokens()) {
                    String s5 = st.nextToken();
                    if (s5.equalsIgnoreCase("true"))
                        bMirror = true;
                }

                if (iX1 > -1) {
                    if (fTransparency < 0.0f && fTransparency > 1.0f)
                        fTransparency = 1.0f;
                    point = new Point(iX1, iY1);
                    if (iWidth != 0 && iHeight != 0) {
                        Rectangle r = new Rectangle(iX1, iY1, iWidth, iHeight);
                        img = new Images(sID, sName, r, fTransparency, sValue, bMirror);
                    } else
                        img = new Images(sID, sName, point, fTransparency, iWidth, color, sValue, bMirror);

                    if (img.img != null) {
                        int iStartW = 0, iStartH = 0, iNb = 0;
                        String sign = "";
                        String sVal = "";
                        // final X position
                        for (int z = 0; z < posW; z += 2) {
                            sign = sWidth[z];
                            sVal = sWidth[z + 1];
                            if (sVal.equalsIgnoreCase("W"))
                                iNb = img.iImgWidth;
                            else if (sVal.equalsIgnoreCase("W/2"))
                                iNb = img.iImgWidth / 2;
                            else {
                                try {
                                    iNb = Integer.parseInt(sVal);
                                } catch (Exception ex) {
                                    ;
                                }
                            }
                            if (sign.equalsIgnoreCase("+"))
                                iStartW += iNb;
                            else if (sign.equalsIgnoreCase("-"))
                                iStartW -= iNb;
                        }
                        // final Y position
                        iNb = 0;
                        sign = "";
                        sVal = "";
                        for (int z = 0; z < posH; z += 2) {
                            sign = sHeight[z];
                            sVal = sHeight[z + 1];
                            if (sVal.equalsIgnoreCase("H"))
                                iNb = img.iImgHeight;
                            else if (sVal.equalsIgnoreCase("H/2"))
                                iNb = img.iImgHeight / 2;
                            else {
                                try {
                                    iNb = Integer.parseInt(sVal);
                                } catch (Exception ex) {
                                    ;
                                }
                            }
                            if (sign.equalsIgnoreCase("+"))
                                iStartH += iNb;
                            else if (sign.equalsIgnoreCase("-"))
                                iStartH -= iNb;
                        }
                        img.iX1 = iStartW;
                        img.iY1 = iStartH;
                        if (sValue != null) {
                            if (img.jb != null) {
                                Rectangle r = img.jb.getBounds();
                                img.jb.setBounds(img.iX1, img.iY1, r.width, r.height);
                                img.jb.setLocation(img.iX1, img.iY1);
                            }
                        }
                    }
                    String sN = "image"+iPos ;
                    iPos = ++iImgs;
                    list_images.add(img);
                    Typ_Objects to = new Typ_Objects(sID,iPos, 10);
                    list_objects.add(to);
                    this.repaint();
                }
            }
            return true;
        }

        /*------------------------------*
         *  Refresh the windows content
         *------------------------------*/
        else if (property == refresh) {
            // refresh all windows
            int iWait = 300;
            try {
                if (value != null)
                    iWait = Integer.parseInt((String)value);
            } catch (Exception e1) {
                iWait = 300;
            }
            if (iWait < 50 || iWait > 2000)
                iWait = 300;
            log("refresh() wait for:" + iWait + " milliseconds");
            for (Enumeration e = formsMain.getDesktop().getWindows(); e.hasMoreElements(); ) {
                Object obj = e.nextElement();
                if (obj.getClass().toString().equalsIgnoreCase("class oracle.forms.ui.ExtendedFrame")) {
                    oracle.forms.ui.ExtendedFrame ef = (oracle.forms.ui.ExtendedFrame)obj;
                    ef.setLocation((int)ef.getLocation().getX() + 1, (int)ef.getLocation().getY() + 1);
                    ef.setLocation((int)ef.getLocation().getX() - 1, (int)ef.getLocation().getY() - 1);
                    try {
                        Thread.sleep(iWait);
                    } catch (Exception ex) {
                        ;
                    }
                    ef.repaint();
                }
            }
            // MDI window
            formsMain.getFrame().repaint();
            return true;
        }

        /*--------------*
         *  Add a text
         *--------------*/
        else if (property == addText) {
            String s = value.toString().trim();
            log("addText()" + s);
            int iPos = -1, iX1 = -1, iY1 = -1;
            String sLabel = "";
            String sID=null;
            String sName = null;
            String sFont = "", sColor = "r0g0b0", sFType = "";
            String sImage = null;
            String sPaint = null;
            String sScale = null;
            int iFType = Font.PLAIN;
            int iSize = 8;
            int iOut = 1;
            int iBoxX = 0, iBoxY = 0;
            int iJust = 0;
            boolean bGradient = false;
            Font font = new Font("Arial", Font.PLAIN, 8);
            Color color = Color.black, cOut2 = null;
            float f = 1.0f, fRotate = 0.0f;
            float fScaleX = 1.0f, fScaleY = 1.0f;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                try {
                    sID = st.nextToken();
                    if (st.hasMoreTokens())
                        sLabel = st.nextToken();
                    if (st.hasMoreTokens())
                        iX1 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iY1 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        sFont = st.nextToken();
                    if (st.hasMoreTokens())
                        sFType = st.nextToken();
                    if (st.hasMoreTokens())
                        iSize = Integer.parseInt(st.nextToken());
                } catch (Exception e) {
                    return false;
                }
                // gradient
                if (st.hasMoreTokens()) {
                    sColor = st.nextToken();
                    if (sColor.equalsIgnoreCase("G"))
                        bGradient = true;
                    else if (!sColor.equalsIgnoreCase("-"))
                        color = ik.makeColor(sColor);
                }
                // transparency factor
                if (st.hasMoreTokens()) {
                    try {
                        f = Float.parseFloat(st.nextToken());
                        if (f < 0.0)
                            f = 0.0f;
                        if (f > 1.0)
                            f = 1.0f;
                    } catch (Exception ex) {
                        print("setProperty():" + ex.toString());
                        return false;
                    }
                }
                if (sFType.equalsIgnoreCase("bold"))
                    iFType = Font.BOLD;
                else if (sFType.equalsIgnoreCase("plain"))
                    iFType = Font.PLAIN;
                else if (sFType.equalsIgnoreCase("italic"))
                    iFType = Font.ITALIC;
                else if (sFType.equalsIgnoreCase("bolditalic"))
                    iFType = Font.BOLD + Font.ITALIC;
                font = new Font(sFont, iFType, iSize);
                iPos = ++iTexts;
                int z = sLabel.indexOf("^");
                if (z > -1) {
                    sName = sLabel.substring(0, z);
                    sLabel = sLabel.substring(z + 1);
                }
                // text outline color
                if (st.hasMoreTokens()) {
                    sColor = st.nextToken();
                    if (!sColor.equalsIgnoreCase("-"))
                        cOut2 = ik.makeColor(sColor);
                }
                // text outline border size
                if (st.hasMoreTokens()) {
                    try {
                        s = st.nextToken();
                        if (!s.equalsIgnoreCase("-"))
                            iOut = Integer.parseInt(s);
                    } catch (Exception e) {
                        return false;
                    }
                }
                // text rotation
                if (st.hasMoreTokens()) {
                    try {
                        s = st.nextToken();
                        if (!s.equalsIgnoreCase("-"))
                            fRotate = Float.parseFloat(s);
                    } catch (Exception ex) {
                        print("setProperty():" + ex.toString());
                        return false;
                    }
                }
                // image for clipping
                if (st.hasMoreTokens()) {
                    s = st.nextToken();
                    if (!s.equalsIgnoreCase("-"))
                        sImage = s;
                }
                // TexturePaint
                if (st.hasMoreTokens()) {
                    s = st.nextToken();
                    if (!s.equalsIgnoreCase("-"))
                        sPaint = s;
                }
                // other operation ?
                if (st.hasMoreTokens()) {
                    s = st.nextToken();
                    if (!s.equalsIgnoreCase("-")) {
                        try {
                            if (s.toLowerCase().startsWith("scale=")) {
                                s = s.replaceAll("scale=", "");
                                sScale = "scale";
                            } else if (s.toLowerCase().startsWith("box=")) {
                                s = s.replaceAll("box=", "");
                                sScale = "box";
                            } else if (s.toLowerCase().startsWith("justify=")) {
                                s = s.replaceAll("justify=", "");
                                sScale = "justify";
                                iJust = Integer.parseInt(s);
                            } else
                                return false;
                            int ip = s.indexOf('-');
                            if (ip > -1) {
                                String s1 = s.substring(0, ip);
                                String s2 = s.substring(ip + 1);
                                if (sScale.equalsIgnoreCase("scale")) {
                                    fScaleX = Float.parseFloat(s1);
                                    fScaleY = Float.parseFloat(s2);
                                } else if (sScale.equalsIgnoreCase("box")) {
                                    iBoxX = Integer.parseInt(s1);
                                    iBoxY = Integer.parseInt(s2);
                                }
                            }
                        } catch (Exception ex2) {
                            return false;
                        }
                    }
                }
                // replace de carriage return
                sLabel = sLabel.replace((char)10, '\n');
                iPos = ++iTexts;
                // text already exist ?
                Texts txt = (Texts)list_texts.get(sID);
                if(txt != null){
                    sID += iPos ;
                }
                txt =
                    new Texts(sID, sName, sLabel, iX1, iY1, font, color, f, bGradient, cOut2, iOut, fRotate, sImage,
                              sPaint);
                if (sScale != null) {
                    if (sScale.equalsIgnoreCase("scale"))
                        txt.setScale(fScaleX, fScaleY);
                    else if (sScale.equalsIgnoreCase("box"))
                        txt.setBox(iBoxX, iBoxY);
                    else
                        txt.setJustify(iJust);
                }
                list_texts.put(sID,txt);
                Typ_Objects to = new Typ_Objects(sID,iPos, 9);
                list_objects.add(to);
            }
            return true;
        }


        /*----------------------------------*
         *  Add a center-right aligned text
         *----------------------------------*/
        else if (property == addText2) {
            String s = value.toString().trim();
            log("addText()" + s);
            int iPos = -1, iX1 = -1, iY1 = -1;
            String sLabel = "";
            String sName = null;
            String sID=null;
            String sFont = "", sColor = "r0g0b0", sFType = "";
            String sImage = null;
            String sPaint = null;
            String sScale = null;
            String sAlign = null;
            int iFType = Font.PLAIN;
            int iSize = 8;
            int iOut = 1;
            int iBoxX = 0, iBoxY = 0;
            int iJust = 0;
            int iStart = 0, iEnd = 0;
            boolean bGradient = false;
            Font font = new Font("Arial", Font.PLAIN, 8);
            Color color = Color.black, cOut2 = null;
            float f = 1.0f, fRotate = 0.0f;
            float fScaleX = 1.0f, fScaleY = 1.0f;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                try {
                    sID = st.nextToken();
                    if (st.hasMoreTokens())
                        sLabel = st.nextToken();
                    if (st.hasMoreTokens())
                        sAlign = st.nextToken();
                    if (st.hasMoreTokens())
                        iStart = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iEnd = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iY1 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        sFont = st.nextToken();
                    if (st.hasMoreTokens())
                        sFType = st.nextToken();
                    if (st.hasMoreTokens())
                        iSize = Integer.parseInt(st.nextToken());
                } catch (Exception e) {
                    return false;
                }
                // gradient
                if (st.hasMoreTokens()) {
                    sColor = st.nextToken();
                    if (sColor.equalsIgnoreCase("G"))
                        bGradient = true;
                    else if (!sColor.equalsIgnoreCase("-"))
                        color = ik.makeColor(sColor);
                }
                // transparency factor
                if (st.hasMoreTokens()) {
                    try {
                        f = Float.parseFloat(st.nextToken());
                        if (f < 0.0)
                            f = 0.0f;
                        if (f > 1.0)
                            f = 1.0f;
                    } catch (Exception ex) {
                        print("setProperty():" + ex.toString());
                        return false;
                    }
                }
                if (sFType.equalsIgnoreCase("bold"))
                    iFType = Font.BOLD;
                else if (sFType.equalsIgnoreCase("plain"))
                    iFType = Font.PLAIN;
                else if (sFType.equalsIgnoreCase("italic"))
                    iFType = Font.ITALIC;
                else if (sFType.equalsIgnoreCase("bolditalic"))
                    iFType = Font.BOLD + Font.ITALIC;
                font = new Font(sFont, iFType, iSize);
                iPos = ++iTexts;
                int z = sLabel.indexOf("^");
                if (z > -1) {
                    sName = sLabel.substring(0, z);
                    sLabel = sLabel.substring(z + 1);
                }

                // replace de carriage return
                sLabel = sLabel.replace((char)10, '\n');
                iPos = ++iTexts;
                // text already exist ?
                Texts txt = (Texts)list_texts.get(sID);
                if(txt != null){
                    sID += iPos ;
                }
                txt =
                    new Texts(sID, sName, sLabel, iX1, iY1, font, color, f, bGradient, null, iOut, fRotate, null,
                              null);
                txt.setAlign(iStart, iEnd, sAlign);
                list_texts.put(sID,txt);
                Typ_Objects to = new Typ_Objects(sID,iPos, 9);
                list_objects.add(to);
            }
            return true;
        }


        /*---------------------------------------------------*
         *  set a text label added with the ADD_TEXT method
         *---------------------------------------------------*/
        else if (property == setTextLabel) {
            String s = value.toString();
            log("setTextLabel()" + s);
            String sName = "", sText = "";
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                if (st.hasMoreTokens())
                    sName = st.nextToken();
                else
                    return false;
                if (st.hasMoreTokens())
                    sText = st.nextToken();
                else
                    return false;
            } else
                return false;
            sText = sText.replace((char)10, '\n');
            //for (int i = 0; i < list_texts.size(); i++) {
                Texts t = (Texts)list_texts.get(sName);
                if (t != null) {
                    t.sLabel = sText;
                    list_texts.put(sName, t);
                    this.repaint();
                    return true;
                }
            //}
            return true;
        }

        /*-------------------------------------*
         *  set a Text to calculate the width
         *-------------------------------------*/
        else if (property == setText) {
            String s = value.toString().trim();
            log("setText()" + s);
            String sLabel = "";
            String sFont = "", sFType = "";
            int iFType = Font.PLAIN;
            int iSize = 8;
            Font font = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                if (st.hasMoreTokens())
                    sLabel = st.nextToken();
                if (st.hasMoreTokens())
                    sFont = st.nextToken();
                if (st.hasMoreTokens())
                    sFType = st.nextToken();
                if (st.hasMoreTokens()) {
                    try {
                        iSize = Integer.parseInt(st.nextToken());
                    } catch (Exception e) {
                        return false;
                    }
                }
                if (sFType.equalsIgnoreCase("bold"))
                    iFType = Font.BOLD;
                else if (sFType.equalsIgnoreCase("plain"))
                    iFType = Font.PLAIN;
                else if (sFType.equalsIgnoreCase("italic"))
                    iFType = Font.ITALIC;
                else if (sFType.equalsIgnoreCase("bolditalic"))
                    iFType = Font.BOLD + Font.ITALIC;
                font = new Font(sFont, iFType, iSize);
                Rectangle2D rect =
                    font.getStringBounds(sLabel, new FontRenderContext(new AffineTransform(), true, true));
                iTextHeight = (int)(rect.getHeight());
                iTextWidth = (int)(rect.getWidth());
                log("setText Width=" + iTextWidth + " Height=" + iTextHeight);
            }
            return true;
        }

        /*---------------------*
         *  clear all objects
         *---------------------*/
        else if (property == clear) {
            log(" *** Clear() ***");
            hTabs.clear();
            hWindows.clear();
            for (int i = 0; i < list_images.size(); i++) {
                try {
                    Images img = (Images)list_images.get(i);
                    if (img != null) {
                        this.getParent().remove(img.jb);
                    }
                } catch (Exception ex) {
                    ;
                }
            }
            list_objects = new ArrayList(1);
            list_lines = new HashMap(1);
            list_polys = new HashMap(1);
            list_rects = new HashMap(1);
            list_circles = new HashMap(1);
            list_images = new ArrayList(1);
            list_texts = new HashMap(1);
            list_Lgradients = new ArrayList(1);
            iLines = -1;
            iShapes = -1;
            iRects = -1;
            iEllipses = -1;
            iImgs = -1;
            iTexts = -1;
            iHcycle = 0;
            iVcycle = 0;
            iDirection = LeftToRight;
            cBGColor1 = null;
            cBGColor2 = null;
            if (jp != null)
                jp.invalidate();
            System.gc();
            return true;
        }
        /*----------------------------*
         *  set all poplist enhanced
         *----------------------------*/
        else if (property == setEPoplists) {
            String s = value.toString();
            if (s.equalsIgnoreCase("true"))
                bEnhancedLists = true;
            else
                bEnhancedLists = false;
            // set the property for all TList components
            Typ_PJC obj = null;
            for (int i = 0; i < vPjc.size(); i++) {
                obj = (Typ_PJC)vPjc.get(i);
                if (obj.sName.equalsIgnoreCase("LAF_XP_TList")) {
                    oracle.forms.fd.LAF_XP_TList tl = obj.tl;
                    tl.setProperty(ID.registerProperty("SET_ENHANCED"), s);
                }
                if (obj.sName.equalsIgnoreCase("LAF_XP_PopList")) {
                    oracle.forms.fd.LAF_XP_PopList tl = obj.pl;
                    tl.setProperty(ID.registerProperty("SET_ENHANCED"), s);
                }
            }
            return true;
        }

        /*---------------------------------*
         *  set all TList multi-selection
         *---------------------------------*/
        else if (property == setMultiSelect) {
            // set the property for all TList components
            String s = value.toString();
            boolean b;
            if (s.equalsIgnoreCase("true"))
                b = true;
            else if (s.equalsIgnoreCase("false"))
                b = false;
            else
                return true; // option not allowed            
            Typ_PJC obj = null;
            bMultiSelect = b;
            for (int i = 0; i < vPjc.size(); i++) {
                obj = (Typ_PJC)vPjc.get(i);
                if (obj.sName.equalsIgnoreCase("LAF_XP_TList")) {
                    oracle.forms.fd.LAF_XP_TList tl = obj.tl;
                    tl.setProperty(ID.registerProperty("SET_MULTI_SELECTION"),s);
                }
            }
            return true;
        }

        /*-------------------------*
         *  set all TList sorted
         *-------------------------*/
        else if (property == setSorted) {
            String s = value.toString();
            boolean b;
            if (s.equalsIgnoreCase("true"))
                b = true;
            else if (s.equalsIgnoreCase("true"))
                b = false;
            else
                return true; // option not allowed
            // set the property for all TList components
            Typ_PJC obj = null;
            for (int i = 0; i < vPjc.size(); i++) {
                obj = (Typ_PJC)vPjc.get(i);
                if (obj.sName.equalsIgnoreCase("LAF_XP_TList")) {
                    oracle.forms.fd.LAF_XP_TList tl = obj.tl;
                    tl.setSorted(true);
                }
            }
            return true;
        }

        /*------------------------------*
         *  set all TList orientation
         *------------------------------*/
        else if (property == setListOrient) {
            String s = value.toString();
            // set the property for all PopList components
            Typ_PJC obj = null;
            for (int i = 0; i < vPjc.size(); i++) {
                obj = (Typ_PJC)vPjc.get(i);
                if (obj.sName.equalsIgnoreCase("LAF_XP_TList")) {
                    oracle.forms.fd.LAF_XP_TList tl = obj.tl;
                    tl.setProperty(ID.registerProperty("SET_LIST_ORIENTATION"), s);
                }
            }
            return true;
        }

        /*-------------------------------------*
         *  set all PopList time hit key value
         *-------------------------------------*/
        else if (property == setTimeKeySel) {
            String s = value.toString();
            // set the property for all PopList components
            Typ_PJC obj = null;
            for (int i = 0; i < vPjc.size(); i++) {
                obj = (Typ_PJC)vPjc.get(i);
                if (obj.sName.equalsIgnoreCase("LAF_XP_PopList")) {
                    oracle.forms.fd.LAF_XP_PopList pl = obj.pl;
                    pl.setProperty(ID.registerProperty("SET_TIME_KEY_SELECT"), s);
                }
            }
            return true;
        }

        // MLT-7702 (Removed sound related properties and Flash related properties )
        /*-----------------------*
         *  Set the shadow color
         *-----------------------*/
        else if (property == pFlashSetShadow) {
            String s = (String)value;
            cFlashShadow = ik.makeColor(s);
            return true;
        }

        /*-----------------------------*
         *  open an input dialog box
         *-----------------------------*/
        else if (property == pInputDialog) {
            String s = (String)value;
            String sTitle = null, sText = null, sIcon = null, sMulti = null, sTmp = "";
            boolean bMulti = false;
            int icon = JOptionPane.QUESTION_MESSAGE;
            int iWidth = 250, iHeight = 100;
            int iX = -1, iY = -1;
            StringTokenizer st = new StringTokenizer(s, ",");
            // title
            if (st.hasMoreTokens())
                sTitle = st.nextToken();
            else
                return false;
            // text
            if (st.hasMoreTokens())
                sText = st.nextToken();
            else
                return false;
            // multi-line ?
            if (st.hasMoreTokens())
                sMulti = st.nextToken();
            if (sMulti.equalsIgnoreCase("true"))
                bMulti = true;
            else
                iHeight = 20;
            // x pos
            try {
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iX = Integer.parseInt(sTmp);
                }
                // y pos
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iY = Integer.parseInt(sTmp);
                }
                // width
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iWidth = Integer.parseInt(sTmp);
                }
                // height
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iHeight = Integer.parseInt(sTmp);
                }
            } catch (Exception e) {
                return false;
            }
            // icon ?
            if (st.hasMoreTokens())
                sIcon = st.nextToken();

            // show the dialog
            sDialogString = ShowDialog(sTitle, sText, bMulti, iX, iY, iWidth, iHeight, sIcon);
            return true;
        }


        /*-----------------------------*
         *    display a message
         *-----------------------------*/
        else if (property == pDisplayDialog) {
            String s = (String)value;
            StringBuffer sb = new StringBuffer();
            String sTitle = null, sText = null, sIcon = null, sTmp = "";
            boolean bMulti = false;
            int icon = JOptionPane.QUESTION_MESSAGE;
            int iWidth = 250, iHeight = 100;
            int iX = -1, iY = -1;
            StringTokenizer st = new StringTokenizer(s, ",");
            iHeight = 20;
            // x pos
            try {
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iX = Integer.parseInt(sTmp);
                } else
                    return false;
                // y pos
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iY = Integer.parseInt(sTmp);
                } else
                    return false;
                // width
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iWidth = Integer.parseInt(sTmp);
                } else
                    return false;
                // height
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iHeight = Integer.parseInt(sTmp);
                } else
                    return false;
            } catch (Exception e) {
                return false;
            }
            // icon ?
            if (st.hasMoreTokens()) {
                sTmp = st.nextToken();
                if (!sTmp.equalsIgnoreCase("-"))
                    sIcon = sTmp;
            } else
                return false;

            // title
            if (st.hasMoreTokens())
                sTitle = st.nextToken();
            else
                return false;

            // text
            if (st.hasMoreTokens()) {
                while (st.hasMoreTokens())
                    sb.append(st.nextToken() + ",");
                sText = sb.toString().substring(0, sb.length() - 1);
            } else
                return false;

            // show the dialog
            DisplayMessage(sTitle, sText, iX, iY, iWidth, iHeight, sIcon);
            return true;
        }


        /*-----------------------------*
         *    display an alert box
         *-----------------------------*/
        else if (property == pDisplayAlert) {
            String s = (String)value;
            StringBuffer sb = new StringBuffer();
            String sTitle = null, sText = null, sIcon = null, sTmp = "", sOptions = "";
            String sOpts[] = new String[20];
            boolean bList = false;
            int iDefault = 0;
            Object[] objs = new Object[1];
            objs[0] = (Object)"Ok";
            boolean bMulti = false;
            int icon = JOptionPane.QUESTION_MESSAGE;
            int iWidth = 250, iHeight = 100;
            int iX = -1, iY = -1;
            StringTokenizer st = new StringTokenizer(s, ",");
            iHeight = 20;
            // display choice in list instead of butons ?
            if (st.hasMoreTokens()) {
                sTmp = st.nextToken();
                if (sTmp.equalsIgnoreCase("true"))
                    bList = true;
                else if (sTmp.equalsIgnoreCase("false"))
                    bList = false;
                else
                    return false;
            }
            // x pos
            try {
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iX = Integer.parseInt(sTmp);
                } else
                    return false;
                // y pos
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iY = Integer.parseInt(sTmp);
                } else
                    return false;
                // width
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iWidth = Integer.parseInt(sTmp);
                } else
                    return false;
                // height
                if (st.hasMoreTokens()) {
                    sTmp = st.nextToken();
                    if (!sTmp.equalsIgnoreCase("-"))
                        iHeight = Integer.parseInt(sTmp);
                } else
                    return false;
            } catch (Exception e) {
                return false;
            }

            // icon ?
            if (st.hasMoreTokens()) {
                sTmp = st.nextToken();
                if (!sTmp.equalsIgnoreCase("-"))
                    sIcon = sTmp;
            } else
                return false;

            // option buttons
            if (st.hasMoreTokens()) {
                sOptions = st.nextToken();
                if (!sOptions.equalsIgnoreCase("-")) {
                    StringTokenizer st2 = new StringTokenizer(sOptions, "|");
                    int i = 0;
                    while (st2.hasMoreTokens()) {
                        sOpts[i++] = st2.nextToken();
                    }
                    objs = new Object[i];
                    for (int b = 0; b < i; b++)
                        objs[b] = (Object)sOpts[b];
                }
            }

            // default option ?
            if (st.hasMoreTokens()) {
                sTmp = st.nextToken();
                if (!sTmp.equalsIgnoreCase("-")) {
                    try {
                        iDefault = Integer.parseInt(sTmp);
                        iDefault--;
                        if (iDefault < 0)
                            iDefault = 0;
                        if (iDefault >= objs.length)
                            iDefault = (objs.length - 1);
                    } catch (Exception e) {
                        ;
                    }
                }
            }

            // title
            if (st.hasMoreTokens())
                sTitle = st.nextToken();
            else
                return false;

            // text
            if (st.hasMoreTokens()) {
                while (st.hasMoreTokens())
                    sb.append(st.nextToken() + ",");
                sText = sb.toString().substring(0, sb.length() - 1);
            } else
                return false;

            // show the dialog
            DisplayAlert(bList, sTitle, sText, iX, iY, iWidth, iHeight, sIcon, objs, iDefault);
            return true;
        }


        /*----------------------------------*
         *  set input dialog box properties
         *----------------------------------*/
        else if (property == psetDialogProps) {
            String s = (String)value;
            String sFont = null, sSize = null, sColF = null, sColB = null, sTmp = "";
            int iWeight = Font.PLAIN;
            Color cF = null, cB = null;
            Font f = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            // font name
            // can be Verdana
            //     or Verdana.B (bold) or Verdana.I (italic)
            //     or Verdana.BI (bold+italic) or Verdana.P (plain)
            if (st.hasMoreTokens()) {
                sTmp = st.nextToken();
                int i = sTmp.indexOf(".");
                if (i > -1) {
                    sFont = sTmp.substring(0, i);
                    sTmp = sTmp.substring(i + 1);
                    if (sTmp.equalsIgnoreCase("B"))
                        iWeight = Font.BOLD;
                    else if (sTmp.equalsIgnoreCase("P"))
                        iWeight = Font.PLAIN;
                    else if (sTmp.equalsIgnoreCase("I"))
                        iWeight = Font.ITALIC;
                    else if (sTmp.equalsIgnoreCase("BI"))
                        iWeight = Font.BOLD + Font.ITALIC;
                } else
                    sFont = sTmp;
            }
            // font size
            if (st.hasMoreTokens())
                sSize = st.nextToken();
            // Foreground color
            if (st.hasMoreTokens()) {
                sColF = st.nextToken();
                if (!sTmp.equalsIgnoreCase("-"))
                    cF = ik.makeColor(sColF);
            }
            // BackGround color
            if (st.hasMoreTokens()) {
                sColB = st.nextToken();
                if (!sTmp.equalsIgnoreCase("-"))
                    cB = ik.makeColor(sColB);
            }

            if (!sFont.equalsIgnoreCase("-") && !sSize.equalsIgnoreCase("-")) {
                try {
                    f = new Font(sFont, iWeight, Integer.parseInt(sSize));
                    fDialogFont = f;
                } catch (Exception e) {
                    print(e.getMessage());
                }
            }
            if (sColF != null)
                cDialogFore = cF;
            if (sColB != null)
                cDialogBack = cB;

            return true;
        }


        /*-------------------------------------------*
         *  search for current window and MDI window
         *-------------------------------------------*/
        else if (property == pGetWindows) {
            Container cont = this.getParent();
            String s = "";
            while (cont != null) {
                s = "" + cont.getClass();
                if (s.indexOf("oracle.forms.ui.ExtendedFrame") > -1) {
                    /*-------------------*
                     *   current window  *
                     *-------------------*/
                    winCurrent = (oracle.forms.ui.ExtendedFrame)cont;                  
                }

                if (winMDI == null && s.indexOf("JBufferedFrame") > -1 && bSeparateFrame) {
                    /*--------------*
                     *   MDI frame  *
                     *--------------*/
                    winMDI = (oracle.ewt.swing.JBufferedFrame)formsMain.getFrame();
                    WindowListener wl = new WindowListener() {
                        public void windowClosing(WindowEvent e) {
                            log("WindowListener method called: windowClosing.");
                        }

                        public void windowClosed(WindowEvent e) {
                            log("WindowListener method called: windowClosed.");
                        }

                        public void windowOpened(WindowEvent e) {
                            log("WindowListener method called: windowOpened.");
                        }

                        public void windowIconified(WindowEvent e) {
                            log("WindowListener method called: windowIconified.");
                        }

                        public void windowDeiconified(WindowEvent e) {
                            log("WindowListener method called: windowDeiconified.");
                        }

                        public void windowActivated(WindowEvent e) {
                            log("WindowListener method called: windowActivated.");
                            setProperty(GetComponents, null);
                        }

                        public void windowDeactivated(WindowEvent e) {
                            log("WindowListener method called: windowDeactivated.");
                            setProperty(GetComponents, null);
                        }

                        public void windowGainedFocus(WindowEvent e) {
                            log("WindowFocusListener method called: windowGainedFocus.");
                        }

                        public void windowLostFocus(WindowEvent e) {
                            log("WindowFocusListener method called: windowLostFocus.");
                        }

                        public void windowStateChanged(WindowEvent e) {
                            log("WindowStateListener method called: windowStateChanged.");
                        }
                    };
                    Frame f = (Frame)winMDI;
                    f.addWindowListener(wl);
                }
                cont = cont.getParent();
            }
            return true;
        }


        /*---------------------------------------*
         *  set the saved color (JColorChooser)  *
         *---------------------------------------*/
        else if (property == pSetRGBColor) {
            Color c = null;
            String sColor = "";
            String s = value.toString().trim();
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sColor = st.nextToken();
            else
                return false;
            if (!sColor.equalsIgnoreCase("-")) {
                c = ik.makeColor(sColor);
                cLastColor = c;
            }
            if (st.hasMoreTokens())
                sColorChooserTitle = st.nextToken();
            return true;
        }

        /*----------------------*
         *  show the about box  *
         *----------------------*/
        else if (property == pShowAbout) {
            About about = new About(formsMain.getFrame());
            return true;
        }

        else if (property == pSearchTextItems) {
            /* Tom Cleymans DispatchingBean feature
             * walkFindPJC will locate the DispatchingFBean & DispatchingPJC
             * and will set the dBean to this component
             * */

            walkFindPJC(formsTopFrame, 0);
            return true;
        }

        // ******************************
        //    Dynamic menu properties
        // ******************************
        // add menu
        else if (property == AddMenu) {
            String sLabel = "";
            String sName = "";
            String sParent = "";
            StringTokenizer st = new StringTokenizer(value.toString(), ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sLabel = st.nextToken();
            else
                return false;
            // add Main to menu path if not provided
            int iPos = sName.lastIndexOf(".");
            if (iPos > -1)
                sParent = sName.substring(0, iPos);
            /*
                if(iPos < 0) { sParent = "Main" ; sName = sParent + sName ; }
                else sParent = sName.substring(0,iPos);
             */
            log("add new menu - sName:" + sName + "  sParent:" + sParent);
            newMenu = new oracle.ewt.lwAWT.lwMenu.LWMenu();
            newMenu.setName(sName);
            newMenu.setLabel(sLabel);
            if (MenuBar != null) {
                if (MenuBar.fFont != null)
                    newMenu.setFont(MenuBar.fFont);
                if (MenuBar.cBack != null)
                    newMenu.setBackground(MenuBar.cBack);
                if (MenuBar.cFore != null)
                    newMenu.setForeground(MenuBar.cFore);
            }
            // accelerator in label ?
            iPos = sLabel.indexOf("&");
            if (iPos > -1) {
                String sLetter = sLabel.substring(iPos + 1, iPos + 2);
                sLabel = sLabel.substring(0, iPos) + sLabel.substring(iPos + 1, sLabel.length());
                newMenu.setLabel(sLabel);
                newMenu.setMnemonicChar(sLetter.charAt(0));
            }
            // accelerator to review
            KeyStroke ks = new KeyStroke('m', 1);
            newMenu.setAccelerator(ks);
            LWPopupMenu parentMenu;
            if (sParent.equalsIgnoreCase(""))
                pMenu.add(newMenu);
            else {
                cPopMenu cpm = (cPopMenu)hMenuBar.get(sParent.toLowerCase());
                if (cpm == null)
                    return false;
                parentMenu = cpm.popMenu;
                parentMenu.add(newMenu);
            }
            popMenu = new oracle.ewt.lwAWT.lwMenu.LWPopupMenu();
            cPopMenu cpm = new cPopMenu(sName, newMenu, popMenu);
            newMenu.setSubMenu(popMenu);
            hMenuBar.put(sName.toLowerCase(), cpm);

            return true;
        }

        // add menu option
        else if (property == AddMenuOption) {
            String sMenuParent = "";
            String sMenu = "";
            String sLabel = "";
            String sCommand = "";
            String sToolTip = null;
            String sImage = "";
            String s = value.toString();
            Image img = null;
            int iPos = 0;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sMenu = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sLabel = st.nextToken();
            else
                return false;
            iPos = sMenu.lastIndexOf(".");
            if (iPos == -1)
                return false;
            sMenuParent = sMenu.substring(0, iPos);
            log("menu parent=" + sMenuParent);
            cPopMenu cpm = (cPopMenu)hMenuBar.get(sMenuParent.toLowerCase());
            if (cpm == null)
                return false;
            if (sLabel.equalsIgnoreCase("SEPARATOR")) {
                oracle.ewt.lwAWT.lwMenu.LWMenuSeparator sep = new oracle.ewt.lwAWT.lwMenu.LWMenuSeparator();
                cpm.popMenu.add(sep);
            } else {
                // command
                if (st.hasMoreTokens())
                    sCommand = st.nextToken();
                else
                    return false;

                // tooltip
                if (st.hasMoreTokens()) {
                    String sTP = st.nextToken();
                    if (!sTP.equalsIgnoreCase("-"))
                        sToolTip = sTP;
                }
                // image icon
                if (st.hasMoreTokens()) {
                    sImage = st.nextToken();
                    img = ik.loadImage(sImage);
                }
                oracle.ewt.lwAWT.lwMenu.LWMenuItem mi = new oracle.ewt.lwAWT.lwMenu.LWMenuItem();

                // accelerator in label ?
                iPos = sLabel.indexOf("&");
                if (iPos > -1) {
                    String sLetter = sLabel.substring(iPos + 1, iPos + 2);
                    sLabel = sLabel.substring(0, iPos) + sLabel.substring(iPos + 1, sLabel.length());
                    mi.setMnemonicChar(sLetter.charAt(0));
                }

                mi.setLabel(sLabel);
                if (MenuOption != null) {
                    if (MenuOption.fFont != null)
                        mi.setFont(MenuOption.fFont);
                    if (MenuOption.cBack != null)
                        mi.setBackground(MenuOption.cBack);
                    if (MenuOption.cFore != null)
                        mi.setForeground(MenuOption.cFore);
                }
                mi.setActionCommand(sCommand);
                if (img != null)
                    mi.setImage(img);
                if (sToolTip != null && !sToolTip.equalsIgnoreCase("-"))
                    mi.setToolTipValue(sToolTip);
                MouseListener ml = new MouseListener() {
                    public void mouseClicked(MouseEvent e) {
                    }

                    public void mouseEntered(MouseEvent e) {
                    }

                    public void mouseExited(MouseEvent e) {
                    }

                    public void mousePressed(MouseEvent e) {
                    }

                    public void mouseReleased(MouseEvent e) {
                        oracle.ewt.lwAWT.lwMenu.LWMenuItem item = (oracle.ewt.lwAWT.lwMenu.LWMenuItem)e.getSource();
                        if (item.isEnabled())
                            dispatchanevent(MENUMSG, MENUOPTION, item.getActionCommand());
                    }
                };
                cOptMenu com = new cOptMenu(sLabel, sCommand, sToolTip, cpm.popMenu, mi, null);
                if (com == null)
                    log("com=NULL");
                else
                    hMenuOptions.put(sMenu.toLowerCase(), com);
                mi.addMouseListener(ml);
                cpm.popMenu.add(mi);
            }
            return true;
        }

        // set menu status
        else if (property == StatusMenu) {
            log(property + ":" + value);
            String sMenu = "";
            String sOption = "";
            String s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sMenu = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sOption = st.nextToken();
            else
                return false;
            cPopMenu cpm = (cPopMenu)hMenuBar.get(sMenu.toLowerCase());
            if (cpm == null)
                return false;
            if (sOption.equalsIgnoreCase("true"))
                cpm.lMenu.setEnabled(true);
            else
                cpm.lMenu.setEnabled(false);
            return true;
        }

        // set menu status
        else if (property == VisibleMenu) {
            log(property + ":" + value);
            String sMenu = "";
            String sOption = "";
            String s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sMenu = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sOption = st.nextToken();
            else
                return false;
            cPopMenu cpm = (cPopMenu)hMenuBar.get(sMenu.toLowerCase());
            if (cpm == null)
                return false;
            if (sOption.equalsIgnoreCase("true"))
                cpm.lMenu.setVisible(true);
            else
                cpm.lMenu.setVisible(false);
            return true;
        }

        // set menu option status
        else if (property == StatusMenuOption) {
            log(property + ":" + value);
            String sMenu = "";
            String sOption = "";
            String s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sMenu = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sOption = st.nextToken();
            else
                return false;
            cOptMenu com = (cOptMenu)hMenuOptions.get(sMenu.toLowerCase());
            if (com == null)
                return false;
            if (sOption.equalsIgnoreCase("true"))
                com.mi.setEnabled(true);
            else
                com.mi.setEnabled(false);
            return true;
        }


        // set menu option display status
        else if (property == VisibleMenuOption) {
            log(property + ":" + value);
            String sMenu = "";
            String sOption = "";
            String s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sMenu = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sOption = st.nextToken();
            else
                return false;
            cOptMenu com = (cOptMenu)hMenuOptions.get(sMenu.toLowerCase());
            if (com == null)
                return false;
            if (sOption.equalsIgnoreCase("true"))
                com.mi.setVisible(true);
            else
                com.mi.setVisible(false);
            return true;
        }

        // remove menu option
        else if (property == DelMenuOption) {
            log(property + ":" + value);
            String sMenu = value.toString();
            cOptMenu com = (cOptMenu)hMenuOptions.get(sMenu.toLowerCase());
            if (com == null)
                return false;
            com.popMenu.remove(com.mi);
            hMenuOptions.remove(sMenu);
            log("* menu removed *");
            return true;
        }

        // move the "Window" menu option at end
        else if (property == MoveWinMenuOption) {
            pMain.remove(pWinMenu);
            pMain.add(pWinMenu);
            return true;
        }


        // Show/Hide complete menu bar
        else if (property == ShowMenuBar) {
            String s = value.toString();
            if (s.equalsIgnoreCase("true"))
                pMain.setVisible(true);
            else
                pMain.setVisible(false);
            return true;
        }


        //
        // Status Bar
        //
        else if (property == setStatusBarValue) {
            if (iStatusBar == -1)
                return false;
            int iBar = 0, iItem = 0;
            String s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            // bar index - must be 1 or 2
            if (st.hasMoreTokens()) {
                try {
                    iBar = Integer.parseInt(st.nextToken());
                    if (iBar < 1 || iBar > 2)
                        return false;
                } catch (Exception e) {
                    return false;
                }
            } else
                return false;
            // bar item must be 1-2 or 1-6
            if (st.hasMoreTokens()) {
                try {
                    iItem = Integer.parseInt(st.nextToken());
                    if ((iBar == 1) && (iItem < 1 || iItem > 2))
                        return false;
                    if ((iBar == 2) && (iItem < 1 || iItem > 6))
                        return false;
                } catch (Exception e) {
                    return false;
                }
            } else
                return false;
            iStatusBarNum = iBar - 1;
            iStatusBarIdx = iItem - 1;
            // Status Bar Item value
            if (st.hasMoreTokens()) {
                try {
                    statusbars[iStatusBarNum][iStatusBarIdx].setText(st.nextToken());
                } catch (Exception ex2) {
                    return false;
                }
            } else
                return false;
            return true;
        }

        // set the StatusBar Index
        else if (property == setStatusBarIndex) {
            if (iStatusBar == -1)
                return false;
            int iBar = 0, iItem = 0;
            String s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            // bar index - must be 1 or 2
            if (st.hasMoreTokens()) {
                try {
                    iBar = Integer.parseInt(st.nextToken());
                    if (iBar < 1 || iBar > 2)
                        return false;
                } catch (Exception e) {
                    return false;
                }
            } else
                return false;
            // bar item must be 1-2 or 1-6
            if (st.hasMoreTokens()) {
                try {
                    iItem = Integer.parseInt(st.nextToken());
                    if ((iBar == 1) && (iItem < 1 || iItem > 2))
                        return false;
                    if ((iBar == 2) && (iItem < 1 || iItem > 6))
                        return false;
                } catch (Exception e) {
                    return false;
                }
            } else
                return false;
            iStatusBarNum = iBar - 1;
            iStatusBarIdx = iItem - 1;
            log("setstat=" + iStatusBarNum + "," + iStatusBarIdx);
            return true;
        }
        
        // show status bar
        else if (property == showStatusBar) {
            if(stBar == null) return false ;
            String s = value.toString();
            String sShow=s, sResize="true";
            int i = s.indexOf(",");
            if (i > -1) {
                sShow = s.substring(0, i);
                sResize = s.substring(i + 1);
            }            
            if (sShow.equalsIgnoreCase("true")){
                if(stBar.getParent().getParent().isVisible()) return true ;
                if(sResize.equalsIgnoreCase("true")){
                    winMDI.setSize(winMDI.getSize().width,winMDI.getSize().height+38);
                }
                stBar.getParent().getParent().setVisible(true);
            }
            else{
                if(!stBar.getParent().getParent().isVisible()) return true ;
                if(sResize.equalsIgnoreCase("true")){
                    winMDI.setSize(winMDI.getSize().width,winMDI.getSize().height-38);
                }
                stBar.getParent().getParent().setVisible(false);                
            }
            return true ;
        }
        // show status bar second line
        else if (property == showStatusBarLine2) {
            if(stBar == null) return false ;        
            String s = value.toString();          
            oracle.forms.ui.FormStatusArea fsa = (oracle.forms.ui.FormStatusArea) stBar.getParent().getParent() ;
            if (s.equalsIgnoreCase("true")){
                if(stBar.getParent().isVisible()) return true ;
                stBar.getParent().setVisible(true);
                fsa.setBorderPainter(stBorderPainter);
            }
            else{
                if(!stBar.getParent().isVisible()) return true ;
                fsa.setBorderPainter(null);
                stBar.getParent().setVisible(false);
            }
            return true ;
        }

        // draw item focus lines
        else if (property == pDrawFocusLines) {
            log(property + ":" + value);
            String s = value.toString();
            if (s.equalsIgnoreCase("true"))
                bDrawFocusLine = true;
            else if (s.equalsIgnoreCase("false"))
                bDrawFocusLine = false;
            return true;
        }

        // all buttons focus mark
        else if (property == pSetButtonFocusMark) {
            String s = value.toString();
            if (s.equalsIgnoreCase("true"))
                bRolloverAllMark = true;
            else if (s.equalsIgnoreCase("false"))
                bRolloverAllMark = false;
            return true;
        }

        // draw checkbox background
        else if (property == CBDrawBackground) {
            log(property + ":" + value);
            String s = value.toString();
            if (s.equalsIgnoreCase("true"))
                bCBDrawBackground = true;
            else if (s.equalsIgnoreCase("false"))
                bCBDrawBackground = false;
            return true;
        }

        // draw checkbox background color
        else if (property == CBBackgroundColor) {
            log(property + ":" + value);
            String s = value.toString();
            Color c = ik.makeColor(s);
            cCBBackgroundColor = c;
            return true;
        }


        //
        //   Socket Server
        //
        // Start the socket server on the given port
        else if (property == initServer) {
            String s = (String)value;
            int iPort = 0, iTime = 1000;
            int i = s.indexOf(",");
            if (i > -1) {
                try {
                    iPort = Integer.parseInt(s.substring(0, i));
                    log("socketServer - port:" + s.substring(0, i));
                    iTime = Integer.parseInt(s.substring(i + 1));
                    log("socketServer - speed:" + s.substring(i + 1));
                } catch (Exception e) {
                    return false;
                }
            } else {
                try {
                    iPort = Integer.parseInt(s);
                } catch (Exception e) {
                    return false;
                }
            }
            SocketServer = new LAFSocketServer();
            SocketServer.dBean = this;
            SocketServer.initServer(iPort, iTime);
            return true;
        }

        // Stop the socket server
        else if (property == stopServer) {
            if (SocketServer != null) {
                SocketServer.stopServer();
            }
            return true;
        }

        // socket server log
        else if (property == serverLog) {
            if (SocketServer != null) {
                String s = (String)value;
                if (s.equals("true"))
                    SocketServer.setLog(true);
                else
                    SocketServer.setLog(false);
            }
            return true;
        }

        // set all Hyperlinks colors
        else if (property == pSetAllHLColors) {
            String s = value.toString(), sColor = "";
            Color c1 = null, c2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            // link color
            if (st.hasMoreTokens()) {
                sColor = st.nextToken();
                c1 = ik.makeColor(sColor);
            } else
                return false;

            // link visited color
            if (st.hasMoreTokens()) {
                sColor = st.nextToken();
                c2 = ik.makeColor(sColor);
            }

            LAF_XP_TextField.setAllHLColors(c1, c2);

            return true;
        }

        // paint the focus background?
        else if (property == setFocusBG) {
            String s = value.toString();
            if (s.equalsIgnoreCase("true"))
                bFocusBG = true;
            else
                bFocusBG = false;
            return true;
        }

        // canvas resized
        else if (property == CanvasResized) {
            jp.setBounds(canvas.getBounds());
            jp.repaint();
            return true;
        }

        /*-----------------------------*
         *  set the button focus color *
         *-----------------------------*/
        else if (property == setRolloverColor) {
            String s = value.toString();
            Color c1 = ik.makeColor(s);
            cFocus = c1;
            return true;
        }

        /*----------------------------*
         *    set a scrolling panel   *
         *                            *
         *    new 1.4 feature         *
         *----------------------------*/
        else if (property == SET_SCROLL_PANEL) {
            String s = value.toString();
            StringBuffer sb = new StringBuffer();
            int i1 = 0, i2 = 25, iX = 0, iY = 0, iW = -1;
            iH = 200;
            String s1 = "", sText = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            // start delay
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    try {
                        i1 = Integer.parseInt(s1);
                    } catch (Exception e) {
                        return false;
                    }
                }
            } else
                return false;
            // delay
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    try {
                        i2 = Integer.parseInt(s1);
                    } catch (Exception e) {
                        return false;
                    }
                }
            } else
                return false;
            // X
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    try {
                        iX = Integer.parseInt(s1);
                    } catch (Exception e) {
                        return false;
                    }
                }
            } else
                return false;
            // Y
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    try {
                        iY = Integer.parseInt(s1);
                    } catch (Exception e) {
                        return false;
                    }
                }
            } else
                return false;
            // width
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    try {
                        iW = Integer.parseInt(s1);
                    } catch (Exception e) {
                        return false;
                    }
                }
            } else
                return false;
            // height
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    try {
                        iH = Integer.parseInt(s1);
                    } catch (Exception e) {
                        return false;
                    }
                }
            } else
                return false;
            // text
            if (st.hasMoreTokens()) {
                while (st.hasMoreTokens())
                    sb.append(st.nextToken() + ",");
                sText = sb.toString().substring(0, sb.length() - 1);
            }

            if (sp == null)
                sp = new ScrollPanel(i1, i2, iX, iY, iW, iH);
            else
                sp.init(i1, i2, iX, iY, iW, iH);
            sp.setContent(sText);
            sp.setLocation(iX, iY);
            sp.setSize(new Dimension(iW, iH));
            if (bScrollFrame) {
                JFrame jf = new JFrame();
                sp.setJFrame(jf);
                sp.setLocation(0, 0);
                if (sFrameTitle != null)
                    jf.setTitle(sFrameTitle);
                jf.setLocation(iX, iY + 50);
                jf.setSize(new Dimension(iW, iH));
                jf.addComponentListener(new ComponentListener() {
                    public void componentResized(ComponentEvent e) {
                        Dimension dim = e.getComponent().getSize();
                        sp.setNewSize(dim.width - 10, dim.height - 34);
                        sp.setNewLocation(0, 0);
                    }

                    public void componentHidden(ComponentEvent e) {
                    }

                    public void componentShown(ComponentEvent e) {
                    }

                    public void componentMoved(ComponentEvent e) {
                    }
                });
                jf.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
                jf.add(sp);
                jf.pack();
                jf.setVisible(true);
            } else
                this.getParent().add(sp, 0);
            if (sText != null && i1 > 0)
                sp.startTimer();
            if (iScrollDuration > -1) {
                try {
                    new Thread() {
                        public void run() {
                            try {
                                try {
                                    Thread.sleep(iScrollDuration);
                                } catch (Exception e) {
                                }
                                if (sp != null) {
                                    sp.stopTimer();
                                    sp.setVisible(false);
                                    sp = null;
                                }
                                iScrollDuration = -1;
                            } catch (Exception e) {
                                e.printStackTrace();
                                iScrollDuration = -1;
                            }
                        }
                    }.start();

                } catch (Exception e) {
                    e.printStackTrace();
                    iScrollDuration = -1;
                }
            }
            return true;
        }

        /*---------------------------------*
         *  set the scrolling panel text   *
         *---------------------------------*/
        else if (property == SET_SCROLL_DURATION) {
            String s = value.toString();
            int l = -1;
            try {
                l = Integer.parseInt(s);
                iScrollDuration = l;
            } catch (Exception e) {
                print("Set_Scroll_Duration() incorrect value:" + s);
                return false;
            }
            return true;
        }

        /*---------------------------------*
         *  set the scrolling panel text   *
         *---------------------------------*/
        else if (property == SET_SCROLL_TEXT) {
            String s = value.toString();
            if (sp == null)
                sp = new ScrollPanel();
            sp.setContent(s);
            sp.startTimer();
            if (iScrollDuration > -1) {
                try {
                    new Thread() {
                        public void run() {
                            try {
                                try {
                                    Thread.sleep(iScrollDuration);
                                } catch (Exception e) {
                                }
                                if (sp != null) {
                                    sp.stopTimer();
                                    sp.setVisible(false);
                                    sp = null;
                                }
                                iScrollDuration = -1;
                            } catch (Exception e) {
                                e.printStackTrace();
                                iScrollDuration = -1;
                            }
                        }
                    }.start();

                } catch (Exception e) {
                    e.printStackTrace();
                    iScrollDuration = -1;
                }
            }
            return true;
        }

        /*------------------------------------*
         *  set the scrolling panel extends   *
         *------------------------------------*/
        else if (property == SET_SCROLL_EXTENDS) {
            String s = value.toString();
            int x = -1, y = -1, w = -1, h = -1;
            if (!s.equalsIgnoreCase("fullcanvas")) {
                StringTokenizer st = new StringTokenizer(s, ",");
                if (st.hasMoreTokens()) {
                    try {
                        x = Integer.parseInt(st.nextToken());
                    } catch (Exception e) {
                        print("SET_SCROLL_EXTENDS() incorrect X value");
                        return false;
                    }
                } else
                    return false;
                if (st.hasMoreTokens()) {
                    try {
                        y = Integer.parseInt(st.nextToken());
                    } catch (Exception e) {
                        print("SET_SCROLL_EXTENDS() incorrect Y value");
                        return false;
                    }
                } else
                    return false;
                if (st.hasMoreTokens()) {
                    try {
                        w = Integer.parseInt(st.nextToken());
                    } catch (Exception e) {
                        print("SET_SCROLL_EXTENDS() incorrect Width value");
                        return false;
                    }
                } else
                    return false;
                if (st.hasMoreTokens()) {
                    try {
                        h = Integer.parseInt(st.nextToken());
                    } catch (Exception e) {
                        print("SET_SCROLL_EXTENDS() incorrect Height value");
                        return false;
                    }
                } else
                    return false;
                if ((x < 0) || (y < 0) || (w < 0) || (h < 0)) {
                    print("SET_SCROLL_EXTENDS() x,y,width and height must be greater than 0");
                    return false;
                }
            }
            if (sp == null)
                sp = new ScrollPanel();
            sp.setExtends(x, y, w, h);
            return true;
        }

        /*---------------------------------*
         *  set the scrolling panel        *
         *  page not found error text      *
         *---------------------------------*/
        else if (property == SET_SCROLL_ERROR) {
            String s = value.toString();
            if (sp == null)
                sp = new ScrollPanel();
            sp.setNotFoundText(s);
            return true;
        }

        /*---------------------------------*
         *  set the scrolling panel        *
         *  warning text                   *
         *---------------------------------*/
        else if (property == SET_SCROLL_INFO_TXT) {
            String s = value.toString();
            if (sp == null)
                sp = new ScrollPanel();
            sp.setInfoText(s);
            return true;
        }

        /*---------------------------------*
         *  set the scrolling panel        *
         *  warning text properties        *
         *---------------------------------*/
        else if (property == SET_SCROLL_INFO_PROP) {
            String s = value.toString();
            String sFont = null, sType = "";
            int iSize = 12, iType = Font.PLAIN;
            Font f = new Font("Verdana", Font.PLAIN, 12);
            Color c1 = null, c2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                // font name
                sFont = st.nextToken();
            } else
                return false;
            if (st.hasMoreTokens()) {
                // font type
                sType = st.nextToken();
                if (sType.equalsIgnoreCase("N"))
                    iType = Font.PLAIN;
                if (sType.equalsIgnoreCase("B"))
                    iType = Font.BOLD;
                if (sType.equalsIgnoreCase("I"))
                    iType = Font.ITALIC;
                if (sType.equalsIgnoreCase("BI"))
                    iType = Font.BOLD + Font.ITALIC;
            } else
                return false;
            if (st.hasMoreTokens()) {
                // font size
                sFont = st.nextToken();
                try {
                    iSize = Integer.parseInt(sFont);
                } catch (Exception e) {
                    return false;
                }
            } else
                return false;
            try {
                f = new Font(sFont, iType, iSize);
            } catch (Exception e) {
                return false;
            }

            if (st.hasMoreTokens()) {
                // text color
                sFont = st.nextToken();
                c1 = ik.makeColor(sFont);
            } else
                return false;
            if (st.hasMoreTokens()) {
                // text background
                sFont = st.nextToken();
                c2 = ik.makeColor(sFont);
            } else
                return false;

            if (sp == null)
                sp = new ScrollPanel();
            sp.setInfoProperties(f, c1, c2);
            return true;
        }

        /*----------------------------------*
         *  set the scrolling panel border  *
         *----------------------------------*/
        else if (property == SET_SCROLL_BORDER) {
            String sType = value.toString();
            Color c = Color.black;
            int i = 1;
            if (sp == null)
                sp = new ScrollPanel();
            if (sType.toLowerCase().startsWith("line")) {
                StringTokenizer st = new StringTokenizer(sType, ",");
                if (st.hasMoreTokens()) {
                    // type
                    sType = st.nextToken();
                }
                if (st.hasMoreTokens()) {
                    // color
                    String sc = st.nextToken();
                    c = ik.makeColor(sc);
                }
                i = 1;
                if (st.hasMoreTokens()) {
                    // line size
                    String sc = st.nextToken();
                    try {
                        i = Integer.parseInt(sc);
                    } catch (Exception e) {
                        return false;
                    }
                }
            }
            sp.setBorderPanel(sType, c, i);
            return true;
        }

        /*---------------------------------*
         *  set the scrolling panel font   *
         *---------------------------------*/
        else if (property == SET_SCROLL_FONT) {
            String sFont = null;
            int iSize = 12;
            String s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            // font
            if (st.hasMoreTokens()) {
                sFont = st.nextToken();
            } else
                return false;
            // size
            if (st.hasMoreTokens()) {
                try {
                    iSize = Integer.parseInt(st.nextToken());
                } catch (Exception e) {
                    return false;
                }
            }
            if (sp == null) {
                sp = new ScrollPanel();
            }
            sp.setFont(sFont, iSize);
            return true;
        }


        /*---------------------------------*
         *  set the scrolling panel color  *
         *---------------------------------*/
        else if (property == SET_SCROLL_COLOR) {
            String s = value.toString();
            Color c = ik.makeColor(s);
            if (sp == null)
                sp = new ScrollPanel();
            sp.setPanelColor(c);
            return true;
        }

        /*---------------------------------------*
         *   set the horizontal scrollbar rule   *
         *---------------------------------------*/
        else if (property == SET_SCROLL_HTOOLB) {
            String s = value.toString().toLowerCase();
            if (sp == null)
                sp = new ScrollPanel();
            if (s.equalsIgnoreCase("true"))
                sp.setHorizontalToolbar(true);
            else
                sp.setHorizontalToolbar(false);
            return true;
        }

        /*-------------------------------------*
         *   set the vertical scrollbar rule   *
         *-------------------------------------*/
        else if (property == SET_SCROLL_VTOOLB) {
            String s = value.toString().toLowerCase();
            if (sp == null)
                sp = new ScrollPanel();
            if (s.equalsIgnoreCase("true"))
                sp.setVerticalToolbar(true);
            else
                sp.setVerticalToolbar(false);
            return true;
        }

        /*------------------------------------*
         *    display in seperate frame ?     *
         *------------------------------------*/
        else if (property == SET_SCROLL_FRAME) {
            String s = value.toString().toLowerCase();
            String sF = null;
            if (sp == null)
                sp = new ScrollPanel();
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                sF = st.nextToken();
                if (sF.equalsIgnoreCase("true"))
                    bScrollFrame = true;
                else
                    bScrollFrame = false;
            }
            if (st.hasMoreTokens()) {
                sFrameTitle = st.nextToken();
            }
            return true;
        }

        /*------------------------*
         *   user can escape ?    *
         *------------------------*/
        else if (property == SET_SCROLL_ESCAPE) {
            String s = value.toString().toLowerCase();
            if (sp == null)
                sp = new ScrollPanel();
            if (s.equalsIgnoreCase("true"))
                sp.setEscape(true);
            else
                sp.setEscape(false);
            return true;
        }

        /*-----------------------*
         *   set the Link rule   *
         *-----------------------*/
        else if (property == SET_SCROLL_LINKS) {
            String s = value.toString().toLowerCase();
            if (sp == null)
                sp = new ScrollPanel();
            if (s.equalsIgnoreCase("true"))
                sp.setLinks(true);
            else
                sp.setLinks(false);
            return true;
        }

        /*---------------------------------*
         *   set the scrolling log mode    *
         *---------------------------------*/
        else if (property == SET_SCROLL_LOG) {
            String s = value.toString().toLowerCase();
            if (sp == null)
                sp = new ScrollPanel();
            if (s.equalsIgnoreCase("true"))
                sp.setLog(true);
            else
                sp.setLog(false);
            return true;
        }

        /*-------------------------------*
         *   set the scrolling opaque    *
         *-------------------------------*/
        else if (property == SET_SCROLL_OPAQUE) {
            String s = value.toString().toLowerCase();
            if (sp == null)
                sp = new ScrollPanel();
            if (s.equalsIgnoreCase("true"))
                sp.setPanelOpaque(true);
            else
                sp.setPanelOpaque(false);
            return true;
        }

        /*---------------------------------*
         *  show/hide the scrolling panel  *
         *---------------------------------*/
        else if (property == SHOW_SCROLL_PANEL) {
            String s = value.toString().toLowerCase();
            if (sp != null) {
                if (s.equalsIgnoreCase("true"))
                    sp.setVisible(true);
                else {
                    sp.stopTimer();
                    sp.setVisible(false);
                    sp = null;
                }
            }
            return true;
        }

        /*----------------------*
         *    create a Robot    *
         *----------------------*/
        else if (property == CREATE_ROBOT) {
            try {
                robot = new Robot();
                //robot.waitForIdle();
                bRobotOK = true;
            } catch (AWTException e) {
                print("Unable to create a Robot");
                return false;
            }
            return true;
        }

        /*----------------------*
         *   execute a  Robot   *
         *   command            *
         *----------------------*/
        else if (property == SET_ROBOT_STEP) {
            boolean b = true;
            if (robot != null) {
                bRobotOK = true;
                String s = value.toString().toLowerCase();
                try {
                    b = doRobotOrder(s);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            return true;
        }

        /*-----------------------*
         *   read  Robot orders  *
         *   from a file         *
         *-----------------------*/
        else if (property == SET_ROBOT_FILE_NAME) {
            boolean b = true;
            bRobotOK = true;
            if (robot != null) {
                String s = value.toString();
                if (s != null) {
                    sRobotFileName = s;
                    b = readFile();
                }
            }
            return b;
        }

        /*---------------------------*
         *   abort the Robot script  *
         *---------------------------*/
        else if (property == SET_ROBOT_ABORT_SCRIPT) {
            bRobotOK = false;
            return true;
        }

        /*----------------------*
         *   set the Bubble     *
         *   properties         *
         *----------------------*/
        else if (property == SET_ROBOT_BUBBLE_PROPS) {
            String s = value.toString();
            String s1 = "", sFont = "Verdana";
            Color c1 = null, c2 = null;
            int iType = Font.PLAIN, iSize = 12;
            StringTokenizer st = new StringTokenizer(s, ",");

            // font
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-"))
                    sFont = s1;
            }

            // font type
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    if (s1.equalsIgnoreCase("b"))
                        iType = Font.BOLD;
                    else if (s1.equalsIgnoreCase("i"))
                        iType = Font.ITALIC;
                    else if (s1.equalsIgnoreCase("bi"))
                        iType = Font.BOLD + Font.ITALIC;
                }
            }

            // font size
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    try {
                        iSize = Integer.parseInt(s1);
                    } catch (Exception e) {
                    }
                }
            }

            try {
                Font f = new Font(sFont, iType, iSize);
                fBubbleFont = f;
            } catch (Exception e) {
            }

            // foreground color
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                cBubbleFore = ik.makeColor(s1);
            }

            // background color
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                cBubbleBack = ik.makeColor(s1);
            }

            return true;
        }


        /*----------------------*
         *   set the Text       *
         *   properties         *
         *----------------------*/
        else if (property == SET_ROBOT_TEXT_PROPS) {
            String s = value.toString();
            String s1 = "", sFont = "Verdana";
            Color c1 = null, c2 = null;
            int iType = Font.PLAIN, iSize = 12;
            StringTokenizer st = new StringTokenizer(s, ",");

            // font
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-"))
                    sFont = s1;
            }

            // font type
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    if (s1.equalsIgnoreCase("b"))
                        iType = Font.BOLD;
                    else if (s1.equalsIgnoreCase("i"))
                        iType = Font.ITALIC;
                    else if (s1.equalsIgnoreCase("bi"))
                        iType = Font.BOLD + Font.ITALIC;
                }
            }

            // font size
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    try {
                        iSize = Integer.parseInt(s1);
                    } catch (Exception e) {
                    }
                }
            }

            try {
                Font f = new Font(sFont, iType, iSize);
                fTextFont = f;
            } catch (Exception e) {
            }

            // text color
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-"))
                    cTextColor = ik.makeColor(s1);
            }

            // text shadow color
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-"))
                    cTextShadow = ik.makeColor(s1);
            }

            // shadow border color
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-"))
                    cTextFore = ik.makeColor(s1);
                else
                    cTextFore = null;
            }

            // shadow background color
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-"))
                    cTextBack = ik.makeColor(s1);
                else
                    cTextBack = null;
            }

            return true;
        }

        /*----------------------*
         *  Display a bubble    *
         *----------------------*/
        else if (property == SET_ROBOT_BUBBLE) {
            final String sv = value.toString();

            try {

                new Thread() {
                    public void run() {
                        String s = sv;
                        StringBuffer sb = new StringBuffer();
                        int iPos = 0, iX = 0, iY = 0, iW = 0, iH = 0, iDelay = 0, iLines = 0;
                        StringTokenizer st = new StringTokenizer(s, ",");
                        if (st.hasMoreTokens()) {
                            iDelay = Integer.parseInt(st.nextToken());
                        }
                        if (st.hasMoreTokens()) {
                            iX = Integer.parseInt(st.nextToken());
                        }
                        if (st.hasMoreTokens()) {
                            iY = Integer.parseInt(st.nextToken());
                        }
                        if (st.hasMoreTokens()) {
                            iW = Integer.parseInt(st.nextToken());
                        }
                        if (st.hasMoreTokens()) {
                            iH = Integer.parseInt(st.nextToken());
                        }
                        if (st.hasMoreTokens()) {
                            while (st.hasMoreTokens())
                                sb.append(st.nextToken() + ",");
                            s = sb.toString().substring(0, sb.length() - 1);
                        }

                        try {
                            JPanel jp = new JPanel(new BorderLayout());
                            JTextPane jta = new JTextPane();
                            jta.setContentType("text/plain");
                            jta.setEditable(false);
                            if (s.toLowerCase().trim().startsWith("<html>")) {
                                jta.setContentType("text/html");
                                jta.setText(s);
                                MutableAttributeSet attrs = jta.getInputAttributes();
                                StyleConstants.setFontFamily(attrs, fBubbleFont.getFamily());
                                StyleConstants.setFontSize(attrs, fBubbleFont.getSize());
                                StyleConstants.setForeground(attrs, cBubbleFore);
                                StyledDocument doc = jta.getStyledDocument();
                                doc.setCharacterAttributes(0, doc.getLength() + 1, attrs, false);
                            } else {
                                jta.setText(s);
                                jta.setFont(fBubbleFont);
                                jta.setForeground(cBubbleFore);
                            }
                            jp.add(jta, BorderLayout.CENTER);
                            jta.setBackground(cBubbleBack);
                            jp.setLocation(iX, iY);
                            jp.setSize(iW, iH);
                            jp.setBackground(cBubbleBack);
                            jp.setBorder(BorderFactory.createRaisedBevelBorder());
                            jp.setVisible(true);
                            VB.getParent().add(jp, 0);
                            try {
                                Thread.sleep(iDelay);
                            } catch (Exception e) {
                            }
                            VB.getParent().remove(jp);
                            jp = null;
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                }.start();

            } catch (Exception e) {
                e.printStackTrace();
            }
            return true;
        }


        /*----------------------*
         *   Display a shape    *
         *----------------------*/
        else if (property == SET_ROBOT_SHAPE) {
            final String sv = value.toString();

            try {

                new Thread() {
                    public void run() {
                        String s = sv;
                        int iDelay = 0, iShadow = 0, i = 0;
                        LAFPanel jp = new LAFPanel();
                        StringBuffer sb = new StringBuffer();
                        StringTokenizer st = new StringTokenizer(s, ",");
                        if (st.hasMoreTokens()) {
                            iShadow = Integer.parseInt(st.nextToken());
                        }
                        if (st.hasMoreTokens()) {
                            iDelay = Integer.parseInt(st.nextToken());
                        }

                        while (st.hasMoreTokens()) {
                            if (i++ > 0)
                                sb.append(",");
                            sb.append(st.nextToken());
                        }
                        try {
                            jp.setShape(sb.toString());
                            jp.setShadow(iShadow);
                            jp.setTextFont(fTextFont);
                            jp.setColors(cShapeFore, cShapeBack);
                            jp.setTextColors(cTextColor, cTextShadow, cTextBack, cTextFore);
                            jp.setDash(iDash1, iDash2);
                            jp.setBGTrsp(fRobotBGTrsp);
                            jp.setLocation(0, 0);
                            jp.setSize(VB.getParent().getSize());
                            jp.setBackground(null);
                            jp.setBorder(null);
                            jp.setOpaque(false);
                            jp.setVisible(true);
                            VB.getParent().add(jp, 0);
                            jp.draw();
                            try {
                                Thread.sleep(iFlashDelay);
                            } catch (Exception e) {
                            }
                            jp.finish();
                            try {
                                Thread.sleep(800);
                            } catch (Exception e) {
                            }
                            VB.getParent().remove(jp);
                            jp.destroy();
                            jp = null;
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                }.start();

            } catch (Exception e) {
                e.printStackTrace();
            }
            return true;
        }


        /*----------------------*
         *   set the Shape      *
         *   properties         *
         *----------------------*/
        else if (property == SET_ROBOT_SHAPE_PROPS) {
            String s = value.toString();
            String s1 = "", sFont = "Verdana";
            Color c1 = null, c2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");

            // foreground color
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                cShapeFore = ik.makeColor(s1);
            }

            // background color
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-"))
                    cShapeBack = ik.makeColor(s1);
            }

            // dash draw
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    try {
                        iDash1 = Integer.parseInt(s1);
                    } catch (Exception e) {
                        print("LAF Shape - Invalid dash number:" + s1);
                        return false;
                    }
                }
            }

            // dash gap
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    try {
                        iDash2 = Integer.parseInt(s1);
                    } catch (Exception e) {
                        print("LAF Shape - Invalid dash number:" + s1);
                        return false;
                    }
                }
            }

            // backgroud transmarency
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-")) {
                    try {
                        fRobotBGTrsp = Float.parseFloat(s1);
                    } catch (Exception e) {
                        print("LAF Shape - Invalid transparency number:" + s1);
                        return false;
                    }
                }
            }

            return true;
        }


        /*-------------------------*
         *   menu size indication  *
         *-------------------------*/
        else if (property == SET_ROBOT_INFO_MENU) {
            String s = value.toString();
            if (s.equalsIgnoreCase("nomenu")) {
                iMenuHeight = 0;
                iSBarHeight = 0;
            } else if (s.equalsIgnoreCase("default")) {
                iMenuHeight = 24;
                iSBarHeight = 0;
            } else if (s.equalsIgnoreCase("default&smartbar")) {
                iMenuHeight = 24;
                iSBarHeight = 26;
            }
            return true;
        }


        /*--------------------------*
         *   Robot  request for a   *
         *   Forms information      *
         *--------------------------*/
        else if (property == SET_ROBOT_INFOS) {
            String s = value.toString();
            int iX = 0, iY = 0;
            log("LAF - Set_Robot_Info():" + s);
            int i = 0;
            StringTokenizer st = new StringTokenizer(s, ",");
            try {
                if (robot != null) {
                    while (st.hasMoreTokens()) {
                        sRobots[i++] = st.nextToken();
                    }
                    iX = formsTopFrame.getLocation().x + Integer.parseInt(sRobots[2]);
                    iY = 52 + iMenuHeight + iSBarHeight + formsTopFrame.getLocation().y + Integer.parseInt(sRobots[3]);

                    if (sRobots[1].equalsIgnoreCase("mousemove")) {
                        doRobotOrder(sRobots[1].toLowerCase() + "," + iX + "," + iY);
                    }
                }
            } catch (Exception e) {
                bRobotOK = false;
            }
            return true;
        }


        /*----------------------*
         *   execute a  Robot   *
         *   Forms built-in     *
         *----------------------*/
        else if (property == SET_ROBOT_FORMS_STEP) {
            if (robot != null) {
                String s = value.toString();
                String s1 = "", pm = "";
                int i1 = -1, i2 = -1;
                log("Set_Robot_Forms_Step():" + s);
                if (s != null) {
                    i1 = s.indexOf("(");
                    i2 = s.indexOf(")");
                    if (i1 != -1 && i2 != -1) {
                        s1 = s.substring(i1 + 1, i2);
                        s = s.substring(0, i1 + 1) + ")";
                    }
                    try {
                        CustomEvent ce = new CustomEvent(m_handler, SET_ROBOT_FORMS_STEP);
                        m_handler.setProperty(SET_ROBOT_FORMS_BLT, s);
                        m_handler.setProperty(SET_ROBOT_FORMS_PMT, s1);
                        dispatchCustomEvent(ce);
                    } catch (Exception e) {
                        print("Set_Robot_Forms_Step(): -> exception while dispatching: " + e);
                        e.printStackTrace();
                    }

                }
            }
            return true;
        }

        /*--------------------------------*
         *   execute a  Robot             *
         *   Forms group of built-ins     *
         *--------------------------------*/
        else if (property == SET_ROBOT_FORMS_STEPS) {
            if (robot != null) {

                String s = value.toString();

                if (s.equalsIgnoreCase("[START]")) {
                    sbRobot = new StringBuffer();
                    bRobotOK = true;
                } else if (s.equalsIgnoreCase("[END]")) {
                    try {

                        new Thread() {
                            public void run() {
                                String s = sbRobot.toString();
                                String s2 = null, s1 = "", s3 = "";
                                int i1 = -1, i2 = -1;
                                try {
                                    StringTokenizer st = new StringTokenizer(s, "\n");
                                    while (st.hasMoreTokens() && bRobotOK) {
                                        s2 = st.nextToken();
                                        s1 = "";
                                        s3 = s2;

                                        if (s2 != null && (!s2.startsWith("#"))) {
                                            i1 = s2.indexOf("(");
                                            i2 = s2.indexOf(")");
                                            if (i1 != -1 && i2 != -1) {
                                                s1 = s2.substring(i1 + 1, i2);
                                                s3 = s2.substring(0, i1 + 1) + ")";
                                            }
                                            log("LAF - Set_Robot_Forms_Steps():" + s3 + " - " + s1);
                                            if (s2.toLowerCase().startsWith("mouse_press")) {
                                                doRobotOrder("mousepress," + s1);
                                                doRobotOrder("mouserelease," + s1);
                                            } else if (s2.toLowerCase().startsWith("paste")) {
                                                doRobotOrder("paste," + s1);
                                            } else if (s2.toLowerCase().startsWith("send_key")) {
                                                doRobotOrder("keypress," + getKeyStroke(s1));
                                            } else if (s2.toLowerCase().startsWith("wait")) {
                                                try {
                                                    int i3 = Integer.parseInt(s1);
                                                    iRobotWait = i3;
                                                } catch (Exception e) {
                                                }
                                            } else {
                                                try {
                                                    CustomEvent ce = new CustomEvent(m_handler, SET_ROBOT_FORMS_STEP);
                                                    m_handler.setProperty(SET_ROBOT_FORMS_BLT, s3);
                                                    m_handler.setProperty(SET_ROBOT_FORMS_PMT, s1);
                                                    dispatchCustomEvent(ce);
                                                } catch (Exception e) {
                                                    print("Set_Robot_Forms_Steps(): -> exception while dispatching: " +
                                                          e);
                                                    e.printStackTrace();
                                                    bRobotOK = false;
                                                }
                                            }
                                        }
                                        if (!s2.startsWith("#")) {
                                            try {
                                                Thread.sleep(iRobotWait);
                                            } catch (Exception e) {
                                            }
                                        }
                                    }
                                    // send End demo message to Forms
                                    try {
                                        CustomEvent ce = new CustomEvent(m_handler, SET_ROBOT_END);
                                        dispatchCustomEvent(ce);
                                    } catch (Exception e) {
                                        print("Set_Robot_Forms_Steps(): -> exception while dispatching: " + e);
                                        e.printStackTrace();
                                        bRobotOK = false;
                                    }
                                } catch (Exception e) {
                                    bRobotOK = false;
                                    e.printStackTrace();
                                }
                            }
                        }.start();

                    } catch (Exception e) {
                        bRobotOK = false;
                        e.printStackTrace();
                    }
                }

                else
                    sbRobot.append(s);
            }
            return true;
        }

        /*----------------------*
         *  destroy the Robot   *
         *----------------------*/
        else if (property == DESTROY_ROBOT) {
            if (robot != null)
                robot = null;
            return true;
        }


        /*-------------------------*
         *     add TexturePaint    *
         *-------------------------*/
        else if (property == ADD_TEXTUREPAINT) {
            String s = value.toString();
            String sName = null, sType = null;
            String sc = null;
            Color c1 = null, c2 = null, c3 = null;
            int iW = 0, iH = 0;
            String sPoints = null;
            TexturePaint tp = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            // shape name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            // shape style
            if (st.hasMoreTokens()) {
                sType = st.nextToken();
                if ((!sType.equalsIgnoreCase("shape")) && (!sType.equalsIgnoreCase("paint")) &&
                    (!sType.equalsIgnoreCase("image"))) {
                    print("Add_TexturePaint() shape type must be 'shape', 'paint' or 'image'");
                    return false;
                }
            } else
                return false;
            // background color
            if (st.hasMoreTokens()) {
                sc = st.nextToken();
                if (!sc.equalsIgnoreCase("-"))
                    c1 = ik.makeColor(sc);
            } else
                return false;
            // shape line color
            if (st.hasMoreTokens()) {
                sc = st.nextToken();
                if (!sc.equalsIgnoreCase("-"))
                    c2 = ik.makeColor(sc);
            } else
                return false;
            // shape background color
            if (st.hasMoreTokens()) {
                sc = st.nextToken();
                if (!sc.equalsIgnoreCase("-"))
                    c3 = ik.makeColor(sc);
            } else
                return false;
            // Width
            if (st.hasMoreTokens()) {
                sc = st.nextToken();
                if (!sType.equalsIgnoreCase("image")) {
                    try {
                        iW = Integer.parseInt(sc);
                    } catch (Exception e) {
                        print("Add_TexturePaint() Invalid Width");
                    }
                }
            } else
                return false;
            // Height
            if (st.hasMoreTokens()) {
                sc = st.nextToken();
                if (!sType.equalsIgnoreCase("image")) {
                    try {
                        iH = Integer.parseInt(sc);
                    } catch (Exception e) {
                        print("Add_TexturePaint() Invalid Height");
                    }
                }
            } else
                return false;
            // shape description
            if (st.hasMoreTokens()) {
                sPoints = st.nextToken();
            } else
                return false;

            // texturePaint creation
            if (sType.equalsIgnoreCase("shape"))
                tp = createTexturePaint(sName, iW, iH, c1, c2, c3, sPoints);
            else if (sType.equalsIgnoreCase("paint"))
                tp = createPixelTexturePaint(sName, iW, iH, sPoints);
            else
                tp = createImageTexturePaint(sPoints);

            // add it to the list
            if (tp != null)
                hTextures.put(sName, tp);
            else {
                print("unable to create Texture Paint:" + sName);
            }

            return true;
        }

        /*----------------------*
         *  set Canvas motif    *
         *----------------------*/
        else if (property == setMotif) {
            String s = value.toString();
            float f = 1.0f;
            StringTokenizer st = new StringTokenizer(s, ",");
            // motif name
            if (st.hasMoreTokens()) {
                sMotif = st.nextToken();
            } else
                return false;
            // motif alpha transparency
            if (st.hasMoreTokens()) {
                try {
                    f = Float.parseFloat(st.nextToken());
                    fMotif = f;
                } catch (Exception ex) {
                    print("setMotif(): Invalid transparency value");
                    return false;
                }
            }
            return true;
        }

        /*----------------------*
         *  add new button      *
         *----------------------*/
        else if (property == ADD_BUTTON) {
            String s = value.toString();
            Font fFont = new Font("Arial", Font.PLAIN, 8);
            int x = 0, y = 0, w = 0, h = 0;
            String sLabel, sTooltip, sName;
            StringTokenizer st = new StringTokenizer(s, ",");
            sName = st.nextToken(); // name
            sLabel = st.nextToken(); // label
            if (sLabel.equalsIgnoreCase("-"))
                sLabel = null;
            sTooltip = st.nextToken(); // tooltip
            if (sTooltip.equalsIgnoreCase("-"))
                sTooltip = null;
            x = Integer.parseInt(st.nextToken()); // X pos
            y = Integer.parseInt(st.nextToken()); // Y pos
            w = Integer.parseInt(st.nextToken()); // Width
            h = Integer.parseInt(st.nextToken()); // Height

            NewButton vb = new NewButton(sName, sLabel, sTooltip, x, y, w, h, m_handler);
            if (vb != null) {
                vb.setLAFBean(this);
                vb.setButtonName(sName);
                newItem ni = new newItem(vb, sName, "button", sLabel, sTooltip, x, y, w, h);
                vb.setProperty(ID.VISIBLE, new Boolean(true));
                vb.setProperty(ID.ENABLED, new Boolean(true));
                vb.setProperty(ID.BGPATTERN, null);
                vb.addMouseListener(ItemMouseListener("button", null));
                if (newItemPanel != null) {
                    newItemPanel.add(vb, 0);
                    ni.bOnPanel = true;
                } else
                    this.getParent().add(vb, 0);
                ListItems.add(ni);
                log("add button:" + sName + "  panel=" + ni.bOnPanel);
            }
            return true;
        }


        /*--------------------------*
         *  add standard textfield  *
         *--------------------------*/
        else if (property == ADD_TEXTFIELD) {
            String s = value.toString();
            Font fFont = new Font("Arial", Font.PLAIN, 12);
            int x = 0, y = 0, w = 0, h = 0;
            String sLabel, sTooltip, sName, sPrompt;
            String sBG = null, sFG = null;
            Color c1 = null, c2 = null;
            JLabel jbl = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            sName = st.nextToken(); // name
            sLabel = st.nextToken(); // label
            if (sLabel.equalsIgnoreCase("-"))
                sLabel = null;
            sTooltip = st.nextToken(); // tooltip
            if (sTooltip.equalsIgnoreCase("-"))
                sTooltip = null;
            x = Integer.parseInt(st.nextToken()); // X pos
            y = Integer.parseInt(st.nextToken()); // Y pos
            w = Integer.parseInt(st.nextToken()); // Width
            h = Integer.parseInt(st.nextToken()); // Height
            if (st.hasMoreElements()) {
                sBG = st.nextToken();
                c1 = ik.makeColor(sBG);
            }
            if (st.hasMoreElements()) {
                sFG = st.nextToken();
                c2 = ik.makeColor(sFG);
            }

            NewTextField vtf = new NewTextField();
            if (vtf != null) {
                vtf.setLAFBean(this);
                newItem ni = new newItem(vtf, sName, "textfield", sLabel, sTooltip, x, y, w, h);
                if (sLabel != null)
                    ni.setPrompt(sLabel);
                vtf.init(m_handler);
                vtf.setName(sName);
                vtf.setProperty(ID.VISIBLE, new Boolean(true));
                vtf.setProperty(ID.ENABLED, new Boolean(true));
                vtf.setProperty(ID.LOCATION, new Point(x, y));
                vtf.setProperty(ID.BORDER_BEVEL, BorderBevel.LOWERED);
                vtf.setLocation(x, y);
                if (sBG != null)
                    vtf.setProperty(ID.BACKGROUND, c1);
                if (sFG != null)
                    vtf.setProperty(ID.FOREGROUND, c2);
                vtf.setFont(fFont);
                vtf.setProperty(ID.SIZE, new Point(w, h));
                vtf.setProperty(ID.BGPATTERN, null);
                vtf.addMouseListener(ItemMouseListener("textfield", null));
                if (newItemPanel != null) {
                    newItemPanel.add(vtf, 0);
                    ni.bOnPanel = true;
                } else
                    this.getParent().add(vtf, 0);
                // prompt
                if (sLabel != null) {
                    if (newItemPanel != null) {
                        jbl = new JLabel(sLabel);
                        ni.jb = jbl;
                    }
                    ni.setPromptPosition();
                    if (newItemPanel == null) {
                        sPrompt =
                                "1," + sName + "^" + sLabel + "," + ni.iPX + "," + ni.iPY + ",Arial,plain,12,r0g0b0,.9";
                        setProperty(addText, sPrompt);
                    } else {
                        newItemPanel.add(jbl, 0);
                    }
                }
                ListItems.add(ni);
                log("add textfield:" + sName + "  panel=" + ni.bOnPanel);
            }
            return true;
        }


        /*------------------------*
         *  add  Swing textfield  *
         *------------------------*/
        else if (property == ADD_TEXTFIELD2) {
            String s = value.toString();
            Font fFont = new Font("Arial", Font.PLAIN, 12);
            int x = 0, y = 0, w = 0, h = 0;
            String sLabel, sTooltip, sName, sPrompt;
            String sBG = null, sFG = null;
            Color c1 = null, c2 = null;
            JLabel jbl = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            sName = st.nextToken(); // name
            sLabel = st.nextToken(); // label
            if (sLabel.equalsIgnoreCase("-"))
                sLabel = null;
            sTooltip = st.nextToken(); // tooltip
            if (sTooltip.equalsIgnoreCase("-"))
                sTooltip = null;
            x = Integer.parseInt(st.nextToken()); // X pos
            y = Integer.parseInt(st.nextToken()); // Y pos
            w = Integer.parseInt(st.nextToken()); // Width
            h = Integer.parseInt(st.nextToken()); // Height
            if (st.hasMoreElements()) {
                sBG = st.nextToken();
                c1 = ik.makeColor(sBG);
            }
            if (st.hasMoreElements()) {
                sFG = st.nextToken();
                c2 = ik.makeColor(sFG);
            }

            NewTextField2 vtf = new NewTextField2();
            if (vtf != null) {
                vtf.setLAFBean(this);
                newItem ni = new newItem(vtf, sName, "textfield2", sLabel, sTooltip, x, y, w, h);
                if (sLabel != null)
                    ni.setPrompt(sLabel);
                vtf.setName(sName);
                vtf.setLocation(x, y);
                if (sBG != null)
                    vtf.setBackground(c1);
                if (sFG != null)
                    vtf.setForeground(c1);
                vtf.setFont(fFont);
                vtf.setSize(w, h);
                vtf.addMouseListener(ItemMouseListener("textfield", null));
                vtf.setBorder(BorderFactory.createLoweredBevelBorder());
                if (newItemPanel != null) {
                    newItemPanel.add(vtf, 0);
                    ni.bOnPanel = true;
                } else
                    this.getParent().add(vtf, 0);
                // prompt
                if (sLabel != null) {
                    if (newItemPanel != null) {
                        jbl = new JLabel(sLabel);
                        ni.jb = jbl;
                    }
                    ni.setPromptPosition();
                    if (newItemPanel == null) {
                        sPrompt =
                                "1," + sName + "^" + sLabel + "," + ni.iPX + "," + ni.iPY + ",Arial,plain,12,r0g0b0,.9";
                        setProperty(addText, sPrompt);
                    } else {
                        newItemPanel.add(jbl, 0);
                    }
                }
                ListItems.add(ni);
                log("add textfield2:" + sName + "  panel=" + ni.bOnPanel);
            }
            return true;
        }


        /*----------------------------*
         *  add  Swing passwordfield  *
         *----------------------------*/
        else if (property == ADD_PASSWORDFIELD) {
            String s = value.toString();
            Font fFont = new Font("Arial", Font.PLAIN, 12);
            int x = 0, y = 0, w = 0, h = 0;
            String sLabel, sTooltip, sName, sPrompt;
            String sBG = null, sFG = null;
            Color c1 = null, c2 = null;
            JLabel jbl = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            sName = st.nextToken(); // name
            sLabel = st.nextToken(); // label
            if (sLabel.equalsIgnoreCase("-"))
                sLabel = null;
            sTooltip = st.nextToken(); // tooltip
            if (sTooltip.equalsIgnoreCase("-"))
                sTooltip = null;
            x = Integer.parseInt(st.nextToken()); // X pos
            y = Integer.parseInt(st.nextToken()); // Y pos
            w = Integer.parseInt(st.nextToken()); // Width
            h = Integer.parseInt(st.nextToken()); // Height
            if (st.hasMoreElements()) {
                sBG = st.nextToken();
                c1 = ik.makeColor(sBG);
            }
            if (st.hasMoreElements()) {
                sFG = st.nextToken();
                c2 = ik.makeColor(sFG);
            }

            NewPasswordField vtf = new NewPasswordField();
            if (vtf != null) {
                vtf.setLAFBean(this);
                newItem ni = new newItem(vtf, sName, "passwordfield", sLabel, sTooltip, x, y, w, h);
                if (sLabel != null)
                    ni.setPrompt(sLabel);
                vtf.setName(sName);
                vtf.setLocation(x, y);
                if (sBG != null)
                    vtf.setBackground(c1);
                if (sFG != null)
                    vtf.setForeground(c1);
                vtf.setFont(fFont);
                vtf.setSize(w, h);
                vtf.addMouseListener(ItemMouseListener("textfield", null));
                vtf.setBorder(BorderFactory.createLoweredBevelBorder());
                if (newItemPanel != null) {
                    newItemPanel.add(vtf, 0);
                    ni.bOnPanel = true;
                } else
                    this.getParent().add(vtf, 0);
                // prompt
                if (sLabel != null) {
                    if (newItemPanel != null) {
                        jbl = new JLabel(sLabel);
                        ni.jb = jbl;
                    }
                    ni.setPromptPosition();
                    if (newItemPanel == null) {
                        sPrompt =
                                "1," + sName + "^" + sLabel + "," + ni.iPX + "," + ni.iPY + ",Arial,plain,12,r0g0b0,.9";
                        setProperty(addText, sPrompt);
                    } else {
                        newItemPanel.add(jbl, 0);
                    }
                }
                ListItems.add(ni);
                log("add passwordfield:" + sName + "  panel=" + ni.bOnPanel);
            }
            return true;
        }


        /*---------------------*
         *  add  Swing JLabel  *
         *---------------------*/
        else if (property == ADD_LABEL) {
            String s = value.toString();
            Font fFont = new Font("Arial", Font.PLAIN, 12);
            int x = 0, y = 0, w = 0, h = 0;
            int iAlign = JLabel.LEFT;
            String sLabel, sName;
            String sAlign = null, sFG = null;
            Color c = Color.black;
            StringTokenizer st = new StringTokenizer(s, ",");
            sName = st.nextToken(); // name
            sLabel = st.nextToken(); // label
            x = Integer.parseInt(st.nextToken()); // X pos
            y = Integer.parseInt(st.nextToken()); // Y pos
            w = Integer.parseInt(st.nextToken()); // width
            h = Integer.parseInt(st.nextToken()); // height           
            if (st.hasMoreElements()) {
                sAlign = st.nextToken();
                if(sAlign.equalsIgnoreCase("C")){
                   iAlign = JLabel.CENTER; 
                }
                if(sAlign.equalsIgnoreCase("R")){
                   iAlign = JLabel.RIGHT; 
                }                
            }            
            if (st.hasMoreElements()) {
                sFG = st.nextToken();
                c = ik.makeColor(sFG);
            }
            JLabel lab = new JLabel(sLabel);
            lab.setHorizontalAlignment(iAlign);
            lab.setForeground(c);
            lab.setBounds(x, y, w, h);
            newItem ni = new newItem(lab, sName, "label", sLabel, "", x, y, w, h);
            lab.setName(sName);
            lab.setFont(fFont);
            if (newItemPanel != null) {
                newItemPanel.add(lab, 0);
                ni.bOnPanel = true;
            } else
                this.getParent().add(lab, 0);
            ListItems.add(ni);
            log("add label:" + sName + "  panel=" + ni.bOnPanel);
            return true;
        }

        /*--------------------------*
         *  add standard textarea   *
         *--------------------------*/
        else if (property == ADD_TEXTAREA) {
            String s = value.toString();
            Font fFont = new Font("Arial", Font.PLAIN, 12);
            int x = 0, y = 0, w = 0, h = 0;
            String sLabel, sTooltip, sName, sPrompt;
            String sBG = null, sFG = null;
            Color c1 = null, c2 = null;
            JLabel jbl = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            sName = st.nextToken(); // name
            sLabel = st.nextToken(); // label
            if (sLabel.equalsIgnoreCase("-"))
                sLabel = null;
            sTooltip = st.nextToken(); // action name
            if (sTooltip.equalsIgnoreCase("-"))
                sTooltip = null;
            x = Integer.parseInt(st.nextToken()); // X pos
            y = Integer.parseInt(st.nextToken()); // Y pos
            w = Integer.parseInt(st.nextToken()); // Width
            h = Integer.parseInt(st.nextToken()); // Height
            if (st.hasMoreElements()) {
                sBG = st.nextToken();
                c1 = ik.makeColor(sBG);
            }
            if (st.hasMoreElements()) {
                sFG = st.nextToken();
                c2 = ik.makeColor(sFG);
            }

            NewTextArea vta = new NewTextArea();
            if (vta != null) {
                vta.setLAFBean(this);
                newItem ni = new newItem(vta, sName, "textarea", sLabel, sTooltip, x, y, w, h);
                if (sLabel != null)
                    ni.setPrompt(sLabel);
                vta.init(m_handler);
                vta.setName(sName);
                vta.setProperty(ID.VISIBLE, new Boolean(true));
                vta.setProperty(ID.ENABLED, new Boolean(true));
                vta.setProperty(ID.LOCATION, new Point(x, y));
                vta.setProperty(ID.BORDER_BEVEL, BorderBevel.LOWERED);
                vta.setLocation(x, y);
                if (sBG != null)
                    vta.setProperty(ID.BACKGROUND, c1);
                if (sFG != null)
                    vta.setProperty(ID.FOREGROUND, c2);
                vta.setFont(fFont);
                vta.setProperty(ID.SIZE, new Point(w, h));
                vta.setProperty(ID.BGPATTERN, null);
                vta.addMouseListener(ItemMouseListener("textarea", null));
                if (newItemPanel != null) {
                    newItemPanel.add(vta, 0);
                    ni.bOnPanel = true;
                } else
                    this.getParent().add(vta, 0);
                // prompt
                if (sLabel != null) {
                    if (newItemPanel != null) {
                        jbl = new JLabel(sLabel);
                        ni.jb = jbl;
                    }
                    ni.setPromptPosition();
                    if (newItemPanel == null) {
                        sPrompt =
                                "1," + sName + "^" + sLabel + "," + ni.iPX + "," + ni.iPY + ",Arial,plain,12,r0g0b0,.9";
                        setProperty(addText, sPrompt);
                    } else {
                        newItemPanel.add(jbl, 0);
                    }
                }
                ListItems.add(ni);
                log("add textarea:" + sName + "  panel=" + ni.bOnPanel);
            }
            return true;
        }

        /*--------------------------*
         *   add Swing textarea     *
         *--------------------------*/
        else if (property == ADD_TEXTAREA2) {
            String s = value.toString();
            Font fFont = new Font("Arial", Font.PLAIN, 12);
            int x = 0, y = 0, w = 0, h = 0;
            String sLabel, sTooltip, sName, sPrompt;
            String sBG = null, sFG = null;
            Color c1 = null, c2 = null;
            JLabel jbl = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            sName = st.nextToken(); // name
            sLabel = st.nextToken(); // label
            if (sLabel.equalsIgnoreCase("-"))
                sLabel = null;
            sTooltip = st.nextToken(); // action name
            if (sTooltip.equalsIgnoreCase("-"))
                sTooltip = null;
            x = Integer.parseInt(st.nextToken()); // X pos
            y = Integer.parseInt(st.nextToken()); // Y pos
            w = Integer.parseInt(st.nextToken()); // Width
            h = Integer.parseInt(st.nextToken()); // Height
            if (st.hasMoreElements()) {
                sBG = st.nextToken();
                c1 = ik.makeColor(sBG);
            }
            if (st.hasMoreElements()) {
                sFG = st.nextToken();
                c2 = ik.makeColor(sFG);
            }

            NewTextArea2 vta = new NewTextArea2();
            JScrollPane sp = new JScrollPane(vta);
            sp.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
            sp.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
            if (vta != null) {
                vta.setLAFBean(this);
                newItem ni = new newItem(vta, sName, "textarea2", sLabel, sTooltip, x, y, w, h);
                if (sLabel != null)
                    ni.setPrompt(sLabel);
                ni.jsp = sp;
                vta.setName(sName);
                vta.setVisible(true);
                //vta.setLocation(x,y);
                sp.setLocation(x, y);
                if (sBG != null) {
                    sp.setBackground(c1);
                    vta.setBackground(c1);
                }
                if (sFG != null)
                    sp.setForeground(c1);
                vta.setFont(fFont);
                vta.setSize(w, h);
                sp.setSize(w, h);
                sp.setBorder(BorderFactory.createLoweredBevelBorder());
                vta.addMouseListener(ItemMouseListener("textarea2", null));
                if (newItemPanel != null) {
                    newItemPanel.add(sp, 0);
                    ni.bOnPanel = true;
                } else
                    this.getParent().add(sp, 0);
                // prompt
                if (sLabel != null) {
                    if (newItemPanel != null) {
                        jbl = new JLabel(sLabel);
                        ni.jb = jbl;
                    }
                    ni.setPromptPosition();
                    if (newItemPanel == null) {
                        sPrompt =
                                "1," + sName + "^" + sLabel + "," + ni.iPX + "," + ni.iPY + ",Arial,plain,12,r0g0b0,.9";
                        setProperty(addText, sPrompt);
                    } else {
                        newItemPanel.add(jbl, 0);
                    }
                }
                ListItems.add(ni);
                log("add textarea2:" + sName + "  panel=" + ni.bOnPanel);
            }
            return true;
        }


        /*--------------------------*
         *  add standard checkbox   *
         *--------------------------*/
        else if (property == ADD_CHECKBOX) {
            String s = value.toString();
            Font fFont = new Font("Arial", Font.PLAIN, 12);
            int x = 0, y = 0, w = 0, h = 0;
            String sLabel, sTooltip, sName, sPrompt;
            String sBG = null, sFG = null;
            Color c1 = Color.white, c2 = null;
            JLabel jbl = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            sName = st.nextToken(); // name
            sLabel = st.nextToken(); // label
            if (sLabel.equalsIgnoreCase("-"))
                sLabel = null;
            sTooltip = st.nextToken(); // tooltip
            if (sTooltip.equalsIgnoreCase("-"))
                sTooltip = null;
            x = Integer.parseInt(st.nextToken()); // X pos
            y = Integer.parseInt(st.nextToken()); // Y pos
            w = Integer.parseInt(st.nextToken()); // Width
            h = Integer.parseInt(st.nextToken()); // Height
            if (st.hasMoreElements()) {
                sBG = st.nextToken();
                c1 = ik.makeColor(sBG);
            }
            if (st.hasMoreElements()) {
                sFG = st.nextToken();
                c2 = ik.makeColor(sFG);
            }

            LAF_XP_CBox cb = new LAF_XP_CBox(this);
            if (cb != null) {
                newItem ni = new newItem(cb, sName, "checkbox", sLabel, sTooltip, x, y, w, h);
                cb.init(m_handler);
                cb.setName(sName);
                cb.setProperty(ID.VISIBLE, new Boolean(true));
                cb.setProperty(ID.ENABLED, new Boolean(true));
                cb.setProperty(ID.LOCATION, new Point(x, y));
                cb.setProperty(ID.BGPATTERN, null);
                cb.setSize(h, w);
                if (sLabel != null)
                    cb.setProperty(ID.LABEL, sLabel);
                cb.setLocation(x, y);
                //if(sBG != null)
                cb.setProperty(ID.BACKGROUND, c1);
                if (sFG != null)
                    cb.setProperty(ID.FOREGROUND, c2);
                //cb.setFont(fFont);
                cb.addMouseListener(ItemMouseListener("checkbox", null));
                if (newItemPanel != null) {
                    newItemPanel.add(cb, 0);
                    ni.bOnPanel = true;
                } else
                    this.getParent().add(cb, 0);
                ListItems.add(ni);
                log("add checkbox:" + sName + "  panel=" + ni.bOnPanel);
            }
            return true;
        }

        /*-----------------*
         *  add a slider   *
         *-----------------*/
        else if (property == ADD_SLIDER) {
            String s = value.toString();
            Font fFont = new Font("Arial", Font.PLAIN, 12);
            int x = 0, y = 0, w = 0, h = 0;
            int iMin = 0, iMax = 0, iMajor = 0, iMinor = 0, iVal = 0, iOrient = javax.swing.JSlider.HORIZONTAL;
            String s1, sName, sPrompt, sOrient = "h";
            String sBG = null, sFG = null;
            Color c1 = Color.white, c2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            sName = st.nextToken(); // name
            sOrient = st.nextToken(); // orientation
            try {
                x = Integer.parseInt(st.nextToken()); // X pos
                y = Integer.parseInt(st.nextToken()); // Y pos
                w = Integer.parseInt(st.nextToken()); // Width
                h = Integer.parseInt(st.nextToken()); // Height
            } catch (Exception ex) {
                print("ADD_SLIDER error: bad x,y,w or h value");
                return false;
            }
            if (st.hasMoreElements()) { // initial value
                try {
                    iVal = Integer.parseInt(st.nextToken());
                } catch (Exception ex) {
                    print("ADD_SLIDER error: bad initial value");
                    return false;
                }
            } else {
                print("ADD_SLIDER minimum value has to be given");
                return false;
            }
            if (st.hasMoreElements()) { // Min value
                s1 = st.nextToken();
                try {
                    if (!s1.equalsIgnoreCase("-"))
                        iMin = Integer.parseInt(s1);
                } catch (Exception ex) {
                    print("ADD_SLIDER error: bad minimum value");
                    return false;
                }
            } else {
                print("ADD_SLIDER minimum value has to be given");
                return false;
            }
            if (st.hasMoreElements()) { // Max value
                s1 = st.nextToken();
                try {
                    if (!s1.equalsIgnoreCase("-"))
                        iMax = Integer.parseInt(s1);
                } catch (Exception ex) {
                    print("ADD_SLIDER error: bad maximum value");
                    return false;
                }
            } else {
                print("ADD_SLIDER maximum value has to be given");
                return false;
            }
            if (st.hasMoreElements()) { // Major tick
                s1 = st.nextToken();
                try {
                    if (!s1.equalsIgnoreCase("-"))
                        iMajor = Integer.parseInt(s1);
                } catch (Exception ex) {
                    print("ADD_SLIDER error: bad Major tick value");
                    return false;
                }
            }
            if (st.hasMoreElements()) { // Minor tick
                s1 = st.nextToken();
                try {
                    if (!s1.equalsIgnoreCase("-"))
                        iMinor = Integer.parseInt(s1);
                } catch (Exception ex) {
                    print("ADD_SLIDER error: bad Minor tick value");
                    return false;
                }
            }
            if (st.hasMoreElements()) { // foreground color
                sFG = st.nextToken();
                if (!sFG.equalsIgnoreCase("-"))
                    c2 = ik.makeColor(sFG);
            }

            if (sOrient.equalsIgnoreCase("v"))
                iOrient = javax.swing.JSlider.VERTICAL;
            else
                iOrient = javax.swing.JSlider.HORIZONTAL;

            NewJSlider js = new NewJSlider(sName, iOrient, x, y, w, h, iVal, iMin, iMax);

            if (js != null) {
                newItem ni = new newItem(js, sName, "slider", null, null, x, y, w, h);
                if (iMajor + iMinor != 0)
                    js.setTicks(iMajor, iMinor);
                js.setLAFBean(this);
                js.setTicks(iMajor, iMinor);
                js.setName(sName);
                if (c2 != null)
                    js.setFGColor(c2);
                js.addMouseListener(ItemMouseListener("slider", null));
                if (newItemPanel != null) {
                    newItemPanel.add(js, 0);
                    ni.bOnPanel = true;
                } else
                    this.getParent().add(js, 0);
                ListItems.add(ni);
                log("add slider:" + sName + "  panel=" + ni.bOnPanel);
            }
            return true;
        }


        /*-------------------------*
         *  new item set panel     *
         *-------------------------*/
        else if (property == ITEM_SET_PANEL) {
            String s = value.toString();
            if (newItemPanel != null) {
                print("Panel already exists - delete it first before recreating it");
            }
            //Font fFont = new Font("Arial", Font.PLAIN, 12) ;
            int x = 0, y = 0, w = 0, h = 0;
            boolean bTransp = false;
            float f = 1.0f;
            String sBorder;
            Border border = null;
            String sBG = null, s2 = null;
            Color c1 = null, c2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreElements())
                sName = st.nextToken(); // name
            else
                return false;
            try {
                if (st.hasMoreElements())
                    x = Integer.parseInt(st.nextToken()); // X pos
                else
                    return false;
                if (st.hasMoreElements())
                    y = Integer.parseInt(st.nextToken()); // Y pos
                else
                    return false;
                if (st.hasMoreElements())
                    w = Integer.parseInt(st.nextToken()); // Width
                else
                    return false;
                if (st.hasMoreElements())
                    h = Integer.parseInt(st.nextToken()); // Height
                else
                    return false;
            } catch (Exception ex) {
                print("Item_Set_Panel Invalid numbers for X pos, Y pos, Width or Height");
                return false;
            }
            if (st.hasMoreElements()) {
                sBG = st.nextToken(); // background color
                if (!sBG.equalsIgnoreCase("-"))
                    c1 = ik.makeColor(sBG);
            }
            if (st.hasMoreElements()) {
                s2 = st.nextToken(); // panel transparency
                if (s2.equalsIgnoreCase("true"))
                    bTransp = true;
            }
            if (st.hasMoreElements()) {
                sBorder = st.nextToken(); // panel border
                if (sBorder.equalsIgnoreCase("line"))
                    border = BorderFactory.createLineBorder(Color.black);
                else if (sBorder.equalsIgnoreCase("raisedetched"))
                    border = BorderFactory.createEtchedBorder(EtchedBorder.RAISED);
                else if (sBorder.equalsIgnoreCase("loweredetched"))
                    border = BorderFactory.createEtchedBorder(EtchedBorder.LOWERED);
                else if (sBorder.equalsIgnoreCase("raisedbevel"))
                    border = BorderFactory.createRaisedBevelBorder();
                else if (sBorder.equalsIgnoreCase("loweredbevel"))
                    border = BorderFactory.createLoweredBevelBorder();
                else if (sBorder.equalsIgnoreCase("empty"))
                    border = BorderFactory.createEmptyBorder();
            }
            newItemPanel = new JPanel();
            newItemPanel.setLayout(null);
            if (border != null)
                newItemPanel.setBorder(border);
            newItemPanel.setLocation(x, y);
            newItemPanel.setSize(w, h);
            if (bTransp)
                newItemPanel.setOpaque(false);
            if (sBG != null)
                newItemPanel.setBackground(c1);
            this.getParent().add(newItemPanel, 0);
            return true;
        }

        /*-------------------------*
         *  new item delete panel  *
         *-------------------------*/
        else if (property == ITEM_DELETE_PANEL) {
            if (newItemPanel != null) {
                // delete items on the panel
                this.getParent().remove(newItemPanel);
                deleteAllItems(true);
                //this.getParent().remove(newItemPanel);
                newItemPanel = null;
            }
            return true;
        }

        /*-----------------------------*
         *  new item navigation type   *
         *-----------------------------*/
        else if (property == ITEM_NAVIGATION_INSIDE) {
            String s = value.toString();
            if (s.equalsIgnoreCase("true"))
                bItemNavInside = true;
            if (s.equalsIgnoreCase("false"))
                bItemNavInside = false;
            return true;
        }

        /*-----------------------*
         *  new item GO_ITEM     *
         *-----------------------*/
        else if (property == GO_ITEM) {
            String s = value.toString();
            int indice = getNewItemIndice(s);
            if (indice == -1) {
                print("Go_Item() item not found:" + s);
                return false;
            }
            newItem ni = (newItem)ListItems.get(indice);
            ((Component)ni.cp).requestFocus();
            return true;
        }

        /*--------------------------*
         *  new item delete item    *
         *--------------------------*/
        else if (property == DELETE_ITEM) {
            String s = value.toString();
            int indice = getNewItemIndice(s);
            if (indice == -1) {
                print("Delete_Item() item not found:" + s);
                return false;
            }
            newItem ni = (newItem)ListItems.get(indice);
            if (ni.bOnPanel) {
                if (ni.sType.equalsIgnoreCase("textarea2"))
                    newItemPanel.remove(ni.jsp);
                else
                    newItemPanel.remove(ni.cp);
                if (ni.jb != null) {
                    newItemPanel.remove(ni.jb);
                    ni.jb = null;
                }
            } else
                this.getParent().remove(ni.cp);
            ni.cp = null;
            if (ni.rect != null) {
                iNbNewItems--;
            }
            ListItems.remove(indice);
            // remove prompt
            //for (int i = 0; i < list_texts.size(); i++) {
                Texts t = (Texts)list_texts.get(s);
                if (t != null) {
                    //list_texts.remove(i);
                    t.bValid = false;
                    list_texts.put(s, t);
                    repaint();
                    //break;
                }
            //}
            return true;
        }

        /*-------------------------------*
         *  new item delete all items    *
         *-------------------------------*/
        else if (property == DELETE_ALL_ITEMS) {
            deleteAllItems(false);
            this.getParent().invalidate();
            return true;
        }

        /*-----------------------------*
         *  new item indice position   *
         *-----------------------------*/
        else if (property == ITEM_SET_INDICE) {
            String s = value.toString();
            int indice = -1;
            iNewItemIndice = getNewItemIndice(s);
            if (iNewItemIndice == -1) {
                print("Item_Set_Indice() item not found:" + s);
                return false;
            }
            return true;
        }

        /*----------------------------*
         *  new item panel property   *
         *----------------------------*/
        else if (property == NEW_ITEM_PANEL_PROPERTY) {
            String s = value.toString();
            if (newItemPanel == null) {
                print("New_Item_Panel Property() Panel does not exists");
                return false;
            }
            String sProp = null, s1 = null, s2 = null;
            int x, y, w, h;
            Color c = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            sProp = st.nextToken();
            if (!sProp.equalsIgnoreCase("SIZE") && !sProp.equalsIgnoreCase("LOCATION") &&
                !sProp.equalsIgnoreCase("VISIBLE") && !sProp.equalsIgnoreCase("OPAQUE") &&
                !sProp.equalsIgnoreCase("BGCOLOR")) {
                print("New_Item_Panel Property() property must be : SIZE,LOCATION,VISIBLE,OPAQUE or BGCOLOR");
                return false;
            }
            if (sProp.equalsIgnoreCase("SIZE")) {
                if (st.hasMoreElements())
                    s1 = st.nextToken();
                else
                    return false;
                if (st.hasMoreElements())
                    s2 = st.nextToken();
                else
                    return false;
                try {
                    x = Integer.parseInt(s1);
                    y = Integer.parseInt(s2);
                    newItemPanel.setSize(x, y);
                } catch (Exception ex) {
                    print("New_Item_Panel Property() invalid size");
                }
            } else if (sProp.equalsIgnoreCase("LOCATION")) {
                if (st.hasMoreElements())
                    s1 = st.nextToken();
                else
                    return false;
                if (st.hasMoreElements())
                    s2 = st.nextToken();
                else
                    return false;
                try {
                    x = Integer.parseInt(s1);
                    y = Integer.parseInt(s2);
                    newItemPanel.setLocation(x, y);
                } catch (Exception ex) {
                    print("New_Item_Panel Property() invalid location");
                }
            } else if (sProp.equalsIgnoreCase("VISIBLE")) {
                if (st.hasMoreElements())
                    s1 = st.nextToken();
                else
                    return false;
                if (s1.equalsIgnoreCase("true"))
                    newItemPanel.setVisible(true);
                else if (s1.equalsIgnoreCase("false"))
                    newItemPanel.setVisible(false);
            } else if (sProp.equalsIgnoreCase("OPAQUE")) {
                if (st.hasMoreElements())
                    s1 = st.nextToken();
                else
                    return false;
                if (s1.equalsIgnoreCase("true"))
                    newItemPanel.setOpaque(true);
                else if (s1.equalsIgnoreCase("false"))
                    newItemPanel.setOpaque(false);
                newItemPanel.repaint();
            } else if (sProp.equalsIgnoreCase("BGCOLOR")) {
                if (st.hasMoreElements())
                    s1 = st.nextToken();
                else
                    return false;
                c = ik.makeColor(s1);
                newItemPanel.setBackground(c);
            }
            return true;
        }

        /*----------------------*
         *  new item property   *
         *----------------------*/
        else if (property == NEW_ITEM_PROPERTY) {
            String s = value.toString();
            String sLabel, svalue, sName, sType;
            boolean b = false;
            int indice;
            int x, y, w, h;
            Border border = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            sName = st.nextToken();
            indice = getNewItemIndice(sName);
            if (indice == -1) {
                print("New_Item_Property() item not found:" + sName);
                return false;
            }
            newItem ni = (newItem)ListItems.get(indice);
            // what kind of item ?
            sType = ni.sType.toLowerCase();

            while (st.hasMoreElements()) {
                sLabel = st.nextToken().replace('^', ',');
                // ENABLED
                if (sLabel.startsWith("enabled=")) {
                    svalue = sLabel.replaceFirst("enabled=", "");
                    if (svalue.equalsIgnoreCase("true"))
                        b = true;
                    else if (svalue.equalsIgnoreCase("false"))
                        b = false;
                    else
                        return false;
                    if (sType.equalsIgnoreCase("button"))
                        ((NewButton)ni.cp).setEnable(b);
                    else
                        ((Component)ni.cp).setEnabled(b);
                }
                // Show in rectangle
                if (sLabel.startsWith("showinrect=")) {
                    svalue = sLabel.replaceFirst("showinrect=", "");
                    String s1 = null, s2 = null, s3 = null, s4 = null;
                    int ix, iy, iw, ih;
                    StringTokenizer st2 = new StringTokenizer(svalue, "-");
                    if (st2.hasMoreElements())
                        s1 = st2.nextToken();
                    else
                        return false; // x
                    if (st2.hasMoreElements())
                        s2 = st2.nextToken();
                    else
                        return false; // y
                    if (st2.hasMoreElements())
                        s3 = st2.nextToken();
                    else
                        return false; // width
                    if (st2.hasMoreElements())
                        s4 = st2.nextToken();
                    else
                        return false; // height
                    try {
                        if (s1.equalsIgnoreCase("start")) {
                            ix = 0;
                        } else
                            ix = Integer.parseInt(s1);
                        if (s2.equalsIgnoreCase("top")) {
                            iy = 0;
                        } else
                            iy = Integer.parseInt(s2);
                        if (s3.equalsIgnoreCase("end")) {
                            if (ni.bOnPanel) {
                                iw = newItemPanel.getWidth();
                            } else {
                                iw = jp.getWidth();
                            }
                        } else
                            iw = Integer.parseInt(s3);
                        if (s4.equalsIgnoreCase("bottom")) {
                            if (ni.bOnPanel) {
                                ih = newItemPanel.getHeight();
                            } else {
                                ih = jp.getHeight();
                            }
                        } else
                            ih = Integer.parseInt(s4);
                        Rectangle rect = new Rectangle(ix, iy, iw, ih);
                        ni.setRect(rect);
                        // set the component originally hidden
                        ((Component)ni.cp).setVisible(false);
                        ListItems.set(indice, ni);
                    } catch (Exception ex) {
                        print("DrawLAF.New_Item_Property(ShowInRect): Incorrect rectangle value:" + svalue);
                    }
                }
                // VISIBLE
                if (sLabel.startsWith("visible=")) {
                    svalue = sLabel.replaceFirst("visible=", "");
                    if (svalue.equalsIgnoreCase("true"))
                        b = true;
                    else if (svalue.equalsIgnoreCase("false"))
                        b = false;
                    else
                        return false;
                    ((Component)ni.cp).setVisible(b);
                    if(ni.jb != null) ni.jb.setVisible(b);
                    if (!ni.bOnPanel) {
                        for (int i = 0; i < list_texts.size(); i++) {
                            Texts t = (Texts)list_texts.get(i);
                            if ((t.sName != null) && t.sName.equalsIgnoreCase(sName)) {
                                t.bVisible = b ;
                                break;
                            }
                        }
                    }                    
                    if (sType.equalsIgnoreCase("image")){
                        ((NewImage)ni.cp).jsp.setVisible(b);
                    }
                }
                // DEFAULT
                if (sLabel.startsWith("default=")) {
                    svalue = sLabel.replaceFirst("default=", "");
                    if (svalue.equalsIgnoreCase("true"))
                        b = true;
                    else if (svalue.equalsIgnoreCase("false"))
                        b = false;
                    else
                        return false;
                    if (sType.equalsIgnoreCase("button"))
                        ((NewButton)ni.cp).setProperty(ID.IS_DEFAULT, new Boolean(b));
                }
                // VALUE
                if (sLabel.startsWith("value=")) {
                    svalue = sLabel.replaceFirst("value=", "");
                    if (sType.equalsIgnoreCase("textfield"))
                        ((NewTextField)ni.cp).setText(svalue);
                    else if (sType.equalsIgnoreCase("textfield2"))
                        ((NewTextField2)ni.cp).setText(svalue);
                    else if (sType.equalsIgnoreCase("textarea"))
                        ((NewTextArea)ni.cp).setText(svalue);
                    else if (sType.equalsIgnoreCase("textarea2"))
                        ((NewTextArea2)ni.cp).setText(svalue);
                    else if (sType.equalsIgnoreCase("checkbox"))
                        ((LAF_XP_CBox)ni.cp).setValue(svalue);
                    else if (sType.equalsIgnoreCase("slider"))
                        ((NewJSlider)ni.cp).setValue(Integer.parseInt(svalue));
                }
                // LABEL
                if (sLabel.startsWith("label=")) {
                    svalue = sLabel.replaceFirst("label=", "");
                    if (sType.equalsIgnoreCase("button"))
                        ((NewButton)ni.cp).setLabel(svalue);
                }
                // FONT
                if (sLabel.startsWith("font=")) {
                    svalue = sLabel.replaceFirst("font=", "");
                    String s1 = null, s2 = null, s3 = null;
                    int iType = Font.PLAIN, iSize = 12;
                    StringTokenizer st2 = new StringTokenizer(svalue, "-");
                    if (st2.hasMoreElements())
                        s1 = st2.nextToken();
                    else
                        return false;
                    if (st2.hasMoreElements())
                        s2 = st2.nextToken();
                    else
                        return false;
                    if (st2.hasMoreElements())
                        s3 = st2.nextToken();
                    else
                        return false;
                    if (s2.equalsIgnoreCase("N"))
                        iType = Font.PLAIN;
                    else if (s2.equalsIgnoreCase("B"))
                        iType = Font.BOLD;
                    else if (s2.equalsIgnoreCase("I"))
                        iType = Font.ITALIC;
                    else if (s2.equalsIgnoreCase("BI"))
                        iType = Font.BOLD + Font.ITALIC;
                    try {
                        iSize = Integer.parseInt(s3);
                        Font f = new Font(s1, iType, iSize);
                        if (sType.equalsIgnoreCase("button"))
                            ((NewButton)ni.cp).setFonte(f);
                        else
                            ((Component)ni.cp).setFont(f);
                    } catch (Exception ex) {
                        print("DrawLAF.New_Item_Property() Incorrect Font size:" + svalue);
                    }
                }
                // TEXTPOSITION
                if (sLabel.startsWith("textposition=")) {
                    if (sType.equalsIgnoreCase("button")) {
                        svalue = sLabel.replaceFirst("textposition=", "");
                        if (svalue.equalsIgnoreCase("left"))
                            ((NewButton)ni.cp).setTextPosition(1);
                        else if (svalue.equalsIgnoreCase("center"))
                            ((NewButton)ni.cp).setTextPosition(2);
                        else if (svalue.equalsIgnoreCase("right"))
                            ((NewButton)ni.cp).setTextPosition(3);
                    }
                }
                // IMAGEPOSITION
                if (sLabel.startsWith("imageposition=")) {
                    if (sType.equalsIgnoreCase("button")) {
                        svalue = sLabel.replaceFirst("imageposition=", "");
                        ((NewButton)ni.cp).setImagePosition(svalue);
                    }
                }
                // IMAGENAME
                if (sLabel.startsWith("imagename=")) {
                    if (sType.equalsIgnoreCase("image")){
                        ((NewImage)ni.cp).setLegend(sLabel.replaceFirst("imagename=", ""));
                    }
                }                
                // vertical scrolbar
                if (sLabel.startsWith("vscrollbar=")) {
                    svalue = sLabel.replaceFirst("vscrollbar=", "");
                    int i = JScrollPane.VERTICAL_SCROLLBAR_NEVER;
                    if (svalue.equalsIgnoreCase("AS_NEEDED"))
                        i = JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED;
                    else if (svalue.equalsIgnoreCase("ALWAYS"))
                        i = JScrollPane.VERTICAL_SCROLLBAR_ALWAYS;
                    else if (svalue.equalsIgnoreCase("NEVER"))
                        i = JScrollPane.VERTICAL_SCROLLBAR_NEVER;

                    JScrollPane sp = null;
                    try {
                        if (sType.equalsIgnoreCase("textarea")) {
                            sp = (JScrollPane)((NewTextArea)ni.cp).getParent().getParent();
                            if (null != sp)
                                sp.setVerticalScrollBarPolicy(i);
                        } else if (sType.equalsIgnoreCase("textarea2")) {
                            sp = (JScrollPane)((NewTextArea2)ni.cp).getParent().getParent();
                            if (null != sp)
                                sp.setVerticalScrollBarPolicy(i);
                        }
                    } catch (Exception e) {
                    }
                }
                // horizontal scrolbar
                if (sLabel.startsWith("hscrollbar=")) {
                    svalue = sLabel.replaceFirst("hscrollbar=", "");
                    int i = JScrollPane.HORIZONTAL_SCROLLBAR_NEVER;
                    if (svalue.equalsIgnoreCase("AS_NEEDED"))
                        i = JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED;
                    else if (svalue.equalsIgnoreCase("ALWAYS"))
                        i = JScrollPane.HORIZONTAL_SCROLLBAR_ALWAYS;
                    else if (svalue.equalsIgnoreCase("NEVER"))
                        i = JScrollPane.HORIZONTAL_SCROLLBAR_NEVER;

                    JScrollPane sp = null;
                    try {
                        if (sType.equalsIgnoreCase("textarea")) {
                            sp = (JScrollPane)((NewTextArea)ni.cp).getParent().getParent();
                            if (null != sp)
                                sp.setHorizontalScrollBarPolicy(i);
                        } else if (sType.equalsIgnoreCase("textarea2")) {
                            sp = (JScrollPane)((NewTextArea2)ni.cp).getParent().getParent();
                            if (null != sp)
                                sp.setHorizontalScrollBarPolicy(i);
                        }
                    } catch (Exception e) {
                    }
                }
                // EDITABLE
                if (sLabel.startsWith("editable=")) {
                    svalue = sLabel.replaceFirst("editable=", "");
                    b = false;
                    if (svalue.equalsIgnoreCase("true"))
                        b = true;
                    if (sType.equalsIgnoreCase("textfield"))
                        ((NewTextField)ni.cp).setEditable(b);
                    else if (sType.equalsIgnoreCase("textfield2"))
                        ((NewTextField2)ni.cp).setEditable(b);
                    else if (sType.equalsIgnoreCase("textarea"))
                        ((NewTextArea)ni.cp).setEnabled(b);
                    else if (sType.equalsIgnoreCase("textarea2"))
                        ((NewTextArea2)ni.cp).setEditable(b);
                }
                // CARET POSITION
                if (sLabel.startsWith("caretpos=")) {
                    svalue = sLabel.replaceFirst("caretpos=", "");
                    int iValue = 0;
                    try {
                        if (svalue.equalsIgnoreCase("start"))
                            iValue = 0;
                        else if (svalue.equalsIgnoreCase("end"))
                            iValue = 99999999;
                        else
                            iValue = Integer.parseInt(svalue);
                        if (iValue < 0)
                            iValue = 0;
                        if (sType.equalsIgnoreCase("textfield"))
                            ((NewTextField)ni.cp).setCaretPosition(iValue);
                        else if (sType.equalsIgnoreCase("textfield2"))
                            ((NewTextField2)ni.cp).setCaretPosition(iValue);
                        else if (sType.equalsIgnoreCase("textarea"))
                            ((NewTextArea)ni.cp).getTextArea().setCaretPosition(iValue);
                        else if (sType.equalsIgnoreCase("textarea2"))
                            ((NewTextArea2)ni.cp).setCaretPosition(iValue);
                    } catch (Exception e) {
                        print("DrawLAF.New_Item_Property() wrong value for CARETPOS: " + svalue);
                    }
                }
                // SELECTION
                if (sLabel.startsWith("selection=")) {
                    svalue = sLabel.replaceFirst("selection=", "");
                    int ipos = svalue.indexOf("-");
                    int iStart = 0, iEnd = 99999999;
                    if (svalue.equalsIgnoreCase("all") || (ipos > -1)) {
                        try {
                            if (!svalue.equalsIgnoreCase("all")) {
                                iStart = Integer.parseInt(svalue.substring(0, ipos)) - 1;
                                iEnd = Integer.parseInt(svalue.substring(ipos + 1)) - 1;
                            }
                            if (iStart < 1)
                                iStart = 1;
                            if (sType.equalsIgnoreCase("textfield")) {
                                ((NewTextField)ni.cp).setSelectionStart(iStart);
                                ((NewTextField)ni.cp).setSelectionEnd(iEnd);
                            } else if (sType.equalsIgnoreCase("textfield2")) {
                                ((NewTextField2)ni.cp).setSelectionStart(iStart);
                                ((NewTextField2)ni.cp).setSelectionEnd(iEnd);
                            } else if (sType.equalsIgnoreCase("textarea")) {
                                ((NewTextArea)ni.cp).getTextArea().setSelectionStart(iStart);
                                ((NewTextArea)ni.cp).getTextArea().setSelectionEnd(iEnd);
                            } else if (sType.equalsIgnoreCase("textarea2")) {
                                ((NewTextArea2)ni.cp).setSelectionStart(iStart);
                                ((NewTextArea2)ni.cp).setSelectionEnd(iEnd);
                            }
                        } catch (Exception e) {
                            print("DrawLAF.New_Item_Property() wrong value for SELECTION: " + svalue);
                        }
                    }
                }
                // Slider Paint Track
                if (sLabel.startsWith("slidertrack=")) {
                    svalue = sLabel.replaceFirst("slidertrack=", "");
                    if (sType.equalsIgnoreCase("slider")) {
                        if (svalue.equalsIgnoreCase("true"))
                            ((NewJSlider)ni.cp).setPaintTrack(true);
                        else if (svalue.equalsIgnoreCase("false"))
                            ((NewJSlider)ni.cp).setPaintTrack(false);
                    }
                }
                // Slider Paint Ticks
                if (sLabel.startsWith("sliderticks=")) {
                    svalue = sLabel.replaceFirst("sliderticks=", "");
                    if (sType.equalsIgnoreCase("slider")) {
                        if (svalue.equalsIgnoreCase("true"))
                            ((NewJSlider)ni.cp).setPaintTicks(true);
                        else if (svalue.equalsIgnoreCase("false"))
                            ((NewJSlider)ni.cp).setPaintTicks(false);
                    }
                }
                // Slider Paint Labels
                if (sLabel.startsWith("sliderlabels=")) {
                    svalue = sLabel.replaceFirst("sliderlabels=", "");
                    if (sType.equalsIgnoreCase("slider")) {
                        if (svalue.equalsIgnoreCase("true"))
                            ((NewJSlider)ni.cp).setPaintLabels(true);
                        else if (svalue.equalsIgnoreCase("false"))
                            ((NewJSlider)ni.cp).setPaintLabels(false);
                    }
                }
                // Slider invertion
                if (sLabel.startsWith("sliderinvert=")) {
                    svalue = sLabel.replaceFirst("sliderinvert=", "");
                    if (sType.equalsIgnoreCase("slider")) {
                        if (svalue.equalsIgnoreCase("true"))
                            ((NewJSlider)ni.cp).setInverted(true);
                        else if (svalue.equalsIgnoreCase("false"))
                            ((NewJSlider)ni.cp).setInverted(false);
                    }
                }
                // BGCOLOR
                if (sLabel.startsWith("bgcolor=")) {
                    svalue = sLabel.replaceFirst("bgcolor=", "");
                    Color c = ik.makeColor(svalue);
                    if (sType.equalsIgnoreCase("button"))
                        ((NewButton)ni.cp).setBGcolor(c);
                    else
                        ((Component)ni.cp).setBackground(c);
                }
                // FGCOLOR
                if (sLabel.startsWith("fgcolor=")) {
                    svalue = sLabel.replaceFirst("fgcolor=", "");
                    Color c = ik.makeColor(svalue);
                    if (sType.equalsIgnoreCase("button"))
                        ((NewButton)ni.cp).setFGcolor(c);
                    else
                        ((Component)ni.cp).setForeground(c);
                }
                // TOOLTIP
                if (sLabel.startsWith("tooltip=")) {
                    svalue = sLabel.replaceFirst("tooltip=", "");
                    if (sType.equalsIgnoreCase("button"))
                        ((NewButton)ni.cp).setTooltipText(svalue);
                    else if (sType.equalsIgnoreCase("textfield"))
                        ((NewTextField)ni.cp).setTooltipText(svalue);
                    else if (sType.equalsIgnoreCase("textfield2"))
                        ((NewTextField2)ni.cp).setToolTipText(svalue);
                    else if (sType.equalsIgnoreCase("textarea"))
                        ((NewTextArea)ni.cp).setTooltipText(svalue);
                    else if (sType.equalsIgnoreCase("textarea2"))
                        ((NewTextArea2)ni.cp).setToolTipText(svalue);
                    else if (sType.equalsIgnoreCase("checkbox"))
                        ((LAF_XP_CBox)ni.cp).setTooltipText(svalue);
                    else if (sType.equalsIgnoreCase("slider"))
                        ((NewJSlider)ni.cp).setToolTipText(svalue);
                }
                // LOCATION
                if (sLabel.startsWith("location=")) {
                    svalue = sLabel.replaceFirst("location=", "");
                    int ipos = svalue.indexOf('-');
                    if (ipos > -1) {
                        try {
                            x = Integer.parseInt(svalue.substring(0, ipos));
                            y = Integer.parseInt(svalue.substring(ipos + 1));
                            ((Component)ni.cp).setLocation(x, y);
                            ni.iX = x;
                            ni.iY = y;
                            ni.setPromptPosition();
                            if (!ni.bOnPanel) {
                                //for (int i = 0; i < list_texts.size(); i++) {
                                    Texts t = (Texts)list_texts.get(sName);
                                    if (t != null) {
                                        t.iX = ni.iPX;
                                        t.iY = ni.iPY;
                                        list_texts.put(sName, t);
                                        //break;
                                    }
                                //}
                            } else {
                                if (ni.jb != null) {
                                    ni.jb.setLocation(ni.iPX, ni.iPY);
                                }
                            }
                            ListItems.set(indice, ni);
                        } catch (Exception ex) {
                            print("DrawLAF.New_Item_Property() Incorrect Location:" + svalue);
                        }
                    }
                }
                // SIZE
                if (sLabel.startsWith("size=")) {
                    svalue = sLabel.replaceFirst("size=", "");
                    int ipos = svalue.indexOf('-');
                    if (ipos > -1) {
                        try {
                            w = Integer.parseInt(svalue.substring(0, ipos));
                            h = Integer.parseInt(svalue.substring(ipos + 1));
                            ((Component)ni.cp).setSize(w, h);
                            ni.iW = w;
                            ni.iH = h;
                            ListItems.set(indice, ni);
                        } catch (Exception ex) {
                            print("DrawLAF.New_Item_Property() Incorrect size:" + svalue);
                        }
                    }
                }
                // MAXLENGTH
                if (sLabel.startsWith("maxlength=")) {
                    svalue = sLabel.replaceFirst("maxlength=", "");
                    if (sType.startsWith("text")) {
                        try {
                            int m = Integer.parseInt(svalue);
                            if (sType.equalsIgnoreCase("textfield"))
                                ((oracle.forms.ui.VTextField)ni.cp).setProperty(ID.MAX_LENGTH, (Object)new Integer(m));
                            if (sType.equalsIgnoreCase("textfield2"))
                                ((NewTextField2)ni.cp).setMaxLength(m);
                            if (sType.equalsIgnoreCase("textarea"))
                                ((oracle.forms.ui.VTextArea)ni.cp).setProperty(ID.MAX_LENGTH, (Object)new Integer(m));
                            if (sType.equalsIgnoreCase("textarea2"))
                                ((NewTextArea2)ni.cp).setMaxLength(m);
                        } catch (Exception ex) {
                            print("DrawLAF.New_Item_Property() Incorrect length:" + svalue);
                        }
                    }
                }
                // IMAGEOFF
                if (sLabel.startsWith("imageoff=")) {
                    if (sType.equalsIgnoreCase("button")) {
                        svalue = sLabel.replaceFirst("imageoff=", "");
                        Image img = ik.loadImage(svalue);
                        if (img != null) {
                            ((NewButton)ni.cp).setImageOFF(img);
                            ((NewButton)ni.cp).setBTImage(img);
                        }
                    }
                }
                // IMAGEON
                if (sLabel.startsWith("imageon=")) {
                    if (sType.equalsIgnoreCase("button")) {
                        svalue = sLabel.replaceFirst("imageon=", "");
                        Image img = ik.loadImage(svalue);
                        if (img != null)
                            ((NewButton)ni.cp).setImageON(img);
                    }
                }
                // BORDER
                if (sLabel.startsWith("border=")) {
                    svalue = sLabel.replaceFirst("border=", "");
                    if (svalue.equalsIgnoreCase("line"))
                        border = BorderFactory.createLineBorder(Color.black);
                    else if (svalue.equalsIgnoreCase("raisedetched"))
                        border = BorderFactory.createEtchedBorder(EtchedBorder.RAISED);
                    else if (svalue.equalsIgnoreCase("loweredetched"))
                        border = BorderFactory.createEtchedBorder(EtchedBorder.LOWERED);
                    else if (svalue.equalsIgnoreCase("raisedbevel"))
                        border = BorderFactory.createRaisedBevelBorder();
                    else if (svalue.equalsIgnoreCase("loweredbevel"))
                        border = BorderFactory.createLoweredBevelBorder();
                    else if (svalue.equalsIgnoreCase("empty"))
                        border = BorderFactory.createEmptyBorder();
                    else
                        return false;
                    if (sType.equalsIgnoreCase("textfield2"))
                        ((NewTextField2)ni.cp).setBorder(border);
                    else if (sType.equalsIgnoreCase("textarea2"))
                        ((NewTextArea2)ni.cp).setBorder(border);
                }
                // OPAQUE
                if (sLabel.startsWith("opaque=")) {
                    svalue = sLabel.replaceFirst("opaque=", "");
                    if (svalue.equalsIgnoreCase("true"))
                        b = true;
                    else if (svalue.equalsIgnoreCase("false"))
                        b = false;
                    else
                        return false;
                    if (sType.equalsIgnoreCase("textfield2"))
                        ((NewTextField2)ni.cp).setOpaque(b);
                    else if (sType.equalsIgnoreCase("textarea2")) {
                        ((NewTextArea2)ni.cp).setOpaque(b);
                        JScrollPane jsp = (JScrollPane)ni.jsp;
                        jsp.setOpaque(b);
                        jsp.getViewport().setOpaque(b);
                    }
                }
                // PROMPT
                if (sLabel.startsWith("prompt=")) {
                    svalue = sLabel.replaceFirst("prompt=", "");
                    if (!sType.equalsIgnoreCase("button")) {
                        ni.sPrompt = svalue.replace((char)10, '\n');
                        ni.setPromptPosition();
                        if (!ni.bOnPanel) {
                            //for (int i = 0; i < list_texts.size(); i++) {
                                Texts t = (Texts)list_texts.get(sName);
                                if (t != null) {
                                    t.sLabel = ni.sPrompt;
                                    t.iX = ni.iPX;
                                    t.iY = ni.iPY;
                                    list_texts.put(sName, t);
                                    //break;
                                }
                            //}
                        } else {
                            if (ni.jb != null) {
                                ni.jb.setText(ni.sPrompt);
                            }
                        }
                        ListItems.set(indice, ni);
                    }
                }
                // PROMPT COLOR
                if (sLabel.startsWith("promptcolor=")) {
                    svalue = sLabel.replaceFirst("promptcolor=", "");
                    Color c = null;
                    if (!sType.equalsIgnoreCase("button")) {
                        c = ik.makeColor(svalue);
                        ni.cPrompt = c;
                        if (sType.equalsIgnoreCase("checkbox")) {
                            ni.cp.setForeground(c);
                        }
                        if (!ni.bOnPanel) {
                            //for (int i = 0; i < list_texts.size(); i++) {
                                Texts t = (Texts)list_texts.get(sName);
                                if (t != null) {
                                    t.color = c;
                                    list_texts.put(sName, t);
                                    repaint();
                                    //break;
                                }
                            //}
                        } else {
                            if (ni.jb != null) {
                                ni.jb.setForeground(c);
                            }
                        }
                        ListItems.set(indice, ni);
                    }
                }
                // PROMPT FONT
                if (sLabel.startsWith("promptfont=")) {
                    svalue = sLabel.replaceFirst("promptfont=", "");
                    Font f = null;
                    String s1 = null, s2 = null, s3 = null;
                    int iSize = 12, iWeight = Font.PLAIN;
                    if (!sType.equalsIgnoreCase("button") && !sType.equalsIgnoreCase("checkbox")) {
                        StringTokenizer st2 = new StringTokenizer(svalue, "-");
                        // font name
                        if (st2.hasMoreElements())
                            s1 = st2.nextToken();
                        else
                            return false;
                        // font weight
                        if (st2.hasMoreElements())
                            s2 = st2.nextToken();
                        else
                            return false;
                        // font size
                        if (st2.hasMoreElements())
                            s3 = st2.nextToken();
                        else
                            return false;
                        if (s2.equalsIgnoreCase("B"))
                            iWeight = Font.BOLD;
                        else if (s2.equalsIgnoreCase("I"))
                            iWeight = Font.ITALIC;
                        else if (s2.equalsIgnoreCase("BI"))
                            iWeight = Font.BOLD + Font.ITALIC;
                        try {
                            iSize = Integer.parseInt(s3);
                        } catch (Exception ex) {
                        }
                        f = new Font(s1, iWeight, iSize);
                        ni.fPrompt = f;
                        ni.setPromptPosition();
                        if (!ni.bOnPanel) {
                            //for (int i = 0; i < list_texts.size(); i++) {
                                Texts t = (Texts)list_texts.get(sName);
                                if (t != null) {
                                    t.font = f;
                                    t.iX = ni.iPX;
                                    t.iY = ni.iPY;
                                    list_texts.put(sName, t);
                                    repaint();
                                    //break;
                                }
                            //}
                        } else {
                            if (ni.jb != null) {
                                ni.jb.setFont(f);
                                ni.jb.repaint();
                            }
                        }
                        ListItems.set(indice, ni);
                    }
                }
                // PROMPTPOSITION
                if (sLabel.startsWith("promptposition=")) {
                    if (sType.startsWith("text") || sType.startsWith("image")) {
                        svalue = sLabel.replaceFirst("promptposition=", "");
                        ni.sPromptPos = svalue;
                        ni.setPromptPosition();
                        ListItems.set(indice, ni);
                        if (newItemPanel == null) {
                            //for (int i = 0; i < list_texts.size(); i++) {
                                Texts t = (Texts)list_texts.get(sName);
                                if (t != null) {
                                    t.sLabel = ni.sPrompt;
                                    t.iX = ni.iPX;
                                    t.iY = ni.iPY;
                                    list_texts.put(sName, t);
                                    //break;
                                }
                            //}
                        }
                    }
                }  
            }

            return true;
        }

        // print the memory
        else if (property == printMemory) {
            getMemory(" ");
            return true;
        }

        // -----------------
        //     new Image
        // -----------------
        else if (property == IMG_NEW) {
            String s = value.toString();
            String s1 = null, sImg = null, sLabel = null;
            int iX = 0, iY = 0, iW = 0, iH = 0;
            Color c = Color.white;
            int iThick = 0;
            JLabel jbl = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                s1 = st.nextToken();
            else
                return false;
            try {
                iX = Integer.parseInt(s1);
            } catch (Exception ex) {
                print("NewImage : Invalid Image X Pos:" + s1);
                return false;
            }
            if (st.hasMoreTokens())
                s1 = st.nextToken();
            else
                return false;
            try {
                iY = Integer.parseInt(s1);
            } catch (Exception ex) {
                print("NewImage : Invalid Image Y Pos:" + s1);
                return false;
            }
            if (st.hasMoreTokens())
                s1 = st.nextToken();
            else
                return false;
            try {
                iW = Integer.parseInt(s1);
            } catch (Exception ex) {
                print("NewImage : Invalid Image Width:" + s1);
                return false;
            }
            if (st.hasMoreTokens())
                s1 = st.nextToken();
            else
                return false;
            try {
                iH = Integer.parseInt(s1);
            } catch (Exception ex) {
                print("NewImage : Invalid Image Height:" + s1);
                return false;
            }
            // label ?
            if (st.hasMoreTokens()) {
                sLabel = st.nextToken();
            }

            if (st.hasMoreTokens())
                sImg = st.nextToken();
            NewImage nI = new NewImage(this, sName, iX, iY, iW, iH, sImg);
            nI.addMouseListener(ItemMouseListener("image", null));
            list_imgs.add(nI);
            newItem ni = new newItem(nI, sName, "image", sLabel, null, iX, iY, iW, iH);
            ListItems.add(ni);

            if (newItemPanel != null) {
                newItemPanel.add(nI.jsp, 0);
                ni.bOnPanel = true;
            } else
                this.getParent().add(nI.jsp, 0);

            // label
            if (sLabel != null) {
                if (newItemPanel != null) {
                    jbl = new JLabel(sLabel);
                    ni.jb = jbl;
                }
                ni.setPromptPosition();
                if (newItemPanel == null) {
                    String sPrompt =
                        "1," + sName + "^" + sLabel + "," + ni.iPX + "," + ni.iPY + ",Arial,plain,12,r0g0b0,.9";
                    setProperty(addText, sPrompt);
                } else {
                    newItemPanel.add(jbl, 0);
                }
            }

            return true;
        }

        // set image indice
        else if (property == IMG_SET_INDICE) {
            String sName = value.toString();
            iCurrentImage = getImageItemIndice(sName);
            return true;
        }
        // image delete
        else if (property == IMG_DELETE) {
            String sName = value.toString();
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                this.getParent().remove(ni.jsp);
                ni = null;
                list_imgs.remove(ni);
            }
            return true;
        }
        // all images delete
        else if (property == IMG_DELETE_ALL) {
            NewImage ni = null;
            for (int i = 0; i < list_imgs.size(); i++) {
                ni = (NewImage)list_imgs.get(i);
                this.getParent().remove(ni.jsp);
                ni = null;
            }
            list_imgs = new ArrayList(10);
            return true;
        }
        // image position
        else if (property == IMG_SETPOS) {
            String s = value.toString();
            String sName = null, s1 = null, s2 = null;
            int x = 0, y = 0;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                s1 = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                s2 = st.nextToken();
            else
                return false;
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                try {
                    x = Integer.parseInt(s1);
                    y = Integer.parseInt(s2);
                    ni.setImagePosition(x, y);
                } catch (Exception ex) {
                    print("setImagePosition() invalid coordinates");
                    return false;
                }
            }
            return true;
        }
        // image background color
        else if (property == IMG_SETBG) {
            String s = value.toString();
            String sName = null, sVal = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sVal = st.nextToken();
            else
                return false;
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.setImageBG(sVal);
            }
            return true;
        }
        // image log
        else if (property == IMG_SETLOG) {
            String s = value.toString();
            String sName = null, sVal = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sVal = st.nextToken();
            else
                return false;
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.setLog(sVal);
            }
            return true;
        }
        // clear image
        else if (property == IMG_CLEAR) {
            String sName = value.toString();
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.clearImage();
            }
            return true;
        }
        // read image from database
        else if (property == IMG_READIMGBASE) {
            String s = value.toString();
            String sName = null, sImage = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            sImage = s.replaceFirst(sName + ",", "");
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.readImageBase(sImage);
                ni.repaint();
            }
            return true;
        }
        // read image from file
        else if (property == IMG_READIMGFILE) {
            String s = value.toString();
            String sName = null, sFile = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sFile = st.nextToken();
            else
                return false;
            boolean b = true;
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                b = ni.readImageFile(sFile);
                ni.repaint();
            } else
                b = false;
            return b;
        }

        // image tooltip
        else if (property == IMG_SETTOOLTIP) {
            String s = value.toString();
            String sName = null, stt = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                stt = st.nextToken();
            else
                return false;
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.setTooltip(stt);
            }
            return true;
        }
        
        // allow Drag and drop
        else if (property == IMG_SETDND) {
            String s = value.toString();
            String s2=null;
            boolean b = false;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens()) {
                s2 = st.nextToken();            
                if (s2.equalsIgnoreCase("true"))
                    b = true ;
            }
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.setDragnDrop(b);
            }
            return true;
        }      
        // display image on doubleclick
        else if (property == IMG_SETSHOW) {
            String s = value.toString();
            String sName = null, sb = null;
            boolean b = false;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sb = st.nextToken();
            else
                return false;
            if (sb.equalsIgnoreCase("true")) {
                b = true ;
            }
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.bDblClickShowImg = b;
            }
            return true;
        }                 

        // image legend
        else if (property == IMG_SETLEGEND) {
            String s = value.toString();
            String sName = null, stt = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                stt = st.nextToken();
            else
                return false;
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.setLegend(stt);
            }
            return true;
        }

        //
        // center image
        else if (property == IMG_CENTERIMAGE) {
            String s = value.toString();
            String sName = null, s1 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                s1 = st.nextToken();
            else
                return false;
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.centerImage(s1);
            }
            return true;
        }
        // scale image
        else if (property == IMG_SCALEIMAGE) {
            String s = value.toString();
            String sName = null, s1 = null, s2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                s1 = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                s2 = st.nextToken();
            boolean b = true;
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                b = ni.scaleImage(s1 + "," + s2);
                ni.repaint();
            } else
                b = false;
            return b;
        }
        // set image scrollbars
        else if (property == IMG_SETSCROLL) {
            String s = value.toString();
            String sName = null, sVal = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sVal = st.nextToken();
            else
                return false;
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.scrollImage(sVal);
                ni.repaint();
            }
            return true;
        }
        // set image border
        else if (property == IMG_SETBORDER) {
            String s = value.toString();
            String sName = null, s1 = null, s2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                s1 = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                s2 = st.nextToken();
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.setImageBorder(s1, s2);
            }
            return true;
        } else if (property == IMG_SETFILECHOOSER) {
            String s = value.toString();
            String sName = null, s1 = null, s2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                s1 = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                s2 = st.nextToken();
            int iIndice = getImageItemIndice(sName);
            if (iIndice > -1) {
                NewImage ni = (NewImage)list_imgs.get(iIndice);
                ni.setFileChooser(s1, s2);
            }
            return true;
        } else if (property == IMG_SETCHOOSERLAF) {
            String s = value.toString();
            return true;
        }

        //
        // Popup menu properties
        //
        else if (property == CREATE_POPUP_MENU) {
            String s = value.toString();
            int x = 0, y = 0, w = 0, h = 0;
            boolean bTransp = false;
            float f = 1.0f;
            String sBorder, sPopup = null;
            ;
            Border border = null;
            String sBG = null, s2 = null;
            Color c1 = null, c2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreElements())
                sPopup = st.nextToken(); // name
            else
                return false;
            if (st.hasMoreElements()) {
                sBG = st.nextToken(); // background color
                if (!sBG.equalsIgnoreCase("-"))
                    c1 = ik.makeColor(sBG);
            }
            if (st.hasMoreElements()) {
                s2 = st.nextToken(); // panel transparency
                if (s2.equalsIgnoreCase("true"))
                    bTransp = true;
            }
            if (st.hasMoreElements()) {
                sBorder = st.nextToken(); // panel border
                if (sBorder.equalsIgnoreCase("line"))
                    border = BorderFactory.createLineBorder(Color.black);
                else if (sBorder.equalsIgnoreCase("raisedetched"))
                    border = BorderFactory.createEtchedBorder(EtchedBorder.RAISED);
                else if (sBorder.equalsIgnoreCase("loweredetched"))
                    border = BorderFactory.createEtchedBorder(EtchedBorder.LOWERED);
                else if (sBorder.equalsIgnoreCase("raisedbevel"))
                    border = BorderFactory.createRaisedBevelBorder();
                else if (sBorder.equalsIgnoreCase("loweredbevel"))
                    border = BorderFactory.createLoweredBevelBorder();
                else if (sBorder.equalsIgnoreCase("empty"))
                    border = BorderFactory.createEmptyBorder();
            }
            JPanel jp = new JPanel();
            jp.setLayout(null);
            if (border != null)
                jp.setBorder(border);
            jp.setLocation(x, y);
            jp.setSize(w, h);
            if (bTransp)
                jp.setOpaque(false);
            if (sBG != null)
                jp.setBackground(c1);

            PopMenu pm = new PopMenu(sPopup, jp);
            hPopups.put(sPopup, pm);
            jp = null;
            return true;
        }

        else if (property == ADD_POPUP_MENU_OPTION) {
            String s = value.toString();
            String sPopup = null, sName = null, sLabel = null;
            String sIcon = "-", sAlign = "LM", sTAlign = "center";
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreElements())
                sPopup = st.nextToken();
            else
                return false;
            // retrieve the popup
            PopMenu pm = (PopMenu)hPopups.get(sPopup);
            if (pm == null) {
                print("addPopupMenuOption() Parent popup not found:" + sPopup);
                return false;
            }
            if (st.hasMoreElements())
                sName = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sLabel = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sIcon = st.nextToken();
            if (st.hasMoreElements())
                sAlign = st.nextToken();
            if (st.hasMoreElements())
                sTAlign = st.nextToken();
            if (sTAlign.equalsIgnoreCase("-"))
                sTAlign = "center";
            // add option to Popup
            NewButton nb = new NewButton(sName, sLabel, null, 0, 0, 0, 0, m_handler);
            nb.setProperty(ID.VISIBLE, new Boolean(true));
            nb.setProperty(ID.ENABLED, new Boolean(true));
            nb.setProperty(ID.BGPATTERN, null);
            if (!sIcon.equalsIgnoreCase("-")) {
                Image img = ik.loadImage(sIcon);
                if (img != null) {
                    if (sAlign.equalsIgnoreCase("-"))
                        sAlign = "LM";
                    nb.setBTImage(img);
                    nb.setImagePosition(sAlign);
                }
            }
            if (sTAlign.equalsIgnoreCase("left"))
                nb.setTextPosition(1);
            else if (sTAlign.equalsIgnoreCase("center"))
                nb.setTextPosition(2);
            else
                nb.setTextPosition(3);
            nb.addMouseListener(ItemMouseListener("popup", pm.jp));
            pm.addMenuOption(nb, sName, sLabel);
            //pm.addMenuOption(sName, sLabel, sIcon, sTooltip, m_handler);
            hPopups.put(sPopup, pm);
            return true;
        }

        // set the current popup to display
        else if (property == SET_POPUP_MENU) {
            String s = value.toString();
            String sPopup = null, sBool = null, s1 = null;
            int x = 0, y = 0;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreElements())
                sPopup = st.nextToken();
            else
                return false;
            if (sPopup.equalsIgnoreCase("null"))
                sPopupMenu = null;
            else
                sPopupMenu = sPopup;
                // retrieve the popup
                PopMenu pm = (PopMenu)hPopups.get(sPopup);
                if (pm == null) {
                    print("setPopupMenu() Popup not found:" + sPopup);
                    return false;
                }            
            return true;
        }

        // remove a popup menu option
        else if (property == REMOVE_POPUP_MENU_OPTION) {
            String s = value.toString();
            String sPopup = null, sItem;
            int x = 0, y = 0;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreElements())
                sPopup = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sItem = st.nextToken();
            else
                return false;
            // retrieve the popup
            PopMenu pm = (PopMenu)hPopups.get(sPopup);
            if (pm == null) {
                print("removePopupMenuOption() Popup not found:" + sPopup);
                return false;
            }
            pm.removeMenuOption(sItem);
            return true;
        }

        // set a popup option property
        else if (property == SET_POPUP_MENU_OPTION_PROPERTY) {
            String s = value.toString();
            String sPopup = null, sItem = null, sProp = null, sValue = null;
            int x = 0, y = 0;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreElements())
                sPopup = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sItem = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sProp = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sValue = st.nextToken();
            else
                return false;
            // retrieve the popup
            PopMenu pm = (PopMenu)hPopups.get(sPopup);
            if (pm == null) {
                print("setPopupMenuOptionProperty() Popup not found:" + sPopup);
                return false;
            }
            // retrieve the option
            NewButton nb = (NewButton)pm.hOptions.get(sItem);
            if (nb == null) {
                print("setPopupMenuOptionProperty() option not found:" + sItem);
                return false;
            }
            if (sProp.equalsIgnoreCase("ENABLED")) {
                if (sValue.equalsIgnoreCase("true")) {
                    nb.setProperty(ID.ENABLED, new Boolean(true));
                    nb.setEnable(true);
                } else {
                    nb.setProperty(ID.ENABLED, new Boolean(false));
                    nb.setEnable(false);
                }
            } else if (sProp.equalsIgnoreCase("LABEL")) {
                pm.setOptionLabel(sItem, sValue);
                hPopups.put(sPopup, pm);
            } else if (sProp.equalsIgnoreCase("TOOLTIP")) {
                nb.setTooltipText(sValue);
                hPopups.put(sPopup, pm);
            } else if (sProp.equalsIgnoreCase("ICON")) {
                Image img = ik.loadImage(sValue);
                if (img != null) {
                    pm.setMenuIcon(sItem, img);
                    hPopups.put(sPopup, pm);
                }
            } else if (sProp.equalsIgnoreCase("ICON_POSITION")) {
                nb.setImagePosition(sValue);
                hPopups.put(sPopup, pm);
            } else if (sProp.equalsIgnoreCase("LABEL_POSITION")) {
                if (sValue.equalsIgnoreCase("left"))
                    nb.setTextPosition(1);
                else if (sValue.equalsIgnoreCase("center"))
                    nb.setTextPosition(2);
                else
                    nb.setTextPosition(3);
                hPopups.put(sPopup, pm);
            }
            return true;
        }

        // set the popup menu font
        else if (property == SET_POPUP_MENU_FONT) {
            String s = value.toString();
            String sPopup = null, sFont = null, sSize = null, sType = null;
            int iSize = 12;
            int iType = Font.PLAIN;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreElements())
                sPopup = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sFont = st.nextToken();
            else
                return false;
            if (st.hasMoreElements()) {
                sSize = st.nextToken();
                try {
                    iSize = Integer.parseInt(sSize);
                } catch (Exception ex) {
                    print("setPopupMenuFont() Invalid font size:" + sSize);
                    return false;
                }
            }
            if (st.hasMoreElements()) {
                sType = st.nextToken();
                if (sType.equalsIgnoreCase("N"))
                    iType = Font.PLAIN;
                else if (sType.equalsIgnoreCase("I"))
                    iType = Font.ITALIC;
                else if (sType.equalsIgnoreCase("B"))
                    iType = Font.BOLD;
            }
            // retrieve the popup
            PopMenu pm = (PopMenu)hPopups.get(sPopup);
            if (pm == null) {
                print("setPopupMenuFont() Popup not found:" + sPopup);
                return false;
            }
            // make the font
            try {
                Font f = new Font(sFont, iType, iSize);
                pm.setMenuFont(f);
                hPopups.put(sPopup, pm);
            } catch (Exception ex) {
                print("setPopupMenuFont() Invalid font description:" + sFont + "," + sType + "," + sSize);
                return false;
            }
            return true;
        }

        // set the popup menu font color
        else if (property == SET_POPUP_MENU_FONT_COLOR) {
            String s = value.toString();
            String sPopup = null, sColor = null;
            Color c = null;
            int iType = Font.PLAIN;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreElements())
                sPopup = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sColor = st.nextToken();
            else
                return false;
            // retrieve the popup
            PopMenu pm = (PopMenu)hPopups.get(sPopup);
            if (pm == null) {
                print("setPopupMenuFont() Popup not found:" + sPopup);
                return false;
            }
            // make the color
            c = ik.makeColor(sColor);
            pm.setMenuFontColor(c);
            hPopups.put(sPopup, pm);
            return true;
        }


        // set the popup menu icon
        else if (property == SET_POPUP_MENU_ICON) {
            String s = value.toString();
            String sPopup = null, sItem = null, sIcon = null, sPos = null;
            Color c = null;
            int iType = Font.PLAIN;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreElements())
                sPopup = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sItem = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sIcon = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sPos = st.nextToken();
            // retrieve the popup
            PopMenu pm = (PopMenu)hPopups.get(sPopup);
            if (pm == null) {
                print("setPopupMenuIcon() Popup not found:" + sPopup);
                return false;
            }
            // get the image
            Image img = ik.loadImage(sIcon);
            if (img != null) {
                pm.setMenuIcon(sItem, img);
            }
            return true;
        }

        // delete a popup menu
        else if (property == DELETE_POPUP_MENU) {
            String s = value.toString();
            String sPopup = null, sBool = null, s1 = null;
            int x = 0, y = 0;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreElements())
                sPopup = st.nextToken();
            else
                return false;
            // retrieve the popup
            PopMenu pm = (PopMenu)hPopups.get(sPopup);
            if (pm == null) {
                print("deletePopupMenu() Popup not found:" + sPopup);
                return false;
            }
            // clear the underlying objects
            pm.hOptions.clear();
            pm.jp = null;
            hPopups.remove(sPopup);
            System.gc();
            if (sPopup.equalsIgnoreCase(sPopupMenu))
                sPopupMenu = null;
            return true;
        }

        else if (property == SHOW_POPUP_MENU) {
            String s = value.toString();
            String sPopup = null, sBool = null, s1 = null;
            int x = 0, y = 0, item = 0;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreElements())
                sPopup = st.nextToken();
            else
                return false;
            if (st.hasMoreElements())
                sBool = st.nextToken();
            else
                return false;
            if (st.hasMoreElements()) {
                s1 = st.nextToken();
                try {
                    x = Integer.parseInt(s1);
                } catch (Exception ex) {
                }
            }
            if (st.hasMoreElements()) {
                s1 = st.nextToken();
                try {
                    y = Integer.parseInt(s1);
                } catch (Exception ex) {
                }
            }
            if (st.hasMoreElements()) {
                s1 = st.nextToken();
                try {
                    item = Integer.parseInt(s1);
                } catch (Exception ex) {
                }
            }            
            // retrieve the popup
            PopMenu pm = (PopMenu)hPopups.get(sPopup);
            if (pm == null) {
                print("showPopupMenu() Popup not found:" + sPopup);
                return false;
            }
            sPopupMenu = sPopup;
            if (sBool.equalsIgnoreCase("true")) {
                this.validate();
                pm.show(this, x, y, jp.getSize(),item);
                bPopupDisplayed = true;
            } else {
                pm.hide(this);
                bPopupDisplayed = false;
            }
            return true;
        }

        //
        // table-block sorter property
        //
        else if (property == IMG_HEADER_ICONS) {
            String s = value.toString().trim();
            log("img_header_Icons()" + s);
            String sIcon1 = null, sIcon2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");

            if (st.hasMoreTokens())
                sIcon1 = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sIcon2 = st.nextToken();
            else
                return false;
            sIconNext = sIcon1;
            sIconPrev = sIcon2;
            return true;
        }

        else if (property == IMG_HEADER) {

            String s = value.toString().trim();
            log("img_header()" + s);
            int iX1 = -1, iY1 = -1, hWidth = 10, hHeight = 10;
            String sName = null;
            String sBlockName = null;
            StringTokenizer st = new StringTokenizer(s, ",");

            if (st.hasMoreTokens()) {
                try {
                    iX1 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        iY1 = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        hWidth = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        hHeight = Integer.parseInt(st.nextToken());
                    if (st.hasMoreTokens())
                        sName = st.nextToken();
                    if (st.hasMoreTokens())
                        sBlockName = st.nextToken();
                } catch (Exception e) {
                    print(e.getMessage());
                    return false;
                }

            }
            final Messages mgs = new Messages(IMG_HEADER_SORT_COL, sName);
            final Messages mgsBlockName = new Messages(IMG_HEADER_BLOCK_NAME, sBlockName);
            Image imgNext_V = ik.loadImage(sIconNext);
            Image imgPrev_V = ik.loadImage(sIconPrev);
            final ImageIcon next = new ImageIcon(imgNext_V);
            final ImageIcon prev = new ImageIcon(imgPrev_V);
            final JLabel label = new JLabel("", JLabel.RIGHT);
            label.setSize(hWidth, hHeight);
            label.setLocation(iX1, iY1);
            label.setName("1");
            if (!mapLabelIcon.containsKey(sBlockName)) {
                arrLabelIcon = new ArrayList();
            }
            arrLabelIcon.add(label);
            mapLabelIcon.put(sBlockName, arrLabelIcon);
            label.addMouseListener(new MouseListener() {
                public void mouseClicked(MouseEvent e) {
                    List lsParam = new ArrayList();
                    lsParam.add(mgs);
                    lsParam.add(mgsBlockName);
                    clearIconSort(mgsBlockName.sValue);
                    if (label.getName().equalsIgnoreCase("1")) {
                        label.setIcon(prev);
                        label.setName("2");
                        Messages mgs1 = new Messages(IMG_HEADER_SORT_VALUE, "ASC");
                        lsParam.add(mgs1);
                        dispatchanevent(IMG_HEADER_CLICKED, lsParam);
                    } else if (label.getName().equalsIgnoreCase("2")) {
                        label.setIcon(next);
                        label.setName("1");
                        Messages mgs1 = new Messages(IMG_HEADER_SORT_VALUE, "DESC");
                        lsParam.add(mgs1);
                        dispatchanevent(IMG_HEADER_CLICKED, lsParam);
                    }
                }

                public void mouseReleased(MouseEvent e) {
                }

                public void mousePressed(MouseEvent e) {
                }

                public void mouseExited(MouseEvent e) {
                }

                public void mouseEntered(MouseEvent e) {
                }
            });
            this.getParent().add(label, 0);
            return true;
        }

        //
        // Desktop operation
        //
        else if (property == setDesktop) {
            String s = "", sAction = "", sValue = "";
            s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            sAction = st.nextToken();
            if (st.hasMoreTokens())
                sValue = st.nextToken();
            if (iJRE < 16) {
                print("SET_DESKTOP needs, at least, the JRE 1.6");
                return false;
            }
            Desktop desktop = null;
            if (Desktop.isDesktopSupported()) {
                desktop = Desktop.getDesktop();
                if (sAction.equalsIgnoreCase("print")) {
                    File file = new File(sValue);
                    if (file != null) {
                        try {
                            desktop.print(file);
                        } catch (Exception ioe) {
                            print("LAF Desktop() unable to print " + sValue);
                        }
                    }
                } else if (sAction.equalsIgnoreCase("open")) {
                    File file = new File(sValue);
                    if (file != null) {
                        try {
                            desktop.open(file);
                        } catch (IOException ioe) {
                            print("LAF Desktop() unable to open " + sValue);
                        }
                    }
                } else if (sAction.equalsIgnoreCase("edit")) {
                    File file = new File(sValue);
                    if (file != null) {
                        try {
                            desktop.edit(file);
                        } catch (Exception ioe) {
                            print("LAF Desktop() unable to edit " + sValue);
                        }
                    }
                } else if (sAction.equalsIgnoreCase("mail")) {
                    URI uriMailTo = null;
                    try {
                        if (sValue.length() > 0) {
                            uriMailTo = new URI("mailto", sValue, null);
                            desktop.mail(uriMailTo);
                        } else {
                            desktop.mail();
                        }
                    } catch (IOException ioe) {
                        ioe.printStackTrace();
                    } catch (URISyntaxException use) {
                        use.printStackTrace();
                    }
                } else if (sAction.equalsIgnoreCase("browse")) {
                    URI uri = null;
                    try {
                        if (sValue.length() > 0) {
                            uri = new URI(sValue);
                            desktop.browse(uri);
                        }
                    } catch (IOException ioe) {
                        ioe.printStackTrace();
                    } catch (URISyntaxException use) {
                        use.printStackTrace();
                    }
                }
            }

            return true;
        }

        //
        // set default printer
        //
        else if (property == setPrinter) {
            String sp = value.toString();
            String s = null;
            if (sp.equalsIgnoreCase("false")) {
                s = getPrinterList();
                String s2 = "true,0,0,400,160,Printer list," + s + ",1,Printers,Select a printer";
                setProperty(pDisplayAlert, s2);
                int i;
                if (null != sAlertButton) {
                    try {
                        i = Integer.parseInt(sAlertButton);
                        String st[] = s.split("\\|");
                        sp = st[i - 1];
                        log("selected printer:" + sp);
                    } catch (NumberFormatException nfe) {
                        System.out.println("Set_Default_Printer():" + nfe.getMessage());
                    }
                }
            }
            if (!sp.equalsIgnoreCase("false")) {
                s = "cmd /c Rundll32 Printui.dll PrintUIEntry /y /n \"" + sp + "\"";
                setProperty(SETEXTPROG, s);
            }
            return true;
        }

        //
        // window properties
        //
        else if (property == SET_WINDOW_PROPERTY) {
            String s = "", sProp = "", sFlag = "";
            boolean bFlag = false;
            s = value.toString();
            StringTokenizer st = new StringTokenizer(s, ",");
            sProp = st.nextToken();
            if (st.hasMoreTokens())
                sFlag = st.nextToken();
            if (sFlag.equalsIgnoreCase("true"))
                bFlag = true;

            if (winCurrent == null || winMDI == null)
                ;
            setProperty(pGetWindows, null);

            if (sProp.equalsIgnoreCase("can_move"))
                winCurrent.setMovable(bFlag);
            else if (sProp.equalsIgnoreCase("can_close"))
                winCurrent.setClosable(bFlag);
            else if (sProp.equalsIgnoreCase("can_maximize"))
                winCurrent.setMaximizable(bFlag);
            else if (sProp.equalsIgnoreCase("can_minimize"))
                winCurrent.setMinimizable(bFlag);
            else if (sProp.equalsIgnoreCase("can_resize"))
                winCurrent.setResizable(bFlag);
            else if (sProp.equalsIgnoreCase("can_disable")) {
                if (sFlag.equalsIgnoreCase("true"))
                    winCurrent.disable();
                else
                    winCurrent.enable();
            } else if (sProp.equalsIgnoreCase("show")) {
                if (sFlag.equalsIgnoreCase("true"))
                    winCurrent.show();
                else
                    winCurrent.hide();
            } else if (sProp.equalsIgnoreCase("set_MDI_state_icon"))
                winMDI.setExtendedState(JFrame.ICONIFIED);
            else if (sProp.equalsIgnoreCase("set_MDI_state_maximize"))
                winMDI.setExtendedState(JFrame.MAXIMIZED_BOTH);
            else if (sProp.equalsIgnoreCase("set_MDI_state_normal"))
                winMDI.setExtendedState(JFrame.NORMAL);
            else if (sProp.equalsIgnoreCase("on_top")) {
                if (iJRE < 15) {
                    print("ON_TOP needs, at least, the JRE 1.5");
                    return false;
                }
                Object obj[] = new Object[1];
                if (sFlag.equalsIgnoreCase("true")) {
                    obj[0] = new Boolean(true);
                    InvokeMethod(winMDI, "setAlwaysOnTop", obj);
                } else {
                    obj[0] = new Boolean(false);
                    InvokeMethod(winMDI, "setAlwaysOnTop", obj);
                }
            }

            return true;
        }


        //
        // JDBC connection
        //
        // DB procedure call
        if (property == pDBInitProc) {
            log("DB_SET_PROCEDURE");
            String s = (String)value;
            String s1 = "*no name*", s2 = "";
            StringTokenizer st = new StringTokenizer(s, "|");
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                s2 = st.nextToken();
            } else
                s2 = s;

            int i = -1;
            int j;
            while (i < 0) {
                for (j = 0; j < 10; j++) {
                    if (sDBName[j] == null) {
                        i = j;
                        break;
                    }
                }
            }
            final int iPos = i;
            sDBName[iPos] = s1;
            sDBQuery[iPos] = "begin " + s2 + " end;";
            sDBResult[iPos] = "";
            sDBError[iPos] = "";
            sDBStart[iPos] = "";
            sDBEnd[iPos] = "";
            bFunction[iPos] = false;
            try {
                new Thread() {
                    public void run() {
                        // execute the stored procedure
                        bRunning[iPos] = true;
                        sDBStart[iPos] = getTime();
                        if (bDBPopup) {
                            try {
                                new Thread() {
                                    public void run() {
                                        String sMsg = sDBPopup.replaceFirst("%NAME%", sDBName[iPos]);
                                        try {
                                            while (bRunning[iPos]) {
                                                setProperty(pFlashSetText2, sMsg);
                                                try {
                                                    Thread.sleep(2000);
                                                } catch (Exception e) {
                                                }
                                            }
                                        } catch (Exception e) {
                                            e.printStackTrace();
                                        }
                                    }
                                }.start();
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }
                        connectDBandExecute(iPos);
                        sDBEnd[iPos] = getTime();
                        // tell Forms that the process is finished
                        try {
                            CustomEvent ce = new CustomEvent(m_handler, pDBEvent);
                            m_handler.setProperty(pDBName, sDBName[iPos]);
                            m_handler.setProperty(pDBResult, sDBResult[iPos]);
                            m_handler.setProperty(pDBError, sDBError[iPos]);
                            m_handler.setProperty(pDBStart, sDBStart[iPos]);
                            m_handler.setProperty(pDBEnd, sDBEnd[iPos]);
                            dispatchCustomEvent(ce);
                        } catch (Exception ex) {
                            print("DB_SET_PROCEDURE(): -> exception while dispatching: " + ex);
                        } finally {
                            bRunning[iPos] = false;
                            sDBName[iPos] = null;
                            sDBEnd[iPos] = getTime();
                        }
                    }
                }.start();
            } catch (Exception e) {
                e.printStackTrace();
                bRunning[iPos] = false;
                sDBName[iPos] = null;
                sDBEnd[iPos] = getTime();
            }

            return true;
        }

        // DB function call
        else if (property == pDBInitFunc) {
            log("DB_SET_FUNCTION");
            String s = (String)value;
            String s1 = "*no name*", s2 = "";
            StringTokenizer st = new StringTokenizer(s, "|");
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                s2 = st.nextToken();
            } else
                s2 = s;

            int i = -1;
            int j;
            while (i < 0) {
                for (j = 0; j < 10; j++) {
                    if (sDBName[j] == null) {
                        i = j;
                        break;
                    }
                }
            }
            final int iPos = i;

            sDBName[iPos] = s1;
            sDBQuery[iPos] = "begin ? := " + s2 + " end;";
            sDBResult[iPos] = "";
            sDBError[iPos] = "";
            sDBStart[iPos] = "";
            sDBEnd[iPos] = "";
            bFunction[iPos] = true;
            try {
                new Thread() {
                    public void run() {
                        // execute the stored function
                        bRunning[iPos] = true;
                        sDBStart[iPos] = getTime();
                        if (bDBPopup) {
                            try {
                                new Thread() {
                                    public void run() {
                                        String sMsg = sDBPopup.replaceFirst("%NAME%", sDBName[iPos]);
                                        try {
                                            while (bRunning[iPos]) {
                                                setProperty(pFlashSetText2, sMsg);
                                                try {
                                                    Thread.sleep(2000);
                                                } catch (Exception e) {
                                                }
                                            }
                                        } catch (Exception e) {
                                            e.printStackTrace();
                                        }
                                    }
                                }.start();
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }
                        connectDBandExecute(iPos);
                        sDBEnd[iPos] = getTime();

                        // tell Forms that the process is finished
                        try {
                            CustomEvent ce = new CustomEvent(m_handler, pDBEvent);
                            m_handler.setProperty(pDBName, sDBName[iPos]);
                            m_handler.setProperty(pDBResult, sDBResult[iPos]);
                            m_handler.setProperty(pDBError, sDBError[iPos]);
                            m_handler.setProperty(pDBStart, sDBStart[iPos]);
                            m_handler.setProperty(pDBEnd, sDBEnd[iPos]);
                            dispatchCustomEvent(ce);
                        } catch (Exception ex) {
                            print("DB_SET_FUNCTION(): -> exception while dispatching: " + ex);
                        } finally {
                            bRunning[iPos] = false;
                            sDBName[iPos] = null;
                            sDBEnd[iPos] = getTime();
                        }
                    }
                }.start();
            } catch (Exception e) {
                e.printStackTrace();
                bRunning[iPos] = false;
                sDBName[iPos] = null;
                sDBEnd[iPos] = getTime();
            }

            return true;
        }

        // DB Display Popup
        else if (property == pDBSetPopup) {
            try {
                sDBPopup = (String)value;
                bDBPopup = true;
                log("DB_SET_POPUP=" + sDBPopup);
            } catch (Exception e) {
                bDBPopup = false;
            }
            return true;
        }

        // DB connect string
        else if (property == pDBInitConn) {
            sDBConn = (String)value;
            log("InitConn=" + sDBConn);
            return true;
        }

        // DB username
        else if (property == pDBInitUser) {
            sDBUser = (String)value;
            log("InitUser=" + sDBUser);
            return true;
        }

        // DB password
        else if (property == pDBInitPwd) {
            sDBPwd = (String)value;
            log("InitPwd=" + sDBPwd);
            return true;
        }

        // Quick exit
        else if (property == pSetQuickExit) {
            String s = (String)value;
            if (s.equalsIgnoreCase("true"))
                bQuickExit = true;
            else if (s.equalsIgnoreCase("false"))
                bQuickExit = false;
            return true;
        }

        //
        // start external program
        //
        else if (property == SETEXTPROG) {
            String s = value.toString(), s2 = "";
            String[] sTabParams = null;
            int iNbParams = 0, iPos = -1;
            iPos = s.indexOf(",");
            if (iPos > -1) {
                StringTokenizer st = new StringTokenizer(s, ",");
                // get the total number of parameters
                while (st.hasMoreTokens()) {
                    s2 = st.nextToken();
                    iNbParams++;
                }
                sTabParams = new String[iNbParams];
                st = new StringTokenizer(s, ",");
                for (int i = 0; i < iNbParams; i++)
                    sTabParams[i] = st.nextToken();
            }

            // launch the program
            try {
                if (iPos > -1)
                    process = Runtime.getRuntime().exec(sTabParams);
                else
                    process = Runtime.getRuntime().exec(s);

                new Thread() {
                    public void run() {
                        // standard output
                        try {
                            BufferedReader br = new BufferedReader(new InputStreamReader(process.getInputStream()));
                            String line = null;
                            try {
                                while ((line = br.readLine()) != null) {
                                    // Send standard output to Forms
                                    dispatchanevent(EXTMSGSTND, EXTMSGTEXT, line);
                                }
                            } finally {
                                br.close();
                            }
                        } catch (IOException ioe) {
                            ioe.printStackTrace();
                            dispatchanevent(EXTMSGERROR, EXTMSGTEXT, ioe.getMessage());
                        }
                        // Error output
                        try {
                            BufferedReader br = new BufferedReader(new InputStreamReader(process.getErrorStream()));
                            String line = null;
                            try {
                                while ((line = br.readLine()) != null) {
                                    // Send error output to Forms
                                    dispatchanevent(EXTMSGERROR, EXTMSGTEXT, line);
                                }
                            } finally {
                                br.close();
                                dispatchanevent(EXTMSGEND, EXTMSGTEXT, "[END PROGRAM]");
                            }
                        } catch (IOException ioe) {
                            ioe.printStackTrace();
                            dispatchanevent(EXTMSGERROR, EXTMSGTEXT, ioe.getMessage());
                            dispatchanevent(EXTMSGEND, EXTMSGTEXT, "[END PROGRAM]");
                        }

                    }
                }.start();

            } catch (IOException ioe) {
                ioe.printStackTrace();
                dispatchanevent(EXTMSGERROR, EXTMSGTEXT, ioe.getMessage());
                dispatchanevent(EXTMSGEND, EXTMSGTEXT, "[END PROGRAM]");
            }

            return true;
        }

        //
        // new Spinner image
        //
        else if (property == SpinNew) {
            String sName = value.toString();
            // spinner does not exist ?
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs == null) {
                cs = new cSpinner(sName);
                hSpinners.put(sName, cs);
            } else {
                print("LAF Spinner SpinNew() spinner already exist:" + sName);
                return false;
            }
            return true;
        }

        //
        // remove Spinner image
        //
        else if (property == SpinRemove) {
            String sName = value.toString();
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                VB.getParent().remove(cs.spin);
                cs = null;
                hSpinners.remove(sName);
            } else {
                print("LAF Spinner SpinRemove() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        // set the tooltip displaying time
        // value given in seconds
        if (property == SetTooltipDisplayTime) {
            String s = (String)value;
            int i, iTooltipTime = 0;
            try {
                i = Integer.parseInt(s);
                if (i != -1 && i < 5)
                    return false;
                if (i == -1)
                    i = Integer.MAX_VALUE;
                else
                    iTooltipTime = i * 1000;
                ToolTipManager.sharedInstance().setDismissDelay(iTooltipTime);
            } catch (Exception e) {
                print("SetTooltipDisplayTime() invalid number:" + s);
            }
            return true;
        }

        //
        // new Spinner image
        //
        else if (property == SpinSetLegendFont) {
            String s = (String)value;
            String sName = "", sFont = "", sFType = "";
            int iFType = Font.BOLD;
            int iSize = 12;
            Font f;
            StringTokenizer st = new StringTokenizer(s, ",");
            if (st.hasMoreTokens()) {
                if (st.hasMoreTokens())
                    sName = st.nextToken();
                if (st.hasMoreTokens())
                    sFont = st.nextToken();
                if (st.hasMoreTokens())
                    sFType = st.nextToken();
                if (st.hasMoreTokens()) {
                    try {
                        iSize = Integer.parseInt(st.nextToken());
                    } catch (Exception e) {
                        return false;
                    }
                }
                if (sFType.equalsIgnoreCase("bold"))
                    iFType = Font.BOLD;
                else if (sFType.equalsIgnoreCase("plain"))
                    iFType = Font.PLAIN;
                else if (sFType.equalsIgnoreCase("italic"))
                    iFType = Font.ITALIC;
                else if (sFType.equalsIgnoreCase("bolditalic"))
                    iFType = Font.BOLD + Font.ITALIC;
                f = new Font(sFont, iFType, iSize);
                // get spinner
                cSpinner cs = (cSpinner)hSpinners.get(sName);
                if (cs != null) {
                    cs.spin.setLegendFont(f);
                } else {
                    print("LAF Spinner SetLegendFont() cannot find spinner name:" + sName);
                    return false;
                }
            }
            return true;
        }

        //
        // clean Spinner image
        //
        else if (property == SpinClean) {
            String sName = value.toString();
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.clean();
            } else {
                print("LAF Spinner SpinClean() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // Spinner image location
        //
        else if (property == SpinSetLocation) {
            String s = value.toString();
            String sName = "", s1 = "";
            int x = 1, y = 1;
            StringTokenizer st = new StringTokenizer(s, ",");
            // Spinner name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            // x pos
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                try {
                    x = Integer.parseInt(s1);
                } catch (Exception e) {
                    print("LAF spinner location bad X position:" + s1);
                }
            } else
                return false;
            // y pos
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                try {
                    y = Integer.parseInt(s1);
                } catch (Exception e) {
                    print("LAF spinner location bad Y position:" + s1);
                }
            } else
                return false;
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.setLocation(x, y);
            } else {
                print("LAF Spinner SetLocation() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // Spinner image legend colors
        //
        else if (property == SpinSetLegColors) {
            String s = value.toString();
            String sName = "", s1 = "";
            Color c1 = null, c2 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            // Spinner name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            // foreground
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("-"))
                    c1 = ik.makeColor(s1);
            } else
                return false;
            // background
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                c2 = ik.makeColor(s1);
            }
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.setLegendColors(c1, c2);
            } else {
                print("LAF Spinner SetLegendColors() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // Spinner image panel background
        //
        else if (property == SpinSetPanelBG) {
            String s = value.toString();
            String sName = "", s1 = "";
            Color c1 = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            // Spinner name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            // color
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if (!s1.equalsIgnoreCase("null")) {
                    c1 = ik.makeColor(s1);
                }
            } else
                return false;
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.setPanelBackground(c1);
            } else {
                print("LAF Spinner SetPanelBackground() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // Spinner image legend position
        //
        else if (property == SpinSetLegendPos) {
            String s = value.toString();
            String sName = "", s1 = "";
            StringTokenizer st = new StringTokenizer(s, ",");
            // Spinner name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            // position
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
            } else
                return false;
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.setLegendPosition(s1);
            } else {
                print("LAF Spinner SetLegendPos() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // Spinner image panel border
        //
        else if (property == SpinSetBorder) {
            String s = value.toString();
            String sName = "", s1 = "", sColor = null, s2 = "";
            Color c1 = null;
            int iWidth = 1;
            StringTokenizer st = new StringTokenizer(s, ",");
            // Spinner name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            // border
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
            } else
                return false;
            // color
            if (st.hasMoreTokens()) {
                sColor = st.nextToken();
                c1 = ik.makeColor(sColor);
            }
            // line width
            if (st.hasMoreTokens()) {
                s2 = st.nextToken();
                try {
                    iWidth = Integer.parseInt(s2);
                } catch (Exception e) {
                    print("LAF Spinner setBorder() wrong line width:" + s2);
                }
            }
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.setBorderType(s1, c1, iWidth);
            } else {
                print("LAF Spinner setBorder() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // Spinner image legend alignment
        //
        else if (property == SpinSetLegAlign) {
            String s = value.toString();
            String sName = "", s1 = "";
            StringTokenizer st = new StringTokenizer(s, ",");
            // Spinner name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            // alignment
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
            } else
                return false;
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.setLegendAlignment(s1);
            } else {
                print("LAF Spinner setLegendAlign() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // Spinner image size
        //
        else if (property == SpinSetSize) {
            String s = value.toString();
            String sName = "", s1 = "";
            int x = 1, y = 1;
            StringTokenizer st = new StringTokenizer(s, ",");
            // Spinner name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            // x pos
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                try {
                    x = Integer.parseInt(s1);
                } catch (Exception e) {
                    print("LAF spinner setSize() size bad width:" + s1);
                }
            } else
                return false;
            // y pos
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                try {
                    y = Integer.parseInt(s1);
                } catch (Exception e) {
                    print("LAF spinner SetSize() size bad height position:" + s1);
                }
            } else
                return false;
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.setPanelSize(x, y);
            } else {
                print("LAF Spinner setSize() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // Spinner image max size
        //
        else if (property == SpinSetMaxSize) {
            String s = value.toString();
            String sName = "", s1 = "";
            int x = 1, y = 1;
            StringTokenizer st = new StringTokenizer(s, ",");
            // Spinner name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            // x pos
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                try {
                    x = Integer.parseInt(s1);
                } catch (Exception e) {
                    print("LAF spinner setMaxSize() size bad width:" + s1);
                }
            } else
                return false;
            // y pos
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                try {
                    y = Integer.parseInt(s1);
                } catch (Exception e) {
                    print("LAF spinner SetMaxSize() size bad height position:" + s1);
                }
            } else
                return false;
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.setPanelMaxSize(x, y);
            } else {
                print("LAF Spinner setSize() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // refresh Spinner image
        //
        else if (property == SpinRefresh) {
            String sName = value.toString();
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.refresh(true);
            } else {
                print("LAF Spinner SpinRefresh() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // display Spinner image
        //
        else if (property == SpinDisplay) {
            String s = value.toString();
            String sName = "", display = "";
            int i = s.indexOf(",");
            if (i > -1) {
                sName = s.substring(0, i);
                display = s.substring(i + 1);
            }
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                if (display.equalsIgnoreCase("true")) {
                    cs.spin.setVisible(true);
                } else if (display.equalsIgnoreCase("false")) {
                    cs.spin.setVisible(false);
                }
            } else {
                print("LAF Spinner SpinDisplay() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // Spinner keep image size
        //
        else if (property == SpinSetKeepSize) {
            String s = value.toString();
            String sName = "", keep = "";
            int i = s.indexOf(",");
            if (i > -1) {
                sName = s.substring(0, i);
                keep = s.substring(i + 1);
            }
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                if (keep.equalsIgnoreCase("true")) {
                    cs.spin.setKeepImageSize(true);
                } else if (keep.equalsIgnoreCase("false")) {
                    cs.spin.setKeepImageSize(false);
                }
            } else {
                print("LAF Spinner SpinSetKeepSize() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        //
        // Spinner set image magnifier
        //
        else if (property == SpinSetMagnifier) {
            String s = value.toString();
            String sName = "", s2 = "";
            int i = s.indexOf(",");
            if (i > -1) {
                sName = s.substring(0, i);
                s2 = s.substring(i + 1);
            }
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                if (s2.equalsIgnoreCase("true")) {
                    cs.spin.setImageMagnifier(true);
                } else if (s2.equalsIgnoreCase("false")) {
                    cs.spin.setImageMagnifier(false);
                }
            } else {
                print("LAF Spinner SpinSetImageMagnifier() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // Spinner show legend
        //
        else if (property == SpinShowLegend) {
            String s = value.toString();
            String sName = "", legend = "";
            int i = s.indexOf(",");
            if (i > -1) {
                sName = s.substring(0, i);
                legend = s.substring(i + 1);
            }
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                if (legend.equalsIgnoreCase("true")) {
                    cs.spin.setLegend(true);
                } else if (legend.equalsIgnoreCase("false")) {
                    cs.spin.setLegend(false);
                }
            } else {
                print("LAF Spinner SpinShowLegend() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // set current Spinner
        //
        else if (property == SpinSetSpinner) {
            String sName = value.toString();
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs == null) {
                print("LAF Spinner SpinSetSpinner() cannot find spinner name:" + sName);
                return false;
            }
            sSpinnerName = sName;
            return true;
        }

        //
        // set current Spinner labels
        //
        else if (property == SpinSetLabels) {
            String s = value.toString();
            String title = null, name = null, legend = null, tip = null;
            StringTokenizer st = new StringTokenizer(s, ",");
            // Spinner name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            //  image title
            if (st.hasMoreTokens()) {
                title = st.nextToken();
            }
            //  image name label
            if (st.hasMoreTokens()) {
                name = st.nextToken();
            }
            //  image legend label
            if (st.hasMoreTokens()) {
                legend = st.nextToken();
            }
            //  image tooltip label
            if (st.hasMoreTokens()) {
                tip = st.nextToken();
            }
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs == null) {
                print("LAF Spinner SpinSetLabels() cannot find spinner name:" + sName);
                return false;
            }
            cs.spin.setLabels(title, name, legend, tip);
            return true;
        }

        //
        //
        // set current Spinner image
        //
        else if (property == SpinSetCurrImage) {
            String s = value.toString();
            String sName = "", sImage = "";
            int i = s.indexOf(",");
            if (i > -1) {
                sName = s.substring(0, i);
                sImage = s.substring(i + 1);
            }
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs == null) {
                print("LAF Spinner SpinSetCurrentImage() cannot find spinner name:" + sName);
                return false;
            }
            sSpinnerName = sName;
            cs.spin.setImageToRead(sImage);
            ;
            return true;
        }

        //
        // set Spinner image
        //
        else if (property == SpinSetImage) {
            String s = value.toString();
            String sName = "", sImgName = "", sUrl = "", sLegend = null, sTtip = null;
            StringTokenizer st = new StringTokenizer(s, "|");
            // Spinner name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            // Spinner image name
            if (st.hasMoreTokens()) {
                sImgName = st.nextToken();
            } else
                return false;
            // Spinner image url
            if (st.hasMoreTokens()) {
                sUrl = st.nextToken();
            } else
                return false;
            // image legend
            if (st.hasMoreTokens()) {
                sLegend = st.nextToken();
            }
            // image tooltip
            if (st.hasMoreTokens()) {
                sTtip = st.nextToken();
            }
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.setImage(sImgName, sUrl, sLegend, sTtip);
            } else {
                print("LAF Spinner SetImage() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        // image scale
        else if (property == SpinSetScale) {
            String s = value.toString();
            String sName = "", s1 = "";
            StringTokenizer st = new StringTokenizer(s, ",");
            // Spinner name
            if (st.hasMoreTokens()) {
                sName = st.nextToken();
            } else
                return false;
            // Spinner scale
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
            } else
                return false;
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sName);
            if (cs != null) {
                cs.spin.scaleImage(s1);
            } else {
                print("LAF Spinner SpinSetScale() cannot find spinner name:" + sName);
                return false;
            }
            return true;
        }

        //
        // set Spinner image from base
        //
        else if (property == SpinSetImageBase) {
            log("readImageBase");
            String s = (String)value;
            String sPinName = "", sImgName = "", sData = "", sLegend = null, sTooltip = null;
            StringTokenizer st = new StringTokenizer(s, "|");
            if (st.hasMoreTokens())
                sPinName = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sData = st.nextToken();
            else
                return false;
            if (st.hasMoreTokens())
                sImgName = st.nextToken();
            if (st.hasMoreTokens())
                sLegend = st.nextToken();
            if (st.hasMoreTokens())
                sTooltip = st.nextToken();
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sPinName);
            if (cs != null) {
                cs.spin.readImageBase(sData, sImgName, sLegend, sTooltip);
            } else {
                print("LAF Spinner SetImageBase() cannot find spinner name:" + sPinName);
                return false;
            }
            return true;
        }

        // Show/hide Forms Item in rectangle (stripe)
        else if (property == ShowInRect) {
            String svalue = (String)value;
            String s0 = null, s1 = null, s2 = null, s3 = null, s4 = null, s5 = null, s6 = null;
            int ix1, iy1, ix, iy, iw, ih;
            StringTokenizer st2 = new StringTokenizer(svalue, "-");
            if (st2.hasMoreElements())
                s0 = st2.nextToken();
            else
                return false; // Item name
            if (st2.hasMoreElements())
                s1 = st2.nextToken();
            else
                return false; // x pos item
            if (st2.hasMoreElements())
                s2 = st2.nextToken();
            else
                return false; // y pos item
            if (st2.hasMoreElements())
                s3 = st2.nextToken();
            else
                return false; // x rect
            if (st2.hasMoreElements())
                s4 = st2.nextToken();
            else
                return false; // y rect
            if (st2.hasMoreElements())
                s5 = st2.nextToken();
            else
                return false; // width rect
            if (st2.hasMoreElements())
                s6 = st2.nextToken();
            else
                return false; // height rect
            try {
                ix1 = Integer.parseInt(s1);
                iy1 = Integer.parseInt(s2);
                if (s3.equalsIgnoreCase("start")) {
                    ix = 0;
                } else
                    ix = Integer.parseInt(s3);
                if (s4.equalsIgnoreCase("top")) {
                    iy = 0;
                } else
                    iy = Integer.parseInt(s4);
                if (s5.equalsIgnoreCase("end")) {
                    iw = jp.getWidth();
                } else
                    iw = Integer.parseInt(s5);
                if (s6.equalsIgnoreCase("bottom")) {
                    ih = jp.getHeight();
                } else
                    ih = Integer.parseInt(s6);

                Point p = new Point(ix1, iy1);
                Rectangle r = new Rectangle(ix, iy, iw, ih);
                newItem ni = null;
                int indice = getFormsItemIndice(p);
                if (indice > -1) {
                    ni = (newItem)ListFormsItems.get(indice);
                    if (ni != null) {
                        ni.setRect(r);
                        ni.sName = s0;
                        ListFormsItems.set(indice, ni);
                    }
                }
            } catch (Exception ex) {
                print("DrawLAF.Show_In_Rect(): Incorrect value:" + svalue);
            }
            return true;
        }

        //
        // Open/Save dialog
        //
        else if (property == setOpenSave) {
            String s = value.toString();
            String sOpt = "", sTitle = "", sDir = "", sFilter = "";
            StringTokenizer st2 = new StringTokenizer(s, ",");
            if (st2.hasMoreElements())
                sOpt = st2.nextToken();
            else
                return false;
            if (st2.hasMoreElements())
                sTitle = st2.nextToken();
            if (st2.hasMoreElements())
                sDir = st2.nextToken();
            if (st2.hasMoreElements())
                sFilter = st2.nextToken();
            if (sOpt.equalsIgnoreCase("open")) {
                sChoosenFileName = AWTFileDialog.getInstance().openFile(sTitle, sDir, sFilter);
            } else if (sOpt.equalsIgnoreCase("save")) {
                sChoosenFileName = AWTFileDialog.getInstance().saveFile(sTitle, sDir, sFilter);
            }
            print("file choosen:" + sChoosenFileName);
            return true;
        }
        
        //
        // paste from clipboard
        //
        else if (property == pasteClip) {
           Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
           Transferable clipData = clipboard.getContents(clipboard);
           if (clipData != null) {
             try {
               if (clipData.isDataFlavorSupported(DataFlavor.stringFlavor)) {
                 String s = (String)(clipData.getTransferData(DataFlavor.stringFlavor));
                 jtaClip.setText(s);
                 log("pasteClip():"+jtaClip.getText());
               }
             } catch (UnsupportedFlavorException ufe) {
               System.err.println("pasteClip(): Flavor unsupported: " + ufe);
             } catch (IOException ioe) {
               System.err.println("pasteClip(): Data not available: " + ioe);
             }
           }
           else System.out.println("clipboard empty");
           return true;
        }        
        
        //
        // copy to clipboard
        //
        else if (property == copyClip) {
           String s = value.toString();
           if(s.equals("[END_DATA]")){
               Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
               String selection = sbClip.toString();
               StringSelection data = new StringSelection(selection);
               clipboard.setContents(data, data);
               sbClip = new StringBuffer();
           }
           else{
               sbClip.append(s);
           }
           return true;
        }    
        
    
    //  Dynamic TABLES properties
    //
    // new Dynamic Tabl
    //
    else if (property == TBNEW) {
        String sName = value.toString().toUpperCase();
        // table does not exist ?
        // get table
        cDynTable cs = (cDynTable)hTables.get(sName);
        if (cs == null) {
            cs = new cDynTable(sName);
            sCurrentTable = sName;
            hTables.put(sName, cs);
        } else {
            print("LAF Table TB_New() table already exist:" + sName);
            return false;
        }
        return true;
    }

    //
    // remove dynamic table
    //
    else if (property == TBREMOVE) {
        String sName = value.toString().toUpperCase();
        // get table
        cDynTable cs = (cDynTable)hTables.get(sName);
        if (cs != null) {
            cs.tb.setRemove(sName);
            VB.getParent().remove(cs.tb);
            cs = null;
            hTables.remove(sName);
            if(sCurrentTable.equalsIgnoreCase(sName)){
                sCurrentTable = "";
            }
        } else {
            print("LAF Table TB_Remove() cannot find table name:" + sName);
            return false;
        }
        return true;
    }
    //
    // set the current table
    //
    else if (property == TBSETCURRENT) 
    {
        String sName = value.toString().toUpperCase();
        // get table
        cDynTable cs = (cDynTable)hTables.get(sName);
        if (cs != null) {
            sCurrentTable = sName;
        } else {
            print("LAF Table TB_SETCURRENT() cannot find table name:" + sName);
            return false;
        }
      return true;
    }          
    //
    // set the panel background
    //
    else if (property == TBBACKGROUND) 
    {
      return setDynTableProperty(property, value);
    }
    //
    // set the header
    //
    else if (property == TBSETHEADER) 
    {
      return setDynTableProperty(property, value);
    }
    //
    // set the current table name
    //
    else if (property == TBSETCURRENT) 
    {
      return setDynTableProperty(property, value);
    }    
    //
    // set the image
    //
    else if(property==TBSETIMAGE || property==TBSETIMAGETOREAD)
    {
      return setDynTableProperty(property, value);
    }
    
    //
    // image size
    //
    else if (property == TBSETIMAGESIZE)
    {
        return setDynTableProperty(property, value);
    }
    //
    // column auto resize mode
    //
    else if (property == TBSETRESIZEMODE)
    {
        return setDynTableProperty(property, value);
    }
    //
    // set rows number
    //
    else if (property == TBSETNUMROWS)
    {
        return setDynTableProperty(property, value);
    } 
    //
    // set page size
    //
    else if (property == TBSETPAGESIZE)
    {
        return setDynTableProperty(property, value);
    }         
    //
    // refresh table content
    //
    else if (property == TBSETREFRESH)
    {
        return setDynTableProperty(property, value);
    }         
    //
    // # visible rows
    //
    else if (property == TBSETVISIBLEROWS)
    {
        return setDynTableProperty(property, value);
    }   
    //
    // set the table border
    //
    else if (property == TBSETBORDER)
    { 
        return setDynTableProperty(property, value);
    }             
    //
    // set the panel border
    //
    else if (property == TBSETPANELBORDER)
    { 
        return setDynTableProperty(property, value);
    }     
    //
    // set the columns type
    //
    else if (property == TBSETCOLSTYPE)
    {
        return setDynTableProperty(property, value);
    }    
 
    //
    // set the current cell value
    //
    else if (property == TBSETCURCELLVALUE) 
    {
        return setDynTableProperty(property, value);
    }
     
    //
    // set the Cell value
    //
    else if (property == TBSETCELLVALUE) 
    {
        return setDynTableProperty(property, value);
    }
    
    //
    // set the row properties
    //
    else if (property == TBSETROWPROP) 
    {
        return setDynTableProperty(property, value);
    }
    
    //
    // set the cell properties
    //
    else if (property == TBSETCELLPROP || (property == TBSETCELLINSTPROP)) 
    {
        return setDynTableProperty(property, value);
    }
    //
    // set the data
    //
    else if (property == TBSETDATA) 
    {
        return setDynTableProperty(property, value);
    }
    //
    // set the default date format
    //
    else if (property == TBSETDATEFORMAT)
    {
        return setDynTableProperty(property, value);
    }    
    //
    // set the default number format
    //
    else if (property == TBSETNUMFORMAT)
    {
		return setDynTableProperty(property, value);
    }    
    //
    // set the default integer format
    //
    else if (property == TBSETINTFORMAT)
    {
        return setDynTableProperty(property, value);
    }        
    //
    // add a blank row
    //
    else if (property == TBADD_ROW) 
    {
        return setDynTableProperty(property, value);
    }
    //
    // set the log trace
    //
    else if (property == TBSETLOG) 
    {
        String s = value.toString().toLowerCase(); 
        if(s.endsWith("true")) bLogTable = true ;
        else if(s.endsWith("false")) bLogTable = false ;
        return setDynTableProperty(property, value);
    }
    //
    // set the vertical lines
    //
    else if (property == TBSETVLINE) 
    {
        return setDynTableProperty(property, value);
    }    
    //
    // set the vertical lines
    //
    else if (property == TBSETHLINE) 
    {
        return setDynTableProperty(property, value);
    }    
    //
    // set the title
    //
    else if (property == TBSETTITLE || (property == TBSETALERTSTRINGS ||  (property == TBSETCLOSELABEL)
             || (property == TBSETTITLEALIGN) || (property == TBSETSHOWTITLE) || (property == TBSETTITLECOLORS)
             || (property == TBSETTITLEFONT) || (property == TBSETFINDLABELS)|| (property == TBSETTOTALCOLORS))) 
    {
        return setDynTableProperty(property, value);
    }
    //
    // set the filter
    //
    else if (property == TBSETFILTER) 
    {
        return setDynTableProperty(property, value);
    }   
    //
    // set the focus
    //
    else if (property == TBSETFOCUS) 
    {
        return setDynTableProperty(property, value);
    }          
    //
    // set the reorder flag
    //
    else if (property == TBSETREORDER) 
    {
        return setDynTableProperty(property, value);
    }
    //
    // set the extend flag
    //
    else if (property == TBSETCANEXTEND || (property == TBSETEDITEXTEND)) 
    {
        return setDynTableProperty(property, value);
    } 
    //
    // set the resize flag
    //
    else if (property == TBSETRESIZE) 
    {
        return setDynTableProperty(property, value);
    }  
    //
    // set the visible flag
    //
    else if (property == TBSETVISIBLE) 
    {
        return setDynTableProperty(property, value);
    }          
    //
    // table content refresh
    //
    else if (property == TBSETREFRESH) 
    {
        return setDynTableProperty(property, value);
    }        
    //
    // set the array size
    //
    else if (property == TBSETARRAYSIZE) // set the number of columns
    {                                  // (nbCols, nbRows)
        return setDynTableProperty(property, value);
    }        
    //
    // set the frame bounds
    //
    else if (property == TBSETBOUNDS) 
    {
        return setDynTableProperty(property, value);
    }    
    //
    // set the selection background color
    //
    else if (property == TBSETSELECTBACK) 
    {
        return setDynTableProperty(property, value);
    }
    //
    // set the selection foreground color
    //
    else if (property == TBSETSELECTFORE) 
    {
        return setDynTableProperty(property, value);
    } 
    //    
    // set the header background color
    //
    else if (property == TBSETHEADBG) 
    {
        return setDynTableProperty(property, value);
    }
    //    
    // set the columns max width
    //
    else if (property == TBSETCOLSMAXWIDTH) 
    {
        return setDynTableProperty(property, value);
    }       
    //    
    // set the header height
    //
    else if (property == TBSETHEADHEIGHT) 
    {
        return setDynTableProperty(property, value);
    }   
    //    
    // set the total header height
    //
    else if (property == TBSETTOTALHEADHEIGHT) 
    {
        return setDynTableProperty(property, value);
    }       
    //    
    // set the total line
    //
    else if (property == TBSETTOTALLINE) 
    {
        return setDynTableProperty(property, value);
    }  
    
    //    
    // set the total line labels
    //
    else if (property == TBSETTOTALLINELABELS) 
    {
        return setDynTableProperty(property, value);
    }         
    
    //
    // set the header foreground color
    //
    else if (property == TBSETHEADFG) 
    {
        return setDynTableProperty(property, value);
    }    
    //
    // set the header background color
    //
    else if (property == TBSETDATABG) 
    {
        return setDynTableProperty(property, value);
    }
    //
    // set the table background color
    //
    else if (property == TBSETTABLEBG) 
    {
        return setDynTableProperty(property, value);
    }    
    //
    // set the header foreground color
    //
    else if (property == TBSETDATAFG) 
    {
        return setDynTableProperty(property, value);
    } 
    //
    // set the grid color
    //
    else if (property == TBSETGRIDFG) 
    {
        return setDynTableProperty(property, value);
    } 
    //
    // can update,insert,delete the table ?
    //
    else if (property == TBSETUPDATE) 
    {
        return setDynTableProperty(property, value);
    } 
    else if (property == TBSETINSERT) 
    {
        return setDynTableProperty(property, value);
    } 
    else if (property == TBSETDELETE) 
    {
        return setDynTableProperty(property, value);
    } 
    //
    // insert row
    //
    else if (property == TBINSERTROW || property == TBSETADDTEXT) 
    {
        return setDynTableProperty(property, value);
    } 
    //
    // delete row
    //
    else if (property == TBDELETEROW) 
    {
        return setDynTableProperty(property, value);
    }         
    //
    // raz the values
    //
    else if (property == TBINIT) 
    {
        return setDynTableProperty(property, value);
    } 
    else if (property == TBCLEARREFRESH) 
    {
        return setDynTableProperty(property, value);
    } 
    //
    // without ROWID cannot update
    //
    else if (property == TBISROWID) 
    {
        return setDynTableProperty(property, value);
    }        
        
    //
    // set the separator character
    //
    else if (property == TBSETSEPARATOR) 
    {
        return setDynTableProperty(property, value);
    } 
    //
    // get the value of a particular cell
    //
    else if (property == TBSETCELLPOS) 
    {
        return setDynTableProperty(property, value);
    }     
    //
    // set the pointer on a particular row
    //
    else if (property == TBSETROWPOS) 
    {
        return setDynTableProperty(property, value);
    }
    //
    // set the rowid of inserted, updated and delete row
    //
    else if (property == TBSETINSERTDONE || property == TBSETUPDATEDONE || property == TBSETDELETEDONE) 
    {
        return setDynTableProperty(property, value);
    }        
    // set the pointer on a particular rowid
    //
    else if (property == TBSETROWIDPOS) 
    {
        return setDynTableProperty(property, value);
    }         
    //
    // set the locale
    //
    else if (property == TBSETLOCALE)     
    {
        return setDynTableProperty(property, value);
    }
    //
    // set the decimal separators
    //
    else if (property == TBSETDECSEPARATORS)     
    {
        return setDynTableProperty(property, value);
    }
    
    //
    // show the JTable
    // 
    else if (property == TBSHOW) 
    {
        return setDynTableProperty(property, value);
    }     
    
        
    //
    // QuickTime properties
    //
    // MLT-7702 03/12/2025 (removed QT related code)
    // module content print
    else if (property == exportPutLine)     
    {
        sbModulePrint.append(value.toString()).append("\n");
        log("exportPutLine:"+value.toString());
        return true;
    } 
    else if (property == exportSetFilename)     
    {
        boolean b = writeFile(value.toString(),sbModulePrint.toString());
        sbModulePrint = new StringBuffer();
        if(b){
            setProperty(setDesktop,"open," + value.toString());
        }        
        return b;
    } 
    else if (property == pointTextLabel)     
    {
        sTextLabel = value.toString();   
        return true;
    }    
    else if (property == canvasMouseMove)     
    {
        String s = value.toString();
        String s1;
        int x=0,y=0,w=0,h=0;
        rCanvasMouseArea = new Rectangle(x,y,w,h);
        if(s.equalsIgnoreCase("false")){
            bMouseCanvasIdle = false;
            rCanvasMouseArea = new Rectangle(0,0,0,0);
        }
        else if(s.equalsIgnoreCase("full")){
            w = (int)this.getBounds().getWidth();
            h = (int)this.getBounds().getHeight();
            rCanvasMouseArea = new Rectangle(x,y,w,h);
            bMouseCanvasIdle = true;print(""+rCanvasMouseArea);
        }        
        else {
            try{
                StringTokenizer st = new StringTokenizer(s,",");
                if (st.hasMoreTokens()) {        
                    s1 = st.nextToken() ;
                    x = Integer.parseInt(s1);
                }
                else {
                    print("CANVAS_MOUSE_MOVE() incorrect x,y,width,height parameter:"+s);
                    return false;
                }
                if (st.hasMoreTokens()){        
                    s1 = st.nextToken() ;
                    y = Integer.parseInt(s1);
                }
                else {
                    print("CANVAS_MOUSE_MOVE() incorrect x,y,width,height parameter:"+s);
                    return false;
                }                
                if (st.hasMoreTokens()) {        
                    s1 = st.nextToken() ;
                    w = Integer.parseInt(s1);
                }
                else {
                    print("CANVAS_MOUSE_MOVE() incorrect x,y,width,height parameter:"+s);
                    return false;
                }                
                if (st.hasMoreTokens()) {        
                    s1 = st.nextToken() ;
                    h = Integer.parseInt(s1);
                } 
                else {
                    print("CANVAS_MOUSE_MOVE() incorrect x,y,width,height parameter:"+s);
                    return false;
                }                
                rCanvasMouseArea = new Rectangle(x,y,w,h);
                bMouseCanvasIdle = true;
            }
            catch (Exception e){
                print("CANVAS_MOUSE_MOVE() incorrect x,y,width,heght parameter:"+s);
                bMouseCanvasIdle = false;
            }
        }
        return true;
    } 
    // shape animation
    else if (property == shapeMoveTo)     
    {
        String s = value.toString(); 
        log("SHAPE_MOVE_TO():"+s);
        String sShape="", sName="", s1="";
        String sErr = "SHAPE_MOVE_TO() incorrect type,name,x_start,y_start,x_end,y_end,delay,step parameter:"+s;
        int xStart=0, yStart=0, xEnd=0, yEnd=0, iDelay=1000, iPixelStep=10;
        StringTokenizer st = new StringTokenizer(s,",");
        if (st.hasMoreTokens()) {
            sShape = st.nextToken();
        }
        else {
            print(sErr);
            return false;
        } 
        if (st.hasMoreTokens()) {
            sName = st.nextToken();
        }
        else {
            print(sErr);
            return false;
        }         
        try{
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                xStart = Integer.parseInt(s1);
            }
            else {
                print(sErr);
                return false;
            }
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                yStart = Integer.parseInt(s1);
            }
            else {
                print(sErr);
                return false;
            } 
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                xEnd = Integer.parseInt(s1);
            }
            else {
                print(sErr);
                return false;
            } 
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                yEnd = Integer.parseInt(s1);
            }
            else {
                print(sErr);
                return false;
            } 
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if(!s1.equals("-")){
                    iDelay = Integer.parseInt(s1);
                }
            }         
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if(!s1.equals("-")){
                    iPixelStep = Integer.parseInt(s1);
                }
            }                     
            // start the animation
            ShapeAnimation(sShape, sName, xStart, yStart, xEnd, yEnd, iDelay, iPixelStep);
        }
        catch (Exception e){
            print(sErr);
            return false;
        }            
        return true;
    }         
    // shape rotation
    else if (property == shapeRotateTo)     
    {
        String s = value.toString(); 
        log("SHAPE_ROTATE_TO():"+s);
        String sShape="", sName="", s1="", sPoint="ul";
        String sErr = "SHAPE_ROTATE_TO() incorrect type,name,rotation_in_degrees[,orientation[,delay,[step,[rotation_point]]]] parameter:"+s;
        int iRotation=0, iDelay=1000, iStep=10, iSens=1;
        StringTokenizer st = new StringTokenizer(s,",");
        if (st.hasMoreTokens()) {
            sShape = st.nextToken();
        }
        else {
            print(sErr);
            return false;
        } 
        if (st.hasMoreTokens()) {
            sName = st.nextToken();
        }
        else {
            print(sErr);
            return false;
        }         
        try{
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                iRotation = Integer.parseInt(s1);
            }
            else {
                print(sErr);
                return false;
            }
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if(!s1.equals("-")){
                    iSens = Integer.parseInt(s1);
                }
                if(iSens>0)iSens=1;
                else iSens=-1;
            }               
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if(!s1.equals("-")){
                    iDelay = Integer.parseInt(s1);
                }
            }         
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if(!s1.equals("-")){
                    iStep = Integer.parseInt(s1);
                }
            } 
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if(!sPoint.equalsIgnoreCase("ul")
                && !sPoint.equalsIgnoreCase("dl")
                && !sPoint.equalsIgnoreCase("ur")
                && !sPoint.equalsIgnoreCase("dr")
                && !sPoint.equalsIgnoreCase("c")){
                   print("SHAPE_ROTATE_TO() rotation_point must be in(ul,dl,ur,dr,c): "+s); 
                   return false;
                } 
                sPoint = s1;
            }                  
            // start the animation
            ShapeRotation(sShape, sName, iRotation, iSens, iDelay, iStep, sPoint);
        }
        catch (Exception e){
            print(sErr);
            return false;
        }            
        return true;
    }         
        
    // shape stretchTo
    else if (property == shapeStretchTo)     
    {
        String s = value.toString(); 
        log("SHAPE_STRETCH_TO():"+s);
        String sShape="", sName="", s1="";
        String sErr = "SHAPE_STRETCH_TO() incorrect type,name,width|font_size,height,delay,step parameter:"+s;
        int iX=0, iY=0, iDelay=1000, iStep=2;
        StringTokenizer st = new StringTokenizer(s,",");
        if (st.hasMoreTokens()) {
            sShape = st.nextToken();
        }
        else {
            print(sErr);
            return false;
        } 
        if (st.hasMoreTokens()) {
            sName = st.nextToken();
        }
        else {
            print(sErr);
            return false;
        }         
        try{
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                iX = Integer.parseInt(s1);
            }
            else {
                print(sErr);
                return false;
            }
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if(!s1.equals("-")){
                    iY = Integer.parseInt(s1);
                }
            }               
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if(!s1.equals("-")){
                    iDelay = Integer.parseInt(s1);
                }
            }         
            if (st.hasMoreTokens()) {
                s1 = st.nextToken();
                if(!s1.equals("-")){
                    iStep = Integer.parseInt(s1);
                }
            }                     
            // start the animation
            ShapeStretch(sShape, sName, iX, iY, iDelay, iStep);
        }
        catch (Exception e){
            print(sErr);
            return false;
        }            
        return true;
    }                 
        
    // shape transformation
    else if (property == transformGraphic)     
    {
        String s = value.toString();   
        log("TRANSFORM_GRAPHIC():"+s);
        String sShape="", sName="", sOption="", s1="", sPoint="ul";
        int iX=0, iY=0;
        float fX=0.0f, fY=0.0f;
        boolean bPercent=false, bFound=false;
        Line ln = null;
        Rect re = null;
        Poly pol = null;
        Texts txt = null;
        Ellipse el = null;
        String sErr = "TRANSFORM_GRAPHIC() wrong parameter list:"+s;
        StringTokenizer st = new StringTokenizer(s,",");
        // shape
        if (st.hasMoreTokens()) {
            sShape = st.nextToken();
        }
        else {
            print(sErr);
            return false;
        } 
        // name
        if (st.hasMoreTokens()) {
            sName = st.nextToken();
        }
        else {
            print(sErr);
            return false;
        }               
        // option
        if (st.hasMoreTokens()) {
            sOption = st.nextToken();
            if((!sOption.equalsIgnoreCase("moveto")) && (!sOption.equalsIgnoreCase("stretch")) && (!sOption.equalsIgnoreCase("rotate"))){
                print("TRANSFORM_GRAPHIC() option should be moveTo, stretch or rotate");
                return false;
            }
        }
        else{
            print(sErr);
            return false;
        }
        // X
        if (st.hasMoreTokens()) {
            s1 = st.nextToken();
            if(s1.indexOf("%")>-1){
                bPercent = true;
                s1 = s1.replaceAll("%", "");
            }
            try{
                iX = Integer.parseInt(s1);
                if(sOption.equalsIgnoreCase("rotate")){
                    if(iX < 0 || iX > 360){
                        print("TRANSFORM_GRAPHIC() rotation must be between 0 and 360:");
                        return false;
                    }
                }
            }
            catch (Exception e){
                print(sErr);
                return false;
            }
        }
        else{
            print(sErr);
            return false;
        }
        // Y
        if (st.hasMoreTokens()) {
            s1 = st.nextToken();
            if(s1.indexOf("%")>-1){
                bPercent = true;
                s1 = s1.replaceAll("%", "");
            }            
            try{
                if(sOption.equalsIgnoreCase("rotate")){
                    sPoint = s1;
                    if(!sPoint.equalsIgnoreCase("ul")
                    && !sPoint.equalsIgnoreCase("dl")
                    && !sPoint.equalsIgnoreCase("ur")
                    && !sPoint.equalsIgnoreCase("dr")
                    && !sPoint.equalsIgnoreCase("c")){
                       print("TRANSFORM_GRAPHIC() rotation must be in(ul,dl,ur,dr,c): "+s); 
                       return false;
                    }
                }
                else iY = Integer.parseInt(s1);
            }
            catch (Exception e){
                print(sErr);
                return false;
            }
        }
        else if(!sOption.equalsIgnoreCase("rotate")){    
            print(sErr);
            return false;
        } 
        // shape exist ?
        for (int i = 0; i < list_objects.size(); i++) {
            Typ_Objects to = (Typ_Objects)list_objects.get(i);
            if(to != null){
                if(to.sName.equalsIgnoreCase(sName)){
                    // found
                    bFound = true;
                    if(sShape.equalsIgnoreCase("line")){
                        ln = (Line)list_lines.get(to.sName);
                        if(sOption.equalsIgnoreCase("moveto")){
                            ln.moveTo(iX,iY);
                        }
                        else if(sOption.equalsIgnoreCase("stretch")){
                            ln.stretch(iX,iY,bPercent);
                        }        
                        else if(sOption.equalsIgnoreCase("rotate")){
                            ln.rotate((float)iX, sPoint);
                        }                        
                        list_lines.put(sName, ln);
                        break;
                    }
                    else if(sShape.equalsIgnoreCase("rect")){
                        re = (Rect)list_rects.get(to.sName);
                        if(sOption.equalsIgnoreCase("moveto")){
                            re.moveTo(iX,iY);
                        }
                        else if(sOption.equalsIgnoreCase("stretch")){
                            re.stretch(iX,iY,bPercent);
                        }  
                        else if(sOption.equalsIgnoreCase("rotate")){
                            re.rotate((float)iX, sPoint);
                        }                        
                        list_rects.put(sName, re);
                        break;
                    }    
                    else if(sShape.equalsIgnoreCase("ellipse")){
                        el = (Ellipse)list_circles.get(to.sName);
                        if(sOption.equalsIgnoreCase("moveto")){
                            el.moveTo(iX,iY);
                        }
                        else if(sOption.equalsIgnoreCase("rotate")){
                            el.rotate((float)iX, sPoint);
                        }                        
                        list_circles.put(sName, el);
                        break;
                    }                                 
                    else if(sShape.equalsIgnoreCase("shape")){
                        pol = (Poly)list_polys.get(to.sName);
                        if(sOption.equalsIgnoreCase("rotate")){
                            pol.rotate((float)iX, sPoint);
                        }  
                        list_polys.put(sName, pol);
                        break;
                    }
                    else if(sShape.equalsIgnoreCase("text")){
                        txt = (Texts)list_texts.get(to.sName);
                        if(sOption.equalsIgnoreCase("moveto")){
                            txt.moveTo(iX,iY);
                        }
                        else if(sOption.equalsIgnoreCase("stretch")){
                            float fx = txt.fScaleX, fy = txt.fScaleY;
                            fx *= (float)(iX/100.0f);
                            fy *= (float)(iY/100.0f);
                            txt.setScale(fx, fy);
                        }
                        else if(sOption.equalsIgnoreCase("rotate")){
                            txt.rotate((float)iX, sPoint);
                        }                        
                        list_texts.put(sName, txt);
                        break;
                    }    
                    break;
                }
            }
        }    
        if(!bFound){
            print("TRANSFORM_GRAPHIC() shape not found: "+s);
            return false;
        }
        else{
            if(VB != null){
                VB.getParent().repaint();
            }
        }
        return true;
    }  
    // add Animation step
    else if (property == shapeAddAnimationStep)     
    {
        String s = value.toString();   
        String s1;
        StringTokenizer st = new StringTokenizer(s,"|");
        // get animation tokens
        while (st.hasMoreTokens()) {
            s1 = st.nextToken().toLowerCase();
            if (s1.startsWith("shape_move_to=")) {
                vAnimationList.add(s1.replaceAll("shape_move_to=", "[M]"));
            }    
            else if (s1.startsWith("shape_stretch_to=")) {
                vAnimationList.add(s1.replaceAll("shape_stretch_to=", "[S]"));
            }    
            else if (s1.startsWith("shape_rotate_to=")) {
                vAnimationList.add(s1.replaceAll("shape_rotate_to=", "[R]"));
            }                
        }   
        if (vAnimationList.size() > 0) {
            for (int i = 0; i < vAnimationList.size(); i++) {
                    log("AnimationStep:"+(String)vAnimationList.get(i));
            }
        }
        return true;
    }   
    // play Animation steps
    else if (property == shapePlayAnimation)     
    {
        String s;
        if (vAnimationList.size() > 0) {
            for (int i = 0; i < vAnimationList.size(); i++) {
                s = (String)vAnimationList.get(i);
                if (s.startsWith("[M]")){
                    s = s.substring(3);
                    setProperty(shapeMoveTo, s);
                }
                else if (s.startsWith("[S]")){
                    s = s.substring(3);
                    setProperty(shapeStretchTo, s);
                }
                else if (s.startsWith("[R]")){
                    s = s.substring(3);
                    setProperty(shapeRotateTo, s);
                }                
            }
        }        
        return true;
    }
    // clear Animation steps
    else if (property == shapeClearAnimation)     
    {
        vAnimationList = new ArrayList(10);      
        return true;
    }        
    // Animation delay
    else if (property == animationDelay)     
    {
        String s = value.toString(); 
        int iDelay=1000;
        try{
            iDelay = Integer.parseInt(s);
        }
        catch (Exception e){
            print("Animation Delay wrong parameter:"+s);
            return false;
        }
        try {
            Thread.sleep(iDelay);
        } catch (Exception e) {
        };        
        return true;
    }
    else if (property == pointShapeProperty)     
    {
        String s = value.toString(); 
        log("POINT_SHAPE_PROPERTY():"+s);
        String sShape="", sName="", sOption="";
        String sErr = "POINT_SHAPE_PROPERTY() wrong parameter list shape_type, shape_name, shape_property:"+s;
        sShapeCurrentType = null;
        sShapeCurrentName = null;
        sShapeCurrentProperty = null;
        StringTokenizer st = new StringTokenizer(s,",");
        // shape type
        if (st.hasMoreTokens()) {
            sShape = st.nextToken();
        }
        else {print(sErr); return false; }
        // shape name
        if (st.hasMoreTokens()) {
            sName = st.nextToken();
        }
        else {print(sErr); return false; }
        // shape property
        if (st.hasMoreTokens()) {
            sOption = st.nextToken();
        }
        else {print(sErr); return false; } 
        sShapeCurrentType = sShape;
        sShapeCurrentName = sName;
        sShapeCurrentProperty = sOption;
        return true;
    }   
    else if (property == setShapeProperty)     
    {
        String s = value.toString(); 
        log("SHAPE_SET_PROPERTY():"+s);
        String sShape="", sName="", sOption="", sValue="";
        String sErr = "SHAPE_SET_PROPERTY() wrong parameter list shape_type, shape_name, shape_property, shape_value:"+s;
        StringTokenizer st = new StringTokenizer(s,",");
        // shape type
        if (st.hasMoreTokens()) {
            sShape = st.nextToken();
        }
        else {print(sErr); return false; }
        // shape name
        if (st.hasMoreTokens()) {
            sName = st.nextToken();
        }
        else {print(sErr); return false; }
        // shape property
        if (st.hasMoreTokens()) {
            sOption = st.nextToken();
        }
        else {print(sErr); return false; } 
        // shape value
        if (st.hasMoreTokens()) {
            sValue = st.nextToken();
        }
        else {print(sErr); return false; }         
        // find the shape
        Line ln = null;
        Rect re = null;
        Poly pol = null;
        Texts txt = null;
        Ellipse el = null;
        for (int i = 0; i < list_objects.size(); i++) {
            Typ_Objects to = (Typ_Objects)list_objects.get(i);
            if(to != null){
                if(to.sName.equalsIgnoreCase(sName)){
                    // found
                    if(sShape.equalsIgnoreCase("line")){
                        ln = (Line)list_lines.get(to.sName);
                        if(null != ln) {
                            ln.setProperty(sOption,sValue);
                            list_lines.put(to.sName,ln);
                        }
                    }
                    else if(sShape.equalsIgnoreCase("rect")){
                        re = (Rect)list_rects.get(to.sName);
                        if(null != re) {
                            re.setProperty(sOption,sValue);
                            list_rects.put(to.sName,re);
                        }
                    }    
                    else if(sShape.equalsIgnoreCase("ellipse")){
                        el = (Ellipse)list_circles.get(to.sName);
                        if(null != el) {
                            el.setProperty(sOption,sValue);
                            list_circles.put(to.sName,el);
                        }
                    }                                 
                    else if(sShape.equalsIgnoreCase("shape")){
                        pol = (Poly)list_polys.get(to.sName);
                        if(null != pol) {
                            pol.setProperty(sOption,sValue);
                            list_polys.put(to.sName,pol);
                        }
                    }
                    else if(sShape.equalsIgnoreCase("text")){
                        txt = (Texts)list_texts.get(to.sName);
                        if(null != txt) {
                            txt.setProperty(sOption,sValue);
                            list_texts.put(to.sName,txt);
                        }
                    }
                    if(VB != null){
                        VB.getParent().repaint();
                    }
                }
            }
        } 
        return true;
    }     

        // ------ other properties --------
        else {
            return super.setProperty(property, value);
        }
    }

    /*-------   end setProperty()    -----------------------------------------------------*/

    // Shape animation
    void ShapeAnimation(final String sShape, final String sName, final int xStart, final int yStart, final int xEnd, final int yEnd, final int iDelay, final int iStep){
        log("ShapeAnimation()shape:"+sShape+" name:"+sName+" X1:"+xStart+" Y1:"+yStart+" X2:"+xEnd+" Y2:"+yEnd+" delay:"+iDelay+" step:"+iStep);
        try {
            new Thread() {
                public void run() {
                    // find the shape
                    int iX1 = xStart, iY1 = yStart;
                    int iX2 = xEnd, iY2 = yEnd;
                    int iSignX = xEnd >= xStart ? 1 : -1 ;
                    int iSignY = yEnd >= yStart ? 1 : -1 ;
                    int iWidth=0, iHeight=0;
                    boolean bCont = false;
                    Line ln = null;
                    Rect re = null;
                    Poly pol = null;
                    Texts txt = null;
                    Ellipse el = null;
                    for (int i = 0; i < list_objects.size(); i++) {
                        Typ_Objects to = (Typ_Objects)list_objects.get(i);
                        if(to != null){
                            if(to.sName.equalsIgnoreCase(sName)){
                                // found
                                if(sShape.equalsIgnoreCase("line")){
                                    ln = (Line)list_lines.get(to.sName);
                                    ln.moveTo(xStart, yStart);
                                    list_circles.put(sName, ln);
                                    bCont = true;
                                    break;
                                }
                                else if(sShape.equalsIgnoreCase("rect")){
                                    re = (Rect)list_rects.get(to.sName);
                                    re.moveTo(xStart, yStart);
                                    list_rects.put(sName, re);
                                    bCont = true;
                                    break;
                                }    
                                else if(sShape.equalsIgnoreCase("ellipse")){
                                    el = (Ellipse)list_circles.get(to.sName);
                                    el.moveTo(xStart, yStart);
                                    list_circles.put(sName, el);
                                    bCont = true;
                                    break;
                                }                                 
                                else if(sShape.equalsIgnoreCase("shape")){
                                    pol = (Poly)list_polys.get(to.sName);
                                    bCont = true;
                                    break;
                                }
                                else if(sShape.equalsIgnoreCase("text")){
                                    txt = (Texts)list_texts.get(to.sName);
                                    txt.iX = xStart ;
                                    txt.iY = yStart ;
                                    list_texts.put(sName, txt);
                                    bCont = true;
                                    break;
                                }                        
                            }
                        }
                    }
                    if(!bCont){
                        print("ShapeAnimation() shape not found: "+sShape+","+sName);                    
                    }
                    else {
                        try {
                            // new position
                            float i1 = (xEnd-xStart)/iStep != 0 ? (xEnd-xStart)/iStep : 1 ;
                            float i2 = (yEnd-yStart)/iStep != 0 ? (yEnd-yStart)/iStep : 1 ;
                            float iDecX = ((xEnd-xStart)/i1);
                            float iDecY = ((yEnd-yStart)/i2); 
                            float fDiff = 0.0f;
                            float ii;
                            if(Math.abs(i1)>=Math.abs(i2))fDiff = Math.abs(Math.abs(i1)/Math.abs(i2));
                            else fDiff = Math.abs(Math.abs(i2)/Math.abs(i1));
                            if(fDiff > 1.2f){
                                if(Math.abs(i1) > Math.abs(i2)){
                                    ii = Math.abs((float)((i2 * iDecY) / i1));
                                    iDecY = ii > 0 ? ii : 1;
                                }
                                else{
                                    ii = Math.abs((float)((i1 * iDecX) / i2));
                                    iDecX = ii > 0 ? ii : 1;
                                }
                            }
                            log("ShapeAnimation() iDecX:"+(iSignX*iDecX)+" iDecY:"+(iSignY*iDecY));
                            bCont = true;  
                            boolean bConts[] = {true,true};
                            boolean bContX=true, bContY=true;
                            if(iDecX<iStep && iDecY<iStep){
                                bCont = false;
                            }
                            while(bCont){
                                if(sShape.equalsIgnoreCase("line")){
                                    ln.pStart.x += (iSignX*iDecX) ;
                                    ln.pStart.y += (iSignY*iDecY) ;
                                    ln.pEnd.x   += (iSignX*iDecX) ;
                                    ln.pEnd.y   += (iSignY*iDecY) ;
                                    log("ShapeAnimation()line new pos X:"+ln.pStart.x+" Y:"+ln.pStart.y);
                                    bConts = isTargetReached(iSignX, iSignY, xEnd, yEnd, ln.pStart.x, ln.pStart.y);
                                    if(bConts[0]==false) {ln.moveTo(xEnd, ln.pEnd.y);}
                                    if(bConts[1]==false) {ln.moveTo(ln.pEnd.y, yEnd);}                                      
                                    list_lines.put(sName, re);
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    }  
                                    if(bConts[0]==false && bConts[1]==false){
                                        bCont = false;
                                    }                                      
                                }
                                else if(sShape.equalsIgnoreCase("ellipse")){
                                    el.iX1 += Math.round(iSignX*iDecX) ;
                                    el.iY1 += Math.round(iSignY*iDecY) ;
                                    log("ShapeAnimation()ellipse new pos X:"+el.iX1+" Y:"+el.iY1);                                    
                                    bConts = isTargetReached(iSignX, iSignY, xEnd, yEnd, el.iX1, el.iY1);
                                    if(bConts[0]==false) el.iX1 = xEnd ;
                                    if(bConts[1]==false) el.iY1 = yEnd ;                                 
                                    list_circles.put(sName, el);
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    } 
                                    if(bConts[0]==false && bConts[1]==false){
                                        bCont = false;
                                    }                                    
                                }                                  
                                else if(sShape.equalsIgnoreCase("rect")){
                                    re.iX1 += (iSignX*iDecX) ;
                                    re.iY1 += (iSignY*iDecY) ;
                                    bConts = isTargetReached(iSignX, iSignY, xEnd, yEnd, re.iX1, re.iY1);
                                    if(bConts[0]==false) re.iX1 = xEnd ;
                                    if(bConts[1]==false) re.iY1 = yEnd ;
                                    log("ShapeAnimation()rect new pos X:"+re.iX1+" Y:"+re.iY1);
                                    list_rects.put(sName, re);
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    }                                                                        
                                    if(bConts[0]==false && bConts[1]==false){
                                        bCont = false;
                                    }
                                }                               
                                else if(sShape.equalsIgnoreCase("shape")){
    
                                }
                                else if(sShape.equalsIgnoreCase("text")){
                                    iX1 += (iStep*iSignX) ;
                                    iY1 += (iStep*iSignY) ;
                                    if(iSignX > 0 && iX1 >= xEnd) {iX1 = xEnd; bContX=false;}
                                    if(iSignX < 0 && iX1 <= xEnd) {iX1 = xEnd; bContX=false;}
                                    if(iSignY > 0 && iY1 >= yEnd) {iY1 = yEnd; bContY=false;}
                                    if(iSignY < 0 && iY1 <= yEnd) {iY1 = yEnd; bContY=false;}
                                    txt.moveTo(iX1,iY1);
                                    list_texts.put(sName, txt);
                                    //print("iX1:"+iX1+" iY1:"+iY1+"  xEnd:"+xEnd+" yEnd:"+yEnd+"  bX:"+bContX+" bY:"+bContY);
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    }
                                    if(!bContX && !bContY){
                                        bCont = false;
                                    }
                                }                              
                                try {
                                    Thread.sleep(iDelay);
                                } catch (Exception e) {
                                };
                            }    
                            dispatchanevent(shapeMoveEvent, shapeMoveDone, sName);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                }
            }.start();
        
        } catch (Exception e) {
                e.printStackTrace();
        }
    }
    // Shape stretch
    void ShapeStretch(final String sShape, final String sName, final int iX, final int iY, final int iDelay, final int iStep){
        log("ShapeStretch()shape:"+sShape+" name:"+sName+" width:"+iX+" height:"+iY+" delay:"+iDelay+" step:"+iStep);
        try {
            new Thread() {
                public void run() {
                    // find the shape
                    int iSensX = 1, iSensY = 1;
                    int iNewX=0, iNewY=0;
                    boolean bCont = false;
                    boolean bContX = true, bContY = true;
                    Line ln = null;
                    Rect re = null;
                    Poly pol = null;
                    Texts txt = null;
                    Ellipse el = null;
                    for (int i = 0; i < list_objects.size(); i++) {
                        Typ_Objects to = (Typ_Objects)list_objects.get(i);
                        if(to != null){
                            if(to.sName.equalsIgnoreCase(sName)){
                                // found
                                if(sShape.equalsIgnoreCase("line")){
                                    ln = (Line)list_lines.get(to.sName);
                                    iNewX = ln.pEnd.x;
                                    iNewY = ln.pEnd.y;
                                    if(ln.pEnd.x > iX){
                                        iSensX = -1 ;
                                    }
                                    if(ln.pEnd.y > iY){
                                        iSensY = -1 ;
                                    }                                    
                                    bCont = true;
                                    break;
                                }
                                else if(sShape.equalsIgnoreCase("rect")){
                                    re = (Rect)list_rects.get(to.sName);
                                    iNewX = re.iX2;
                                    iNewY = re.iY2;
                                    if(re.iX2 > iX){
                                        iSensX = -1 ;
                                    }
                                    if(re.iY2 > iY){
                                        iSensY = -1 ;
                                    }   
                                    bCont = true;
                                    break;
                                }    
                                else if(sShape.equalsIgnoreCase("ellipse")){
                                    el = (Ellipse)list_circles.get(to.sName);
                                    iNewX = el.iX2;
                                    iNewY = el.iY2;
                                    if(el.iX2 > iX){
                                        iSensX = -1 ;
                                    }
                                    if(el.iY2 > iY){
                                        iSensY = -1 ;
                                    }              
                                    bCont = true;
                                    break;
                                }                                 
                                else if(sShape.equalsIgnoreCase("shape")){
                                    pol = (Poly)list_polys.get(to.sName);
                                    bCont = true;
                                    break;
                                }
                                else if(sShape.equalsIgnoreCase("text")){
                                    txt = (Texts)list_texts.get(to.sName);
                                    iNewX = txt.getFontSize();
                                    log("ShapeStretch()text start font size :"+iNewX);
                                    if(iNewX > iX){
                                        iSensX = -1 ;
                                    }
                                    bCont = true;
                                    break;
                                }                        
                            }
                        }
                    }
                    if(!bCont){
                        print("ShapeStretch() shape not found: "+sShape+","+sName);                    
                    }
                    else {
                        try {
                            bCont = true;
                            while(bCont){
                                if(sShape.equalsIgnoreCase("line")
                                || sShape.equalsIgnoreCase("rect")
                                || sShape.equalsIgnoreCase("ellipse")){
                                    // new size
                                    if(bContX){
                                        if(iSensX>0){
                                            iNewX += iStep;
                                            if(iNewX >= iX){
                                                iNewX = iX;
                                                bContX = false;
                                            }
                                        }
                                        else{
                                            iNewX -= iStep;
                                            if(iNewX <= iX){
                                                iNewX = iX;
                                                bContX = false;
                                            }                                        
                                        }
                                    } 
                                    if(bContY){
                                        if(iSensY>0){
                                            iNewY += iStep;
                                            if(iNewY >= iY){
                                                iNewY = iY;
                                                bContY = false;
                                            }
                                        }
                                        else{
                                            iNewY -= iStep;
                                            if(iNewY <= iY){
                                                iNewY = iY;
                                                bContY = false;
                                            }                                        
                                        }
                                    }                                 
                                }
                                if(sShape.equalsIgnoreCase("line")){
                                    ln.pEnd.x =iNewX;
                                    ln.pEnd.y =iNewY;
                                    list_lines.put(sName, ln);
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    } 
                                    if(!bContX && !bContY){
                                        bCont = false;
                                    }                                     
                                }
                                else if(sShape.equalsIgnoreCase("ellipse")){
                                    el.iX2 =iNewX;
                                    el.iY2 =iNewY;
                                    list_circles.put(sName, el);  
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    } 
                                    if(!bContX && !bContY){
                                        bCont = false;
                                    }                              
                                }                                  
                                else if(sShape.equalsIgnoreCase("rect")){
                                    re.iX2 =iNewX;
                                    re.iY2 =iNewY;
                                    list_rects.put(sName, re);  
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    } 
                                    if(!bContX && !bContY){
                                        bCont = false;
                                    }
                                }                               
                                else if(sShape.equalsIgnoreCase("shape")){
        
                                }
                                else if(sShape.equalsIgnoreCase("text")){
                                    // new size
                                    if(bContX){
                                        if(iSensX>0){
                                            iNewX += iStep;
                                            if(iNewX >= iX){
                                                iNewX = iX;
                                                bCont = false;
                                            }
                                        }
                                        else{
                                            iNewX -= iStep;
                                            if(iNewX <= iX){
                                                iNewX = iX;
                                                bCont = false;
                                            }                                        
                                        }
                                        txt.setNewSize(iNewX);
                                        list_texts.put(sName, txt);
                                        log("ShapeStretch()text new size X:"+iNewX);
                                        if(VB != null){
                                            VB.getParent().repaint();
                                        }
                                    }           
                                }
                                try {
                                    Thread.sleep(iDelay);
                                } catch (Exception e) {
                                };
                            }    
                            dispatchanevent(shapeMoveEvent, shapeMoveDone, sName);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                }
            }.start();
        } catch (Exception e) {
                e.printStackTrace();
        }
    }
            // Shape rotation
    void ShapeRotation(final String sShape, final String sName, final int iRotation, final int iSens, final int iDelay, final int iStep, final String sRotPoint){
        try {
            new Thread() {
                public void run() {
                    // find the shape
                    float f2=0.0f, fCur=0.0f, fNew=(float)iRotation, fNew2=(float)iRotation;
                    boolean bCont = false;
                    Line ln = null;
                    Rect re = null;
                    Poly pol = null;
                    Texts txt = null;
                    Ellipse el = null;
                    for (int i = 0; i < list_objects.size(); i++) {
                        Typ_Objects to = (Typ_Objects)list_objects.get(i);
                        if(to != null){
                            if(to.sName.equalsIgnoreCase(sName)){
                                // found
                                if(sShape.equalsIgnoreCase("line")){
                                    ln = (Line)list_lines.get(to.sName);
                                    bCont = true;
                                    break;
                                }
                                else if(sShape.equalsIgnoreCase("rect")){
                                    re = (Rect)list_rects.get(to.sName);
                                    bCont = true;
                                    break;
                                }    
                                else if(sShape.equalsIgnoreCase("ellipse")){
                                    el = (Ellipse)list_circles.get(to.sName);
                                    bCont = true;
                                    break;
                                }                                 
                                else if(sShape.equalsIgnoreCase("shape")){
                                    pol = (Poly)list_polys.get(to.sName);
                                    bCont = true;
                                    break;
                                }
                                else if(sShape.equalsIgnoreCase("text")){
                                    txt = (Texts)list_texts.get(to.sName);
                                    f2 = fCur = txt.fRotate;
                                    if(iSens>0){
                                        if(fCur > fNew) fNew2 += 360.0f ;
                                    }
                                    else{
                                        if(fCur < fNew) fNew2 -= 360.0f ;                                        
                                    }
                                    bCont = true;
                                    break;
                                }                        
                            }
                        }
                    }
                    if(!bCont){
                        print("ShapeRotation() shape not found: "+sShape+","+sName);                    
                    }
                    else {
                        try {
                            // new angle
                            float f = 0.0f;
                            bCont = true;
                            while(bCont){
                                if(iSens>0){
                                    f = fCur + (float)iStep;
                                    f2 += (float)iStep;
                                    if(f > 360.0f) f -= 360.0f ;
                                    if(f2 >= fNew2){
                                        f = fNew;
                                        bCont= false;
                                    }
                                }       
                                else{
                                    f = fCur - (float)iStep;
                                    f2 -= (float)iStep;
                                    if(f < 0.0f) f += 360.0f ;
                                    if(f2 <= fNew2) {
                                        f = fNew;
                                        bCont= false;
                                    }                                    
                                }
                                fCur = f;
                                if(sShape.equalsIgnoreCase("line")){
                                    log("ShapeRotation()line new pos X:"+ln.pStart.x+" Y:"+ln.pStart.y);
                                    ln.rotate(fCur,sRotPoint);
                                    list_lines.put(sName, ln);
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    }                                    
                                }
                                else if(sShape.equalsIgnoreCase("ellipse")){
                                    log("ShapeRotation()ellipse new pos X:"+el.iX1+" Y:"+el.iY1); 
                                    el.rotate(fCur,sRotPoint);
                                    list_circles.put(sName, el);
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    }                                    
                                }                                  
                                else if(sShape.equalsIgnoreCase("rect")){
                                    log("ShapeRotation()rect new pos X:"+re.iX1+" Y:"+re.iY1);
                                    re.rotate(fCur,sRotPoint);
                                    list_rects.put(sName, re);
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    }                                    
                                }                               
                                else if(sShape.equalsIgnoreCase("shape")){
                                    log("ShapeRotation new angle:"+fCur);
                                    pol.rotate(fCur,sRotPoint);
                                    list_polys.put(sName, pol);
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    }    
                                }
                                else if(sShape.equalsIgnoreCase("text")){
                                    log("ShapeRotation new angle:"+fCur);
                                    txt.rotate(fCur,sRotPoint);
                                    list_texts.put(sName, txt);
                                    if(VB != null){
                                        VB.getParent().repaint();
                                    }
                                }                              
                                try {
                                    Thread.sleep(iDelay);
                                } catch (Exception e) {
                                };
                            }    
                            dispatchanevent(shapeMoveEvent, shapeMoveDone, sName);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                }
            }.start();
        
        } catch (Exception e) {
                e.printStackTrace();
        }
    }
/*
      boolean isTargetReached(int iSignX, int iSignY, int xEnd, int yEnd, int iX1, int iY1){
        boolean bCont = true;
        if(iSignX > 0 && iSignY > 0){
            if((iX1 >= xEnd) && (iY1 >= yEnd)) {
                bCont = false;
            }
        }
        else if(iSignX > 0 && iSignY < 0){
            if((iX1 >= xEnd) && (iY1 <= yEnd)) {
                bCont = false;
            }
        } 
        else if(iSignX < 0 && iSignY > 0){
            if((iX1 <= xEnd) && (iY1 >= yEnd)) {
                bCont = false;
            }
        }                                    
        else if(iSignX < 0 && iSignY < 0){
            if((iX1 <= xEnd) && (iY1 <= yEnd)) {
                bCont = false;
            }
        }
        return bCont;
    }
 */
      boolean[] isTargetReached(int iSignX, int iSignY, int xEnd, int yEnd, int iX1, int iY1){
        boolean bCont[] = {true,true};
        if(iSignX > 0 && iSignY > 0){
            if((iX1 >= xEnd) && (iY1 >= yEnd)) {
                bCont[0] = false; bCont[1] = false;
            }
            if(iX1 >= xEnd){
                bCont[0] = false; 
            }
            if(iY1 >= yEnd){
                bCont[1] = false; 
            }            
        }
        else if(iSignX > 0 && iSignY < 0){
            if((iX1 >= xEnd) && (iY1 <= yEnd)) {
                bCont[0] = false; bCont[1] = false;
            }
            if(iX1 >= xEnd) {
                bCont[0] = false;
            }
            if(iY1 <= yEnd) {
                bCont[1] = false;
            }            
        } 
        else if(iSignX < 0 && iSignY > 0){
            if((iX1 <= xEnd) && (iY1 >= yEnd)) {
                bCont[0] = false; bCont[1] = false;
            }
            if(iX1 <= xEnd) {
                bCont[0] = false;
            }
            if(iY1 >= yEnd) {
                bCont[1] = false;
            }            
        }                                    
        else if(iSignX < 0 && iSignY < 0){
            if((iX1 <= xEnd) && (iY1 <= yEnd)) {
                bCont[0] = false; bCont[1] = false;
            }
            if(iX1 <= xEnd) {
                bCont[0] = false;
            }
            if(iY1 <= yEnd) {
                bCont[1] = false;
            }            
        }
        return bCont;
    }
    // get the table object
    cDynTable getDynTable(String s){
      cDynTable cs = (cDynTable)hTables.get(sName);
      return cs;
    }
      
    boolean setDynTableProperty(ID property, Object value)
    {
      if(property != TBSETIMAGE && (property != TBSETADDTEXT)) {
        log_table("- LAF DynTable "+property+":"+value);      
      }
      else if(value.toString().endsWith("[END_IMAGE]")) { 
        log_table("- LAF DynTable "+property+":[End Image description]");        
      }
      else if(value.toString().endsWith("[^END-TEXT^]")) { 
        log_table("- LAF DynTable "+property+":[End CLOB description]");        
      }      
      String s = value.toString();
      boolean b = true;
      String sName = "", sValue="";    
      StringTokenizer st = new StringTokenizer(s, "|");
      // Table name
      if (st.hasMoreTokens()) {
          sName = st.nextToken().toUpperCase();
      } else
      return false;                
      // get table
      cDynTable cs = (cDynTable)hTables.get(sName);
      if(null == cs){
          log_table("- LAF DynTable setDynTableProperty() table not found:"+sName);
          return false;
      }
      if (cs != null) {
          if (st.hasMoreTokens()) {
            sValue = st.nextToken();
          }         
	    //
	    // set the header
	    //
	    if (property == TBSETHEADER) 
	    {
	      b = cs.tb.setHeader(sValue);
	    }
	    //
	    // set the image
	    //
	    else if(property==TBSETIMAGE)
	    {
              b = cs.tb.setImage(sValue);
	    }
	    //
	    // set the image to read
	    //
	    else if(property==TBSETIMAGETOREAD)
	    {
	      b = cs.tb.setImageToRead(sValue);
	    }            
	    //
	    // show / hide
	    //
	    else if(property==TBSETVISIBLE)
	    {
                cs.setVisible(sValue.equalsIgnoreCase("true") ? true : false);
                b = true ;
	    }	    
	    //
	    // image size
	    //
	    else if (property == TBSETIMAGESIZE)
	    {
                b = cs.tb.setImageSize(sValue);
	    }
	    
	    //
	    // Table panel background
	    //
	    else if (property == TBBACKGROUND)
	    {
                b = cs.tb.setBackground(sValue);
	    }
	    //
	    // column auto resize mode
	    //
	    else if (property == TBSETRESIZEMODE)
	    {
                b = cs.tb.setResizeMode(sValue);
	    } 
            //
            // set rows number
            //
            else if (property == TBSETNUMROWS)
            {
                b = cs.tb.setTableNumRows(sValue);
            } 
            //
            // set page size
            //
            else if (property == TBSETPAGESIZE)
            {
                b = cs.tb.setTablePageSize(sValue);
            }             
	    //
	    // table refresh
	    //
	    else if (property == TBSETREFRESH)
	    {
                b = cs.tb.setTableRefresh(sValue);
	    }            
	    //
	    // # visible rows
	    //
	    else if (property == TBSETVISIBLEROWS)
	    {
                b = cs.tb.setVisibleRows(sValue);
	    }   
	    //
	    // set the table border
	    //
	    else if (property == TBSETBORDER)
	    { 
                b = cs.tb.setBorder(sValue);
	    }             
	    //
	    // set the panel border
	    //
	    else if (property == TBSETPANELBORDER)
	    { 
                b = cs.tb.setPanelBorder(sValue);
	    }   	    
	    //
	    // set the columns type
	    //
	    else if (property == TBSETCOLSTYPE)
	    {
                b = cs.tb.setColsType(sValue);
	    }    
	 
	    //
	    // set the current cell value
	    //
	    if (property == TBSETCURCELLVALUE) 
	    {
                b = cs.tb.setCurCellValue(sValue);
	    }
	     
	    //
	    // set the Cell value
	    //
	    if (property == TBSETCELLVALUE) 
	    {
                b = cs.tb.setCellValue(sValue);
	    }
	    
	    //
	    // set the row properties
	    //
	    if (property == TBSETROWPROP) 
	    {
                b = cs.tb.setRowProp(sValue);
	    }
	    
	    //
	    // set the cell properties
	    //
	    if (property == TBSETCELLPROP) 
	    {
                b = cs.tb.setCellProp(sValue);
	    }
	    //
	    // set the cell instance properties
	    //
	    if (property == TBSETCELLINSTPROP) 
	    {
                b = cs.tb.setCellInstProp(sValue);
	    }            
	
	    //
	    // set the data
	    //
	    else if (property == TBSETDATA) 
	    {
                b = cs.tb.setData(sValue);
	    }
	    //
	    // set the default date format
	    //
	    else if (property == TBSETDATEFORMAT)
	    {
                b = cs.tb.setDateFormat(sValue);
	    }    
	    //
	    // set the default number format
	    //
	    else if (property == TBSETNUMFORMAT)
	    {
                b = cs.tb.setNumFormat(sValue);
	    }    
	    //
	    // set the default integer format
	    //
	    else if (property == TBSETINTFORMAT)
	    {
                b = cs.tb.setIntFormat(sValue);
	    }              
	    //
	    // set the log trace
	    //
	    else if (property == TBSETLOG) 
	    {
                b = cs.tb.setLog(sValue);
	    }
	    //
	    // set the vertical lines
	    //
	    else if (property == TBSETVLINE) 
	    {
                b = cs.tb.setVLine(sValue);
	    }    
	    //
	    // set the vertical lines
	    //
	    else if (property == TBSETHLINE) 
	    {
                b = cs.tb.setHLine(sValue);
	    }    
	    //
	    // set the title
	    //
	    else if (property == TBSETTITLE) 
	    {
                b = cs.tb.setTitle(sValue);
	    }
	    //
	    // set the title font
	    //
	    else if (property == TBSETTITLEFONT) 
	    {
                b = cs.tb.setTitleFont(sValue);
	    }            
	    //
	    // set the title alignment
	    //
	    else if (property == TBSETTITLEALIGN) 
	    {
                b = cs.tb.setTitleAlign(sValue);
	    } 
	    //
	    // set the title colors
	    //
	    else if (property == TBSETTITLECOLORS) 
	    {
                b = cs.tb.setTitleColors(sValue);
	    }
	    //
	    // set the title colors
	    //
	    else if (property == TBSETTOTALCOLORS) 
	    {
                b = cs.tb.setTotalColors(sValue);
	    }              
	    //
	    // show/hide the title
	    //
	    else if (property == TBSETSHOWTITLE) 
	    {
                b = cs.tb.setTitleShow(sValue);
	    }              
	    //
	    // set the alert translations
	    //
	    else if (property == TBSETALERTSTRINGS) 
	    {
                b = cs.tb.setAlertStrings(sValue);
	    }    
	    //
	    // set the close button label
	    //
	    else if (property == TBSETCLOSELABEL) 
	    {
                b = cs.tb.setEditorButtonLabels(sValue);
	    }   
	    //
	    // set the Find box labels
	    //
	    else if (property == TBSETFINDLABELS) 
	    {
                b = cs.tb.setEditorFindLabels(sValue);
	    }             
	    //
	    // set the filter
	    //
	    else if (property == TBSETFILTER) 
	    {
                b = cs.tb.setFilter(sValue);
	    }
	    //
	    // set the focus
	    //
	    else if (property == TBSETFOCUS) 
	    {
                b = cs.tb.setFocus(sValue);
	    }              
	    //
	    // set the reorder flag
	    //
	    else if (property == TBSETREORDER) 
	    {
                b = cs.tb.setReorder(sValue);
	    } 
	    //
	    // set the table extend flag
	    //
	    else if (property == TBSETCANEXTEND) 
	    {
                b = cs.tb.setExtend(sValue);
	    }  
	    //
	    // set the CLOB editor extend flag
	    //
	    else if (property == TBSETEDITEXTEND) 
	    {
                b = cs.tb.setCLOBExtend(sValue);
	    }              
	    //
	    // set the resize flag
	    //
	    else if (property == TBSETRESIZE) 
	    {
                b = cs.tb.setResize(sValue);
	    }        
	    //
	    // set the array size
	    //
	    else if (property == TBSETARRAYSIZE) // set the number of columns
	    {                                  // (nbCols, nbRows)
                b = cs.tb.setArraySize(sValue);
	    }        
	    //
	    // set the frame bounds
	    //
	    else if (property == TBSETBOUNDS) 
	    {
                b = cs.tb.setBounds(sValue);
	    }    
	    //
	    // set the selection background color
	    //
	    else if (property == TBSETSELECTBACK) 
	    {
                b = cs.tb.setSelectBack(sValue);
	    }
	    //
	    // set the selection foreground color
	    //
	    else if (property == TBSETSELECTFORE) 
	    {
                b = cs.tb.setSelectFore(sValue);
	    } 
	    //    
	    // set the header background color
	    //
	    else if (property == TBSETHEADBG) 
	    {
                b = cs.tb.setHeadBG(sValue);
	    }
	    //    
	    // set the columns max width
	    //
	    else if (property == TBSETCOLSMAXWIDTH) 
	    {
                b = cs.tb.setColsMaxWidth(sValue);
	    }       
	    //    
	    // set the header height
	    //
	    else if (property == TBSETHEADHEIGHT) 
	    {
                b = cs.tb.setHeadHeight(sValue);
	    }   
	    //    
	    // set the total header height
	    //
	    else if (property == TBSETTOTALHEADHEIGHT) 
	    {
                b = cs.tb.setTotalHeadHeight(sValue);
	    }       
	    //    
	    // set the total line
	    //
	    else if (property == TBSETTOTALLINE) 
	    {
                b = cs.tb.setTotalLine(sValue);
	    }  
	    
	    //    
	    // set the total line labels
	    //
	    else if (property == TBSETTOTALLINELABELS) 
	    {
                b = cs.tb.setTotalLineLabels(sValue);
	    }         
	    
	    //
	    // set the header foreground color
	    //
	    else if (property == TBSETHEADFG) 
	    {
                b = cs.tb.setHeadFG(sValue);
	    }    
	    //
	    // set the header background color
	    //
	    else if (property == TBSETDATABG) 
	    {
                b = cs.tb.setDataBG(sValue);
	    }
	    //
	    // set the table background color
	    //
	    else if (property == TBSETTABLEBG) 
	    {
                b = cs.tb.setTableBG(sValue);
	    }    
	    //
	    // set the header foreground color
	    //
	    else if (property == TBSETDATAFG) 
	    {
                b = cs.tb.setDataFG(sValue);
	    } 
	    //
	    // set the grid color
	    //
	    else if (property == TBSETGRIDFG) 
	    {
                b = cs.tb.setGridFG(sValue);
	    } 
	    // add CLOB text
            else if (property == TBSETADDTEXT) 
	    {
                b = cs.tb.addText(sValue);
	    }            
	    //
	    // can update, insert or delete the table ?
	    //
	    else if (property == TBSETUPDATE) 
	    {
                b = cs.tb.setUpdate(sValue);
	    } 
	    else if (property == TBSETINSERT) 
	    {
                b = cs.tb.setInsert(sValue);
	    } 
	    else if (property == TBSETDELETE) 
	    {
                b = cs.tb.setDelete(sValue);
	    }
	    //
	    // insert a row
	    //
	    else if (property == TBINSERTROW) 
	    {
                b = cs.tb.setAddRow(sValue);
	    } 
	    //
	    // delete a row
	    //
	    else if (property == TBDELETEROW) 
	    {
                b = cs.tb.setDelRow(sValue);
	    }             
	    //
	    // raz the values
	    //
	    else if (property == TBINIT) 
	    {
                b = cs.tb.init(sValue);
	    }
	    else if (property == TBCLEARREFRESH) 
	    {
                cs.tb.clearRefresh();
                b = true;
	    }  
	    else if (property == TBISROWID) 
	    {
                cs.tb.setROWID(sValue);
                b = true;
	    }               
            
	    //
	    // set the separator character
	    //
	    else if (property == TBSETSEPARATOR) 
	    {
                b = cs.tb.setSeparator(sValue);
	    } 
	    //
	    // get the value of a particular cell
	    //
	    else if (property == TBSETCELLPOS) 
	    {
                b = cs.tb.setCellPos(sValue);
	    }     
	    //
	    // set the pointer on a particular row
	    //
	    else if (property == TBSETROWPOS) 
	    {
                b = cs.tb.setRowPos(sValue);
	    }
	    //
	    // set the ROWID for inserted, update or delete row
	    //
	    else if (property == TBSETINSERTDONE) 
	    {
                b = cs.tb.setInsertDone(sValue);
	    } 
	    else if (property == TBSETUPDATEDONE) 
	    {
                b = cs.tb.setUpdateDone(sValue);
	    } 
	    else if (property == TBSETDELETEDONE) 
	    {
                b = cs.tb.setDeleteDone(sValue);
	    }             
	    //
	    // set the pointer on a particular rowid
	    //
	    else if (property == TBSETROWIDPOS) 
	    {
                b = cs.tb.setRowIdPos(sValue);
	    }              
	    //
	    // set the locale
	    //
	    else if (property == TBSETLOCALE)     
	    {
                b = cs.tb.setLocale(sValue);
	    }
	    //
	    // set the decimal separators
	    //
	    else if (property == TBSETDECSEPARATORS)     
	    {
                b = cs.tb.setDecSeparators(sValue);
	    }
	    
	    //
	    // show the JTable
	    // 
	    else if (property == TBSHOW) 
	    {
                b = cs.tb.showTable(sValue);
	    }

      } else {
          print("LAF DynTable cannot find table name:" + sName);
          b  = false;
      }  
      return b;
    }
    
    /*-------------------------------------------------*
     *    clear the icom image of label before sort    *
     *-------------------------------------------------*/

    private void clearIconSort(String pBlockName) {
        if (mapLabelIcon.containsKey(pBlockName)) {
            List arrLabel = new ArrayList();
            arrLabel = (ArrayList)mapLabelIcon.get(pBlockName);
            for (int i = 0; i < arrLabel.size(); i++) {
                JLabel item = (JLabel)arrLabel.get(i);
                item.setIcon(null);
            }
        }
    }

    /*------------------------------------------*
     *  get the indice for the given new item   *
     *------------------------------------------*/

    int getNewItemIndice(String sItemName) {
        int indice = -1;
        newItem ni = null;
        for (int i = 0; i < ListItems.size(); i++) {
            ni = (newItem)DrawLAF.ListItems.get(i);
            if (ni.sName.equalsIgnoreCase(sItemName)) {
                indice = i;
                break;
            }
        }
        return indice;
    }

    /*--------------------------------------------*
     *  get the indice for the given Forms item   *
     *--------------------------------------------*/

    int getFormsItemIndice(Point p) {
        int indice = -1;
        newItem ni = null;
        for (int i = 0; i < ListFormsItems.size(); i++) {
            ni = (newItem)ListFormsItems.get(i);
            Rectangle r = new Rectangle(ni.iX, ni.iY, ni.iW, ni.iH);
            if (r.contains(p)) {
                indice = i;
                log("getFormsItemIndice() item found:" + ni.sName);
                ni.setRect(r);
                ListFormsItems.set(indice, ni);
                iNbFormsItems++;
                break;
            }
        }
        return indice;
    }

    /*----------------------------------------*
     *  handle the New Items mouse listener   *
     *----------------------------------------*/
    void handleMousListener(MouseEvent e, String s1, String s2, String s3, String s4, String s5) {
        try {
            CustomEvent ce = new CustomEvent(m_handler, ITEM_ACTION);
            m_handler.setProperty(ITEM_ACTION_OBJECT, s1);
            m_handler.setProperty(ITEM_ACTION_NAME, e.getComponent().getName());
            m_handler.setProperty(ITEM_ACTION_TYPE, s2);
            m_handler.setProperty(ITEM_ACTION_VALUE, s3);
            m_handler.setProperty(ITEM_ACTION_MOUSEPOS, s4);
            m_handler.setProperty(ITEM_ACTION_MOUSEBUTTON, s5);
            dispatchCustomEvent(ce);
        } catch (Exception ex) {
            print("Create Item Event(): -> exception while dispatching: " + ex);
            ex.printStackTrace();
        }
    }


    /*-------------------------------------------*
     *  get the indice for the given new image   *
     *-------------------------------------------*/

    int getImageItemIndice(String sItemName) {
        int indice = -1;
        NewImage ni = null;
        for (int i = 0; i < list_imgs.size(); i++) {
            ni = (NewImage)list_imgs.get(i);
            if (ni.sName.equalsIgnoreCase(sItemName)) {
                indice = i;
                break;
            }
        }
        return indice;
    }

    /*---------------------------------*
     *  mouse listener for new items   *
     *---------------------------------*/
    MouseListener ItemMouseListener(final String sType, final JPanel jp) {
        MouseListener ml = new MouseListener() {
            public void mouseClicked(MouseEvent e) {
                String sPos = "" + e.getPoint().x + "," + e.getPoint().y;
                if (sType.equalsIgnoreCase("popup")) {
                    // button enabled ?
                    String b = "" + ((oracle.forms.ui.VButton)e.getComponent()).getProperty(ID.ENABLED);
                    if (b.equalsIgnoreCase("true"))
                        handleMousListener(e, sType, "mouseevent", "clicked",sPos,""+e.getButton());
                } else {
                    if (sType.equalsIgnoreCase("image")) {
                        NewImage ni = (NewImage)e.getComponent();
                        int x = ni.getImageLocation().x + e.getPoint().x ;
                        int y = ni.getImageLocation().y + e.getPoint().y ;
                        sPos = "" + x + "," + y;
                    }
                    handleMousListener(e, sType, "mouseevent", "clicked",sPos,""+e.getButton());
                }
                if (!e.getComponent().hasFocus())
                    e.getComponent().requestFocus();
                if (sType.equalsIgnoreCase("image")) {
                    if (e.getClickCount() > 1) {
                        // open image full size ?
                        if(((NewImage)e.getComponent()).bDblClickShowImg){
                            ((NewImage)e.getComponent()).displayFullSizeImage();
                        }
                        else {
                            handleMousListener(e, sType, "mouseevent", "doubleclicked",sPos,""+e.getButton());
                        }
                    }
                }
                if (jp != null)
                    jp.setVisible(false);
            }

            public void mouseEntered(MouseEvent e) {
                String sPos = "" + e.getPoint().x + "," + e.getPoint().y;
                if (sType.equalsIgnoreCase("popup")) {
                    // button enabled ?
                    String b = "" + ((oracle.forms.ui.VButton)e.getComponent()).getProperty(ID.ENABLED);
                    if (b.equalsIgnoreCase("true"))
                        handleMousListener(e, sType, "mouseevent", "entered", sPos,""+e.getButton());
                } else
                    handleMousListener(e, sType, "mouseevent", "entered" ,sPos,""+e.getButton());
            }

            public void mouseExited(MouseEvent e) {
                String sPos = "" + e.getPoint().x + "," + e.getPoint().y;
                if (sType.equalsIgnoreCase("popup")) {
                    // button enabled ?
                    String b = "" + ((oracle.forms.ui.VButton)e.getComponent()).getProperty(ID.ENABLED);
                    if (b.equalsIgnoreCase("true"))
                        handleMousListener(e, sType, "mouseevent", "exited", sPos,""+e.getButton());
                } else
                    handleMousListener(e, sType, "mouseevent", "exited", sPos,""+e.getButton());
            }

            public void mousePressed(MouseEvent e) {
                String sPos = "" + e.getPoint().x + "," + e.getPoint().y;
                if (sType.equalsIgnoreCase("popup")) {
                    // button enabled ?
                    String b = "" + ((oracle.forms.ui.VButton)e.getComponent()).getProperty(ID.ENABLED);
                    if (b.equalsIgnoreCase("true"))
                        handleMousListener(e, sType, "mouseevent", "pressed" , sPos,""+e.getButton());
                } else
                    handleMousListener(e, sType, "mouseevent", "pressed" , sPos,""+e.getButton());
            }

            public void mouseReleased(MouseEvent e) {
                String sPos = "" + e.getPoint().x + "," + e.getPoint().y;
                if (sType.equalsIgnoreCase("popup")) {
                    // button enabled ?
                    String b = "" + ((oracle.forms.ui.VButton)e.getComponent()).getProperty(ID.ENABLED);
                    if (b.equalsIgnoreCase("true"))
                        handleMousListener(e, sType, "mouseevent", "released" , sPos,""+e.getButton());
                } else
                    handleMousListener(e, sType, "mouseevent", "released" , sPos,""+e.getButton());
            }
        };
        return ml;
    }

    /*--------------------*
     *  Erase new items   *
     *--------------------*/

    void deleteAllItems(boolean bOnPanel) {
        newItem ni = null;
        String s = null, sClass = null;
        int iNb = 0, i, iIndice = 0;
        iNbNewItems = 0;
        for (i = 0; i < ListItems.size(); i++) {
            ni = (newItem)ListItems.get(i);
            s = ni.sName;
            sClass = ni.cp.getClass().getName();
            log("class:" + sClass);
            if ((bOnPanel && ni.bOnPanel) || (!bOnPanel && !ni.bOnPanel)) {
                log("remove:" + s + " onPanel:" + ni.bOnPanel);
                if (ni.bOnPanel) {
                    if (!sClass.equalsIgnoreCase("oracle.forms.fd.NewImage"))
                        newItemPanel.remove(ni.cp);
                    else {
                        iIndice = getImageItemIndice(s);
                        if (iIndice > -1) {
                            NewImage nI = (NewImage)list_imgs.get(iIndice);
                            newItemPanel.remove(nI.jsp);
                        }
                    }
                } else {
                    if (!sClass.equalsIgnoreCase("oracle.forms.fd.NewImage")) {
                        this.getParent().remove(ni.cp);
                    } else {
                        iIndice = getImageItemIndice(s);
                        if (iIndice > -1) {
                            NewImage nI = (NewImage)list_imgs.get(iIndice);
                            this.getParent().remove(nI.jsp);
                        }
                    }
                }
                ni.cp = null;
                iNb++;
                // remove prompt
                //for (int j = 0; j < list_texts.size(); j++) {
                    Texts t = (Texts)list_texts.get(s);
                    if (t != null) {
                        //list_texts.remove(j);
                        t.bValid = false;
                        list_texts.put(s, t);
                        repaint();
                        //break;
                    }
                //}
            } else
                log("don't remove:" + s + " onPanel:" + ni.bOnPanel);
        }
        while (iNb > 0) {
            for (i = 0; i < ListItems.size(); i++) {
                ni = (newItem)ListItems.get(i);
                if (ni.cp == null) {
                    ListItems.remove(i);
                    iNb--;
                    break;
                }
            }
        }
    }

    /*---------------------------------
     * method to handle a Robot order
     *---------------------------------*/

    boolean doRobotOrder(String s) {
        if ((robot == null) || (s == null))
            return false;
        String s1[] = new String[5];
        int i = 0;
        int i1 = 0, i2 = 0, i3 = 0, i4 = 0;
        log("LAF - doRobotOrder():" + s);
        StringTokenizer st = new StringTokenizer(s, ",");
        while (st.hasMoreTokens()) {
            s1[i++] = st.nextToken();
            if (i == 5)
                break;
        }
        if (s.startsWith("createscreencapture")) {
            try {
                i1 = Integer.parseInt(s1[1]);
                i2 = Integer.parseInt(s1[2]);
                i3 = Integer.parseInt(s1[3]);
                i4 = Integer.parseInt(s1[4]);
            } catch (Exception e) {
                print("doRobotOrder createscreencapture() : invalid number");
                return false;
            }
        } else if (s.startsWith("delay")) {
            try {
                i1 = Integer.parseInt(s1[1]);
                try {
                    robot.delay(i1);
                } catch (IllegalArgumentException iae) {
                    print("doRobotOrder: delay must be between 0 and 60000");
                    return false;
                }
            } catch (Exception e) {
                print("doRobotOrder delay() : invalid number");
                return false;
            }
        } else if (s.startsWith("keypress")) {
            try {
                i1 = Integer.parseInt(s1[1]);
                try {
                    robot.keyPress(i1);
                } catch (IllegalArgumentException iae) {
                    print("doRobotOrder: error");
                    return false;
                }
            } catch (Exception e) {
                print("doRobotOrder keypress() : invalid number");
                return false;
            }
        } else if (s.startsWith("keyrelease")) {
            try {
                i1 = Integer.parseInt(s1[1]);
                try {
                    robot.keyRelease(i1);
                } catch (IllegalArgumentException iae) {
                    print("doRobotOrder: error");
                    return false;
                }
            } catch (Exception e) {
                print("doRobotOrder keyrelease() : invalid number");
                return false;
            }
        } else if (s.startsWith("mousemove")) {
            try {
                i1 = Integer.parseInt(s1[1]);
                i2 = Integer.parseInt(s1[2]);
                robot.mouseMove(i1, i2);
            } catch (Exception e) {
                print("doRobotOrder mousemove() : invalid number");
                return false;
            }
        } else if (s.startsWith("mousepress")) {
            try {
                i1 = Integer.parseInt(s1[1]);
                if (i1 == 1)
                    robot.mousePress(InputEvent.BUTTON1_MASK);
                else if (i1 == 2)
                    robot.mousePress(InputEvent.BUTTON2_MASK);
                else if (i1 == 3)
                    robot.mousePress(InputEvent.BUTTON3_MASK);
            } catch (Exception e) {
                print("doRobotOrder mousepress() : invalid number");
                return false;
            }
        } else if (s.startsWith("mouserelease")) {
            try {
                i1 = Integer.parseInt(s1[1]);
                if (i1 == 1)
                    robot.mouseRelease(InputEvent.BUTTON1_MASK);
                else if (i1 == 2)
                    robot.mouseRelease(InputEvent.BUTTON2_MASK);
                else if (i1 == 3)
                    robot.mouseRelease(InputEvent.BUTTON3_MASK);
            } catch (Exception e) {
                print("doRobotOrder mouserelease() : invalid number");
                return false;
            }
        } else if (s.startsWith("mousewheel")) {
            try {
                i1 = Integer.parseInt(s1[1]);
                robot.mouseWheel(i1);
            } catch (Exception e) {
                print("doRobotOrder mousewheel() : invalid number");
                return false;
            }
        } else if (s.startsWith("setautodelay")) {
            try {
                i1 = Integer.parseInt(s1[1]);
                try {
                    robot.setAutoDelay(i1);
                } catch (IllegalArgumentException iae) {
                    print("doRobotOrder: setautodelay must be between 0 and 60000");
                    return false;
                }
            } catch (Exception e) {
                print("doRobotOrder setautodelay() : invalid number:" + s1[1]);
                return false;
            }
        } else if (s.startsWith("setautowaitforidle")) {
            if (s.equalsIgnoreCase("true"))
                robot.setAutoWaitForIdle(true);
            else
                robot.setAutoWaitForIdle(false);
        } else if (s.startsWith("waitforidle")) {
            robot.waitForIdle();
        } else if (s.startsWith("wait")) {
            i1 = Integer.parseInt(s1[1]);
            if (i1 >= 0) {
                iRobotWait = i1;
            }
        } else if (s.startsWith("paste")) {
            StringSelection ss = new StringSelection(s1[1]);
            Toolkit.getDefaultToolkit().getSystemClipboard().setContents(ss, null);
            robot.keyPress(KeyEvent.VK_CONTROL);
            robot.keyPress(KeyEvent.VK_V);
            robot.keyRelease(KeyEvent.VK_CONTROL);
            robot.keyRelease(KeyEvent.VK_V);
        }
        return true;
    }

    /*--------------------------------------
     *  return the corresponding KeyStroke
     *-------------------------------------*/

    int getKeyStroke(String s) {
        int i = 0;
        if (s.equalsIgnoreCase("BACK"))
            i = KeyEvent.VK_BACK_SPACE;
        else if (s.equalsIgnoreCase("HOME"))
            i = KeyEvent.VK_HOME;
        else if (s.equalsIgnoreCase("END"))
            i = KeyEvent.VK_END;
        else if (s.equalsIgnoreCase("COPY"))
            i = KeyEvent.VK_COPY;
        else if (s.equalsIgnoreCase("CUT"))
            i = KeyEvent.VK_CUT;
        else if (s.equalsIgnoreCase("DEL"))
            i = KeyEvent.VK_DELETE;
        else if (s.equalsIgnoreCase("INS"))
            i = KeyEvent.VK_INSERT;
        else if (s.equalsIgnoreCase("LEFT"))
            i = KeyEvent.VK_LEFT;
        else if (s.equalsIgnoreCase("RIGHT"))
            i = KeyEvent.VK_RIGHT;
        else if (s.equalsIgnoreCase("PGUP"))
            i = KeyEvent.VK_PAGE_UP;
        else if (s.equalsIgnoreCase("PGDOWN"))
            i = KeyEvent.VK_PAGE_DOWN;
        else if (s.equalsIgnoreCase("UP"))
            i = KeyEvent.VK_UP;
        else if (s.equalsIgnoreCase("DOWN"))
            i = KeyEvent.VK_DOWN;
        else if (s.equalsIgnoreCase("ALT"))
            i = KeyEvent.VK_ALT;
        else if (s.equalsIgnoreCase("SHIFT"))
            i = KeyEvent.VK_SHIFT;
        else if (s.equalsIgnoreCase("CTRL"))
            i = KeyEvent.VK_CONTROL;
        else if (s.equalsIgnoreCase("TAB"))
            i = KeyEvent.VK_TAB;
        else if (s.equalsIgnoreCase("a"))
            i = KeyEvent.VK_A;
        else if (s.equalsIgnoreCase("b"))
            i = KeyEvent.VK_B;
        else if (s.equalsIgnoreCase("c"))
            i = KeyEvent.VK_C;
        else if (s.equalsIgnoreCase("d"))
            i = KeyEvent.VK_D;
        else if (s.equalsIgnoreCase("e"))
            i = KeyEvent.VK_E;
        else if (s.equalsIgnoreCase("f"))
            i = KeyEvent.VK_F;
        else if (s.equalsIgnoreCase("g"))
            i = KeyEvent.VK_G;
        else if (s.equalsIgnoreCase("h"))
            i = KeyEvent.VK_H;
        else if (s.equalsIgnoreCase("i"))
            i = KeyEvent.VK_I;
        else if (s.equalsIgnoreCase("j"))
            i = KeyEvent.VK_J;
        else if (s.equalsIgnoreCase("k"))
            i = KeyEvent.VK_K;
        else if (s.equalsIgnoreCase("l"))
            i = KeyEvent.VK_L;
        else if (s.equalsIgnoreCase("m"))
            i = KeyEvent.VK_M;
        else if (s.equalsIgnoreCase("n"))
            i = KeyEvent.VK_N;
        else if (s.equalsIgnoreCase("o"))
            i = KeyEvent.VK_O;
        else if (s.equalsIgnoreCase("p"))
            i = KeyEvent.VK_P;
        else if (s.equalsIgnoreCase("q"))
            i = KeyEvent.VK_Q;
        else if (s.equalsIgnoreCase("r"))
            i = KeyEvent.VK_R;
        else if (s.equalsIgnoreCase("s"))
            i = KeyEvent.VK_S;
        else if (s.equalsIgnoreCase("t"))
            i = KeyEvent.VK_T;
        else if (s.equalsIgnoreCase("u"))
            i = KeyEvent.VK_U;
        else if (s.equalsIgnoreCase("v"))
            i = KeyEvent.VK_V;
        else if (s.equalsIgnoreCase("w"))
            i = KeyEvent.VK_W;
        else if (s.equalsIgnoreCase("x"))
            i = KeyEvent.VK_X;
        else if (s.equalsIgnoreCase("y"))
            i = KeyEvent.VK_Y;
        else if (s.equalsIgnoreCase("z"))
            i = KeyEvent.VK_Z;
        return i;
    }

    /*---------------------------*
     *  read a text from a file  *
     *---------------------------*/

    private boolean readFile() {
        BufferedReader fileIn = null;
        String line = "";

        // Open the file
        log("readFile : try to open : " + sRobotFileName);
        try {
            fileIn = new BufferedReader(new FileReader(sRobotFileName));
        } catch (FileNotFoundException e) {
            log("readFile open error : " + sRobotFileName + " not found ");
            JOptionPane.showMessageDialog(null, "File : " + sRobotFileName + " not found", "Robot script",
                                          JOptionPane.PLAIN_MESSAGE);
            return false;
        } catch (IOException e) {
            log("readFile open error : " + e);
            return false;
        }
        // read the file
        log("readFile : try to read from : " + sRobotFileName);
        try {
            setProperty(SET_ROBOT_FORMS_STEPS, "[START]");
            while ((line = fileIn.readLine()) != null) {
                setProperty(SET_ROBOT_FORMS_STEPS, line + '\n');
            }
            setProperty(SET_ROBOT_FORMS_STEPS, "[END]");
        } catch (Exception e) {
            log("readFile reading error:" + e);
            return false;
        }
        try {
            fileIn.close();
        } catch (Exception e) {
            log("readFile closing error:" + e);
            return false;
        }
        return true;
    }

    /****************************
     *  Write a text to a file  *
     ***************************/
    private boolean writeFile(String sFileName, String sValue) {
        PrintWriter fileOut = null;
        String line = "";
        boolean bResult = true;

        // open the file
        log("writeFile() : try to open : " + sFileName);
        try {
            fileOut = new PrintWriter(new FileWriter(sFileName));
        } catch (Exception e) {
            print("writeFile() opening error:" + e);
            bResult = false;
        }
        // write to the file
        try {
            log("writeFile() : try to write to : " + sFileName);
            fileOut.println(sValue);
        } catch (Exception e) {
            print("writeFile() writing error:" + e);
            bResult = false;
        }

        // close the file
        try {
            fileOut.close();
        } catch (Exception e) {
            print("writeFile() closing error:" + e);
            bResult = false;
        }
        //JOptionPane.showMessageDialog(this, "File : "+sFileName+" created", "Write", JOptionPane.PLAIN_MESSAGE);
        return bResult;
    }

    /*---------------------------------*
     *  Get the properties of the bean
     *---------------------------------*/

    public Object getProperty(ID property) {
        log("getProperty():"+property);
        // get the Status Bar Item value
        if (property == getStatusBarValue) {
            log("getStatusBarValue(" + iStatusBarNum + "," + iStatusBarIdx + ")");
            try {
                return statusbars[iStatusBarNum][iStatusBarIdx].getText();
            } catch (Exception ex) {
                return "";
            }
        } else if (property == getTextWidth) {
            // return the current width
            return "" + iTextWidth;
        } else if (property == getTextHeight) {
            // return the current height
            return "" + iTextHeight;
        } else if (property == getTextSize) {
            // return both width and height
            return "" + iTextWidth + "," + iTextHeight;
        } else if (property == getScheme) {
            // return the current scheme
            return "" + Current_Scheme;
        } else if (property == pDialogGetString) {
            // return the inputdialog result
            return sDialogString;
        }
        //  return Color via the JColorChooser
        else if (property == pGetRGBColor) {
            // return a choozen color
            String sRGBColor = "";
            Color c = JColorChooser.showDialog(this, sColorChooserTitle, cLastColor);
            if (c != null) {
                cLastColor = c;
                sRGBColor = "r" + c.getRed() + "g" + c.getGreen() + "b" + c.getBlue();
            }
            return sRGBColor;
        }
        // returns the current scheme RGB color
        else if (property == getSchemeColor) {
            String sRGBColor = "";
            Color c = Current_Color;
            sRGBColor = "r" + c.getRed() + "g" + c.getGreen() + "b" + c.getBlue();
            return sRGBColor;
        }
        // returns the current scheme RGB color light
        else if (property == getSchemeColorLight) {
            String sRGBColor = "";
            Color c = Current_Color_Light;
            sRGBColor = "r" + c.getRed() + "g" + c.getGreen() + "b" + c.getBlue();
            return sRGBColor;
        }
        // total memory
        else if (property == getTotalMemory) {
            return "" + lTotalMemory;
        }
        // used memory
        else if (property == getUsedMemory) {
            return "" + lUsedMemory;
        }
        // free memory
        else if (property == getFreeMemory) {
            return "" + lFreeMemory;
        }

        // alert button clicked
        else if (property == pGetAlertButton) {
            return "" + sAlertButton;
        }

        // new item value
        else if (property == ITEM_GET_VALUE) {
            String sval = "";
            if (iNewItemIndice > -1) {
                newItem ni = (newItem)ListItems.get(iNewItemIndice);
                if (ni.sType.equalsIgnoreCase("textfield"))
                    sval = ((NewTextField)ni.cp).getText();
                else if (ni.sType.equalsIgnoreCase("textarea"))
                    sval = ((NewTextArea)ni.cp).getText();
                else if (ni.sType.equalsIgnoreCase("textfield2"))
                    sval = ((NewTextField2)ni.cp).getText();
                else if (ni.sType.equalsIgnoreCase("passwordfield")) {
                    char[] input = ((NewPasswordField)ni.cp).getPassword();
                    sval = new String(input);
                }
                else if (ni.sType.equalsIgnoreCase("textarea2"))
                    sval = ((NewTextArea2)ni.cp).getText();
                else if (ni.sType.equalsIgnoreCase("checkbox"))
                    sval = ((LAF_XP_CBox)ni.cp).getProperty(ID.VALUE).toString();
                else if (ni.sType.equalsIgnoreCase("slider"))
                    sval = "" + ((NewJSlider)ni.cp).getValue();
            }
            return sval;
        }

        // new image size
        else if (property == IMG_GETIMAGE_SIZE) {
            String s = "";
            if (iCurrentImage > -1) {
                NewImage ni = (NewImage)list_imgs.get(iCurrentImage);
                if (ni != null) {
                    s = ni.getImgSize();
                }
            }
            return s;
        }
        // new image width
        else if (property == IMG_GETIMAGE_WIDTH) {
            String s = null;
            if (iCurrentImage > -1) {
                NewImage ni = (NewImage)list_imgs.get(iCurrentImage);
                if (ni != null) {
                    s = ni.getImgWidth();
                }
            }
            return "" + s;
        }
        // new image height
        else if (property == IMG_GETIMAGE_HEIGHT) {
            String s = null;
            if (iCurrentImage > -1) {
                NewImage ni = (NewImage)list_imgs.get(iCurrentImage);
                if (ni != null) {
                    s = ni.getImgHeight();
                }
            }
            return "" + s;
        }

        // new image content
        else if (property == IMG_GETIMAGE) {
            String s = null;
            if (iCurrentImage > -1) {
                NewImage ni = (NewImage)list_imgs.get(iCurrentImage);
                if (ni != null) {
                    s = ni.getImage();
                }
            }
            return "" + s;
        }

        // get a file name
        else if (property == IMG_GETFILENAME) {
            GetImageFileName gifn = new GetImageFileName();
            gifn.SetLAF(sChooserLAF.toUpperCase());
            return gifn.GetFile(sFileChooserTitle, sFileStartDir);
        }

        // get current spinner image name
        else if (property == SpinGetImageName) {
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sSpinnerName);
            if (cs != null) {
                return cs.spin.getCurrentImageName();
            } else {
                print("LAF Spinner GetCurentImageName() cannot find spinner name:" + sName);
                return "";
            }
        }

        // get spinner image content
        else if (property == SpinGetImage) {
            if (sSpinnerName == null)
                return "";
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sSpinnerName);
            if (cs != null) {
                return "" + cs.spin.getImageContent();
            } else {
                print("LAF Spinner SpinnerGetImage() cannot find spinner name:" + sName);
                return "";
            }
        }

        // get spinner new images list
        else if (property == SpinGetNewList) {
            if (sSpinnerName == null)
                return "";
            // get spinner
            cSpinner cs = (cSpinner)hSpinners.get(sSpinnerName);
            if (cs != null) {
                return "" + cs.spin.getNewImageList();
            } else {
                print("LAF Spinner SpinnerGetNewImageList() cannot find spinner name:" + sName);
                return "";
            }
        }

        // open/save dialog filename
        else if (property == getFileName) {
            if (sChoosenFileName == null || sChoosenFileName.equals(""))
                return "";
            else {
                return sChoosenFileName;
            }
        }

        // get default printer name
        else if (property == getPrinter) {
            return getDefaultPrinter();
        }
        // get printer list
        else if (property == getPrinterList) {
            return getPrinterList().replaceAll("\\|", ",");
        }
        // get clipboard content
        else if (property == getClip) {
            String s = "[END_DATA]" ;
            if(jtaClip.getText().length() == 0){
                s = "[END_DATA]";
            }
            else{
                if(jtaClip.getText().length() <= 4000){
                    s = jtaClip.getText();
                    jtaClip.setText(null);
                }
                else {
                    s =  jtaClip.getText().substring(0,3999);
                    jtaClip.setText(jtaClip.getText().substring(4000));
                }
            }    
            return s;
        } 
        
        // Dynamic TABLE properties
        // get current cell value
        else if (property == TBGETCELLVAL) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getCellVal();
              }
              return s;
        }
        // get current row value
        else if (property == TBGETROWVAL) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getRowVal();
              }
              return s;
        }
        // selected row identified ?
        else if (property == TBGETIDENTIFIEDROW) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getIdentifiedRow();
              }
              return s;
        } 
        // get current row
        else if (property == TBGETCURRENTROW) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getCurrentRow();
              }
              return s;
        }         
        // image content
        else if (property == TBGETIMAGECONTENT) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getImageContent();
              }
              return s;
        } 
        // get current cell name
        else if (property == TBGETCELLNAME) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getCellName();
              }
              return s;
        }
        // get total cell value
        else if (property == TBGETTOTALCELLVAL) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getTotalCellVal();
              }
              return s;
        }
        // get CLOB content  
        else if (property == TBGETTEXT) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getCLOBContent();
              }
              else
                  log_table("--- TB_GET_TEXT() table not found:"+sCurrentTable);              
              return s;
        }        
        // get updated rows list
        else if (property == TBGETROWSCHANGED) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getRowsChanged();
              }
              return s;
        }  
        // get inserted rows list
        else if (property == TBGETROWSINSERTED) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getRowsInserted();
              }
              return s;
        }  
        // get delete rows list
        else if (property == TBGETROWSDELETED) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getRowsDeleted();
              }
              return s;
        }          
        else if (property == TBGETNBINSERT) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getCountInsert();
              }
              return s;
        } 
        else if (property == TBGETNBUPDATE) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getCountUpdate();
              }
              return s;
        } 
        else if (property == TBGETNBDELETE) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getCountDelete();
              }
              return s;
        } 
        else if (property == TBGETNBCHANGES) { 
              String s = "" ;
              // get table
              cDynTable cs = (cDynTable)hTables.get(sCurrentTable);
              if (cs != null) {            
                    s = cs.tb.getCountChanges();
              }
              return s;
        } 
        else if (property == GET_USER_IP) { 
            String s = "" ;
            try {
                s = InetAddress.getLocalHost().getHostAddress();
            } catch (UnknownHostException e) {
                print("GET_USER_IP() cannot get user IP\n"+e.toString());
            }
            return s;
        }         
        else if (property == FORMS_SERVER_URL) {
            return sDocBase;
        }          
        else if (property == exportGetTempDir) { 
              return System.getProperty("java.io.tmpdir") ;
        }    
        else if (property == getTextLabel) {
            String s = "" ;
            Iterator it = list_texts.entrySet().iterator();
            while (it.hasNext()) {
                Map.Entry pairs = (Map.Entry)it.next();
                        Texts t = (Texts)pairs.getValue();
                        if ((t != null) && (t.sName != null) && t.sName.equalsIgnoreCase(sTextLabel)) {
                            s = t.sLabel;
                            break;
                        }        
            }        
            return s;
        }         
        else if (property == FORMS_SERVER_URL) {
            return sDocBase;
        }  
        else if (property == getShapeProperty) {
            String s = "";
            // find the shape
            Line ln = null;
            Rect re = null;
            Poly pol = null;
            Texts txt = null;
            Ellipse el = null;
            for (int i = 0; i < list_objects.size(); i++) {
                Typ_Objects to = (Typ_Objects)list_objects.get(i);
                if(to != null){
                    if(to.sName.equalsIgnoreCase(sShapeCurrentName)){
                        // found
                        if(sShapeCurrentType.equalsIgnoreCase("line")){
                            ln = (Line)list_lines.get(to.sName);
                            if(null != ln) s = ln.getProperty(sShapeCurrentProperty);
                            return s;
                        }
                        else if(sShapeCurrentType.equalsIgnoreCase("rect")){
                            re = (Rect)list_rects.get(to.sName);
                            if(null != re) s = re.getProperty(sShapeCurrentProperty);
                            return s;
                        }    
                        else if(sShapeCurrentType.equalsIgnoreCase("ellipse")){
                            el = (Ellipse)list_circles.get(to.sName);
                            if(null != el) s = el.getProperty(sShapeCurrentProperty);
                            return s;
                        }                                 
                        else if(sShapeCurrentType.equalsIgnoreCase("shape")){
                            pol = (Poly)list_polys.get(to.sName);
                            if(null != pol) s = pol.getProperty(sShapeCurrentProperty);
                            return s;
                        }
                        else if(sShapeCurrentType.equalsIgnoreCase("text")){
                            txt = (Texts)list_texts.get(to.sName);
                            if(null != txt) s = txt.getProperty(sShapeCurrentProperty);
                            return s;
                        }                        
                    }
                }
            } 
            return "SHAPE NOT FOUND";
        }          
        
        
        else // default behaviour
        {
            return super.getProperty(property);
        }
    }

    /*-----------------------------------------*
     *  print the list of the referenced PJCs
     *-----------------------------------------*/

    public static void printListPjc() {
        Typ_PJC obj = null;
        for (int i = 0; i < vPjc.size(); i++) {
            obj = (Typ_PJC)vPjc.get(i);
            System.out.println(" ! LAF:  PJC(" + i + ")=" + obj.sName);
        }
    }

    /*---------------------------------------*
     * add PJC components to the PJCs' table
     *---------------------------------------*/

    public static void add_PJC(String p_name, LAF_XP_PopList p_class) {
        Typ_PJC pjc = new Typ_PJC(p_name, p_class);
        vPjc.add(pjc);
    }

    public static void add_PJC(String p_name, LAF_XP_TList p_class) {
        Typ_PJC pjc = new Typ_PJC(p_name, p_class);
        vPjc.add(pjc);
    }

    public static void add_PJC(String p_name, LAF_XP_ComboBox p_class) {
        Typ_PJC pjc = new Typ_PJC(p_name, p_class);
        vPjc.add(pjc);
    }

    /*------------------------------------*
     *     object to store a DrawLAF bean
     *------------------------------------*/
    class DrawLAFBean extends Object {
        IHandler handler;
        Component bean ;

        DrawLAFBean(IHandler handler, Component bean) {
            this.handler = handler;
            this.bean = bean;
        }
    }

    /*------------------------------------*
     *     object to store a new item
     *------------------------------------*/
    class newItem extends Object {
        int iX = 0;
        int iY = 0;
        int iW = 0;
        int iH = 0;
        int iPX = 0;
        int iPY = 0;
        int iPW = 0;
        int iPH = 0;
        String sName = "";
        String sType = "";
        String sLabel = null;
        String sPrompt = "";
        String sToolTip = null;
        String sPromptPos = "left";
        Font fPrompt = new Font("Arial", Font.PLAIN, 12);
        Color cPrompt = Color.black;
        Component cp = null;
        boolean bOnPanel = false;
        JLabel jb = null;
        JScrollPane jsp = null;
        Rectangle rect = null;

        newItem(Component c_p, String s_name, String s_type, int i_x, int i_y, int i_w, int i_h) {
            this.cp = c_p;
            this.sName = s_name;
            this.sType = s_type;
            this.iX = i_x;
            this.iY = i_y;
            this.iW = i_w;
            this.iH = i_h;
        }

        newItem(Component c_p, String s_name, String s_type, String s_prompt, int i_x, int i_y, int i_w, int i_h) {
            this.cp = c_p;
            this.sName = s_name;
            this.sType = s_type;
            this.sPrompt = s_prompt != null ? s_prompt.replace((char)10, '\n') : null;
            this.iX = i_x;
            this.iY = i_y;
            this.iW = i_w;
            this.iH = i_h;
        }

        newItem(Component c_p, String s_name, String s_type, String s_label, String s_tooltip, int i_x, int i_y,
                int i_w, int i_h) {
            this.cp = c_p;
            this.sName = s_name;
            this.sType = s_type;
            this.sLabel = s_label != null ? s_label.replace((char)10, '\n') : null;
            this.sPrompt = this.sLabel;
            this.sToolTip = s_tooltip;
            this.iX = i_x;
            this.iY = i_y;
            this.iW = i_w;
            this.iH = i_h;
        }

        void setPrompt(String s) {
            this.sPrompt = s;
        }

        void setPromptPos(String s) {
            this.sPromptPos = s;
        }

        void setToolTip(String s) {
            this.sToolTip = s;
        }

        void setRect(Rectangle r) {
            this.rect = r;
            iNbNewItems++;
        }

        void setPromptPosition() {
            // prompt size
            this.iW = this.cp.getSize().width;
            this.iH = this.cp.getSize().height;
            Rectangle2D rect =
                fPrompt.getStringBounds(sPrompt, new FontRenderContext(new AffineTransform(), true, true));
            iPH = (int)(rect.getHeight());
            iPW = (int)(rect.getWidth());
            if (jb != null)
                jb.setSize(iPW+5, iPH+4);
            if (sPromptPos.equalsIgnoreCase("left")) {
                iPX = iX - iPW - 4;
                if (!bOnPanel)
                    iPY = iY + iPH;
                else {
                    iPY = iY;
                    jb.setHorizontalTextPosition(JLabel.RIGHT);
                    jb.setLocation(iPX, iPY);
                }
            } else if (sPromptPos.equalsIgnoreCase("topleft")) {
                iPX = iX;
                if (!bOnPanel)
                    iPY = iY - 4;
                else {
                    iPY = iY - iPH;
                    jb.setLocation(iPX, iPY);
                }
            } else if (sPromptPos.equalsIgnoreCase("topcenter")) {
                iPX = iX + (int)((iW / 2) - (iPW / 2));
                if (!bOnPanel)
                    iPY = iY - 4;
                else {
                    iPY = iY - iPH;
                    jb.setLocation(iPX, iPY);
                }
            } else if (sPromptPos.equalsIgnoreCase("topright")) {
                iPX = iX + iW - iPW;
                if (!bOnPanel)
                    iPY = iY - 4;
                else {
                    iPY = iY - iPH;
                    jb.setLocation(iPX, iPY);
                }
            } else if (sPromptPos.equalsIgnoreCase("right")) {
                iPX = iX + iW + 4;
                if (!bOnPanel)
                    iPY = iY + iPH;
                else {
                    iPY = iY;
                    jb.setLocation(iPX, iPY);
                }
            } else if (sPromptPos.equalsIgnoreCase("bottomleft")) {
                iPX = iX;
                if (!bOnPanel)
                    iPY = iY + iH + iPH;
                else {
                    iPY = iY + iH;
                    jb.setLocation(iPX, iPY);
                }
            } else if (sPromptPos.equalsIgnoreCase("bottomcenter")) {
                iPX = iX + (int)((iW / 2) - (iPW / 2));
                if (!bOnPanel)
                    iPY = iY + iH + iPH;
                else {
                    iPY = iY + iH;
                    jb.setLocation(iPX, iPY);
                }
            } else if (sPromptPos.equalsIgnoreCase("bottomright")) {
                iPX = iX + iW - iPW;
                if (!bOnPanel)
                    iPY = iY + iH + iPH;
                else {
                    iPY = iY + iH;
                    jb.setLocation(iPX, iPY);
                }
            }
        }
    }

    /*------------------------------------*
     *  object to store a PJC definition
     *------------------------------------*/
    static class Typ_PJC extends Object {
        String sName = "";
        Class cClass = null;
        LAF_XP_PopList pl = null;
        LAF_XP_TList tl = null;
        LAF_XP_ComboBox cb = null;

        Typ_PJC(String p_name, LAF_XP_PopList p_class) {
            this.sName = p_name;
            pl = p_class;
        }

        Typ_PJC(String p_name, LAF_XP_TList p_class) {
            this.sName = p_name;
            tl = p_class;
        }

        Typ_PJC(String p_name, LAF_XP_ComboBox p_class) {
            this.sName = p_name;
            cb = p_class;
        }
    }

    /*---------------------*
     *   linear gradients
     *---------------------*/
    class LinearGradient extends Object {
        String sStartX = "0";
        String sStartY = "0";
        String sEndX = "WIDTH";
        String sEndY = "HEIGHT";
        String sColors = "";
        String sCoefs = "";
        String sDirection = "UpToDown"; //or "LeftToRight"
        Color tColors[] = new Color[20];
        String tCoefs[] = new String[20];
        float fTransp = .5f;

        LinearGradient(String p_StartX, String p_StartY, String p_EndX, String p_EndY, String p_direction,
                       String[] p_Coefs, Color[] p_Colors, float p_transp) throws Exception {
            int i = 0;
            String sCol1 = "", sCol2 = "";
            sStartX = p_StartX;
            sStartY = p_StartY;
            sEndX = p_EndX;
            sEndY = p_EndY;
            sDirection = p_direction;
            tColors = p_Colors;
            tCoefs = p_Coefs;
            fTransp = p_transp;
            if (!sDirection.equalsIgnoreCase("LeftToRight") && !sDirection.equalsIgnoreCase("UpToDown"))
                sDirection = "UpToDown";
        }
    }

    class Typ_Objects extends Object {
        String sName = null ;
        int iPos = 0;
        int iType = 0;
        
        Typ_Objects(String p_name, int p_pos, int p_type) {
            this.sName = p_name;
            this.iPos  = p_pos;
            this.iType = p_type;
        }
    }
    
    class Typ_Anims extends Object {
        String sAnimShape;
        String sAnimName;
        int xAnimStart, yAnimStart, xAnimEnd, yAnimEnd, iAnimDelay, iAnimStep;
        
        Typ_Anims(String sAnimShape, String sAnimName, int xAnimStart, int yAnimStart, int xAnimEnd, int yAnimEnd, int iAnimDelay, int iAnimStep) {
            this.sAnimShape = sAnimShape;
            this.sAnimName  = sAnimName;
            this.xAnimStart = xAnimStart;
            this.yAnimStart = yAnimStart;
            this.xAnimEnd = xAnimEnd;
            this.xAnimStart = xAnimStart;
            this.yAnimEnd = yAnimEnd;
            this.iAnimDelay = iAnimDelay;
            this.iAnimStep = iAnimStep;
        }
    }    

    /*-----------------------------------------*
     *  object that stores a background image
     *-----------------------------------------*/
    class Images extends Object {
        String sName = "";
        String sValue = null;
        //int iPos = 0;
        String sPos = null;
        int iType = 10;
        float fTransparency = 1.0f;
        Image img = null;
        Point pos = null;
        int iX1 = 0, iY1 = 0, iX2 = 0, iY2 = 0;
        int iFrameWidth = 0;
        int iImgWidth = 0;
        int iImgHeight = 0;
        boolean bMirror = false;
        Color cFrameColor = Color.black;
        Rectangle rec = null;
        javax.swing.JButton jb = null;

        // non scaled image

        Images(String p_pos, String p_name, Point p_point, float p_ftransp, int p_fwidth, Color p_cframe, String p_value,
               boolean p_bmirror) {
            this.sPos = p_pos;
            this.sName = p_name;
            this.pos = p_point;
            this.iX1 = pos.x;
            this.iY1 = pos.y;
            this.fTransparency = p_ftransp;
            img = ik.loadImage(sName);
            this.iFrameWidth = p_fwidth;
            this.cFrameColor = p_cframe;
            this.sValue = p_value;
            this.bMirror = p_bmirror;

            ImageIcon ic = null;
            if (img != null) {
                ic = new ImageIcon(img);
                this.iImgWidth = ic.getIconWidth();
                this.iImgHeight = ic.getIconHeight();
            }
            if ((img != null) && (sValue != null)) {
                //print("ipos:" + iPos);
                jb = new javax.swing.JButton(ic);
                jb.setBounds(iX1, iY1, ic.getIconWidth(), ic.getIconHeight());
                jb.setEnabled(true);
                jb.setLocation(iX1, iY1);
                jb.addActionListener(new ActionListener() {
                    public void actionPerformed(ActionEvent event) {
                        dispatchanevent(IMAGECLICKED, IMAGENAME, sValue);
                    }
                });
                VB.getParent().add(jb, 0);
            }
        }

        // scaled image
        Images(String p_pos, String p_name, Rectangle p_rec, float p_ftransp, String p_value, boolean p_bmirror) {
            this.sPos = p_pos;
            this.sName = p_name;
            this.rec = p_rec;
            this.iX1 = p_rec.x;
            this.iY1 = p_rec.y;
            this.iX2 = p_rec.width;
            this.iY2 = p_rec.height;
            this.fTransparency = p_ftransp;
            this.sValue = p_value;
            this.bMirror = p_bmirror;
            img = ik.loadImage(sName);
            ImageIcon ic = null;
            if (img != null && ((iX2 != 0) && (iY2 != 0))) {
                ic = new ImageIcon(img.getScaledInstance(iX2, iY2, Image.SCALE_SMOOTH));
                img = ic.getImage();
                this.iImgWidth = ic.getIconWidth();
                this.iImgHeight = ic.getIconHeight();
            }

            if ((img != null) && (ic == null)) {
                ic = new ImageIcon(img);
                this.iImgWidth = ic.getIconWidth();
                this.iImgHeight = ic.getIconHeight();
            }
            if ((img != null) && (sValue != null)) {
                jb = new javax.swing.JButton(ic);
                jb.setBounds(iX1, iY1, ic.getIconWidth(), ic.getIconHeight());
                jb.setEnabled(true);
                jb.setLocation(iX1, iY1);
                jb.addActionListener(new ActionListener() {
                    public void actionPerformed(ActionEvent event) {
                        dispatchanevent(IMAGECLICKED, IMAGENAME, sValue);
                    }
                });
                VB.getParent().add(jb, 0);
            }
        }
    }


    /*------------------------------*
     *   Object that stores a Text
     *------------------------------*/
    class Texts extends Object {
        int iX = 0, iY = 0;
        int iOut = 1;
        String sID = null ;
        String sName = null; // text unique name to retrieve
        String sLabel = "";
        String sImage = null; // text clipping image
        String sType = ".";
        String sPaint = null;
        String sScale = null;
        Color color = Color.black;
        Color cOutline = null; // text outline color
        Color color1 = null, color2 = null;
        float f = 1.0f;
        float fRotate = 0.0f;
        float fScaleX = 1.0f;
        float fScaleY = 1.0f;
        int iBoxWidth = 0;
        int iBoxHeight = 0;
        int iJustify = 0;
        Font font = null;
        boolean bGradient = false;
        boolean bValid = true;
        boolean bVisible = true ;
        Image img = null;
        int iStart = 0, iEnd = 0;
        String sAlign = "left";
        String sCenterPoint = "ul";

        void setScale(float f1, float f2) {
            fScaleX = f1;
            fScaleY = f2;
            sScale = "scale";
        }

        void setBox(int w, int h) {
            iBoxWidth = w;
            iBoxHeight = h;
            sScale = "box";
        }

        void setJustify(int x) {
            iJustify = x;
            sScale = "justify";
        }

        void setAlign(int i1, int i2, String s) {
            iStart = i1;
            iEnd = i2;
            sAlign = s;
        }
        
        void moveTo(int x, int y){
            iX = x;
            iY = y;
        }         
        
        void rotate(float f){
            fRotate = f;
        }       
        void rotate(float f, String sPoint){
            fRotate = f;
            sCenterPoint = sPoint;
        }           
        void setNewSize(int iSize){
            font = font.deriveFont((float)iSize);
            fScaleX = 1.0f;
            fScaleY = 1.0f;
        }
        int getFontSize(){
            return font.getSize();
        }
        String getProperty(String sName){
            if(sName.equalsIgnoreCase("StartPoint")) return iX+","+iY;
            else if(sName.equalsIgnoreCase("Scale")) return fScaleX+","+fScaleY;
            else if(sName.equalsIgnoreCase("LineColor")) return "r"+cOutline.getRed()+"g"+cOutline.getGreen()+"b"+cOutline.getBlue();
            else if(sName.equalsIgnoreCase("ShapeColor")) return "r"+color.getRed()+"g"+color.getGreen()+"b"+color.getBlue();
            else if(sName.equalsIgnoreCase("Gradient")) return "r"+color1.getRed()+"g"+color1.getGreen()+"b"+color1.getBlue()+",r"+color2.getRed()+"g"+color2.getGreen()+"b"+color2.getBlue();
            else if(sName.equalsIgnoreCase("Rotation")) return ""+fRotate;
            else if(sName.equalsIgnoreCase("RotationPoint")) return sCenterPoint;
            else if(sName.equalsIgnoreCase("FontName")) return ""+font.getName();
            else if(sName.equalsIgnoreCase("FontSize")) return ""+font.getSize();
            else if(sName.equalsIgnoreCase("Alignment")) return sAlign;
            else if(sName.equalsIgnoreCase("Box")) return ""+iBoxWidth+","+iBoxHeight;
            else if(sName.equalsIgnoreCase("Paint")) return sPaint;
            else if(sName.equalsIgnoreCase("Image")) return sImage;
            else if(sName.equalsIgnoreCase("FontStyle")) {
                if(font.getStyle()== Font.BOLD) return "bold";
                else if(font.getStyle()== Font.PLAIN) return "plain";
                else if(font.getStyle()== Font.ITALIC) return "italic";
                else if(font.getStyle()== Font.ITALIC + Font.BOLD ) return "bold+italic";
                else return ""+font.getStyle();
            }
            else return "UNKNOWN_PROPERTY";
        }
        void setProperty(String sName, String sValue){
            int i=0;
            String s1,s2;
            if(sName.equalsIgnoreCase("StartPoint")) {
                i = sValue.indexOf("|");
                if (i > -1) {
                    try {
                            s1 = sValue.substring(0, i);
                            s2 = sValue.substring(i + 1);
                            iX = Integer.parseInt(s1);
                            iY = Integer.parseInt(s2);
                    } 
                    catch (Exception ex) {
                        print("Text setProperty() wrong "+sName+" values:" +sValue);
                    }
                }          
            } 
            if(sName.equalsIgnoreCase("Scale")) {
                i = sValue.indexOf("|");
                if (i > -1) {
                    try {
                            s1 = sValue.substring(0, i);
                            s2 = sValue.substring(i + 1);
                            fScaleX = Float.parseFloat(s1);
                            fScaleY = Float.parseFloat(s2);
                    } 
                    catch (Exception ex) {
                        print("Text setProperty() wrong "+sName+" values:" +sValue);
                    }
                }          
            }      
            if(sName.equalsIgnoreCase("Box")) {
                i = sValue.indexOf("|");
                if (i > -1) {
                    try {
                            s1 = sValue.substring(0, i);
                            s2 = sValue.substring(i + 1);
                            iBoxWidth = Integer.parseInt(s1);
                            iBoxHeight = Integer.parseInt(s2);
                    } 
                    catch (Exception ex) {
                        print("Text setProperty() wrong "+sName+" values:" +sValue);
                    }
                }          
            } 
            if(sName.equalsIgnoreCase("Gradient")) {
                i = sValue.indexOf("|");
                if (i > -1) {
                    try {
                            s1 = sValue.substring(0, i);
                            s2 = sValue.substring(i + 1);
                            color1 = ik.getInstance().makeColor(s1);
                            color2 = ik.getInstance().makeColor(s2);
                    } 
                    catch (Exception ex) {
                        print("Text setProperty() wrong "+sName+" values:" +sValue);
                    }
                }          
            }             
            else if(sName.equalsIgnoreCase("LineColor")) cOutline = ik.getInstance().makeColor(sValue);
            else if(sName.equalsIgnoreCase("ShapeColor")) color = ik.getInstance().makeColor(sValue);
            else if(sName.equalsIgnoreCase("Rotation")) fRotate = new Float(sValue);
            else if(sName.equalsIgnoreCase("RotationPoint")) sCenterPoint = sValue;
            else if(sName.equalsIgnoreCase("FontName")) font = new Font(sValue, font.getStyle(), font.getSize());
            else if(sName.equalsIgnoreCase("FontSize")) font = new Font(sValue, font.getStyle(), new Integer(sValue));
            else if(sName.equalsIgnoreCase("Alignment")) sAlign = sValue;
            else if(sName.equalsIgnoreCase("Paint")) sPaint = sValue;
            else if(sName.equalsIgnoreCase("Image")) sImage = sValue;
            else if(sName.equalsIgnoreCase("FontStyle")) {
                if(sValue.equalsIgnoreCase("bold")) font = new Font(font.getName(), Font.BOLD, font.getSize());
                else if(sValue.equalsIgnoreCase("plain")) font = new Font(font.getName(), Font.PLAIN, font.getSize());
                else if(sValue.equalsIgnoreCase("italic")) font = new Font(font.getName(), Font.ITALIC, font.getSize());
                else if(sValue.equalsIgnoreCase("bolditalic")) font = new Font(font.getName(), Font.BOLD+Font.ITALIC, font.getSize());
            }                 
        }        

        Texts(String p_id, String p_name, String p_label, int p_x, int p_y, Font p_font, Color p_c, float p_f,
              boolean p_gradient, Color p_outline, int p_out, float p_rotate, String p_image, String p_paint) {
            sName = p_name;
            sLabel = p_label;
            sID = p_id;
            iX = p_x;
            iY = p_y;
            font = p_font;
            color = p_c;
            f = p_f;
            cOutline = p_outline;
            iOut = p_out;
            fRotate = p_rotate;
            bGradient = p_gradient;
            sImage = p_image;
            sPaint = p_paint;
            if (bGradient) {
                color1 = cT1;
                color2 = cT2;
                color = null;
            }
            if (sImage != null) {
                if (sImage.equalsIgnoreCase("horizontal_lines"))
                    sType = "h_lines";
                else if (sImage.equalsIgnoreCase("vertical_lines"))
                    sType = "v_lines";
                else
                    img = ik.loadImage(sImage);
                /*
                img = getToolkit().getImage(sImage);
                try {
                    MediaTracker tracker = new MediaTracker(VB);
                    tracker.addImage(img, 0);
                    tracker.waitForID(0);
                } catch (Exception e) {}
                */
            }
        }
    }

    /*-----------------------------*
     *  Object that stores a Line
     *-----------------------------*/
    class Line extends Object {
        int iType = 1; //line
        int iPos = 0;
        int i=0;
        Point pStart = null;
        Point pEnd = null;
        int iWidth = 1;
        int iLook = 1;
        int iCap = BasicStroke.CAP_SQUARE;
        int iJoin = BasicStroke.JOIN_BEVEL;
        float fDash[] = { 0.0f, 0.0f };
        Color color = Color.black;
        float f = 1.0f;
        float fRotate = 0.0f;
        String sCenterPoint = "ul";
        
        String getProperty(String sName){
            if(sName.equalsIgnoreCase("StartPoint")) return pStart.x+","+pStart.y;
            else if(sName.equalsIgnoreCase("EndPoint")) return pEnd.x+","+pEnd.y;
            else if(sName.equalsIgnoreCase("LineColor")) return "r"+color.getRed()+"g"+color.getGreen()+"b"+color.getBlue();
            else if(sName.equalsIgnoreCase("Rotation")) return ""+fRotate;
            else if(sName.equalsIgnoreCase("LineWidth")) return ""+iWidth;
            else if(sName.equalsIgnoreCase("RotationPoint")) return sCenterPoint;
            else return "UNKNOWN_PROPERTY";
        }  
        void setProperty(String sName, String sValue){
            String s1,s2;
            if(sName.equalsIgnoreCase("StartPoint")) {
                i = sValue.indexOf("|");
                if (i > -1) {
                    try {
                            s1 = sValue.substring(0, i);
                            s2 = sValue.substring(i + 1);
                            pStart.x = Integer.parseInt(s1);
                            pStart.y = Integer.parseInt(s2);
                    } 
                    catch (Exception ex) {
                        print("Line setProperty() wrong "+sName+" values:" +sValue);
                    }
                }          
            }
            if(sName.equalsIgnoreCase("EndPoint")) {
                i = sValue.indexOf("|");
                if (i > -1) {
                    try {
                            s1 = sValue.substring(0, i);
                            s2 = sValue.substring(i + 1);
                            pEnd.x = Integer.parseInt(s1);
                            pEnd.y = Integer.parseInt(s2);
                    } 
                    catch (Exception ex) {
                        print("Line setProperty() wrong "+sName+" values:" +sValue);
                    }
                }          
            } 
            else if(sName.equalsIgnoreCase("LineColor")) color = ik.getInstance().makeColor(sValue);
            else if(sName.equalsIgnoreCase("Rotation")) fRotate = new Float(sValue);
            else if(sName.equalsIgnoreCase("LineWidth")) iWidth = new Integer(sValue);
            else if(sName.equalsIgnoreCase("RotationPoint")) sCenterPoint = sValue.toLowerCase();
        }          

        Line(int p_pos, Point p_start, Point p_end, int p_width, Color p_color, float p_f, int p_cap, int p_join,
             int p_dash1, int p_dash2) {

            this.iPos = p_pos;
            this.pStart = p_start;
            this.pEnd = p_end;
            this.iWidth = p_width;
            this.color = p_color;
            this.f = p_f;
            this.iCap = p_cap;
            this.iJoin = p_join;
            if (p_dash1 > 0 && p_dash2 > 0) {
                fDash[0] = p_dash1;
                fDash[1] = p_dash2;
            }
        }
        void moveTo(int x, int y){
            int w = pEnd.x - pStart.x ;
            int h = pEnd.y - pStart.y ;
            pStart.x = x;
            pStart.y = y;
            pEnd.x = x + w;
            pEnd.y = y + h;            
        }
        void stretch(int w, int h, boolean b){
            if(b){
                // percentage
                int w1 = pEnd.x - pStart.x ;
                int h1 = pEnd.y - pStart.y ;
                pEnd.x = pStart.x + (int)((float)w1 * ((float)w/100.0f));
                pEnd.y = pStart.y + (int)((float)h1 * ((float)h/100.0f));
            }
            else{
                pEnd.x = w;
                pEnd.y = h;        
            }
        } 
        void rotate(float f){
            fRotate = f;
        }   
        void rotate(float f, String sPoint){
            fRotate = f;
            sCenterPoint = sPoint;
        }           
    }

    /*-----------------------------------*
     *  Object that stores an Ellipse
     *-----------------------------------*/
    class Ellipse extends Object {
        int iType = 4; 
        int iPos = 0;
        int iX1 = 0, iY1 = 0, iX2 = 0, iY2 = 0;
        Point pStart = null;
        Point pEnd = null;
        int iWidth = 1;
        int iLook = 1;
        int iDir = 1;
        Color color = Color.black;
        Color cinside = null;
        Color cStart = null, cEnd = null;
        Color cShade = null;
        float f = 1.0f;
        float fRotate = 0.0f;
        String sPaint = null;
        String sCenterPoint = "ul";
        
        String getProperty(String sName){
            if(sName.equalsIgnoreCase("StartPoint")) return iX1+","+iY1;
            else if(sName.equalsIgnoreCase("ShapeColor")) return "r"+cinside.getRed()+"g"+cinside.getGreen()+"b"+cinside.getBlue();
            else if(sName.equalsIgnoreCase("LineColor")) return "r"+color.getRed()+"g"+color.getGreen()+"b"+color.getBlue();
            else if(sName.equalsIgnoreCase("Gradient")) return "r"+cStart.getRed()+"g"+cStart.getGreen()+"b"+cStart.getBlue()+",r"+cEnd.getRed()+"g"+cEnd.getGreen()+"b"+cEnd.getBlue();
            else if(sName.equalsIgnoreCase("Rotation")) return ""+fRotate;
            else if(sName.equalsIgnoreCase("RotationPoint")) return sCenterPoint;
            else if(sName.equalsIgnoreCase("LineWidth")) return ""+iWidth;
            else if(sName.equalsIgnoreCase("Paint")) return ""+sPaint;
            else if(sName.equalsIgnoreCase("Width")) return ""+iX2;
            else if(sName.equalsIgnoreCase("Height")) return ""+iY2;
            else return "UNKNOWN_PROPERTY";
        }    
        void setProperty(String sName, String sValue){
            int i=0;
            String s1,s2;
            if(sName.equalsIgnoreCase("StartPoint")) {
                i = sValue.indexOf("|");
                if (i > -1) {
                    try {
                            s1 = sValue.substring(0, i);
                            s2 = sValue.substring(i + 1);
                            iX1 = Integer.parseInt(s1);
                            iY1 = Integer.parseInt(s2);
                    } 
                    catch (Exception ex) {
                        print("Ellipse setProperty() wrong "+sName+" values:" +sValue);
                    }
                }          
            } 
            if(sName.equalsIgnoreCase("Gradient")) {
                i = sValue.indexOf("|");
                if (i > -1) {
                    try {
                            s1 = sValue.substring(0, i);
                            s2 = sValue.substring(i + 1);
                            cStart = ik.getInstance().makeColor(s1);
                            cEnd = ik.getInstance().makeColor(s2);
                    } 
                    catch (Exception ex) {
                        print("Ellipse setProperty() wrong "+sName+" values:" +sValue);
                    }
                }          
            }              
            else if(sName.equalsIgnoreCase("ShapeColor")) cinside = ik.getInstance().makeColor(sValue);
            else if(sName.equalsIgnoreCase("LineColor")) color = ik.getInstance().makeColor(sValue);
            else if(sName.equalsIgnoreCase("Rotation")) fRotate = new Float(sValue);
            else if(sName.equalsIgnoreCase("RotationPoint")) sCenterPoint = sValue;
            else if(sName.equalsIgnoreCase("LineWidth")) iWidth = new Integer(sValue);
            else if(sName.equalsIgnoreCase("Paint")) sPaint = sValue;
            else if(sName.equalsIgnoreCase("Width")) iX2 = new Integer(sValue);
            else if(sName.equalsIgnoreCase("Height")) iY2 = new Integer(sValue);      
        }

        Ellipse(int p_pos, int p_x1, int p_y1, int p_x2, int p_y2, int p_width, Color p_color, float p_f, Color p_inside,
             Color p_shade, Color p_start, Color p_end, int p_dir, String p_paint) {

            this.iPos = p_pos;
            this.iX1 = p_x1;
            this.iY1 = p_y1;
            this.iX2 = p_x2;
            this.iY2 = p_y2;
            this.iWidth = p_width;
            this.color = p_color;
            this.f = p_f;
            if (p_inside != null)
                this.cinside = p_inside;
            else if (p_start != null && p_end != null) {
                this.cStart = p_start;
                this.cEnd = p_end;
            }
            if (p_shade != null)
                this.cShade = p_shade;
            this.iDir = p_dir;
            this.sPaint = p_paint;
        }
        void moveTo(int x, int y){
            iX1 = x;
            iY1 = y;
        } 
        void stretch(int w, int h, boolean b){
            if(b){
                // percentage
                iX2 = (int)((float)iX2 * ((float)w/100.0f));
                iY2 = (int)((float)iY2 * ((float)h/100.0f));
            }
            else{
                iX2 = w;
                iY2 = h;        
            }
        }  
        void rotate(float f){
            fRotate = f;
        }    
        void rotate(float f, String sPoint){
            fRotate = f;
            sCenterPoint = sPoint;
        }            
    }
    /*-----------------------------------*
     *  Object that stores a Rectangle
     *-----------------------------------*/
    class Rect extends Object {
        int iType = 1; 
        int iPos = 0;
        int iX1 = 0, iY1 = 0, iX2 = 0, iY2 = 0;
        Point pStart = null;
        Point pEnd = null;
        int iWidth = 1;
        int iLook = 1;
        int iDir = 1;
        int iRound = 0;
        Color color = Color.black;
        Color cinside = null;
        Color cStart = null, cEnd = null;
        Color cShade = null;
        float f = 1.0f;
        float fRotate = 0.0f;
        String sPaint = null;
        String sCenterPoint = "ul";
        
        String getProperty(String sName){
            if(sName.equalsIgnoreCase("StartPoint")) return iX1+","+iY1;
            else if(sName.equalsIgnoreCase("ShapeColor")) return "r"+cinside.getRed()+"g"+cinside.getGreen()+"b"+cinside.getBlue();
            else if(sName.equalsIgnoreCase("LineColor")) return "r"+color.getRed()+"g"+color.getGreen()+"b"+color.getBlue();
            else if(sName.equalsIgnoreCase("Gradient")) return "r"+cStart.getRed()+"g"+cStart.getGreen()+"b"+cStart.getBlue()+",r"+cEnd.getRed()+"g"+cEnd.getGreen()+"b"+cEnd.getBlue();
            else if(sName.equalsIgnoreCase("Rotation")) return ""+fRotate;
            else if(sName.equalsIgnoreCase("RotationPoint")) return sCenterPoint;
            else if(sName.equalsIgnoreCase("LineWidth")) return ""+iWidth;
            else if(sName.equalsIgnoreCase("Paint")) return ""+sPaint;
            else if(sName.equalsIgnoreCase("Width")) return ""+iX2;
            else if(sName.equalsIgnoreCase("Height")) return ""+iY2;
            else return "UNKNOWN_PROPERTY";
        }        
        void setProperty(String sName, String sValue){
            int i=0;
            String s1,s2;
            if(sName.equalsIgnoreCase("StartPoint")) {
                i = sValue.indexOf("|");
                if (i > -1) {
                    try {
                            s1 = sValue.substring(0, i);
                            s2 = sValue.substring(i + 1);
                            iX1 = Integer.parseInt(s1);
                            iY1 = Integer.parseInt(s2);
                    } 
                    catch (Exception ex) {
                        print("Rectangle setProperty() wrong "+sName+" values:" +sValue);
                    }
                }          
            }  
            if(sName.equalsIgnoreCase("Gradient")) {
                i = sValue.indexOf("|");
                if (i > -1) {
                    try {
                            s1 = sValue.substring(0, i);
                            s2 = sValue.substring(i + 1);
                            cStart = ik.getInstance().makeColor(s1);
                            cEnd = ik.getInstance().makeColor(s2);
                    } 
                    catch (Exception ex) {
                        print("Rectangle setProperty() wrong "+sName+" values:" +sValue);
                    }
                }          
            }              
            else if(sName.equalsIgnoreCase("ShapeColor")) cinside = ik.getInstance().makeColor(sValue);
            else if(sName.equalsIgnoreCase("LineColor")) color = ik.getInstance().makeColor(sValue);
            else if(sName.equalsIgnoreCase("Rotation")) fRotate = new Float(sValue);
            else if(sName.equalsIgnoreCase("RotationPoint")) sCenterPoint = sValue;
            else if(sName.equalsIgnoreCase("LineWidth")) iWidth = new Integer(sValue);
            else if(sName.equalsIgnoreCase("Paint")) sPaint = sValue;
            else if(sName.equalsIgnoreCase("Width")) iX2 = new Integer(sValue);
            else if(sName.equalsIgnoreCase("Height")) iY2 = new Integer(sValue);      
        }        

        Rect(int p_pos, int p_x1, int p_y1, int p_x2, int p_y2, int p_width, Color p_color, float p_f, Color p_inside,
             Color p_shade, Color p_start, Color p_end, int p_dir, int p_round, String p_paint) {

            this.iPos = p_pos;
            this.iX1 = p_x1;
            this.iY1 = p_y1;
            this.iX2 = p_x2;
            this.iY2 = p_y2;
            this.iWidth = p_width;
            this.color = p_color;
            this.f = p_f;
            if (p_inside != null)
                this.cinside = p_inside;
            else if (p_start != null && p_end != null) {
                this.cStart = p_start;
                this.cEnd = p_end;
            }
            if (p_shade != null)
                this.cShade = p_shade;
            this.iDir = p_dir;
            this.iRound = p_round;
            this.sPaint = p_paint;
        }
        void moveTo(int x, int y){
            iX1 = x;
            iY1 = y;        
        }
        void stretch(int w, int h, boolean b){
            if(b){
                // percentage
                iX2 = (int)((float)iX2 * ((float)w/100.0f));
                iY2 = (int)((float)iY2 * ((float)h/100.0f));
            }
            else{
                iX2 = w;
                iY2 = h;        
            }
        } 
        void rotate(float f){
            fRotate = f;
        } 
        void rotate(float f, String sPoint){
            fRotate = f;
            sCenterPoint = sPoint;
        }         
    }
    /*-----------------------------------*
     *  Object that stores a Polygon
     *-----------------------------------*/
    class Poly extends Object {
        String sTxtPaint = null ;
        int iType = 3;
        int iPos = 0;
        int iX = 0, iY = 0;
        float fTrsp = 1.0f;
        float fRotate = 0.0f;
        String sCenterPoint = "ul";
        
        String getProperty(String sName){
            if(sName.equalsIgnoreCase("StartPoint")) return iX+","+iY;
            else if(sName.equalsIgnoreCase("Rotation")) return ""+fRotate;
            else if(sName.equalsIgnoreCase("RotationPoint")) return sCenterPoint;
            else return "UNKNOWN_PROPERTY";
        }  
        void setProperty(String sName, String sValue){
            String s1,s2;
            int i=0;
            if(sName.equalsIgnoreCase("StartPoint")) {
                i = sValue.indexOf("|");
                if (i > -1) {
                    try {
                            s1 = sValue.substring(0, i);
                            s2 = sValue.substring(i + 1);
                            iX = Integer.parseInt(s1);
                            iY = Integer.parseInt(s2);
                    } 
                    catch (Exception ex) {
                        print("Shape setProperty() wrong "+sName+" values:" +sValue);
                    }
                }          
            }
            else if(sName.equalsIgnoreCase("Rotation")) fRotate = new Float(sValue);
            else if(sName.equalsIgnoreCase("RotationPoint")) sCenterPoint = sValue.toLowerCase();
        }                  

        Poly(String s, int p_pos, int p_x1, int p_y1, float p_f) {
            this.iPos = p_pos;
            this.iX = p_x1;
            this.iY = p_y1;
            this.sTxtPaint = s;
            this.fTrsp = p_f;
        }
        void moveTo(int x, int y){
            iX = x;
            iY = y;
        }  
        void rotate(float f){
            fRotate = f;
        } 
        void rotate(float f, String sPoint){
            fRotate = f;
            sCenterPoint = sPoint;
        }         
    }


    /*------------------------------------*
     *  object to store a popup menu
     *------------------------------------*/

    static class PopMenu extends Object {
        String sName = "";
        JPanel jp = null;
        float fTrsp = 1.0f;
        Border border = null;
        String sBG = null, s2 = null;
        Color cFont = null;
        SortedMap hOptions = new TreeMap();
        int iMaxWidth = 0;
        Font font = new Font("Arial", Font.PLAIN, 12);

        PopMenu(String p_name, JPanel p_panel) {
            this.sName = p_name;
            this.jp = p_panel;
        }

        // add a popup menu option

        void addMenuOption(NewButton p_nb, String p_id, String p_label) {
            p_nb.setFonte(font);
            if (cFont != null)
                p_nb.setFGcolor(cFont);
            if (jp != null)
                jp.add(p_nb);
            if (p_nb != null)
                hOptions.put(p_id, p_nb);
        }

        // remove a popup menu option

        void removeMenuOption(String p_id) {
            hOptions.remove(p_id);
        }

        // set the popup menu font

        void setMenuFont(Font f) {
            font = f;
        }

        // set the option icon

        void setMenuIcon(String p_id, Image p_img) {
            // retrieve buton
            NewButton nb = (NewButton)hOptions.get(p_id);
            if (nb != null) {
                nb.setBTImage(p_img);
                nb.setImagePosition("LM");
            }
        }
        // set the popum menu font color

        void setMenuFontColor(Color c) {
            cFont = c;
        }

        // change an option's label

        void setOptionLabel(String p_id, String p_label) {
            NewButton nb = (NewButton)hOptions.get(p_id);
            if (nb != null) {
                nb.setProperty(ID.LABEL, p_label);
            }
        }

        // show the popup menu

        void show(Component cp, int p_x, int p_y, Dimension p_dim, int init) {
            int x = 0, y = 0;
            int x1 = p_x, y1 = p_y;
            int iIcWidth = 0;
            int iNb=0;
            NewButton newButton = null;
            iMaxWidth = 0;
            String sLabel = null, key = null;
            Rectangle2D rect = null;
            NewButton nb = null;
            Iterator iterator = hOptions.keySet().iterator();
            while (iterator.hasNext()) {
                key = (String)iterator.next();
                nb = (NewButton)hOptions.get(key);
                if (nb != null) {
                    sLabel = "" + nb.getProperty(ID.LABEL);
                    iIcWidth = nb.getIconWidth();
                    if (iIcWidth > 0)
                        iIcWidth += 8;
                    rect = font.getStringBounds(sLabel, new FontRenderContext(new AffineTransform(), true, true));
                    int iTextWidth = iIcWidth + (int)(rect.getWidth() + 18);
                    if (iTextWidth > iMaxWidth)
                        iMaxWidth = iTextWidth;
                }
            }
            iterator = hOptions.keySet().iterator();
            while (iterator.hasNext()) {
                key = (String)iterator.next();
                nb = (NewButton)hOptions.get(key);
                if (nb != null) {
                    sLabel = "" + nb.getProperty(ID.LABEL);
                    rect = font.getStringBounds(sLabel, new FontRenderContext(new AffineTransform(), true, true));
                    int iTextHeight = (int)rect.getHeight();
                    nb.setLocation(x, y);
                    nb.setSize(iMaxWidth, iTextHeight + 14);
                    y += (iTextHeight + 10);
                    iNb++;
                    if(init > 0 && (iNb==init)){
                        newButton = nb ;
                    }
                }
            }
            jp.setSize(iMaxWidth + 2, y + 6);
            if ((p_x + iMaxWidth + 2) > p_dim.width)
                p_x = p_dim.width - (iMaxWidth + 2);
            if (p_y + (y + 6) > p_dim.height)
                p_y = p_dim.height - (y + 6);
            jp.setLocation(p_x, p_y);
            jp.setVisible(true);
            if (cp.getParent() != null) {
                cp.getParent().add(jp, 0);
                if(null != newButton){
                    Robot robot;
                    try {
                        robot = new Robot();
                        Point p = newButton.getLocation();
                        SwingUtilities.convertPointToScreen(p, jp);
                        robot.mouseMove(p.x+((int)(newButton.getWidth()/2)), p.y+((int)(newButton.getHeight()/2)));
                    } catch (AWTException e) {}
                }                
            }
        }

        // hide the popup menu

        void hide(Component cp) {
            jp.setVisible(false);
            if (cp.getParent() != null) {
                cp.getParent().remove(jp);
            }
        }

    }

    /*--------------------------*
     *    hide all popup menus
     *---------------------------*/

    void HidePopupMenus() {
        try {
            Iterator iterator = hPopups.keySet().iterator();
            String key = null;
            while (iterator.hasNext()) {
                key = (String)iterator.next();
                PopMenu pm = (PopMenu)hPopups.get(key);
                if (pm != null) {
                    if (pm.jp != null) {
                        pm.jp.setVisible(false);
                        this.getParent().remove(pm.jp);
                    }
                }
            }
        } catch (Exception e) {
        }
    }

    /*------------------------------*
     * set the current color scheme
     *-------------------------------*/

    public static void setScheme(String s_scheme) {
        Color c = null;
        cFocus = new Color(255, 214, 47);
        cDisable = new Color(100, 100, 100);
        cSelect = null;
        cListSelect = null;
        Current_Scheme = s_scheme;
        if (s_scheme.equalsIgnoreCase("XP")) {
            Current_Color = XP_SCHEME;
            Current_Color_Light = XP_LIGHT;
        } else if (s_scheme.equalsIgnoreCase("green")) {
            Current_Color = GREEN_SCHEME;
            Current_Color_Light = GREEN_LIGHT;
        } else if (s_scheme.equalsIgnoreCase("yellow")) {
            Current_Color = YELLOW_SCHEME;
            Current_Color_Light = YELLOW_LIGHT;
        } else if (s_scheme.equalsIgnoreCase("orange")) {
            Current_Color = ORANGE_SCHEME;
            Current_Color_Light = ORANGE_LIGHT;
        } else if (s_scheme.equalsIgnoreCase("red")) {
            Current_Color = RED_SCHEME;
            Current_Color_Light = RED_LIGHT;
        } else if (s_scheme.equalsIgnoreCase("blue")) {
            Current_Color = BLUE_SCHEME;
            Current_Color_Light = BLUE_LIGHT;
        } else if (s_scheme.equalsIgnoreCase("purple")) {
            Current_Color = PURPLE_SCHEME;
            Current_Color_Light = PURPLE_LIGHT;
        } else if (s_scheme.equalsIgnoreCase("gray")) {
            Current_Color = GRAY_SCHEME;
            Current_Color_Light = GRAY_LIGHT;
        } else if (s_scheme.equalsIgnoreCase("silver")) {
            Current_Color = SILVER_SCHEME;
            Current_Color_Light = SILVER_LIGHT;
        } else {
            Current_Scheme = "Custom";
            try {
                c = ImageKit.getInstance().makeColor(s_scheme);
                Current_Color = c;
                Current_Color_Light = c.brighter();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }


    /*----------------------------------------------------
     *  recursive method to loop through the components
     *---------------------------------------------------*/

    private void getContainerContent(Container ct) {
        iLevel++;
        String sLevel = "";
        String sClassName = "";
        for (int j = 0; j <= iLevel; j++)
            sLevel += "--";
        Component cp[] = ct.getComponents();
        if (cp.length == 0) {
            iLevel = 0;
            return;
        }
        for (int i = 0; i < cp.length; i++) {
            sClassName = cp[i].getClass().toString();
            //print(sLevel+":"+cp[i].getClass().getName());
            // text area
            if (sClassName.equalsIgnoreCase("class oracle.forms.ui.VTextArea")) {
                oracle.forms.ui.VTextArea ta = (oracle.forms.ui.VTextArea)cp[i];
                if (TextArea != null) {
                    if (TextArea.fFont != null)
                        ta.setFont(TextArea.fFont);
                    if (TextArea.cBack != null)
                        ta.setBackground(TextArea.cBack);
                    if (TextArea.cFore != null)
                        ta.setForeground(TextArea.cFore);
                }
            }
            // text field
            else if (sClassName.equalsIgnoreCase("class oracle.forms.ui.VTextField")) {
                oracle.forms.ui.VTextField ta = (oracle.forms.ui.VTextField)cp[i];
                if (TextField != null) {
                    if (TextField.fFont != null)
                        ta.setFont(TextField.fFont);
                    if (TextField.cBack != null)
                        ta.setBackground(TextField.cBack);
                    if (TextField.cFore != null)
                        ta.setForeground(TextField.cFore);
                }
                // text alignment : 0= left  2=right 3=center
                //ta.setAlignment(3);
            }
            // Button
            else if ((sClassName.equalsIgnoreCase("class oracle.forms.ui.VButton")) ||
                     (sClassName.equalsIgnoreCase("class oracle.forms.fd.LAF_XP_Button"))) {
                oracle.forms.ui.VButton ta = (oracle.forms.ui.VButton)cp[i];
                if (Button != null) {
                    if (sClassName.equalsIgnoreCase("class oracle.forms.ui.VButton")) {
                        if (Button.fFont != null)
                            ta.setFont(Button.fFont);
                        if (Button.cBack != null)
                            ta.setBackground(Button.cBack);
                        if (Button.cFore != null)
                            ta.setForeground(Button.cFore);
                    } else {
                        oracle.forms.fd.LAF_XP_Button pb = (oracle.forms.fd.LAF_XP_Button)cp[i];
                        if (Button.fFont != null)
                            pb.pb.setFonte(Button.fFont);
                        if (Button.cBack != null)
                            pb.pb.setBGcolor(Button.cBack);
                        if (Button.cFore != null)
                            pb.pb.setFGcolor(Button.cFore);
                    }
                }
            }
            // CheckBox
            else if ((sClassName.equalsIgnoreCase("class oracle.forms.ui.VCheckbox")) ||
                     (sClassName.equalsIgnoreCase("class oracle.forms.fd.LAF_XP_CBox"))) {
                oracle.forms.ui.VCheckbox ta = (oracle.forms.ui.VCheckbox)cp[i];
                if (CheckBox != null) {
                    if (CheckBox.fFont != null)
                        ta.setFont(CheckBox.fFont);
                    if (CheckBox.cBack != null)
                        ta.setBackground(CheckBox.cBack);
                    if (CheckBox.cFore != null)
                        ta.setForeground(CheckBox.cFore);
                }
            }
            // Radio button
            else if ((sClassName.equalsIgnoreCase("class oracle.forms.ui.VRadioButton")) ||
                     (sClassName.equalsIgnoreCase("class oracle.forms.fd.LAF_XP_RadioButton"))) {
                oracle.forms.ui.VRadioButton ta = (oracle.forms.ui.VRadioButton)cp[i];
                if (RadioB != null) {
                    if (RadioB.fFont != null)
                        ta.setFont(RadioB.fFont);
                    if (RadioB.cBack != null)
                        ta.setBackground(RadioB.cBack);
                    if (RadioB.cFore != null)
                        ta.setForeground(RadioB.cFore);
                }
            }
            // ComboBox
            else if (sClassName.equalsIgnoreCase("class oracle.forms.ui.VComboBox")) {
                oracle.forms.ui.VComboBox ta = (oracle.forms.ui.VComboBox)cp[i];
                if (ComboBox != null) {
                    if (ComboBox.fFont != null)
                        ta.setFont(ComboBox.fFont);
                    if (ComboBox.cBack != null)
                        ta.setBackground(ComboBox.cBack);
                    if (ComboBox.cFore != null)
                        ta.setForeground(ComboBox.cFore);
                }
            }
            // PopList
            else if (sClassName.equalsIgnoreCase("class oracle.forms.ui.VPopList")) {
                oracle.forms.ui.VPopList ta = (oracle.forms.ui.VPopList)cp[i];
                if (PopList != null) {
                    if (PopList.fFont != null)
                        ta.setFont(PopList.fFont);
                    if (PopList.cBack != null)
                        ta.setBackground(PopList.cBack);
                    if (PopList.cFore != null)
                        ta.setForeground(PopList.cFore);
                }
            }
            // TList
            else if (sClassName.equalsIgnoreCase("class oracle.forms.ui.VTList")) {
                oracle.forms.ui.VTList ta = (oracle.forms.ui.VTList)cp[i];
                if (TList != null) {
                    if (TList.fFont != null)
                        ta.setFont(TList.fFont);
                    if (TList.cBack != null)
                        ta.setBackground(TList.cBack);
                    if (TList.cFore != null)
                        ta.setForeground(TList.cFore);
                }
            }
            // Tree
            else if (sClassName.equalsIgnoreCase("class oracle.ewt.dTree.DTree")) {
                oracle.ewt.dTree.DTree ta = (oracle.ewt.dTree.DTree)cp[i];
                if (Tree != null) {
                    if (Tree.fFont != null)
                        ta.setFont(Tree.fFont);
                    if (Tree.cBack != null)
                        ta.setBackground(Tree.cBack);
                    if (Tree.cFore != null)
                        ta.setForeground(Tree.cFore);
                }
            }
            // windows
            else if (sClassName.equalsIgnoreCase("class oracle.forms.ui.ExtendedFrame")) {
                oracle.forms.ui.ExtendedFrame ef = (oracle.forms.ui.ExtendedFrame)cp[i];
                String sTitle = ef.getTitle();
                objWin obw = (objWin)hWindows.get(sTitle);
                if (obw == null) {
                    obw = new objWin(ef, ef.getName(), ef.getTitle());
                    hWindows.put(sTitle, obw);
                    AnyEventListener ael = new AnyEventListener() {
                        public void actionPerformed(ActionEvent actionEvent) {
                        }

                        public void processEventStart(java.util.EventObject eo) {
                            String keyText = eo.toString();
                            if ((keyText.indexOf("FOCUS_LOST") > -1) || (keyText.indexOf("FOCUS_GAINED") > -1)) {
                                getWindowComponent((Container)eo.getSource());
                                setProperty(GetComponents, null);
                            }
                            if (keyText.indexOf("COMPONENT_RESIZED") > -1) {
                                /* removed from 1.6 to return back to 1.4
                      if(jp != null) {
                        jp.setBounds(winCurrent.getBounds());
                        jp.repaint();
                      }
                      */
                            }
                        }

                        public void processEventEnd(java.util.EventObject eo) {
                        }
                    };
                    ef.addAnyEventListener(ael);
                }
            }
            // Window caption
            else if (sClassName.equalsIgnoreCase("class oracle.ewt.lwAWT.lwWindow.laf.TitleBar")) {
                oracle.ewt.lwAWT.lwWindow.laf.TitleBar ta = (oracle.ewt.lwAWT.lwWindow.laf.TitleBar)cp[i];
                if (InitWindow == null)
                    InitWindow = new cObj(ta.getFont(), ta.getForeground(), ta.getBackground());
                if (Window.cBack != null)
                    ta.setBackground(Window.cBack);
                if (Window.cFore != null)
                    ta.setForeground(Window.cFore);

                oracle.forms.ui.ExtendedFrame ef = (oracle.forms.ui.ExtendedFrame)ta.getParent();
                String sTitle = ef.getTitle();
                objWin obw = (objWin)hWindows.get(sTitle);
                if (obw != null) {
                    if (Window.fFont != null)
                        obw.setWinFont(Window.fFont);
                    obw.setTitleColors(Window.cFore, Window.cBack);
                    hWindows.put(sTitle, obw);
                }

                if (Window != null) {
                    if (Window.fFont != null)
                        ta.setFont(Window.fFont);
                    // get the sub-components
                    Component cpw[] = ta.getComponents();

                    for (int z = 0; z < cpw.length; z++) {
                        if (cpw[z].getClass().toString().equalsIgnoreCase("class oracle.ewt.lwAWT.LWComponent")) {
                            oracle.ewt.lwAWT.LWComponent lwc = (oracle.ewt.lwAWT.LWComponent)cpw[z];
                            Component cpw2[] = lwc.getComponents();
                            // get the title label
                            for (int x = 0; x < cpw2.length; x++) {
                                if (cpw2[x].getClass().toString().equalsIgnoreCase("class oracle.ewt.lwAWT.LWLabel")) {
                                    oracle.ewt.lwAWT.LWLabel lb = (oracle.ewt.lwAWT.LWLabel)cpw2[x];
                                    if (Window.fFont != null)
                                        lb.setFont(Window.fFont);
                                    if (Window.cBack != null)
                                        lb.setBackground(Window.cBack);
                                    if (Window.cFore != null)
                                        lb.setForeground(Window.cFore);
                                    break;
                                }
                            }
                            if (Window.cBack != null)
                                lwc.setBackground(Window.cBack);
                        } else if (cpw[z].getClass().toString().equalsIgnoreCase("class oracle.ewt.toolBar.ToolBar")) {
                            oracle.ewt.toolBar.ToolBar tb = (oracle.ewt.toolBar.ToolBar)cpw[z];
                            if (Window.cBack != null)
                                tb.setBackground(Window.cBack);
                        } else if (cpw[z].getClass().toString().equalsIgnoreCase("class oracle.ewt.lwAWT.lwWindow.laf.TitleBar")) {
                            oracle.ewt.lwAWT.lwWindow.laf.TitleBar tb = (oracle.ewt.lwAWT.lwWindow.laf.TitleBar)cpw[z];
                            if (Window.cBack != null)
                                tb.setBackground(Window.cBack);
                        }
                    }
                }
            }

            // tabs
            else if (sClassName.equalsIgnoreCase("class oracle.ewt.tabBar.TabBar")) {

                boolean bCreate = false;
                oracle.ewt.tabBar.TabBar tb = (oracle.ewt.tabBar.TabBar)cp[i];
                tb.getParent().setBackground(null);
                tb.getParent().setForeground(null);
                objTab ot = (objTab)hTabs.get(tb.getName());

                if (ot == null) {
                    bCreate = true;
                    ot = new objTab(tb.getName());
                    ot.cPrevTabBackColor = tb.getBackground();
                    ot.cPrevTabForeColor = tb.getForeground();
                    ot.cPrevTabSelBackColor = tb.getSelectedBackground();
                    ot.cPrevTabSelForeColor = tb.getSelectedForeground();
                    ot.fPrevTabFont = tb.getFont();
                } else {
                    if (ot.cTabBackColor != null) {
                        oracle.ewt.laf.basic.BasicComponentUI def = new oracle.ewt.laf.basic.BasicComponentUI(tb);
                        oracle.ewt.UIDefaults defs = def.getUIDefaults();
                        Object obj[] = new Object[] { "TabBar.itemBackground", ot.cTabBackColor };
                        defs.putDefaults(obj);
                        tb.setBackground(ot.cTabBackColor);
                    }
                    if (ot.cTabForeColor != null)
                        tb.setForeground(ot.cTabForeColor);
                    if (ot.sTooltip != null)
                        tb.setToolTipValue(ot.sTooltip);
                    if (ot.fTabFont != null)
                        tb.setFont(ot.fTabFont);
                    if (ot.cTabSelBackColor != null)
                        tb.setSelectedBackground(ot.cTabSelBackColor);
                    if (ot.cTabSelForeColor != null)
                        tb.setSelectedForeground(ot.cTabSelForeColor);
                    if (ot.cTabBackColor != null)
                        tb.setItemBackground(ot.cTabBackColor);
                }

                Image img = null;

                // tab items
                for (int k = 0; k < tb.getItemCount(); k++) {
                    oracle.ewt.tabBar.TabBarItem tbi = tb.getItem(k);
                    if (bCreate)
                        ot.hTabItems.put(tbi.getLabel(), null);
                    else {
                        String sIcon = (String)ot.hTabItems.get(tbi.getLabel());
                        if (sIcon != null) {
                            img = ik.loadImage(sIcon);
                            if (img != null) {
                                tbi.setIcon(img);
                                ImageIcon ii = new ImageIcon(img);
                                Dimension di = tbi.getSize();
                                if (di.getHeight() < ii.getIconHeight())
                                    tbi.setSize((int)di.getWidth(), (int)ii.getIconHeight() + 4);
                            }
                        }
                    }
                }

                if (bCreate)
                    hTabs.put(tb.getName(), ot);
                tb.invalidate();

            }

            // menu bar
            else if (sClassName.equalsIgnoreCase("class oracle.ewt.lwAWT.lwMenu.LWMenuBar") ||
                     sClassName.equalsIgnoreCase("class oracle.forms.handler.FormMenuBar")) {
                //else if(sClassName.equalsIgnoreCase("class oracle.ewt.lwAWT.lwMenu.LWMenuBar")) {
                oracle.ewt.lwAWT.lwMenu.LWMenuBar ta = (oracle.ewt.lwAWT.lwMenu.LWMenuBar)cp[i];
                pMain = ta;
                if (InitMenuBar == null) {
                    InitMenuBar = new cObj(ta.getFont(), ta.getForeground(), ta.getBackground());
                    InitMenuOption = new cObj(ta.getFont(), ta.getForeground(), ta.getBackground());
                }
                if (MenuBar != null) {
                    if (MenuBar.fFont != null)
                        ta.setFont(MenuBar.fFont);
                    if (MenuBar.cBack != null)
                        ta.setBackground(MenuBar.cBack);
                    if (MenuBar.cFore != null)
                        ta.setForeground(MenuBar.cFore);
                }
                pMenu = ta;
            }
            // popup menu
            else if (sClassName.equalsIgnoreCase("class oracle.ewt.lwAWT.lwMenu.LWMenu") ||
                     sClassName.equalsIgnoreCase("class oracle.forms.handler.FormMenuItem")) {
                //else if(sClassName.equalsIgnoreCase("class oracle.ewt.lwAWT.lwMenu.LWMenu")) {
                oracle.ewt.lwAWT.lwMenu.LWMenu ta = (oracle.ewt.lwAWT.lwMenu.LWMenu)cp[i];
                scruteMenuBar(ta, 0);
            }

            else if (sClassName.equalsIgnoreCase("class oracle.ewt.statusBar.StatusBar")) {
                stBar = (oracle.ewt.statusBar.StatusBar)cp[i];
                if(stBar.getParent().getParent() instanceof oracle.forms.ui.FormStatusArea ){
                    oracle.forms.ui.FormStatusArea fsa = (oracle.forms.ui.FormStatusArea)stBar.getParent().getParent();
                    if(fsa.getBorderPainter() != null){
                        stBorderPainter = fsa.getBorderPainter();
                    }
                }
                // store the Status Bar Text Items components
                iStatusBar++;               
                oracle.ewt.statusBar.StatusBarItem sbi[] = stBar.getItems();
                for (int z = 0; z < sbi.length; z++) {
                    oracle.ewt.statusBar.StatusBarTextItem bi = (oracle.ewt.statusBar.StatusBarTextItem)sbi[z];
                    statusbars[iStatusBar][z] = bi;
                    //System.out.println(iStatusBar+","+z+" "+stBar.getName()+" - Status text="+statusbars[iStatusBar][z].getText());
                }
            
                if (InitStatus == null){
                    InitStatus = new cObj(stBar.getFont(), stBar.getForeground(), stBar.getBackground());         
                }

                if (InitStatus == null)
                    InitStatus = new cObj(stBar.getFont(), stBar.getForeground(), stBar.getBackground());
                if (Status != null) {
                    if (Status.fFont != null)
                        stBar.setFont(Status.fFont);
                    if (Status.cBack != null)
                        stBar.setBackground(Status.cBack);
                        stBar.getParent().getParent().setBackground(Color.white);            
                    if (Status.cFore != null)
                        stBar.setForeground(Status.cFore);
                }

            } else if (sClassName.equalsIgnoreCase("class oracle.forms.ui.StatsIndicator")) {
                oracle.forms.ui.StatsIndicator ta = (oracle.forms.ui.StatsIndicator)cp[i];
                if (Status != null) {
                    if (Status.fFont != null)
                        ta.setFont(Status.fFont);
                    if (Status.cBack != null)
                        ta.setBackground(Status.cBack);
                    if (Status.cFore != null)
                        ta.setForeground(Status.cFore);
                }
            } else if (sClassName.equalsIgnoreCase("class oracle.ewt.lwAWT.LWScrollbar")) {
                oracle.ewt.lwAWT.LWScrollbar scb = (oracle.ewt.lwAWT.LWScrollbar)cp[i];
                scb.setBackground(Current_Color_Light);
            }

            else if (sClassName.equalsIgnoreCase("class oracle.forms.ui.FormsTabPanel")) {
                // set the Tab Panel background transparent
                oracle.forms.ui.DrawnPanel dp = (oracle.forms.ui.DrawnPanel)cp[i].getParent();
                dp.setBackground(new Color(255, 255, 255, 0));
            }

            else if (sClassName.equalsIgnoreCase("class oracle.forms.ui.FormsTabPanel")) {
                // set the Tab Panel background transparent
                oracle.forms.ui.DrawnPanel dp = (oracle.forms.ui.DrawnPanel)cp[i].getParent();
                dp.setBackground(new Color(255, 255, 255, 0));
            }

            //else print(sLevel+":"+sClassName/*cp[i].getClass().getName()*/);

            try {
                getContainerContent((Container)cp[i]);
            } catch (Exception e) {
                ;
            }
        }
    }


    /*--------------------------------------*
     *  method to scrute the existing menu  *
     *--------------------------------------*/

    protected void scruteMenuBar(Component component, int iter) {
        String sLevel = "";
        for (int j = 0; j <= iter * 2; j++)
            sLevel += "--";
        if (component instanceof oracle.ewt.lwAWT.lwMenu.LWMenu) {
            oracle.ewt.lwAWT.lwMenu.LWMenu lwm = (oracle.ewt.lwAWT.lwMenu.LWMenu)component;
            scruteMenu(component, iter, lwm.getLabel().toLowerCase());
        }
        if (component instanceof Container) {
            Component components[] = ((Container)component).getComponents();
            for (int i = 0; i < components.length; i++) {
                if (components[i] != null) {
                    scruteMenuBar(components[i], iter);
                }
            }
        }
    }

    // Thanks to Anthony Hegarty

    protected void scruteMenu(Component component, int iter, String sParent) {
        String sLevel = "";
        String sName = "";
        String sLabel = "";
        String sLabelOpt = "";
        String sClassName = component.getClass().toString();
        boolean isSubMenu = false; // ah added this

        for (int j = 0; j <= iter * 2; j++)
            sLevel += "--";
        if (component instanceof oracle.ewt.lwAWT.lwMenu.LWMenu ||
            component.getClass().toString().equalsIgnoreCase("class oracle.forms.handler.FormMenuItem"))
        //if(component instanceof oracle.ewt.lwAWT.lwMenu.LWMenu)
        {
            oracle.ewt.lwAWT.lwMenu.LWMenu ta = (oracle.ewt.lwAWT.lwMenu.LWMenu)component;
            sLabel = ta.getLabel().toLowerCase();
            LWPopupMenu pop = ta.getSubMenu();
            // add popup menu to the table
            if (!sParent.equalsIgnoreCase(sLabel)) {
                isSubMenu = true;
                sName = sParent;
            } else {
                isSubMenu = false;
                sName = sLabel;
            }

            cPopMenu cpm = new cPopMenu(ta.getLabel(), ta, pop);
            hMenuBar.put(sName, cpm);
            /*
            log("[--  LWMenu  -------------------------------------------");
            log(iter+" "+sLevel+":"+ta.getName()+" ->"+ta.getLabel());
            log("-------------------------------------------------------]");
            */
            sName = sParent;
            pWinMenu = ta;
            if (MenuBar != null) {
                if (isSubMenu && MenuOption != null) {
                    log("trying to set using menuoption colours " + sName);
                    if (MenuBar.fFont != null)
                        ta.setFont(MenuOption.fFont);
                    if (MenuBar.cBack != null)
                        ta.setBackground(MenuOption.cBack);
                    if (MenuBar.cFore != null)
                        ta.setForeground(MenuOption.cFore);
                } else {
                    if (MenuBar.fFont != null)
                        ta.setFont(MenuBar.fFont);
                    if (MenuBar.cBack != null)
                        ta.setBackground(MenuBar.cBack);
                    if (MenuBar.cFore != null)
                        ta.setForeground(MenuBar.cFore);
                }
            }

            Component c[] = pop.getContent().getComponents();
            Component c2[] = pop.getComponents();
            for (int j = 0; j < c.length; j++) {
                if (!(c[j] instanceof oracle.ewt.lwAWT.lwMenu.LWMenuSeparator) &&
                    !(c[j] instanceof oracle.forms.ui.mdi.MDIWindowMenu)) {
                    if (c[j].getClass().toString().equalsIgnoreCase("class oracle.ewt.lwAWT.lwMenu.LWMenuItem") ||
                        c[j].getClass().toString().equalsIgnoreCase("class oracle.forms.handler.FormMenuItem"))
                    //if(c[j].getClass().toString().equalsIgnoreCase("class oracle.ewt.lwAWT.lwMenu.LWMenuItem")) //
                    {
                        // menu item option
                        oracle.ewt.lwAWT.lwMenu.LWMenuItem mi = (oracle.ewt.lwAWT.lwMenu.LWMenuItem)c[j];
                        /*
                       log(" [-- LWMenuItem ----------------------------------");
                       log(iter+" ("+mi.getLabel()+")  parent -->"+sParent);
                       log(iter+" "+sLevel+"label:["+mi.getLabel()+"]  ("+sName+"."+mi.getLabel()+")");
                       log(" --------------------------------------------------]");
                       */
                        // add menu option to the table
                        sLabelOpt = mi.getLabel().toLowerCase();
                        cOptMenu com =
                            new cOptMenu(mi.getLabel(), mi.getActionCommand(), (String)mi.getToolTipValue(), cpm.popMenu,
                                         mi, null);
                        hMenuOptions.put(sLabel + "." + sLabelOpt, com);
                        if (MenuOption != null) {
                            if (MenuOption.fFont != null)
                                mi.setFont(MenuOption.fFont);
                            if (MenuOption.cFore != null)
                                mi.setForeground(MenuOption.cFore);
                            if (MenuOption.cBack != null)
                                mi.setBackground(MenuOption.cBack);
                        }
                    } else {
                        // menu
                        oracle.ewt.lwAWT.lwMenu.LWMenu mi = (oracle.ewt.lwAWT.lwMenu.LWMenu)c[j];
                        sName += "." + mi.getLabel().toLowerCase();
                        scruteMenu(mi, iter + 1, sName);
                    }
                }
            }
            // menu option background
            for (int k = 0; k < c2.length; k++) {
                oracle.ewt.lwAWT.LWComponent mi2 = (oracle.ewt.lwAWT.LWComponent)c2[k];
                if (MenuOption != null)
                    if (MenuOption.cBack != null)
                        mi2.setBackground(MenuOption.cBack);
            }
        }
    }


    /*-----------------------------------------*
     *  Objects to handle elements properties  *
     *-----------------------------------------*/

    class cObj extends Object {
        Font fFont = null;
        Color cFore = null;
        Color cBack = null;

        cObj() {
        }

        cObj(Font fFont, Color cFore, Color cBack) {
            this.fFont = fFont;
            this.cFore = cFore;
            this.cBack = cBack;
        }
    }

    /*-------------------------
     *  Display a message box
     *------------------------*/

    public void DisplayMessage(String sTitle, String sText, int iX, int iY, int iWidth, int iHeight,
                               String sIconName) {

        String sReturn = "";
        String sTextF = sText.replace((char)10, '\n');
        JOptionPane jop = new JOptionPane();
        JTextArea jl = new JTextArea(sTextF);
        JScrollPane sa = new JScrollPane(jl);
        sa.setPreferredSize(new Dimension(iWidth, iHeight));
        sa.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
        sa.setBorder(null);
        jl.setLineWrap(true);
        jl.setWrapStyleWord(true);
        jl.setEditable(false);

        int icon = JOptionPane.QUESTION_MESSAGE;
        Icon iIcon = null;
        if (sIconName != null) {
            if (sIconName.equalsIgnoreCase("question"))
                icon = JOptionPane.QUESTION_MESSAGE;
            else if (sIconName.equalsIgnoreCase("information"))
                icon = JOptionPane.INFORMATION_MESSAGE;
            else if (sIconName.equalsIgnoreCase("warning"))
                icon = JOptionPane.WARNING_MESSAGE;
            else if (sIconName.equalsIgnoreCase("error"))
                icon = JOptionPane.ERROR_MESSAGE;
            else {
                Image img = ik.loadImage(sIconName);
                if (img != null)
                    iIcon = new ImageIcon(img);
            }
        }

        // dialog font
        if (fDialogFont != null) {
            jl.setFont(fDialogFont);
            sa.setFont(fDialogFont);
        }
        // dialog colors
        if (cDialogFore != null) {
            jl.setForeground(cDialogFore);
            sa.setForeground(cDialogFore);
        }

        if (cDialogBack != null) {
            jl.setBackground(cDialogBack);
            sa.setBackground(cDialogBack);
        }

        if (iIcon != null) {
            jop = new JOptionPane(new Object[] { sa }, JOptionPane.PLAIN_MESSAGE, JOptionPane.DEFAULT_OPTION, iIcon);
        } else {
            jop = new JOptionPane(new Object[] { sa }, icon, JOptionPane.DEFAULT_OPTION);
        }

        jop.setBackground(cDialogBack);
        jop.setForeground(cDialogFore);

        for (int i = 0; i < jop.getComponentCount(); i++) {
            Container cp = (Container)jop.getComponent(i);
            cp.setBackground(cDialogBack);
            for (int j = 0; j < cp.getComponentCount(); j++) {
                if (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JPanel")) {
                    JPanel jp = (JPanel)cp.getComponent(j);
                    jp.setOpaque(false);
                    jp.setBackground(cDialogBack);
                    for (int k = 0; k < jp.getComponentCount(); k++)
                        jp.getComponent(k).setBackground(cDialogBack);
                } else if (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JLabel")) {
                    JLabel jlb = (JLabel)cp.getComponent(j);
                    jlb.setBackground(cDialogBack);
                } else if ((cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JButton")) ||
                           (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.plaf.basic.BasicOptionPaneUI$ButtonFactory$ConstrainedButton"))) {
                    JButton jb = (JButton)cp.getComponent(j);
                    if (jb != null) {
                        jb.setForeground(cDialogFore.darker());
                        jb.setBackground(cDialogBack);
                        Font f = jb.getFont();
                        jb.setFont(f.deriveFont(Font.BOLD));
                    }
                } else
                    log(cp.getComponent(j).getClass().toString());
            }
        }

        JDialog dialog = jop.createDialog(this, sTitle);
        dialog.setBounds(iX, iY, iWidth, iHeight);
        // center to screen
        if (iX < 0 && iY < 0)
            dialog.setLocationRelativeTo(null);
        // center to Forms frame
        else if (iX == 0 && iY == 0)
            dialog.setLocationRelativeTo(formsTopFrame);
        // locate at exact position
        else
            dialog.setLocation(iX, iY);

        dialog.setVisible(true);
        Object selectedValue = jop.getValue();

    }

    /*------------------------------------------------
     *  Display an alert box
     *  the choices can be a list box (bList = true)
     *                     or buttons (bList = false)
     *----------------------------------------------*/

    public void DisplayAlert(boolean bList, String sTitle, String sText, int iX, int iY, int iWidth, int iHeight,
                             String sIconName, Object[] opts, int iDefault) {

        sAlertButton = "";
        JOptionPane jop = new JOptionPane();
        JTextArea jl = new JTextArea(sText);
        JScrollPane sa = new JScrollPane(jl);
        JComboBox combo = null;
        sa.setPreferredSize(new Dimension(iWidth, iHeight));
        sa.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
        sa.setBorder(null);
        jl.setLineWrap(true);
        jl.setWrapStyleWord(true);
        jl.setEditable(false);

        int icon = JOptionPane.QUESTION_MESSAGE;
        Icon iIcon = null;
        if (sIconName != null) {
            if (sIconName.equalsIgnoreCase("question"))
                icon = JOptionPane.QUESTION_MESSAGE;
            else if (sIconName.equalsIgnoreCase("information"))
                icon = JOptionPane.INFORMATION_MESSAGE;
            else if (sIconName.equalsIgnoreCase("warning"))
                icon = JOptionPane.WARNING_MESSAGE;
            else if (sIconName.equalsIgnoreCase("error"))
                icon = JOptionPane.ERROR_MESSAGE;
            else {
                Image img = ik.loadImage(sIconName);
                if (img != null)
                    iIcon = new ImageIcon(img);
            }
        }

        // dialog font
        if (fDialogFont != null) {
            jl.setFont(fDialogFont);
            sa.setFont(fDialogFont);
        }
        // dialog colors
        if (cDialogFore != null) {
            jl.setForeground(cDialogFore);
            sa.setForeground(cDialogFore);
        }

        if (cDialogBack != null) {
            jl.setBackground(cDialogBack);
            sa.setBackground(cDialogBack);
        }

        // adapt the JOptionPane properties
        Object[] objs = new Object[10];
        objs[0] = UIManager.get("OptionPane.background");
        objs[1] = UIManager.get("Panel.background");
        objs[2] = UIManager.get("ComboBox.background");
        objs[3] = UIManager.get("ComboBox.foreground");
        objs[4] = UIManager.get("ComboBox.selectionBackground");
        objs[5] = UIManager.get("ComboBox.selectionForeground");

        UIManager.put("OptionPane.background", cDialogBack);
        UIManager.put("Panel.background", cDialogBack);
        UIManager.put("ComboBox.selectionForeground", cDialogBack.brighter());
        UIManager.put("ComboBox.selectionBackground", cDialogBack.darker());

        if (bList) {
            combo = new JComboBox(opts);
            combo.setSelectedItem((String)opts[iDefault]); // valeur initiale
            jop = new JOptionPane(new Object[] { sa, combo }, icon, JOptionPane.OK_CANCEL_OPTION);
            if (iIcon != null)
                jop.setIcon(iIcon);
        } else {
            if (iIcon != null) {
                jop = new JOptionPane(new Object[] { sa }, JOptionPane.PLAIN_MESSAGE, JOptionPane.DEFAULT_OPTION, iIcon, opts,
                opts[iDefault]);
            } else {
                jop = new JOptionPane(new Object[] { sa }, icon, JOptionPane.DEFAULT_OPTION, null, opts, opts[iDefault]);
            }
        }
        jop.setBackground(cDialogBack);
        jop.setForeground(cDialogFore);

        //colorize components
        String s = null;

        for (int i = 0; i < jop.getComponentCount(); i++) {
            Container cp = (Container)jop.getComponent(i);
            cp.setBackground(cDialogBack);
            for (int j = 0; j < cp.getComponentCount(); j++) {
                if (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JPanel")) {
                    JPanel jp = (JPanel)cp.getComponent(j);
                    jp.setOpaque(false);
                    jp.setBackground(cDialogBack);
                    for (int k = 0; k < jp.getComponentCount(); k++)
                        jp.getComponent(k).setBackground(cDialogBack);
                } else if (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JLabel")) {
                    JLabel jlb = (JLabel)cp.getComponent(j);
                    jlb.setBackground(cDialogBack);
                } else if (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JButton")) {
                    JButton jb = (JButton)cp.getComponent(j);
                    jb.setForeground(cDialogFore);
                    jb.setBackground(cDialogBack);
                    s = jb.getText();
                    if (s.equalsIgnoreCase((String)opts[iDefault])) {
                        jb.requestFocus();
                        print("default button:" + jb.getText());
                    }
                    int ii = s.indexOf("&");
                    if (ii > -1) {
                        s = "" + s.charAt(ii + 1);
                        ii = (int)s.charAt(0);
                        jb.setText(jb.getText().replaceAll("&", ""));
                        jb.setMnemonic(ii);
                    }
                } else
                    log(cp.getComponent(j).getClass().toString());
            }
        }

        JDialog dialog = jop.createDialog(this, sTitle);
        dialog.setBounds(iX, iY, iWidth, iHeight);
        // center to screen
        if (iX < 0 && iY < 0)
            dialog.setLocationRelativeTo(null);
        // center to Forms frame
        else if (iX == 0 && iY == 0)
            dialog.setLocationRelativeTo(formsTopFrame);
        // locate at exact position
        else
            dialog.setLocation(iX, iY);

        // show the dialog
        dialog.setVisible(true);

        UIManager.put("OptionPane.background", objs[0]);
        UIManager.put("Panel.background", objs[1]);
        UIManager.put("ComboBox.background", objs[2]);
        UIManager.put("ComboBox.foreground", objs[3]);
        UIManager.put("ComboBox.selectionBackground", objs[4]);
        UIManager.put("ComboBox.selectionForeground", objs[5]);

        if (bList) {
            Object value = jop.getValue();
            if (value instanceof Integer && ((Integer)value).intValue() == JOptionPane.OK_OPTION) {
                sAlertButton = "" + (combo.getSelectedIndex() + 1); //combo.getSelectedItem();
            }
        } else {
            Object selectedValue = jop.getValue();
            //If there is an array of option buttons:
            if (selectedValue != null && opts != null) {
                for (int counter = 0, maxCounter = opts.length; counter < maxCounter; counter++) {
                    if (opts[counter].equals(selectedValue))
                        sAlertButton = "" + (counter + 1);
                }
            }
        }

        log("DisplayAlert() button cliqued:" + sAlertButton);

    }

    /*-------------------------------
     *  Display a Jtable dialog box
     *-------------------------------*/

    public String[][] DisplayTableDialog(String sTitle, String[] sTitles, String[][] sData, int iX, int iY, int iWidth,
                                         int iHeight, String sIconName) {

        String sReturn = "";
        JOptionPane jop = new JOptionPane();
        TableDialog td = new TableDialog(sTitles, sData, iWidth - 100, iHeight - 50);
        td.setPreferredSize(new Dimension(iWidth - 100, iHeight - 50));

        int icon = JOptionPane.QUESTION_MESSAGE;
        Icon iIcon = null;
        if (sIconName != null) {
            if (sIconName.equalsIgnoreCase("question"))
                icon = JOptionPane.QUESTION_MESSAGE;
            else if (sIconName.equalsIgnoreCase("information"))
                icon = JOptionPane.INFORMATION_MESSAGE;
            else if (sIconName.equalsIgnoreCase("warning"))
                icon = JOptionPane.WARNING_MESSAGE;
            else if (sIconName.equalsIgnoreCase("error"))
                icon = JOptionPane.ERROR_MESSAGE;
            else {
                Image img = ik.loadImage(sIconName);
                if (img != null)
                    iIcon = new ImageIcon(img);
            }
        }

        if (iIcon != null) {
            jop = new JOptionPane(new Object[] { td }, JOptionPane.PLAIN_MESSAGE, JOptionPane.DEFAULT_OPTION, iIcon);
        } else {
            jop = new JOptionPane(new Object[] { td }, icon, JOptionPane.DEFAULT_OPTION);
        }

        jop.setBackground(cDialogBack);
        jop.setForeground(cDialogFore);

        for (int i = 0; i < jop.getComponentCount(); i++) {
            Container cp = (Container)jop.getComponent(i);
            cp.setBackground(cDialogBack);
            for (int j = 0; j < cp.getComponentCount(); j++) {
                if (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JPanel")) {
                    JPanel jp = (JPanel)cp.getComponent(j);
                    jp.setOpaque(false);
                    jp.setBackground(cDialogBack);
                    for (int k = 0; k < jp.getComponentCount(); k++)
                        jp.getComponent(k).setBackground(cDialogBack);
                } else if (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JLabel")) {
                    JLabel jlb = (JLabel)cp.getComponent(j);
                    jlb.setBackground(cDialogBack);
                } else if ((cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JButton")) ||
                           (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.plaf.basic.BasicOptionPaneUI$ButtonFactory$ConstrainedButton"))) {
                    JButton jb = (JButton)cp.getComponent(j);
                    if (jb != null) {
                        jb.setForeground(cDialogFore.darker());
                        jb.setBackground(cDialogBack);
                        Font f = jb.getFont();
                        jb.setFont(f.deriveFont(Font.BOLD));
                    }
                } else
                    log(cp.getComponent(j).getClass().toString());
            }
        }

        JDialog dialog = jop.createDialog(this, sTitle);
        dialog.setBounds(iX, iY, iWidth, iHeight);
        // center to screen
        if (iX < 0 && iY < 0)
            dialog.setLocationRelativeTo(null);
        // center to Forms frame
        else if (iX == 0 && iY == 0)
            dialog.setLocationRelativeTo(formsTopFrame);
        // locate at exact position
        else
            dialog.setLocation(iX, iY);

        dialog.setVisible(true);
        Object selectedValue = jop.getValue();
        // get the JTable updated values
        JTable t = td.getTable();
        if (t.isEditing()) {
            t.getCellEditor().stopCellEditing();
        }
        String[][] result = new String[t.getModel().getRowCount()][sTitles.length];
        for (int i = 0; i < t.getModel().getRowCount(); i++) {
            for (int j = 0; j < sTitles.length; j++) {
                result[i][j] = (String)t.getModel().getValueAt(i, j);
            }
        }
        return result;
    }

    /*---------------------------------
     *   Display an input dialog box
     *--------------------------------*/

    public String ShowDialog(String sTitle, String sText, boolean bMulti, int iX, int iY, int iWidth, int iHeight,
                             String sIconName) {

        String sReturn = "";
        JOptionPane jop = null;
        final JTextArea textArea = new JTextArea("");
        final JTextField textField = new JTextField("");
        JScrollPane scrollArea = new JScrollPane(textArea);

        if (!bMulti) {
            Font f = textField.getFont();
            int height = 0;
            if (fDialogFont != null)
                f = fDialogFont;
            Rectangle2D rect = f.getStringBounds("gqtPQ", new FontRenderContext(new AffineTransform(), true, true));
            height = ((int)(rect.getHeight())) + 4 > iHeight ? ((int)(rect.getHeight())) + 4 : iHeight;
            textField.setPreferredSize(new Dimension(iWidth, height));
        }
        scrollArea.setPreferredSize(new Dimension(iWidth, iHeight));
        int icon = JOptionPane.QUESTION_MESSAGE;
        Icon iIcon = null;
        if (sIconName != null) {
            Image img = ik.loadImage(sIconName);
            if (img != null)
                iIcon = new ImageIcon(img);
        }

        // dialog font
        if (fDialogFont != null) {
            scrollArea.setFont(fDialogFont);
            textField.setFont(fDialogFont);
            textArea.setFont(fDialogFont);
        }
        // dialog colors
        if (cDialogFore != null) {
            scrollArea.setForeground(cDialogFore);
            textField.setForeground(cDialogFore);
            textArea.setForeground(cDialogFore);
        }
        if (cDialogBack != null) {
            scrollArea.setBackground(cDialogBack);
            scrollArea.getViewport().setBackground(cDialogBack);
        }
        else{
            scrollArea.setBackground(Color.white);
            scrollArea.getViewport().setBackground(Color.white);
        }
        if (iIcon != null) {
            if (bMulti)
                jop = new JOptionPane(new Object[] { sText, scrollArea }, JOptionPane.QUESTION_MESSAGE, JOptionPane.OK_CANCEL_OPTION, iIcon);
            else
                jop = new JOptionPane(new Object[] { sText, textField }, JOptionPane.QUESTION_MESSAGE, JOptionPane.OK_CANCEL_OPTION, iIcon);
        } else {
            if (bMulti)
                jop = new JOptionPane(new Object[] { sText, scrollArea }, JOptionPane.QUESTION_MESSAGE, JOptionPane.OK_CANCEL_OPTION);
            else
                jop = new JOptionPane(new Object[] { sText, textField }, JOptionPane.QUESTION_MESSAGE, JOptionPane.OK_CANCEL_OPTION);
        }

        jop.setBackground(cDialogBack);
        jop.setForeground(cDialogFore);

        for (int i = 0; i < jop.getComponentCount(); i++) {
            Container cp = (Container)jop.getComponent(i);
            cp.setBackground(cDialogBack);
            for (int j = 0; j < cp.getComponentCount(); j++) {
                if (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JPanel")) {
                    JPanel jp = (JPanel)cp.getComponent(j);
                    jp.setOpaque(false);
                    jp.setBackground(cDialogBack);
                    for (int k = 0; k < jp.getComponentCount(); k++)
                        jp.getComponent(k).setBackground(cDialogBack);
                }
                if (cp.getComponent(j).getClass().toString().equalsIgnoreCase("class javax.swing.JLabel")) {
                    JLabel jl = (JLabel)cp.getComponent(j);
                    jl.setBackground(cDialogBack);
                }
            }
        }

        JDialog dialog = jop.createDialog(this, sTitle);      

        // center to screen
        if (iX < 0 && iY < 0)
            dialog.setLocationRelativeTo(null);
        // center to Forms frame
        else if (iX == 0 && iY == 0)
            dialog.setLocationRelativeTo(formsTopFrame);
        // locate at exact position
        else
            dialog.setLocation(iX, iY);            

        if (bMulti) {
            SwingUtilities.invokeLater(new Runnable() {
                  public void run() {
                    textArea.dispatchEvent(
                      new FocusEvent(textArea, FocusEvent.FOCUS_GAINED));
                  }
                });
        }
        else{
            SwingUtilities.invokeLater(new Runnable() {
                  public void run() {
                    textField.dispatchEvent(
                      new FocusEvent(textField, FocusEvent.FOCUS_GAINED));
                  }
                });
            
        }

        dialog.pack();
        
        if (bMulti) {
            textArea.requestFocusInWindow();
        }
        else {
            textField.requestFocusInWindow();
        }       
        dialog.setVisible(true);

        Object selectedValue = jop.getValue();

        if(selectedValue != null){
            if (((Integer)selectedValue).intValue() != JOptionPane.CANCEL_OPTION) {
                if (bMulti)
                    sReturn = textArea.getText();
                else
                    sReturn = textField.getText();
            }
        }

        return sReturn;

    } // end ShowDialog()


    /*-----------------------------------
     *  Class to render the FrameBorder
     *----------------------------------*/

    class FrameBorderNew extends AbstractBorder {
        public void paintBorder(Component c, Graphics g, int x, int y, int width, int height) {
            // get the component values
            objFrame of = (objFrame)hFrames.get(c.getName());
            if (of == null)
                return;
            Graphics2D g2 = (Graphics2D)g;
            int textHeight = 0;
            int textWidth = 0;
            int iTextTop = 0;
            int iBaseLine = 0;
            int iTitleXPos = 1;
            int iTitleYPos = 1;
            int iSpace = 0;
            int iCurve = 20;
            int iGap = (of.iFrameWidth > 2) ? 10 + (of.iFrameWidth * 3) : 12;
            FontMetrics fm;
            Rectangle2D rect = new Rectangle(0, 0);
            String sTitle = of.sFrameTitle;
            if (sTitle.equalsIgnoreCase("")) {
                sTitle = null;
            } else {
                g2.setFont(of.fFrameFont);
                fm = g2.getFontMetrics(of.fFrameFont); // metrics for this object
                rect = fm.getStringBounds(sTitle, g2); // string size
                iTextTop = fm.getMaxAscent();
                iBaseLine = fm.getMaxDescent();
                textHeight = (int)(rect.getHeight());
                textWidth = (int)(rect.getWidth());
            }

            int fWidth = 1;
            if (of.iFrameWidth > 1)
                fWidth = (int)of.iFrameWidth / 2;
            int iWidth = width - of.iFrameWidth;
            int iHeight = height - of.iFrameWidth;
            int iDec = (textHeight / 2);
            int iTWidth = (int)textWidth / 2;

            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            Object rh = g2.getRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING);
            if (of.fFrameFont.getSize() >= 16)
                g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            // frame border bounds
            int fX = x + 1, fY = y + 1;
            if (of.iFrameWidth > 1) {
                fX += ((int)of.iFrameWidth / 2);
                fY += ((int)of.iFrameWidth / 2);
            }
            int fW = width - (int)((of.iFrameWidth * 2) + (of.iFrameWidth / 2));
            int fH = height - (int)((of.iFrameWidth * 2) + (of.iFrameWidth / 2));

            if (sTitle != null) {
                //
                // Title alignment
                // ------
                //   TOP
                // ------
                if (of.sFramePosition.equalsIgnoreCase("T")) {
                    fY += iDec;
                    fH = height - iDec - ((int)(of.iFrameWidth * 2) + (of.iFrameWidth / 2));
                    iX = (int)width / 2 - iTWidth;
                    iY = iDec + (int)iDec / 2 + (int)of.iFrameWidth - 2;
                }

                // ----------
                //   BOTTOM
                // ----------
                else if (of.sFramePosition.equalsIgnoreCase("B")) {
                    //fX=x; fY=y;
                    fH = height - iDec - ((int)(of.iFrameWidth * 1.5));
                    iX = (int)width / 2 - iTWidth;
                    iY = height - ((int)iDec / 2 + (int)(of.iFrameWidth * 1.5)) + iBaseLine;
                }

                // --------
                //   LEFT
                // --------
                else if (of.sFramePosition.equalsIgnoreCase("L")) {
                    fX = x + iDec;
                    fW = width - 1 - iDec - of.iFrameWidth;
                }

                // ---------
                //   RIGHT
                // ---------
                else if (of.sFramePosition.equalsIgnoreCase("R")) {
                    fW = width - 1 - iDec - of.iFrameWidth;
                }
            }

            // Motif to draw ?
            if (of.sMotif != null) {
                TexturePaint tp = (TexturePaint)hTextures.get(of.sMotif);
                if (tp != null) {
                    g2.setPaint(tp);
                    g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, of.fTransparency));
                    if (of.bRoundedFrame)
                        g2.fillRoundRect(fX, fY, fW - 1, fH - 1, 20, 20);
                    else
                        g2.fillRect(fX, fY, fW, fH);
                }
            }

            // ----------------
            // frame background
            // ----------------
            if (of.cFrameGradient1 != null || of.cFrameGradient2 != null) {
                // gradient background ?
                if (of.cFrameGradient2 != null) {
                    GradientPaint gp = null;

                    if (of.iFrameHcycle + of.iFrameVcycle > 0) {
                        gp =
 new GradientPaint(0, 0, of.cFrameGradient1, of.iFrameHcycle, of.iFrameVcycle, of.cFrameGradient2, true);
                    } else {
                        if (of.igrDir == FLeftToRight) {
                            gp = new GradientPaint(0, 0, of.cFrameGradient1, iWidth, iHeight, of.cFrameGradient2);
                        } else if (of.igrDir == FRightToLeft) {
                            gp = new GradientPaint(iWidth, iHeight, of.cFrameGradient1, 0, 0, of.cFrameGradient2);
                        } else if (of.igrDir == FUpToDown) // default
                        {
                            gp = new GradientPaint(2, iHeight / 2, of.cFrameGradient1, 2, iHeight, of.cFrameGradient2);
                        } else if (of.igrDir == FDownToUp) {
                            gp = new GradientPaint(0, iHeight, of.cFrameGradient1, 0, 0, of.cFrameGradient2);
                        }
                    }
                    g2.setPaint(gp);
                } else
                    g2.setColor(of.cFrameGradient1);


                g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, of.fTransparency));
                if (of.bRoundedFrame)
                    g2.fillRoundRect(fX, fY, fW - 1, fH - 1, 20, 20);
                else
                    g2.fillRect(fX, fY, fW, fH);
            }

            g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1f));

            // ----------------
            //   frame border
            // ----------------

            GeneralPath path = new GeneralPath();
            Shape sh;
            Shape sh2;

            // frame
            if (!of.bRoundedFrame)
                iCurve = 0;
            sh2 = sh = new RoundRectangle2D.Double(fX, fY, fW, fH, iCurve, iCurve);
            if (sTitle != null) {

                PathIterator pi = sh.getPathIterator(null);
                int iMax = 0;
                int iX1 = 0, iX2 = 0, iY1 = 0, iY2 = 0;
                int j = 0;
                float seg[] = new float[6];
                while (!pi.isDone()) {
                    int segType = pi.currentSegment(seg);
                    switch (segType) {
                    case PathIterator.SEG_MOVETO:
                        path.moveTo(seg[0], seg[1]);
                        break;
                    case PathIterator.SEG_LINETO:
                        j++;
                        if (j == 4 && of.sFramePosition.equalsIgnoreCase("T"))
                        //
                        // title on top
                        //
                        {
                            iMax = fW - (iGap * 2);
                            iSpace = textWidth + 12;
                            if (iSpace > iMax)
                                iSpace = iMax;
                            if (of.sFrameAligment.equalsIgnoreCase("L")) {
                                // left text alignment
                                iX1 = fX + iGap;
                                iX2 = iX1 + iSpace;
                            } else if (of.sFrameAligment.equalsIgnoreCase("C")) {
                                // center text alignment
                                iX1 = ((width / 2) - (iSpace / 2)) - of.iFrameWidth;
                                iX2 = iX1 + iSpace;
                            } else {
                                // right text alignment
                                iX1 = fX + width - iGap - iSpace;
                                iX2 = iX1 + iSpace;
                            }
                            iTitleXPos = iX1 + 6;
                            iTitleYPos = iY;
                            path.lineTo(iX2, seg[1]);
                            path.moveTo(iX1, seg[1]);
                            path.lineTo(seg[0], seg[1]);
                        } else if (j == 3 && of.sFramePosition.equalsIgnoreCase("R"))
                        //
                        // Title on right
                        //
                        {
                            iMax = fH - (iGap * 2);
                            iSpace = textWidth + 12;
                            if (iSpace > iMax)
                                iSpace = iMax;
                            iY1 = fY + iGap;
                            iY2 = iY1 + iSpace;
                            iTitleXPos = (int)seg[0];
                            iTitleYPos = iY1 + 6;
                            path.lineTo(seg[0], iY2);
                            path.moveTo(seg[0], iY1);
                            path.lineTo(seg[0], seg[1]);
                        } else if (j == 2 && of.sFramePosition.equalsIgnoreCase("B"))
                        //
                        // Title on bottom
                        //
                        {
                            iMax = fW - (iGap * 2);
                            iSpace = textWidth + 12;
                            if (iSpace > iMax)
                                iSpace = iMax;
                            if (of.sFrameAligment.equalsIgnoreCase("L")) {
                                // left text alignment
                                iX1 = fX + iGap;
                                iX2 = iX1 + iSpace;
                            } else if (of.sFrameAligment.equalsIgnoreCase("C")) {
                                // center text alignment
                                iX1 = ((width / 2) - (iSpace / 2)) - of.iFrameWidth;
                                iX2 = iX1 + iSpace;
                            } else {
                                // right text alignment
                                iX1 = fX + width - iGap - iSpace;
                                iX2 = iX1 + iSpace;
                            }
                            iTitleXPos = iX1 + 6;
                            iTitleYPos = iY;
                            path.lineTo(iX1, seg[1]);
                            path.moveTo(iX2, seg[1]);
                            path.lineTo(seg[0], seg[1]);
                        } else if (j == 1 && of.sFramePosition.equalsIgnoreCase("L"))
                        //
                        // Title on left
                        //
                        {
                            iMax = fH - (iGap * 2);
                            iSpace = textWidth + 12;
                            if (iSpace > iMax)
                                iSpace = iMax;
                            iY1 = fY + iGap;
                            iY2 = iY1 + iSpace;
                            iTitleXPos = (int)seg[0] + iBaseLine;
                            iTitleYPos = iY2 - 6;
                            path.lineTo(seg[0], iY1);
                            path.moveTo(seg[0], iY2);
                            path.lineTo(seg[0], seg[1]);
                        } else
                            path.lineTo(seg[0], seg[1]);
                        break;
                    case PathIterator.SEG_QUADTO:
                        path.quadTo(seg[0], seg[1], seg[2], seg[3]);
                        break;
                    case PathIterator.SEG_CUBICTO:
                        path.curveTo(seg[0], seg[1], seg[2], seg[3], seg[4], seg[5]);
                        break;
                    case PathIterator.SEG_CLOSE:
                        //path.closePath();
                        break;
                    }
                    pi.next();
                } // while
                sh2 = path;
            }
            g2.setStroke(new BasicStroke((float)of.iFrameWidth, BasicStroke.CAP_BUTT, BasicStroke.JOIN_BEVEL));
            AffineTransform aT = g2.getTransform();
            AffineTransform at = new AffineTransform();
            GradientPaint gp = null;
            // frame shadow
            if ((of.cFrameShadow != null) && (of.iFrameWidth > 1)) {
                int iShadow = 1;
                if (of.iFrameWidth > 2)
                    iShadow = (int)(of.iFrameWidth / 2) + 1;
                at.setToTranslation(iShadow, iShadow);
                g2.transform(at);
                if ((of.sFrameSColorStart != null && of.sFrameSColorEnd != null)) {
                    if (of.igrBorderDir == LeftToRight)
                        gp = new GradientPaint(fX, fY, of.sFrameSColorStart, fW, 0, of.sFrameSColorEnd);
                    else if (of.igrBorderDir == UpToDown)
                        gp = new GradientPaint(fX, fY, of.sFrameSColorStart, 0, fH, of.sFrameSColorEnd);
                    else if (of.igrBorderDir == LeftUpToRightDown)
                        gp = new GradientPaint(fX, fY, of.sFrameSColorStart, fW, fH, of.sFrameSColorEnd);
                    else if (of.igrBorderDir == LeftDownToRightUp)
                        gp = new GradientPaint(fX, fY + fH, of.sFrameSColorStart, fW, 0, of.sFrameSColorEnd);
                    g2.setPaint(gp);
                } else
                    g2.setColor(of.cFrameShadow);
                g2.draw(sh2);
                at.setToTranslation(-iShadow, -iShadow);
                g2.transform(at);
            }
            // frame
            if ((of.sFrameColorStart != null && of.sFrameColorEnd != null)) {
                if (of.igrBorderDir == LeftToRight)
                    gp = new GradientPaint(fX, fY, of.sFrameColorStart, fW, 0, of.sFrameColorEnd);
                else if (of.igrBorderDir == UpToDown)
                    gp = new GradientPaint(fX, fY, of.sFrameColorStart, 0, fH, of.sFrameColorEnd);
                else if (of.igrBorderDir == LeftUpToRightDown)
                    gp = new GradientPaint(fX, fY, of.sFrameColorStart, fW, fH, of.sFrameColorEnd);
                else if (of.igrBorderDir == LeftDownToRightUp)
                    gp = new GradientPaint(fX, fY + fH, of.sFrameColorStart, fW, 0, of.sFrameColorEnd);
                g2.setPaint(gp);
            } else
                g2.setColor(of.cFrameColor);
            g2.setPaint(gp);
            g2.draw(sh2);

            // draw bounding box
            if (bDrawFrameBounds) {
                g2.setStroke(new BasicStroke(2.0f));
                g2.setColor(of.cFrameColor);
                g2.drawRect(0, 0, width, height);
                g2.setStroke(new BasicStroke((float)of.iFrameWidth));
            }

            // ---------------
            //   frame title
            // ---------------
            if (sTitle != null) {

                //if(of.cFrameTitleBack == null)  g2.setColor(VB.getParent().getBackground()) ;
                //else g2.setColor(of.cFrameTitleBack);
                aT = g2.getTransform();
                at = new AffineTransform();
                at.setToTranslation(iTitleXPos, iTitleYPos);
                g2.transform(at);

                // text rotation
                if (of.sFramePosition.equalsIgnoreCase("L")) {
                    at.setToRotation(3 * (Math.PI / 2.0));
                    g2.transform(at);
                } else if (of.sFramePosition.equalsIgnoreCase("R")) {
                    at.setToRotation(-3 * (Math.PI / 2.0));
                    g2.transform(at);
                }

                // clipping area
                // be sure long title won't go out of the frame
                /* draw control clip area
             g2.setStroke(new BasicStroke(1.0f));
             g2.setColor(Color.black);
             g2.drawRect(-2,-(textHeight-iBaseLine),iSpace-10,textHeight+2);
             g2.setStroke(new BasicStroke((float)of.iFrameWidth));
             */
                g2.setClip(-2, -(textHeight - iBaseLine), iSpace - 10, textHeight + 2);

                // draw title shadow
                if (of.cFrameTitleBack != null) {
                    g2.setColor(of.cFrameTitleBack);
                    if (of.fFrameFont.getSize() > 14)
                        g2.drawString(sTitle, 2.0f, 2.0f);
                    g2.drawString(sTitle, 1.0f, 1.0f);
                }
                // draw title
                g2.setColor(of.cFrameTitleFore);
                g2.drawString(sTitle, 0.0f, 0.0f);
                g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, rh);
                g2.setTransform(aT);
                g2.dispose();
            }
        }

        public Insets getBorderInsets() {
            return new Insets(1, 1, 1, 1);
        }

    }


    /*--------------------------------------------*
     *   Object to handle the frame description   *
     *--------------------------------------------*/

    class objFrame extends Object {

        String sName = "";
        JComponent panel = null;
        int igrDir = gigrDir;
        Color cFrameColor = gcFrameColor;
        Color cFrameShadow = gcFrameShadow;
        // gradient frame
        Color sFrameColorStart = null;
        Color sFrameColorEnd = null;
        int igrBorderDir = FUpToDown;
        // gradient shadow
        Color sFrameSColorStart = null;
        Color sFrameSColorEnd = null;
        int igrSBorderDir = FUpToDown;
        Color cFrameTitleFore = gcFrameTitleFore;
        Color cFrameTitleBack = null; //gcFrameTitleBack;
        Color cFrameGradient1 = gcFrameGradient1;
        Color cFrameGradient2 = gcFrameGradient2;
        String sFrameTitle = "";
        String sFrameAligment = gsFrameAligment;
        String sFramePosition = gsFramePosition;
        String sMotif = null;
        int iFrameWidth = giFrameWidth;
        int iWFrame = 0;
        int iHFrame = 0;
        float fTransparency = gfFrameTransp;
        boolean bRoundedFrame = gbRoundedFrame;
        boolean bFrameTitleOpaque = gbFrameTitleOpaque;
        boolean bVisible = true;
        int x = -1, y = -1, w = -1, h = -1;
        int iFrameHcycle = 0, iFrameVcycle = 0;
        Font fFrameFont = gfFrameFont;

        objFrame(String sName, JComponent panel) {
            this.sName = sName;
            this.panel = panel;
        }

        private void setFrameTextAlign(String sPos, String sAlign) {
            this.sFramePosition = sPos;
            this.sFrameAligment = sAlign;
        }

        private void setFrameRounded(boolean b) {
            this.bRoundedFrame = b;
        }

        private void setFrameMotif(String s, float f) {
            this.sMotif = s;
            this.cFrameGradient1 = null;
            ;
            this.cFrameGradient2 = null;
            this.fTransparency = f;
        }

        private void setVisible(boolean b) {
            this.bVisible = b;
            this.panel.setVisible(b);
        }

        private void setFrameHCycle(int i) {
            this.iFrameHcycle = i;
        }

        private void setFrameVCycle(int i) {
            this.iFrameVcycle = i;
        }

        private void SetFrameGradOrient(int i) {
            this.igrDir = i;
        }

        private void SetFrameWidth(int i) {
            this.iFrameWidth = i;
        }

        private void setFrameTitle(String s) {
            this.sFrameTitle = s;
        }

        private void setFrameText(String sTitle, String sAlign) {
            this.sFrameTitle = sTitle;
            this.sFrameAligment = sAlign;
        }

        private void setBounds(int x, int y, int w, int h) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.panel.setBounds(x, y, w, h);
        }

        private void setFrameColors(Color c1, Color c2) {
            this.cFrameColor = c1;
            this.cFrameShadow = c2;
        }

        private void setFrameGradient(Color c1, Color c2) {
            if (c1 != null && c2 != null) {
                this.sFrameColorStart = c1;
                this.sFrameColorEnd = c2;
            }
        }

        private void setFrameGradientDir(int iDir) {
            igrBorderDir = iDir;
        }

        private void setFrameShadowGradient(Color c1, Color c2) {
            if (c1 != null && c2 != null) {
                this.sFrameSColorStart = c1;
                this.sFrameSColorEnd = c2;
            }
        }

        private void setFrameShadowGradientDir(int iDir) {
            igrSBorderDir = iDir;
        }

        private void setFrameBackground(Color c1, Color c2, float f) {
            this.cFrameGradient1 = c1;
            this.cFrameGradient2 = c2;
            this.fTransparency = f;
            this.sMotif = null;
        }

        private void setFrameTitleColors(Color c1, Color c2) {
            this.cFrameTitleFore = c1;
            if (c2 != null)
                this.cFrameTitleBack = c2;
        }

        private void setFrameFont(Font f) {
            this.fFrameFont = f;
        }
    }

    /*------------------------------------------*
     *   Object to handle the Tab description   *
     *------------------------------------------*/

    class objTab extends Object {

        String sName = null;
        Color cPrevTabForeColor = null;
        Color cPrevTabBackColor = null;
        Color cPrevTabSelForeColor = null;
        Color cPrevTabSelBackColor = null;
        Font fPrevTabFont = null;
        Color cTabForeColor = gcTabForeColor;
        Color cTabBackColor = gcTabBackColor;
        Color cTabSelForeColor = gcTabSelForeColor;
        Color cTabSelBackColor = gcTabSelBackColor;
        Font fTabFont = gfTabFont;
        String sTooltip = null;
        HashMap hTabItems = new HashMap();

        objTab(String sName) {
            this.sName = sName;
        }

        private void setInitialColors() {
            this.cTabForeColor = cPrevTabForeColor;
            this.cTabBackColor = cPrevTabBackColor;
            this.cTabSelForeColor = cPrevTabSelForeColor;
            this.cTabSelBackColor = cPrevTabSelBackColor;
            this.fTabFont = fPrevTabFont;
        }

        private void setTabColors(Color c1, Color c2) {
            this.cTabForeColor = c1;
            this.cTabBackColor = c2;
        }

        private void setTabSelColors(Color c1, Color c2) {
            this.cTabSelForeColor = c1;
            this.cTabSelBackColor = c2;
        }

        private void setTabFont(Font f) {
            this.fTabFont = f;
        }

        private void setTabTooltip(String s) {
            this.sTooltip = s;
        }

        private void setTabIcon(String sItem, String sIcon) {
            hTabItems.put(sItem, sIcon);
        }
    }


    /*----------------------------------*
     *   Object to handle the Windows   *
     *----------------------------------*/

    class objWin extends Object {

        oracle.forms.ui.ExtendedFrame ef = null;
        String sName = null;
        String sTitle = null;
        Color cWinForeColor = null;
        Color cWinBackColor = null;
        Color cTitleForeColor = null;
        Color cTitleBackColor = null;
        Font fFont = null;
        String sTooltip = null;
        String sIcon = null;

        objWin(oracle.forms.ui.ExtendedFrame ef, String sName, String sTitle) {
            this.ef = ef;
            this.sName = sName;
            this.sTitle = sTitle;
        }

        private void setWinColors(Color c1, Color c2) {
            this.cWinForeColor = c1;
            this.cWinBackColor = c2;
        }

        private void setTitleColors(Color c1, Color c2) {
            this.cTitleForeColor = c1;
            this.cTitleBackColor = c2;
        }

        private void setWinFont(Font f) {
            this.fFont = f;
        }

        private void setTabTooltip(String s) {
            this.sTooltip = s;
        }

        private void setWinIcon(String sIcon) {
            this.sIcon = sIcon;
        }
    }

    /*-----------------------------------------*
     *  Object to handle dynamic popup menus   *
     *-----------------------------------------*/

    class cPopMenu extends Object {
        String sPopName = "";
        LWMenu lMenu = null;
        LWPopupMenu popMenu = null;

        cPopMenu(String sPopName, LWMenu lMenu, LWPopupMenu popMenu) {
            this.sPopName = sPopName;
            this.lMenu = lMenu;
            this.popMenu = popMenu;
        }
    }

    /*------------------------------------------*
     *  Object to handle dynamic option menus   *
     *------------------------------------------*/

    class cOptMenu extends Object {
        String sLabel = null;
        String sCmd = null;
        String sToolTip = null;
        LWMenuItem mi = null;
        LWPopupMenu popMenu = null;
        cPopMenu popup = null;

        cOptMenu(String sLabel, String sCmd, String sToolTip, LWPopupMenu popMenu, LWMenuItem mi, cPopMenu pop) {
            this.sLabel = sLabel;
            this.sCmd = sCmd;
            this.popMenu = popMenu;
            this.popup = pop;
            this.mi = mi;
            if (sToolTip != null && !sToolTip.equalsIgnoreCase("-"))
                this.sToolTip = sToolTip;
        }
    }


    /*-----------------------------------*
     *  Object to handle image spiners   *
     *-----------------------------------*/

    class cSpinner extends Object {
        String sName = null;
        ImageSpinner spin = null;

        cSpinner(String name) {
            this.sName = name;
            this.spin = new ImageSpinner(name, (DrawLAF)VB, VB.getParent().getBackground());
            VB.getParent().add(spin, 0);
        }
    }
    

    /*-----------------------------------*
     *  Object to handle dynamic tables  *
     *-----------------------------------*/
    class cDynTable extends Object {
        String sName = null;
        DynTable tb = null;

        cDynTable(String name) {
            this.sName = name;
            this.tb = new DynTable();
            if(null != tb) {
                tb.init(name, (DrawLAF)VB);
                VB.getParent().add(tb, 0);
            }
        }
        
        void setVisible(boolean b){
            if(null != tb){
                tb.setVisible(b);
            }
        }
    }
    

    /*--------------------------------------
     *  colorize the windows caption bars
     *-------------------------------------*/

    void getWindowComponent(Container ct) {
        String sClassName = "";
        for (int i = 0; i < ct.getComponentCount(); i++) {
            sClassName = ct.getComponent(i).getClass().toString();
            // Window caption
            if (sClassName.equalsIgnoreCase("class oracle.ewt.lwAWT.lwWindow.laf.TitleBar")) {
                oracle.ewt.lwAWT.lwWindow.laf.TitleBar ta = (oracle.ewt.lwAWT.lwWindow.laf.TitleBar)ct.getComponent(i);
                if (Window != null && Window.cBack != null)
                    ta.setBackground(Window.cBack);

                oracle.forms.ui.ExtendedFrame ef = (oracle.forms.ui.ExtendedFrame)ta.getParent();
                String sTitle = ef.getTitle();
                objWin obw = (objWin)hWindows.get(sTitle);
                if (obw != null) {
                    if (Window != null && Window.fFont != null)
                        obw.setWinFont(Window.fFont);
                    if (Window != null)
                        obw.setTitleColors(Window.cFore, Window.cBack);
                    hWindows.put(sTitle, obw);
                }

                if (Window != null) {
                    if (Window.fFont != null)
                        ta.setFont(Window.fFont);
                    // get the sub-components
                    Component cpw[] = ta.getComponents();

                    for (int z = 0; z < cpw.length; z++) {
                        if (cpw[z].getClass().toString().equalsIgnoreCase("class oracle.ewt.lwAWT.LWComponent")) {
                            oracle.ewt.lwAWT.LWComponent lwc = (oracle.ewt.lwAWT.LWComponent)cpw[z];
                            Component cpw2[] = lwc.getComponents();
                            // get the title label
                            for (int x = 0; x < cpw2.length; x++) {
                                if (cpw2[x].getClass().toString().equalsIgnoreCase("class oracle.ewt.lwAWT.LWLabel")) {
                                    oracle.ewt.lwAWT.LWLabel lb = (oracle.ewt.lwAWT.LWLabel)cpw2[x];
                                    if (Window.fFont != null)
                                        lb.setFont(Window.fFont);
                                    if (Window.cBack != null)
                                        lb.setBackground(Window.cBack);
                                    if (Window.cFore != null)
                                        lb.setForeground(Window.cFore);
                                    break;
                                }
                            }
                            if (Window.cBack != null)
                                lwc.setBackground(Window.cBack);
                        } else if (cpw[z].getClass().toString().equalsIgnoreCase("class oracle.ewt.toolBar.ToolBar")) {
                            oracle.ewt.toolBar.ToolBar tb = (oracle.ewt.toolBar.ToolBar)cpw[z];
                            if (Window.cBack != null)
                                tb.setBackground(Window.cBack);
                        } else if (cpw[z].getClass().toString().equalsIgnoreCase("class oracle.ewt.lwAWT.lwWindow.laf.TitleBar")) {
                            oracle.ewt.lwAWT.lwWindow.laf.TitleBar tb = (oracle.ewt.lwAWT.lwWindow.laf.TitleBar)cpw[z];
                            if (Window.cBack != null)
                                tb.setBackground(Window.cBack);
                        }
                    }
                }
            }

        }
    }

    /*-----------------------------*
    *  creation of TexturePaint   *
    *-----------------------------*/

    TexturePaint createTexturePaint(String pname, int w, int h, Color c1, Color c2, Color c3, String sPoints) {
        String s = null;
        int i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0;
        int iStop = -1;
        TexturePaint tp = null;
        BufferedImage bi = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gi = bi.createGraphics();
        if (c1 != null) {
            gi.setBackground(c1);
            gi.clearRect(0, 0, w, h);
        }
        else{
            gi.setComposite(AlphaComposite.Clear);
            gi.fillRect(0, 0, w, h);           
            gi.setComposite(AlphaComposite.Src);
        }        
        GeneralPath gp = new GeneralPath();
        StringTokenizer st = new StringTokenizer(sPoints, ".");
        try {
            while (st.hasMoreTokens()) {
                s = st.nextToken().toLowerCase();
                // moveTo
                if (s.startsWith("m")) {
                    iStop = s.indexOf("-");
                    if (iStop > -1) {
                        i1 = Integer.parseInt(s.substring(1, iStop));
                        i2 = Integer.parseInt(s.substring(iStop + 1));
                        log("TexturePaint() moveto: i1=" + i1 + "  i2=" + i2);
                    }
                    gp.moveTo(i1, i2);
                }
                // lineTo
                else if (s.startsWith("l")) {
                    iStop = s.indexOf("-");
                    if (iStop > -1) {
                        i1 = Integer.parseInt(s.substring(1, iStop));
                        i2 = Integer.parseInt(s.substring(iStop + 1));
                        log("TexturePaint() lineto: i1=" + i1 + "  i2=" + i2);
                    }
                    gp.lineTo(i1, i2);
                }
                // quadTo
                else if (s.startsWith("q")) {
                    StringTokenizer st2 = new StringTokenizer(s, "-");
                    if (st2.hasMoreTokens())
                        i1 = Integer.parseInt(st2.nextToken().substring(1));
                    if (st2.hasMoreTokens())
                        i2 = Integer.parseInt(st2.nextToken());
                    if (st2.hasMoreTokens())
                        i3 = Integer.parseInt(st2.nextToken());
                    if (st2.hasMoreTokens())
                        i4 = Integer.parseInt(st2.nextToken());
                    gp.quadTo(i1, i2, i3, i4);
                }
                // curveTo
                else if (s.startsWith("c")) {
                    StringTokenizer st2 = new StringTokenizer(s, "-");
                    if (st2.hasMoreTokens())
                        i1 = Integer.parseInt(st2.nextToken().substring(1));
                    if (st2.hasMoreTokens())
                        i2 = Integer.parseInt(st2.nextToken());
                    if (st2.hasMoreTokens())
                        i3 = Integer.parseInt(st2.nextToken());
                    if (st2.hasMoreTokens())
                        i4 = Integer.parseInt(st2.nextToken());
                    if (st2.hasMoreTokens())
                        i5 = Integer.parseInt(st2.nextToken());
                    if (st2.hasMoreTokens())
                        i6 = Integer.parseInt(st2.nextToken());
                    gp.curveTo(i1, i2, i3, i4, i5, i6);
                }
                // close path
                else if (s.startsWith("z")) {
                    gp.closePath();
                }
            }
        } catch (Exception ex) {
            print("DrawLAF() TexturePaint() creation failure:" + pname);
        }

        // shape fill
        if (c3 != null) {
            gi.setColor(c3);
            gi.fill(gp);
        }

        // shape line
        if (c2 != null) {
            gi.setColor(c2);
            gi.draw(gp);
        }

        tp = new TexturePaint(bi, new Rectangle(0, 0, w, h));
        return tp;
    }


    /*-----------------------------*
     *  creation of TexturePaint   *
     *  with pixel shema           *
     *-----------------------------*/

    TexturePaint createPixelTexturePaint(String pname, int w, int h, String sPoints) {
        String s = null;
        int iPix = 0;
        int iStop = -1;
        TexturePaint tp = null;
        BufferedImage bi = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D gi = bi.createGraphics();
        int i = 0, j = 0;
        StringTokenizer st = new StringTokenizer(sPoints, ".");
        try {
            while (st.hasMoreTokens()) {
                s = st.nextToken();
                iPix = Integer.parseInt(s, 16);
                log("setRgb(" + i + "," + j + "," + iPix + ")");
                bi.setRGB(i, j, iPix);
                j++;
                if (j == w) {
                    j = 0;
                    i++;
                }
            }
        } catch (Exception ex) {
            print("DrawLAF() PixelTexturePaint() creation failure:" + pname);
        }

        tp = new TexturePaint(bi, new Rectangle(0, 0, w, h));
        return tp;
    }

    /*-----------------------------*
     *  creation of TexturePaint   *
     *  with image                 *
     *-----------------------------*/

    TexturePaint createImageTexturePaint(String sImage) {
        log("DrawLAF createPixelTexturePaint() - image:" + sImage);
        Image img = ik.loadImage(sImage);
        TexturePaint tp = null;
        if (img != null) {
            BufferedImage bi = toBufferedImage(img);
            Rectangle2D tr = new Rectangle2D.Double(0, 0, bi.getWidth(), bi.getHeight());
            tp = new TexturePaint(bi, tr);
        }

        return tp;
    }

    /*-----------------------------*
     *  creation of BufferedImage  *
     *-----------------------------*/

    public static BufferedImage toBufferedImage(Image image) {
        if (image instanceof BufferedImage) {
            return (BufferedImage)image;
        }

        boolean hasAlpha = false;
        // This code ensures that all the pixels in the image are loaded
        image = new ImageIcon(image).getImage();

        try {
            hasAlpha = hasAlpha(image);
        } catch (Exception e) {
        }

        // Create a buffered image with a format that's compatible with the screen
        BufferedImage bimage = null;
        GraphicsEnvironment ge = GraphicsEnvironment.getLocalGraphicsEnvironment();
        try {
            // Determine the type of transparency of the new buffered image
            int transparency = Transparency.OPAQUE;
            if (hasAlpha) {
                transparency = Transparency.BITMASK;
            }

            // Create the buffered image
            GraphicsDevice gs = ge.getDefaultScreenDevice();
            GraphicsConfiguration gc = gs.getDefaultConfiguration();
            bimage = gc.createCompatibleImage(image.getWidth(null), image.getHeight(null), transparency);
        } catch (HeadlessException e) {
            // The system does not have a screen
        }

        if (bimage == null) {
            // Create a buffered image using the default color model
            int type = BufferedImage.TYPE_INT_RGB;
            if (hasAlpha) {
                type = BufferedImage.TYPE_INT_ARGB;
            }
            bimage = new BufferedImage(image.getWidth(null), image.getHeight(null), type);
        }

        // Copy image to buffered image
        Graphics g = bimage.createGraphics();

        // Paint the image onto the buffered image
        g.drawImage(image, 0, 0, null);
        g.dispose();

        return bimage;
    }

    /*----------------------------------------------------------------------------*
     *   This method returns true if the specified image has transparent pixels   *
     *----------------------------------------------------------------------------*/

    public static boolean hasAlpha(Image image) {
        // If buffered image, the color model is readily available
        if (image instanceof BufferedImage) {
            BufferedImage bimage = (BufferedImage)image;
            return bimage.getColorModel().hasAlpha();
        }

        // Use a pixel grabber to retrieve the image's color model;
        // grabbing a single pixel is usually sufficient
        PixelGrabber pg = new PixelGrabber(image, 0, 0, 1, 1, false);
        try {
            pg.grabPixels();
        } catch (InterruptedException e) {
        }

        // Get the image's color model
        ColorModel cm = pg.getColorModel();
        return cm.hasAlpha();
    }


    /*--------------------------------*
     *   Component to show the frame  *
     *--------------------------------*/

    class myPanel extends JComponent {
        public myPanel() {
        }


        public void update(Graphics g) {
            paint(g);
        }

    }


    /*---------------------------------------------*
     *                                             *
     *     Tom Cleymans DispatchingBean feature    *
     *                                             *
     *---------------------------------------------*/
    public void dispatchanevent(oracle.forms.properties.ID pID1, List l) {
        // this is the method that will dispatch the customEvent to forms
        Messages msg = null;
        try {
            CustomEvent ce = new CustomEvent(m_handler, pID1);
            //print(CLASSNAME+" DispatchingBean -> size:"+l.size());
            for (int i = 0; i < l.size(); i++) {
                msg = (Messages)l.get(i);
                if (msg != null) {
                    m_handler.setProperty(msg.Id, msg.sValue);
                }
            }
            dispatchCustomEvent(ce);
        } catch (Exception e) {
            print(CLASSNAME + " DispatchingBean -> exception while dispatching: " + e);
            print(CLASSNAME + " DispatchingBean -> m_handler: " + m_handler);
            print(CLASSNAME + " DispatchingBean -> pID1: " + pID1);
            for (int i = 0; i < l.size(); i++) {
                msg = (Messages)l.get(i);
                print(CLASSNAME + " DispatchingBean -> pID2: " + msg.Id);
                print(CLASSNAME + " DispatchingBean -> pVal: " + msg.sValue);
            }
            print(CLASSNAME + " DispatchingBean -> stack: ");
            e.printStackTrace();
        }
    }


    public void dispatchanevent(oracle.forms.properties.ID pID1, oracle.forms.properties.ID pID2, String value) {
        // this is the method that will dispatch the customEvent to forms
        try {
            CustomEvent ce = new CustomEvent(m_handler, pID1);
            m_handler.setProperty(pID2, value);
            dispatchCustomEvent(ce);
        } catch (Exception e) {
            print("DispatchingBean -> exception while dispatching: " + e);
            print("DispatchingBean -> m_handler: " + m_handler);
            print("DispatchingBean -> pID1: " + pID1);
            print("DispatchingBean -> pID2: " + pID2);
            print("DispatchingBean -> stack: ");
            e.printStackTrace();
        }
    }

    protected void walkFindPJC(Component component, int iter) {

        if (component.getClass().getName().equals("oracle.forms.fd.LAF_XP_TextField")) {
            oracle.forms.fd.LAF_XP_TextField DPJC = (oracle.forms.fd.LAF_XP_TextField)component;
            if (DPJC.getLAFBean() == null) {
                DPJC.setName(CLASSNAME + "." + DPJC.getName());
                DPJC.setLAFBean(this);
            }
        } else if (component.getClass().getName().equals("oracle.forms.fd.LAF_XP_TextArea")) {
            oracle.forms.fd.LAF_XP_TextArea DPJC = (oracle.forms.fd.LAF_XP_TextArea)component;
            if (DPJC.getLAFBean() == null) {
                DPJC.setName(CLASSNAME + "." + DPJC.getName());
                DPJC.setLAFBean(this);
            }
        } else if (component.getClass().getName().equals("oracle.forms.fd.LAF_XP_Button")) {
            oracle.forms.fd.LAF_XP_Button DPJC = (oracle.forms.fd.LAF_XP_Button)component;
            if (DPJC.getLAFBean() == null) {
                DPJC.setName(CLASSNAME + "." + DPJC.getName());
                DPJC.setLAFBean(this);
            }
        } else if (component.getClass().getName().equals("oracle.forms.fd.LAF_XP_TList")) {
            oracle.forms.fd.LAF_XP_TList DPJC = (oracle.forms.fd.LAF_XP_TList)component;
            if (DPJC.getLAFBean() == null) {
                DPJC.setName(CLASSNAME + "." + DPJC.getName());
                DPJC.setLAFBean(this);
            }
        } else if (component.getClass().getName().equals("oracle.forms.fd.LAF_XP_PopList")) {
            oracle.forms.fd.LAF_XP_PopList DPJC = (oracle.forms.fd.LAF_XP_PopList)component;
            if (DPJC.getLAFBean() == null) {
                DPJC.setName(CLASSNAME + "." + DPJC.getName());
                DPJC.setLAFBean(this);
            }
        } else if (component.getClass().getName().equals("oracle.forms.fd.LAF_XP_CBox")) {
            oracle.forms.fd.LAF_XP_CBox DPJC = (oracle.forms.fd.LAF_XP_CBox)component;
            if (DPJC.getLAFBean() == null) {
                DPJC.setName(CLASSNAME + "." + DPJC.getName());
                DPJC.setLAFBean(this);
            }
        } else if (component.getClass().getName().equals("oracle.forms.fd.LAF_XP_RadioButton")) {
            oracle.forms.fd.LAF_XP_RadioButton DPJC = (oracle.forms.fd.LAF_XP_RadioButton)component;
            if (DPJC.getLAFBean() == null) {
                DPJC.setName(CLASSNAME + "." + DPJC.getName());
                DPJC.setLAFBean(this);
            }
        }
        if (component instanceof Container) {
            Component components[] = ((Container)component).getComponents();
            iter++;
            for (int i = 0; i < components.length; i++) {
                if (components[i] != null) {
                    walkFindPJC(components[i], iter);
                }
            }
        }
    }

    /*
     * get the local machine printer list
     */

    String getPrinterList() {
        StringBuffer sb = new StringBuffer();
        PrintService[] printServices = PrintServiceLookup.lookupPrintServices(null, null);

        for (int i = 0; i < printServices.length; i++) {
            if (i > 0)
                sb.append("|");
            sb.append(printServices[i].getName());
        }
        return sb.toString();
    }

    /*
     * get the local machine default printer
     */

    String getDefaultPrinter() {
        return PrintServiceLookup.lookupDefaultPrintService().getName();
    }

    // internal function to find a token

    boolean split(String s, int iStart, int iEnd, String sRech) {
        boolean b = false;
        try {
            if (s.substring(iStart, iEnd).equalsIgnoreCase(sRech)) {
                b = true;
            }
        } catch (Exception ex) {
            b = false;
        }
        return b;
    }

    /*-------------------------------------
     *  Canvas listener to trace resizing
     *------------------------------------*/
    AnyEventListener ael = new AnyEventListener() {
        public void actionPerformed(ActionEvent actionEvent) {
            String keyText = actionEvent.getActionCommand();
        }

        public void processEventStart(java.util.EventObject eo) {
            String keyText = eo.toString();
            //print("listener:"+keyText);
            if (keyText.indexOf("COMPONENT_RESIZED") > -1) {
                /*
          print("Component Resized"+eo.getSource());
          print("Window size:"+winCurrent.getBounds());
          print("Canvas size:"+canvas.getBounds());
          */
                jp.setBounds(canvas.getBounds());
                //jp.setBounds(winCurrent.getBounds());
                jp.repaint();
                VB.repaint();
            }
        }

        public void processEventEnd(java.util.EventObject eo) {
            String keyText = eo.toString();
        }
    };


    /*-----------------------------------*
     *  get and print the system memory
     *-----------------------------------*/

    void getMemory(String sText) {
        int i;
        lTotalMemory = Runtime.getRuntime().totalMemory();
        lFreeMemory = Runtime.getRuntime().freeMemory();
        lUsedMemory = lTotalMemory - lFreeMemory;

        print("*---------- L&F Java memory report " + sText + " ----------*");
        print("*---------- " + CLASSNAME);
        print("  total: " + lTotalMemory + "  used: " + lUsedMemory + "   free:" + lFreeMemory);
        /*
          print("  total memory\t" + lTotalMemory);
          print("  used memory\t"  + lUsedMemory);
          print("  free memory\t"  + lFreeMemory);
          */
    }

    /*
     *  internal function to invoke methods
     */

    void InvokeMethod(Object obj, String sMethodName, Object[] param) {
        log("InvokeMethod():" + obj + "  " + sMethodName + " (" + param[0] + ")");
        try {
            Method mt[] = obj.getClass().getMethods();
            Method method = null;
            for (int i = 0; i < mt.length; i++) {
                if (mt[i].getName().equalsIgnoreCase("setalwaysontop")) {
                    method = mt[i];
                    method.invoke(obj, param);
                    break;
                }
            }
        } catch (java.lang.reflect.InvocationTargetException e) {
            e.printStackTrace();
        } catch (java.lang.IllegalAccessException e) {
            e.printStackTrace();
        }
    }

    //
    // execute the database procedure/function
    //

    private String SQLExec(Connection conn, String s, boolean b, int iPos) throws SQLException {
        String sValue = "";
        String sError = "";
        log(" ** DB SQLExec query=" + s);
        try {
            if (!b) {
                // call a procedure
                CallableStatement procedure = conn.prepareCall(s);
                procedure.execute();
                procedure.close();
                sValue = "OK";
            } else {
                // call a function
                CallableStatement function = conn.prepareCall(s);
                function.registerOutParameter(1, Types.CHAR);
                function.execute();
                sValue = function.getString(1);
                function.close();
            }
        }

        catch (SQLException ex) {
            bRunning[iPos] = false;
            conn.rollback();
            sError = "SQLExec exception: " + ex.getMessage();
            print("LAF JDBC Connection error: " + sError);
            sDBError[iPos] = sError;
        }

        return (sValue);
    }

    // connect the DB vith JDBC
    // and execute the statement

    public void connectDBandExecute(int iNum) {
        sDBResult[iNum] = "";
        log("** DB connect " + iNum + " **");
        if (sDBConn.equals("") || sDBUser.equals("") || sDBPwd.equals("")) {
            sDBError[iNum] = "Connection string, username and password must be set";
            bRunning[iNum] = false;
            return;
        }
        try {
            DriverManager.registerDriver(new oracle.jdbc.driver.OracleDriver());
            log("** registerDriver OK **");
            DBconn[iNum] = DriverManager.getConnection(sDBConn, sDBUser, sDBPwd);
            DBconn[iNum].setAutoCommit(false);
            log("** connect OK **  AutoCommit:" + DBconn[iNum].getAutoCommit());

            // execute the stored procedure/function
            sDBResult[iNum] = SQLExec(DBconn[iNum], sDBQuery[iNum], bFunction[iNum], iNum);
            log("sResult=" + sDBResult[iNum]);

            // close the connection
            try {
                DBconn[iNum].close();
                log("** close OK **");
            } catch (SQLException ex) {
                print("LAF JDBC Connection conn.close() exception: " + ex.getMessage());
                bRunning[iNum] = false;
                ex.printStackTrace();
            }
        } catch (SQLException ex) {
            bRunning[iNum] = false;
            print("LAF JDBC connectDB() exception: " + ex.getMessage());
            sDBError[iNum] = "connectDB() exception: " + ex.getMessage();
        } finally {
            log("** connect End **");
        }
    }

    private String getTime() {
        DateFormat dateFormat = new SimpleDateFormat("HH:mm:ss");
        java.util.Date date = new java.util.Date();
        return dateFormat.format(date);
    }
    
    // MLT-7702 03/12/2025 // removed qt related methods.
    // read a movie with QuickTime
    
    // convert milliseconds to time string
    private String millisecToHour(long time){
        String ret = "";
        String seconds = Integer.toString((int)((time/1000) % 60));  
        String minutes = Integer.toString((int)(((time/1000) % 3600) / 60));  
        String hours = Integer.toString((int)((time/1000) / 3600));  
        for (int i = 0; i < 2; i++) {  
            if (seconds.length() < 2) {  
                seconds = "0" + seconds;  
            }  
            if (minutes.length() < 2) {  
                minutes = "0" + minutes;  
            }  
            if (hours.length() < 2) {  
                hours = "0" + hours;  
            }  
        } 
        if(!hours.equals("00")){
            ret =  ""+hours+":"+minutes+":"+seconds ;
        }
        else{
            ret =  ""+minutes+":"+seconds ;
        }
        return ret;
    }
    
    protected oracle.ewt.swing.JBufferedFrame getWinMDI(){
        return winMDI;
    }
    
    protected oracle.forms.ui.ExtendedFrame getWindow(){
        return winCurrent;
    }    
    
    private void log(String sMessage) {
        if (bLog)
            print(CLASSNAME + ": " + sMessage);
    }
    
    private void log_table(String sMessage) {
        if (bLogTable)
            System.out.println(CLASSNAME + ": " + sMessage);
    }    

    private void logPaint(String sMessage) {
        if (bLogPaint)
            print(CLASSNAME + ": " + sMessage);
    }

    private void print(String sMessage) {
        System.out.println(" ! " + CLASSNAME + ": " + sMessage);
    }

    private void printHeader(){
        if(!bHeaderPrint){
            print("***\t\t\t\t***");
            print("***\tLook and Feel Project v" + VERSION + "\t***");
            print("***\t\t\t\t***");
            bHeaderPrint = true;
        }
    }
}
