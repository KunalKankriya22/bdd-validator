---
tags:
  - trigger
  - SBCSYS
---
# VALID_PROD_CONV_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_PRODUCT_CONV|VALID_PRODUCT_CONV]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_product_conv_audit
	(
		source_product_code,target_product_code,
		eff_date,term_date, last_modified_date,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.source_product_code,:old.target_product_code,
		:old.eff_date,:old.term_date, :old.last_modified_date,
		:old.audit_key, 'DELETE',
		sysdate, lt_user_session.get_userid
	);
end;
```
