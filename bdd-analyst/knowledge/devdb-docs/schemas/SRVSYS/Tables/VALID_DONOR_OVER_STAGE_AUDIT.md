---
tags:
  - table
  - SRVSYS
---
# VALID_DONOR_OVER_STAGE_AUDIT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 250
**Last Analyzed**: 2026-04-25 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 2 | DONOR_DECISION_CODE | VARCHAR2(1) | Yes |  |  |
| 3 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 4 | ATTRIB_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | INTER_CODE | VARCHAR2(4) | Yes |  |  |
| 6 | INTER_TYPE | VARCHAR2(1) | Yes |  |  |
| 7 | OVERRIDE_DESC | VARCHAR2(50) | Yes |  |  |
| 8 | EFF_DATE | DATE | Yes |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 11 | MOVE_DATE | DATE | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |
| 14 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 15 | AUDIT_INSERT_DATS | DATE | Yes |  |  |

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
