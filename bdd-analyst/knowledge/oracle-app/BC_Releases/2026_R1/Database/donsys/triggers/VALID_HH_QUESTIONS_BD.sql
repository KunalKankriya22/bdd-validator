--------------------------------------------------------
--  DDL for Trigger VALID_HH_QUESTIONS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HH_QUESTIONS_BD" 
 BEFORE DELETE
 ON VALID_HH_QUESTIONS
 FOR EACH ROW
BEGIN
    insert into VALID_HH_QUESTIONS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		question_code,
		chapter_id,
		gender,
		question_description,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.question_code,
		:old.chapter_id,
		:old.gender,
		:old.question_description,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_HH_QUESTIONS_BD" ENABLE;
