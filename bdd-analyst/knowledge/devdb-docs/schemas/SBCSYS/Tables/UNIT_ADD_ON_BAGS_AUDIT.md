---
tags:
  - table
  - SBCSYS
---
# UNIT_ADD_ON_BAGS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3517
**Last Analyzed**: 2025-09-20 03:00:33
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 3 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 4 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 5 | SDC_WS_NUMBER | VARCHAR2(14) | Yes |  |  |
| 6 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 7 | COLL_DATE | DATE | Yes |  |  |
| 8 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 9 | ITEM_IND | VARCHAR2(2) | Yes |  |  |
| 10 | LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 11 | NUMBER_OF_ITEMS | NUMBER(2) | Yes |  |  |
| 12 | WAFER_LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 13 | STERILE_MACHINE | VARCHAR2(5) | Yes |  |  |
| 14 | WELD_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | COMPONENT_PREFIX | VARCHAR2(2) | Yes |  |  |
| 16 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 17 | NUMBER_OF_BAGS | NUMBER(2) | Yes |  |  |
| 18 | BAGS_USED | NUMBER(2) | Yes |  |  |
| 19 | SEGMENT_REM_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | SEGMENT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 21 | INSERT_DATS | DATE | Yes |  |  |
| 22 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 23 | NOTE_ID | NUMBER(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UNIT_ADD_ON_BAGS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
