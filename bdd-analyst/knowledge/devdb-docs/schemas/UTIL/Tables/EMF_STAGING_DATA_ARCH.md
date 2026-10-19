---
tags:
  - table
  - UTIL
---
# EMF_STAGING_DATA_ARCH

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 30471
**Last Analyzed**: 2025-11-14 04:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TABLE_NAME | VARCHAR2(50) | No |  |  |
| 2 | TABLE_AUDIT_KEY | NUMBER | No |  |  |
| 3 | SOURCE_FUNCTION | VARCHAR2(50) | No |  |  |
| 4 | SOURCE_APPLICATION | VARCHAR2(5) | No |  |  |
| 5 | INSERT_DATE | DATE | No |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | MODE_FLAG | VARCHAR2(1) | No |  |  |
| 9 | STATUS_FLAG | VARCHAR2(1) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EMF_STAGING_DATA_ARCH_TAKPI | NORMAL | NONUNIQUE | TABLE_AUDIT_KEY, PROGRAM_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
