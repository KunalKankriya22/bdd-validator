--------------------------------------------------------
--  DDL for Trigger VALID_LETTER_ACCESSES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_LETTER_ACCESSES_BD" 
 BEFORE DELETE
 ON VALID_LETTER_ACCESSES
 FOR EACH ROW
BEGIN
    insert into VALID_LETTER_ACCESSES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		letter_id,
		access_class,
		edit_flag,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.letter_id,
		:old.access_class,
		:old.edit_flag,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_LETTER_ACCESSES_BD" ENABLE;
