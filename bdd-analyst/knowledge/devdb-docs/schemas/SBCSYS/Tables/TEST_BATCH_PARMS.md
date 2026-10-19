---
tags:
  - table
  - SBCSYS
---
# TEST_BATCH_PARMS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4751
**Last Analyzed**: 2025-09-16 03:14:43
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | TB_ID | VARCHAR2(14) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | SEQUENCE | NUMBER | No |  |  |
| 5 | PARM_CODE | VARCHAR2(5) | No |  |  |
| 6 | PARM_VALUE | VARCHAR2(14) | Yes |  |  |
| 7 | FIRST_TECH | VARCHAR2(10) | Yes |  |  |
| 8 | FIRST_DATE | DATE | Yes |  |  |
| 9 | SECOND_TECH | VARCHAR2(10) | Yes |  |  |
| 10 | SECOND_DATE | DATE | Yes |  |  |
| 11 | ACCEPT_FLAG | VARCHAR2(1) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**TEST_BATCH_PARMS_PK**: `CHAPTER_ID, TB_ID, TEST_ID, PARM_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_BATCH_PARMS_IDX_1 | NORMAL | UNIQUE | CHAPTER_ID, TB_ID, TEST_ID, PARM_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
