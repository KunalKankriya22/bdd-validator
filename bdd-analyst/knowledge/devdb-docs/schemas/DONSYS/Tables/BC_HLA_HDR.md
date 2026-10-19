---
tags:
  - table
  - DONSYS
---
# BC_HLA_HDR

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:10:39
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | DONOR_DATE | VARCHAR2(18) | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 5 | ACCESSION_ID | VARCHAR2(30) | Yes |  |  |
| 6 | TYPING_DATE | DATE | Yes |  |  |
| 7 | NUM_TISSUETYPE | VARCHAR2(16) | Yes |  |  |
| 8 | SEC_TYPING_DATE | DATE | Yes |  |  |
| 9 | REC_KEY | NUMBER | No |  |  |
| 10 | VRFY_USER | VARCHAR2(6) | Yes |  |  |
| 11 | VRFY_DATS | DATE | Yes |  |  |
| 12 | VRFY_IND | VARCHAR2(1) | Yes |  |  |
| 13 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 14 | INSERT_DATS | DATE | Yes |  |  |
| 15 | AUDIT_KEY | NUMBER | Yes |  |  |
| 16 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**BC_HLA_HDR_PK**: `REC_KEY`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| BC_HLA_HDR_PK | NORMAL | UNIQUE | REC_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
