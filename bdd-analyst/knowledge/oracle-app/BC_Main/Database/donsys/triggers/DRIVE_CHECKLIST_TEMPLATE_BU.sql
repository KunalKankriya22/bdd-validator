--------------------------------------------------------
--  DDL for Trigger DRIVE_CHECKLIST_TEMPLATE_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DRIVE_CHECKLIST_TEMPLATE_BU" 
 BEFORE UPDATE
 ON DRIVE_CHECKLIST_TEMPLATE
 FOR EACH ROW
BEGIN
	insert into DRIVE_CHECKLIST_TEMPLATE_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		sponsor_id,
		chapter_id,
		action_code,
		time_flag,
		target_days,
		sort_seq,
		action_flag,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.sponsor_id,
		:new.chapter_id,
		:new.action_code,
		:new.time_flag,
		:new.target_days,
		:new.sort_seq,
		:new.action_flag,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."DRIVE_CHECKLIST_TEMPLATE_BU" ENABLE;
