set serveroutput on
spool /tmp/last_print_REPORT
execute srw_call_report.run_srw_pkg_prc
SPOOL OFF;
exit;


