---
tags:
  - trigger
  - UTIL
---
# VALID_FF_VALUES_BU

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/VALID_FF_VALUES|VALID_FF_VALUES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.chapter_id,
		:new.coll_id,
		:new.source_type,
		:new.source_code,
		:new.eff_date,
		:new.term_date
	);
end;
```
