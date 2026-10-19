---
tags:
  - table
  - DONSYS
---
# VALID_NOTIFIC_LETTERS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 314
**Last Analyzed**: 2025-09-16 03:14:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INTER_CODE | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 4 | LETTER_ID | VARCHAR2(10) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| VALID_NOTIFIC_LETTERS_U1 | INTER_CODE, DONATION_TYPE, LETTER_ID | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_NOTIFIC_LETTERS_N1 | NORMAL | NONUNIQUE | LETTER_ID | VALID |
| VALID_NOTIFIC_LETTERS_U1 | NORMAL | UNIQUE | INTER_CODE, DONATION_TYPE, LETTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_NOTIFIC_LETTERS_BD|VALID_NOTIFIC_LETTERS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_NOTIFIC_LETTERS_BI|VALID_NOTIFIC_LETTERS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_NOTIFIC_LETTERS_BU|VALID_NOTIFIC_LETTERS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
