---
tags:
  - table
  - AGMGR
---
# VALID_ANTIGEN_CONFIG_HDR

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 130
**Last Analyzed**: 2025-04-01 03:00:45
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ANTIGEN_GROUP | VARCHAR2(10) | No |  |  |
| 2 | ANTIGEN_CODE | VARCHAR2(10) | No |  |  |
| 3 | LABELING_ANTIGEN_CODE | VARCHAR2(10) | Yes |  |  |
| 4 | NO_OF_UNITS | NUMBER(2) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | PRIMARY_RULE_ID | NUMBER(7) | No |  |  |
| 12 | CHAPTER_ID | VARCHAR2(4) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/AGMGR/Triggers/VALID_ANTIGEN_CONFIG_HDR_BD|VALID_ANTIGEN_CONFIG_HDR_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/AGMGR/Triggers/VALID_ANTIGEN_CONFIG_HDR_BI|VALID_ANTIGEN_CONFIG_HDR_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/AGMGR/Triggers/VALID_ANTIGEN_CONFIG_HDR_BU|VALID_ANTIGEN_CONFIG_HDR_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
