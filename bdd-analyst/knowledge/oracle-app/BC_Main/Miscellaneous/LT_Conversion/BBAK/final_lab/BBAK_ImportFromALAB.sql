-- Version: 01 Modified Date: 03/20/2013
-- Version: 02 Modified Date: 03/21/2013
-- Version: 03 Modified Date: 07/16/2014
-- Version: 04 Modified Date: 08/05/2014
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
      from pooled_components@to_alab;
     --where pool_expiry_dats > sysdate; -- Commented by Kishore on 03/07/2014

    commit;
  exception
    when others then
      insert_program_errors ('204', 'Error: ' || SQLERRM);
  end;

  -- Added by Kishore on 03/07/2014. Also import records from UNITS table where POOLED_COMPONENT_ID is not null
  begin
    insert into units
    select unit_id, insert_dats, audit_seq.nextval, 
           'IMP_ALAB', coll_date, chapter_id, 
           donor_decision_code, batch_id, drive_id,
           group_site_id, contract_id, contract_suffix,
           bag_code, add_on_bags, bleed_start_time,
           bleed_end_time, bag_check_in_dats, lot_number,
           work_number, received_date, os_unit_id, 
           first_sep_centrifuge_id, first_sep_time, first_sep_weight,
           first_sep_user_id, first_sep_entry_mode, second_sep_centrifuge_id,
           second_sep_time, second_sep_weight, second_sep_user_id, 
           second_sep_entry_mode, third_sep_centrifuge_id, third_sep_time, 
           third_sep_weight, third_sep_user_id, third_sep_entry_mode,
           donor_form_abo, prior_abo, cmv_stat,
           prior_cmv_stat, system_label_decision, registry_flag,
           rare_flag, prior_rare_flag, vrare_flag,
           prior_vrare_flag, red_tube_flag, purple_tube_flag,
           serum_plasma_ind, qc_checkin_flag, qc_checkin_date, 
           qc_test_flag, qc_test_date, qc_label_flag, 
           qc_label_date, nursing_audit_flag, nursing_audit_status,
           component_review_flag, lab_dist_dats, lab_donor_dats,
           donor_lab_dats, note_id, red_tube2,
           chk_digit, unit_scheme_type, warehouse_id
      from units@to_alab
     where unit_id in (select distinct unit_id
                         from components@to_alab
                        where pooled_component_id is not null)
       and unit_id not in (select unit_id from units);

  commit;
  exception
    when others then
      insert_program_errors ('205', 'Error: ' || SQLERRM);
  end;
  -- End of change

  begin
    insert into components
    select unit_id, coll_date, chapter_id,
           component_prefix, product_code, bag_id,
           audit_seq.nextval, 'IMP_ALAB', insert_dats,
           component_status, expiry_date, system_label_decision,
           reject_reason_code, relabel_product_code, pooled_component_id,
           void_reason_code, out_of_system_dats, component_weight,
           component_count, note_id, label_user_id,
           label_dats, bags_used, warehouse_id, imp_license_flag
      from components@to_alab
     where pooled_component_id is not null
       and (unit_id, product_code) not in (select unit_id, product_code
                                             from shipped_products@to_alab) -- Added by Kishore on 07/16/2014
       and (unit_id, coll_date, product_code, component_prefix) not in (select unit_id, coll_date, product_code, component_prefix from components); -- Added by Kishore on 08/05/2014

    commit;
  exception
    when others then
      insert_program_errors ('206', 'Error: ' || SQLERRM);
  end;
  -- End of change
  
  begin
    insert into component_interdictions
    select unit_id, coll_date, chapter_id,
           product_code, inter_code, insert_dats, 
           inter_user_id, audit_seq.nextval, 'IMP_ALAB'
      from component_interdictions@to_alab
     where (unit_id, product_code) in (select unit_id, product_code
                                         from components)
       and (unit_id, product_code) not in (select unit_id, product_code
                                             from shipped_products@to_alab); -- Added by Kishore on 07/16/2014
                                       
    commit;
  exception
    when others then
      insert_program_errors ('207', 'Error: ' || SQLERRM);
  end;

  begin
    insert into note_books
    select a.note_id, a.note
      from note_books@to_alab a, units@to_alab b
     where a.note_id = nvl(b.note_id, -99);
  exception
    when others then
      insert_program_errors ('208', 'Error: ' || SQLERRM);
  end;

  begin
    update units
       set note_id = (select note_id
                        from units@to_alab a
                       where a.unit_id = units.unit_id
                         and a.chapter_id = units.chapter_id);
  exception
    when others then
      insert_program_errors ('209', 'Error: ' || SQLERRM);
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