---
tags:
  - trigger
  - SBCSYS
---
# VFILTERS_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_FILTERS|VALID_FILTERS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_filters_audit
	(
		chapter_id, vendor_name,
		number_of_days, catalog_number, product_type,
		eff_date, term_date,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.chapter_id,:old.vendor_name,
		:old.number_of_days,:old.catalog_number, :old.product_type,
		:old.eff_date,:old.term_date,
		:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate, lt_user_session.get_userid
	);
end;
```
