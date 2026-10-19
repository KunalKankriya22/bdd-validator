--------------------------------------------------------
--  DDL for Trigger VALID_PROC_GROUPS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_PROC_GROUPS_BU" 
 BEFORE UPDATE
 ON VALID_PROC_GROUPS
 FOR EACH ROW
BEGIN
	insert into VALID_PROC_GROUPS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		procedure_code,
		chapter_id,
		procedure_group,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.procedure_code,
		:new.chapter_id,
		:new.procedure_group,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_PROC_GROUPS_BU" ENABLE;
