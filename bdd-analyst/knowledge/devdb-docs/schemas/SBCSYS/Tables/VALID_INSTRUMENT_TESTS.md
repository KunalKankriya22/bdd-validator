---
tags:
  - table
  - SBCSYS
---
# VALID_INSTRUMENT_TESTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 344
**Last Analyzed**: 2025-09-16 03:15:59
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | MACHINE_ID | VARCHAR2(5) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | MACHINE_TEST_ID | VARCHAR2(50) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | UPLOAD_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_INSTRUMENT_TESTS_IDX_1 | NORMAL | NONUNIQUE | CHAPTER_ID, MACHINE_ID, TEST_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_INSTR_TST_BEFORE_DELETE|VALID_INSTR_TST_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_INSTR_TST_INSERT_UPDATE|VALID_INSTR_TST_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
