---
tags:
  - trigger
  - SBCSYS
---
# VALID_LOTS_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_LOTS|VALID_LOTS]]
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
		:new.lot_number,:new.chapter_id,
		:new.bag_code,:new.vendor_name,:new.date_received,
		:new.number_of_units,:new.number_of_cartons,:new.eff_date,
		:new.term_date,:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid,
		:new.catalog_number
	);
end;
```
