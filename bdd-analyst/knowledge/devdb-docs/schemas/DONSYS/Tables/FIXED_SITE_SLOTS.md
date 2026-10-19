---
tags:
  - table
  - DONSYS
---
# FIXED_SITE_SLOTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 93680
**Last Analyzed**: 2025-09-16 03:13:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SITE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | SCH_DATE | DATE | No |  |  |
| 4 | PROC_CODE | VARCHAR2(5) | No |  |  |
| 5 | TIME_OF_DAY | DATE | No |  |  |
| 6 | MAX_SLOTS | NUMBER(4) | No |  |  |
| 7 | DONATION_TYPE_GROUP | VARCHAR2(5) | No |  |  |
| 8 | BOOKED_SLOTS | NUMBER(4) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FIXED_SITE_SLOTS_IDX1 | NORMAL | NONUNIQUE | SITE_ID, CHAPTER_ID, SCH_DATE | VALID |
| FIXED_SITE_SLOTS_IDX2 | NORMAL | NONUNIQUE | SCH_DATE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/FIXED_SITE_SLOTS_BI|FIXED_SITE_SLOTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
