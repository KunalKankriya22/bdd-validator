---
tags:
  - table
  - SRVSYS
---
# CONSIGNEE

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1050
**Last Analyzed**: 2025-09-16 03:16:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONSIGNEE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CUSTOMER_ID | VARCHAR2(10) | No |  |  |
| 4 | NAME | VARCHAR2(50) | No |  |  |
| 5 | SHORT_NAME | VARCHAR2(15) | No |  |  |
| 6 | ADDRESS_1 | VARCHAR2(50) | No |  |  |
| 7 | ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 8 | ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 9 | CITY | VARCHAR2(75) | No |  |  |
| 10 | STATE | VARCHAR2(2) | Yes |  |  |
| 11 | COUNTRY | VARCHAR2(30) | No |  |  |
| 12 | ZIP | VARCHAR2(10) | No |  |  |
| 13 | PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 14 | PHONE_EXT | VARCHAR2(5) | Yes |  |  |
| 15 | FAX_NO | VARCHAR2(20) | Yes |  |  |
| 16 | TELEX_NO | VARCHAR2(20) | Yes |  |  |
| 17 | AD_LOCATION | VARCHAR2(7) | Yes |  |  |
| 18 | ZONE | VARCHAR2(2) | Yes |  |  |
| 19 | AR_SHIP_TO_NO | VARCHAR2(8) | Yes |  |  |
| 20 | CP6_DEST | VARCHAR2(4) | Yes |  |  |
| 21 | OUT_OF_STATE | VARCHAR2(1) | Yes |  |  |
| 22 | EFF_DATE | DATE | No |  |  |
| 23 | TERM_DATE | DATE | Yes |  |  |
| 24 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 25 | AUDIT_KEY | NUMBER | No |  |  |
| 26 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 27 | INT_FLAG | VARCHAR2(1) | Yes |  |  |
| 28 | INT_PHONE | VARCHAR2(20) | Yes |  |  |

## Primary Key

**CONSIGNEE_PK**: `CONSIGNEE_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SRVSYS/Tables/VSERV_CUSTOMER_PRODUCTS\|SRVSYS.VSERV_CUSTOMER_PRODUCTS]] | VSERV_CONSIGNEE_ID_FK | CONSIGNEE_ID, CHAPTER_ID → CONSIGNEE_ID, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CONSIGNEE_AD_LOC_IDX | NORMAL | NONUNIQUE | AD_LOCATION | VALID |
| CONSIGNEE_IDX3 | NORMAL | NONUNIQUE | CUSTOMER_ID | VALID |
| CONSIGNEE_PK | NORMAL | UNIQUE | CONSIGNEE_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/CONSIGNEE_BD|CONSIGNEE_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/CONSIGNEE_BI|CONSIGNEE_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/CONSIGNEE_BU|CONSIGNEE_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
