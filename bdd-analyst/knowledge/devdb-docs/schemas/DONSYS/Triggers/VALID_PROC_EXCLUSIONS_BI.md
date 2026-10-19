---
tags:
  - trigger
  - DONSYS
---
# VALID_PROC_EXCLUSIONS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_PROC_EXCLUSIONS|VALID_PROC_EXCLUSIONS]]
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
    select audit_seq.nextval into :new.audit_key from dual;
--  select audit_seq.nextval into temp_audit_key from dual;
--  :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    insert into VALID_PROC_EXCLUSIONS_audit
	(
		donation_type,
		procedure_code,
		inter_code,
		eff_date,
		term_date,
		insert_date,
		insert_user,
		audit_key,
		audit_insert_dats,
		program_id,
		AUDIT_INSERT_USER
	)
	values
	(
		:new.donation_type,
		:new.procedure_code,
		:new.inter_code,
		:new.eff_date,
		:new.term_date,
		:new.insert_date,
		:new.insert_user,
		:new.audit_key,
		sysdate,
		:new.program_id,
		lt_user_session.get_userid
	);
end;
```
