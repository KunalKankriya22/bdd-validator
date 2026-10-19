---
tags:
  - table
  - SRVSYS
---
# CUSTOMER_DBCR_ADJUST

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 325
**Last Analyzed**: 2025-09-21 23:01:23
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ADVICE_ID | VARCHAR2(13) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | INSERT_DATE | DATE | No |  |  |
| 4 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 5 | REASON_CODE | VARCHAR2(5) | No |  |  |
| 6 | TRAN_TYPE | VARCHAR2(2) | No |  |  |
| 7 | CUSTOMER_ID | VARCHAR2(10) | No |  |  |
| 8 | REQUESTED_BY | VARCHAR2(50) | Yes |  |  |
| 9 | REQUEST_DATE | DATE | Yes |  |  |
| 10 | ORDER_NO | VARCHAR2(14) | Yes |  |  |
| 11 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 12 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 13 | ALIQUOT | VARCHAR2(2) | Yes |  |  |
| 14 | SERVICE_CODE | VARCHAR2(12) | Yes |  |  |
| 15 | QUANTITY | NUMBER(6) | Yes |  |  |
| 16 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 17 | ERROR_CORRECT_FLAG | VARCHAR2(1) | Yes |  |  |
| 18 | ERROR_CORRECT_DATE | DATE | Yes |  |  |
| 19 | ERROR_CORRECT_USER | VARCHAR2(6) | Yes |  |  |
| 20 | AMOUNT | NUMBER(10,2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| CUST_CUST_DBCR_ADJUST_FK | CUSTOMER_ID, CHAPTER_ID | [[schemas/SRVSYS/Tables/CUSTOMERS\|SRVSYS.CUSTOMERS]] (CUSTOMER_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
