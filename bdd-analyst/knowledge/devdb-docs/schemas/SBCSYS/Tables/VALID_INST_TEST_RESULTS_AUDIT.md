---
tags:
  - table
  - SBCSYS
---
# VALID_INST_TEST_RESULTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 991
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
| 13 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 14 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
