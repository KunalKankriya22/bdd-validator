---
tags:
  - table
  - DONSYS
---
# DONOR_CONSENTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 9909
**Last Analyzed**: 2025-11-21 04:00:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | COLL_DATE | DATE | No |  |  |
| 5 | LETTER_CODE | VARCHAR2(10) | No |  |  |
| 6 | LETTER_ID | VARCHAR2(10) | No |  |  |
| 7 | CONSENT_STATUS | VARCHAR2(1) | No |  |  |
| 8 | VERSION_NO | NUMBER(2) | No |  |  |
| 9 | WITNESS | VARCHAR2(30) | Yes |  |  |
| 10 | SIGNATURE_DATE | DATE | Yes |  |  |
| 11 | MANUAL_SIGNATURE_DATE | DATE | Yes |  |  |
| 12 | DONOR_SIGNATURE | BLOB | Yes |  |  |
| 13 | WITNESS_SIGNATURE | BLOB | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 15 | INSERT_DATE | DATE | No |  |  |
| 16 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 17 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_CONSENTS_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_CONSENTS_BD|DONOR_CONSENTS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_CONSENTS_BI|DONOR_CONSENTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_CONSENTS_BU|DONOR_CONSENTS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| DONOR_SIGNATURE | SYS_LOB0000076579C00012$$ | BC_DATA | YES | NO |
| WITNESS_SIGNATURE | SYS_LOB0000076579C00013$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| GENBDR | PACKAGE | DONSYS |
