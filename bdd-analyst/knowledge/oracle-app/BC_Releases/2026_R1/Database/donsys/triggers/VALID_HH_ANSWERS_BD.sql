--------------------------------------------------------
--  DDL for Trigger VALID_HH_ANSWERS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HH_ANSWERS_BD" 
 BEFORE DELETE
 ON VALID_HH_ANSWERS
 FOR EACH ROW
BEGIN
    insert into VALID_HH_ANSWERS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		chapter_id,
		question_code,
		answer_code,
		response,
		inter_code,
		deferral_period,
		period_type,
		minimum_period,
		answer_desc,
		eff_date,
		term_date,
		COMMENT_REQ
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		LT_USER_SESSION.GET_USERID,
		:old.chapter_id,
		:old.question_code,
		:old.answer_code,
		:old.response,
		:old.inter_code,
		:old.deferral_period,
		:old.period_type,
		:old.minimum_period,
		:old.answer_desc,
		:old.eff_date,
		:old.term_date,
		:old.COMMENT_REQ
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_HH_ANSWERS_BD" ENABLE;
