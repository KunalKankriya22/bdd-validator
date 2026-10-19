-- Version: 01 Modified Date: 03/20/2013
-- Version: 02 Modified Date: 03/21/2013
declare
  t_unit_id               units.unit_id%type;
  t_chapter_id            units.chapter_id%type;
  t_program_error_count   number := 0;
  temp_errors_exceeded    varchar2(1);
  
  cursor c_nb is
  select b.unit_id, a.*
    from note_books@to_alab a, units@to_alab b
   where a.note_id = nvl(b.note_id, -99);
                       
  procedure insert_program_errors (p_statement_id in varchar2,
                                   p_error_msg in varchar2) is
  begin
    insert into temp_program_errors
      (module_id, statement_id,
       item_id, error_msg,
       insert_user, insert_date, program_id)
    values
      ('IMPORT FROM ALAB', p_statement_id,
       null, p_error_msg,
       'SBCSYS', sysdate, 'IMPORT FROM ALAB');
  end;
  
begin
  begin
    delete from program_errors
     where module_id = 'IMPORT FROM ALAB'
       and insert_user = 'SBCSYS';

    delete from temp_program_errors;

    commit;
  end;
  
  begin
    insert into utrs
    select unit_id, coll_date, chapter_id,
           test_seq_no, test_id, test_state,
           test_mode, result_status_1, result_status_2,
           cancel_flag, edit_result_flag, tb_id,
           test_chapter_id, tb_seq_no, well_number,
           absorbance, ratio, result_dats,
           result_user_id, testing_lab_code, insert_dats,
           insert_user_id, audit_seq.nextval, 'IMP_ALAB', extract_date
      from utrs@to_alab
     where unit_id in (select unit_id
                         from units);
                         
    commit;
  exception
    when others then
      insert_program_errors ('201', 'Error: ' || SQLERRM);
  end;
  
  begin
    insert into unit_attributes
    select unit_id, coll_date, chapter_id,
           attrib_group, attrib_code, source_test_id,
           status_flag, stop_label_flag, insert_dats,
           insert_user_id, audit_seq.nextval, 'IMP_ALAB'
      from unit_attributes@to_alab
     where unit_id in (select unit_id
                         from units);
    
    commit;
  exception
    when others then
      insert_program_errors ('202', 'Error: ' || SQLERRM);
  end;

  -- Added by Kishore on 03/21/2013
  begin
    insert into unit_interdictions
    select unit_id, coll_date, chapter_id,
           inter_code, insert_dats, inter_user_id, 
           source_test_id, audit_seq.nextval, 'IMP_ALAB'
      from unit_interdictions@to_alab
     where unit_id in (select unit_id
                         from units);
    
    commit;
  exception
    when others then
      insert_program_errors ('203', 'Error: ' || SQLERRM);
  end;

  begin
    insert into pooled_components
    select pool_id, chapter_id, patient_id,
           patient_first_name, patient_last_name, facility,
           product_code, bag_id, lot_number,
           filter_lot_number, inter_code, pool_dats,
           pool_expiry_dats, pool_insert_dats, pool_user_id,
           audit_seq.nextval, 'IMP_ALAB', pooled_aborh
      from pooled_components@to_alab
     where pool_expiry_dats > sysdate;

    commit;
  exception
    when others then
      insert_program_errors ('204', 'Error: ' || SQLERRM);
  end;

  begin
    insert into components
    select unit_id, coll_date, chapter_id,
           component_prefix, product_code, bag_id,
           audit_seq.nextval, 'IMP_ALAB', insert_dats,
           component_status, expiry_date, system_label_decision,
           reject_reason_code, relabel_product_code, pooled_component_id,
           void_reason_code, out_of_system_dats, component_weight,
           component_count, note_id, label_user_id,
           label_dats, bags_used, warehouse_id
      from components@to_alab
     where pooled_component_id is not null;

    commit;
  exception
    when others then
      insert_program_errors ('205', 'Error: ' || SQLERRM);
  end;
  -- End of change
  
  begin
    insert into component_interdictions
    select unit_id, coll_date, chapter_id,
           product_code, inter_code, insert_dats, 
           inter_user_id, audit_seq.nextval, 'IMP_ALAB'
      from component_interdictions@to_alab
     where (unit_id, product_code) in (select unit_id, product_code
                                         from components);
                                       
    commit;
  exception
    when others then
      insert_program_errors ('206', 'Error: ' || SQLERRM);
  end;

  begin
    insert into note_books
    select a.note_id, a.note
      from note_books@to_alab a, units@to_alab b
     where a.note_id = nvl(b.note_id, -99);
  exception
    when others then
      insert_program_errors ('207', 'Error: ' || SQLERRM);
  end;

  begin
    update units
       set note_id = (select note_id
                        from units@to_alab a
                       where a.unit_id = units.unit_id
                         and a.chapter_id = units.chapter_id);
  exception
    when others then
      insert_program_errors ('208', 'Error: ' || SQLERRM);
  end;
  
  begin
    select count(*)
      into t_program_error_count
      from program_errors
     where module_id = 'IMPORT FROM ALAB'
       and insert_user = 'SBCSYS';
  end;

  if t_program_error_count >= 100 then
    --commit;
    temp_errors_exceeded := 'Y';
  end if;
  
  savepoint save_just_errors;
  
  begin
    insert into program_errors
    select * from temp_program_errors;

    --drop table temp_program_errors;
  end;

  if temp_errors_exceeded = 'Y' then
    rollback to save_just_errors;
  end if;

  commit;
end;