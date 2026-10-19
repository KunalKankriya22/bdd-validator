---
tags:
  - trigger
  - SBCSYS
---
# VALID_COLL_AGEN_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_COLLECTION_AGENCIES|VALID_COLLECTION_AGENCIES]]
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
    insert into valid_coll_agencies_audit
	(
		chapter_id,
		contract_id,
		coll_id,
		coll_name,
		coll_address_1,
		coll_address_2,
		coll_address_3,
		city,
		state,
		zip,
		coll_id_head,
		phone_no,
		fax_no,
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
		:new.chapter_id,
		:new.contract_id,
		:new.coll_id,
		:new.coll_name,
		:new.coll_address_1,
		:new.coll_address_2,
		:new.coll_address_3,
		:new.city,
		:new.state,
		:new.zip,
		:new.coll_id_head,
		:new.phone_no,
		:new.fax_no,
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
