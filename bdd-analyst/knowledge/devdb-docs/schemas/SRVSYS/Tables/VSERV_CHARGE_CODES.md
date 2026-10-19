---
tags:
  - table
  - SRVSYS
---
# VSERV_CHARGE_CODES

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 211
**Last Analyzed**: 2025-09-16 03:16:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHARGE_CODE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CHARGE_CODE_DESC | VARCHAR2(50) | No |  |  |
| 4 | CHARGE_CODE_TYPE | VARCHAR2(2) | No |  |  |
| 5 | CHARGE | NUMBER(9,2) | No |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | SERVICE_CODE | VARCHAR2(12) | Yes |  |  |
| 10 | PERCENT_DISC_FLAG | VARCHAR2(1) | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 13 | SHIP_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | CR_NCR | VARCHAR2(1) | Yes |  |  |
| 15 | EDIT_CHARGE | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_CHARGE_CODES_IDX_1 | NORMAL | UNIQUE | CHARGE_CODE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_CHARGE_CODES_BEFORE_DEL|VSERV_CHARGE_CODES_BEFORE_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_CHARGE_CODES_BEFORE_INS|VSERV_CHARGE_CODES_BEFORE_INS]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_CHARGE_CODES_BEFORE_UP|VSERV_CHARGE_CODES_BEFORE_UP]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
