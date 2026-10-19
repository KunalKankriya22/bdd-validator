---
tags:
  - table
  - SBCSYS
---
# VERIFY_LABEL_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 109
**Last Analyzed**: 2025-09-16 03:16:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LABEL_TYPE | VARCHAR2(5) | Yes |  |  |
| 2 | MANUFACTURER | VARCHAR2(5) | Yes |  |  |
| 3 | PURCHASE_ORDER_NO | VARCHAR2(10) | Yes |  |  |
| 4 | INVOICE_NUMBER | VARCHAR2(10) | Yes |  |  |
| 5 | PRINT_JOB_NUMBER | VARCHAR2(10) | Yes |  |  |
| 6 | RECEIPT_DATE | DATE | Yes |  |  |
| 7 | BEST_USED_BY_DATE | DATE | Yes |  |  |
| 8 | NUMBER_OF_ROLLS | NUMBER(4) | Yes |  |  |
| 9 | STORAGE_TEMP | NUMBER(4) | Yes |  |  |
| 10 | STORAGE_HUMIDITY | VARCHAR2(8) | Yes |  |  |
| 11 | VERIFICATION_NO | VARCHAR2(12) | Yes |  |  |

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
