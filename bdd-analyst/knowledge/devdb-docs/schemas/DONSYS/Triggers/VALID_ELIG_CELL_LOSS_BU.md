---
tags:
  - trigger
  - DONSYS
---
# VALID_ELIG_CELL_LOSS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_ELIG_CELL_LOSS|VALID_ELIG_CELL_LOSS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into valid_elig_cell_loss_audit
	(
		chapter_id,
		cell_type,
		maximum_loss,
		days_between,
		eff_date,
		term_date,
		insert_user,
		insert_date,
		program_id,
		audit_key,
		audit_insert_dats
	)
	values
	(
		:new.chapter_id,
		:new.cell_type,
		:new.maximum_loss,
		:new.days_between,
		:new.eff_date,
		:new.term_date,
		:new.insert_user,
		:new.insert_date,
		:new.program_id,
		:new.audit_key,
		sysdate
	);
end;
```
