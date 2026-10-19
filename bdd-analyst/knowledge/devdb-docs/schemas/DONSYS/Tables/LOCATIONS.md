---
tags:
  - table
  - DONSYS
---
# LOCATIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 11160
**Last Analyzed**: 2026-04-11 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LOCATION_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | LOCATION_TYPE | VARCHAR2(5) | No |  |  |
| 4 | LOCATION_NAME | VARCHAR2(50) | No |  |  |
| 5 | ADDRESS_ID | VARCHAR2(10) | No |  |  |
| 6 | SITE_DIRECTIONS | VARCHAR2(1000) | Yes |  |  |
| 7 | TRAVEL_TIME | NUMBER(3) | Yes |  |  |
| 8 | TRAVEL_DISTANCE | NUMBER(6,2) | Yes |  |  |
| 9 | NEAREST_HOSPITAL_ID | VARCHAR2(10) | Yes |  |  |
| 10 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 11 | CONV_LOCATION_ID | VARCHAR2(10) | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 13 | INSERT_DATE | DATE | No |  |  |
| 14 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | OPEN_TIME | DATE | Yes |  |  |
| 16 | CLOSE_TIME | DATE | Yes |  |  |
| 17 | FDA_LICENSE_DATE | DATE | Yes |  |  |
| 18 | SITE_MANAGER | VARCHAR2(6) | Yes |  |  |
| 19 | EFF_DATE | DATE | No |  |  |
| 20 | TERM_DATE | DATE | Yes |  |  |
| 21 | ROTATION_FLAG | VARCHAR2(1) | Yes |  |  |
| 22 | STAFF_FACILITY | VARCHAR2(5) | Yes |  |  |
| 23 | ZONE | VARCHAR2(5) | Yes |  |  |
| 24 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

**LOCATIONS_PK**: `LOCATION_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/DONSYS/Tables/DRIVES\|DONSYS.DRIVES]] | LOCATION_DRIVE_FK | LOCATION_ID, CHAPTER_ID → LOCATION_ID, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| LOCATIONS_PK | NORMAL | UNIQUE | LOCATION_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/LOCATIONS_BI|LOCATIONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

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
| FIXED_SITES | VIEW | DONSYS |
