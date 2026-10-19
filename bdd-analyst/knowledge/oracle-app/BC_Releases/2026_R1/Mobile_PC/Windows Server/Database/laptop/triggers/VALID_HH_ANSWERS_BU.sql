--------------------------------------------------------
--  DDL for Trigger VALID_HH_ANSWERS_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "VALID_HH_ANSWERS_BU" 
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
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
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
		:new.term_date
	);
end;
/
ALTER TRIGGER "VALID_HH_ANSWERS_BU" ENABLE;
