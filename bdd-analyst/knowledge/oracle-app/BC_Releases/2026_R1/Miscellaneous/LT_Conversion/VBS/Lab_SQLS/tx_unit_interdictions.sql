-- **************************************************************************
-- PROGRAM      : TX_UNIT_INTERDICTIONS.SQL
-- PURPOSE      : This script would convert all the data for interdictions
--                of ACTIVE module from temporary tables into the required 
--                LifeTrak /Lab - Distribution tables.
-- **************************************************************************
DECLARE
  last_id             varchar2(15);
  l_audit_seq     number := 0;
  cnt             number(5):=0; 
  tot_cnt         number  :=0;
  c_reject_code   varchar2(5);
  c_stmt          number(5);
  c_err_msg       varchar2(60);
  c_err_flg       varchar2(1);
  c_err_cd        varchar2(2);
  c_insert_user   varchar2(6);
  pgm_error       exception;
  c_error_cnt     number :=0;
  c_item_id       varchar2(30);
  c_exit_flg      varchar2(1):='N';

  cursor c1 is
    select * from convert_unit_interdictions
     where unit_id in ( select a.unit_id from convert_units a)
     order by unit_id;

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
                                'TX_UNIT_INTERDICTIONS',
                                c_stmt,
                                c_item_id,
                                c_err_msg,
                                'CONVRT',
                                sysdate);
  end;

  procedure update_reconcile(reject_code varchar2) is
  begin
    update x_recon_table 
    set column_count = reject_code || '*' || to_char(substr(column_count, instr(column_count, '*', 1)+1) + 1) ,
                             commit_date  = sysdate
     where program_id    = 'TX_UNIT_INTERDICTIONS'
       and column_name   = 'REJECT_CODE'
       and column_value  = reject_code;

    if sql%rowcount = 0 then 
      insert into x_recon_table(program_id,
                                column_name,
                                column_value,
                                column_count,
                                commit_date,
                                sort_sequence)
       values ( 'TX_UNIT_INTERDICTIONS',
                                'REJECT_CODE',
                                reject_code,
                                reject_code || '*' || '1',
                                sysdate,
                                1);
    end if;
  end;

  procedure update_total_count is
  begin
    update x_recon_table 
       set column_count = tot_cnt,
           commit_date  = sysdate
     where program_id    = 'TX_UNIT_INTERDICTIONS'
       and column_name   = 'TOTALS'
       and column_value  = 'TOTALS';

    if sql%rowcount = 0 then 
      insert into x_recon_table(program_id,
                                column_name,
                                column_value,
                                column_count,
                                commit_date,
                                sort_sequence)
       values ( 'TX_UNIT_INTERDICTIONS',
                                'TOTALS',
                                'TOTALS',
                                tot_cnt,
                                sysdate,
                                2);
    end if;
  end;

begin
  -- Get the restart point
  begin
    select to_number(restart_value)
      into last_id
      from x_restart_table
     where program_id='TX_UNIT_INTERDICTIONS'
       and restart_id='UNIT_ID';
  exception
    when no_data_found then
      last_id :=0;
      insert into x_restart_table( program_id,
                                   restart_id,
                                   restart_value,
                                   program_start_time,
                                   last_commit_date)
           values( 'TX_UNIT_INTERDICTIONS',
                                   'UNIT_ID',
                                   '0',
                                   sysdate,
                                   sysdate);

  end;

  for c1_rec in c1
  loop
    begin
      cnt := cnt+1;
      tot_cnt := tot_cnt +1;

      savepoint S1;

      c_stmt :=10;
      
      -- Translate the values to get equivalent LifeTrak values
      begin
        select life_reject_code
          into c_reject_code
          from x_interdictions
         where ltrim(rtrim(oldsys_reject_code))=c1_rec.reject_code;
      exception
            when no_data_found then
              c_reject_code := c1_rec.reject_code;
              -- c_err_msg := substr(sqlerrm,1,60);
              -- raise pgm_error;
      end;        

      -- Get nextval for audit_seq
          c_stmt := 19;
          select audit_seq.nextval into l_audit_seq from dual;

      -- Insert data into unit_interdictions table
      c_stmt := 20;
      insert into unit_interdictions (  UNIT_ID         ,
                                COLL_DATE       ,
                                CHAPTER_ID      ,
                                INTER_CODE      ,
                                INSERT_DATS     ,
                                INTER_USER_ID   ,
                                AUDIT_KEY       ,
                                PROGRAM_ID      )
          values (      c1_rec.unit_id          ,
                                trunc(c1_rec.coll_date) ,
                                'WAD'                   ,
                                c_reject_code           ,
                                c1_rec.reject_date      ,
                                c1_rec.reject_by        ,
                                l_audit_seq     ,
                                'CONVRT'                );

      -- Reconcile the counts
      update_reconcile(c1_rec.reject_code);

      if cnt > 99 then
        -- Update restart point
        update x_restart_table set restart_value = c1_rec.unit_id,
               last_commit_date=sysdate
             where program_id='TX_UNIT_INTERDICTIONS'
               and restart_id='UNIT_ID';

            -- Update the total count
            update_total_count;

        commit;  -- Commit the transaction for every record.
            cnt := 0;
      end if;

    exception
      when pgm_error then
            rollback to savepoint S1;
        c_item_id := c1_rec.unit_id;
            insert_error;
        if c_exit_flg = 'Y' then
              exit;
        end if;

      when others then
            rollback to savepoint S1;
            c_err_msg := substr(sqlerrm,1,60);
        c_item_id := c1_rec.unit_id;
        insert_error;
        if c_exit_flg = 'Y' then
              exit;
        end if;
    end;
  end loop;

update_total_count;
commit;
end;
/
