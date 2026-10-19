---
tags:
  - table
  - SBCSYS
---
# VALID_SAMPLE_ACCEPT_RULES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:02
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_ID | VARCHAR2(10) | No |  |  |
| 2 | SAMPLE_TYPE | VARCHAR2(10) | No |  |  |
| 3 | PERIOD_ALLOWED_LIQUID | NUMBER | Yes |  |  |
| 4 | PERIOD_TYPE_LIQUID | VARCHAR2(10) | Yes |  |  |
| 5 | PERIOD_ALLOWED_FROZEN | NUMBER | Yes |  |  |
| 6 | PERIOD_TYPE_FROZEN | VARCHAR2(10) | Yes |  |  |
| 7 | FREEZE_THAW_CYCLE_ALLOWED | NUMBER | Yes |  |  |
| 8 | POOLED_SPECIMEN_ALLOWED | VARCHAR2(2) | Yes |  |  |
| 9 | EFF_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |
| 13 | INSERT_DATE | DATE | No |  |  |
| 14 | INSERT_USER | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_SAMPLE_ACCEPT_RULES_BI|VALID_SAMPLE_ACCEPT_RULES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
