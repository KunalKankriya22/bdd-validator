set serveroutput on
declare
  nCount  NUMBER:=0;
  p_upload_status  varchar2(1);

 Cursor Z_files is select distinct file_id from
 API_INST_TEST_RESULTS where machine_id='&1' and
  chapter_id='&2';

begin

  --lock it until the process is over

  select count(*) into nCount from api_locked_file where
  machine_id='&1';

   If nCount = 0 then
      insert into api_locked_file values ('&1','&2','Processing',sysdate);
      commit;
     for Z in Z_files loop
       dbms_output.put_line(Z.file_id);

       LT_API_INST_INTERFACE.main_proc(Z.file_id,'&1','&2',p_upload_status);
       if nvl(p_upload_status,'S')='A' then
          dbms_output.put_line('File is aborted - Check the log file');
       else
          null;
          dbms_output.put_line(Z.file_id||' is procssed');
       end if;

   end loop;
     delete from api_locked_file where machine_id='&1';
     commit;

  Else
      dbms_output.put_line('    .');
      dbms_output.put_line('    .');
      dbms_output.put_line('    .');
      dbms_output.put_line('PROCESSING TABLE IS LOCKED..');
  End if;

end;
/
exit;


