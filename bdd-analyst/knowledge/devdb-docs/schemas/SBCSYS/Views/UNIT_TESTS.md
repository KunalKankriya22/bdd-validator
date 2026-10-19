---
tags:
  - view
  - SBCSYS
---
# UNIT_TESTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Text Length**: 931 chars

## Referenced Tables

- [[schemas/SBCSYS/Tables/UNIT_TEST_BASE|SBCSYS.UNIT_TEST_BASE]]
- [[schemas/SBCSYS/Tables/UTRS|SBCSYS.UTRS]]

## Definition

```sql
SELECT
    'Y' schedule_flag,
    unit_id,
    coll_date,
    chapter_id,
    test_seq_no,
    test_id,
    test_state,
    test_mode,
    result_status_1,
    result_status_2,
    cancel_flag,
    edit_result_flag,
    tb_id,
    test_chapter_id,
    tb_seq_no,
    well_number,
    absorbance,
    ratio,
    result_dats,
    result_user_id,
    testing_lab_code,
    insert_dats,
    insert_user_id,
    audit_key,
    program_id,
    profile_set_id,
    rep_profile_set_id
  FROM
    utrs
UNION ALL SELECT
  'N',
  unit_id,
  coll_date,
  chapter_id,
  test_seq_no,
  test_id,
  test_state,
  test_mode,
  result_status_1,
  result_status_2,
  cancel_flag,
  edit_result_flag,
  tb_id,
  test_chapter_id,
  tb_seq_no,
  well_number,
  absorbance,
  ratio,
  result_dats,
  result_user_id,
  testing_lab_code,
  insert_dats,
  insert_user_id,
  audit_key,
  program_id,
  profile_set_id,
  rep_profile_set_id
FROM
unit_test_base
```
