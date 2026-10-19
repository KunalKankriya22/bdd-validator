---
tags:
  - trigger
  - UTIL
---
# VALID_FF_VALUES_BD

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/VALID_FF_VALUES|VALID_FF_VALUES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_FF_VALUES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		chapter_id,
		coll_id,
		source_type,
		source_code,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.chapter_id,
		:old.coll_id,
		:old.source_type,
		:old.source_code,
		:old.eff_date,
		:old.term_date
	);
end;
```
