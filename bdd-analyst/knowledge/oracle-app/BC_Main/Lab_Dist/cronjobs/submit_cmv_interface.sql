set serveroutput on;
DECLARE
   interface_id     varchar2(10);
   cursor chap_cur is select distinct chapter_id from chapters where
   term_date is null or term_date > sysdate;
BEGIN
  FOR Z in chap_cur loop
   dbms_output.put_line('Processing: '||Z.chapter_id);
   cmvint.donor_to_lab_unit_data (null, Z.chapter_id, null, null, interface_id);
    for j in 1.. 500 loop
    interface_id:=null;
    end loop;
 END LOOP;

END;
/
EXIT;
