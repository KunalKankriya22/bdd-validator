---
tags:
  - trigger
  - DONSYS
---
# VALID_RESOURCES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_RESOURCES|VALID_RESOURCES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_RESOURCES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		resource_code,
		resource_type,
		resource_desc,
		critical_ind,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.resource_code,
		:old.resource_type,
		:old.resource_desc,
		:old.critical_ind,
		:old.eff_date,
		:old.term_date
	);
end;
```
