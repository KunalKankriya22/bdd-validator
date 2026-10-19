---
tags:
  - table
  - UTIL
---
# VALID_WAREHOUSE_USERS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 465
**Last Analyzed**: 2026-04-19 11:00:06
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | USER_ID | VARCHAR2(10) | No |  |  |
| 2 | WAREHOUSE_ID | VARCHAR2(1) | No |  |  |
| 3 | EFF_DATE | DATE | Yes |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 6 | INSERT_USER | VARCHAR2(10) | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 9 | PRINTER_ID | VARCHAR2(15) | Yes |  |  |
| 10 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| USER_WAREHOUSE_USER_FK | USER_ID | [[schemas/UTIL/Tables/SYSTEM_USERS\|UTIL.SYSTEM_USERS]] (USER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_WAREHOUSE_USER_PK | NORMAL | UNIQUE | USER_ID, WAREHOUSE_ID, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
