set serveroutput on
declare
CURSOR get_fl is select distinct file_id,chapter_id
                       from TEST_RESULT_STAGING
                                 where PROCESSED_FLAG is null;
v_filesource varchar2(1);
begin
       select code_desc into v_filesource from master_codes
        where code_type ='SURND'
        and  code='READ'
            and sysdate between eff_date and nvl(term_date,sysdate);
       --dbms_output.put_line('filesource '||v_filesource);

IF v_filesource ='T' THEN
  for rec in get_fl loop
    dbms_output.put_line('files '||rec.file_id);
    ATUPSURD.main_proc(rec.file_id,'SURND',rec.chapter_id);
  end loop;
ELSE
   ATUPSURD.main_proc('&1','SURND',rec.chapter_id);
END IF;
 exception
      when no_data_found then
          v_filesource :='F';
      when others then
           dbms_output.put_line('Error in prepare_filesource ');
           raise_application_error('-20000','File source');
           raise;
end;
/

