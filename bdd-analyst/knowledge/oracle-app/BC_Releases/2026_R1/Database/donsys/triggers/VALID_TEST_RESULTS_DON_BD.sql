--------------------------------------------------------
--  DDL for Trigger VALID_TEST_RESULTS_DON_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_TEST_RESULTS_DON_BD" 
 BEFORE DELETE
 ON VALID_TEST_RESULTS_DON
 FOR EACH ROW
BEGIN
    insert into VALID_TEST_RESULTS_DON_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		test_id,
		chapter_id,
		result_code,
		inter_code,
		notification_type,
		attrib_table,
		attrib_code,
		confirm_test1,
		confirm_test2,
		confirm_test3,
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
		:old.result_code,
		:old.inter_code,
		:old.notification_type,
		:old.attrib_table,
		:old.attrib_code,
		:old.confirm_test1,
		:old.confirm_test2,
		:old.confirm_test3,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_TEST_RESULTS_DON_BD" ENABLE;
