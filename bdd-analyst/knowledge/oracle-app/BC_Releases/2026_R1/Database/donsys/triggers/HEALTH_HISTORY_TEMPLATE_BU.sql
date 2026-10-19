--------------------------------------------------------
--  DDL for Trigger HEALTH_HISTORY_TEMPLATE_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."HEALTH_HISTORY_TEMPLATE_BU" 
 BEFORE UPDATE
 ON HEALTH_HISTORY_TEMPLATE
 FOR EACH ROW
BEGIN
	insert into HEALTH_HISTORY_TEMPLATE_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		template_id,
		chapter_id,
		question_code,
		donation_type,
		gender,
		question_description,
		valid_code_type,
		sort_sequence,
		eff_date,
		term_date,
		SCREENER_ASK,
		SUB_QUESTION_FLAG,
		PARENT_QUESTION_CODE,
		DISPLAY_ORDER,
		REPEAT_HH_FLAG,
		RANDOMIZATION_FLAG,
		ABBR_FLAG,
		PARENT_RESP_FLAG,
		GOTO_NOTES,
		ABBR_DISP_SEQ
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.template_id,
		:new.chapter_id,
		:new.question_code,
		:new.donation_type,
		:new.gender,
		:new.question_description,
		:new.valid_code_type,
		:new.sort_sequence,
		:new.eff_date,
		:new.term_date,
		:new.SCREENER_ASK,
		:new.SUB_QUESTION_FLAG,
		:new.PARENT_QUESTION_CODE,
		:new.DISPLAY_ORDER,
		:new.REPEAT_HH_FLAG,
		:new.RANDOMIZATION_FLAG,
		:new.ABBR_FLAG,
		:new.PARENT_RESP_FLAG,
		:new.GOTO_NOTES,
		:new.ABBR_DISP_SEQ
	);
end;
/
ALTER TRIGGER "DONSYS"."HEALTH_HISTORY_TEMPLATE_BU" ENABLE;
