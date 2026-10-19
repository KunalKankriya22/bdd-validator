---
tags:
  - table
  - UTIL
---
# PRODUCT_RELEASE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2
**Last Analyzed**: 2025-09-16 03:16:47
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_NAME | VARCHAR2(300) | Yes |  |  |
| 2 | RELEASE_NO | VARCHAR2(30) | Yes |  |  |
| 3 | INSTALL_DATE | DATE | Yes |  |  |
| 4 | INSTALL_SEQ | NUMBER | Yes |  |  |
| 5 | PRODUCT_ID | VARCHAR2(10) | Yes |  |  |

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
