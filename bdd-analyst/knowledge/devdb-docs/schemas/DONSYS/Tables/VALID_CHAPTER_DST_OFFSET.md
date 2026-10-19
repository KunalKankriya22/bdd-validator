---
tags:
  - table
  - DONSYS
---
# VALID_CHAPTER_DST_OFFSET

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 47
**Last Analyzed**: 2026-04-18 03:00:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | START_TIME | DATE | No |  |  |
| 3 | END_TIME | DATE | No |  |  |
| 4 | TZ_BASE_DIFF | VARCHAR2(15) | No |  |  |
| 5 | OFF_SET | NUMBER | No |  |  |
| 6 | LAST_MODIFED_DATE | DATE | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | TZ_REGION | VARCHAR2(64) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**CHAPTER_DST_OFFSET_PK**: `CHAPTER_ID, START_TIME`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CHAPTER_DST_OFFSET_PK | NORMAL | UNIQUE | CHAPTER_ID, START_TIME | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/CHAPTER_DST_OFFSET_BEFORE_DEL|CHAPTER_DST_OFFSET_BEFORE_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/CHAPTER_DST_OFFSET_BEFORE_INS|CHAPTER_DST_OFFSET_BEFORE_INS]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/CHAPTER_DST_OFFSET_BEFORE_UPD|CHAPTER_DST_OFFSET_BEFORE_UPD]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
