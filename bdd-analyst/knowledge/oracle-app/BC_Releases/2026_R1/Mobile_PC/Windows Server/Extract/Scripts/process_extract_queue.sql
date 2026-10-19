spool C:\bcmpc\replication\log\process_extract_queue.log
set serveroutput on
set timing on
begin

	laptop_tables_extract.run_extract_job;

end;
/
exit
