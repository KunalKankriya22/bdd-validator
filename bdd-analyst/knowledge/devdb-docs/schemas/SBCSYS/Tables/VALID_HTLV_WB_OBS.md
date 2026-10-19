---
tags:
  - table
  - SBCSYS
---
# VALID_HTLV_WB_OBS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 9
**Last Analyzed**: 2025-09-16 03:15:59
**Partitioned**: NO

> [!quote] Created from Entity VALID HTLV WB OBSERVATION by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESULT_CODE | VARCHAR2(4) | No |  |  |
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
| VALID_HTLV_WB_OBS_IDX_1 | NORMAL | UNIQUE | P21, P19, P24, P26, P28, P32, P38, P42, GP46, P53, P_OTHER | VALID |
| VALID_HTLV_WB_OBS_IDX_2 | NORMAL | NONUNIQUE | RESULT_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_HTLV_OBS_BEFORE_DELETE|VALID_HTLV_OBS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_HTLV_OBS_INSERT_UPDATE|VALID_HTLV_OBS_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
