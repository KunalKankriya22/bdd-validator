---
tags:
  - table
  - LTAPI
---
# VALID_INST_TEST_SCH_AUDIT

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:30
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MACHINE_ID | VARCHAR2(5) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | MACHINE_TEST_ID | VARCHAR2(50) | Yes |  |  |
| 4 | TEST_ID_1 | VARCHAR2(50) | Yes |  |  |
| 5 | TEST_ID_1_RES | VARCHAR2(10) | Yes |  |  |
| 6 | TEST_ID_2 | VARCHAR2(50) | Yes |  |  |
| 7 | TEST_ID_2_RES | VARCHAR2(10) | Yes |  |  |
| 8 | TEST_ID_3 | VARCHAR2(50) | Yes |  |  |
| 9 | TEST_ID_3_RES | VARCHAR2(10) | Yes |  |  |
| 10 | TEST_ID_4 | VARCHAR2(50) | Yes |  |  |
| 11 | TEST_ID_4_RES | VARCHAR2(10) | Yes |  |  |
| 12 | TEST_ID_5 | VARCHAR2(50) | Yes |  |  |
| 13 | TEST_ID_5_RES | VARCHAR2(10) | Yes |  |  |
| 14 | TEST_ID_6 | VARCHAR2(50) | Yes |  |  |
| 15 | TEST_ID_6_RES | VARCHAR2(10) | Yes |  |  |
| 16 | POOL_SIZE | VARCHAR2(4) | Yes |  |  |
| 17 | LT_SCH_TEST_ID_1 | VARCHAR2(10) | Yes |  |  |
| 18 | LT_SCH_RES_1 | VARCHAR2(10) | Yes |  |  |
| 19 | LT_SCH_TEST_ID_2 | VARCHAR2(10) | Yes |  |  |
| 20 | LT_SCH_RES_2 | VARCHAR2(10) | Yes |  |  |
| 21 | LT_SCH_TEST_ID_3 | VARCHAR2(10) | Yes |  |  |
| 22 | LT_SCH_RES_3 | VARCHAR2(10) | Yes |  |  |
| 23 | LT_SCH_DFLT_TEST_4 | VARCHAR2(10) | Yes |  |  |
| 24 | LT_SCH_DFLT_RES_4 | VARCHAR2(10) | Yes |  |  |
| 25 | LT_SCH_DFLT_TEST_5 | VARCHAR2(10) | Yes |  |  |
| 26 | LT_SCH_DFLT_RES_5 | VARCHAR2(10) | Yes |  |  |
| 27 | LT_SCH_DFLT_TEST_6 | VARCHAR2(10) | Yes |  |  |
| 28 | LT_SCH_DFLT_RES_6 | VARCHAR2(10) | Yes |  |  |
| 29 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 30 | EFF_DATE | DATE | Yes |  |  |
| 31 | TERM_DATE | DATE | Yes |  |  |
| 32 | AUDIT_KEY | NUMBER | Yes |  |  |
| 33 | INSERT_DATE | DATE | Yes |  |  |
| 34 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 35 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 36 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
