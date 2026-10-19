/*
    Date    : 03/10/2021
    Notes   : 1) Print Utility.submit_job to replace c program that interfaces
                with printer to print labels.
              2) Needs to be expanded (below setup for poc)
    Pre-req : 1) ACL must be setup for TCP communication with printer socket.
              2) DB server must be able to ping to hemtrax print server.
    
    1) print_util.pkg
    2) ACL setup
    3) Log table change.
    4) TODO
    
*/

CREATE OR REPLACE package print_util as 

  /* TODO enter package declarations (types, exceptions, methods etc) here */ 
  procedure submit_job( p_host_in    IN VARCHAR2, 
                        p_port_in    IN VARCHAR2, 
                        p_data_in    IN VARCHAR2
                      );

  procedure submit_async_job(p_host_in    IN VARCHAR2, 
                             p_port_in    IN VARCHAR2, 
                             p_data_in    IN VARCHAR2);

end print_util;
/


CREATE OR REPLACE package body print_util as

  procedure submit_job( p_host_in    IN VARCHAR2, 
                        p_port_in    IN VARCHAR2, 
                        p_data_in    IN VARCHAR2) as
    p_status_out VARCHAR2(2000);
    tcp_conn    UTL_TCP.CONNECTION;
    ln_retVal   PLS_INTEGER;
    lv_response VARCHAR2(1000) := '';
    lv_data     VARCHAR2(1000);
    ln_port     PLS_INTEGER;
    lc_timeout  PLS_INTEGER := 20; -- Time in seconds before utl_tcp pkg gives up read/write operation in the conn.
    FUNCTION get_error_message(p_message IN VARCHAR2) RETURN VARCHAR2 IS
        ln_pos NUMBER;
        lv_errMsg VARCHAR2(2000);
    BEGIN
        ln_pos := INSTR(p_message, 'ERR,');
        IF ln_pos > 0 THEN
            lv_errMsg := SUBSTR(p_message, ln_pos);
        ELSE
            lv_errMsg := p_message;
        END IF;
        
        RETURN lv_errMsg;
        
    EXCEPTION
        WHEN OTHERS THEN
            lv_errMsg := SUBSTR(SQLERRM, 1, 1000) || '-' || lv_response;
            RETURN lv_errMsg;
    END get_error_message;    
  BEGIN 
    -- validate input parameters.
    BEGIN
        IF p_host_in IS NULL OR p_port_in IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('Remote host or Port number missing');
            RETURN;
        END IF;

        IF p_data_in IS NULL THEN
            DBMS_OUTPUT.PUT_LINE('Input data string is required.');
            RETURN;
        END IF;
        
        ln_port := TO_NUMBER(p_port_in);
        
        SELECT REPLACE(p_data_in, '\"', '"') INTO lv_data FROM DUAL;

    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE(SQLERRM);
            RETURN;     
    END;


    --OPEN THE CONNECTION
    tcp_conn := UTL_TCP.OPEN_CONNECTION(
        REMOTE_HOST   => p_host_in,
        REMOTE_PORT   => TO_NUMBER(p_port_in),
        TX_TIMEOUT    => lc_timeout
    );

    --WRITE TO SOCKET
    ln_retVal := UTL_TCP.WRITE_LINE(tcp_conn, lv_data);
    UTL_TCP.FLUSH(tcp_conn);
    
    
    -- CHECK AND READ RESPONSE FROM SOCKET
    BEGIN
        WHILE UTL_TCP.AVAILABLE(tcp_conn,10) > 0 LOOP
            lv_response := lv_response ||  UTL_TCP.GET_LINE(tcp_conn,TRUE);
        END LOOP;
    EXCEPTION
        WHEN UTL_TCP.END_OF_INPUT THEN
            NULL;
    END;

    UTL_TCP.CLOSE_CONNECTION(tcp_conn);
    
    DBMS_OUTPUT.PUT_LINE('Response from Socket Server : ' || lv_response);
    
    IF INSTR(lv_response, 'ACK') > 0 THEN
        p_status_out := 'OK';
    ELSE
        p_status_out := get_error_message(lv_response);
    END IF;
    
    
  EXCEPTION
    WHEN OTHERS THEN
        UTL_TCP.CLOSE_CONNECTION(tcp_conn);
        p_status_out := SQLERRM;
        RAISE_APPLICATION_ERROR(-20101,SQLERRM);
  END submit_job;

  procedure submit_async_job(p_host_in    IN VARCHAR2, 
                             p_port_in    IN VARCHAR2, 
                             p_data_in    IN VARCHAR2) is
    lv_jobName VARCHAR2(100);                             
  begin
    lv_jobName := 'LabelPrint_' || to_char(sysdate, 'MMDDYYYYHH24MI');
    dbms_scheduler.create_job(
       job_name=> lv_jobName,
       job_action => 'BEGIN     
                            print_util.submit_job(p_host_in => ''' || p_host_in || ''',
                            p_port_in => ''' || p_port_in || ''',
                            p_data_in => ''' || p_data_in || '''
                         );
                      END;',
       job_type => 'plsql_block',
       enabled => true ) ;

  end submit_async_job;
