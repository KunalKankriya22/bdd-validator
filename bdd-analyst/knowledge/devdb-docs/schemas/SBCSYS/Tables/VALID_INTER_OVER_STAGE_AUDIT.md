---
tags:
  - table
  - SBCSYS
---
# VALID_INTER_OVER_STAGE_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 617
**Last Analyzed**: 2026-04-25 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 2 | DONOR_DECISION_CODE | VARCHAR2(1) | Yes |  |  |
| 3 | INTER_CODE | VARCHAR2(4) | Yes |  |  |
| 4 | INTER_TYPE | VARCHAR2(1) | Yes |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 8 | MOVE_DATE | DATE | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 12 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 13 | OVERRIDE_DESC | VARCHAR2(50) | Yes |  |  |

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
