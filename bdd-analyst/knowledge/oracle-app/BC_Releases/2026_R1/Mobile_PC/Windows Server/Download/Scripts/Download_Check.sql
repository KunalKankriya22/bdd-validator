Spool C:\bcmpc\replication\log\Download_Check.log
set serveroutput on 

DECLARE

   DM_STATUS 	NUMBER;
   V_LINE       varchar2(100);
   VNAME	varchar(20) := 'DownloadMPC';
   ANAME	varchar(20) := 'ArchiveDUMP';

BEGIN
   
  SELECT Count(table_name) into DM_STATUS from download_monitor;

  IF DM_STATUS='0' then
     v_line := 'Downloading';
     dbms_output.put_line (v_line);
	dbms_scheduler.create_job(
      	job_name => vname,
      	job_type => 'EXECUTABLE',
      	job_action => 'C:\Windows\System32\cmd.exe',
      	number_of_arguments => 2,
      	enabled => FALSE);
      	dbms_scheduler.set_job_argument_value( job_name => vname, argument_position => 1, argument_value => '/c');
      	dbms_scheduler.set_job_argument_value( job_name => vname, argument_position => 2, argument_value => 'C:\bcmpc\replication\downloadimpdp');
      	dbms_scheduler.enable( vname);

  else
     v_line := 'Extracting needed';
     dbms_output.put_line (v_line);
	dbms_scheduler.create_job(
      	job_name => aname,
      	job_type => 'EXECUTABLE',
      	job_action => 'C:\Windows\System32\cmd.exe',
      	number_of_arguments => 2,
      	enabled => FALSE);
      	dbms_scheduler.set_job_argument_value( job_name => aname, argument_position => 1, argument_value => '/c');
      	dbms_scheduler.set_job_argument_value( job_name => aname, argument_position => 2, argument_value => 'C:\bcmpc\replication\archivedump');
      	dbms_scheduler.enable( aname);
  end if;
exception 
 when others then
   dbms_output.put_line(sqlerrm);
end;
/
exit;
