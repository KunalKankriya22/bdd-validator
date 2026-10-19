---
tags:
  - table
  - SBCSYS
---
# TEST_RUN_PARMS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 74
**Last Analyzed**: 2025-09-16 03:14:44
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | RUN_ID | VARCHAR2(14) | No |  |  |
| 3 | SEQUENCE | NUMBER | Yes |  |  |
| 4 | PARM_CODE | VARCHAR2(5) | No |  |  |
| 5 | PARM_VALUE | VARCHAR2(14) | Yes |  |  |
| 6 | ENTRY_TECH | VARCHAR2(10) | Yes |  |  |
| 7 | ENTRY_DATE | DATE | Yes |  |  |
| 8 | ACCEPT_FLAG | VARCHAR2(1) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| HDR_TEST_RUN_PARMS_FK | CHAPTER_ID, RUN_ID | [[schemas/SBCSYS/Tables/TEST_RUN_HDR\|SBCSYS.TEST_RUN_HDR]] (CHAPTER_ID, RUN_ID) | NO ACTION |

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| TEST_RUN_PARMS_UK | CHAPTER_ID, RUN_ID, PARM_CODE | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_RUN_PARMS_IDX_1 | NORMAL | UNIQUE | CHAPTER_ID, RUN_ID, PARM_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
