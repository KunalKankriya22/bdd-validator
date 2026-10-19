---
tags:
  - trigger
  - DONSYS
---
# VALID_STATUS_RULES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_STATUS_RULES|VALID_STATUS_RULES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_STATUS_RULES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		staff_status,
		van_status,
		coach_status,
		overall_status,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.staff_status,
		:old.van_status,
		:old.coach_status,
		:old.overall_status,
		:old.eff_date,
		:old.term_date
	);
end;
```
