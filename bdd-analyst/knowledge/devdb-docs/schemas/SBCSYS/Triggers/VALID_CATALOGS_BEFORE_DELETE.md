---
tags:
  - trigger
  - SBCSYS
---
# VALID_CATALOGS_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_CATALOGS|VALID_CATALOGS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	insert into valid_catalogs_audit
	(
		catalog_number,
		weight_of_bag,
		manufacturer,
		total_bags_in_set,
		anticoagulant,
		additive_solution,
		collection_volume,
		bag_storage_restriction,
		bag_volume,
		bag_type,
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
		:old.weight_of_bag,
		:old.manufacturer,
		:old.total_bags_in_set,
		:old.anticoagulant,
		:old.additive_solution,
		:old.collection_volume,
		:old.bag_storage_restriction,
		:old.bag_volume,
		:old.bag_type,
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
