--------------------------------------------------------
--  DDL for Trigger VALID_NOTIFIC_LETTERS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_NOTIFIC_LETTERS_BD" 
 BEFORE DELETE
 ON VALID_NOTIFIC_LETTERS
 FOR EACH ROW
BEGIN
    insert into VALID_NOTIFIC_LETTERS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		inter_code,
		chapter_id,
		donation_type,
		letter_id,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.inter_code,
		:old.chapter_id,
		:old.donation_type,
		:old.letter_id,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_NOTIFIC_LETTERS_BD" ENABLE;
