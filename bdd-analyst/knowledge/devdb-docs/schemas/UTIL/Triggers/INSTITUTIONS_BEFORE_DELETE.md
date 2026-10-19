---
tags:
  - trigger
  - UTIL
---
# INSTITUTIONS_BEFORE_DELETE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/INSTITUTIONS|INSTITUTIONS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into institutions_audit
	(
	 inst_id, inst_name, inst_short_name, address_id, print_hdr,
	 system_name, codabar_unit_scheme, tax_id,
	 eff_date, term_date, last_modified_date,
	 audit_key, program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 :old.inst_id, :old.inst_name, :old.inst_short_name,
	 :old.address_id, :old.print_hdr,
	 :old.system_name, :old.codabar_unit_scheme, :old.tax_id,
	 :old.eff_date, :old.term_date, :old.last_modified_date,
	 :old.audit_key, :old.program_id, sysdate, lt_user_session.get_userid	 );
end;
```
