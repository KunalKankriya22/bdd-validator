---
tags:
  - table
  - UTIL
---
# RW_JOBS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | JOBID | NUMBER | No |  |  |
| 2 | SERVERNAME | VARCHAR2(100) | No |  |  |
| 3 | JOB | BLOB | Yes |  |  |
| 4 | OWNER | VARCHAR2(25) | Yes |  |  |
| 5 | ID | NUMBER | Yes |  |  |
| 6 | STATUS | NUMBER(1,1) | Yes |  |  |
| 7 | QUEUE | NUMBER(1) | Yes |  |  |
| 8 | MASTERJOB | NUMBER | Yes |  |  |
| 9 | CACHEKEY | VARCHAR2(500) | Yes |  |  |
| 10 | EXPIRATION | NUMBER | Yes |  |  |

## Primary Key

**job_server**: `JOBID, SERVERNAME`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| job_server | NORMAL | UNIQUE | JOBID, SERVERNAME | VALID |

## Triggers

- [[schemas/UTIL/Triggers/RW_ID|RW_ID]] — BEFORE EACH ROW INSERT (ENABLED)

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| JOB | SYS_LOB0000076604C00003$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
