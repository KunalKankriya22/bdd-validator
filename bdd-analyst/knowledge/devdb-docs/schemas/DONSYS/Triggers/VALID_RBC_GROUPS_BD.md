---
tags:
  - trigger
  - DONSYS
---
# VALID_RBC_GROUPS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_RBC_GROUPS|VALID_RBC_GROUPS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
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
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.group_id,
		:old.chapter_id,
		:old.test_id,
		:old.result_code,
		:old.eff_date,
		:old.term_date
	);
end;
```
