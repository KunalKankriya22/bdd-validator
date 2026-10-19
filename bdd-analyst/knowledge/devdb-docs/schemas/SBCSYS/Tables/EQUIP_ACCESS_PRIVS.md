---
tags:
  - table
  - SBCSYS
---
# EQUIP_ACCESS_PRIVS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 64
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EQUIP_TYPE | VARCHAR2(5) | No |  |  |
| 2 | FCN_GRP | VARCHAR2(5) | Yes |  |  |
| 3 | EFF_DATE | DATE | Yes |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | INSERT_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 7 | MODIFIED_BY | VARCHAR2(6) | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

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
