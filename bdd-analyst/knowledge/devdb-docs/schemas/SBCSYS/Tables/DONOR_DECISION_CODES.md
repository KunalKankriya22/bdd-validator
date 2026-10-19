---
tags:
  - table
  - SBCSYS
---
# DONOR_DECISION_CODES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 77
**Last Analyzed**: 2026-04-25 03:00:08
**Partitioned**: NO

> [!quote] Created from Entity DONOR DECISION CODE by WADLEY on 16-APR-93

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

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_DECISION_CODES_IDX_1 | NORMAL | UNIQUE | BAR_CODE_VALUE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/CUE_CODES_BEFORE_DELETE|CUE_CODES_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/CUE_CODES_INSERT_UPDATE|CUE_CODES_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
