---
tags:
  - trigger
  - DONSYS
---
# VALID_ITEM_MASTER_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_ITEM_MASTER|VALID_ITEM_MASTER]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.item_code,
		:new.item_desc,
		:new.lot_reqd,
		:new.avg_cost,
		:new.enforce_exipiration,
		:new.resource_code,
		:new.minimum_level,
		:new.reorder_level,
		:new.return_flag,
		:new.qty_on_hand,
		:new.eff_date,
		:new.term_date
	);
end;
```
