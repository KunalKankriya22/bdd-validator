---
tags:
  - table
  - UTIL
---
# FUNCTION_GROUP_LEVELS_AUDIT

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | NUMBER(6) | No |  |  |
| 2 | MNEMONIC | VARCHAR2(8) | No |  |  |
| 3 | GRP_ID | VARCHAR2(5) | No |  |  |
| 4 | ACC_PRIV | NUMBER(1) | No |  |  |
| 5 | AUDIT_KEY | NUMBER | No |  |  |
| 6 | INSERT_USER | VARCHAR2(10) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | AUDIT_INSERT_DATE | DATE | No |  |  |
| 9 | AUDIT_INSERT_USER | VARCHAR2(10) | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(20) | No |  |  |

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
