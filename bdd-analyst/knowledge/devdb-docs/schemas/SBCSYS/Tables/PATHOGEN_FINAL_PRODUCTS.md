---
tags:
  - table
  - SBCSYS
---
# PATHOGEN_FINAL_PRODUCTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 240
**Last Analyzed**: 2025-09-16 03:14:32
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 3 | PROD_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 4 | PROD_VOL | NUMBER(7,2) | Yes |  |  |
| 5 | INSERT_DATE | DATE | No |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 8 | ANTICOAGULANT_VOLUME | NUMBER(4) | Yes |  |  |
| 9 | FINAL_PLT_COUNT | NUMBER | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | SUIT_PROD_CODE | VARCHAR2(8) | Yes |  |  |
| 12 | CAD_PROD_CODE | VARCHAR2(8) | Yes |  |  |
| 13 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

**PATHOGEN_FINAL_PRODUCTS_PK**: `UNIT_ID, PRODUCT_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PATHOGEN_FINAL_PRODUCTS_PK | NORMAL | UNIQUE | UNIT_ID, PRODUCT_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/PATHOGEN_FINAL_PRODUCTS_BD|PATHOGEN_FINAL_PRODUCTS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/PATHOGEN_FINAL_PRODUCTS_BI|PATHOGEN_FINAL_PRODUCTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/PATHOGEN_FINAL_PRODUCTS_BU|PATHOGEN_FINAL_PRODUCTS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
