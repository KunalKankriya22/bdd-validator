--------------------------------------------------------
--  DDL for Trigger FIND_DONOR_PROGRAMS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."FIND_DONOR_PROGRAMS_BD" 
 BEFORE DELETE
 ON FIND_DONOR_PROGRAMS
 FOR EACH ROW
BEGIN
    insert into FIND_DONOR_PROGRAMS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		program_name,
		allow_create,
		multiple_selection,
		grading_level,
		update_key_info,
		allow_new,
		allow_select,
		allow_hold,
		select_allowed_levels,
		new_allowed_level,
		select_allowed_multilevel,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.program_name,
		:old.allow_create,
		:old.multiple_selection,
		:old.grading_level,
		:old.update_key_info,
		:old.allow_new,
		:old.allow_select,
		:old.allow_hold,
		:old.select_allowed_levels,
		:old.new_allowed_level,
		:old.select_allowed_multilevel,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."FIND_DONOR_PROGRAMS_BD" ENABLE;
