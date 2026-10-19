---
tags:
  - table
  - SRVSYS
---
# ORDER_CHARGES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1169
**Last Analyzed**: 2025-09-16 03:16:06
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ORDER_NO | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CHARGE_CODE | VARCHAR2(5) | No |  |  |
| 4 | AMOUNT | NUMBER(9,2) | No |  |  |
| 5 | CR_DB_IND | VARCHAR2(2) | Yes |  |  |
| 6 | DISCOUNT_PERCENT | NUMBER(5,2) | Yes |  |  |
| 7 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 8 | SHIPMENT_NO | VARCHAR2(14) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 11 | QUANTITY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| ORDERS_ORDER_CHARGES_FK | ORDER_NO, CHAPTER_ID | [[schemas/SRVSYS/Tables/ORDERS\|SRVSYS.ORDERS]] (ORDER_NO, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ORDER_CHARGES_IDX_1 | NORMAL | NONUNIQUE | ORDER_NO, CHAPTER_ID, CHARGE_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
