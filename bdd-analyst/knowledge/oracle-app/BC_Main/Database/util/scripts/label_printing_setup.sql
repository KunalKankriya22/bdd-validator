BEGIN
  DBMS_SCHEDULER.create_program(
    program_name   => 'lbl_print_pgm',
    program_type   => 'STORED_PROCEDURE',
    program_action => 'print_util.submit_job',
    number_of_arguments => 4,
    enabled => FALSE,
    comments => 'Program to print labels'
    );
    
  DBMS_SCHEDULER.define_program_argument(
   program_name => 'lbl_print_pgm',
   argument_name => 'p_host_in',
   argument_position => 1,
   argument_type => 'VARCHAR2',
   default_value => '');
   
  DBMS_SCHEDULER.define_program_argument(
   program_name => 'lbl_print_pgm',
   argument_name => 'p_port_in',
   argument_position => 2,
   argument_type => 'VARCHAR2',
   default_value => '');
   
  DBMS_SCHEDULER.define_program_argument(
   program_name => 'lbl_print_pgm',
   argument_name => 'p_data_in',
   argument_position => 3,
   argument_type => 'VARCHAR2',
   default_value => '');
   
   DBMS_SCHEDULER.define_program_argument(
   program_name => 'lbl_print_pgm',
   argument_name => 'p_user_in',
   argument_position => 4,
   argument_type => 'VARCHAR2',
   default_value => '');  
   
   DBMS_SCHEDULER.enable (name=>'lbl_print_pgm');
END;



----------------------------------------------------------------------------
-- Below two grants are only required for regular type jobs
Grant execute on DBMS_SCHEDULER to util; 
Grant execute on DBMS_ISCHED to util;
-- 
-- Below one grant is only required for lightweight type job
GRANT EXECUTE ON SYS.DEFAULT_IN_MEMORY_JOB_CLASS TO util;
--
Grant Create Job to util;
------------------------------------------------------------------------------

/*
    ACL permissions to UTIL user - UTIL_TCP needs connect privelege only
    Note the host address in the acl permission setup.
    Printer address is : 10.155.62.223 --58.49
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


--
    Check ACL setup.
--
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


--
    TEST SUBMIT_JOB
--
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


--
    TEST ASYNC SUBMIT_JOB
--
SET SERVEROUTPUT ON;
DECLARE
    lv_data VARCHAR2(1000);
    lv_host VARCHAR2(50);
    lv_port VARCHAR2(10);
    lv_status VARCHAR2(2000);
BEGIN
    -- setup
    lv_data := 'PFF,\"2\", \"W123421031071005\", \"U. S. NAVAL HOSPITAL\", \"Okinawa  96362\", \"DEPARTMENT OF THE NAVY\", \"Washington DC 96362\", \"9611673\", \"\", \"00\", \"00\", \"00\", \"00\", \"00\", \"F\", \"E0385\", \"V\", \"00\",\"2\",\"\"\"\",\"\",\"0\",\"\",\"0\",\"\",\"0\",\"\",\"0\",\"\",\"\",\"02\", \"0\", \"0\", \"0\", \"0\", \"0\",\"04\", \"21\", \"2021\", \"23\", \"59\", \"F\", \"\", \"\",\"\",\"\", \"  \", \"\", \"  \", \"\", \"\", \"1\"';
    lv_host := '10.155.58.40';
    lv_port := '5500';
    
    print_util.submit_async_job(  p_host_in => lv_host,
                                  p_port_in => lv_port,
                                  p_data_in => lv_data,
                                  p_user_in => 'ASHVAR'
                                 );
                                 
    DBMS_OUTPUT.PUT_LINE('Status: ' || lv_status);                         
END;

DECLARE
    lv_data VARCHAR2(1000);
    lv_host VARCHAR2(50);
    lv_port VARCHAR2(10);
    lv_status VARCHAR2(2000);
BEGIN
    -- setup
    lv_data := 'PFF,\"2\", \"W123421031071005\", \"U. S. NAVAL HOSPITAL\", \"Okinawa  96362\", \"DEPARTMENT OF THE NAVY\", \"Washington DC 96362\", \"9611673\", \"\", \"00\", \"00\", \"00\", \"00\", \"00\", \"F\", \"E0385\", \"V\", \"00\",\"2\",\"\"\"\",\"\",\"0\",\"\",\"0\",\"\",\"0\",\"\",\"0\",\"\",\"\",\"02\", \"0\", \"0\", \"0\", \"0\", \"0\",\"04\", \"21\", \"2021\", \"23\", \"59\", \"F\", \"\", \"\",\"\",\"\", \"  \", \"\", \"  \", \"\", \"\", \"1\"';
    lv_host := '10.155.63.31';
    lv_port := '5500';
    
    print_util.submit_async_job(  p_host_in => lv_host,
                                  p_port_in => lv_port,
                                  p_data_in => lv_data,
                                  p_user_in => 'ASHVAR'
                                 );
                                 
    DBMS_OUTPUT.PUT_LINE('Status: ' || lv_status);                         
END;

--
Look for label print jobs.
--

SELECT
    owner,
    program_name,
    enabled
FROM
    dba_scheduler_programs
WHERE
    owner = 'UTIL';
SELECT
    job_name,
    log_date,
    status,
    actual_start_date,
    run_duration,
    cpu_used
FROM
    dba_scheduler_job_run_details
WHERE job_name LIKE 'LABELPRINT%';


SELECT *
FROM   user_scheduler_jobs
ORDER BY 1;

SELECT
    job_name,
    log_date,
    status,
    actual_start_date,
    run_duration,
    cpu_used
FROM
    dba_scheduler_job_run_details
WHERE lower(job_name) LIKE 'regular_job_%';



/* LIGHTWEIGHT VS REGULR PERFORMANCE TESTING */
SET SERVEROUTPUT ON
DECLARE
  l_start    NUMBER;
