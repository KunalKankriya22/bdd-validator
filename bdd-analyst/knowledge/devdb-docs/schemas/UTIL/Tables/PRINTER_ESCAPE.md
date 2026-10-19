---
tags:
  - table
  - UTIL
---
# PRINTER_ESCAPE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8
**Last Analyzed**: 2025-09-16 03:16:47
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRINTER_NAME | VARCHAR2(40) | No |  |  |
| 2 | FORM_TYPE | VARCHAR2(15) | No |  |  |
| 3 | ESC_CHAR | VARCHAR2(30) | Yes |  |  |
| 4 | PRINTER_MAKE | VARCHAR2(30) | Yes |  |  |

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
