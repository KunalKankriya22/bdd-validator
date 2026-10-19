---
tags:
  - table
  - GTSHIP
---
# GELTUBE_PLASMA_DETAILS

**Schema**: [[schemas/GTSHIP/GTSHIP|GTSHIP]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1723
**Last Analyzed**: 2025-09-30 03:00:20
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(5) | No |  |  |
| 3 | CHECKIN_DATE | DATE | Yes |  |  |
| 4 | TUBE_STATUS | VARCHAR2(2) | Yes |  |  |
| 5 | TUBE_CHECKIN_USER | VARCHAR2(30) | Yes |  |  |
| 6 | PROD_CODE | VARCHAR2(8) | Yes |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | DELETE_REASON | VARCHAR2(10) | Yes |  |  |
| 12 | COLL_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| GELTUBE_PLASMA_DETAILS_IDX1 | NORMAL | NONUNIQUE | UNIT_ID | VALID |
| GELTUBE_PLASMA_DETAILS_IDX2 | NORMAL | NONUNIQUE | UNIT_ID, COLL_DATE | VALID |

## Triggers

- [[schemas/GTSHIP/Triggers/GELTUBE_PLASMA_DETAILS_BD|GELTUBE_PLASMA_DETAILS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/GTSHIP/Triggers/GELTUBE_PLASMA_DETAILS_BI|GELTUBE_PLASMA_DETAILS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/GTSHIP/Triggers/GELTUBE_PLASMA_DETAILS_BU|GELTUBE_PLASMA_DETAILS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
| GELTUBE_PLASMA | PACKAGE | GTSHIP |
