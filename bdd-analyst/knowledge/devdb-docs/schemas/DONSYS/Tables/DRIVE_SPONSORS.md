---
tags:
  - table
  - DONSYS
---
# DRIVE_SPONSORS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 49902
**Last Analyzed**: 2025-09-16 03:13:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | SPONSOR_ID | VARCHAR2(10) | No |  |  |
| 4 | PROJECTED_SHOW | NUMBER(6) | Yes |  |  |
| 5 | PROJECTED_DRAW | NUMBER(6) | Yes |  |  |
| 6 | CONTACT_ID | VARCHAR2(10) | Yes |  |  |
| 7 | PROJ_DEFERRAL_RATE | NUMBER(6,2) | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**DRIVE_SPONSORS_PK**: `DRIVE_ID, CHAPTER_ID, SPONSOR_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DRIVE_DRIVE_SPONSORS_FK | DRIVE_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DRIVES\|DONSYS.DRIVES]] (DRIVE_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_SPONSORS_IDX1 | NORMAL | NONUNIQUE | SPONSOR_ID | VALID |
| DRIVE_SPONSORS_IDX2 | NORMAL | NONUNIQUE | SPONSOR_ID, CHAPTER_ID | VALID |
| DRIVE_SPONSORS_PK | NORMAL | UNIQUE | DRIVE_ID, CHAPTER_ID, SPONSOR_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_SPONSORS_BD|DRIVE_SPONSORS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DRIVE_SPONSORS_BI|DRIVE_SPONSORS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DRIVE_SPONSORS_BU|DRIVE_SPONSORS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
