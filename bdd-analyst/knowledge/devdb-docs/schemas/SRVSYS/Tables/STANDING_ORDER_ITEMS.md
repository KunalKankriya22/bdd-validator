---
tags:
  - table
  - SRVSYS
---
# STANDING_ORDER_ITEMS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 400
**Last Analyzed**: 2025-09-16 03:16:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CONSIGNEE_ID | VARCHAR2(10) | No |  |  |
| 4 | WEEK_DAY | VARCHAR2(3) | No |  |  |
| 5 | ITEM_NO | NUMBER(2) | No |  |  |
| 6 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 7 | BLOOD_TYPE | VARCHAR2(4) | No |  |  |
| 8 | TIER | VARCHAR2(2) | No |  |  |
| 9 | QTY | NUMBER(5) | No |  |  |
| 10 | MIN_QTY | NUMBER(5) | Yes |  |  |
| 11 | SUB_OK | VARCHAR2(1) | Yes |  |  |
| 12 | EFF_DATE | DATE | No |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |
| 14 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 15 | AUDIT_KEY | NUMBER | Yes |  |  |
| 16 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**STAND_ORD_ITEMS_PK**: `CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY, ITEM_NO, PRODUCT_TYPE, BLOOD_TYPE, TIER`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| ORD_STAND_ORD_ITEM_FK | CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY | [[schemas/SRVSYS/Tables/STANDING_ORDERS\|SRVSYS.STANDING_ORDERS]] (CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| STAND_ORD_ITEMS_PK | NORMAL | UNIQUE | CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY, ITEM_NO, PRODUCT_TYPE, BLOOD_TYPE, TIER | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
