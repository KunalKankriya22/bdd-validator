---
tags:
  - table
  - VISTA
---
# IDP_TARGET_CHANGE

**Schema**: [[schemas/VISTA/VISTA|VISTA]]
**Tablespace**: BC_DATA
**Estimated Rows**: 981
**Last Analyzed**: 2025-09-27 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TARGET_CHANGE_ID | NUMBER(15) | No |  |  |
| 2 | TARGET_SYSTEM | VARCHAR2(20) | No | 'Lifetrak' |  |
| 3 | TARGET_ID | VARCHAR2(20) | No |  |  |
| 4 | TARGET_TABLE | VARCHAR2(30) | Yes |  |  |
| 5 | TARGET_FIELD | VARCHAR2(30) | No |  |  |
| 6 | TARGET_VALUE | VARCHAR2(240) | No |  |  |
| 7 | TARGET_CHANGE_DATE | DATE | No |  |  |

## Primary Key

**ITC_PK**: `TARGET_CHANGE_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ITC_PK | NORMAL | UNIQUE | TARGET_CHANGE_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
