---
tags:
  - trigger
  - SBCSYS
---
# UNIT_INTER_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UNIT_INTERDICTIONS|UNIT_INTERDICTIONS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into unit_interdictions_audit
	(
		unit_id, coll_date, chapter_id,
		inter_code, insert_dats, inter_user_id,
		source_test_id, audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.unit_id, :old.coll_date, :old.chapter_id,
		:old.inter_code, :old.insert_dats, :old.inter_user_id,
		:old.source_test_id, :old.audit_key,'DELETE',
		sysdate, lt_user_session.get_userid
	);
end;
```
