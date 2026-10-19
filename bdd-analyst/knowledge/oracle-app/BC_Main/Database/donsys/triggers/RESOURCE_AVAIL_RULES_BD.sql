--------------------------------------------------------
--  DDL for Trigger RESOURCE_AVAIL_RULES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."RESOURCE_AVAIL_RULES_BD" 
 BEFORE DELETE
 ON RESOURCE_AVAIL_RULES
 FOR EACH ROW
BEGIN
    insert into RESOURCE_AVAIL_RULES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		resource_code,
		week_day,
		chapter_id,
		max_available,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.resource_code,
		:old.week_day,
		:old.chapter_id,
		:old.max_available,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."RESOURCE_AVAIL_RULES_BD" ENABLE;
