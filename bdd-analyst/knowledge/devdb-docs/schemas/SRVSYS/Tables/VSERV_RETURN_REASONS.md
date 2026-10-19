---
tags:
  - table
  - SRVSYS
---
# VSERV_RETURN_REASONS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 82
**Last Analyzed**: 2026-04-19 11:00:06
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CODE | VARCHAR2(5) | No |  |  |
| 3 | CODE_DESC | VARCHAR2(50) | No |  |  |
| 4 | LOCATION_TYPE | VARCHAR2(2) | No |  |  |
| 5 | CR_NCR | VARCHAR2(1) | No |  |  |
| 6 | ENFORCE | VARCHAR2(1) | No |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | FEE_CODE_1 | VARCHAR2(5) | Yes |  |  |
| 13 | FEE_CODE_2 | VARCHAR2(5) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_RETURN_REASONS_IDX_1 | NORMAL | UNIQUE | CHAPTER_ID, CODE | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_RETURN_REASON_BEFORE_DEL|VSERV_RETURN_REASON_BEFORE_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_RETURN_REASON_BEFORE_INS|VSERV_RETURN_REASON_BEFORE_INS]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_RETURN_REASON_BEFORE_UP|VSERV_RETURN_REASON_BEFORE_UP]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
