---
tags:
  - trigger
  - DONSYS
---
# VALID_PROC_EXCLUSIONS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_PROC_EXCLUSIONS|VALID_PROC_EXCLUSIONS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_PROC_EXCLUSIONS_audit
	(
		donation_type,
		procedure_code,
		inter_code,
		eff_date,
		term_date,
		insert_date,
		insert_user,
		audit_key,
		audit_insert_dats,
		program_id,
		AUDIT_INSERT_USER
	)
	values
	(
		:new.donation_type,
		:new.procedure_code,
		:new.inter_code,
		:new.eff_date,
		:new.term_date,
		:new.insert_date,
		:new.insert_user,
		:new.audit_key,
		sysdate,
		:new.program_id,
		lt_user_session.get_userid
	);
end;
```
