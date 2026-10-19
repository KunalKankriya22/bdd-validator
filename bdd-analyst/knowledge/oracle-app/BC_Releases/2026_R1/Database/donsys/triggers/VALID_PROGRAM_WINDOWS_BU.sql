--------------------------------------------------------
--  DDL for Trigger VALID_PROGRAM_WINDOWS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_PROGRAM_WINDOWS_BU" 
 BEFORE UPDATE
 ON VALID_PROGRAM_WINDOWS
 FOR EACH ROW
BEGIN
	insert into VALID_PROGRAM_WINDOWS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		window_name,
		chapter_id,
		appl_id,
		parm1_value,
		parm2_value,
		parm3_value,
		parm4_value,
		query_only,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.window_name,
		:new.chapter_id,
		:new.appl_id,
		:new.parm1_value,
		:new.parm2_value,
		:new.parm3_value,
		:new.parm4_value,
		:new.query_only,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_PROGRAM_WINDOWS_BU" ENABLE;
