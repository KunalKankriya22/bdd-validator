---
tags:
  - table
  - SRVSYS
---
# BOXES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3034
**Last Analyzed**: 2025-09-16 03:16:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BOX_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | BOX_TYPE | VARCHAR2(2) | No |  |  |
| 4 | BOX_STATUS | VARCHAR2(2) | No |  |  |
| 5 | PACKED_BY | VARCHAR2(10) | No |  |  |
| 6 | PACKED_DATE | DATE | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | SHIPMENT_NO | VARCHAR2(14) | Yes |  |  |
| 9 | MIN_TEMP | NUMBER(5,2) | Yes |  |  |
| 10 | MAX_TEMP | NUMBER(5,2) | Yes |  |  |
| 11 | TEMPERATURE | NUMBER(5,2) | Yes |  |  |
| 12 | CLOSED_DATE | DATE | Yes |  |  |
| 13 | DISCARD_ID | VARCHAR2(10) | Yes |  |  |
| 14 | PRODUCT_GROUPING | VARCHAR2(2) | Yes |  |  |
| 15 | MFG_PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 16 | MFG_PRODUCT_VOLUME | NUMBER(9,2) | Yes |  |  |
| 17 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 18 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |

## Primary Key

**BOXES_PK**: `BOX_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| BOXES_PK | NORMAL | UNIQUE | BOX_ID, CHAPTER_ID | VALID |

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
| V_ALL_ORD_SHIP | VIEW | SRVSYS |
| V_ORDERS_TO_SHIPMENTS | VIEW | SRVSYS |
