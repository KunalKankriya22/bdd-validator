--------------------------------------------------------
--  DDL for Trigger VALID_WINDOWS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_WINDOWS_BD" 
 BEFORE DELETE
 ON VALID_WINDOWS
 FOR EACH ROW
BEGIN
    insert into VALID_WINDOWS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		window_name,
		chapter_id,
		title,
		appl_id,
		parm_1,
		parm_2,
		parm_3,
		parm_4,
		x_pos,
		y_pos,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.window_name,
		:old.chapter_id,
		:old.title,
		:old.appl_id,
		:old.parm_1,
		:old.parm_2,
		:old.parm_3,
		:old.parm_4,
		:old.x_pos,
		:old.y_pos,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_WINDOWS_BD" ENABLE;
