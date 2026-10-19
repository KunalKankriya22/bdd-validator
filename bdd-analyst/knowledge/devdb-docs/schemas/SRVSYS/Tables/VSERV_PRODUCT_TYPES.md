---
tags:
  - table
  - SRVSYS
---
# VSERV_PRODUCT_TYPES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 99
**Last Analyzed**: 2026-05-10 15:04:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 2 | PRODUCT_TYPE_SHORT_NAME | VARCHAR2(10) | No |  |  |
| 3 | PRODUCT_TYPE_DESC | VARCHAR2(50) | No |  |  |
| 4 | LIFE_SPAN_IND | VARCHAR2(2) | Yes |  |  |
| 5 | LIFE_SPAN | NUMBER(5) | Yes |  |  |
| 6 | STD_PRICE | NUMBER(9,2) | Yes |  |  |
| 7 | MIN_TEMP | NUMBER(5,2) | Yes |  |  |
| 8 | MAX_TEMP | NUMBER(5,2) | Yes |  |  |
| 9 | SORT_SEQUENCE | NUMBER(2) | Yes |  |  |
| 10 | PRODUCT_GROUPING | VARCHAR2(2) | Yes |  |  |
| 11 | ABO_ONLY | VARCHAR2(1) | Yes |  |  |
| 12 | POOL_PRODUCT | VARCHAR2(1) | Yes |  |  |
| 13 | SPECIAL_PRODUCT_TYPE | VARCHAR2(1) | Yes |  |  |
| 14 | SHIP_ANY_RH | VARCHAR2(1) | Yes |  |  |
| 15 | EFF_DATE | DATE | No |  |  |
| 16 | TERM_DATE | DATE | Yes |  |  |
| 17 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 18 | AUDIT_KEY | NUMBER | No |  |  |
| 19 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 20 | ABO_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_PRODUCT_TYPES_IDX_1 | NORMAL | UNIQUE | PRODUCT_TYPE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_PRODUCT_TYPES_BEFORE_DEL|VSERV_PRODUCT_TYPES_BEFORE_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_PRODUCT_TYPES_BEFORE_INS|VSERV_PRODUCT_TYPES_BEFORE_INS]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_PRODUCT_TYPES_BEFORE_UP|VSERV_PRODUCT_TYPES_BEFORE_UP]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
