package oracle.forms.fd;

import oracle.forms.handler.IHandler;
import oracle.forms.ui.VBean;
import oracle.forms.properties.ID;

  /**
   * A Bean to transform the Forms module
   * into a socket server
   *
   * @author Francois Degrelle
   * @version 1.1
   * 
   */
   
public class LAFSocketServer extends VBean  implements Runnable 
{
  // variables
  //public final static  ID initServer     = ID.registerProperty("INIT_SERVER"); 
  //public final static  ID stopServer     = ID.registerProperty("STOP_SERVER");          
  public final static  ID log            = ID.registerProperty("SET_LOG");          
  private static final ID SEND_MSG       = ID.registerProperty("SENDMSG");        
  private static final ID MESSAGEVALUE   = ID.registerProperty("MESSAGEVALUE");     
  
  static Thread              runner ;
  public static boolean      bMsg = false ;
  public static boolean      bLog = false ;  
  public static String       sMessage = "" ;
  private static IHandler    mHandler;  
  private LAFServer          server ; // special class that init the socker server
  public  DrawLAF            dBean;  
  private int                iWait = 1000 ;

      
  public void init(IHandler handler)
  {
    mHandler = handler;
    super.init(handler);
  }  
  
    
    void initServer(int iPort, int iMilliseconds)
    {
        if(iMilliseconds > 50) iWait = iMilliseconds ;
        log("initServer() iport:"+iPort+"  iwait:"+iWait);
        server = new LAFServer(iPort);
        server.setWaitingTime(iWait);
        server.start();
        startThread() ;
    }
    
    void stopServer()
    {
      stopThread() ;
    }
  
    void setLog(boolean b)
    {
      bLog = b ;
    }
    

      // we start the thread here
      private void startThread()
      {
        if (runner == null )
        {
          runner = new Thread(this);
          runner.start();
        }
      }
      
      // we stop the thread here
      private static void stopThread()
      {
        if (runner != null )
        {
          System.out.println("DrawLAF - Socket Server stopped");
          runner = null;
        }
      }    

      // Start the thread
      public void run()
      {
        Thread theThread = Thread.currentThread();
        while (runner == theThread)
        {
            // well we need sleep to release processor for do any thing else
            try {
                theThread.sleep(iWait);
            } catch (InterruptedException e) {;}
            // tell Forms that a message is incoming
            if( bMsg )
            {
              log("Sendmessage="+sMessage);
              dBean.dispatchanevent(SEND_MSG, MESSAGEVALUE, sMessage);
              bMsg = false ;
            }
        }
      }      
  
  /*
   *  Set some properties 
   */
  public boolean setProperty(ID property, Object value)
  {
    // log
    if( property == log )
    {
      if(value.toString().equalsIgnoreCase("true")) bLog = true ;
      else bLog = false ;
      return true ;
    }        
    else
    {
     return super.setProperty(property, value);
    }
  }  

  
  public static void log(String sMessage)
  {
    if(bLog) System.out.println("DrawLAF - " + sMessage);
  }
  
}
