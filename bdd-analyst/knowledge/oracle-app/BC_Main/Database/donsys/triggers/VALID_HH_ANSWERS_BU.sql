--------------------------------------------------------
--  DDL for Trigger VALID_HH_ANSWERS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HH_ANSWERS_BU" 
 BEFORE UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		LT_USER_SESSION.GET_USERID,
		:new.chapter_id,
		:new.question_code,
		:new.answer_code,
		:new.response,
		:new.inter_code,
		:new.deferral_period,
		:new.period_type,
		:new.minimum_period,
		:new.answer_desc,
		:new.eff_date,
		:new.term_date,
		:new.COMMENT_REQ
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_HH_ANSWERS_BU" ENABLE;
