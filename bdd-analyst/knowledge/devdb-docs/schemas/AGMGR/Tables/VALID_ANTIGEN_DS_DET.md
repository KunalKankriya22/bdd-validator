---
tags:
  - table
  - AGMGR
---
# VALID_ANTIGEN_DS_DET

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 17
**Last Analyzed**: 2025-10-01 03:00:44
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DS_ID | VARCHAR2(10) | Yes |  |  |
| 2 | POS_NO | NUMBER | Yes |  |  |
| 3 | POS_LENGTH | NUMBER | Yes |  |  |
| 4 | TEST_IDS | VARCHAR2(200) | Yes |  |  |
| 5 | RC_ID | VARCHAR2(10) | Yes |  |  |
| 6 | INSERT_DATE | DATE | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | GROUP_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/AGMGR/Triggers/VALID_ANTIGEN_DS_DET_BI|VALID_ANTIGEN_DS_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| AG_LBL | PACKAGE | AGMGR |
