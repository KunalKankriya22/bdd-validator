--------------------------------------------------------
--  DDL for Trigger VALID_PROC_EXCLUSIONS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_PROC_EXCLUSIONS_BD" 
 BEFORE DELETE
 ON VALID_PROC_EXCLUSIONS
 FOR EACH ROW
BEGIN
    insert into VALID_PROC_EXCLUSIONS_audit
	(
		donation_type,
		procedure_code,
		inter_code,
		eff_date,
		term_date,
		insert_date,
		insert_user,
		audit_key,
		audit_insert_dats,
		program_id,
		AUDIT_INSERT_USER
	)
	values
	(
		:old.donation_type,
		:old.procedure_code,
		:old.inter_code,
		:old.eff_date,
		:old.term_date,
		:old.insert_date,
		:old.insert_user,
		:old.audit_key,
		sysdate,
		'DELETE',
		lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_PROC_EXCLUSIONS_BD" ENABLE;
