---
tags:
  - table
  - SRVSYS
---
# PACKLIST_HEADER

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 92
**Last Analyzed**: 2025-10-05 23:02:42
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(30) | Yes |  |  |
| 2 | SHIPMENT_NO | VARCHAR2(20) | Yes |  |  |
| 3 | CHAPTERID | VARCHAR2(4) | Yes |  |  |
| 4 | CHAPTERNAME | VARCHAR2(24) | Yes |  |  |
| 5 | FICOMPANYNO | VARCHAR2(2) | Yes |  |  |
| 6 | CONSNAME | VARCHAR2(28) | Yes |  |  |
| 7 | PAYEENAME | VARCHAR2(22) | Yes |  |  |
| 8 | INSTADDRESS1 | VARCHAR2(50) | Yes |  |  |
| 9 | CONSADDRESS1 | VARCHAR2(50) | Yes |  |  |
| 10 | PAYEEADDRESS1 | VARCHAR2(50) | Yes |  |  |
| 11 | INSTADDRESS2 | VARCHAR2(50) | Yes |  |  |
| 12 | CONSADDRESS2 | VARCHAR2(50) | Yes |  |  |
| 13 | PAYEEADDRESS2 | VARCHAR2(50) | Yes |  |  |
| 14 | INSTCITYSTATEZIP | VARCHAR2(50) | Yes |  |  |
| 15 | CONSCITYSTATEZIP | VARCHAR2(50) | Yes |  |  |
| 16 | PAYEECITYSTATEZIP | VARCHAR2(50) | Yes |  |  |
| 17 | INSTCONTACT | VARCHAR2(25) | Yes |  |  |
| 18 | CONSCONTACT | VARCHAR2(25) | Yes |  |  |
| 19 | PAYEECONTACT | VARCHAR2(25) | Yes |  |  |
| 20 | INSTCONTACTPHONE | VARCHAR2(15) | Yes |  |  |
| 21 | CONSCONTACTPHONE | VARCHAR2(15) | Yes |  |  |
| 22 | PAYEECONTACTPHONE | VARCHAR2(20) | Yes |  |  |
| 23 | PONUMBER | VARCHAR2(20) | Yes |  |  |
| 24 | ARACCOUNT | VARCHAR2(25) | Yes |  |  |
| 25 | FIPRICESCHNO | VARCHAR2(5) | Yes |  |  |
| 26 | CARRIER | VARCHAR2(50) | Yes |  |  |
| 27 | TRACKNO | VARCHAR2(35) | Yes |  |  |
| 28 | FLIGHTNO | VARCHAR2(15) | Yes |  |  |
| 29 | ORDERNO | VARCHAR2(20) | Yes |  |  |
| 30 | INSERTUSERID | VARCHAR2(30) | Yes |  |  |
| 31 | INSERTDATE | VARCHAR2(20) | Yes |  |  |
| 32 | ORDEREDBY | VARCHAR2(30) | Yes |  |  |
| 33 | ORDEREDTYPE | VARCHAR2(30) | Yes |  |  |
| 34 | ORDEREDPRIORITY | VARCHAR2(20) | Yes |  |  |
| 35 | CODFLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
