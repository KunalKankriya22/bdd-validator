---
tags:
  - table
  - SBCSYS
---
# FR_VPROCESS_STAGES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 24
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROCESS_CODE | VARCHAR2(5) | No |  |  |
| 2 | STAGE_CODE | VARCHAR2(5) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 6 | AUDIT_KEY | NUMBER | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

**FR_PROCESS_STAGES_PK**: `PROCESS_CODE, STAGE_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FR_VPROCESS_STAGES_IDX_1 | NORMAL | UNIQUE | PROCESS_CODE, STAGE_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/FR_PROC_STAGES_BEFORE_DELETE|FR_PROC_STAGES_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/FR_PROC_STAGES_INSERT_UPDATE|FR_PROC_STAGES_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
