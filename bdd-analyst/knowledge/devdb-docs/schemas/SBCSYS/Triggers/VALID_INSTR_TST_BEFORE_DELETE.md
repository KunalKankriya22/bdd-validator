---
tags:
  - trigger
  - SBCSYS
---
# VALID_INSTR_TST_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_INSTRUMENT_TESTS|VALID_INSTRUMENT_TESTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_instrument_tests_audit
	(
		chapter_id, machine_id, test_id,
		machine_test_id, eff_date, term_date,
		last_modified_date, audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.chapter_id, :old.machine_id, :old.test_id,
		:old.machine_test_id, :old.eff_date, :old.term_date,
		:old.last_modified_date, :old.audit_key, 'DELETE',
		sysdate, lt_user_session.get_userid
	 );
end;
```
