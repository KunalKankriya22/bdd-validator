---
tags:
  - table
  - UTIL
---
# FCN_GRP

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 41
**Last Analyzed**: 2026-04-18 15:02:41
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | GRP_ID | VARCHAR2(5) | No |  |  |
| 3 | DESCRIP | VARCHAR2(40) | No |  |  |

## Primary Key

**FCN_GRP_PK**: `APPL_ID, GRP_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FCN_GRP_PK | NORMAL | UNIQUE | APPL_ID, GRP_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
