---
tags:
  - table
  - DONSYS
---
# FIXED_SITE_HOURS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8078
**Last Analyzed**: 2025-09-16 03:13:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SITE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | WEEK_DAY | VARCHAR2(3) | No |  |  |
| 4 | FREQUENCY_CODE | VARCHAR2(5) | No |  |  |
| 5 | DONATION_TYPE_GROUP | VARCHAR2(5) | No |  |  |
| 6 | PROC_CODE | VARCHAR2(5) | No |  |  |
| 7 | SLOT_TIME | DATE | No |  |  |
| 8 | BREAK_START_TIME | DATE | Yes |  |  |
| 9 | BREAK_END_TIME | DATE | Yes |  |  |
| 10 | NO_OF_BEDS | NUMBER(4) | Yes |  |  |
| 11 | NO_OF_STAFF | NUMBER(4) | Yes |  |  |
| 12 | CAPACITY | NUMBER(4) | Yes |  |  |
| 13 | OVERBOOK_LIMIT | NUMBER(4) | Yes |  |  |
| 14 | EFF_DATE | DATE | No |  |  |
| 15 | TERM_DATE | DATE | Yes |  |  |
| 16 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 17 | INSERT_DATE | DATE | No |  |  |
| 18 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 19 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FIXED_SITE_HOURS_IDX1 | NORMAL | NONUNIQUE | SITE_ID, CHAPTER_ID, WEEK_DAY | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/FIXED_SITE_HOURS_BD|FIXED_SITE_HOURS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/FIXED_SITE_HOURS_BI|FIXED_SITE_HOURS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/FIXED_SITE_HOURS_BU|FIXED_SITE_HOURS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
