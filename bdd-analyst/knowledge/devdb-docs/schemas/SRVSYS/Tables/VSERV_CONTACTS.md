---
tags:
  - table
  - SRVSYS
---
# VSERV_CONTACTS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2126
**Last Analyzed**: 2026-04-17 03:00:13
**Partitioned**: NO

> [!quote] Created from Entity CONTACT by WADLEY on 01-JUL-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CUSTOMER_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | LAST_NAME | VARCHAR2(50) | No |  |  |
| 4 | FIRST_NAME | VARCHAR2(50) | No |  |  |
| 5 | CONTACT_TYPE | VARCHAR2(1) | No |  |  |
| 6 | INST_ID | VARCHAR2(4) | Yes |  |  |
| 7 | SALUTATION | VARCHAR2(10) | Yes |  |  |
| 8 | TITLE | VARCHAR2(10) | Yes |  |  |
| 9 | DAY_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 10 | NIGHT_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 11 | FAX_NO | VARCHAR2(20) | Yes |  |  |
| 12 | TELEX_NO | VARCHAR2(20) | Yes |  |  |
| 13 | EFF_DATE | DATE | No |  |  |
| 14 | TERM_DATE | DATE | Yes |  |  |
| 15 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VSERV_CONTACTS_IDX_1 | NORMAL | UNIQUE | CUSTOMER_ID, CHAPTER_ID, FIRST_NAME, LAST_NAME | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/VSERV_CONTACTS_BEFORE_DEL|VSERV_CONTACTS_BEFORE_DEL]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_CONTACTS_BEFORE_INSERT|VSERV_CONTACTS_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/VSERV_CONTACTS_BEFORE_UP|VSERV_CONTACTS_BEFORE_UP]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
