---
tags:
  - table
  - SBCSYS
---
# RGT_DUP_TUBES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1680
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | CBC_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 4 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 5 | TUBE_CHECK_IN_DATE | DATE | Yes |  |  |
| 6 | TUBE_TYPE | VARCHAR2(2) | Yes |  |  |
| 7 | REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_DUP_TUBES_BEFORE_DELETE|RGT_DUP_TUBES_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_DUP_TUBES_BEFORE_UPDATE|RGT_DUP_TUBES_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_DUP_TUBES_BI|RGT_DUP_TUBES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
