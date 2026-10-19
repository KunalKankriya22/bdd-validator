---
tags:
  - table
  - SBCSYS
---
# VALID_HTLV_WB_OBS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 45
**Last Analyzed**: 2025-09-16 03:15:59
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESULT_CODE | VARCHAR2(4) | Yes |  |  |
| 2 | P21 | VARCHAR2(1) | Yes |  |  |
| 3 | P19 | VARCHAR2(1) | Yes |  |  |
| 4 | P24 | VARCHAR2(1) | Yes |  |  |
| 5 | P26 | VARCHAR2(1) | Yes |  |  |
| 6 | P28 | VARCHAR2(1) | Yes |  |  |
| 7 | P32 | VARCHAR2(1) | Yes |  |  |
| 8 | P38 | VARCHAR2(1) | Yes |  |  |
| 9 | P42 | VARCHAR2(1) | Yes |  |  |
| 10 | GP46 | VARCHAR2(1) | Yes |  |  |
| 11 | P53 | VARCHAR2(1) | Yes |  |  |
| 12 | P_OTHER | VARCHAR2(1) | Yes |  |  |
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
| VALID_HTLV_WB_OBS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
