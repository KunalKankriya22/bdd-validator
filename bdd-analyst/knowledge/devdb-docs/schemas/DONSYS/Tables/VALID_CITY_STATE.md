---
tags:
  - table
  - DONSYS
---
# VALID_CITY_STATE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 79989
**Last Analyzed**: 2026-05-21 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | USPS_ID | NUMBER(6) | No |  |  |
| 2 | CITY | VARCHAR2(40) | No |  |  |
| 3 | STATE | VARCHAR2(2) | No |  |  |
| 4 | ZIP | VARCHAR2(5) | No |  |  |
| 5 | PLACE_NAME | VARCHAR2(40) | Yes |  |  |
| 6 | USPS_TYPE | VARCHAR2(2) | Yes |  |  |
| 7 | USPS_FINO | NUMBER(6) | Yes |  |  |
| 8 | USPS_FACILITY_CODE | VARCHAR2(1) | Yes |  |  |
| 9 | COUNTY | VARCHAR2(40) | Yes |  |  |
| 10 | COUNTY_NO | NUMBER(3) | Yes |  |  |
| 11 | USPS_LAST_LNAME | VARCHAR2(40) | Yes |  |  |
| 12 | USPS_LAST_LNO | VARCHAR2(40) | Yes |  |  |
| 13 | EFF_DATE | DATE | No |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 16 | INSERT_DATE | DATE | No |  |  |
| 17 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 18 | COMMONLY_USED_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

**VALID_CITY_STATE_PK**: `USPS_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_CITY_STATE_IDX1 | NORMAL | NONUNIQUE | CITY | VALID |
| VALID_CITY_STATE_IDX2 | NORMAL | NONUNIQUE | ZIP | VALID |
| VALID_CITY_STATE_PK | NORMAL | UNIQUE | USPS_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_CITY_STATE_BI|VALID_CITY_STATE_BI]] — BEFORE EACH ROW INSERT (ENABLED)

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
| GENBDR | PACKAGE | DONSYS |
