---
tags:
  - trigger
  - SBCSYS
---
# VALID_INSTR_TST_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_INSTRUMENT_TESTS|VALID_INSTRUMENT_TESTS]]
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
    insert into valid_instrument_tests_audit
	(
		chapter_id, machine_id, test_id,
		machine_test_id, eff_date, term_date,
		last_modified_date, audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.chapter_id, :new.machine_id, :new.test_id,
		:new.machine_test_id, :new.eff_date, :new.term_date,
		:new.last_modified_date, :new.audit_key, :new.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
```
