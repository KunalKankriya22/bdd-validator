---
tags:
  - trigger
  - DONSYS
---
# DRIVE_CATEGORY_RULES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DRIVE_CATEGORY_RULES|DRIVE_CATEGORY_RULES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into DRIVE_CATEGORY_RULES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		rule_id,
		chapter_id,
		drive_category,
		number_allowed,
		max_size,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.rule_id,
		:new.chapter_id,
		:new.drive_category,
		:new.number_allowed,
		:new.max_size,
		:new.eff_date,
		:new.term_date
	);
end;
```
