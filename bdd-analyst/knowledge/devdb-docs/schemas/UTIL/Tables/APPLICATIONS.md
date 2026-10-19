---
tags:
  - table
  - UTIL
---
# APPLICATIONS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1
**Last Analyzed**: 2025-10-10 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | APPL_NAME | VARCHAR2(50) | No |  |  |
| 3 | APPL_SHORT_NAME | VARCHAR2(50) | No |  |  |
| 4 | VERSION_NO | VARCHAR2(50) | No |  |  |
| 5 | VERSION_DATE | DATE | No |  |  |
| 6 | STARTUP_FORM_NAME | VARCHAR2(30) | Yes |  |  |
| 7 | UDI | VARCHAR2(200) | Yes |  |  |

## Primary Key

**APPLICATIONS_PK**: `APPL_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/UTIL/Tables/HELP_STATUS\|UTIL.HELP_STATUS]] | APPL_HELP_STATUS_FK | APPL_ID → APPL_ID |
| [[schemas/UTIL/Tables/NEWS_STATUS\|UTIL.NEWS_STATUS]] | APPL_NEWS_STATUS_FK | APPL_ID → APPL_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| APPLICATIONS_PK | NORMAL | UNIQUE | APPL_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
