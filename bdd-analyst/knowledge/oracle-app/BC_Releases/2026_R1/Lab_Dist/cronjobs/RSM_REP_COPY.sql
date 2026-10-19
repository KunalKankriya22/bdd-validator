	set heading off
	set pages 0
	set feedback off
	set verify off
	set echo on
	set flush off
	set trimspool on
	set embedded on
        set termout off
	set serveroutput on
	SET LINESIZE 200        
  	spool &1

  DECLARE
    l_dest_Dir        VARCHAR2(200);
    -- list of file names (including extension)
    cursor parm_cur is
    select rep_job_id, rep_server, 'cp -n /home/bcorapp/repout/'|| client_msg || ' ' || l_dest_dir || client_msg cp_cmd
      from rpt_parm
     where submit_date > sysdate - (1 / 24)
       and report_status = 'C'
       and client_msg is not null
       and client_msg_sent is null
       and report_name = 'RSMREPRT'
     order by submit_date;    
  BEGIN
    -- destination directory
    select description into l_dest_Dir
     from valid_parameters
    where parameter_code = 'RSM_COPY';     
    
    for parm_rec in parm_cur loop    
      
      update rpt_parm
       set client_msg_sent = 'C'
      where rep_job_id = parm_rec.rep_job_id
       and rep_server = parm_rec.rep_server;    
       
      dbms_output.put_line(parm_rec.cp_cmd);
    end loop;   
    commit;
  END;
  /
SPOOL OFF;
exit;

