---
tags:
  - trigger
  - SBCSYS
---
# VALID_CATALOGS_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_CATALOGS|VALID_CATALOGS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
	temp_audit_key	  number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
    --
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
		:new.catalog_number,
		:new.weight_of_bag,
		:new.manufacturer,
		:new.total_bags_in_set,
		:new.anticoagulant,
		:new.additive_solution,
		:new.collection_volume,
		:new.bag_storage_restriction,
		:new.bag_volume,
		:new.bag_type,
		:new.eff_date,
		:new.term_date,
		:new.last_modified_date,
		:new.audit_key,
		:new.program_id,
		sysdate,
		lt_user_session.get_userid
	);
end;
```
