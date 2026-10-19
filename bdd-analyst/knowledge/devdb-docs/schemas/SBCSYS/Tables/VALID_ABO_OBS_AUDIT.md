---
tags:
  - table
  - SBCSYS
---
# VALID_ABO_OBS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 282
**Last Analyzed**: 2025-09-16 03:15:56
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESULT_CODE | VARCHAR2(2) | Yes |  |  |
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
| 13 | EFF_DATE | DATE | Yes |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 18 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 19 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_ABO_OBS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
