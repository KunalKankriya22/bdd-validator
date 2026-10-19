---
tags:
  - trigger
  - DONSYS
---
# FIND_DONOR_FIELDS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/FIND_DONOR_FIELDS|FIND_DONOR_FIELDS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
	temp_audit_key	  number(23);
begin
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    insert into FIND_DONOR_FIELDS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		program_name,
		field_name,
		no_of_entries,
		required,
		protected_entry,
		function_check,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.program_name,
		:new.field_name,
		:new.no_of_entries,
		:new.required,
		:new.protected_entry,
		:new.function_check,
		:new.eff_date,
		:new.term_date
	);
end;
```
