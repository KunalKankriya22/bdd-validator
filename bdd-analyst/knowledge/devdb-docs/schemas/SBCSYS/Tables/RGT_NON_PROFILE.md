---
tags:
  - table
  - SBCSYS
---
# RGT_NON_PROFILE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 94
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | EFF_DATE | DATE | Yes |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_USER | VARCHAR2(30) | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER(15) | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | TEST_GROUP | VARCHAR2(6) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_NON_PROFILE_BD|RGT_NON_PROFILE_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_NON_PROFILE_BI|RGT_NON_PROFILE_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_NON_PROFILE_BU|RGT_NON_PROFILE_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
