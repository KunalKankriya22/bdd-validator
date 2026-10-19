---
tags:
  - table
  - AGMGR
---
# VALID_ANTIGENS_ORDER

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 310
**Last Analyzed**: 2025-10-01 03:00:44
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SEQ_NO | NUMBER | No |  |  |
| 2 | SYSTEM_NO | VARCHAR2(3) | No |  |  |
| 3 | ANTIGEN_NO | VARCHAR2(3) | No |  |  |
| 4 | ANTIGEN_NAME | VARCHAR2(10) | No |  |  |
| 5 | ANTIGEN_ALIAS | VARCHAR2(50) | Yes |  |  |
| 6 | AG_CATEGORY | VARCHAR2(10) | Yes |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(10) | No |  |  |

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
