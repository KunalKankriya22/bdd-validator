---
tags:
  - trigger
  - UTIL
---
# INST_BEFORE_INSERT_UPDATE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/INSTITUTIONS|INSTITUTIONS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
	temp_audit_key	  number(23);
begin
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
	--
    insert into institutions_audit
	(
	 inst_id, inst_name, inst_short_name, address_id, print_hdr,
	 system_name, codabar_unit_scheme, tax_id,
	 eff_date, term_date, last_modified_date,
	 audit_key, program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 :new.inst_id, :new.inst_name, :new.inst_short_name,
	 :new.address_id, :new.print_hdr,
	 :new.system_name, :new.codabar_unit_scheme, :new.tax_id,
	 :new.eff_date, :new.term_date, :new.last_modified_date,
	 :new.audit_key, :new.program_id, sysdate, lt_user_session.get_userid
	 );
end;
```
