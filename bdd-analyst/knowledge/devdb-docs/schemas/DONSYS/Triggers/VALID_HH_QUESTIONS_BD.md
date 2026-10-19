---
tags:
  - trigger
  - DONSYS
---
# VALID_HH_QUESTIONS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_HH_QUESTIONS|VALID_HH_QUESTIONS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into DONSYS.VALID_HH_QUESTIONS_audit
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
		term_date,
		REF_CODE,
		READ_MORE_FLAG,
		MANUAL_AUDIT_FLAG,
		MANUAL_AUDIT_HIST_FLAG,
		VARIABLE_DATE,
		DATE_PERIOD_TYPE,
		DATE_PERIOD_NUMBER
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
		:old.term_date,
		:old.REF_CODE,
		:old.READ_MORE_FLAG,
		:old.MANUAL_AUDIT_FLAG,
		:old.MANUAL_AUDIT_HIST_FLAG,
		:old.VARIABLE_DATE,
		:old.DATE_PERIOD_TYPE,
		:old.DATE_PERIOD_NUMBER
	);
end;
```
