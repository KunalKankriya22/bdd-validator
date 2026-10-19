---
tags:
  - table
  - DONSYS
---
# VALID_REGINT_REASONS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 182
**Last Analyzed**: 2026-04-23 03:00:06
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INTER_REASON | VARCHAR2(10) | Yes |  |  |
| 2 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 3 | EFF_DATE | DATE | Yes |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 6 | INSERT_DATE | DATE | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 8 | AUDIT_INSERT_DATE | DATE | No | sysdate |  |
| 9 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

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
