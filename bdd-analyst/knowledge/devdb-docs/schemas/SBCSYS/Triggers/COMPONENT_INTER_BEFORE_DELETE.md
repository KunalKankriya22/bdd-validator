---
tags:
  - trigger
  - SBCSYS
---
# COMPONENT_INTER_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/COMPONENT_INTERDICTIONS|COMPONENT_INTERDICTIONS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into component_interdictions_audit
	(
		unit_id, coll_date, chapter_id,
		product_code, inter_code,
		insert_dats, inter_user_id,
		audit_key,program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.unit_id, :old.coll_date, :old.chapter_id,
		:old.product_code, :old.inter_code,
		:old.insert_dats, :old.inter_user_id,
		:old.audit_key,'DELETE',
		sysdate, lt_user_session.get_userid
	);
end;
```
