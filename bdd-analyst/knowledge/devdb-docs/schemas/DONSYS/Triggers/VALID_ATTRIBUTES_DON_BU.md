---
tags:
  - trigger
  - DONSYS
---
# VALID_ATTRIBUTES_DON_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_ATTRIBUTES_DON|VALID_ATTRIBUTES_DON]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_ATTRIBUTES_DON_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		attrib_code,
		attrib_table,
		required,
		attrib_group,
		attrib_desc,
		sort_sequence,
		valid_code_type,
		default_value,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.attrib_code,
		:new.attrib_table,
		:new.required,
		:new.attrib_group,
		:new.attrib_desc,
		:new.sort_sequence,
		:new.valid_code_type,
		:new.default_value,
		:new.eff_date,
		:new.term_date
	);
end;
```
