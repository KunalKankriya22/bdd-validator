set serveroutput on
spool /tmp/last_LBDNC
DECLARE
   I_INTERFACE_ID     varchar2(10);
    cursor chap_cur is select distinct chapter_id from chapters where
     chapter_id!='ALL' and sysdate between eff_date and 
     nvl(term_date, sysdate+10);
BEGIN
   dbms_output.enable(100000);
  FOR Z in chap_cur loop

   I_INTERFACE_ID := null;
   dbms_output.put_line ('Lab to Donor Contract Interface  :'||Z.chapter_id);
   dbms_output.put_line ('================================================');
   dbms_output.put_line ('.');
   dbms_output.put_line ('LBDNC Interface Started:     '||
                         to_char(sysdate,'MM-DD-YYYY HH24:MI:SS'));
   LBDNC.read_lab_test_results (null, null, null, null, null,
                                Z.chapter_id, I_INTERFACE_ID);
   dbms_output.put_line ('------------------------------------------------');
   dbms_output.put_line ('---    Refer to Interface ID: '||I_INTERFACE_ID||
                         '     ---');
   dbms_output.put_line ('------------------------------------------------');
   dbms_output.put_line ('LBDNC Interface Ended:       '||
                         to_char(sysdate,'MM-DD-YYYY HH24:MI:SS'));
 END LOOP;

END;
/
spool off;
exit;
