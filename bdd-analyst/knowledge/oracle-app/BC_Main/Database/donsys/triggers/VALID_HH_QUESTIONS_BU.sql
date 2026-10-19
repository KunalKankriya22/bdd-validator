--------------------------------------------------------
--  DDL for Trigger VALID_HH_QUESTIONS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HH_QUESTIONS_BU" 
 BEFORE UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.question_code,
		:new.chapter_id,
		:new.gender,
		:new.question_description,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_HH_QUESTIONS_BU" ENABLE;