end print_util;
/

/* 
    ACL permissions to UTIL user - UTIL_TCP needs connect privelege only
    Note the host address in the acl permission setup.
    Printer address is : 10.155.58.49
*/
DECLARE
  l_principal VARCHAR2(20) := 'UTIL';
BEGIN
  DBMS_NETWORK_ACL_ADMIN.append_host_ace (
    host       => '10.155.*',
    lower_port => NULL,
    upper_port => NULL,
    ace        => xs$ace_type(privilege_list => xs$name_list('connect'),
                              principal_name => l_principal,
                              principal_type => xs_acl.ptype_db));
EXCEPTION WHEN OTHERS THEN
  DBMS_OUTPUT.PUT_LINE('Error granting ACL :' || SQLERRM);
END;
/

/*
    Check ACL setup.
*/
------------------------------------------------------------
select host,
      LOWER_PORT,
       UPPER_PORT,
       ACL,
       ACLID,
       ACL_OWNER
FROM   dba_host_acls
ORDER BY host;


SELECT host,
       lower_port,
       upper_port,
       ace_order,
       TO_CHAR(start_date, 'DD-MON-YYYY') AS start_date,
       TO_CHAR(end_date, 'DD-MON-YYYY') AS end_date,
       grant_type,
       inverted_principal,
       principal,
       principal_type,
       privilege
FROM   dba_host_aces
ORDER BY host, ace_order;
---------------------------------------------------------------

/*
    TEST SUBMIT_JOB
*/
DECLARE
    lv_data VARCHAR2(1000);
    lv_host VARCHAR2(50);
    lv_port VARCHAR2(10);
    lv_status VARCHAR2(2000);
BEGIN
    -- setup
    lv_data := 'PFF,\"2\", \"W123421031071005\", \"U. S. NAVAL HOSPITAL\", \"Okinawa  96362\", \"DEPARTMENT OF THE NAVY\", \"Washington DC 96362\", \"9611673\", \"\", \"00\", \"00\", \"00\", \"00\", \"00\", \"F\", \"E0385\", \"V\", \"00\",\"2\",\"\"\"\",\"\",\"0\",\"\",\"0\",\"\",\"0\",\"\",\"0\",\"\",\"\",\"02\", \"0\", \"0\", \"0\", \"0\", \"0\",\"04\", \"21\", \"2021\", \"23\", \"59\", \"F\", \"\", \"\",\"\",\"\", \"  \", \"\", \"  \", \"\", \"\", \"1\"';
    lv_host := '10.155.58.49';
    lv_port := '5500';
    
    print_util.submit_job(  p_host_in => lv_host,
                            p_port_in => lv_port,
                            p_data_in => lv_data
                         );
                         
    DBMS_OUTPUT.PUT_LINE('Status: ' || lv_status);                         
END;

/*
    TEST ASYNC SUBMIT_JOB
*/
DECLARE
    lv_data VARCHAR2(1000);
    lv_host VARCHAR2(50);
    lv_port VARCHAR2(10);
    lv_status VARCHAR2(2000);
    lv_user  VARCHAR2(10);
BEGIN
    -- setup
    lv_data := 'PFF,\"2\", \"W123421031071005\", \"U. S. NAVAL HOSPITAL\", \"Okinawa  96362\", \"DEPARTMENT OF THE NAVY\", \"Washington DC 96362\", \"9611673\", \"\", \"00\", \"00\", \"00\", \"00\", \"00\", \"F\", \"E0385\", \"V\", \"00\",\"2\",\"\"\"\",\"\",\"0\",\"\",\"0\",\"\",\"0\",\"\",\"0\",\"\",\"\",\"02\", \"0\", \"0\", \"0\", \"0\", \"0\",\"04\", \"21\", \"2021\", \"23\", \"59\", \"F\", \"\", \"\",\"\",\"\", \"  \", \"\", \"  \", \"\", \"\", \"1\"';
    lv_host := '10.155.58.49';
    lv_port := '5500';
    lv_user := 'ASHVAR';
    
    print_util.submit_async_job(  p_host_in => lv_host,
                                  p_port_in => lv_port,
                                  p_data_in => lv_data,
                                  p_user_in => lv_user
                                 );
                                 
    DBMS_OUTPUT.PUT_LINE('Status: ' || lv_status);                         
END;

/*
    TODO
    1) Add label_string VARCHAR2(1000) to label_print_log table.
    2) Discuss about informing status about print job
        a) C program does not return status - it updates errors or status to log file.
        b) With Oracle routine, we can get the status from the label program and let user know.
        c) Do we have user wait for the status (5 to 20 secs - depending on printer)
            OR
           Submit the job and check the status later (possibly another column in label_print_log table - status column)
*/
