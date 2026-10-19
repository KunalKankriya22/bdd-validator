---
tags:
  - trigger
  - DONSYS
---
# VALID_ITEM_MASTER_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_ITEM_MASTER|VALID_ITEM_MASTER]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_ITEM_MASTER_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		item_code,
		item_desc,
		lot_reqd,
		avg_cost,
		enforce_exipiration,
		resource_code,
		minimum_level,
		reorder_level,
		return_flag,
		qty_on_hand,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.item_code,
		:old.item_desc,
		:old.lot_reqd,
		:old.avg_cost,
		:old.enforce_exipiration,
		:old.resource_code,
		:old.minimum_level,
		:old.reorder_level,
		:old.return_flag,
		:old.qty_on_hand,
		:old.eff_date,
		:old.term_date
	);
end;
```
