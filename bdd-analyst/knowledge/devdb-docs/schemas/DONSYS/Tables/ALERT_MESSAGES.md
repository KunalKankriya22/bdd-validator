---
tags:
  - table
  - DONSYS
---
# ALERT_MESSAGES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 9465
**Last Analyzed**: 2025-09-16 03:10:39
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MSG_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | MSG_TEXT | VARCHAR2(1000) | No |  |  |
| 4 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 5 | INSERT_DATE | DATE | No |  |  |
| 6 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**ALERT_MESSAGES_PK**: `MSG_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ALERT_MESSAGES_PK | NORMAL | UNIQUE | MSG_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/ALERT_MESSAGES_BI|ALERT_MESSAGES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
