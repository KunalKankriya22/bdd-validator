package oracle.forms.fd;

import java.awt.Component;
import java.awt.Dimension;
import java.awt.Image;

import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;

import java.io.File;
import java.io.IOException;

import java.util.Enumeration;
import java.util.Hashtable;

import javax.swing.ImageIcon;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.filechooser.FileFilter;


/**
 * A javabean to display an Open-dialog bow with image preview
 *
 * @version 1.0
 * @date    20-oct-2005
 * @author  Francois Degrelle
 */

public class GetImageFileName extends Component
{

  public String string = "" ;
  
  public GetImageFileName()
  {
    super();
  }

  /**
   * method to display the OpenFile dialog.
   *
   * @param  the title for the dialog
   * @param  the starting directory
   * @return the selected file name (or null)
   */
  public String GetFile(String dialogTitle, String startDirectory)
  {
    String sFileName = "" ;
    Filters.setTitle( dialogTitle ) ;
    Filters.setDir( startDirectory ) ;
    sFileName = Filters.Start() ;
    return sFileName ;
  }
  
  public void setString(String s)
  {
    string = s ;
    System.out.println("s="+string);
  }
  
  public String getString()
  {
    return string ;
  }
  
  
  public void SetLAF(String s)
  {
    if(s.equalsIgnoreCase("SYSTEM"))
    {
    try
    {
      //System.out.println(UIManager.getLookAndFeelDefaults());
      UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
      SwingUtilities.updateComponentTreeUI(this);
    }
    catch (Exception ex)
    {
      ex.printStackTrace();
    }      
    }
    else
    {
    try
    {
      //System.out.println(UIManager.getLookAndFeelDefaults());
      UIManager.setLookAndFeel(UIManager.getCrossPlatformLookAndFeelClassName());
      SwingUtilities.updateComponentTreeUI(this);
    }
    catch (Exception ex)
    {
      ex.printStackTrace();
    }      
    }
  }

}

/**
 * class that handle the JFileChooser
 */
class Filters extends JLabel implements PropertyChangeListener {
     private static final int ICON_WIDTH  = 150;
     private static final int ICON_HEIGHT = 150;
     private static String fileName = "" ;
     private static String sTitle   = "" ;     
     private static String startDir = "." ;
     private static String sFilters = "" ;

     // Set the dialog box title
     public static void setTitle( String title ) 
     {
       sTitle = title ;
       //System.out.println("**** sTitle="+sTitle);
     }

     // Set the start directory
     public static void setDir( String directory ) 
     {
       startDir = directory ;
       //System.out.println("**** startdir="+startDir);
     }
     
     // Add the image previewer to the dialog box
     public Filters(JFileChooser chooser) {
       setVerticalAlignment(JLabel.CENTER);
       setHorizontalAlignment(JLabel.CENTER);
       chooser.addPropertyChangeListener(this);
       setPreferredSize(new Dimension (ICON_WIDTH, ICON_HEIGHT));
     }   
     public void propertyChange(
       PropertyChangeEvent changeEvent) {
        String changeName = changeEvent.getPropertyName();
        if (changeName.equals
            (JFileChooser.SELECTED_FILE_CHANGED_PROPERTY)) {
                File file = (File)changeEvent.getNewValue();
                if (file != null) {
                        ImageIcon icon = new ImageIcon(file.getPath());
                if (icon.getIconWidth() > ICON_WIDTH) {
                        icon = new ImageIcon(
                        icon.getImage().getScaledInstance(ICON_WIDTH, -1, Image.SCALE_DEFAULT));
                if (icon.getIconHeight() > ICON_HEIGHT) {
                        icon = new ImageIcon(
                        icon.getImage().getScaledInstance(-1, ICON_HEIGHT, Image.SCALE_DEFAULT));
                }
          }
          setIcon(icon);
         }
       }
     }
     
