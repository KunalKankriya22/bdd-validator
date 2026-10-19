-- Version: 01 Modified Date: 08/12/2014
declare
  t_donor_id               donations.donor_id%type;
  t_chapter_id             chapters.chapter_id%type;
  t_dtu_cnt                number := 0;
  t_program_error_count    number := 0;
  temp_errors_exceeded     varchar2(1);

  cursor c1 is
  select unit_id, coll_date 
    from active_products
   where chapter_id = t_chapter_id
     and product_type = 'RBC';

  cursor c2 (p_donor_id in varchar2) is
  select test_id, result_code, insert_date 
    from donor_rbc_antigens
   where decode(chapter_id, 'ALL', t_chapter_id, chapter_id) = t_chapter_id
     and donor_id = p_donor_id;

  procedure insert_program_errors (p_statement_id in varchar2,
                                   p_error_msg in varchar2) is
  begin
    insert into temp_program_errors
      (module_id, statement_id,
       item_id, error_msg,
       insert_user, insert_date, program_id)
    values
      ('LOAD DTU', p_statement_id,
       null, p_error_msg,
       'SBCSYS', sysdate, 'LOAD DTU');
  end;

begin
  t_chapter_id := 'WAD';

  begin
    delete from program_errors
     where module_id = 'LOAD DTU'
       and insert_user = 'SBCSYS';

    delete from temp_program_errors;

    commit;
  end;

  for c1rec in c1 loop
    begin
      select donor_id
        into t_donor_id
        from donations
       where unit_id = c1rec.unit_id
         and coll_date = c1rec.coll_date
         and chapter_id = t_chapter_id;
    exception
      when no_data_found then
        t_donor_id := null;
        insert_program_errors ('100', 'Error: ' || 'No records found in DONATIONS for unit ' || c1rec.unit_id);
      when others then
        insert_program_errors ('101', 'Error for unit ' || c1rec.unit_id || ': ' || SQLERRM);
    end;

    if t_donor_id is not null then
      for c2rec in c2(t_donor_id) loop
        begin
          select count(*)
            into t_dtu_cnt
            from donor_tested_units
           where unit_id = c1rec.unit_id
             and coll_date = c1rec.coll_date
             and chapter_id = t_chapter_id
             and test_id = c2rec.test_id
             and result_status = c2rec.result_code;
        exception
          when others then
            t_program_error_count := t_program_error_count + 1;
            insert_program_errors ('102', 'Error for unit, test, result ' || ': ' || 
                                          c1rec.unit_id || ', ' || c2rec.test_id || ', ' || 
                                          c2rec.result_code || ' : ' || SQLERRM);
        end;

        if t_dtu_cnt = 0 then
          begin
            insert into donor_tested_units
              (unit_id, coll_date, chapter_id,
               test_id, result_status, insert_dats)
            values
              (c1rec.unit_id, c1rec.coll_date, t_chapter_id,
               c2rec.test_id, c2rec.result_code, c2rec.insert_date);
          exception
            when others then
              t_program_error_count := t_program_error_count + 1;
              insert_program_errors ('103', 'Error for unit, test, result ' || ': ' || 
                                            c1rec.unit_id || ', ' || c2rec.test_id || ', ' || 
                                            c2rec.result_code || ' : ' || SQLERRM);
          end;
        end if;
      end loop;
    end if; -- if t_donor_id is not null then
  end loop;

  if t_program_error_count >= 100 then
    temp_errors_exceeded := 'Y';
  end if;
  
  savepoint save_just_errors;
 
  begin
    insert into program_errors
    select * from temp_program_errors where module_id = 'LOAD_DTU';

    --drop table temp_program_errors;
  end;

  if temp_errors_exceeded = 'Y' then
    rollback to save_just_errors;
  end if;

  commit;
end;