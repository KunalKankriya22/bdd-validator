--------------------------------------------------------
--  DDL for Trigger VALID_TESTS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_TESTS_BEFORE_DELETE" 
before delete
on valid_tests
for each row
begin
    insert into valid_tests_audit
	(
		test_id,test_desc,
		test_short_id, test_group,
		antigen_flag, edit_result_flag,
		discrepancy_flag, eff_date,term_date,
		last_modified_date,SERVICE_CODE, TESTING_CHARGES_CURR,
		TESTING_CHARGES_NEW, IMPLEMENT_DATS, NO_OF_TECH,
		FULL_TECH_2, AUTO_SCHEDULE,
		audit_key, program_id, audit_insert_dats,audit_insert_user
	)
	values
	(
		:old.test_id,:old.test_desc,
		:old.test_short_id, :old.test_group,
		:old.antigen_flag, :old.edit_result_flag,
		:old.discrepancy_flag,:old.eff_date,:old.term_date,
		:old.last_modified_date, :old.SERVICE_CODE, :old.TESTING_CHARGES_CURR,
		:old.TESTING_CHARGES_NEW, :old.IMPLEMENT_DATS, :old.NO_OF_TECH,
		:old.FULL_TECH_2, :old.AUTO_SCHEDULE,
		:old.audit_key, 'DELETE', sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_TESTS_BEFORE_DELETE" ENABLE;
