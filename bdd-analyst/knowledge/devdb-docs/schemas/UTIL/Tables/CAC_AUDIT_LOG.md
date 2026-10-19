---
tags:
  - table
  - UTIL
---
# CAC_AUDIT_LOG

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 73198
**Last Analyzed**: 2026-05-13 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_USER_NAME | VARCHAR2(50) | Yes |  |  |
| 2 | AUDIT_PASSWORD | VARCHAR2(50) | Yes |  |  |
| 3 | AUDIT_DATE_TIME | TIMESTAMP(6) | Yes |  |  |
| 4 | WORK_STATION | VARCHAR2(50) | Yes |  |  |
| 5 | AUDIT_EVENT | VARCHAR2(50) | Yes |  |  |
| 6 | AUDIT_MSG | VARCHAR2(200) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
