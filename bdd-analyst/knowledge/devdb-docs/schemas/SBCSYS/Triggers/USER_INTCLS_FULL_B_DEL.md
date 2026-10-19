---
tags:
  - trigger
  - SBCSYS
---
# USER_INTCLS_FULL_B_DEL

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/USER_INTERDICTION_CLASS|USER_INTERDICTION_CLASS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into user_interdiction_class_audit
	(
		user_id, inter_class,
		eff_date, term_date, last_modified_date,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.user_id, :old.inter_class,
		:old.eff_date, :old.term_date, :old.last_modified_date,
		:old.audit_key, :old.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
```
