---
tags:
  - package
  - DONSYS
---
# UPDATE_DST

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Package Specification

```plsql
PACKAGE              "UPDATE_DST"
/*******************************************************************************
* Package Name	:	update_dst.pkg                                             *
*                   This package will be schduled to run at specific interavls *
*                   update chapters table with DST specific timezone values    *
********************************************************************************
* Developed By	:	Arun	On	:	29 April 2011	Version	:	1.0 (Initial)  *
********************************************************************************
* Modification History                                                         *
*                                                                              *
* Modified by		On			IM No/Version	Remarks                        *
* ***************** *********** *************** ********************************
* 01 Arun       04/29/11  Initial Version
* 02 Ashok      03/10/16  IM 208 -- valid_dst_cur cursor query modified.       *
* 03 Ashok      03/14/16  IM 215 --     *
*                                                                              *
*******************************************************************************/
IS

	PROCEDURE UPDATE_DST;
END;

```
