---
tags:
  - table
  - DONSYS
---
# STAFF_WARNINGS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 54
**Last Analyzed**: 2025-09-16 03:14:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 2 | WARNING_CODE | VARCHAR2(10) | Yes |  |  |
| 3 | CODE_VALUE | VARCHAR2(20) | Yes |  |  |
| 4 | START_DATE | DATE | Yes |  |  |
| 5 | END_DATE | DATE | Yes |  |  |
| 6 | COMMENTS | VARCHAR2(100) | Yes |  |  |
| 7 | S_FLAG_1 | VARCHAR2(1) | Yes |  |  |
| 8 | S_FLAG_2 | VARCHAR2(1) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | INSERT_DATE | DATE | Yes |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| STAFF_WARNINGS_N1 | NORMAL | NONUNIQUE | STAFF_NO | VALID |
| STAFF_WARNINGS_N2 | NORMAL | NONUNIQUE | CODE_VALUE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
