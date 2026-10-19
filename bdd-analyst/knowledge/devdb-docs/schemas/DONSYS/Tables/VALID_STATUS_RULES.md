---
tags:
  - table
  - DONSYS
---
# VALID_STATUS_RULES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 27
**Last Analyzed**: 2025-09-16 03:14:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | STAFF_STATUS | VARCHAR2(5) | No |  |  |
| 2 | VAN_STATUS | VARCHAR2(5) | No |  |  |
| 3 | COACH_STATUS | VARCHAR2(5) | No |  |  |
| 4 | OVERALL_STATUS | VARCHAR2(5) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_STATUS_RULES_PK**: `STAFF_STATUS, VAN_STATUS, COACH_STATUS`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_STATUS_RULES_PK | NORMAL | UNIQUE | STAFF_STATUS, VAN_STATUS, COACH_STATUS | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_STATUS_RULES_BD|VALID_STATUS_RULES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_STATUS_RULES_BI|VALID_STATUS_RULES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_STATUS_RULES_BU|VALID_STATUS_RULES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
