---
tags:
  - table
  - AGMGR
---
# LBL_AG_PRINT_PROD_TYPES

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 11
**Last Analyzed**: 2026-04-21 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 2 | EFF_DATE | DATE | Yes |  |  |
| 3 | TERM_DATE | DATE | Yes |  |  |
| 4 | INSERT_DATE | DATE | Yes |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 6 | AUDIT_KEY | NUMBER | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | Yes |  |  |

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
