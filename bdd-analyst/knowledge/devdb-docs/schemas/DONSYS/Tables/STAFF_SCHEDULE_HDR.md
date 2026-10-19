---
tags:
  - table
  - DONSYS
---
# STAFF_SCHEDULE_HDR

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 587
**Last Analyzed**: 2025-09-16 03:14:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SCHEDULE_ID | VARCHAR2(20) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | START_DATE | DATE | No |  |  |
| 4 | END_DATE | DATE | No |  |  |
| 5 | STATUS | VARCHAR2(5) | No |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | COMMENTS | VARCHAR2(500) | Yes |  |  |
| 11 | MIXFC | NUMBER(8) | Yes |  |  |
| 12 | MIXTM | NUMBER(8) | Yes |  |  |
| 13 | NOOFF | NUMBER(8) | Yes |  |  |
| 14 | OVTIM | NUMBER(8) | Yes |  |  |
| 15 | PARTA | NUMBER(8) | Yes |  |  |
| 16 | RECOV | NUMBER(8) | Yes |  |  |
| 17 | UNTIM | NUMBER(8) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/STAFF_SCHEDULE_HDR_BI|STAFF_SCHEDULE_HDR_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
