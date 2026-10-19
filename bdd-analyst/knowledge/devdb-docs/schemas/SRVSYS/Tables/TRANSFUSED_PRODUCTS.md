---
tags:
  - table
  - SRVSYS
---
# TRANSFUSED_PRODUCTS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 5 | ALIQUOT | VARCHAR2(2) | No |  |  |
| 6 | BLOOD_TYPE | VARCHAR2(4) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | CUSTOMER_ID | VARCHAR2(10) | No |  |  |
| 9 | PATIENT_ID | VARCHAR2(10) | No |  |  |
| 10 | PATIENT_NAME | VARCHAR2(50) | No |  |  |
| 11 | TRANSFUSED_DATE | DATE | No |  |  |
| 12 | ISSUER_NAME | VARCHAR2(6) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TRANSFUSED_PRODUCTS_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, ALIQUOT | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
