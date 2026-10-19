---
tags:
  - table
  - SBCSYS
---
# LICENSED_PRODUCTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 31
**Last Analyzed**: 2025-09-16 03:14:31
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 3 | OSOK_FLAG | VARCHAR2(1) | No |  |  |
| 4 | INSERT_DATE | DATE | Yes |  |  |
| 5 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| LICENSED_PRODUCTS_IDX_1 | NORMAL | UNIQUE | CHAPTER_ID, PRODUCT_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
