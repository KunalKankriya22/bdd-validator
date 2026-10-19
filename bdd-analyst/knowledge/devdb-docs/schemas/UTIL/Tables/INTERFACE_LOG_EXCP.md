---
tags:
  - table
  - UTIL
---
# INTERFACE_LOG_EXCP

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2362
**Last Analyzed**: 2026-05-21 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INTERFACE_ID | VARCHAR2(10) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 4 | PROGRAM_ID | VARCHAR2(10) | No |  |  |
| 5 | REASON_CODE | VARCHAR2(5) | No |  |  |
| 6 | INTERFACE_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| INTERFACE_LOG_EXCP_IDX1 | NORMAL | NONUNIQUE | INTERFACE_ID | VALID |
| INTERFACE_LOG_EXCP_IDX2 | NORMAL | NONUNIQUE | UNIT_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
