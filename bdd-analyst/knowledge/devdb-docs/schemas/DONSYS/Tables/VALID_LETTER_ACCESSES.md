---
tags:
  - table
  - DONSYS
---
# VALID_LETTER_ACCESSES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LETTER_ID | VARCHAR2(10) | No |  |  |
| 2 | ACCESS_CLASS | VARCHAR2(5) | No |  |  |
| 3 | EDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_LETTER_ACCESSES_PK**: `LETTER_ID, ACCESS_CLASS`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_LETTER_ACCESSES_PK | NORMAL | UNIQUE | LETTER_ID, ACCESS_CLASS | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_LETTER_ACCESSES_BD|VALID_LETTER_ACCESSES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_LETTER_ACCESSES_BI|VALID_LETTER_ACCESSES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_LETTER_ACCESSES_BU|VALID_LETTER_ACCESSES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
