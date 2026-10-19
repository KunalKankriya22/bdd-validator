---
tags:
  - trigger
  - DONSYS
---
# VALID_PROC_CODES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_PROC_CODES|VALID_PROC_CODES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_PROC_CODES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		procedure_code,
		chapter_id,
		description,
		duration,
		credit_count,
		sort_sequence,
		sch_view_interval,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.procedure_code,
		:old.chapter_id,
		:old.description,
		:old.duration,
		:old.credit_count,
		:old.sort_sequence,
		:old.sch_view_interval,
		:old.eff_date,
		:old.term_date
	);
end;
```
