---
tags:
  - trigger
  - SBCSYS
---
# VALID_CONT_PROD_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_CONTAINER_PRODUCTS|VALID_CONTAINER_PRODUCTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	insert into valid_container_products_audit
	(
		catalog_number,
		product_type,
		bag_code,
		face_label,
		eff_date,
		term_date,
		last_modified_date,
		audit_key,
		program_id,
		audit_insert_dats,
		audit_insert_user
	)
	values
	(
		:old.catalog_number,
		:old.product_type,
		:old.bag_code,
		:old.face_label,
		:old.eff_date,
		:old.term_date,
		:old.last_modified_date,
		:old.audit_key,
		'DELETE',
		sysdate,
		lt_user_session.get_userid
	);
end;
```
