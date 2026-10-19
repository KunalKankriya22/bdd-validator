---
tags:
  - table
  - SBCSYS
---
# VALID_CCODE_PRODUCT_TYPE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 48
**Last Analyzed**: 2025-09-16 03:15:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CCODE | VARCHAR2(3) | No |  |  |
| 2 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | PHERESIS_FLAG | VARCHAR2(1) | Yes |  |  |

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
