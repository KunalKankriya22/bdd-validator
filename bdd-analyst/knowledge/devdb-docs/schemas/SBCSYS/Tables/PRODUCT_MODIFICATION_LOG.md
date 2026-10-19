---
tags:
  - table
  - SBCSYS
---
# PRODUCT_MODIFICATION_LOG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 424
**Last Analyzed**: 2025-09-16 03:14:33
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 4 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 6 | PROC_DATE | DATE | Yes |  |  |
| 7 | INSERT_DATS | DATE | Yes |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | MODIFICATION_TYPE | VARCHAR2(1) | Yes |  |  |
| 11 | SESSION_ID | VARCHAR2(50) | Yes |  |  |

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
