---
tags:
  - table
  - DONSYS
---
# VALID_VEHICLES_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 686
**Last Analyzed**: 2026-04-25 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | VEHICLE_ID | VARCHAR2(10) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | VEHICLE_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | VEHICLE_NAME | VARCHAR2(50) | Yes |  |  |
| 9 | LICENSE_PLATE | VARCHAR2(20) | Yes |  |  |
| 10 | VIN | VARCHAR2(20) | Yes |  |  |
| 11 | LAST_REGN_DATE | DATE | Yes |  |  |
| 12 | LAST_INSPN_DATE | DATE | Yes |  |  |
| 13 | INSP_RENEWAL_DATE | DATE | Yes |  |  |
| 14 | COMMISSION_DATE | DATE | Yes |  |  |
| 15 | DECOMMISSION_DATE | DATE | Yes |  |  |
| 16 | FDA_LICENSE_DATE | DATE | Yes |  |  |
| 17 | FDA_LICENSE_RENEWAL | DATE | Yes |  |  |
| 18 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 19 | EFF_DATE | DATE | Yes |  |  |
| 20 | TERM_DATE | DATE | Yes |  |  |

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
