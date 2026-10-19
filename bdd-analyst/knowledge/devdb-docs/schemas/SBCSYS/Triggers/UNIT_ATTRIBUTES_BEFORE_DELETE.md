---
tags:
  - trigger
  - SBCSYS
---
# UNIT_ATTRIBUTES_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UNIT_ATTRIBUTES|UNIT_ATTRIBUTES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into unit_attributes_audit
	(
		unit_id, coll_date, chapter_id,
		attrib_group, attrib_code, source_test_id,
		status_flag, stop_label_flag,
		insert_dats, insert_user_id,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.unit_id, :old.coll_date, :old.chapter_id,
		:old.attrib_group, :old.attrib_code, :old.source_test_id,
		:old.status_flag, :old.stop_label_flag,
		:old.insert_dats, :old.insert_user_id,
		:old.audit_key,'DELETE',
		sysdate, lt_user_session.get_userid
	);
end;
```
