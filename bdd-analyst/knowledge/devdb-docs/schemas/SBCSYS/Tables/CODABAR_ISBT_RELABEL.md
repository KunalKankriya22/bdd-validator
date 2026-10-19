---
tags:
  - table
  - SBCSYS
---
# CODABAR_ISBT_RELABEL

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3
**Last Analyzed**: 2025-09-20 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CODABAR_UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | ISBT_UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | COLL_DATE | DATE | No |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 5 | SLD_LABEL | VARCHAR2(5) | No |  |  |
| 6 | EXP_DATE | DATE | No |  |  |
| 7 | LICENSURE_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | SP_TEST_BARCODE | VARCHAR2(5) | Yes |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | ISBT_PROD_CODE | VARCHAR2(8) | Yes |  |  |
| 13 | FACILITY_CODE | VARCHAR2(5) | Yes |  |  |
| 14 | ALIQUOT | VARCHAR2(2) | Yes |  |  |

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
