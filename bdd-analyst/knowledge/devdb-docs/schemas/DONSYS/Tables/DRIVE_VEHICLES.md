---
tags:
  - table
  - DONSYS
---
# DRIVE_VEHICLES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3806
**Last Analyzed**: 2025-09-16 03:13:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | VEHICLE_ID | VARCHAR2(10) | No |  |  |
| 4 | BEFORE_MILEAGE | NUMBER(6) | Yes |  |  |
| 5 | AFTER_MILEAGE | NUMBER(6) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**DRIVE_VEHICLES_PK**: `DRIVE_ID, CHAPTER_ID, VEHICLE_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DRIVE_DRIVE_VEHICLES_FK | DRIVE_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DRIVES\|DONSYS.DRIVES]] (DRIVE_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_VEHICLES_PK | NORMAL | UNIQUE | DRIVE_ID, CHAPTER_ID, VEHICLE_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_VEHICLES_BI|DRIVE_VEHICLES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
