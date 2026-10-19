---
tags:
  - table
  - DONSYS
---
# VALID_OPERATORS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 40
**Last Analyzed**: 2026-04-29 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | V_OPERATOR | VARCHAR2(10) | No |  |  |
| 2 | V_DESCRIPTION | VARCHAR2(100) | Yes |  |  |
| 3 | V_VALUE_STYLE | VARCHAR2(1) | Yes |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_OPERATORS_PK**: `V_OPERATOR`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_OPERATORS_PK | NORMAL | UNIQUE | V_OPERATOR | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_OPERATORS_BD|VALID_OPERATORS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_OPERATORS_BI|VALID_OPERATORS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_OPERATORS_BU|VALID_OPERATORS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
