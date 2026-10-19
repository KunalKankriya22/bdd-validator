---
tags:
  - trigger
  - DONSYS
---
# FIND_DONOR_FIELDS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/FIND_DONOR_FIELDS|FIND_DONOR_FIELDS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into FIND_DONOR_FIELDS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		program_name,
		field_name,
		no_of_entries,
		required,
		protected_entry,
		function_check,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.program_name,
		:old.field_name,
		:old.no_of_entries,
		:old.required,
		:old.protected_entry,
		:old.function_check,
		:old.eff_date,
		:old.term_date
	);
end;
```
