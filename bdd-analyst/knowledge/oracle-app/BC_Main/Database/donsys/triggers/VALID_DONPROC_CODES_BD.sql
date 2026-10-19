--------------------------------------------------------
--  DDL for Trigger VALID_DONPROC_CODES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_DONPROC_CODES_BD" 
 BEFORE DELETE
 ON VALID_DONPROC_CODES
 FOR EACH ROW
BEGIN
    insert into VALID_DONPROC_CODES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		donation_type,
		chapter_id,
		procedure_code,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.donation_type,
		:old.chapter_id,
		:old.procedure_code,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_DONPROC_CODES_BD" ENABLE;
