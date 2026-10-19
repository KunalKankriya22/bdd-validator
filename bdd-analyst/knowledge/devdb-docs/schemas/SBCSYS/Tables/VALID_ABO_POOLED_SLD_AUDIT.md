---
tags:
  - table
  - SBCSYS
---
# VALID_ABO_POOLED_SLD_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 549
**Last Analyzed**: 2025-09-16 03:15:57
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APOS | CHAR(1) | Yes |  |  |
| 2 | ANEG | CHAR(1) | Yes |  |  |
| 3 | BPOS | CHAR(1) | Yes |  |  |
| 4 | BNEG | CHAR(1) | Yes |  |  |
| 5 | ABPOS | CHAR(1) | Yes |  |  |
| 6 | ABNEG | CHAR(1) | Yes |  |  |
| 7 | OPOS | CHAR(1) | Yes |  |  |
| 8 | ONEG | CHAR(1) | Yes |  |  |
| 9 | POOL_SLD | VARCHAR2(4) | No |  |  |
| 10 | EFF_DATE | DATE | Yes |  |  |
| 11 | TERM_DATE | DATE | Yes |  |  |
| 12 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 13 | AUDIT_KEY | NUMBER | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 15 | UNIT_SCHEME_TYPE | VARCHAR2(1) | Yes |  |  |
| 16 | RH_LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 17 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 18 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
