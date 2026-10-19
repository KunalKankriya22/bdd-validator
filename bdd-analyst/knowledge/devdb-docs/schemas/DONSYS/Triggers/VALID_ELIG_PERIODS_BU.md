---
tags:
  - trigger
  - DONSYS
---
# VALID_ELIG_PERIODS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_ELIG_PERIODS|VALID_ELIG_PERIODS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_ELIG_PERIODS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		curr_donation_type,
		chapter_id,
		procedure_group,
		days_between,
		max_donations,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.curr_donation_type,
		:new.chapter_id,
		:new.procedure_group,
		:new.days_between,
		:new.max_donations,
		:new.eff_date,
		:new.term_date
	);
end;
```
