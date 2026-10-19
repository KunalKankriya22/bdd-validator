---
tags:
  - table
  - UTIL
---
# INTERFACE_LOG

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 400864
**Last Analyzed**: 2026-04-07 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INTERFACE_ID | VARCHAR2(10) | No |  |  |
| 2 | PROGRAM_ID | VARCHAR2(10) | No |  |  |
| 3 | LOG_TEXT | VARCHAR2(100) | Yes |  |  |
| 4 | NO_OF_UNITS | NUMBER | No |  |  |
| 5 | START_TIME | DATE | No |  |  |
| 6 | END_TIME | DATE | No |  |  |
| 7 | PROGRAM_USER | VARCHAR2(6) | No |  |  |
| 8 | COMPLETE_COUNT | NUMBER | Yes |  |  |
| 9 | PARTIAL_COUNT | NUMBER | Yes |  |  |
| 10 | NO_XFER_COUNT | NUMBER | Yes |  |  |
| 11 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 12 | INTERFACE_TYPE | VARCHAR2(5) | Yes |  |  |

## Primary Key

**INTERFACE_LOG_PK**: `INTERFACE_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| INTERFACE_LOG_IDX2 | NORMAL | NONUNIQUE | START_TIME | VALID |
| INTERFACE_LOG_PK | NORMAL | UNIQUE | INTERFACE_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
