---
tags:
  - table
  - SBCSYS
---
# VALID_HIV_WB_OBS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 10
**Last Analyzed**: 2025-09-16 03:15:58
**Partitioned**: NO

> [!quote] Created from Entity VALID HIV WB OBSERVATION by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESULT_CODE | VARCHAR2(4) | No |  |  |
| 2 | P17 | VARCHAR2(1) | Yes |  |  |
| 3 | P24 | VARCHAR2(1) | Yes |  |  |
| 4 | P31 | VARCHAR2(1) | Yes |  |  |
| 5 | GP41 | VARCHAR2(1) | Yes |  |  |
| 6 | P51 | VARCHAR2(1) | Yes |  |  |
| 7 | P55 | VARCHAR2(1) | Yes |  |  |
| 8 | P66 | VARCHAR2(1) | Yes |  |  |
| 9 | P120 | VARCHAR2(1) | Yes |  |  |
| 10 | P160 | VARCHAR2(1) | Yes |  |  |
| 11 | EFF_DATE | DATE | No |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_HIV_WB_OBS_IDX_1 | NORMAL | UNIQUE | P17, P24, P31, GP41, P51, P55, P66, P120, P160 | VALID |
| VALID_HIV_WB_OBS_IDX_2 | NORMAL | NONUNIQUE | RESULT_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_HIV_OBS_BEFORE_DELETE|VALID_HIV_OBS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_HIV_OBS_INSERT_UPDATE|VALID_HIV_OBS_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
