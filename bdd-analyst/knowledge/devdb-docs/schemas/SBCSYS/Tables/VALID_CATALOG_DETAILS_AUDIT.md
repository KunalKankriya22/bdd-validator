---
tags:
  - table
  - SBCSYS
---
# VALID_CATALOG_DETAILS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 546
**Last Analyzed**: 2025-09-16 03:15:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CATALOG_NUMBER | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | CONTAINER_ID | VARCHAR2(3) | Yes |  |  |
| 4 | INLINE_FILTER_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 6 | SUB_PROD_TYPES | VARCHAR2(250) | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 9 | EFF_DATE | DATE | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |
| 13 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 14 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

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
