---
tags:
  - table
  - DONSYS
---
# WEB_HH_DETAILS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 20
**Last Analyzed**: 2025-09-16 03:14:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(15) | Yes |  |  |
| 2 | WEB_ID | VARCHAR2(15) | No |  |  |
| 3 | HHQ_ID | VARCHAR2(10) | Yes |  |  |
| 4 | QUES_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | DONOR_ANS | VARCHAR2(10) | Yes |  |  |

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
