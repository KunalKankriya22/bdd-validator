---
tags:
  - table
  - DONSYS
---
# SURVEY_REFRESH_TOKEN

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 611
**Last Analyzed**: 2025-09-16 03:14:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(40) | Yes |  |  |
| 2 | USER_ID | VARCHAR2(30) | Yes |  |  |
| 3 | REFRESH_TOKEN | VARCHAR2(200) | Yes |  |  |
| 4 | JWT_ID | VARCHAR2(100) | Yes |  |  |
| 5 | CREATION_DATE | DATE | Yes |  |  |
| 6 | EXPIRY_DATE | DATE | Yes |  |  |
| 7 | USED | VARCHAR2(1) | Yes |  |  |
| 8 | INVALIDATED | VARCHAR2(1) | Yes |  |  |

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
