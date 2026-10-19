---
tags:
  - table
  - AGMGR
---
# VALID_ANTIGEN_CONFIG_DET

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 248
**Last Analyzed**: 2026-05-12 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RULE_ID | NUMBER(7,2) | No |  |  |
| 2 | TEST_TYPE | VARCHAR2(10) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | LIC_APPROVE_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | NO_OF_TESTS | NUMBER(2) | No |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |
| 12 | PRIMARY_RULE_ID | NUMBER(7) | No |  |  |
| 13 | ANTIGEN_CODE | VARCHAR2(10) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/AGMGR/Triggers/VALID_ANTIGEN_CONFIG_DET_BD|VALID_ANTIGEN_CONFIG_DET_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/AGMGR/Triggers/VALID_ANTIGEN_CONFIG_DET_BI|VALID_ANTIGEN_CONFIG_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/AGMGR/Triggers/VALID_ANTIGEN_CONFIG_DET_BU|VALID_ANTIGEN_CONFIG_DET_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
