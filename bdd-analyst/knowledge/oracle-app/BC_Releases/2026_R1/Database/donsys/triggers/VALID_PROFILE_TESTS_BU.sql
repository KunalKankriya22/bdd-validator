--------------------------------------------------------
--  DDL for Trigger VALID_PROFILE_TESTS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_PROFILE_TESTS_BU" 
 BEFORE UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.test_id,
		:new.chapter_id,
		:new.required_test,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_PROFILE_TESTS_BU" ENABLE;
