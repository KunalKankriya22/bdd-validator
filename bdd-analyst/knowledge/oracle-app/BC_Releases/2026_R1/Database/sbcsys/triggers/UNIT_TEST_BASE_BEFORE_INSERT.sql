--------------------------------------------------------
--  DDL for Trigger UNIT_TEST_BASE_BEFORE_INSERT
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "UNIT_TEST_BASE_BEFORE_INSERT" 
before insert
on unit_test_base
for each row
declare
	temp_audit_key	  number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
	--
    insert into unit_test_base_audit
	(
		unit_id, coll_date, chapter_id,
		test_seq_no, test_id, test_state,
		test_mode, temp_result_1, temp_result_1_user_id,
		temp_result_2, temp_result_2_user_id,
		result_status_1, result_status_2,
		cancel_flag, edit_result_flag,
		tb_id, test_chapter_id, tb_seq_no, well_number,
		absorbance, ratio, result_dats,
		result_user_id, testing_lab_code,
		insert_dats, insert_user_id,
		audit_key,program_id, audit_insert_dats,  audit_insert_user
	)
	values
	(
		:new.unit_id, :new.coll_date, :new.chapter_id,
		:new.test_seq_no, :new.test_id, :new.test_state,
		:new.test_mode, :new.temp_result_1, :new.temp_result_1_user_id,
		:new.temp_result_2, :new.temp_result_2_user_id,
		:new.result_status_1, :new.result_status_2,
		:new.cancel_flag, :new.edit_result_flag,
		:new.tb_id, :new.test_chapter_id, :new.tb_seq_no, :new.well_number,
		:new.absorbance, :new.ratio, :new.result_dats,
		:new.result_user_id, :new.testing_lab_code,
		:new.insert_dats, :new.insert_user_id,
		:new.audit_key,:new.program_id,sysdate, lt_user_session.get_userid
	);

  emf_util.staging_insert('UNIT_TEST_BASE', :NEW.audit_key, :NEW.program_id, 'LAB', 'unit_test_base_before_insert','I');

  -- added by M. Ansell MLT-959 10/24/18
  begin
    if :new.profile_set_id is not null then
      :new.rep_profile_set_id := :new.profile_set_id ;
    else
      begin
        select cti.profile_set_id
          into :new.rep_profile_set_id
          from contract_tests_image cti,
               units u
         where u.contract_id = cti.contract_id
           and cti.test_id   = :new.test_id
           and u.unit_id     = :new.unit_id
           and rownum = 1 ;

      exception
        when no_data_found then
          null ;
      end ;

      if :new.rep_profile_set_id is null then
        begin
          select rcp.profile_set_id
            into :new.rep_profile_set_id
            from rgt_contract_profile rcp,
                 units u
           where u.contract_id = rcp.contract_id
             and u.unit_id = :new.unit_id
             and rcp.profile_type = 'P'
             and rownum = 1 ;
        exception
          when no_data_found then
            null ;
        end ;
      end if ;
    end if ;
  end ;
end;
/
ALTER TRIGGER "UNIT_TEST_BASE_BEFORE_INSERT" ENABLE;
