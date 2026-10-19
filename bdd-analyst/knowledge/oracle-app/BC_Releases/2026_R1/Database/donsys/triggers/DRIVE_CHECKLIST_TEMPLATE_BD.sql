--------------------------------------------------------
--  DDL for Trigger DRIVE_CHECKLIST_TEMPLATE_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DRIVE_CHECKLIST_TEMPLATE_BD" 
 BEFORE DELETE
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
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.sponsor_id,
		:old.chapter_id,
		:old.action_code,
		:old.time_flag,
		:old.target_days,
		:old.sort_seq,
		:old.action_flag,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."DRIVE_CHECKLIST_TEMPLATE_BD" ENABLE;
