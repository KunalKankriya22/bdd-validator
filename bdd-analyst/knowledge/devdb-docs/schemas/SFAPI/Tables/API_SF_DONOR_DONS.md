---
tags:
  - table
  - SFAPI
---
# API_SF_DONOR_DONS

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8170
**Last Analyzed**: 2025-11-23 00:04:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | INSERT_DATE | DATE | No |  |  |
| 3 | RECORD_READ_DATE | DATE | Yes |  |  |
| 4 | DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 5 | PROCEDURE_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 7 | COLL_DATE | DATE | Yes |  |  |
| 8 | DEFERRAL_ID | VARCHAR2(8) | Yes |  |  |

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
