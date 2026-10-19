---
tags:
  - table
  - SBCSYS
---
# PROC_PRODUCT_ATTRIBUTE_LOG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:33
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | OLD_PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 3 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 4 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | NEW_PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 6 | ATTRIB_DATE | DATE | Yes |  |  |
| 7 | INSERT_DATS | DATE | Yes |  |  |
| 8 | INVALID_FLAG | VARCHAR2(1) | Yes |  |  |

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
