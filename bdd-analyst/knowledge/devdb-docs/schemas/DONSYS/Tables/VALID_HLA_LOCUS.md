---
tags:
  - table
  - DONSYS
---
# VALID_HLA_LOCUS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 151
**Last Analyzed**: 2026-05-13 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EPITOPE_ID | VARCHAR2(6) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | LOCUS | VARCHAR2(2) | No |  |  |
| 4 | EPITOPE_SUPER_ID | VARCHAR2(6) | Yes |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_HLA_LOCUS_PK**: `EPITOPE_ID, CHAPTER_ID, LOCUS`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_HLA_LOCUS_PK | NORMAL | UNIQUE | EPITOPE_ID, CHAPTER_ID, LOCUS | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_HLA_LOCUS_BD|VALID_HLA_LOCUS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HLA_LOCUS_BI|VALID_HLA_LOCUS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_HLA_LOCUS_BU|VALID_HLA_LOCUS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
