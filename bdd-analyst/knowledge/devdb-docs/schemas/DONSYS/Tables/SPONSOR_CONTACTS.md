---
tags:
  - table
  - DONSYS
---
# SPONSOR_CONTACTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 13375
**Last Analyzed**: 2026-03-05 04:00:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SPONSOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CONTACT_ID | VARCHAR2(10) | No |  |  |
| 4 | CONTACT_TYPE | VARCHAR2(5) | No |  |  |
| 5 | ADDRESS_ID | VARCHAR2(10) | No |  |  |
| 6 | LAST_NAME | VARCHAR2(30) | No |  |  |
| 7 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 8 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 9 | SALUTATION | VARCHAR2(5) | Yes |  |  |
| 10 | TITLE | VARCHAR2(25) | Yes |  |  |
| 11 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 12 | EFF_DATE | DATE | No |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 15 | INSERT_DATE | DATE | No |  |  |
| 16 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 17 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

**SPONSOR_CONTACTS_PK**: `SPONSOR_ID, CHAPTER_ID, CONTACT_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SPONSOR_CONTACTS_IDX2 | NORMAL | NONUNIQUE | LAST_NAME, FIRST_NAME | VALID |
| SPONSOR_CONTACTS_PK | NORMAL | UNIQUE | SPONSOR_ID, CHAPTER_ID, CONTACT_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/SPONSOR_CONTACTS_BI|SPONSOR_CONTACTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
