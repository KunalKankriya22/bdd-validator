---
tags:
  - table
  - DONSYS
---
# DONOR_LETTER_TEXT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 943
**Last Analyzed**: 2025-09-16 03:13:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | LETTER_SEQ_NO | VARCHAR2(10) | No |  |  |
| 3 | LETTER_TEXT | LONG | No |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| DONOR_LETTER_TEXT_UK | CHAPTER_ID, DONOR_ID, LETTER_SEQ_NO | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_LETTER_TEXT_UK | NORMAL | UNIQUE | CHAPTER_ID, DONOR_ID, LETTER_SEQ_NO | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
