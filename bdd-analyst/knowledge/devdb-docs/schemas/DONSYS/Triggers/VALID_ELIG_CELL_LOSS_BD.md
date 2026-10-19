---
tags:
  - trigger
  - DONSYS
---
# VALID_ELIG_CELL_LOSS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_ELIG_CELL_LOSS|VALID_ELIG_CELL_LOSS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
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
		:old.chapter_id,
		:old.cell_type,
		:old.maximum_loss,
		:old.days_between,
		:old.eff_date,
		:old.term_date,
		:old.insert_user,
		:old.insert_date,
		'DELETE',
		:old.audit_key,
		sysdate
	);
end;
```
