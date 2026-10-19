---
tags:
  - trigger
  - SBCSYS
---
# UNIT_TEST_BASE_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UNIT_TEST_BASE|UNIT_TEST_BASE]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into unit_test_base_audit
	(
		unit_id, coll_date, chapter_id,
		test_seq_no, test_id, test_state,
		test_mode, temp_result_1, temp_result_1_user_id,
		temp_result_2, temp_result_2_user_id,
		result_status_1, result_status_2,
		cancel_flag, edit_result_flag,
		tb_id, test_chapter_id, tb_seq_no, well_number,
		absorbance, ratio, result_dats,
		result_user_id, testing_lab_code,
		insert_dats, insert_user_id,
		audit_key,program_id, audit_insert_dats,  audit_insert_user
	)
	values
	(
		:old.unit_id, :old.coll_date, :old.chapter_id,
		:old.test_seq_no, :old.test_id, :old.test_state,
		:old.test_mode, :old.temp_result_1, :old.temp_result_1_user_id,
		:old.temp_result_2, :old.temp_result_2_user_id,
		:old.result_status_1, :old.result_status_2,
		:old.cancel_flag, :old.edit_result_flag,
		:old.tb_id, :old.test_chapter_id, :old.tb_seq_no,
		:old.well_number, :old.absorbance, :old.ratio,
		:old.result_dats, :old.result_user_id, :old.testing_lab_code,
		:old.insert_dats, :old.insert_user_id,
		:old.audit_key,'DELETE', sysdate, lt_user_session.get_userid
	);
end;
```
