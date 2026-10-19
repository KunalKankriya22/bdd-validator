---
tags:
  - trigger
  - SBCSYS
---
# FR_ANTG_GROUPS_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/FR_VANTIGEN_GROUPS|FR_VANTIGEN_GROUPS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
      temp_audit_key	number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
	--
    insert into fr_vantigen_groups_audit
	(
		antigen_group, test_id, test_result,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.antigen_group,:new.test_id,:new.test_result,
		:new.eff_date,:new.term_date,:new.last_modified_date,
		:new.audit_key, :new.program_id, sysdate, lt_user_session.get_userid
	);
end;
```
