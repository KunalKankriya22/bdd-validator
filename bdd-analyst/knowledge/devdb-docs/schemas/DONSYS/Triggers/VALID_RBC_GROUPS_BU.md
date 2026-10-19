---
tags:
  - trigger
  - DONSYS
---
# VALID_RBC_GROUPS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_RBC_GROUPS|VALID_RBC_GROUPS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_RBC_GROUPS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		group_id,
		chapter_id,
		test_id,
		result_code,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.group_id,
		:new.chapter_id,
		:new.test_id,
		:new.result_code,
		:new.eff_date,
		:new.term_date
	);
end;
```
