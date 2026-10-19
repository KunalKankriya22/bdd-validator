---
tags:
  - table
  - DONSYS
---
# WEB_APPLICATION_CONFIG

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 106
**Last Analyzed**: 2026-04-25 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(15) | Yes |  |  |
| 2 | WEB_ENABLE_FLAG | VARCHAR2(1) | Yes |  |  |
| 3 | TYPE_OF_DONOR_ALLOWED | VARCHAR2(10) | Yes |  |  |
| 4 | AUDIO_ENABLED | VARCHAR2(1) | Yes |  |  |
| 5 | MULTI_LANGAUGE_ENABLED | VARCHAR2(1) | Yes |  |  |
| 6 | ALLOW_ABBR_QUESTIONAIRE | VARCHAR2(1) | Yes |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/WEB_APPLICATION_CONFIG_BI|WEB_APPLICATION_CONFIG_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
