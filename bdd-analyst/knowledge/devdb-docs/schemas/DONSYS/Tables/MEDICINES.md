---
tags:
  - table
  - DONSYS
---
# MEDICINES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1331
**Last Analyzed**: 2025-09-16 03:13:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ANSWER_CODE | VARCHAR2(5) | Yes |  |  |
| 2 | RESPONSE | VARCHAR2(1) | Yes |  |  |
| 3 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 4 | DEFERRAL_PERIOD | NUMBER(4) | Yes |  |  |
| 5 | PERIOD_TYPE | VARCHAR2(8) | Yes |  |  |
| 6 | MINIMUM_PERIOD | NUMBER(4) | Yes |  |  |
| 7 | ANSWER_DESC | VARCHAR2(240) | Yes |  |  |

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
