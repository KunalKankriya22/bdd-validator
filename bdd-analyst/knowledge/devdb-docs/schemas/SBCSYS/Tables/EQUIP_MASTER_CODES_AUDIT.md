---
tags:
  - table
  - SBCSYS
---
# EQUIP_MASTER_CODES_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 407
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CODE_TYPE | VARCHAR2(5) | Yes |  |  |
| 2 | CODE | VARCHAR2(5) | Yes |  |  |
| 3 | CODE_DESC | VARCHAR2(50) | Yes |  |  |
| 4 | EFF_DATE | DATE | Yes |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 7 | MODIFIED_BY | VARCHAR2(6) | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 11 | AUDIT_INSERT_DATE | DATE | Yes |  |  |

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
