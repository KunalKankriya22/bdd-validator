---
tags:
  - table
  - DONSYS
---
# FIXED_SITE_HOURS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 28605
**Last Analyzed**: 2025-09-16 03:13:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | SITE_ID | VARCHAR2(10) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | WEEK_DAY | VARCHAR2(3) | Yes |  |  |
| 8 | FREQUENCY_CODE | VARCHAR2(5) | Yes |  |  |
| 9 | DONATION_TYPE_GROUP | VARCHAR2(5) | Yes |  |  |
| 10 | PROC_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | SLOT_TIME | DATE | Yes |  |  |
| 12 | BREAK_START_TIME | DATE | Yes |  |  |
| 13 | BREAK_END_TIME | DATE | Yes |  |  |
| 14 | NO_OF_BEDS | NUMBER(4) | Yes |  |  |
| 15 | NO_OF_STAFF | NUMBER(4) | Yes |  |  |
| 16 | CAPACITY | NUMBER(4) | Yes |  |  |
| 17 | OVERBOOK_LIMIT | NUMBER(4) | Yes |  |  |
| 18 | EFF_DATE | DATE | Yes |  |  |
| 19 | TERM_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
