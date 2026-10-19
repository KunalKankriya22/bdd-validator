---
tags:
  - table
  - SBCSYS
---
# VALID_TEST_RESULTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3008
**Last Analyzed**: 2025-09-16 03:16:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 2 | RESULT_STATUS | VARCHAR2(4) | Yes |  |  |
| 3 | PLATE_SEQ | VARCHAR2(1) | Yes |  |  |
| 4 | INTER_CODE | VARCHAR2(4) | Yes |  |  |
| 5 | VERIFY_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | NUMBER_OF_REPEATS | NUMBER(1) | Yes |  |  |
| 7 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 8 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 9 | CONFIRM_TEST_ID_1 | VARCHAR2(10) | Yes |  |  |
| 10 | CONFIRM_TEST_ID_2 | VARCHAR2(10) | Yes |  |  |
| 11 | EFF_DATE | DATE | Yes |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 16 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 17 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 18 | SECOND_TECH | VARCHAR2(1) | Yes |  |  |
| 19 | AUTO_ONLY | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_TEST_RES_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
