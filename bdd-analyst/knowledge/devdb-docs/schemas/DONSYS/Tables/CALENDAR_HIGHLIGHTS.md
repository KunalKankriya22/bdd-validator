---
tags:
  - table
  - DONSYS
---
# CALENDAR_HIGHLIGHTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 467
**Last Analyzed**: 2025-09-16 03:10:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | HI_MONTH | VARCHAR2(6) | Yes |  |  |
| 2 | HI_DATE | DATE | Yes |  |  |
| 3 | HI_MESSAGE | VARCHAR2(200) | Yes |  |  |
| 4 | HI_STATUS | VARCHAR2(5) | Yes |  |  |
| 5 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 8 | START_DATE | DATE | Yes |  |  |
| 9 | END_DATE | DATE | Yes |  |  |
| 10 | HOLIDAY_DATE | DATE | Yes |  |  |
| 11 | HOLIDAY_REASON | VARCHAR2(25) | Yes |  |  |
| 12 | HI_DATE_ENDTIME | DATE | Yes |  |  |
| 13 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CALENDAR_HIGHLIGHTS_IDX1 | NORMAL | NONUNIQUE | HI_MONTH | VALID |
| CALENDAR_HIGHLIGHTS_IDX2 | NORMAL | NONUNIQUE | HI_DATE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/CALENDAR_HIGHLIGHTS_BI|CALENDAR_HIGHLIGHTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
