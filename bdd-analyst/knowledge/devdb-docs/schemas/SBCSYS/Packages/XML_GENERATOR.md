---
tags:
  - package
  - SBCSYS
---
# XML_GENERATOR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "XML_GENERATOR" AS

/*****************************************************************************
Developed By : Basker Edwin
Create Date  : 06.10.2002
Purpose      : This procedure will create an XML file with the elements and
	       attributes as per the given DTD(Document Type Definition)
	       The DTD name is U9000.dtd. The Generated file will be
	       loaded onto ZLB's website

Reqd setup   :Define the Error log and XML file creation dirs in the master.
Date Mod     :01.07.2004
Version      :2.03.08
             : 02 (Not to look at the code schme for non alpha numeric sites)
		   3.2.0 release
             : 03 Change the product type to product code - LT 3.3.0 release

**************************************************************************** */

   PROCEDURE GEN_EDN_XML (pl_ship_no in varchar2,pl_Status out varchar2);

END XML_GENERATOR;

```
