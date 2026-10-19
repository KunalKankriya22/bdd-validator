---
tags:
  - table
  - DONSYS
---
# DRIVE_CATEGORY_RULES_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 119
**Last Analyzed**: 2026-04-03 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | RULE_ID | VARCHAR2(10) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | DRIVE_CATEGORY | VARCHAR2(5) | Yes |  |  |
| 8 | NUMBER_ALLOWED | NUMBER(2) | Yes |  |  |
| 9 | MAX_SIZE | NUMBER(4) | Yes |  |  |
| 10 | EFF_DATE | DATE | Yes |  |  |
| 11 | TERM_DATE | DATE | Yes |  |  |

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
