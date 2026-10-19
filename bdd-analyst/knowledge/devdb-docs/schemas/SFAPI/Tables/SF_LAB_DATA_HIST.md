---
tags:
  - table
  - SFAPI
---
# SF_LAB_DATA_HIST

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 10097
**Last Analyzed**: 2025-09-23 03:00:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 3 | RESULT_DATE | DATE | Yes |  |  |
| 4 | DATE_SENT_TO_SF | DATE | Yes |  |  |
| 5 | MISC_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | COMMENTS | VARCHAR2(500) | Yes |  |  |

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
