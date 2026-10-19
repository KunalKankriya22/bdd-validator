---
tags:
  - table
  - SBCSYS
---
# VALID_NOTATION_CODES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 24
**Last Analyzed**: 2025-09-16 03:16:00
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | NOTATION_CODE | VARCHAR2(10) | No |  |  |
| 2 | NOTATION_DESC | VARCHAR2(1000) | No |  |  |
| 3 | NOTATION_TYPE | VARCHAR2(1) | Yes |  |  |
| 4 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | SHORT_DESC | VARCHAR2(240) | Yes |  |  |
| 11 | TEST_ID | VARCHAR2(10) | Yes |  |  |

## Primary Key

**VALID_NOTATION_CODES_PK**: `NOTATION_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_NOTATION_CODES_PK | NORMAL | UNIQUE | NOTATION_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_NOTATION_CODES_BD|VALID_NOTATION_CODES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_NOTATION_CODES_BI|VALID_NOTATION_CODES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_NOTATION_CODES_BU|VALID_NOTATION_CODES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
