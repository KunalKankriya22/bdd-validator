---
tags:
  - trigger
  - SBCSYS
---
# VTEST_RESULTS_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_TEST_RESULTS|VALID_TEST_RESULTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_test_results_audit
	(
		test_id, result_status, plate_seq, inter_code,
		verify_flag, number_of_repeats, attrib_group,
		attrib_code, confirm_test_id_1, confirm_test_id_2,
		eff_date, term_date, last_modified_date, SECOND_TECH, AUTO_ONLY,
		audit_key, program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.test_id,:old.result_status,:old.plate_seq,:old.inter_code,
		:old.verify_flag,:old.number_of_repeats,:old.attrib_group,
		:old.attrib_code,:old.confirm_test_id_1,:old.confirm_test_id_2,
		:old.eff_date,:old.term_date,:old.last_modified_date, :old.SECOND_TECH, :old.AUTO_ONLY,
		:old.audit_key, 'DELETE', sysdate, lt_user_session.get_userid
	);
end;
```
