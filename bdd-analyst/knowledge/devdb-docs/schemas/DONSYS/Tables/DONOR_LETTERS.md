---
tags:
  - table
  - DONSYS
---
# DONOR_LETTERS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3521
**Last Analyzed**: 2026-05-06 03:00:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | LETTER_SEQ_NO | VARCHAR2(10) | No |  |  |
| 4 | LETTER_CODE | VARCHAR2(10) | No |  |  |
| 5 | AUTHORIZED_BY | VARCHAR2(6) | Yes |  |  |
| 6 | GENERATE_DATE | DATE | No |  |  |
| 7 | GENERATED_BY | VARCHAR2(6) | Yes |  |  |
| 8 | LAST_REPRINTED_ON | DATE | Yes |  |  |
| 9 | LAST_REPRINTED_BY | VARCHAR2(6) | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | MODIFY_IND | VARCHAR2(1) | Yes |  |  |
| 14 | AUTHORIZE_DATE | DATE | Yes |  |  |

## Primary Key

**DONOR_LETTERS_PK**: `DONOR_ID, CHAPTER_ID, LETTER_SEQ_NO`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_LETTERS_PK | NORMAL | UNIQUE | DONOR_ID, CHAPTER_ID, LETTER_SEQ_NO | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_LETTERS_BI|DONOR_LETTERS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
