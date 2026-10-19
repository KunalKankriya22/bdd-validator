---
tags:
  - trigger
  - DONSYS
---
# VALID_PROC_EXCLUSIONS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_PROC_EXCLUSIONS|VALID_PROC_EXCLUSIONS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
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
		:old.donation_type,
		:old.procedure_code,
		:old.inter_code,
		:old.eff_date,
		:old.term_date,
		:old.insert_date,
		:old.insert_user,
		:old.audit_key,
		sysdate,
		'DELETE',
		lt_user_session.get_userid
	);
end;
```
