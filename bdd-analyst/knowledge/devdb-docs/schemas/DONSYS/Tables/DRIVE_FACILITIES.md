---
tags:
  - table
  - DONSYS
---
# DRIVE_FACILITIES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 10049
**Last Analyzed**: 2025-09-16 03:13:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | FACILITY_CODE | VARCHAR2(5) | No |  |  |
| 4 | INSERT_DATE | DATE | No |  |  |
| 5 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**DRIVE_FACILITIES_PK**: `DRIVE_ID, CHAPTER_ID, FACILITY_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DRIVE_DRIVE_FACILITIES_FK | DRIVE_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DRIVES\|DONSYS.DRIVES]] (DRIVE_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_FACILITIES_PK | NORMAL | UNIQUE | DRIVE_ID, CHAPTER_ID, FACILITY_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_FACILITIES_BI|DRIVE_FACILITIES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
