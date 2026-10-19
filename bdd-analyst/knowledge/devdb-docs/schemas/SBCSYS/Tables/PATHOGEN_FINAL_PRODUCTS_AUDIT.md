---
tags:
  - table
  - SBCSYS
---
# PATHOGEN_FINAL_PRODUCTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 219
**Last Analyzed**: 2025-09-20 03:00:33
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 3 | PROD_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 4 | PROD_VOL | NUMBER(7,2) | Yes |  |  |
| 5 | INSERT_DATE | DATE | Yes |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | ANTICOAGULANT_VOLUME | NUMBER(4) | Yes |  |  |
| 9 | FINAL_PLT_COUNT | NUMBER | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 12 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | SUIT_PROD_CODE | VARCHAR2(8) | Yes |  |  |
| 14 | CAD_PROD_CODE | VARCHAR2(8) | Yes |  |  |
| 15 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
