--------------------------------------------------------
--  DDL for Trigger VALID_NOTIFIC_LETTERS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_NOTIFIC_LETTERS_BU" 
 BEFORE UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.inter_code,
		:new.chapter_id,
		:new.donation_type,
		:new.letter_id,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_NOTIFIC_LETTERS_BU" ENABLE;
