---
tags:
  - table
  - SBCSYS
---
# UNIT_ADD_ON_BAGS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1820
**Last Analyzed**: 2026-05-22 03:00:15
**Partitioned**: NO

> [!quote] Created from Entity UNIT ADD ON BAGS by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SDC_WS_NUMBER | VARCHAR2(14) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | COLL_DATE | DATE | No |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 5 | ITEM_IND | VARCHAR2(2) | No |  |  |
| 6 | LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 7 | NUMBER_OF_ITEMS | NUMBER(2) | Yes |  |  |
| 8 | WAFER_LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 9 | STERILE_MACHINE | VARCHAR2(5) | Yes |  |  |
| 10 | WELD_FLAG | VARCHAR2(1) | Yes |  |  |
| 11 | COMPONENT_PREFIX | VARCHAR2(2) | Yes |  |  |
| 12 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 13 | NUMBER_OF_BAGS | NUMBER(2) | Yes |  |  |
| 14 | BAGS_USED | NUMBER(2) | Yes |  |  |
| 15 | SEGMENT_REM_FLAG | VARCHAR2(1) | Yes |  |  |
| 16 | SEGMENT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 17 | INSERT_DATS | DATE | No |  |  |
| 18 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 19 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 20 | AUDIT_KEY | NUMBER | No |  |  |
| 21 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UNIT_ADD_ON_BAGS | NORMAL | NONUNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/UNIT_ADDONBAGS_BEFORE_DELETE|UNIT_ADDONBAGS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/UNIT_ADDONBAGS_BEFORE_INSERT|UNIT_ADDONBAGS_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/UNIT_ADD_ON_BAGS_BEFORE_UPDATE|UNIT_ADD_ON_BAGS_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
