---
tags:
  - table
  - SRVSYS
---
# WH_TRANS_DTL

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 408
**Last Analyzed**: 2025-09-27 03:00:32
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BATCH_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 5 | ALIQUOT | VARCHAR2(2) | Yes |  |  |
| 6 | RECEIVE_USER | VARCHAR2(6) | Yes |  |  |
| 7 | RECEIVE_DATE | DATE | Yes |  |  |
| 8 | RECEIVE_WAREHOUSE | VARCHAR2(1) | Yes |  |  |
| 9 | RECEIVE_TEMP | NUMBER(5,2) | Yes |  |  |
| 10 | RECON_REASON | VARCHAR2(5) | Yes |  |  |
| 11 | RECON_DETAIL | VARCHAR2(240) | Yes |  |  |

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
