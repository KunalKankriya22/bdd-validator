---
tags:
  - table
  - LTAPI
---
# API_ORDER_PROCESSOR

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 39
**Last Analyzed**: 2025-02-26 22:00:30
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | OS_APPL_NAME | VARCHAR2(10) | No |  |  |
| 2 | OS_ORDER_NO | VARCHAR2(15) | No |  |  |
| 3 | LT_ORDER_NO | VARCHAR2(15) | Yes |  |  |
| 4 | API_DATE | DATE | Yes |  |  |
| 5 | API_ACTION_CODE | VARCHAR2(1) | Yes |  |  |
| 6 | API_STATUS | VARCHAR2(15) | Yes |  |  |
| 7 | API_COMMENTS | VARCHAR2(720) | Yes |  |  |

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
