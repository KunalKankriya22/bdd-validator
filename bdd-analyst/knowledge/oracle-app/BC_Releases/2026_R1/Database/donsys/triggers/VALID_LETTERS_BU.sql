--------------------------------------------------------
--  DDL for Trigger VALID_LETTERS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_LETTERS_BU" 
 BEFORE UPDATE
 ON VALID_LETTERS
 FOR EACH ROW
BEGIN
	insert into VALID_LETTERS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		letter_id,
		version_no,
		letter_code,
		letter_title,
		version_date,
		document_name,
		datafile_name,
		document_type,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.letter_id,
		:new.version_no,
		:new.letter_code,
		:new.letter_title,
		:new.version_date,
		:new.document_name,
		:new.datafile_name,
		:new.document_type,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_LETTERS_BU" ENABLE;
