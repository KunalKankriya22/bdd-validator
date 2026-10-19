---
tags:
  - table
  - DONSYS
---
# VALID_SURVEY_LINK_CONFIG

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 22
**Last Analyzed**: 2026-04-14 03:00:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | FUNC_NAME | VARCHAR2(10) | No |  |  |
| 3 | DONOR_TYPE | VARCHAR2(1) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | AUDIT_KEY | NUMBER | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | ALERT_REQ | VARCHAR2(1) | Yes |  |  |

## Primary Key

**VALID_SURVEY_LINK_CONFIG_PK**: `CHAPTER_ID, DONOR_TYPE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_SURVEY_LINK_CONFIG_PK | NORMAL | UNIQUE | CHAPTER_ID, DONOR_TYPE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_SURVEY_LINK_CONFIG_BD|VALID_SURVEY_LINK_CONFIG_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_SURVEY_LINK_CONFIG_BI|VALID_SURVEY_LINK_CONFIG_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_SURVEY_LINK_CONFIG_BU|VALID_SURVEY_LINK_CONFIG_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
