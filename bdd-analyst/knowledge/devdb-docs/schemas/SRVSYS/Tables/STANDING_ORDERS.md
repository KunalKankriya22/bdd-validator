---
tags:
  - table
  - SRVSYS
---
# STANDING_ORDERS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 133
**Last Analyzed**: 2025-09-16 03:16:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CONSIGNEE_ID | VARCHAR2(10) | No |  |  |
| 4 | WEEK_DAY | VARCHAR2(3) | No |  |  |
| 5 | CONFIRM_FLAG | VARCHAR2(1) | No |  |  |
| 6 | REQUIRED_TIME | NUMBER(2) | Yes |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**STANDING_ORDERS_PK**: `CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SRVSYS/Tables/STANDING_ORDER_ATTR\|SRVSYS.STANDING_ORDER_ATTR]] | ORD_STAND_ORD_ATTR_FK | CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY → CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY |
| [[schemas/SRVSYS/Tables/STANDING_ORDER_ITEMS\|SRVSYS.STANDING_ORDER_ITEMS]] | ORD_STAND_ORD_ITEM_FK | CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY → CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| STANDING_ORDERS_PK | NORMAL | UNIQUE | CONTRACT_ID, CHAPTER_ID, CONSIGNEE_ID, WEEK_DAY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
