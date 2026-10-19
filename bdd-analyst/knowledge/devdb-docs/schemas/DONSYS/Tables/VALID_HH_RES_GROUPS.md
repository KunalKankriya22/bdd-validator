---
tags:
  - table
  - DONSYS
---
# VALID_HH_RES_GROUPS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 59
**Last Analyzed**: 2026-05-08 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | QUESTION_CODE | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(10) | No |  |  |
| 3 | RESPONSE_CODE | VARCHAR2(4) | No |  |  |
| 4 | GROUP_CODE | VARCHAR2(30) | No |  |  |
| 5 | GROUP_DESC | VARCHAR2(240) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_HH_RES_GROUPS_BD|VALID_HH_RES_GROUPS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HH_RES_GROUPS_BI|VALID_HH_RES_GROUPS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HH_RES_GROUPS_BU|VALID_HH_RES_GROUPS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
