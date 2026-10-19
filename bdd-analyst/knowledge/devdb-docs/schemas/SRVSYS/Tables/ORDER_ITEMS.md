---
tags:
  - table
  - SRVSYS
---
# ORDER_ITEMS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 5267
**Last Analyzed**: 2025-09-20 19:00:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ORDER_NO | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ITEM_NO | NUMBER(2) | No |  |  |
| 4 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 5 | BLOOD_TYPE | VARCHAR2(4) | No |  |  |
| 6 | TIER | NUMBER(2) | No |  |  |
| 7 | ITEM_STATUS | VARCHAR2(2) | No |  |  |
| 8 | REQUIRED_QTY | NUMBER(5) | No |  |  |
| 9 | ALLOCATED_QTY | NUMBER(5) | No |  |  |
| 10 | SHIPPED_QTY | NUMBER(5) | No |  |  |
| 11 | SYSTEM_CANCEL_QTY | NUMBER(5) | Yes |  |  |
| 12 | SUB_OK | VARCHAR2(1) | Yes |  |  |
| 13 | UNIT_PRICE | NUMBER(9,2) | Yes |  |  |
| 14 | CANCELED_QTY | NUMBER(5) | Yes |  |  |
| 15 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 16 | SUB_QTY | NUMBER(5) | Yes |  |  |
| 17 | AUDIT_KEY | NUMBER | Yes |  |  |
| 18 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**ORDER_ITEMS_PK**: `ORDER_NO, CHAPTER_ID, ITEM_NO`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| ORDERS_ORDER_DETAILS_FK | ORDER_NO, CHAPTER_ID | [[schemas/SRVSYS/Tables/ORDERS\|SRVSYS.ORDERS]] (ORDER_NO, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ORDER_ITEMS_PK | NORMAL | UNIQUE | ORDER_NO, CHAPTER_ID, ITEM_NO | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
