---
tags:
  - table
  - AGMGR
---
# VALID_EXT_ANT_APPROVED_DET

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 12
**Last Analyzed**: 2025-03-15 03:00:51
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EXT_FAC_CODE | VARCHAR2(5) | No |  |  |
| 2 | TEST_ANTIGEN | VARCHAR2(10) | No |  |  |
| 3 | APPROVED_FLAG | VARCHAR2(1) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | TEST_BATCH_PREFIX | VARCHAR2(5) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 11 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 12 | MODIFIED_DATE | DATE | Yes |  |  |
| 13 | MODIFIED_USER | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/AGMGR/Triggers/VALID_EXT_ANT_APPROVED_DET_BD|VALID_EXT_ANT_APPROVED_DET_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/AGMGR/Triggers/VALID_EXT_ANT_APPROVED_DET_BI|VALID_EXT_ANT_APPROVED_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/AGMGR/Triggers/VALID_EXT_ANT_APPROVED_DET_BU|VALID_EXT_ANT_APPROVED_DET_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
