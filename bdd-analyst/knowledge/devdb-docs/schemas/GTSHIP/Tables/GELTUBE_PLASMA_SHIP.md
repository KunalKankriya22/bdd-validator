---
tags:
  - table
  - GTSHIP
---
# GELTUBE_PLASMA_SHIP

**Schema**: [[schemas/GTSHIP/GTSHIP|GTSHIP]]
**Tablespace**: BC_DATA
**Estimated Rows**: 44
**Last Analyzed**: 2025-02-28 22:00:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TUBE_SHIP_NO | VARCHAR2(15) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | PACKED_BY | VARCHAR2(30) | Yes |  |  |
| 4 | PACKED_DATE | DATE | Yes |  |  |
| 5 | INSERT_DATE | DATE | Yes |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | Yes |  |  |
| 8 | PLASMA_SHIP_NO | VARCHAR2(14) | Yes |  |  |
| 9 | STATUS_FLAG | VARCHAR2(2) | Yes |  |  |
| 10 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 11 | RECEIVED_DATE | DATE | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | SHIPMENT_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| GELTUBE_PLASMA_SHIP_IDX1 | NORMAL | NONUNIQUE | TUBE_SHIP_NO, PLASMA_SHIP_NO | VALID |

## Triggers

- [[schemas/GTSHIP/Triggers/GELTUBE_PLASMA_SHIP_BD|GELTUBE_PLASMA_SHIP_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/GTSHIP/Triggers/GELTUBE_PLASMA_SHIP_BI|GELTUBE_PLASMA_SHIP_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/GTSHIP/Triggers/GELTUBE_PLASMA_SHIP_BU|GELTUBE_PLASMA_SHIP_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
