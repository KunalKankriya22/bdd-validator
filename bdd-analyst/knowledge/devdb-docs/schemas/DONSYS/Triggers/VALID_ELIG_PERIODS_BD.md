---
tags:
  - trigger
  - DONSYS
---
# VALID_ELIG_PERIODS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_ELIG_PERIODS|VALID_ELIG_PERIODS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
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
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.curr_donation_type,
		:old.chapter_id,
		:old.procedure_group,
		:old.days_between,
		:old.max_donations,
		:old.eff_date,
		:old.term_date
	);
end;
```
