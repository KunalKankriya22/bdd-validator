---
tags:
  - trigger
  - DONSYS
---
# VALID_LIST_TYPES_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_LIST_TYPES|VALID_LIST_TYPES]]
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
    insert into VALID_LIST_TYPES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		list_type,
		list_description,
		shelf_life,
		elig_check_reqd,
		max_donors,
		def_proc_code,
		def_don_type,
		enlistment_type,
		default_priority,
		donor_override,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.list_type,
		:new.list_description,
		:new.shelf_life,
		:new.elig_check_reqd,
		:new.max_donors,
		:new.def_proc_code,
		:new.def_don_type,
		:new.enlistment_type,
		:new.default_priority,
		:new.donor_override,
		:new.eff_date,
		:new.term_date
	);
end;
```
