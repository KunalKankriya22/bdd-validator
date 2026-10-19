---
tags:
  - package
  - LTAPI
---
# LT_DONOR_API

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- LIFETRAK_DONOR (PACKAGE in LTAPI)
- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE         "LT_DONOR_API" IS
/* ************************************************************
  Name              : LT_DONOR_API.pkg
  Created By        : Basker Edwin
  Date Of Creation  : 08/01/09
  Purpose           : This is an interface between any external donor
                      registration module and LT onsite module
		      and LT.
		      The external application populats data in a set of
                      API tables, then the API reads the tables and populates
                      the corresponding LT tables

  Version History

  Date         Version        Description
  --------------------------------------------------------------------
  08/08/2009   01             Initial development -Edwin
  09/16/2009   02             Not updating the DONOR_INTERDICTIONS audit
  09/24/2009   03             The time portion was included in date fields
  05/17/2010   04             Added two more procedures for
                              DONATION_ATTRIBUTES and DONOR_COMMUNICATIONS tables.
  04/26/2011   05             Modified process_donor_employers and process_donor_addresses
                              added new column information.
  05/18/2011   06	            donor_employers - new column added;
  04/04/2012   07             IM: 7994; process_donor_addresses routine modified. (New columns added to donor_addresses table)
  05/23/2013   08             SCR 11942 - Donor Picture
  11/04/2013   09             Added process_donor_hhq_history routine.
  12/14/2013   10             process_donor_hhq_history routine modified.  process_donor_pictures modified.
  01/16/2014   11	            im: 9866 - Mobile PC Note ID in donations table is converted to LT Main Application Note ID.   Modiifed process_central_notes routine to add an update statement to 			      donations table.
  12/09/2015   12             SCR 177143 - Commiting transaction at a record by record level.
  07/13/2017   13             API Tables clean up added.
                              process_central_notes exception handling added.
                              api_upload_conversion modified to not allow duplicate inserts.
                              comment out the debug messages.
 10/02/2017    14             API_DONORS table structre modifed to add donor_weight.
                               Committing process modified from record by record to file by file. (08/09/17)
 09/19/2019    15             ONSITE_PROCESSOR modified to add new columns
 10/17/2019    16             ONSITE_PROCESSOR modified to add processing for 16 tables (8 transaction and 8 audit tables)
 01/30/2020    17             ONSITE_PROCESSOR modified - search for V17
 04/22/2020    18             1) PROCESS_DONOR_ADDRESSES routine modified to add intl_city_name.
                              2) New routine PROCESS_MATERIAL_VERIFICATION_DET added.
                              3) DONATION_INTERDICTIONS_AUDIT processing added.
                              4) Added device_status and device_comments column to DRIVCE_EQUIP_QC_DET table processing.
 05/11/2020     19             ALT_INTL_CITY_NAME added to process_donor_addresses
 05/12/2020     20             V20 -- Donor survey header issue for existing donors.
 06/10/2020     21            V21 -- Sync LT2015R2SP1 changes made for DoD.
                              -- added pf table changes
                              -- log file generated added.
 01/12/2021     22            process_drive_equip_qc_det modified to add GROUP_STATUS column map.
 02/09/2021     23            process_donors and process_Common_audit modified
 05/05/2021     24            upload_id condition missing for few api tables. ( V24 )
 05/11/2021     25            Using 'for update' on cursors to make sure that status updates are done only on records that were being processed
                              generate_new_id routine  added locally and made AUTONOMOUS to not interfere with current session.
 05/24/2021     26            Not a valid month issue  -- to_char missing on start_date and end_date field
 05/24/2021     27            Two new columns added for online_status table for survey
 07/24/2021     28            Performance issue - tuned all the sqls in the pkg.
 07/26/2021     29            Performance issue - Bulk processing added.
 08/04/2021     30            Bulk processing added to common audit.
                              log_by_unit added to log into mobile_upload_unit_log table.
 09/30/2022     31            process_common_audit_with_blob added to process donor_consents_adt table.                              
 01/24/2023     32            laptop_id, drive_id added to api_upload_conversion_table
                              DRIVE_ID parameter added to onsite_processor.
                              drive_id, laptop_id filter added to api_upload_conversion queries.
 01/31/2023     33            process inter_transactions, update_inter_trn_noteids added.     
 02/23/2023     34            log_by_unit routine updated.
 09/19/2023     35            PROCESS_POTENTIAL_DUPLICATES, 
                              PROCESS_GRADED_DONORS, 
                              PROCESS_GRADED_DONATIONS added.
                              SET_ID Changs.
 10/17/2023     36            MLT-6348 GENERATE_NEW_ID routine modified to use 'DP' 
                              instead of 'DUPLI' for Duplicate Set ID generation.
 03/05/2024     37            genotype column added to api_donors
                              transaction_id added to api_donor_survey_resp_hdr table.
 11/25/2024     38            MLT-7444, MLT-7387 (WLKOUT_BY, WLKOUT_DATE columns added to ONLINE_STATUS)                              
 **********************************************************************   */

  PROCEDURE write_to_screen(flag_in IN BOOLEAN);

  PROCEDURE enable_debug;

  PROCEDURE disable_debug;

  procedure rollback_and_exit(pl_err_msg  in varchar2);

  PROCEDURE onsite_processor (
        p_os_appl_name   IN  VARCHAR2,
        p_upload_id      IN  VARCHAR2,
        p_drive_id       IN  VARCHAR2,
        p_write_to_file  IN  VARCHAR2 DEFAULT 'Y'
    );

  p_ext_id        VARCHAR2(50);
  p_int_id        VARCHAR2(50);
  p_appl_name     VARCHAR2(20);
  p_err_msg       VARCHAR2(500);
  v_tb_id         VARCHAR2(64);
  v_chapter_id    VARCHAR2(5);
  x_lt_order_no   VARCHAR2(15);
  g_action_id     VARCHAR2(5);
  lt_order_status varchar2(5);
  pl_source_id    varchar2(30);
  p_status        varchar2(200);
  szDonor         varchar2(10);
  nConvCount      NUMBER := 0;
  szExtApplID     VARCHAR2(20);
    gc_logs_dir      CONSTANT VARCHAR2(20) := 'MPCLOGS';

  TYPE type_param_tbl is table of varchar2(100) index by binary_integer;
  ar LIFETRAK_DONOR.type_param_tbl;

  procedure insert_api_conv(P_EXT_TEMP_ID      in varchar2,
                            P_LIFETRAK_PERM_ID in varchar2,
                            P_ID_TYPE          in varchar2,
                            p_TEMP_AUDIT_KEY   in number,
                            P_PERM_AUDIT_KEY   in number,
                            P_SOURCE_ID        in varchar2,
                            P_INSERT_DATE      in date,
                            p_stat             out varchar2);
END LT_DONOR_API;







```
