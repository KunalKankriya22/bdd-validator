---
tags:
  - table
  - DONSYS
---
# EVENTS_TO_REMEMBER

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:13:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EVENT_DATE | DATE | No |  |  |
| 2 | MM_YY | DATE | Yes |  |  |
| 3 | FOR_THE_DAY | VARCHAR2(1) | Yes |  |  |
| 4 | FOR_THE_WEEK | VARCHAR2(1) | Yes |  |  |
| 5 | FOR_THE_MONTH | VARCHAR2(1) | Yes |  |  |
| 6 | COMPANY_EVENT | VARCHAR2(1) | Yes |  |  |
| 7 | LOCAL_EVENT | VARCHAR2(1) | Yes |  |  |
| 8 | STATE_EVENT | VARCHAR2(1) | Yes |  |  |
| 9 | NATIONAL_EVENT | VARCHAR2(1) | Yes |  |  |
| 10 | INTERNATIONAL_EVENT | VARCHAR2(1) | Yes |  |  |
| 11 | BIRTH_DATE_FLAG | VARCHAR2(1) | Yes |  |  |
| 12 | EVENT_NAME | VARCHAR2(50) | Yes |  |  |
| 13 | EVENT_TEXT | VARCHAR2(240) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EVENTS_TO_REMEMBER_IDX1 | NORMAL | NONUNIQUE | EVENT_DATE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
