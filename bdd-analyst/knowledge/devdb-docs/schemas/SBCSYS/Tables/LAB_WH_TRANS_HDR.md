---
tags:
  - table
  - SBCSYS
---
# LAB_WH_TRANS_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 586
**Last Analyzed**: 2025-09-16 03:14:31
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BATCH_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CREATE_USER | VARCHAR2(6) | No |  |  |
| 4 | CREATE_DATE | DATE | No |  |  |
| 5 | CHECKOUT_TEMP | NUMBER(5,2) | Yes |  |  |
| 6 | BATCH_NAME | VARCHAR2(50) | Yes |  |  |
| 7 | FROM_WAREHOUSE | VARCHAR2(1) | Yes |  |  |
| 8 | TO_WAREHOUSE | VARCHAR2(1) | No |  |  |
| 9 | BATCH_STATUS | VARCHAR2(5) | Yes |  |  |
| 10 | RECON_DATE | DATE | Yes |  |  |
| 11 | RECON_USER | VARCHAR2(6) | Yes |  |  |

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
