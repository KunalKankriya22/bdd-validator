---
tags:
  - table
  - AGMGR
---
# VALID_ANTIGENS_RCVS_DET

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 120
**Last Analyzed**: 2025-09-23 03:00:27
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RC_ID | VARCHAR2(10) | Yes |  |  |
| 2 | RESULT_VALUE | NUMBER | Yes |  |  |
| 3 | RESULT_COMBINATION | VARCHAR2(200) | Yes |  |  |
| 4 | TEST_IDS | VARCHAR2(200) | Yes |  |  |
| 5 | INSERT_DATE | DATE | Yes |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | Yes |  |  |
| 9 | TEST_DESC | VARCHAR2(100) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/AGMGR/Triggers/VALID_ANTIGENS_RCVS_DET_BI|VALID_ANTIGENS_RCVS_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
