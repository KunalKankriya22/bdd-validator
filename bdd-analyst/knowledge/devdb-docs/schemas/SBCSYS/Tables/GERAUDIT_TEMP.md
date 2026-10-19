---
tags:
  - table
  - SBCSYS
---
# GERAUDIT_TEMP

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 73
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 3 | INSERT_DATE | VARCHAR2(20) | Yes |  |  |
| 4 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 6 | BASE_TABLE_NAME | VARCHAR2(30) | Yes |  |  |
| 7 | AUDIT_LOG | VARCHAR2(4000) | Yes |  |  |
| 8 | PARM_ID | VARCHAR2(20) | Yes |  |  |

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
