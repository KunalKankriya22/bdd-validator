---
tags:
  - trigger
  - SBCSYS
---
# VPRODUCT_BAG_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_PRODUCT_BAG_ID|VALID_PRODUCT_BAG_ID]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_product_bag_id_audit
	(
		product_code, bag_id,
		eff_date, term_date, last_modified_date,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.product_code,:old.bag_id,
		:old.eff_date,:old.term_date,:old.last_modified_date,
		:old.audit_key, 'DELETE',
		sysdate, lt_user_session.get_userid
	);
end;
```
