---
tags:
  - table
  - DONSYS
---
# ALERT_LOG

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 708
**Last Analyzed**: 2025-11-12 04:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MSG_ID | VARCHAR2(10) | No |  |  |
| 2 | USER_ID | VARCHAR2(6) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | READ_DATE | DATE | Yes |  |  |
| 5 | REMOVE_DATE | DATE | Yes |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |

## Primary Key

**ALERT_LOG_PK**: `MSG_ID, USER_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ALERT_LOG_PK | NORMAL | UNIQUE | MSG_ID, USER_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/ALERT_LOG_BI|ALERT_LOG_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
