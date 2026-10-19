---
tags:
  - table
  - LTAPI
---
# API_MASTER_CODES_AUDIT

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER(23) | Yes |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 4 | USER_ID | VARCHAR2(6) | Yes |  |  |
| 5 | CODE_TYPE | VARCHAR2(5) | Yes |  |  |
| 6 | CODE | VARCHAR2(5) | Yes |  |  |
| 7 | DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 8 | NUMERAL_VALUE | NUMBER(10,3) | Yes |  |  |
| 9 | SORT_SEQUENCE_1 | NUMBER(3) | Yes |  |  |
| 10 | SORT_SEQUENCE_2 | NUMBER(3) | Yes |  |  |
| 11 | SORT_SEQUENCE_3 | NUMBER(3) | Yes |  |  |
| 12 | EFF_DATE | DATE | Yes |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |

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
