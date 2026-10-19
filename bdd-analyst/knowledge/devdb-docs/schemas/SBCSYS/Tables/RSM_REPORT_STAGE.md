---
tags:
  - table
  - SBCSYS
---
# RSM_REPORT_STAGE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2369
**Last Analyzed**: 2025-09-16 03:14:37
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PARAM_ID | VARCHAR2(10) | Yes |  |  |
| 2 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 3 | TEST_NAME | VARCHAR2(20) | Yes |  |  |
| 4 | TEST_SEQUENCE | NUMBER(2) | Yes |  |  |
| 5 | REPORT_ID | VARCHAR2(20) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RSM_REPORT_STAGE_IDX1 | NORMAL | NONUNIQUE | REPORT_ID, PARAM_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
