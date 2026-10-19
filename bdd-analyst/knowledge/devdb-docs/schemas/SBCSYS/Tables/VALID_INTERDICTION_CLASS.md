---
tags:
  - table
  - SBCSYS
---
# VALID_INTERDICTION_CLASS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 824
**Last Analyzed**: 2026-04-18 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INTER_CODE | VARCHAR2(4) | No |  |  |
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
| VALID_INTERDICTION_CLASS_IDX_1 | NORMAL | UNIQUE | INTER_CODE, INTER_CLASS | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_INTCLS_FULL_B_DEL|VALID_INTCLS_FULL_B_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_INTCLS_FULL_B_INS_UPD|VALID_INTCLS_FULL_B_INS_UPD]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
