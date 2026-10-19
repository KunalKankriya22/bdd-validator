---
tags:
  - table
  - UTIL
---
# PRINT_REQUEST_QUEUE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:47
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | FILE_NAME | VARCHAR2(50) | Yes |  |  |
| 2 | FORM_TYPE | VARCHAR2(15) | Yes |  |  |
| 3 | PRINTER_NAME | VARCHAR2(40) | Yes |  |  |
| 4 | REQUEST_DATE | DATE | Yes |  |  |
| 5 | PRINTED_DATE | DATE | Yes |  |  |
| 6 | NO_OF_COPIES | NUMBER(2) | Yes |  |  |
| 7 | REP_DIR | VARCHAR2(240) | Yes |  |  |

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
