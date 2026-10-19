---
tags:
  - trigger
  - SBCSYS
---
# VALID_INST_TEST_RESULTS_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_INSTRUMENT_TEST_RESULTS|VALID_INSTRUMENT_TEST_RESULTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_inst_test_results_audit
	(
		chapter_id,
		machine_id,
		test_id,
		result_status,
		machine_result_status,
		eff_date,
		term_date,
		insert_user_id,
		insert_date,
		last_modified_date,
		program_id,
		audit_key,
		audit_insert_dats,
		audit_insert_user
	)
	values
	(
		:old.chapter_id,
		:old.machine_id,
		:old.test_id,
		:old.result_status,
		:old.machine_result_status,
		:old.eff_date,
		:old.term_date,
		:old.insert_user_id,
		:old.insert_date,
		:old.last_modified_date,
		'DELETE',
		:old.audit_key,
		sysdate,
		lt_user_session.get_userid
	);
end;
```
