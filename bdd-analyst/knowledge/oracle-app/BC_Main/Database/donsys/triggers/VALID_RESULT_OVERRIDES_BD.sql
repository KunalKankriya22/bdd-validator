--------------------------------------------------------
--  DDL for Trigger VALID_RESULT_OVERRIDES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_RESULT_OVERRIDES_BD" 
 BEFORE DELETE
 ON VALID_RESULT_OVERRIDES
 FOR EACH ROW
BEGIN
    insert into VALID_RESULT_OVERRIDES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		test_id	,
		chapter_id,
		current_result_status,
		new_result_status,
		override_flag,
		inter_code,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.test_id	,
		:old.chapter_id,
		:old.current_result_status,
		:old.new_result_status,
		:old.override_flag,
		:old.inter_code,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_RESULT_OVERRIDES_BD" ENABLE;
