rem ************************************************************************
rem *   sql script to clean up old reports from Production Database
rem *
rem *   Parameters:
rem *           1.      No of days before today for report delete
rem *           2.      Output directory for reports
rem ************************************************************************

rem csw 6Jan2000, set nls_date_format='DD-MON-RRRR' to obtain correct century
alter session set nls_date_format='DD-MON-RRRR';

delete from rpt_parm_select a 
where  (user_name, report_name, parm_id) in
  ( select user_name, report_name, parm_id from rpt_parm 
                                where 
                                  nvl(submit_date,sysdate-365) < sysdate-7);
commit;
delete from  rpt_parm 
where nvl(submit_date,sysdate-365) < sysdate-7;
commit;
delete from rpt_parm_select a
where  (user_name, report_name, parm_id) not in
  ( select user_name, report_name, parm_id from rpt_parm );
commit;
delete from donor_reel where insert_date<sysdate-7;
commit;
delete from new_donor_temp where insert_date<sysdate-5;
commit;
--delete from appl_rep_log where start_time<sysdate-60;
commit;
delete from fixed_site_slots where sch_date<sysdate-155;
commit;
rem delete from interface_log_excp where interface_id in (
rem select interface_id from interface_log where
rem start_time < sysdate - 90);
commit;
delete from interface_log where start_time < sysdate - 90;
commit;
exit;


