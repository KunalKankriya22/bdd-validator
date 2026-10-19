---
tags:
  - table
  - AGMGR
---
# AG_TF_API

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 9
**Last Analyzed**: 2025-10-01 03:00:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | ANTIGEN_CODE | VARCHAR2(10) | Yes |  |  |
| 3 | RESULT_CODE | VARCHAR2(5) | Yes |  |  |
| 4 | INSERT_DATE | DATE | Yes |  |  |
| 5 | CANCEL_DATE | DATE | Yes |  |  |
| 6 | INVALIDATE_DATE | DATE | Yes |  |  |
| 7 | TF_STATUS | VARCHAR2(20) | Yes |  |  |
| 8 | BC_INSERT_DATE | DATE | Yes |  |  |
| 9 | BC_READ_DATE | DATE | Yes |  |  |
| 10 | BC_STATUS | VARCHAR2(50) | Yes |  |  |
| 11 | BC_COMMENTS | VARCHAR2(500) | Yes |  |  |
| 12 | BC_TB_ID | VARCHAR2(14) | Yes |  |  |
| 13 | BC_JOB_ID | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/AGMGR/Triggers/AG_TF_API_BI|AG_TF_API_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
| PUBLIC | ALTER | NO |
| PUBLIC | DEBUG | NO |
| PUBLIC | DELETE | NO |
| PUBLIC | FLASHBACK | NO |
| PUBLIC | INDEX | NO |
| PUBLIC | INSERT | NO |
| PUBLIC | ON COMMIT REFRESH | NO |
| PUBLIC | QUERY REWRITE | NO |
| PUBLIC | READ | NO |
| PUBLIC | REFERENCES | NO |
| PUBLIC | SELECT | NO |
| PUBLIC | UPDATE | NO |
