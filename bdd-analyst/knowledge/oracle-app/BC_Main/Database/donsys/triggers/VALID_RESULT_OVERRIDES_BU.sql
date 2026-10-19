--------------------------------------------------------
--  DDL for Trigger VALID_RESULT_OVERRIDES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_RESULT_OVERRIDES_BU" 
 BEFORE UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.test_id	,
		:new.chapter_id,
		:new.current_result_status,
		:new.new_result_status,
		:new.override_flag,
		:new.inter_code,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_RESULT_OVERRIDES_BU" ENABLE;
