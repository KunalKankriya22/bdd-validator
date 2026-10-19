--------------------------------------------------------
--  DDL for Trigger VALID_RBC_GROUPS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_RBC_GROUPS_BD" 
 BEFORE DELETE
 ON VALID_RBC_GROUPS
 FOR EACH ROW
BEGIN
    insert into VALID_RBC_GROUPS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		group_id,
		chapter_id,
		test_id,
		result_code,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.group_id,
		:old.chapter_id,
		:old.test_id,
		:old.result_code,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_RBC_GROUPS_BD" ENABLE;
