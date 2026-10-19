---
tags:
  - table
  - SRVSYS
---
# SERVE_AR_INTERFACE_HDR

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3648
**Last Analyzed**: 2025-09-16 03:16:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | REC_TYPE | NUMBER(1) | No |  |  |
| 2 | FI_COMPANY_NO | VARCHAR2(2) | No |  |  |
| 3 | ORDER_NO | VARCHAR2(14) | No |  |  |
| 4 | AR_ACCOUNT | VARCHAR2(20) | No |  |  |
| 5 | INV_DESC | VARCHAR2(26) | No |  |  |
| 6 | ORDER_DATE | DATE | No |  |  |
| 7 | SHIP_DATE | DATE | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INTERFACE_DATE | DATE | Yes |  |  |
| 10 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SERVE_AR_ORDER_IDX | NORMAL | NONUNIQUE | ORDER_NO, INSERT_DATE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
