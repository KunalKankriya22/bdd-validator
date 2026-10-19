set serveroutput on;
spool drive_report;
DECLARE
   interface_id     varchar2(10);
   cursor chap_cur is select distinct chapter_id from chapters where
   term_date is null or term_date > sysdate;
BEGIN
   dbms_output.enable (200000);
  FOR Z in chap_cur loop
   dbms_output.put_line('Processing :'||Z.chapter_id);
   don_lab_drv.interface_drives (null, null, null, Z.chapter_id, interface_id);
   for j in 1 .. 500 loop
    interface_id:=null;
   end loop;
 END LOOP;

END;
/
spool off;
EXIT;
