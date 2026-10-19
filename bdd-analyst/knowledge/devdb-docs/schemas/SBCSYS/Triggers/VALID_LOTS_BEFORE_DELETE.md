---
tags:
  - trigger
  - SBCSYS
---
# VALID_LOTS_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_LOTS|VALID_LOTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_lots_audit
	(
		lot_number, chapter_id,
		bag_code, vendor_name, date_received,
		number_of_units, number_of_cartons, eff_date,
		term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user,
		catalog_number
	)
	values
	(
		:old.lot_number,:old.chapter_id,
		:old.bag_code,:old.vendor_name,:old.date_received,
		:old.number_of_units,:old.number_of_cartons,:old.eff_date,
		:old.term_date,:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate, lt_user_session.get_userid,
		:old.catalog_number
	);
end;
```
