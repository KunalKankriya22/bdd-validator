package oracle.forms.fd;

import java.awt.Image;
import java.awt.Toolkit;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;

import java.util.Vector;

import oracle.jdbc.OracleResultSet;

import oracle.sql.BLOB;


/**
 * A class that handle client <--> database communication
 * via the JDBC driver
 *
 * @author Francois Degrelle
 */

public class DB_JDBC {

    protected BLOB blob = null;
    protected boolean bLog = false;
    protected String sConn = "", sUser = "", sPwd = "";
    private   static DB_JDBC instance;
    
    public DB_JDBC() {
        super();
    }

    public static synchronized DB_JDBC getInstance() {
          if (instance == null) {
                instance = new DB_JDBC();
          }
          return instance;
    }    
    
    // set the Oracle connection info
    void setConnectString(String s1, String s2, String s3){
        sUser = s1;
        sPwd  = s2;
        sConn = s3 ;
    }

    //
    // set log flag
    //
    void setLog(boolean b){
        bLog = b ;
    }
    
    //
    // test connection
    //
    boolean testConnection() {
        boolean b = true ;
        Connection conn = null;
        Statement stmt = null;
        ResultSet rset = null;
        try {
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
            
            String req = "";
            byte[] buffer = null;
            int iLength = 0;

            // Connect to the database
            try {
                conn = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("Database ["+sConn+"] connection error:\n" + e.toString());
                return false;
            }

            if(conn != null) conn.close();

        } catch (SQLException sqle) {
            err("testConnection SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
        } finally {
            // Close all resources
            try {
                if(rset != null) rset.close();
            } catch (SQLException sqle) {
                err("testConnection SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
            }   
        }
        return b;
    }
    
    
    //
    // read an Image (BLOB) column from the database
    //
    Image getImage(String sTable, String sColumn,String sWhere) {
        Image img = null;
        Connection conn = null;
        Statement stmt = null;
        ResultSet rset = null;
        try {
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
            
            String req = "";
            byte[] buffer = null;
            int iLength = 0;

            // Connect to the database
            try {
                conn = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("database connection error : " + e.toString());
                return null;
            }

            conn.setAutoCommit(false);

            // Create a Statement
            stmt = conn.createStatement();

            req = "select " + sColumn + ", LENGTH(" + sColumn + ") ";
            req += "from " + sTable + " where " + sWhere;
            log("Lecture() : execute query=" + req);
            rset = stmt.executeQuery(req);
            while (rset.next()) {
                // Get the lob
                blob = ((OracleResultSet)rset).getBLOB(1);
                iLength = rset.getInt(2);
            }

            log("Lecture() : transform the BLOB length=" + iLength);
            if (iLength > 0) {
                InputStream instream = blob.getBinaryStream();
                img = getImageFromINStream(instream, iLength);
            }
        } catch (SQLException sqle) {
            err("getBLOB SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
        } finally {
            // Close all resources
            try {
                if(rset != null) rset.close();
                if(stmt != null) stmt.close();
                if(conn != null) conn.close();
            } catch (SQLException sqle) {
                err("getBLOB SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
            }   
        }
        return img;
    }
    
    // get Image from inputStream
    //
    Image getImageFromINStream(InputStream instream, int iLength){
        // Create temporary buffer for read
        byte[] buffer = new byte[iLength];
        Image img = null;
        int length = 0;
        // Fetch data
        try {
            while ((length = instream.read(buffer)) != -1) {
            log("getImage() : Read " + length + " bytes: ");
        }
        } catch (IOException e) {
            err("getImageFromINStream) error:"+e.toString());
        }
        log("getImageFromINStream() : createImage()");
        img = Toolkit.getDefaultToolkit().createImage(buffer);        
        return img;
    }

    //
    // read a BLOB column from the database
    // and write to a file
    //
    void getBLOBtoFile(String sTable, String sColumn,String sWhere,String sFileName) {
        InputStream instream = null;
        Connection conn = null;
        Statement stmt = null;
        ResultSet rset = null;
        try {
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
            
            String req = "";
            byte[] buffer = null;
            int iLength = 0;
            Image img = null;

            // Connect to the database
            try {
                conn = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("database connection error : " + e.toString());
                return ;
            }

            conn.setAutoCommit(false);

            // Create a Statement
            stmt = conn.createStatement();

            req = "select " + sColumn + ", LENGTH(" + sColumn + ") ";
            req += "from " + sTable + " where " + sWhere;
            log("getBLOB() : execute query=" + req);
            rset = stmt.executeQuery(req);
            while (rset.next()) {
                // Get the lob
                blob = ((OracleResultSet)rset).getBLOB(1);
                iLength = rset.getInt(2);
            }
            if (blob != null && (blob.length() > 0)) {
                log("getBLOB() BLOB length:" + iLength);
                log("getBLOB() BLOB:" + blob.length());
                instream = blob.getBinaryStream();
                try {
        
                    // write the inputStream to a FileOutputStream
                    OutputStream out = new FileOutputStream(new File(sFileName));
                    
                    log("inputStreamToFile():"+instream);
                    
                    buffer = new byte[1024];
                    int len = instream.read(buffer);
                    while (len != -1) {
                        out.write(buffer, 0, len);
                        len = instream.read(buffer);
                        if (Thread.interrupted()) {
                            try {
                                throw new InterruptedException();
                            } catch (InterruptedException e) {
                            }
                        }
                    }            
        
                    instream.close();
                    out.flush();
                    out.close();
        
                    log("inputStreamToFile() File "+ sFileName +" created");
                } catch (IOException e) {
                    err("inputStreamToFile() error:"+e.getMessage());
                }                
                    }
                } catch (SQLException sqle) {
                    err("getBLOB() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
                } finally {
                    // Close all resources
                    try {
                        if(rset != null) rset.close();
                        if(stmt != null) stmt.close();
                        if(conn != null) conn.close();
                    } catch (SQLException sqle) {
                        err("getBLOB() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
                    }                 
                }
    }

    //
    // write a BLOB from a file to a database BLOB column
    //
    void writeBLOBFromFile(String sTable, String sColumn,String sWhere, String sFileName, int iSize){
        String req = "";
        byte[] buffer = null;
        int iLength = 0;
        Connection conn = null;
        PreparedStatement pstmt = null;

        try {
            // 
            FileInputStream fis = new FileInputStream(sFileName);
            if(fis ==null){
                err("writeBLOB() : error getting file: " +sFileName);
                return;
            }
            
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
            
            // Connect to the database
            try {
                conn = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("writeBLOB() : error connecting to the database " + e.toString());
                return;
            }
            log("writeBLOB() : output to file:" + sFileName);
            // Create a Statement
            req = "UPDATE " + sTable + " set " + sColumn + " = ? where " + sWhere;
            log("writeBLOB() : execute query=" + req);

            pstmt = conn.prepareStatement(req);
            if (blob == null)
                pstmt.setBinaryStream(1, fis, iSize);
            else
                pstmt.setBlob(1, blob);
            pstmt.execute();
        } catch (SQLException sqle) {
            err("writeBLOB SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
        } catch (FileNotFoundException e) {
        } finally {
            // Close all resources
            try {
                if(pstmt != null) pstmt.close();
                if(conn != null) conn.close();
            } catch (SQLException sqle) {
                err("writeBLOB SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
            }            
        }
    }
    

    //
    // update LAF_IM_MESSAGES for attachment
    //
    void updateAttachment(String sType, String sName, String sSize, String sFileName, int iSize, int iID){
        String req = "";
        byte[] buffer = null;
        int iLength = 0;
        Connection conn = null;
        PreparedStatement pstmt = null;

        try {
            // 
            FileInputStream fis = new FileInputStream(sFileName);
            if(fis ==null){
                err("updateAttachment() : error getting file: " +sFileName);
                return;
            }
            
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
            
            // Connect to the database
            try {
                conn = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("updateAttachment() : error connecting to the database " + e.toString());
                return;
            }
            log("updateAttachment() : output to file:" + sFileName);
            // Create a Statement
            req = "UPDATE LAF_IM_MESSAGES set MSG_ATT_CONTENT=?, MSG_ATT_TYPE=?," +
                "MSG_ATT_NAME=?, MSG_ATT_SIZE=? where MSG_ID=" + iID;
            log("updateAttachment() : execute query=" + req);

            pstmt = conn.prepareStatement(req);
            pstmt.setBinaryStream(1, fis, iSize);
            pstmt.setString(2, sType);
            pstmt.setString(3, sName);
            pstmt.setString(4, sSize);
            pstmt.execute();
        } catch (SQLException sqle) {
            err("updateAttachment SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
        } catch (FileNotFoundException e) {
        } finally {
            // Close all resources
            try {
                if(pstmt != null) pstmt.close();
                if(conn != null) conn.close();
            } catch (SQLException sqle) {
                err("updateAttachment SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
            }            
        }
    }
    
    //
    // insert into table
    //
    void InsertUpdateData(String s) {
        // Register the Oracle JDBC driver
        try {
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
        } catch (SQLException e) {
            err("InsertUpdateData() : error registring drivere " + e.toString());
            return;            
        }
        Connection conn = null;
        Statement stmt = null;

        // Connect to the database
        try {
            conn = DriverManager.getConnection(sConn, sUser, sPwd);
        } catch (Exception e) {
            err("InsertUpdateData() : error connecting to the database " + e.toString());
            return;
        }
        try {
                stmt = conn.createStatement();
                log("InsertUpdateData() : execute:\n"+s);
                stmt.executeUpdate(s);

        } catch(SQLException ex) {
                System.err.println("InsertUpdateData() SQLException: " + ex.getMessage());
        } finally{
            try {
                if(stmt != null) stmt.close();
            } catch (SQLException sqle) {
                err("InsertUpdateData() : error connecting to the database " + sqle.toString());
            }
            try {
                if(conn != null) conn.close();
            } catch (SQLException sqle) {
                err("InsertUpdateData() : error connecting to the database " + sqle.toString());
            }
        }
    }
    
    //
    // get data from DB table
    //
    Vector getData(String sClause, int iNbColumns){
        log("getData():"+sClause);
        Vector v= new Vector();
        String sData[];
        Statement stmt=null;
        Connection conn = null;
        ResultSet rset = null;
        try{
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
    
            // Connect to the database
            try {
                conn = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("getData() database connection error : " + e.toString());
                return v;
            }
    
            conn.setAutoCommit(false);
    
            // Create a Statement
            stmt = conn.createStatement();
    
            log("getData() : execute query=\n" + sClause);
            rset = stmt.executeQuery(sClause);
            // get data
            while (rset.next()) {
                sData = new String[100];
                for(int i=0; i<iNbColumns;i++){
                  sData[i] = rset.getString((i+1));
                }    
                v.addElement(sData);
            }
        } catch (SQLException e) {
            err("getData() SQL Exception:"+e.getErrorCode()+e.getMessage());
        }
        finally {
            // Close all resources
            try {
                if(rset != null) rset.close();
                if(stmt != null) stmt.close();
                if(conn != null) conn.close();
            } catch (SQLException sqle) {
                err("getData() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
            }
        }
        return v;
    }
    
    //
    // send message to unique user
    //
    protected int sendMessage(String sFrom, String sTo, String sTxt) {
        int iRet = 0;
        Connection con = null;
        CallableStatement cs = null;
        log("sendMessage() from:"+sFrom+"  to:"+sTo);
        try {
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
    
            // Connect to the database
            try {
                con = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("sendMessage() database connection error : " + e.toString());
                return 0;
            }            
            cs = con.prepareCall("begin ? := pkg_laf_im.send_message(?,?,?); end;");
            cs.registerOutParameter(1,Types.INTEGER);
            cs.setString(2, sFrom);
            cs.setString(3, sTo);
            cs.setString(4, sTxt);
            cs.execute();
            iRet = cs.getInt(1);
        } catch (SQLException sqle) {
            err("sendMessage() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
        }
        finally {
            if (cs != null) {
                try {
                    cs.close();
                } catch (SQLException sqle) {
                    err("sendMessage() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
                }
            }
            if (con != null) {
                try {
                    con.close();
                } catch (SQLException sqle) {
                    err("sendMessage() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
                }
            }
        }
        return iRet;
    }    
    
    //
    // send message to user list
    //
    protected int sendMessageList(String sFrom, String sList, String sTxt) {
        int iRet = 0;
        Connection con = null;
        CallableStatement cs = null;
        log("sendMessageList() from:"+sFrom+"  to:"+sList);
        try {
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
    
            // Connect to the database
            try {
                con = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("sendMessageList() database connection error : " + e.toString());
                return 0;
            }            
            cs = con.prepareCall("begin ? := pkg_laf_im.send_message_list(?,?,?); end;");
            cs.registerOutParameter(1,Types.INTEGER);
            cs.setString(2, sFrom);
            cs.setString(3, sList);
            cs.setString(4, sTxt);
            cs.execute();
            iRet = cs.getInt(1);
        } catch (SQLException sqle) {
            err("sendMessageList() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
        }
        finally {
            if (cs != null) {
                try {
                    cs.close();
                } catch (SQLException sqle) {
                    err("sendMessageList() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
                }
            }
            if (con != null) {
                try {
                    con.close();
                } catch (SQLException sqle) {
                    err("sendMessageList() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
                }
            }
        }
        return iRet;
    }    
        
    //
    // set new password
    //
    protected void setPassword(String sID, String sPass) {
        Connection con = null;
        CallableStatement cs = null;
        log("setPassword() for:"+sID);
        try {
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
    
            // Connect to the database
            try {
                con = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("setPassword() database connection error : " + e.toString());
                return;
            }            
            cs = con.prepareCall("{call pkg_laf_im.set_user_password(?,?)}");
            cs.setString(1, sID);
            cs.setString(2, sPass);
            cs.execute();
        } catch (SQLException sqle) {
            err("setPassword() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
        }
        finally {
            if (cs != null) {
                try {
                    cs.close();
                } catch (SQLException sqle) {
                    err("setPassword() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
                }
            }
            if (con != null) {
                try {
                    con.close();
                } catch (SQLException sqle) {
                    err("sendMessageList() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
                }
            }
        }
    }    

    //
    // get time from DB
    //
    String getTime(String sDec,String sFormat){
        log("getTime() sDec:"+sDec+"  sFormat:"+sFormat);
        String sTime=null;
        Statement stmt=null;
        Connection conn = null;
        ResultSet rset = null;
        try{
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
    
            // Connect to the database
            try {
                conn = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("getTime() database connection error : " + e.toString());
                return null;
            }
    
            conn.setAutoCommit(false);
    
            // Create a Statement
            stmt = conn.createStatement();
            if(sDec == null){
                rset = stmt.executeQuery("SELECT TO_CHAR(SYSDATE,'" + sFormat + "') FROM DUAL");
            }
            else{
                rset = stmt.executeQuery("SELECT TO_CHAR(SYSDATE"+sDec+",'" + sFormat + "') FROM DUAL");                
            }
            // get data
            if (rset.next()) {
                  sTime = rset.getString(1);
            }
        } catch (SQLException e) {
            err("getTime() SQL Exception:"+e.getErrorCode()+e.getMessage());
        }
        finally {
            // Close all resources
            try {
                if(rset != null) rset.close();
                if(stmt != null) stmt.close();
                if(conn != null) conn.close();
            } catch (SQLException sqle) {
                err("getSequence() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
            }
        }
        return sTime;
    }    

    
    //
    // is password ok
    //
    boolean isPasswordOK(String sID,String sPass){
        log("isPasswordOK()");
        boolean b = false ;
        String sRet = "false" ;
        Connection con = null;
        CallableStatement cs = null;
        try {
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
    
            // Connect to the database
            try {
                con = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("isPasswordOK() database connection error : " + e.toString());
                return false;
            }            
            cs = con.prepareCall("begin ? := pkg_laf_im.is_password_ok(?,?); end;");
            cs.setString(2, sID);
            cs.setString(3, sPass);
            cs.registerOutParameter(1,Types.CHAR);
            cs.execute();
            sRet = cs.getString(1);
            if(sRet!= null){
                if(sRet.equalsIgnoreCase("true")){
                    b = true ;
                }
            }
        } catch (SQLException sqle) {
            err("isPasswordOK() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
        }
        finally {
            if (cs != null) {
                try {
                    cs.close();
                } catch (SQLException sqle) {
                    err("isPasswordOK() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
                }
            }
            if (con != null) {
                try {
                    con.close();
                } catch (SQLException sqle) {
                    err("isPasswordOK() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
                }
            }
        }
        return b;
    }    

    //
    // get last sequence number from LAF_IM_SEQ
    //
    int getSequence(){
        int iSeq=-1;
        Statement stmt=null;
        Connection conn = null;
        ResultSet rset = null;
        try{
            // Register the Oracle JDBC driver
            DriverManager.registerDriver(new oracle.jdbc.OracleDriver());
    
            // Connect to the database
            try {
                conn = DriverManager.getConnection(sConn, sUser, sPwd);
            } catch (Exception e) {
                err("getData() database connection error : " + e.toString());
                return 0;
            }
    
            conn.setAutoCommit(false);
    
            // Create a Statement
            stmt = conn.createStatement();
    
            rset = stmt.executeQuery("SELECT LAF_IM_SEQ.NEXTVAL FROM DUAL");
            // get data
            if (rset.next()) {
                  iSeq = rset.getInt(1);
            }
        } catch (SQLException e) {
            err("getSequence() SQL Exception:"+e.getErrorCode()+e.getMessage());
        }
        finally {
            // Close all resources
            try {
                if(rset != null) rset.close();
                if(stmt != null) stmt.close();
                if(conn != null) conn.close();
            } catch (SQLException sqle) {
                err("getSequence() SQL Exception:"+sqle.getErrorCode()+sqle.getMessage());
            }
        }
        return iSeq;
    }

    void log(String sMessage) {
        if (bLog)
            System.out.println("- I.M.(JDBC) "+sMessage);
    }
    
    void err(String sMessage) {
        System.out.println(". !!! I.M.(JDBC) error: "+sMessage);
    }    


}
