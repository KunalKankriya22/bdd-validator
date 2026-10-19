---
tags:
  - trigger
  - DONSYS
---
# VALID_ELIG_PROCS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_ELIG_PROCS|VALID_ELIG_PROCS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_ELIG_PROCS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		chapter_id,
		procedure_code,
		curr_donation_type,
		prev_procedure_code,
		days_between,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.chapter_id,
		:old.procedure_code,
		:old.curr_donation_type,
		:old.prev_procedure_code,
		:old.days_between,
		:old.eff_date,
		:old.term_date
	);
end;
```
