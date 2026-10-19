---
tags:
  - trigger
  - DONSYS
---
# VALID_DIFFS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_DIFFS|VALID_DIFFS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_DIFFS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		diff_code,
		chapter_id,
		diff_desc,
		formula,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.diff_code,
		:new.chapter_id,
		:new.diff_desc,
		:new.formula,
		:new.eff_date,
		:new.term_date
	);
end;
```
