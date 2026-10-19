---
tags:
  - table
  - SBCSYS
---
# VALID_AUTO_INTER_CONFIG_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 179
**Last Analyzed**: 2025-09-16 03:15:57
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | ACTION_FUNCTION_NAME | VARCHAR2(30) | Yes |  |  |
| 3 | ACTION_TYPE | VARCHAR2(10) | Yes |  |  |
| 4 | ACTION_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | ACTION_PRODUCT_CODE | VARCHAR2(10) | Yes |  |  |
| 6 | INTER_ON_CURRENT_PROD | VARCHAR2(1) | Yes |  |  |
| 7 | INTER_ON_OTHER_PRODS | VARCHAR2(100) | Yes |  |  |
| 8 | INTER_ON_OTHER_PROD_TYPES | VARCHAR2(100) | Yes |  |  |
| 9 | INTER_ON_UNIT_LEVEL | VARCHAR2(1) | Yes |  |  |
| 10 | INTER_ALL_PROD_BUT_CURR | VARCHAR2(1) | Yes |  |  |
| 11 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 14 | INSERT_DATE | DATE | Yes |  |  |
| 15 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 16 | EFF_DATE | DATE | Yes |  |  |
| 17 | TERM_DATE | DATE | Yes |  |  |
| 18 | AUDIT_USER | VARCHAR2(30) | Yes |  |  |
| 19 | AUDIT_DATE | DATE | Yes |  |  |

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
