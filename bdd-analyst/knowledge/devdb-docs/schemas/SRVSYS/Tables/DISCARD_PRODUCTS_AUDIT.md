---
tags:
  - table
  - SRVSYS
---
# DISCARD_PRODUCTS_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2081
**Last Analyzed**: 2025-09-16 03:16:05
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 5 | ALIQUOT | VARCHAR2(2) | Yes |  |  |
| 6 | BLOOD_TYPE | VARCHAR2(4) | Yes |  |  |
| 7 | PRODUCT_STATUS | VARCHAR2(2) | Yes |  |  |
| 8 | EXP_DATE | DATE | Yes |  |  |
| 9 | INSERT_DATE | DATE | Yes |  |  |
| 10 | DISCARD_TYPE | VARCHAR2(2) | Yes |  |  |
| 11 | LOCATION_ID | VARCHAR2(12) | Yes |  |  |
| 12 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 13 | PRODUCT_PRICE | NUMBER(9,2) | Yes |  |  |
| 14 | PICK_SLIP_ID | VARCHAR2(13) | Yes |  |  |
| 15 | BOX_ID | VARCHAR2(10) | Yes |  |  |
| 16 | REJECT_REASON | VARCHAR2(5) | Yes |  |  |
| 17 | AUDIT_KEY | NUMBER | No |  |  |
| 18 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 19 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 20 | AUDIT_INSERT_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DISCARD_PRODUCTS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
