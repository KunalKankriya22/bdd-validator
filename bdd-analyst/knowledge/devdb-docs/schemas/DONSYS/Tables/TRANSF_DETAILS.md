---
tags:
  - table
  - DONSYS
---
# TRANSF_DETAILS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 20757
**Last Analyzed**: 2026-05-16 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PAT_ID | VARCHAR2(10) | No |  |  |
| 2 | SURG_ID | VARCHAR2(10) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | FACILITY_ID | VARCHAR2(10) | No |  |  |
| 5 | PHY_ID | VARCHAR2(10) | No |  |  |
| 6 | SHIP_ID | VARCHAR2(10) | No |  |  |
| 7 | UNITS_REQUIRED | VARCHAR2(7) | No |  |  |
| 8 | PHY_AUTH_DATE | DATE | Yes |  |  |
| 9 | SURG_DATE | DATE | Yes |  |  |
| 10 | SURG_TYPE | VARCHAR2(10) | Yes |  |  |
| 11 | EMERGENCY_FLAG | VARCHAR2(1) | Yes |  |  |
| 12 | CLOSED_DATE | DATE | Yes |  |  |
| 13 | CLOSED_USER | DATE | Yes |  |  |
| 14 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 16 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 17 | INSERT_DATE | DATE | No |  |  |
| 18 | AUDIT_KEY | NUMBER | No |  |  |
| 19 | HOSPITAL_ID | VARCHAR2(10) | Yes |  |  |
| 20 | REQUESTING_HOSP_ID | VARCHAR2(10) | Yes |  |  |
| 21 | DATE_NEEDED_BY | DATE | Yes |  |  |

## Primary Key

**TRANSF_DETAILS_PK**: `PAT_ID, SURG_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TRANSF_DETAILS_PK | NORMAL | UNIQUE | PAT_ID, SURG_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/TRANSF_DETAILS_BD|TRANSF_DETAILS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/TRANSF_DETAILS_BI|TRANSF_DETAILS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/TRANSF_DETAILS_BU|TRANSF_DETAILS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
