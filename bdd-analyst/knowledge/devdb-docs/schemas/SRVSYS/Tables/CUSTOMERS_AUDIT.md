---
tags:
  - table
  - SRVSYS
---
# CUSTOMERS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4418
**Last Analyzed**: 2025-09-16 03:16:05
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | ALPHA_KEY | VARCHAR2(10) | Yes |  |  |
| 4 | CUSTOMER_TYPE | VARCHAR2(2) | Yes |  |  |
| 5 | NAME | VARCHAR2(50) | Yes |  |  |
| 6 | SHORT_NAME | VARCHAR2(15) | Yes |  |  |
| 7 | ADDRESS_1 | VARCHAR2(50) | Yes |  |  |
| 8 | ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 9 | ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 10 | CITY | VARCHAR2(75) | Yes |  |  |
| 11 | STATE | VARCHAR2(2) | Yes |  |  |
| 12 | COUNTRY | VARCHAR2(50) | Yes |  |  |
| 13 | ZIP | VARCHAR2(10) | Yes |  |  |
| 14 | PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 15 | FAX_NO | VARCHAR2(20) | Yes |  |  |
| 16 | TELEX_NO | VARCHAR2(20) | Yes |  |  |
| 17 | PAYEE_ID | VARCHAR2(10) | Yes |  |  |
| 18 | COD_FLAG | VARCHAR2(1) | Yes |  |  |
| 19 | RETURN_ACCEPTED_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | EFF_DATE | DATE | Yes |  |  |
| 21 | TERM_DATE | DATE | Yes |  |  |
| 22 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 23 | PHONE_EXT | VARCHAR2(5) | Yes |  |  |
| 24 | AR_ACCOUNT | VARCHAR2(20) | Yes |  |  |
| 25 | CP6_DEST | VARCHAR2(4) | Yes |  |  |
| 26 | FI_PRICE_SCH_NO | VARCHAR2(2) | Yes |  |  |
| 27 | AUDIT_KEY | NUMBER | No |  |  |
| 28 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 29 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 30 | AUDIT_INSERT_DATE | DATE | No |  |  |
| 31 | PRICE_CHANGE_FLAG | VARCHAR2(1) | Yes |  |  |
| 32 | INT_FLAG | VARCHAR2(1) | Yes |  |  |
| 33 | INT_PHONE | VARCHAR2(20) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CUSTOMERS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
