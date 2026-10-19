---
tags:
  - table
  - VISTA
---
# VIS_ELIGIBILITY

**Schema**: [[schemas/VISTA/VISTA|VISTA]]
**Tablespace**: BC_DATA
**Estimated Rows**: 5288
**Last Analyzed**: 2025-11-14 04:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(20) | No |  |  |
| 2 | PLATELET_ELIGIBLE | VARCHAR2(2) | Yes |  |  |
| 3 | PLASMA_ELIGIBLE | VARCHAR2(2) | Yes |  |  |
| 4 | RBC_ELIGIBLE | VARCHAR2(2) | Yes |  |  |
| 5 | WHOLE_BLOOD_ELIGIBLE | VARCHAR2(2) | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | No | sysdate |  |

## Primary Key

**VISTA_ELIGIBILITY_PK**: `TRANSACTION_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VISTA_ELIGIBILITY_PK | NORMAL | UNIQUE | TRANSACTION_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| VISTA_DONOR | VIEW | VISTA |
