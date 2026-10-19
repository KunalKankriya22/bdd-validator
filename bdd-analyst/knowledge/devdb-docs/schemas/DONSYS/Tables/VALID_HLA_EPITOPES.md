---
tags:
  - table
  - DONSYS
---
# VALID_HLA_EPITOPES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 114
**Last Analyzed**: 2026-05-09 19:04:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | HLA_STANDARD | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PUBLIC_EPITOPE_ID | VARCHAR2(5) | No |  |  |
| 4 | ASSOCIATED_EPITOPE_ID | VARCHAR2(6) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_HLA_EPITOPES_PK**: `HLA_STANDARD, CHAPTER_ID, PUBLIC_EPITOPE_ID, ASSOCIATED_EPITOPE_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_HLA_EPITOPES_PK | NORMAL | UNIQUE | HLA_STANDARD, CHAPTER_ID, PUBLIC_EPITOPE_ID, ASSOCIATED_EPITOPE_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_HLA_EPITOPES_BD|VALID_HLA_EPITOPES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HLA_EPITOPES_BI|VALID_HLA_EPITOPES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HLA_EPITOPES_BU|VALID_HLA_EPITOPES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
