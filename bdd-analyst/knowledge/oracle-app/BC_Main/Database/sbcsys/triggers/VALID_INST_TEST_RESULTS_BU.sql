--------------------------------------------------------
--  DDL for Trigger VALID_INST_TEST_RESULTS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_INST_TEST_RESULTS_BU" 
before update
on valid_instrument_test_results
for each row
begin
    :new.last_modified_date := sysdate;
	insert into valid_inst_test_results_audit
	(
		chapter_id,
		machine_id,
		test_id,
		result_status,
		machine_result_status,
		eff_date,
		term_date,
		insert_user_id,
		insert_date,
		last_modified_date,
		program_id,
		audit_key,
		audit_insert_dats,
		audit_insert_user
	)
	values
	(
		:new.chapter_id,
		:new.machine_id,
		:new.test_id,
		:new.result_status,
		:new.machine_result_status,
		:new.eff_date,
		:new.term_date,
		:new.insert_user_id,
		:new.insert_date,
		:new.last_modified_date,
		:new.program_id,
		:new.audit_key,
		sysdate,
		lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_INST_TEST_RESULTS_BU" ENABLE;
