---
tags:
  - table
  - GTSHIP
---
# GELTUBE_EBL_EU_CONFIG

**Schema**: [[schemas/GTSHIP/GTSHIP|GTSHIP]]
**Tablespace**: BC_DATA
**Estimated Rows**: 10
**Last Analyzed**: 2025-09-12 03:00:23
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EU_TYPE | VARCHAR2(5) | No |  |  |
| 2 | EU_CODE | VARCHAR2(30) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | EU_FLAG | VARCHAR2(1) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/GTSHIP/Triggers/GELTUBE_EBL_EU_CONFIG_BI|GELTUBE_EBL_EU_CONFIG_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
