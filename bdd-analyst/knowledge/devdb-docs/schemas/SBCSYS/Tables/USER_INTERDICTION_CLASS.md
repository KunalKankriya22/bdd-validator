---
tags:
  - table
  - SBCSYS
---
# USER_INTERDICTION_CLASS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 366
**Last Analyzed**: 2026-04-22 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | USER_ID | VARCHAR2(6) | No |  |  |
| 2 | INTER_CLASS | VARCHAR2(5) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 6 | AUDIT_KEY | NUMBER | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| USER_INTERDICTION_CLASS_IDX_1 | NORMAL | UNIQUE | USER_ID, INTER_CLASS | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/USER_INTCLS_FULL_B_DEL|USER_INTCLS_FULL_B_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/USER_INTCLS_FULL_B_INS_UPD|USER_INTCLS_FULL_B_INS_UPD]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
