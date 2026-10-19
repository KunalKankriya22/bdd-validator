rem ************************************************************************
rem *   sql script to clean up old reports from Production Database
rem *
rem ************************************************************************

set feedback on
set term on
set verify on

delete from rpt_parm_select a
where
  (user_name, report_name,parm_id,appl_id) in
  ( select user_name, report_name,parm_id,appl_id
  from rpt_parm
  where nvl(submit_date,sysdate-365) < sysdate -7 ) ;
commit;
delete from  rpt_parm 
where nvl(submit_date,sysdate-365) < sysdate -7 ;
commit;
delete from rpt_parm_select a
where  (user_name, report_name, parm_id, appl_id) not in
  ( select user_name, report_name, parm_id, appl_id from rpt_parm );
commit;

delete
from    instrument_log
where   status_dats < sysdate - 10;
commit;
delete from result_inp_dtl where tb_id in (select tb_id from result_inp_hdr
where received_date < sysdate-60);
commit;
delete from result_inp_hdr where received_date < sysdate - 60;
commit;
delete from remote_test_units where collection_date < sysdate - 60;
commit;
delete from temp_tubes  where tube_checkin_dats < sysdate - 60;
commit;
delete from interface_log_excp where interface_id in (
select interface_id from interface_log where
start_time < sysdate - 90);
commit;
delete from interface_log where start_time < sysdate - 90;
commit;
exit;

