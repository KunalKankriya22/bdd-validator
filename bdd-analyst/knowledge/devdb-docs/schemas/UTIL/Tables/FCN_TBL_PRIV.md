---
tags:
  - table
  - UTIL
---
# FCN_TBL_PRIV

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 206
**Last Analyzed**: 2026-02-13 04:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | FCN_ID | NUMBER(6) | No |  |  |
| 3 | TBL_NAME | VARCHAR2(30) | No |  |  |
| 4 | TBL_OWNER | VARCHAR2(30) | No |  |  |
| 5 | SEL | VARCHAR2(1) | Yes |  |  |
| 6 | INS | VARCHAR2(1) | Yes |  |  |
| 7 | DEL | VARCHAR2(1) | Yes |  |  |
| 8 | UPD | VARCHAR2(1) | Yes |  |  |

## Primary Key

**FCN_TBL_PRIV_PK**: `APPL_ID, FCN_ID, TBL_NAME`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FCN_TBL_PRIV_PK | NORMAL | UNIQUE | APPL_ID, FCN_ID, TBL_NAME | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
