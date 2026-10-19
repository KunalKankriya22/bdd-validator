---
tags:
  - package
  - SBCSYS
---
# NY_RSM_REPORT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE "NY_RSM_REPORT" IS
  /*
  Created By : Edwin
  Created On : 02/20/2008
  Purpose    : To populate the RSM table AND the RSM report will access the
               data

  Version    : 04 - (FOr ABO, ABOFWD should not take the RMAP test id
		     to get the value FROM the master code: 03/27/08)
  Version    : 05 - Test result interpretation-06/03/08
  Version    : 06 - Report did not run for individual units, modIFied the unit
	            cursor to include the rpt_parm_SELECT table: 08/25/08

  Version    :07 - to include the contract id in the unit cursor

  Version    :08 - [Rel:1.2.0] deleting the rsm_report_details table
		   before populating records [02/11/2010]

  ModIFied By: Edwin B

  Version    :09 - Changed SQL statements to look only for the last
		   six characters of the user name IF the user name
		   has "OPS$" attached in the BEGINning.
		   Modified by Kishore on 11/29/2010.

  Version    :10 - Added "report_name" clause to all the SELECT statements
		   used to retrieve the report parameters FROM
		   RPT_PARM_SELECT table.
		   Modified by Kishore on 04/07/2011.

  Version    :11 - Replaced all occurrences of "user" with
		   "LT_USER_SESSION.get_userid".
		   Modified by Kishore on 05/16/2011.

  Version    :12 - SCR 18938  -- Time zone changes applied.

  Version    :13 - SCR 20196 - Created a new package based off of the RSM_REPORT package.
                   The only difference is the addition of RECEIVED_DATE column in the
                   NY_RSM_REPORT_DETAILS (copied from the RSM_REPORT_DETAILS table)
                   and NY_RSM_REPORT_OTHERS (copied from the RSM_REPORT_DETAILS table)
                   tables.
                   Modified by Kishore on 06/27/2014.

  Version   :14; 09/19/2016 -- valid_interdictions to valid_interdictions_lab table.
  Version   :15; 05/03/2022 -- POP_RSM_TABLE parameter removed and instead using it from rpt_parm_select table.
  Version   :16; 05/20/2022 -- RSM_REPORT_STAGE table seq. updated.
  Version   :17; 02/09/2023 -- V17 (look for terminated tests as well from contract_tests table) -- MLT 5809
  Version   :18; 03/30/2023 -- V18 (DENSE_RANK used instead of ROW_NUMBER) - subquery returns more number of rows issue. MLT-5856
  Version   :19; 04/21/2023 -- V19 (MLT-5980)
  Version   :20; 05/02/2023 -- V20 (MLT-5997)- do not pull another chapter tests (for same unit in multiple chapters)
                                    (MLT-5998)
  */

    PROCEDURE pop_rsm_table (
        pl_result_parm_id IN VARCHAR2,
        pl_chapter_id     IN VARCHAR2,
        pl_report_id      IN VARCHAR2
    );

END ny_rsm_report;

```
