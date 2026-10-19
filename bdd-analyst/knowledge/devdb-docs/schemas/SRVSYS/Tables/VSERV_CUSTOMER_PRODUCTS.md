---
tags:
  - table
  - SRVSYS
---
# VSERV_CUSTOMER_PRODUCTS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 92
**Last Analyzed**: 2026-05-23 11:00:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CONSIGNEE_ID | VARCHAR2(10) | Yes |  |  |
| 3 | PROD_TYPE | VARCHAR2(5) | Yes |  |  |
| 4 | PROD_CODE | VARCHAR2(8) | Yes |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| VSERV_CONSIGNEE_ID_FK | CONSIGNEE_ID, CHAPTER_ID | [[schemas/SRVSYS/Tables/CONSIGNEE\|SRVSYS.CONSIGNEE]] (CONSIGNEE_ID, CHAPTER_ID) | NO ACTION |
| VSERV_CUSTOMER_ID_FK | CUSTOMER_ID, CHAPTER_ID | [[schemas/SRVSYS/Tables/CUSTOMERS\|SRVSYS.CUSTOMERS]] (CUSTOMER_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_CUSTOMER_PRODUCTS_BI|VSERV_CUSTOMER_PRODUCTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
