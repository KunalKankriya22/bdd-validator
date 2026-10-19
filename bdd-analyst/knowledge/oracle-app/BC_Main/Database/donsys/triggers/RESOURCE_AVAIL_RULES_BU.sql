--------------------------------------------------------
--  DDL for Trigger RESOURCE_AVAIL_RULES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."RESOURCE_AVAIL_RULES_BU" 
 BEFORE UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.resource_code,
		:new.week_day,
		:new.chapter_id,
		:new.max_available,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."RESOURCE_AVAIL_RULES_BU" ENABLE;
