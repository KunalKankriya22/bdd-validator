---
tags:
  - table
  - VISTA
---
# VIS_ELIGIBILITY_DET

**Schema**: [[schemas/VISTA/VISTA|VISTA]]
**Tablespace**: BC_DATA
**Estimated Rows**: 41393
**Last Analyzed**: 2025-11-14 04:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(20) | No |  |  |
| 2 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 3 | GROUP_ID | VARCHAR2(10) | Yes |  |  |
| 4 | PROCEDURE_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | STATUS | VARCHAR2(1) | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | No | sysdate |  |
| 7 | LAST_MODIFIED_USER | VARCHAR2(30) | Yes | user |  |

## Primary Key

**VISTA_ELIGIBILITY_DET_PK**: `TRANSACTION_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VIS_ELIGIBILITY_DET_INDX1 | NORMAL | NONUNIQUE | TRANSACTION_ID, DONOR_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
