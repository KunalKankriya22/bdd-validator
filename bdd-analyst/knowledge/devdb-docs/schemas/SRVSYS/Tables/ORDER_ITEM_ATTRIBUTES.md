---
tags:
  - table
  - SRVSYS
---
# ORDER_ITEM_ATTRIBUTES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 913
**Last Analyzed**: 2025-09-16 03:16:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ORDER_NO | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ITEM_NO | NUMBER(2) | No |  |  |
| 4 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 5 | ATTRIB_CODE | VARCHAR2(10) | No |  |  |
| 6 | UNIT_PRICE | NUMBER(9,2) | Yes |  |  |
| 7 | SOURCE_PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | SOURCE_QTY | NUMBER(5) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**ORDER_ITEM_ATTRIBUTES_PK**: `ORDER_NO, CHAPTER_ID, ITEM_NO, ATTRIB_GROUP, ATTRIB_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| ORD_ORD_ITEM_ATTRIB_FK | ORDER_NO, CHAPTER_ID | [[schemas/SRVSYS/Tables/ORDERS\|SRVSYS.ORDERS]] (ORDER_NO, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ORDER_ITEM_ATTRIBUTES_PK | NORMAL | UNIQUE | ORDER_NO, CHAPTER_ID, ITEM_NO, ATTRIB_GROUP, ATTRIB_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