     public static String Start() {
          
           fileName = "" ;
           JFileChooser fileChooser = new JFileChooser(startDir);
           LabelAccessory accessory = new LabelAccessory(fileChooser);
           fileChooser.setDialogTitle(sTitle);
           fileChooser.setLocation(50,50);
           fileChooser.setPreferredSize(new Dimension(600,400));
           // Set the filter
           ExampleFileFilter filter = new ExampleFileFilter("jpg");
           filter.addExtension("jpeg");
           filter.addExtension("gif");
           filter.addExtension("png");
           filter.setDescription("Jpg,Jpeg,Gif & Png Files");
           fileChooser.addChoosableFileFilter(filter);       

           fileChooser.setAccessory(accessory);
           fileChooser.addPropertyChangeListener
               (JFileChooser.SELECTED_FILE_CHANGED_PROPERTY, accessory);
           int status = fileChooser.showOpenDialog(null);
           fileName = "" ;
           if (status == JFileChooser.APPROVE_OPTION) {
             File selectedFile = fileChooser.getSelectedFile();
            //fileName = selectedFile.getParent() + selectedFile.separator + selectedFile.getName() ;
            try {
                fileName = selectedFile.getCanonicalPath();
            } catch (IOException e) {
            }
        }

       return fileName ;
     }
     
   public static class LabelAccessory extends JLabel implements PropertyChangeListener {
     private static final int ICON_WIDTH  = 150;
     private static final int ICON_HEIGHT = 150;

     public LabelAccessory(JFileChooser chooser) {
       setVerticalAlignment(JLabel.CENTER);
       setHorizontalAlignment(JLabel.CENTER);
       chooser.addPropertyChangeListener(this);
       setPreferredSize(new Dimension(ICON_WIDTH, ICON_HEIGHT));
     }   
     public void propertyChange(
       PropertyChangeEvent changeEvent) {
        String changeName = changeEvent.getPropertyName();
        if (changeName.equals(JFileChooser.SELECTED_FILE_CHANGED_PROPERTY)) {
                File file = (File)changeEvent.getNewValue();
                if (file != null) {
                        ImageIcon icon = new ImageIcon(file.getPath());
                if (icon.getIconWidth() > ICON_WIDTH) {
                        icon = new ImageIcon(icon.getImage().getScaledInstance(ICON_WIDTH, -1, Image.SCALE_DEFAULT));
                if (icon.getIconHeight() > ICON_HEIGHT) {
                        icon = new ImageIcon(icon.getImage().getScaledInstance(-1, ICON_HEIGHT, Image.SCALE_DEFAULT));
                }
          }
          setIcon(icon);
         }
       }
     }
   }

/**
 * A convenience implementation of FileFilter that filters out
 * all files except for those type extensions that it knows about.
 *
 * Extensions are of the type ".foo", which is typically found on
 * Windows and Unix boxes, but not on Macinthosh. Case is ignored.
 *
 * Example - create a new filter that filerts out all files
 * but gif and jpg image files:
 *
 *     JFileChooser chooser = new JFileChooser();
 *     ExampleFileFilter filter = new ExampleFileFilter(
 *                   new String{"gif", "jpg"}, "JPEG & GIF Images")
 *     chooser.addChoosableFileFilter(filter);
 *     chooser.showOpenDialog(this);
 *
 * @version 1.9 04/23/99
 * @author Jeff Dinkins
 */
public static class ExampleFileFilter extends FileFilter {
    
    private String TYPE_UNKNOWN = "Type Unknown";
    private String HIDDEN_FILE = "Hidden File";
    
    private Hashtable filters = null;
    private String description = null;
    private String fullDescription = null;
    private boolean useExtensionsInDescription = true;
    
    /**
     * Creates a file filter. If no filters are added, then all
     * files are accepted.
     *
     */
    public ExampleFileFilter() {
        this.filters = new Hashtable();
    }
    
    /**
     * Creates a file filter that accepts files with the given extension.
     * Example: new ExampleFileFilter("jpg");
     *
     */
    public ExampleFileFilter(String extension) {
        this(extension,null);
    }
    
