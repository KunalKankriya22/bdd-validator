set serveroutput on
declare
  nCount  NUMBER:=0;
  p_upload_status  varchar2(1);

 Cursor Z_batches is select distinct ext_batch_id from
 API_ADD_TEST_INTER where chapter_id='&1';

begin

  --lock it until the process is over so that the cron will not pick up
  

  select count(*) into nCount from api_locked_file where
  machine_id='ADTST';

   If nCount = 0 then
      insert into api_locked_file values ('ADTST','&1',
                                          'Processing',
                                          sysdate);
      commit;
     for Z in Z_batches loop
       dbms_output.put_line(Z.ext_batch_id);

       LT_API_ADD_TEST_INTER.main_proc(Z.ext_batch_id,'&1',p_upload_status);
       if nvl(p_upload_status,'S')='A' then 
          dbms_output.put_line('File is aborted - Check the log file');
       elsif nvl(p_upload_status,'X')='N' then
          dbms_output.put_line('Batch:'||Z.ext_batch_id||' nothing to process');
       else
          null;
          dbms_output.put_line('Batch ID:'||Z.ext_batch_id||' is procssed');
       end if;
       dbms_output.put_line('        ');
        dbms_output.put_line('        ');
   end loop;
     delete from api_locked_file where machine_id='ADTST';
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

