--------------------------------------------------------
--  DDL for Trigger HOLDING_TESTS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "HOLDING_TESTS_BEFORE_DELETE" 
before delete
on holding_tests
for each row
begin
    insert into holding_tests_audit
	(
		audit_key,
		audit_insert_dats,
		audit_insert_user,
		unit_id,
		coll_date,
		chapter_id,
		test_id,
		test_state,
		machine_id,
		machine_flags,
		result_status_1,
		result_status_2,
		temp_result_1,
		temp_result_1_user_id,
		temp_result_2,
		temp_result_2_user_id,
		tb_id,
		test_chapter_id,
		tb_seq_no,
		well_number,
		absorbance,
		ratio,
		result_dats,
		result_user_id,
		insert_dats,
		insert_user_id,
		program_id,
		holding_status
	)
	values
	(
		:old.audit_key,
		sysdate,lt_user_session.get_userid,
		:old.unit_id,
		:old.coll_date,
		:old.chapter_id,
		:old.test_id,
		:old.test_state,
		:old.machine_id,
		:old.machine_flags,
		:old.result_status_1,
		:old.result_status_2,
		:old.temp_result_1,
		:old.temp_result_1_user_id,
		:old.temp_result_2,
		:old.temp_result_2_user_id,
		:old.tb_id,
		:old.test_chapter_id,
		:old.tb_seq_no,
		:old.well_number,
		:old.absorbance,
		:old.ratio,
		:old.result_dats,
		:old.result_user_id,
		:old.insert_dats,
		:old.insert_user_id,
		'DELETE',
		:old.holding_status
	);
end;
/
ALTER TRIGGER "HOLDING_TESTS_BEFORE_DELETE" ENABLE;
