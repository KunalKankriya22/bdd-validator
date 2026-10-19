---
tags:
  - table
  - AGMGR
---
# VALID_ANTIGEN_GROUPS

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 36
**Last Analyzed**: 2025-02-28 22:00:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ANTIGEN_GROUP | VARCHAR2(10) | No |  |  |
| 2 | SER_AG_TEST_ID | VARCHAR2(10) | Yes |  |  |
| 3 | MOL_AG_TEST_ID | VARCHAR2(10) | Yes |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | SER_TEST_DISP_ORDER | NUMBER(2) | Yes |  |  |
| 11 | MOL_TEST_DISP_ORDER | NUMBER(2) | Yes |  |  |
| 12 | ANTIGEN_GRP_DISP_ORDER | NUMBER(2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/AGMGR/Triggers/VALID_ANTIGEN_GROUPS_BD|VALID_ANTIGEN_GROUPS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/AGMGR/Triggers/VALID_ANTIGEN_GROUPS_BI|VALID_ANTIGEN_GROUPS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/AGMGR/Triggers/VALID_ANTIGEN_GROUPS_BU|VALID_ANTIGEN_GROUPS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
