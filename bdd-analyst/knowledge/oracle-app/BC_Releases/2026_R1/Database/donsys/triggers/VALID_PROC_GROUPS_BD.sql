--------------------------------------------------------
--  DDL for Trigger VALID_PROC_GROUPS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_PROC_GROUPS_BD" 
 BEFORE DELETE
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
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.procedure_code,
		:old.chapter_id,
		:old.procedure_group,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_PROC_GROUPS_BD" ENABLE;