    /**
     * Creates a file filter that accepts the given file type.
     * Example: new ExampleFileFilter("jpg", "JPEG Image Images");
     *
     * Note that the "." before the extension is not needed. If
     * provided, it will be ignored.
     *
     */
    public ExampleFileFilter(String extension, String description) {
        this();
        if(extension!=null) addExtension(extension);
        if(description!=null) setDescription(description);
    }
    
    /**
     * Creates a file filter from the given string array.
     * Example: new ExampleFileFilter(String {"gif", "jpg"});
     *
     * Note that the "." before the extension is not needed adn
     * will be ignored.
     *
     */
    public ExampleFileFilter(String[] filters) {
        this(filters, null);
    }
    
    /**
     * Creates a file filter from the given string array and description.
     * Example: new ExampleFileFilter(String {"gif", "jpg"}, "Gif and JPG Images");
     *
     * Note that the "." before the extension is not needed and will be ignored.
     *
     */
    public ExampleFileFilter(String[] filters, String description) {
        this();
        for (int i = 0; i < filters.length; i++) {
            // add filters one by one
            addExtension(filters[i]);
        }
        if(description!=null) setDescription(description);
    }
    
    /**
     * Return true if this file should be shown in the directory pane,
     * false if it shouldn't.
     *
     * Files that begin with "." are ignored.
     *
     */
    public boolean accept(File f) {
        if(f != null) {
            if(f.isDirectory()) {
                return true;
            }
            String extension = getExtension(f);
            if(extension != null && filters.get(getExtension(f)) != null) {
                return true;
            };
        }
        return false;
    }
    
    /**
     * Return the extension portion of the file's name .
     *
     */
    public String getExtension(File f) {
        if(f != null) {
            String filename = f.getName();
            int i = filename.lastIndexOf('.');
            if(i>0 && i<filename.length()-1) {
                return filename.substring(i+1).toLowerCase();
            };
        }
        return null;
    }
    
    /**
     * Adds a filetype "dot" extension to filter against.
     *
     * For example: the following code will create a filter that filters
     * out all files except those that end in ".jpg" and ".tif":
     *
     *   ExampleFileFilter filter = new ExampleFileFilter();
     *   filter.addExtension("jpg");
     *   filter.addExtension("tif");
     *
     * Note that the "." before the extension is not needed and will be ignored.
     */
    public void addExtension(String extension) {
        if(filters == null) {
            filters = new Hashtable(5);
        }
        filters.put(extension.toLowerCase(), this);
        fullDescription = null;
    }
    
    
    /**
     * Returns the human readable description of this filter. For
     * example: "JPEG and GIF Image Files (*.jpg, *.gif)"
     *
     */
    public String getDescription() {
        if(fullDescription == null) {
            if(description == null || isExtensionListInDescription()) {
                fullDescription = description==null ? "(" : description + " (";
                // build the description from the extension list
                Enumeration extensions = filters.keys();
                if(extensions != null) {
                    fullDescription += "." + (String) extensions.nextElement();
                    while (extensions.hasMoreElements()) {
                        fullDescription += ", " + (String) extensions.nextElement();
                    }
                }
                fullDescription += ")";
            } else {
                fullDescription = description;
            }
        }
        return fullDescription;
    }
    
    /**
     * Sets the human readable description of this filter. For
     * example: filter.setDescription("Gif and JPG Images");
     *
     */
    public void setDescription(String description) {
        this.description = description;
        fullDescription = null;
    }
    
    /**
     * Determines whether the extension list (.jpg, .gif, etc) should
     * show up in the human readable description.
     *
     * Only relevent if a description was provided in the constructor
     * or using setDescription();
     *
     */
    public void setExtensionListInDescription(boolean b) {
        useExtensionsInDescription = b;
        fullDescription = null;
    }
    
    /**
     * Returns whether the extension list (.jpg, .gif, etc) should
     * show up in the human readable description.
     *
     * Only relevent if a description was provided in the constructor
     * or using setDescription();
     *
     */
    public boolean isExtensionListInDescription() {
        return useExtensionsInDescription;
    }
}

     
   }
