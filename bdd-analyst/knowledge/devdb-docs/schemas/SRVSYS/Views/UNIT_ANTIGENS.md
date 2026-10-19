---
tags:
  - view
  - SRVSYS
---
# UNIT_ANTIGENS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Text Length**: 1056 chars

## Definition

```sql
SELECT UNIT_ID, TEST_ID, RESULT_STATUS_1 TEST_RESULT, COLL_DATE, CHAPTER_ID
FROM   UTRS
WHERE  EXISTS (SELECT 'X' FROM VALID_TESTS
               WHERE  (TEST_GROUP IN ('AG', 'MAG', 'ROUAG','RHBAT') or
		       TEST_ID IN ('CMV','DAT','ABORH')) and
		      valid_tests.test_id = utrs.test_id and
		      sysdate between eff_date and nvl(term_date,sysdate))
       and result_status_1 is not null
       and result_status_2 is null
       and cancel_flag is null
union
SELECT UNIT_ID, TEST_ID, RESULT_STATUS_1 TEST_RESULT, COLL_DATE, CHAPTER_ID
FROM   UNIT_TEST_BASE
WHERE  EXISTS (SELECT 'X' FROM VALID_TESTS
               WHERE  (TEST_GROUP IN ('AG', 'MAG', 'ROUAG','RHBAT') or
		       TEST_ID IN ('CMV','DAT','ABORH')) and
		      valid_tests.test_id = unit_test_base.test_id and
		      sysdate between eff_date and nvl(term_date,sysdate))
       and result_status_1 is not null
       and result_status_2 is null
       and cancel_flag is null
union
SELECT UNIT_ID, TEST_ID, RESULT_STATUS TEST_RESULT, COLL_DATE, CHAPTER_ID
FROM   donor_tested_units

```
