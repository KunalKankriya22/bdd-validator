package oracle.forms.fd;

import java.io.*;
import java.net.*;

/*------------------------------------
 * a class to manage a socket server
 *-----------------------------------*/
public class LAFServer extends Thread
{
  private static final int WAIT_FOR_CLIENT = 0 ;
  private static final int WAIT_FOR_ANSWER = 1 ;
  private ServerSocket sock;
  private int state = WAIT_FOR_CLIENT;
  private int iWait = 1000 ;
  
  public LAFServer( int iPortNumber )
  {
    try
    {
      sock = new ServerSocket(iPortNumber); 
      LAFSocketServer.log("ServerSocket is running on port:"+iPortNumber);
    } catch (IOException ioe) 
    {
      System.err.println("DrawLAF - Error : unable to create socket:\n"+ioe.toString());
    }
  }
  
   void setWaitingTime(int iMilliseconds)
   {
     if(iMilliseconds > 50) iWait = iMilliseconds ;
   }
  
  public void run()
  {
    Socket client = null ;
    while (true)
    {
      if (sock == null)
         return ;
      try 
      {
        client = sock.accept();
      } catch (IOException ioe) 
      {
        System.err.println("DrawLAF - Error : unable to connect the client:"+ioe.toString());
        return ;
      }
      try
      {
        InputStreamReader isr = new InputStreamReader(client.getInputStream()) ;
        BufferedReader is = new BufferedReader(isr);
        PrintWriter os = new PrintWriter(new BufferedOutputStream(client.getOutputStream()),false);
        String outLine;
        
        outLine = getClientString(null);
        os.println(outLine);
        os.flush();
        
        while(true)
        {
         try{
            String inLine = is.readLine();
            if (inLine.length() > 0)
            {
               outLine = getClientString(inLine);
               LAFSocketServer.log("outLine="+outLine);
               LAFSocketServer.sMessage = outLine ;
               LAFSocketServer.bMsg = true ;
            }
            else
               outLine = getClientString("");
               os.println(outLine);
               os.flush();
               if( outLine.equals("Bye."))
                 break ;
          }
          catch(Exception ex)
          {
            break ;
          }             
          try {
                Thread.sleep(iWait);
            } catch (InterruptedException e) {;}                
        }
        os.close();
        is.close();
      } catch (Exception e) 
      {
        System.err.println("Error : "+e);
        e.printStackTrace();
      }
    }
  }
  
  // get the input from the client  
  String getClientString( String s)
  {
    String outStr = null ;
    switch (state)
    {
       case WAIT_FOR_CLIENT:
          outStr = "Server is ready, waiting for input\r\n enter Bye. to quit" ;
          state = WAIT_FOR_ANSWER ;
          break;
       case WAIT_FOR_ANSWER:
          outStr = s ;
          break ;     
    }
    return outStr ;
  }
  
}
