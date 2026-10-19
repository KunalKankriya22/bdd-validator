---
tags:
  - table
  - DONSYS
---
# ROLLOVER_RUN_LOG

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 291
**Last Analyzed**: 2026-03-31 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ROLLOVER_RUN_DATE | DATE | No |  |  |
| 2 | RUN_NUMBER | NUMBER | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | SPONSOR_ID | VARCHAR2(10) | Yes |  |  |
| 5 | FUTURE_DRIVE_DATE | DATE | Yes |  |  |
| 6 | LOG_SEQ | NUMBER | No |  |  |
| 7 | LOG_TYPE | VARCHAR2(10) | Yes |  |  |
| 8 | LOG_DATE | DATE | No |  |  |
| 9 | LOG_TEXT | VARCHAR2(2000) | No |  |  |
| 10 | USER_DISPLAY | VARCHAR2(1) | Yes |  |  |

## Primary Key

**ROLLOVER_RUN_LOG_PK**: `ROLLOVER_RUN_DATE, RUN_NUMBER, LOG_SEQ`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ROLLOVER_RUN_LOG_PK | NORMAL | UNIQUE | ROLLOVER_RUN_DATE, RUN_NUMBER, LOG_SEQ | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
