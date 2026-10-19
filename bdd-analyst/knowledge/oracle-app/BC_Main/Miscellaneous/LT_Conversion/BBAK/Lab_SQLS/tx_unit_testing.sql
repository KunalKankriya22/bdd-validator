-- *************************************************************************
-- PROGRAM      : TX_UNIT_TESTING.SQL
-- PURPOSE      : This script would convert all the data for test results
--                of ACTIVE module from temporary tables into the required 
--                LifeTrak /Lab - Distribution tables.
-- *************************************************************************
DECLARE
  last_id         varchar2(15);
  cnt             number(5):=0; 
  tot_cnt         number  :=0;
  tot_ant         number  :=0;
  c_test_id       varchar2(10);
  c_result        varchar2(4);
  c_blood_type    varchar2(4);
  c_stmt          number(5);
  c_err_msg       varchar2(60);
  c_err_flg       varchar2(1);
  c_err_cd        varchar2(2);
  c_insert_user   varchar2(6);
  pgm_error       exception;
  c_error_cnt     number :=0;
  c_item_id       varchar2(30);
  c_exit_flg      varchar2(1):='N';


  cursor c2 is select * from convert_unit_tests
   order by unit_id,test_id;

 /* cursor c3(p_unit_id varchar2) is 
    select * from convert_antigen_units
     where unit_id = p_unit_id
       and test_id not like 'H%';
*/

  procedure insert_error is
  begin
    c_error_cnt := c_error_cnt +1;
    if c_error_cnt>100 then
      c_err_msg := 'Reached maximum no of errors';
      c_exit_flg := 'Y';
    end if;

    insert into program_errors( module_id,
                                program_id,
                                statement_id,
                                item_id,
                                error_msg,
                                insert_user,
                                insert_date)
                        values( 'ACTIVECONV',
                                'TX_UNIT_TESTING',
                                c_stmt,
                                c_item_id,
                                c_err_msg,
                                'CONVERT',
                                sysdate);
  end;

begin


      for c2_rec in c2
      loop
      begin  
        cnt := cnt+1;
        tot_cnt := tot_cnt +1;

        c_stmt := 20;
      
        -- Translate the values to get equivalent LifeTrak values
        begin
          select lt_test_id
            into c_test_id
            from x_testing
           where ltrim(rtrim(bbcs_test_id)) = c2_rec.test_id;
        exception
          when no_data_found then
            c_test_id := c2_rec.test_id;
           -- c_err_msg := substr(sqlerrm,1,60);
           -- raise pgm_error;
        end;      

        c_stmt := 25;
        c_result:=c2_rec.result_code;

     /*   begin
          select life_blood_type
            into c_result
            from x_blood_types
           where ltrim(rtrim(oldsys_blood_type)) = c2_rec.result;
        exception
          when no_data_found then
            c_result := c2_rec.result;
           -- c_err_msg := substr(sqlerrm,1,60);
           -- raise pgm_error;
        end;      

     */

        c_stmt := 30;

        -- Insert data into UTRS table
      begin
         insert into UTRS(       UNIT_ID         ,
                                COLL_DATE       ,
                                CHAPTER_ID      ,
                                TEST_SEQ_NO     ,
                                TEST_ID ,
                                RESULT_STATUS_1 ,
                                TB_ID   ,
                                TEST_CHAPTER_ID ,
                                RESULT_DATS     ,
                                RESULT_USER_ID  ,
                                TESTING_LAB_CODE        ,
                                INSERT_DATS     ,
                                INSERT_USER_ID  ,
                                AUDIT_KEY       ,
                                PROGRAM_ID      )
                values (        c2_rec.unit_id          ,
                                trunc(c2_rec.coll_date) ,
                                'WAD'                   ,
                                nvl(c2_rec.test_seq_no,'1') ,
                                c_test_id               ,
                                c_result        ,
                                'CONVER0001'    ,
                                'WAD'           ,
                                c2_rec.result_date      ,
                                c2_rec.result_user      ,
                                '99'    ,
                                nvl(c2_rec.result_date,c2_rec.coll_date),
                                nvl(c2_rec.result_user,'CONV'),
                                audit_seq.nextval       ,
                                '590A'               );
            exception when others then 
              if sqlerrm like 'ORA-000%' then
                 null;
              else
                  dbms_output.put_line(sqlerrm);
                  c_err_msg:=substr(sqlerrm,1,200);
                 raise pgm_error;
              end if;
        end;
 

      /* for c3_rec in c3(c1_rec.unit_id)
      loop
        cnt := cnt+1;
        tot_ant := tot_ant +1;

        c_stmt := 40;
      
        -- Translate the values to get equivalent LifeTrak values
        begin
          select life_antigen_code, life_result
            into c_test_id, c_result
            from x_antigens
           where ltrim(rtrim(oldsys_antigen_code)) = c3_rec.test_id;
        exception
          when no_data_found then
            c_test_id := substr(c3_rec.test_id,1,length(c3_rec.test_id)-1);
            c_result := substr(c3_rec.test_id, -1);
           -- c_err_msg := substr(sqlerrm,1,60);
           -- raise pgm_error;
        end;      

        c_stmt := 50;

        -- Insert data into UTRS table
        insert into UTRS(       UNIT_ID         ,
                                COLL_DATE       ,
                                CHAPTER_ID      ,
                                TEST_SEQ_NO     ,
                                TEST_ID ,
                                RESULT_STATUS_1 ,
                                TB_ID   ,
                                TEST_CHAPTER_ID ,
                                RESULT_DATS     ,
                                RESULT_USER_ID  ,
                                TESTING_LAB_CODE        ,
                                INSERT_DATS     ,
                                INSERT_USER_ID  ,
                                AUDIT_KEY       ,
                                PROGRAM_ID      )
                values (        c3_rec.unit_id          ,
                                trunc(c3_rec.coll_date) ,
                                'WAD'                   ,
                                1       ,
                                c_test_id               ,
                                c_result        ,
                                'ANTBAT0001'    ,
                                'WAD'           ,
                                c3_rec.coll_date        ,
                                'CONVERT'       ,
                                '99'    ,
                                c3_rec.coll_date        ,
                                'CONVERT'       ,
                                audit_seq.nextval       ,
                                'CONVERT'               );

        c_stmt := 55;

        -- Insert data into UNIT_ATTRIBUTES table, for antigens
        insert into unit_attributes(    UNIT_ID         ,
                                coll_date,
                                chapter_id,
                                attrib_group,
                                attrib_code,
                                source_test_id,
                                status_flag,
                                stop_label_flag,
                                insert_dats,
                                insert_user_id,
                                audit_key,
                                program_id)
                values (        c3_rec.unit_id          ,
                                trunc(c3_rec.coll_date) ,
                                'WAD'                   ,
                                'ALERT',
                                c_test_id,
                                null,
                                'O',
                                'N',
                                c3_rec.coll_date,
                                'CONVERT',
                                audit_seq.nextval,
                                'CONVERT');

        -- Update reconcilliation counts
        update_reconcile(c3_rec.test_id, c_result, 'ANTIGEN');
      end loop;
   */

      if cnt > 99 then
         commit;  -- Commit the transaction for every 100 records.
         cnt := 0;
      end if;

    exception
      when pgm_error then
        c_item_id := c2_rec.unit_id;
        insert_error;
        if c_exit_flg = 'Y' then
          exit;
        end if;

      when others then
        c_err_msg := substr(sqlerrm,1,60);
        c_item_id := c2_rec.unit_id;
        insert_error;
        if c_exit_flg = 'Y' then
          exit;
        end if;
    end;
  end loop;

  commit;
end;
/
