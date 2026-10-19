--------------------------------------------------------
--  DDL for Trigger VTEST_RESULTS_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VTEST_RESULTS_INSERT_UPDATE" 
before insert  or update
on valid_test_results
for each row
declare
	temp_audit_key	  number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
    --
    insert into valid_test_results_audit
	(
		test_id, result_status, plate_seq, inter_code,
		verify_flag, number_of_repeats, attrib_group,
		attrib_code, confirm_test_id_1, confirm_test_id_2,
		eff_date, term_date, last_modified_date, SECOND_TECH, AUTO_ONLY,
		audit_key, program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.test_id,:new.result_status,:new.plate_seq,:new.inter_code,
		:new.verify_flag,:new.number_of_repeats,:new.attrib_group,
		:new.attrib_code,:new.confirm_test_id_1,:new.confirm_test_id_2,
		:new.eff_date,:new.term_date,:new.last_modified_date, :new.SECOND_TECH,:new.AUTO_ONLY,
		:new.audit_key, :new.program_id, sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VTEST_RESULTS_INSERT_UPDATE" ENABLE;
