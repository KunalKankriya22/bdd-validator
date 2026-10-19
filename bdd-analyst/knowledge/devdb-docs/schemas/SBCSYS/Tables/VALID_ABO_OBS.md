---
tags:
  - table
  - SBCSYS
---
# VALID_ABO_OBS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 57
**Last Analyzed**: 2025-09-16 03:15:56
**Partitioned**: NO

> [!quote] Created from Entity VALID ABO OBSERVATION by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESULT_CODE | VARCHAR2(2) | No |  |  |
| 2 | A_CELLS | VARCHAR2(1) | Yes |  |  |
| 3 | A1_CELLS | VARCHAR2(1) | Yes |  |  |
| 4 | B_CELLS | VARCHAR2(1) | Yes |  |  |
| 5 | AB_CELLS | VARCHAR2(1) | Yes |  |  |
| 6 | D_CELLS | VARCHAR2(1) | Yes |  |  |
| 7 | DCON_CELLS | VARCHAR2(1) | Yes |  |  |
| 8 | DU_CELLS | VARCHAR2(1) | Yes |  |  |
| 9 | DUC_CELLS | VARCHAR2(1) | Yes |  |  |
| 10 | A1_SERUM | VARCHAR2(1) | Yes |  |  |
| 11 | A2_SERUM | VARCHAR2(1) | Yes |  |  |
| 12 | B_SERUM | VARCHAR2(1) | Yes |  |  |
| 13 | EFF_DATE | DATE | No |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_ABO_OBS_IDX_1 | NORMAL | UNIQUE | A_CELLS, A1_CELLS, B_CELLS, AB_CELLS, D_CELLS, DCON_CELLS, DU_CELLS, DUC_CELLS, A1_SERUM, A2_SERUM, B_SERUM | VALID |
| VALID_ABO_OBS_IDX_2 | NORMAL | NONUNIQUE | RESULT_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_ABO_OBS_BEFORE_DELETE|VALID_ABO_OBS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_ABO_OBS_INSERT_UPDATE|VALID_ABO_OBS_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
