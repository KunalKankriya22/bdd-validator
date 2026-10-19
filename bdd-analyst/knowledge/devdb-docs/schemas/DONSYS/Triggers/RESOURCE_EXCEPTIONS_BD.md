---
tags:
  - trigger
  - DONSYS
---
# RESOURCE_EXCEPTIONS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/RESOURCE_EXCEPTIONS|RESOURCE_EXCEPTIONS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into RESOURCE_EXCEPTIONS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		resource_code,
		chapter_id,
		drive_date,
		available_number,
		reason_code,
		comments
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.resource_code,
		:old.chapter_id,
		:old.drive_date,
		:old.available_number,
		:old.reason_code,
		:old.comments
	);
end;
```
