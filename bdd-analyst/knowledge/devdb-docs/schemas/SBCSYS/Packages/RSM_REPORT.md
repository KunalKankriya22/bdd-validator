---
tags:
  - package
  - SBCSYS
---
# RSM_REPORT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE rsm_report IS
    /*
    Created By : Edwin
    Created On : 02/20/2008
    Purpose    : To populate the RSM table AND the RSM report will access the
    data
    Version    : 04 (FOr ABO, ABOFWD should not take the RMAP test id
    to get the value FROM the master code: 03/27/08)
    Version    : 05 Test result interpretation-06/03/08
    Version    : 06 Report did not run for individual units, modIFied the unit
    cursor to include the rpt_parm_SELECT table: 08/25/08
    Version    :07 to include the contract id in the unit cursor
    Version    :08 [Rel:1.2.0] deleting the rsm_report_details table
    before populating records [02/11/2010]
    ModIFied By: Edwin B
    Version    :09 Changed SQL statements to look only for the last
    six characters of the user name IF the user name
    has "OPS$" attached in the BEGINning.
    ModIFied by Kishore on 11/29/2010.
    Version    :10 Added "report_name" clause to all the SELECT statements
    used to retrieve the report parameters FROM
    RPT_PARM_SELECT table.
    ModIFied by Kishore on 04/07/2011.
    Version    :11 Replaced all occurrences of "user" with
    "LT_USER_SESSION.get_userid".
    ModIFied by Kishore on 05/16/2011.
    Version    :12 SCR 18938  -- Time zone changes applied.
    Version    :13 LT2018 - valid_interdictions to valid_interdictions_lab tabel.
    ---------------------------------------------------------------------------------
    Reset for LT2018 R2
    Version    :01 LT2018 - valid_interdictions to valid_interdictions_lab tabel.
    Version    :02 LT2018 R2 MLT-227 Mary Ann Ansell on 06/25/2018
    - change from hard-coded chemistry value of 'CHOL' to use
    value from master_codes table, using new code_type 'CHTST'
    Version    :03 LT2018 R2 MLT-440 Mary Ann Ansell on 07/12/2018
	   - comment out chapter_id and coll_date from valid_interdictions query
	Version    :04 MLT 2405 (RGT_RESULTS_MATRIX - made institutional) search for V04
    Version   :05; 05/03/2022 -- POP_RSM_TABLE parameter removed and instead using it from rpt_parm_select table.
    Version   :06; 05/20/2022 -- RSM_REPORT_STAGE table seq. updaed.
    Version   :07; 08/18/2022 -- TMAP query added. -- MLT-5422 
    Version   :08; 02/09/2023 -- V08 (look for terminated tests as well from contract_tests table) -- MLT 5809
    Version   :09; 03/30/2023 -- V09 (DENSE_RANK used instead of ROW_NUMBER) - subquery returns more number of rows issue. MLT-5856
    Version   :10; 04/21/2023 -- V10 (MLT-5980)
    Version   :11; 05/02/2023 -- V11 (MLT-5997)- do not pull another chapter tests (for same unit in multiple chapters)
                                     (MLT-5998)
    */

    PROCEDURE pop_rsm_table (
        pl_result_parm_id IN VARCHAR2,
        pl_chapter_id     IN VARCHAR2,
        pl_report_id      IN VARCHAR2
    );

END rsm_report;


```
