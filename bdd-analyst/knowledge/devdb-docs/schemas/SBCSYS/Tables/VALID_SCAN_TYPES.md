---
tags:
  - table
  - SBCSYS
---
# VALID_SCAN_TYPES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 19
**Last Analyzed**: 2026-04-19 15:03:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SCAN_TYPE | VARCHAR2(5) | No |  |  |
| 2 | START_ID | VARCHAR2(5) | No |  |  |
| 3 | START_LEN | NUMBER(2) | No |  |  |
| 4 | STOP_ID | VARCHAR2(5) | No |  |  |
| 5 | STOP_LEN | NUMBER(2) | No |  |  |
| 6 | SCAN_LEN | NUMBER(2) | No |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

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
