---
tags:
  - table
  - SRVSYS
---
# SERVE_AR_INTERFACE_DET

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 10420
**Last Analyzed**: 2025-09-16 03:16:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | REC_TYPE | NUMBER(1) | No |  |  |
| 2 | FI_COMPANY_NO | VARCHAR2(2) | No |  |  |
| 3 | ORDER_NO | VARCHAR2(14) | No |  |  |
| 4 | AR_ACCOUNT | VARCHAR2(20) | No |  |  |
| 5 | ITEM_ID | VARCHAR2(12) | No |  |  |
| 6 | SHIP_DATE | DATE | No |  |  |
| 7 | STD_PRICE | NUMBER(9,2) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | USER_TEXT_1 | VARCHAR2(24) | Yes |  |  |
| 10 | USER_TEXT_2 | VARCHAR2(24) | Yes |  |  |
| 11 | LINE_ITEM_DESC | VARCHAR2(60) | Yes |  |  |
| 12 | INTERFACE_DATE | DATE | Yes |  |  |
| 13 | FI_PRICE_SCH_NO | VARCHAR2(2) | Yes |  |  |
| 14 | LINE_ITEM_DESC_2 | VARCHAR2(60) | Yes |  |  |
| 15 | ORDER_QTY | NUMBER(4) | Yes |  |  |
| 16 | SHIP_QTY | NUMBER(4) | Yes |  |  |
| 17 | RETURN_ADVICE_ID | VARCHAR2(13) | Yes |  |  |
| 18 | TRAN_TYPE | VARCHAR2(2) | Yes |  |  |
| 19 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SERVE_INT_DET_ORD_INS_IDX | NORMAL | NONUNIQUE | ORDER_NO, INSERT_DATE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
