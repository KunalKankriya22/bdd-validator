---
tags:
  - table
  - SRVSYS
---
# VSERV_PRODUCT_TYPES_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1109
**Last Analyzed**: 2026-04-23 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 2 | PRODUCT_TYPE_SHORT_NAME | VARCHAR2(10) | Yes |  |  |
| 3 | PRODUCT_TYPE_DESC | VARCHAR2(50) | Yes |  |  |
| 4 | LIFE_SPAN_IND | VARCHAR2(2) | Yes |  |  |
| 5 | LIFE_SPAN | NUMBER(5) | Yes |  |  |
| 6 | STD_PRICE | NUMBER(9,2) | Yes |  |  |
| 7 | MIN_TEMP | NUMBER(5,2) | Yes |  |  |
| 8 | MAX_TEMP | NUMBER(5,2) | Yes |  |  |
| 9 | EFF_DATE | DATE | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 12 | SORT_SEQUENCE | NUMBER(2) | Yes |  |  |
| 13 | PRODUCT_GROUPING | VARCHAR2(2) | Yes |  |  |
| 14 | ABO_ONLY | VARCHAR2(1) | Yes |  |  |
| 15 | POOL_PRODUCT | VARCHAR2(1) | Yes |  |  |
| 16 | SPECIAL_PRODUCT_TYPE | VARCHAR2(1) | Yes |  |  |
| 17 | SHIP_ANY_RH | VARCHAR2(1) | Yes |  |  |
| 18 | AUDIT_KEY | NUMBER | No |  |  |
| 19 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 20 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 21 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_PRODUCT_TYPES_AUD_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
