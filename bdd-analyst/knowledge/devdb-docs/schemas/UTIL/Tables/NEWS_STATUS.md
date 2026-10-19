---
tags:
  - table
  - UTIL
---
# NEWS_STATUS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4
**Last Analyzed**: 2025-09-16 03:16:47
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | NEWS_ID | VARCHAR2(10) | No |  |  |
| 3 | DESCRIPTION | VARCHAR2(40) | No |  |  |
| 4 | EFF_DATE | DATE | Yes |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | UPD_BY | VARCHAR2(10) | Yes |  |  |
| 7 | UPD_DATE | DATE | Yes |  |  |

## Primary Key

**NEWS_STATUS_PK**: `APPL_ID, NEWS_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| APPL_NEWS_STATUS_FK | APPL_ID | [[schemas/UTIL/Tables/APPLICATIONS\|UTIL.APPLICATIONS]] (APPL_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| NEWS_STATUS_PK | NORMAL | UNIQUE | APPL_ID, NEWS_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
