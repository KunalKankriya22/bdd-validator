---
tags:
  - table
  - DONSYS
---
# UNIT_ORDER_DETAILS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ORDER_ID | VARCHAR2(10) | No |  |  |
| 2 | START_NUMBER | VARCHAR2(15) | Yes |  |  |
| 3 | END_NUMBER | VARCHAR2(15) | Yes |  |  |
| 4 | POSSIBLE_IDS | NUMBER(8) | Yes |  |  |
| 5 | AVAILABLE_IDS | NUMBER(8) | Yes |  |  |
| 6 | USED_IDS | NUMBER(8) | Yes |  |  |
| 7 | ORDER_DATE | DATE | Yes |  |  |
| 8 | ASSIGNED_TO | VARCHAR2(10) | Yes |  |  |
| 9 | COMMENTS | VARCHAR2(100) | Yes |  |  |
| 10 | DELETE_USER | VARCHAR2(6) | Yes |  |  |
| 11 | DELETE_REASON | VARCHAR2(100) | Yes |  |  |
| 12 | DELETE_DATE | DATE | Yes |  |  |
| 13 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 14 | INSERT_DATE | DATE | Yes |  |  |

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
