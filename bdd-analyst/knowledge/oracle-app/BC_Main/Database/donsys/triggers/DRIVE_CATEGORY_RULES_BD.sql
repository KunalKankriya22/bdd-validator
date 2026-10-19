--------------------------------------------------------
--  DDL for Trigger DRIVE_CATEGORY_RULES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DRIVE_CATEGORY_RULES_BD" 
 BEFORE DELETE
 ON DRIVE_CATEGORY_RULES
 FOR EACH ROW
BEGIN
    insert into DRIVE_CATEGORY_RULES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		rule_id,
		chapter_id,
		drive_category,
		number_allowed,
		max_size,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.rule_id,
		:old.chapter_id,
		:old.drive_category,
		:old.number_allowed,
		:old.max_size,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."DRIVE_CATEGORY_RULES_BD" ENABLE;
