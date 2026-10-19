---
tags:
  - table
  - SRVSYS
---
# CUSTOMERS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1695
**Last Analyzed**: 2025-09-20 19:00:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CUSTOMER_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ALPHA_KEY | VARCHAR2(10) | Yes |  |  |
| 4 | CUSTOMER_TYPE | VARCHAR2(2) | No |  |  |
| 5 | NAME | VARCHAR2(50) | No |  |  |
| 6 | SHORT_NAME | VARCHAR2(15) | No |  |  |
| 7 | ADDRESS_1 | VARCHAR2(50) | No |  |  |
| 8 | ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 9 | ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 10 | CITY | VARCHAR2(75) | No |  |  |
| 11 | STATE | VARCHAR2(2) | Yes |  |  |
| 12 | COUNTRY | VARCHAR2(50) | No |  |  |
| 13 | ZIP | VARCHAR2(10) | No |  |  |
| 14 | PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 15 | PHONE_EXT | VARCHAR2(5) | Yes |  |  |
| 16 | FAX_NO | VARCHAR2(20) | Yes |  |  |
| 17 | TELEX_NO | VARCHAR2(20) | Yes |  |  |
| 18 | PAYEE_ID | VARCHAR2(10) | Yes |  |  |
| 19 | COD_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | RETURN_ACCEPTED_FLAG | VARCHAR2(1) | Yes |  |  |
| 21 | AR_ACCOUNT | VARCHAR2(20) | Yes |  |  |
| 22 | CP6_DEST | VARCHAR2(4) | Yes |  |  |
| 23 | FI_PRICE_SCH_NO | VARCHAR2(2) | Yes |  |  |
| 24 | EFF_DATE | DATE | No |  |  |
| 25 | TERM_DATE | DATE | Yes |  |  |
| 26 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 27 | AUDIT_KEY | NUMBER | No |  |  |
| 28 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 29 | PRICE_CHANGE_FLAG | VARCHAR2(1) | Yes |  |  |
| 30 | EDN_GEN_FLAG | VARCHAR2(1) | Yes |  |  |
| 31 | PH_APPR_FLAG | VARCHAR2(1) | Yes |  |  |
| 32 | INS_APPR_FLAG | VARCHAR2(1) | Yes |  |  |
| 33 | INT_FLAG | VARCHAR2(1) | Yes |  |  |
| 34 | INT_PHONE | VARCHAR2(20) | Yes |  |  |
| 35 | PLASMA_FILE_TYPE | VARCHAR2(10) | Yes |  |  |

## Primary Key

**CUSTOMERS_PK**: `CUSTOMER_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SRVSYS/Tables/CUSTOMER_DBCR_ADJUST\|SRVSYS.CUSTOMER_DBCR_ADJUST]] | CUST_CUST_DBCR_ADJUST_FK | CUSTOMER_ID, CHAPTER_ID → CUSTOMER_ID, CHAPTER_ID |
| [[schemas/SRVSYS/Tables/CUSTOMER_PREFERRED_TIERS\|SRVSYS.CUSTOMER_PREFERRED_TIERS]] | CUST_CUST_PREF_TIERS_FK | CUSTOMER_ID, CHAPTER_ID → CUSTOMER_ID, CHAPTER_ID |
| [[schemas/SRVSYS/Tables/ORDERS\|SRVSYS.ORDERS]] | CUSTOMER_ORDERS_FK | CUSTOMER_ID, CHAPTER_ID → CUSTOMER_ID, CHAPTER_ID |
| [[schemas/SRVSYS/Tables/VSERV_CUSTOMER_PRODUCTS\|SRVSYS.VSERV_CUSTOMER_PRODUCTS]] | VSERV_CUSTOMER_ID_FK | CUSTOMER_ID, CHAPTER_ID → CUSTOMER_ID, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CUSTOMERS_IDX2 | NORMAL | NONUNIQUE | AR_ACCOUNT | VALID |
| CUSTOMERS_PK | NORMAL | UNIQUE | CUSTOMER_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/CUSTOMERS_BD|CUSTOMERS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/CUSTOMERS_BI|CUSTOMERS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/CUSTOMERS_BU|CUSTOMERS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
