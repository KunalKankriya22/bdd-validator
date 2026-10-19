---
tags:
  - table
  - SBCSYS
---
# VALID_CONTAINER_PRODUCTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 47
**Last Analyzed**: 2026-05-09 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CATALOG_NUMBER | VARCHAR2(10) | No |  |  |
| 2 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 3 | BAG_CODE | VARCHAR2(4) | Yes |  |  |
| 4 | FACE_LABEL | VARCHAR2(8) | Yes |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 11 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
