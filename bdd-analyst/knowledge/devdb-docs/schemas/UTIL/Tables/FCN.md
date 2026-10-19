---
tags:
  - table
  - UTIL
---
# FCN

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1192
**Last Analyzed**: 2026-05-17 11:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | FCN_ID | NUMBER(6) | No |  |  |
| 3 | FCN_TYPE | VARCHAR2(5) | No |  |  |
| 4 | EXEC_NAME | VARCHAR2(50) | No |  |  |
| 5 | HOST_CMD | VARCHAR2(50) | Yes |  |  |
| 6 | P1_NAME | VARCHAR2(20) | Yes |  |  |
| 7 | P2_NAME | VARCHAR2(20) | Yes |  |  |
| 8 | P3_NAME | VARCHAR2(20) | Yes |  |  |
| 9 | REMARKS | VARCHAR2(120) | Yes |  |  |
| 10 | PROGRAM_AUTHOR | VARCHAR2(10) | Yes |  |  |
| 11 | APPL_TYPE | VARCHAR2(3) | Yes |  |  |
| 12 | FCN_CLASS | VARCHAR2(10) | Yes |  |  |
| 13 | FCN_ICON | VARCHAR2(30) | Yes |  |  |
| 14 | FCN_URL | VARCHAR2(200) | Yes |  |  |
| 15 | FCN_SCOPE | VARCHAR2(50) | Yes |  |  |

## Primary Key

**FCN_PK**: `APPL_ID, FCN_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FCN_PK | NORMAL | UNIQUE | APPL_ID, FCN_ID | VALID |

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
| USER_MENU | VIEW | UTIL |
