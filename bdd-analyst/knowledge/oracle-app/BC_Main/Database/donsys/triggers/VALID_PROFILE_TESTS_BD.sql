--------------------------------------------------------
--  DDL for Trigger VALID_PROFILE_TESTS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_PROFILE_TESTS_BD" 
 BEFORE DELETE
 ON VALID_PROFILE_TESTS
 FOR EACH ROW
BEGIN
    insert into VALID_PROFILE_TESTS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		test_id,
		chapter_id,
		required_test,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.test_id,
		:old.chapter_id,
		:old.required_test,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_PROFILE_TESTS_BD" ENABLE;
