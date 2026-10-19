---
tags:
  - trigger
  - SBCSYS
---
# VALID_INTERDICTIONS_LAB_BIU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_INTERDICTIONS_LAB|VALID_INTERDICTIONS_LAB]]
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
    insert into valid_interdictions_lab_audit
	(
		inter_code, inter_type, inter_desc,
		system_inter_code, system_inter_flag, eff_date,
		term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.inter_code, :new.inter_type, :new.inter_desc,
		:new.system_inter_code, :new.system_inter_flag, :new.eff_date,
		:new.term_date, :new.last_modified_date, :new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid
	);
end;
```
