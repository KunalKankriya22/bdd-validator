
select * from user_scheduler_jobs;

SELECT
    code_info,
    seq,
    second_definition,
    chapter_id,
    location_id,
    code
FROM
    rpt_master_codes
WHERE
        appl_id = 'DON'
    AND code_type = 'LBLPTR';
    AND location_id = temp_v_warehouse
    AND chapter_id = temp_v_chapter
    AND code = temp_v_pid;


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


SELECT
    *
FROM
    dba_sys_privs
WHERE
    grantee = 'UTIL';

SELECT
    grantee,
    table_name,
    privilege
FROM
    dba_tab_privs
WHERE
    table_name = 'DEFAULT_IN_MEMORY_JOB_CLASS';
       
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