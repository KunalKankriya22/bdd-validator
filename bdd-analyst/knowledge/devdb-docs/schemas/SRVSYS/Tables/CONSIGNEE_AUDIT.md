---
tags:
  - table
  - SRVSYS
---
# CONSIGNEE_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2800
**Last Analyzed**: 2025-09-16 03:16:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONSIGNEE_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | CUSTOMER_ID | VARCHAR2(10) | Yes |  |  |
| 4 | NAME | VARCHAR2(50) | Yes |  |  |
| 5 | SHORT_NAME | VARCHAR2(15) | Yes |  |  |
| 6 | ADDRESS_1 | VARCHAR2(50) | Yes |  |  |
| 7 | ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 8 | ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 9 | CITY | VARCHAR2(75) | Yes |  |  |
| 10 | STATE | VARCHAR2(2) | Yes |  |  |
| 11 | COUNTRY | VARCHAR2(30) | Yes |  |  |
| 12 | ZIP | VARCHAR2(10) | Yes |  |  |
| 13 | PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 14 | PHONE_EXT | VARCHAR2(5) | Yes |  |  |
| 15 | FAX_NO | VARCHAR2(20) | Yes |  |  |
| 16 | TELEX_NO | VARCHAR2(20) | Yes |  |  |
| 17 | EFF_DATE | DATE | Yes |  |  |
| 18 | TERM_DATE | DATE | Yes |  |  |
| 19 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 20 | AD_LOCATION | VARCHAR2(7) | Yes |  |  |
| 21 | ZONE | VARCHAR2(2) | Yes |  |  |
| 22 | AR_SHIP_TO_NO | VARCHAR2(8) | Yes |  |  |
| 23 | CP6_DEST | VARCHAR2(4) | Yes |  |  |
| 24 | OUT_OF_STATE | VARCHAR2(1) | Yes |  |  |
| 25 | AUDIT_KEY | NUMBER | No |  |  |
| 26 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 27 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 28 | AUDIT_INSERT_DATE | DATE | No |  |  |
| 29 | INT_FLAG | VARCHAR2(1) | Yes |  |  |
| 30 | INT_PHONE | VARCHAR2(20) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CONSIGNEE_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
