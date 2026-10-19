---
tags:
  - table
  - DONSYS
---
# DONOR_DECISION_CODES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 53
**Last Analyzed**: 2025-09-16 03:11:02
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_DECISION_CODE | VARCHAR2(1) | No |  |  |
| 2 | BAR_CODE_VALUE | VARCHAR2(5) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 6 | AUDIT_KEY | NUMBER | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

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
