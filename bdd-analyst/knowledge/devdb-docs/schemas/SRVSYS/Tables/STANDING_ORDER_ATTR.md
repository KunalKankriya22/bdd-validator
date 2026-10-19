---
tags:
  - table
  - SRVSYS
---
# STANDING_ORDER_ATTR

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 27
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
| 6 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 7 | ATTRIB_CODE | VARCHAR2(4) | No |  |  |
| 8 | QTY | NUMBER(5) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**STAND_ORD_ATTR_PK**: `CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY, ITEM_NO, ATTRIB_GROUP, ATTRIB_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| ORD_STAND_ORD_ATTR_FK | CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY | [[schemas/SRVSYS/Tables/STANDING_ORDERS\|SRVSYS.STANDING_ORDERS]] (CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| STAND_ORD_ATTR_PK | NORMAL | UNIQUE | CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY, ITEM_NO, ATTRIB_GROUP, ATTRIB_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
