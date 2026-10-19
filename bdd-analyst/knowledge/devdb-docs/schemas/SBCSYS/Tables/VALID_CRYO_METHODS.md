---
tags:
  - table
  - SBCSYS
---
# VALID_CRYO_METHODS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8
**Last Analyzed**: 2025-09-16 03:15:58
**Partitioned**: NO

> [!quote] Created from Entity VALID CRYO METHOD by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | THAW_METHOD | VARCHAR2(4) | No |  |  |
| 3 | METHOD_DESC | VARCHAR2(50) | No |  |  |
| 4 | MIN_TEMP | NUMBER(5,2) | No |  |  |
| 5 | MAX_TEMP | NUMBER(5,2) | No |  |  |
| 6 | MIN_WS_FREEZE_TIME | NUMBER(5,2) | No |  |  |
| 7 | MAX_WS_FREEZE_TIME | NUMBER(5,2) | No |  |  |
| 8 | MIN_SEP_FREEZE_TIME | NUMBER(5,2) | No |  |  |
| 9 | MAX_SEP_FREEZE_TIME | NUMBER(5,2) | No |  |  |
| 10 | EFF_DATE | DATE | No |  |  |
| 11 | TERM_DATE | DATE | Yes |  |  |
| 12 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_CRYO_METHODS_IDX_1 | NORMAL | UNIQUE | CHAPTER_ID, THAW_METHOD | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_CRYO_BEFORE_DELETE|VALID_CRYO_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_CRYO_INSERT_UPDATE|VALID_CRYO_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
