---
tags:
  - table
  - DONSYS
---
# VALID_VEHICLES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 179
**Last Analyzed**: 2026-04-25 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | VEHICLE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | VEHICLE_TYPE | VARCHAR2(5) | No |  |  |
| 4 | VEHICLE_NAME | VARCHAR2(50) | Yes |  |  |
| 5 | LICENSE_PLATE | VARCHAR2(20) | Yes |  |  |
| 6 | VIN | VARCHAR2(20) | Yes |  |  |
| 7 | LAST_REGN_DATE | DATE | Yes |  |  |
| 8 | LAST_INSPN_DATE | DATE | Yes |  |  |
| 9 | INSP_RENEWAL_DATE | DATE | Yes |  |  |
| 10 | COMMISSION_DATE | DATE | Yes |  |  |
| 11 | DECOMMISSION_DATE | DATE | Yes |  |  |
| 12 | FDA_LICENSE_DATE | DATE | Yes |  |  |
| 13 | FDA_LICENSE_RENEWAL | DATE | Yes |  |  |
| 14 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 15 | EFF_DATE | DATE | No |  |  |
| 16 | TERM_DATE | DATE | Yes |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 18 | INSERT_DATE | DATE | No |  |  |
| 19 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 20 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_VEHICLES_PK**: `VEHICLE_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_VEHICLES_PK | NORMAL | UNIQUE | VEHICLE_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_VEHICLES_BD|VALID_VEHICLES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_VEHICLES_BI|VALID_VEHICLES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_VEHICLES_BU|VALID_VEHICLES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
