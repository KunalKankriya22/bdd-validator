---
tags:
  - trigger
  - DONSYS
---
# HEALTH_HISTORY_TEMPLATE_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/HEALTH_HISTORY_TEMPLATE|HEALTH_HISTORY_TEMPLATE]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
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
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.template_id,
		:old.chapter_id,
		:old.question_code,
		:old.donation_type,
		:old.gender,
		:old.question_description,
		:old.valid_code_type,
		:old.sort_sequence,
		:old.eff_date,
		:old.term_date,
		:old.SCREENER_ASK,
		:old.SUB_QUESTION_FLAG,
		:old.PARENT_QUESTION_CODE,
		:old.DISPLAY_ORDER,
		:old.REPEAT_HH_FLAG,
		:old.RANDOMIZATION_FLAG,
		:old.ABBR_FLAG,
		:old.PARENT_RESP_FLAG,
		:old.GOTO_NOTES,
		:old.ABBR_DISP_SEQ
	);
end;
```
