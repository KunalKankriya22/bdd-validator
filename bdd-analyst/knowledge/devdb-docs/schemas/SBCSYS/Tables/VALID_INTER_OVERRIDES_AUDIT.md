---
tags:
  - table
  - SBCSYS
---
# VALID_INTER_OVERRIDES_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 453
**Last Analyzed**: 2026-04-23 03:00:11
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
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 12 | OVERRIDE_DESC | VARCHAR2(50) | Yes |  |  |

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
