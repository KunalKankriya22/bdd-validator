---
tags:
  - table
  - DONSYS
---
# VALID_RBC_GROUPS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 15
**Last Analyzed**: 2025-09-16 03:14:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | GROUP_ID | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | RESULT_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_RBC_GROUPS_PK**: `GROUP_ID, CHAPTER_ID, TEST_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_RBC_GROUPS_PK | NORMAL | UNIQUE | GROUP_ID, CHAPTER_ID, TEST_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_RBC_GROUPS_BD|VALID_RBC_GROUPS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_RBC_GROUPS_BI|VALID_RBC_GROUPS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_RBC_GROUPS_BU|VALID_RBC_GROUPS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