BEGIN

  l_start := DBMS_UTILITY.get_time;

  FOR i IN 1 .. 2 LOOP
    DBMS_SCHEDULER.create_job (
      job_name        => 'lightweight_job_' || i,
      program_name    => 'perf_pgm',
      job_style       => 'LIGHTWEIGHT',
      enabled         => TRUE);
  END LOOP;

  DBMS_OUTPUT.put_line('LIGHTWEIGHT (hsecs): ' || (DBMS_UTILITY.get_time - l_start));

  l_start := DBMS_UTILITY.get_time;

  FOR i IN 1 .. 100 LOOP
    DBMS_SCHEDULER.create_job (
      job_name        => 'regular_job_' || i,
      program_name    => 'perf_pgm',
      job_style       => 'REGULAR',
      enabled         => TRUE);
  END LOOP;

  DBMS_OUTPUT.put_line('REGULAR (hsecs): ' || (DBMS_UTILITY.get_time - l_start));

END;


/* BATCH LABEL PRINTING SCRIPT */

SET SERVEROUTPUT ON
DECLARE
  l_start    NUMBER;
    lv_data VARCHAR2(1000);
    lv_host VARCHAR2(50);
    lv_port VARCHAR2(10);
    lv_status VARCHAR2(2000);  
BEGIN
    -- setup
    lv_data := 'PFF,\"2\", \"W123421031071005\", \"U. S. NAVAL HOSPITAL\", \"Okinawa  96362\", \"DEPARTMENT OF THE NAVY\", \"Washington DC 96362\", \"9611673\", \"\", \"00\", \"00\", \"00\", \"00\", \"00\", \"F\", \"E0385\", \"V\", \"00\",\"2\",\"\"\"\",\"\",\"0\",\"\",\"0\",\"\",\"0\",\"\",\"0\",\"\",\"\",\"02\", \"0\", \"0\", \"0\", \"0\", \"0\",\"04\", \"21\", \"2021\", \"23\", \"59\", \"F\", \"\", \"\",\"\",\"\", \"  \", \"\", \"  \", \"\", \"\", \"1\"';
    lv_host := '10.155.63.31';
    lv_port := '5500';

  l_start := DBMS_UTILITY.get_time;
/*
  FOR i IN 1 .. 2 LOOP
    print_util.submit_async_pgm(  p_host_in => lv_host,
                                  p_port_in => lv_port,
                                  p_data_in => lv_data,
                                  p_user_in => 'ASHVAR'
                                 );
  END LOOP;

  DBMS_OUTPUT.put_line('LIGHTWEIGHT (hsecs): ' || (DBMS_UTILITY.get_time - l_start));
*/
  l_start := DBMS_UTILITY.get_time;

  FOR i IN 1 .. 2 LOOP
    print_util.submit_async_job(  p_host_in => lv_host,
                                  p_port_in => lv_port,
                                  p_data_in => lv_data,
                                  p_user_in => 'ASHVAR'
                                 );
  END LOOP;

  DBMS_OUTPUT.put_line('REGULAR (hsecs): ' || (DBMS_UTILITY.get_time - l_start));

END;