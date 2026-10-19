---
tags:
  - table
  - UTIL
---
# VALID_PARAMETERS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 200
**Last Analyzed**: 2026-04-19 11:00:06
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PARAMETER_CODE | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PARAMETER_TYPE | VARCHAR2(5) | No |  |  |
| 4 | PARAMETER_VALUE | VARCHAR2(30) | No |  |  |
| 5 | DESCRIPTION | VARCHAR2(150) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_PARAMETERS_PK**: `PARAMETER_CODE, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_PARAMETERS_PK | NORMAL | UNIQUE | PARAMETER_CODE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/UTIL/Triggers/VALID_PARAMETERS_BD|VALID_PARAMETERS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/UTIL/Triggers/VALID_PARAMETERS_BI|VALID_PARAMETERS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/UTIL/Triggers/VALID_PARAMETERS_BU|VALID_PARAMETERS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
