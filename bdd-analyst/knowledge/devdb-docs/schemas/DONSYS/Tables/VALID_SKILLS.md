---
tags:
  - table
  - DONSYS
---
# VALID_SKILLS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 84
**Last Analyzed**: 2025-09-16 03:14:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | JOB_CODE | VARCHAR2(5) | No |  |  |
| 2 | SKILL_RATING | NUMBER(2) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | SKILL_DESC | VARCHAR2(50) | No |  |  |
| 5 | MIN_PROJ_DRAW | NUMBER(6) | Yes |  |  |
| 6 | MAX_PROJ_DRAW | NUMBER(6) | Yes |  |  |
| 7 | DRIVE_CATEGORY | VARCHAR2(5) | Yes |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_SKILLS_PK**: `JOB_CODE, SKILL_RATING, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_SKILLS_PK | NORMAL | UNIQUE | JOB_CODE, SKILL_RATING, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_SKILLS_BD|VALID_SKILLS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_SKILLS_BI|VALID_SKILLS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_SKILLS_BU|VALID_SKILLS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
