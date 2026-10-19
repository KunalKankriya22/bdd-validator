set serveroutput on
spool /tmp/lab_last_print_REPORT
execute srw_call_report_rsm.run_srw_pkg_prc 
SPOOL OFF;
exit;


