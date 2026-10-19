---
tags:
  - table
  - DONSYS
---
# SPONSORS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 10877
**Last Analyzed**: 2026-04-08 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SPONSOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | NAME | VARCHAR2(50) | No |  |  |
| 4 | ADDRESS_ID | VARCHAR2(10) | No |  |  |
| 5 | TERRITORY_ID | VARCHAR2(10) | No |  |  |
| 6 | CATEGORY | VARCHAR2(5) | No |  |  |
| 7 | STATUS | VARCHAR2(5) | No |  |  |
| 8 | LOB | VARCHAR2(5) | Yes |  |  |
| 9 | EMPLOYEE_BASE | NUMBER(8) | Yes |  |  |
| 10 | PARENT_SPONSOR_ID | VARCHAR2(10) | Yes |  |  |
| 11 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 12 | SPONSOR_RATING | VARCHAR2(5) | Yes |  |  |
| 13 | DEFAULT_LOCATION_ID | VARCHAR2(10) | Yes |  |  |
| 14 | OLD_SPONSOR_ID | VARCHAR2(10) | Yes |  |  |
| 15 | CONV_SPONSOR_ID | VARCHAR2(10) | Yes |  |  |
| 16 | EFF_DATE | DATE | No |  |  |
| 17 | TERM_DATE | DATE | Yes |  |  |
| 18 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 19 | INSERT_DATE | DATE | No |  |  |
| 20 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 21 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**SPONSORS_PK**: `SPONSOR_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SPONSORS_IDX2 | NORMAL | NONUNIQUE | NAME | VALID |
| SPONSORS_IDX3 | NORMAL | NONUNIQUE | CATEGORY | VALID |
| SPONSORS_PK | NORMAL | UNIQUE | SPONSOR_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/SPONSORS_BD|SPONSORS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/SPONSORS_BI|SPONSORS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/SPONSORS_BU|SPONSORS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| DON_INFO | FUNCTION | DONSYS |
| DRIVE_SPON | VIEW | DONSYS |
