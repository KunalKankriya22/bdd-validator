---
tags:
  - trigger
  - SBCSYS
---
# VALID_COLL_AGEN_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_COLLECTION_AGENCIES|VALID_COLLECTION_AGENCIES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
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
		:old.chapter_id,
		:old.contract_id,
		:old.coll_id,
		:old.coll_name,
		:old.coll_address_1,
		:old.coll_address_2,
		:old.coll_address_3,
		:old.city,
		:old.state,
		:old.zip,
		:old.coll_id_head,
		:old.phone_no,
		:old.fax_no,
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
