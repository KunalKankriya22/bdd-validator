---
tags:
  - table
  - SBCSYS
---
# RTURLOAD_TESTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 18
**Last Analyzed**: 2025-09-16 03:14:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SEQUENCE_NO | NUMBER(2) | Yes |  |  |
| 2 | HEADER_NAME | VARCHAR2(30) | Yes |  |  |
| 3 | START_POS | NUMBER(2) | Yes |  |  |
| 4 | END_POS | NUMBER(2) | Yes |  |  |
| 5 | MODIFIED_USER | VARCHAR2(30) | Yes |  |  |
| 6 | MODIFIED_DATE | DATE | Yes |  |  |

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
