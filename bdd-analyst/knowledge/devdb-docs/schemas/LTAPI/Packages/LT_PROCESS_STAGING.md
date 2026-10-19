---
tags:
  - package
  - LTAPI
---
# LT_PROCESS_STAGING

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- DBMS_UTILITY (SYNONYM in PUBLIC)
- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE               "LT_PROCESS_STAGING" IS
 /*-----------------------------------------------------------------------
   ** VER   DATE   BY       COMMENTS
   ** --------------------------------------------------------------------
   ** 1.0  041111  ASHOK  Initial version
   ** process_data_string - to decrypt data string and populate file name,
   ** table name in staging tables.
   **
   ** populate_api_tables - to populate api table from staging table.
   **
   ** 2.0  052913 Ashok  DECRYPT_IMAGE Routine added (SCR 11942);
   ** V03  072513 Ashok  Donor Consent Changes: reset counter.  search for V03;
   ** V04  022618 Ashok  LT2015R2SP1 (start_process added, upload_id and laptop_id added as parameters, populate_api_tables logic modified)
   ** V05  032118 Ashok  Logging messages modified - use 'LAP' instead of upload ID. And, add laptop ID to log messages.
   **                    V05 is a sync of LT2015R2SP1 v4 and v5 to LT_MAIN project.
   ** V06  06/17/2020 Ashok Added blob_to_file routine, insert_mobile_upload_files, start_script_upload, start_push_upload
   ** V07  07/23/2020 Ashok no archiving required for SCRIPT process, cron job takes care of archiving files.
   ** V08  07/21/2021 Enhancements - Use header file to fine tune upload process.
   ** V09  08/10/2021 api table names cached as 'API_'<table_name> does not work for audit tables.
   ** V10  01/24/2022 PUSH method changes. MLT 4827
   ** V11  02/18/2022 PUSH method changes. Zip file processing added. start_time populated in mobile_upload_control table.
   ** V12  03/07/2022 Job processing changes.
   ** V13  09/30/2022 DONOR_CONSENTS_ADT table images upload to api table issue.
           10/11/2022 (merged 2022 R3 V11)
   ** V14  12/21/2022 Decrypt routines updated (added decrypt and removed decrypt_image)
   ** V15  01/27/2023 Pipe symbol in address issue
   ** V16  02/16/2023 PUSH method - mobile_upload_files query --V16
   ** V17  02/20/2023 insert_log added; log_and_stop updated.
   ** V18  03/15/2023 sqlstmt variable size updated.
   **---------------------------------------------------------------------
  */
    PROCEDURE log_msg (
        str IN VARCHAR2
    );

    PROCEDURE staging_to_api_table (
        p_upload_id   IN   VARCHAR2,
        p_session_id  IN   VARCHAR2,
        p_status_yn   OUT  VARCHAR2,
        p_status_msg  OUT  VARCHAR2
    );

    PROCEDURE process_data_string (
        p_upload_id  IN   VARCHAR2,
        p_status     OUT  VARCHAR2
    );

    PROCEDURE populate_api_tables (
        p_laptop_id  IN   VARCHAR2,
        p_upload_id  IN   VARCHAR2,
        p_status     OUT  VARCHAR2
    );

    PROCEDURE add_error_log (
        pl_data_src  IN  VARCHAR2,
        pl_log_list  IN  dbms_utility.maxname_array,
        pl_pgm_id    IN  VARCHAR2
    );

    PROCEDURE add_error_log (
        pl_data_src  IN  VARCHAR2,
        pl_log_msg   IN  VARCHAR2,
        pl_pgm_id    IN  VARCHAR2
    );

    PROCEDURE decrypt_each_image (
        tabname_in   IN   VARCHAR2,
        colname_in   IN   VARCHAR2,
        auditkey_in  IN   VARCHAR2,
        status_out   OUT  VARCHAR2
    );

    PROCEDURE process_encrypted_images (
        enc_image_list_in  IN   dbms_utility.maxname_array,
        plstatus_out       OUT  VARCHAR2
    );

    --Writes the contents of a BLOB to a file.
    PROCEDURE blob_to_file (
        p_blob      IN   BLOB,
        p_dir       IN   VARCHAR2,
        p_filename  IN   VARCHAR2,
        p_status    OUT  VARCHAR2
    );

    PROCEDURE insert_mobile_upload_files (
        p_file_name IN VARCHAR2
    );

    PROCEDURE start_script_upload;

    PROCEDURE start_push_upload (
        p_upload_id  IN   VARCHAR2,
        p_status     OUT  VARCHAR2
    );

    PROCEDURE process_upload_job_queue (
        p_upload_id  IN   VARCHAR2,
        p_status     OUT  VARCHAR2
    );

    g_output dbms_utility.maxname_array;
    g_upload_id VARCHAR2(50);
    g_laptop_id VARCHAR2(20);
    gc_files_dir CONSTANT VARCHAR2(20) := 'MPCFILES';
    gc_arch_dir CONSTANT VARCHAR2(20) := 'MPCARCH';
    gc_logs_dir CONSTANT VARCHAR2(20) := 'MPCLOGS';
    gc_pkg CONSTANT VARCHAR2(50) := 'LT_PROCESS_STAGING';
END lt_process_staging;

```
