---
tags:
  - table
  - DONSYS
---
# AUX_DONATIONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 92982
**Last Analyzed**: 2026-03-31 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 4 | LOCATION_ID | VARCHAR2(10) | Yes |  |  |
| 5 | SPONSOR_ID | VARCHAR2(10) | Yes |  |  |
| 6 | OLD_DONOR_ID | NUMBER(8) | Yes |  |  |
| 7 | BAG_TYPE | NUMBER(2) | Yes |  |  |
| 8 | START_TIME | NUMBER(4) | Yes |  |  |
| 9 | CATEGORY | VARCHAR2(2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| AUX_DONATIONS_D1 | NORMAL | NONUNIQUE | DONOR_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
