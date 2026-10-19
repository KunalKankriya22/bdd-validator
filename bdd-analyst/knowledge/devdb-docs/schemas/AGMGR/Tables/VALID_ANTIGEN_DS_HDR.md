---
tags:
  - table
  - AGMGR
---
# VALID_ANTIGEN_DS_HDR

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2
**Last Analyzed**: 2025-09-23 03:00:27
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DS_ID | VARCHAR2(10) | Yes |  |  |
| 2 | DS_DESC | VARCHAR2(200) | Yes |  |  |
| 3 | DATA_IDENTIFIER | VARCHAR2(10) | Yes |  |  |
| 4 | DS_LENGTH | NUMBER | Yes |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/AGMGR/Triggers/VALID_ANTIGEN_DS_HDR_BI|VALID_ANTIGEN_DS_HDR_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
