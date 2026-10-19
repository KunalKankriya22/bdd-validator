spool C:\bcmpc\replication\log\lt_table_extract.log
set serveroutput on
set timing on
declare
	lv_status VARCHAR2(4000);
begin

	laptop_tables_extract.insert_extract_job_script(shipment_id_in => NULL,
						 	user_id_in 	=> 'SCRIPT',
						 	status_out 	=> lv_status);
    
        DBMS_OUTPUT.put_line(lv_status);

end;
/
exit
