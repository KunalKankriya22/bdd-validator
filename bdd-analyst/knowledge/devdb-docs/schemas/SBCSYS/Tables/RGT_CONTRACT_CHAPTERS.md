---
tags:
  - table
  - SBCSYS
---
# RGT_CONTRACT_CHAPTERS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 219
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | AUDIT_KEY | NUMBER | No |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_CONTRACT_CHAPTERS_INS_UPD|RGT_CONTRACT_CHAPTERS_INS_UPD]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
