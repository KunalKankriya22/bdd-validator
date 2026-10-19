---
tags:
  - table
  - SBCSYS
---
# VALID_INSTRUMENT_TEST_RESULTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 548
**Last Analyzed**: 2025-09-16 03:15:59
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | MACHINE_ID | VARCHAR2(5) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | RESULT_STATUS | VARCHAR2(4) | No |  |  |
| 5 | MACHINE_RESULT_STATUS | VARCHAR2(12) | No |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_INST_TEST_RESULTS_BD|VALID_INST_TEST_RESULTS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_INST_TEST_RESULTS_BI|VALID_INST_TEST_RESULTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_INST_TEST_RESULTS_BU|VALID_INST_TEST_RESULTS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
