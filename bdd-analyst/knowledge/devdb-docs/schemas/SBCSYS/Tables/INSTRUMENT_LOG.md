---
tags:
  - table
  - SBCSYS
---
# INSTRUMENT_LOG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 22
**Last Analyzed**: 2025-11-22 04:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TB_ID | VARCHAR2(14) | No |  |  |
| 2 | TEST_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | READ_DATS | DATE | No |  |  |
| 5 | MACHINE_ID | VARCHAR2(6) | No |  |  |
| 6 | STATION_NO | VARCHAR2(3) | No |  |  |
| 7 | XMT_STATUS | VARCHAR2(4) | No |  |  |
| 8 | STATUS_DATS | DATE | No |  |  |
| 9 | FILE_NAME | VARCHAR2(30) | Yes |  |  |
| 10 | OK_COUNT | NUMBER(4) | Yes |  |  |
| 11 | VOID_COUNT | NUMBER(4) | Yes |  |  |
| 12 | UNUSED_COUNT | NUMBER(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| INSTRUMENT_LOG_IDX1 | NORMAL | NONUNIQUE | TB_ID, TEST_CHAPTER_ID, TEST_ID, READ_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
