package oracle.forms.fd;

import java.awt.Component;
import java.awt.FileDialog;
import java.awt.Frame;

/**
 * A class to display an Open/Save File dialog
 * <br />
 * @author   Francois Degrelle
 * @version  1.0
 * 
 */

public class AWTFileDialog extends Component {
    
  boolean     bLog = false ;
  Frame       fm = new Frame();
  private static    AWTFileDialog instance;

    public static synchronized AWTFileDialog getInstance() {
        if (instance == null) {
            instance = new AWTFileDialog();
        }
        return instance;
    }

   /*
    *  Show an Open file dialog
    */
  public String openFile
      (String title, String defDir, String fileType) {
    
    String sFile = "" ;
    
    log("title:"+title);
    log("defdir:"+defDir);
    log("filetype:"+fileType);    

    FileDialog fd = new FileDialog(fm, title, FileDialog.LOAD);
    if(fileType != "-") fd.setFile(fileType);
    if(defDir != "-") fd.setDirectory(defDir);
    fd.setResizable(true);
    fd.setVisible(true);
    if(fd.getFile() != null) 
       sFile = fd.getDirectory() + fd.getFile();
    return sFile;
    }

  /*
   *   Show a Save file dialog
   */
  public String saveFile
      (String title, String defDir, String fileType) {
    
    String sFile = "" ;
    
    log("title:"+title);
    log("defdir:"+defDir);
    log("filetype:"+fileType);

    FileDialog fd = new FileDialog(fm, title,    FileDialog.SAVE);
    if(fileType != "-") fd.setFile(fileType);
    if(defDir != "-") fd.setDirectory(defDir);
    fd.setResizable(true);
    fd.setVisible(true);
    if(fd.getFile() != null) 
       sFile = fd.getDirectory() + fd.getFile();
    return sFile;

    }
  
  public void setLog(boolean b)
  {
    bLog = b ;
  }
  
  void log(String sMessage)
  {
    if(bLog) System.out.println(sMessage);
  }
}
