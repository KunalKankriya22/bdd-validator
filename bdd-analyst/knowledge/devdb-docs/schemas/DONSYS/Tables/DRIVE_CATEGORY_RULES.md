---
tags:
  - table
  - DONSYS
---
# DRIVE_CATEGORY_RULES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 47
**Last Analyzed**: 2026-04-04 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RULE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DRIVE_CATEGORY | VARCHAR2(5) | No |  |  |
| 4 | NUMBER_ALLOWED | NUMBER(2) | Yes |  |  |
| 5 | MAX_SIZE | NUMBER(4) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**DRIVE_CATEGORY_RULES_PK**: `RULE_ID, DRIVE_CATEGORY, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_CATEGORY_RULES_PK | NORMAL | UNIQUE | RULE_ID, DRIVE_CATEGORY, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_CATEGORY_RULES_BD|DRIVE_CATEGORY_RULES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DRIVE_CATEGORY_RULES_BI|DRIVE_CATEGORY_RULES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DRIVE_CATEGORY_RULES_BU|DRIVE_CATEGORY_RULES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
