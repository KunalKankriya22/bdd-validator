---
tags:
  - table
  - SRVSYS
---
# PRODUCT_HISTORY

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 39586
**Last Analyzed**: 2025-09-16 03:16:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | ALIQUOT | VARCHAR2(2) | No |  |  |
| 5 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 6 | STATUS_IND | VARCHAR2(2) | No |  |  |
| 7 | FROM_DATE | DATE | No |  |  |
| 8 | USER_ID | VARCHAR2(10) | Yes |  |  |
| 9 | SHIPPED_TO | VARCHAR2(10) | Yes |  |  |
| 10 | BLOOD_TYPE | VARCHAR2(4) | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 13 | INVENTORY_CLASS | VARCHAR2(2) | Yes |  |  |
| 14 | LOCATION_ID | VARCHAR2(12) | Yes |  |  |
| 15 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PRODUCT_HISTORY_IDX_1 | NORMAL | NONUNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, ALIQUOT, STATUS_IND | VALID |
| PRODUCT_HISTORY_IDX_2 | NORMAL | NONUNIQUE | FROM_DATE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
