---
tags:
  - table
  - UTIL
---
# NEWS_TABLE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 48
**Last Analyzed**: 2025-09-16 03:16:47
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(4) | No |  |  |
| 2 | NEWS_ID | VARCHAR2(10) | No |  |  |
| 3 | SERIAL_NO | NUMBER(4) | No |  |  |
| 4 | NEWS_TEXT | VARCHAR2(70) | Yes |  |  |

## Primary Key

**NEWS_TABLE_PK**: `APPL_ID, NEWS_ID, SERIAL_NO`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| NEWS_TABLE_PK | NORMAL | UNIQUE | APPL_ID, NEWS_ID, SERIAL_NO | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
