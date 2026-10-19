---
tags:
  - trigger
  - SBCSYS
---
# VDONPROC_ATTR_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_DON_PROC_ATTRIBUTE|VALID_DON_PROC_ATTRIBUTE]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_don_proc_attribute_audit
	(
		donation_type, procedure_code,sort_sequence,
		attrib_group, attrib_code,
		eff_date, term_date,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.donation_type,:old.procedure_code, :old.sort_sequence,
		:old.attrib_group,:old.attrib_code,
		:old.eff_date,:old.term_date,
		:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate, lt_user_session.get_userid
	);
end;
```
