---
tags:
  - table
  - SBCSYS
---
# TEST_RUN_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 49
**Last Analyzed**: 2025-09-16 03:14:44
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | RUN_ID | VARCHAR2(14) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | PARM_TYPE | VARCHAR2(5) | Yes |  |  |
| 5 | INSERT_DATE | DATE | Yes |  |  |
| 6 | ACCEPT_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 9 | TESTING_LAB_CODE | VARCHAR2(2) | Yes |  |  |

## Primary Key

**TEST_RUN_HDR_PK**: `CHAPTER_ID, RUN_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| TEST_TEST_RUN_HDR_FK | TEST_ID | [[schemas/SBCSYS/Tables/VALID_TESTS\|SBCSYS.VALID_TESTS]] (TEST_ID) | NO ACTION |

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/TEST_RUN_PARMS\|SBCSYS.TEST_RUN_PARMS]] | HDR_TEST_RUN_PARMS_FK | CHAPTER_ID, RUN_ID → CHAPTER_ID, RUN_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_RUN_HDR_IDX_1 | NORMAL | UNIQUE | CHAPTER_ID, RUN_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
