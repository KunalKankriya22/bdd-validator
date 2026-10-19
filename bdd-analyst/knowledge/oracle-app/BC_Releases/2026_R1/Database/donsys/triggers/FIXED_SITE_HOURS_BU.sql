--------------------------------------------------------
--  DDL for Trigger FIXED_SITE_HOURS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."FIXED_SITE_HOURS_BU" 
 BEFORE UPDATE
 ON FIXED_SITE_HOURS
 FOR EACH ROW
BEGIN
	insert into FIXED_SITE_HOURS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		site_id,
		chapter_id,
		week_day,
		frequency_code,
		donation_type_group,
		proc_code,
		slot_time,
		break_start_time,
		break_end_time,
		no_of_beds,
		no_of_staff,
		capacity,
		overbook_limit,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.site_id,
		:new.chapter_id,
		:new.week_day,
		:new.frequency_code,
		:new.donation_type_group,
		:new.proc_code,
		:new.slot_time,
		:new.break_start_time,
		:new.break_end_time,
		:new.no_of_beds,
		:new.no_of_staff,
		:new.capacity,
		:new.overbook_limit,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."FIXED_SITE_HOURS_BU" ENABLE;
