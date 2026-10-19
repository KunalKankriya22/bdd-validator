---
tags:
  - trigger
  - SBCSYS
---
# USER_INTCLS_FULL_B_INS_UPD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/USER_INTERDICTION_CLASS|USER_INTERDICTION_CLASS]]
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
    insert into user_interdiction_class_audit
	(
		user_id, inter_class,
		eff_date, term_date, last_modified_date,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.user_id, :new.inter_class,
		:new.eff_date, :new.term_date, :new.last_modified_date,
		:new.audit_key, :new.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
```
