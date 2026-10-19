---
tags:
  - table
  - SBCSYS
---
# TEST_SERVICE_UNITS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 891
**Last Analyzed**: 2025-09-16 03:14:44
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | OS_UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | CONTRACT_SUFFIX | VARCHAR2(4) | Yes |  |  |
| 5 | TS_BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 6 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 7 | UNIT_STATUS | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_SERVICE_UNITS_A1 | NORMAL | NONUNIQUE | TS_BATCH_ID | VALID |
| TEST_SERVICE_UNITS_IDX_2 | NORMAL | NONUNIQUE | OS_UNIT_ID | VALID |
| TEST_SERVICE_UNITS_P1 | NORMAL | UNIQUE | CONTRACT_ID, CHAPTER_ID, OS_UNIT_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
