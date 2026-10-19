set serveroutput on
set timing on
BEGIN
    lt_process_staging.insert_mobile_upload_files('&1'); 
END;
/
