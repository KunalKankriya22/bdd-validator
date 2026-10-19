---
tags:
  - table
  - SBCSYS
---
# VALID_HIV_WB_OBS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 50
**Last Analyzed**: 2025-09-16 03:15:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESULT_CODE | VARCHAR2(4) | Yes |  |  |
| 2 | P17 | VARCHAR2(1) | Yes |  |  |
| 3 | P24 | VARCHAR2(1) | Yes |  |  |
| 4 | P31 | VARCHAR2(1) | Yes |  |  |
| 5 | GP41 | VARCHAR2(1) | Yes |  |  |
| 6 | P51 | VARCHAR2(1) | Yes |  |  |
| 7 | P55 | VARCHAR2(1) | Yes |  |  |
| 8 | P66 | VARCHAR2(1) | Yes |  |  |
| 9 | P120 | VARCHAR2(1) | Yes |  |  |
| 10 | P160 | VARCHAR2(1) | Yes |  |  |
| 11 | EFF_DATE | DATE | Yes |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 16 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 17 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_HIV_WB_OBS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
