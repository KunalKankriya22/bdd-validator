---
tags:
  - table
  - SRVSYS
---
# ORDER_ITEM_ANTIGENS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 516
**Last Analyzed**: 2025-09-20 19:00:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ORDER_NO | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ITEM_NO | NUMBER(2) | No |  |  |
| 4 | ANTIGEN_ID | VARCHAR2(10) | No |  |  |
| 5 | UNIT_PRICE | NUMBER(9,2) | No |  |  |
| 6 | RESULT_STATUS | VARCHAR2(4) | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**ORDER_ITEM_ANTIGENS_PK**: `ORDER_NO, CHAPTER_ID, ITEM_NO, ANTIGEN_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| ORD_ORD_ITEM_ANTIGENS_FK | ORDER_NO, CHAPTER_ID | [[schemas/SRVSYS/Tables/ORDERS\|SRVSYS.ORDERS]] (ORDER_NO, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ORDER_ITEM_ANTIGENS_PK | NORMAL | UNIQUE | ORDER_NO, CHAPTER_ID, ITEM_NO, ANTIGEN_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
