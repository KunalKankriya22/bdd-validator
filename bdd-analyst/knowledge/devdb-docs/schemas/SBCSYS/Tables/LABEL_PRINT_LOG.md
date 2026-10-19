---
tags:
  - table
  - SBCSYS
---
# LABEL_PRINT_LOG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 27231
**Last Analyzed**: 2025-09-20 03:00:34
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(13) | Yes |  |  |
| 2 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 3 | ABORH_LABEL | VARCHAR2(10) | Yes |  |  |
| 4 | LABEL_TYPE | VARCHAR2(3) | Yes |  |  |
| 5 | PRINT_DATS | DATE | Yes |  |  |
| 6 | USER_ID | VARCHAR2(6) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 8 | LABEL_STRING | VARCHAR2(1000) | Yes |  |  |

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
