declare
   total_don number;
   ref_list_id varchar2(10);
   g_chapteR_id varchar2(4);
   cursor c_get_list_id is
        select list_id from donor_list_header
        where list_status not in ('RELEASED') and list_id like 'LIST%'
        and nvl(list_term_date,sysdate)<sysdate;

   cursor C_call_code (ref_list_id varchar2) IS
          select call_code,count(*) total
            from donor_lists
           where list_id = ref_list_id and
                 chapter_id = g_chapter_id and
                 call_code is not null
           group by call_code;

   cursor C_called_user (ref_list_id varchar2) IS
          select called_user,count(*) total
            from donor_lists
           where list_id = ref_list_id and
                 chapter_id = g_chapter_id and
                 called_user is not null
           group by called_user;

   cursor C_sched_user (ref_list_id varchar2) IS
          select sched_user,count(*) total
            from donor_lists
           where list_id = ref_list_id and
                 chapter_id = g_chapter_id and
                 sched_user is not null
           group by sched_user ;
BEGIN
   select chapter_id into g_chapter_id from system_users where user_id=user;
   for listhdr in  c_get_list_id
   loop
     begin
      ref_list_id:=listhdr.list_id;
      select count(*) into total_don
        from donor_lists
       where list_id = ref_list_id and
             chapter_id = g_chapter_id;
      for c1 in C_call_code (ref_list_id) loop
         begin
          insert into list_stats
                ( LIST_ID        ,
                  CHAPTER_ID     ,
                  ENTITY_TYPE,
                  ENTITY_CODE,
                  CODE_COUNT  ,   
                  PROGRAM_ID   ,  
                  INSERT_DATE,
                  INSERT_USER )
          values
                 ( ref_list_id,
                   g_chapter_id,
                   'CCODE',
                   c1.call_code,
                   c1.total,
                   'BATCHREL',
                   sysdate,
                   decode(substr(user,1,3),'OPS', substr(user,5),user)
                  );
         exception
             when no_data_found then null;
            when others then
                 dbms_output.put_line('Error occured 11111');
         end;
       end loop;
      for c1 in C_called_user (ref_list_id) loop
         begin
          insert into list_stats
                ( LIST_ID        ,
                  CHAPTER_ID     ,
                  ENTITY_TYPE,
                  ENTITY_CODE,
                  CODE_COUNT  ,   
                  PROGRAM_ID   ,  
                  INSERT_DATE,
                  INSERT_USER )
          values
                 ( ref_list_id,
                   g_chapter_id,
                   'CUSER',
                   c1.called_user,
                   c1.total,
                   'BATCHREL',
                   sysdate,
                   decode(substr(user,1,3),'OPS', substr(user,5),user)
                  );
         exception
             when no_data_found then null;
            when others then
                 dbms_output.put_line('Error 22222222');
         end;
       end loop;
      for c1 in C_sched_user (ref_list_id) loop
         begin
          insert into list_stats
                ( LIST_ID        ,
                  CHAPTER_ID     ,
                  ENTITY_TYPE,
                  ENTITY_CODE,
                  CODE_COUNT  ,   
                  PROGRAM_ID   ,  
                  INSERT_DATE,
                  INSERT_USER )
          values
                 ( ref_list_id,
                   g_chapter_id,
                   'SUSER',
                   c1.sched_user,
                   c1.total,
                   'BATCHREL',
                   sysdate,
                   decode(substr(user,1,3),'OPS', substr(user,5),user)
                  );
         exception
             when no_data_found then null;
            when others then
                 dbms_output.put_line('Error 22222222');
         end;
       end loop;
       --- now update the list header
       begin
          update donor_list_header set
                 list_status='RELEASED', 
                 release_date = sysdate,
                 release_user = decode(substr(user,1,3),'OPS', substr(user,5),user),
                 actual_size = total_don
           where list_id = ref_list_id and
                 chapter_id = g_chapter_id;
       exception
           when no_data_found then null;
          when others then
               dbms_output.put_line('Error 22222222');
       end;
       --- now delete the list 
       begin
          delete from donor_lists
                 where list_id = ref_list_id;
       exception
           when no_data_found then null;
          when others then
               dbms_output.put_line('Error 33333333');
       end;
       begin
          delete from donor_list_log
                 where list_id = ref_list_id;
       exception
           when no_data_found then null;
          when others then
               dbms_output.put_line('Error 4444444');
       end;
  end;
   commit;
end loop;
END;
/
exit

