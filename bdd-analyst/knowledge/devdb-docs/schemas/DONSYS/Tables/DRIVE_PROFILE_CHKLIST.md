---
tags:
  - table
  - DONSYS
---
# DRIVE_PROFILE_CHKLIST

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 133
**Last Analyzed**: 2026-04-22 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_PROFILE_CODE | VARCHAR2(10) | No |  |  |
| 2 | DEVICE_TYPE | VARCHAR2(10) | No |  |  |
| 3 | CODE | VARCHAR2(10) | No |  |  |
| 4 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 5 | AUDIT_KEY | NUMBER | No |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 9 | INSERT_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_PROFILE_CHKLIST_BI|DRIVE_PROFILE_CHKLIST_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
