---
tags:
  - table
  - SBCSYS
---
# VALID_CENTRIFUGES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8
**Last Analyzed**: 2025-09-16 03:15:58
**Partitioned**: NO

> [!quote] Created from Entity VALID CENTRIFUGE by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CENTRIFUGE_ID | VARCHAR2(3) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | MANUFACTURER | VARCHAR2(50) | No |  |  |
| 4 | COMMISSIONED_DATE | DATE | Yes |  |  |
| 5 | LAST_CALIBRATION_DATE | DATE | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_CENTRIFUGES_IDX_1 | NORMAL | UNIQUE | CENTRIFUGE_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_CENTR_BEFORE_DELETE|VALID_CENTR_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_CENTR_INSERT_UPDATE|VALID_CENTR_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
