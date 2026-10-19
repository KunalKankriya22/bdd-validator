---
tags:
  - trigger
  - DONSYS
---
# VALID_ELIG_PROCS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_ELIG_PROCS|VALID_ELIG_PROCS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.chapter_id,
		:new.procedure_code,
		:new.curr_donation_type,
		:new.prev_procedure_code,
		:new.days_between,
		:new.eff_date,
		:new.term_date
	);
end;
```
