---
tags:
  - table
  - GTSHIP
---
# GELTUBE_PLASMA_BOXES

**Schema**: [[schemas/GTSHIP/GTSHIP|GTSHIP]]
**Tablespace**: BC_DATA
**Estimated Rows**: 78
**Last Analyzed**: 2025-03-15 03:00:51
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BOX_ID | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(5) | No |  |  |
| 3 | TUBE_SHIP_NO | VARCHAR2(14) | No |  |  |
| 4 | PLASMA_SHIP_NO | VARCHAR2(14) | No |  |  |
| 5 | BOX_STATUS | VARCHAR2(2) | Yes |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | TUBE_SHIP_STATUS | VARCHAR2(2) | Yes |  |  |
| 11 | PLASMA_BOX_ID | VARCHAR2(14) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| GELTUBE_PLASMA_BOXES_IDX1 | NORMAL | NONUNIQUE | BOX_ID | VALID |
| GELTUBE_PLASMA_BOXES_IDX2 | NORMAL | NONUNIQUE | BOX_ID, PLASMA_SHIP_NO | VALID |

## Triggers

- [[schemas/GTSHIP/Triggers/GELTUBE_PLASMA_BOXES_BD|GELTUBE_PLASMA_BOXES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/GTSHIP/Triggers/GELTUBE_PLASMA_BOXES_BI|GELTUBE_PLASMA_BOXES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/GTSHIP/Triggers/GELTUBE_PLASMA_BOXES_BU|GELTUBE_PLASMA_BOXES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
