--------------------------------------------------------
--  DDL for Trigger VALID_DIFFS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_DIFFS_BD" 
 BEFORE DELETE
 ON VALID_DIFFS
 FOR EACH ROW
BEGIN
    insert into VALID_DIFFS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		diff_code,
		chapter_id,
		diff_desc,
		formula,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.diff_code,
		:old.chapter_id,
		:old.diff_desc,
		:old.formula,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_DIFFS_BD" ENABLE;
