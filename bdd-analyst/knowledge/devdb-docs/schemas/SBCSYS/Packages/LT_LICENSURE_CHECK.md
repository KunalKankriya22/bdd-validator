---
tags:
  - package
  - SBCSYS
---
# LT_LICENSURE_CHECK

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE lt_licensure_check
AS
/******************************************************************************
Program Name	:	LT_LICENSURE_CHECK

Description	:	ThIS package contain common process routines related to
					LIFetrack Applications.

Created by	:	Arun Samuel

Created on	:	March 24, 2011

Version		:	1.0 (Initial)
*******************************************************************************
ModIFied by	Ver		On			IM 		Remarks
*******************************************************************************

Arun S		2		03/29/11	--		Function IS_product_licensed was NOT
										RETURNing a value.  Fixed.

Arun S		3		03/30/11	--		Logic in Function IS_product_licensed
										was NOT having correct logic.  Fixed.

Arun S		4		03/30/11	--		ModIFied to cater for requirements in
										Oracle Forms Screens.

Arun S		5		04/14/11	--		ModIFied to add chapter_id check against
										table valid_prodequip_cgmp.

Arun S		6		04/27/11	5336	ModIFied EXCEPTION section to RETURN
										FALSE in case NO_DATA_FOUND.

Arun S		7		04/27/11	5429	ModIFied to hANDle PHERESIS products
                                        (Added function out_of_state_allowed_isbt).
Edwin       08      04/28/12            If the product is not licensed the product
                                            is no linced if the multi chapter is Y

Ashok       09      09/21/2012  --     SCR 19597; To handle new field - imp_license_flag;
                                        is_product_licensed routine modified.
                                        out_of_state_allowed_isbt modifed.

Ashok      10       09/25/2012  IM9141 --SUBSTR function added for product code in IS_LICENSED_PRODUCT routine.

Ashok	   11	      10/17/2012  IM9179 -- timezone conversion applied.

Ashok	   12	   10/30/2014  SCR 20830, IM 10078 -- IS_product_licensed routine modified

Ashok    13       02/11/2015  IM 10380 - 'POOL' contract ID case added.

Ashok    14       04/10/2015  SCR 21363 (ported from LT2012R3SP3) -- IM 10457 (POOL Contract Scenario - check in licensed_products before
                              checking in valid_products table for license flag (OSOK_FLAG).

Ashok    15       04/14/2015  -- IM 3; 03/14/2015 lic_prod_cur query made timezone aware.

Ashok    16       06/03/2015  -- IM 59; Search for IM 59 in code
Edwin    17       02/23/2016   -- IM:199 2015 SP1
----Renumbering started for the 2018 version --------------------------------

Edwin   01  base 2018 version (which is similar to the version 17 above)

Edwin   02   03/04/19   --  MLT:1854

******************************************************************************/

	g_multi_chapter	CHAR(1)	:=	'N';
	g_err_txt		VARCHAR2(1024);

	FUNCTION IS_product_licensed(
					i_chapter_id	VARCHAR2
					,i_site_id		VARCHAR2
					,i_drive_id		VARCHAR2
					,i_product_code	VARCHAR2
					,i_unit_id		VARCHAR2
					,i_code_scheme	VARCHAR2
					)
	RETURN	BOOLEAN
	;

	FUNCTION IS_multi_chapter
	RETURN CHAR
	;

END lt_licensure_check;
```
