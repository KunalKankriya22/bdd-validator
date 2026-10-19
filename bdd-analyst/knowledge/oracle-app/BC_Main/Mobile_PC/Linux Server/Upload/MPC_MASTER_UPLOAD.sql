SET SERVEROUTPUT ON

SET TIMING ON
/*
  Date        Ver Changes
  07-22-2021  02  Insert to mobile_upload_control added.
  07-27-2021  03  check_upload_job_queue added.  
  08-31-2021  04  tracing turned off. No functional changes.
  03-07-2022  05  Submit time added to mobile_upload_control and completed tables.
  03-08-2022  06  Job status changes. 
  01-24-2023  07  Drive ID parameter added to onsite_processor.
  02-20-2023  08  EMAIL_UTIL.pkg call added after archive_job.
  02-24-2023  09  Store end_time as Chapter time in mobile_upload_completed table.
*/

DECLARE
    CURSOR queued_jobs_cur IS
    SELECT
        upload_id,
        laptop_id,
        extract_seq,
        drive_id
    FROM
        mobile_upload_control
    WHERE
        end_time IS NULL
        AND proc_status = 'Q'
    ORDER BY
        submit_time ASC;
        
    lc_pkg_name VARCHAR2(30) := 'LT_DONOR_API';
    lc_fcn_name VARCHAR2(30) := 'ONSITE_PROCESSOR';
    l_flag_yn   VARCHAR2(1);
    l_lock_min  NUMBER;
    lv_user     VARCHAR2(30) := 'DONSYS';
    nCnt        NUMBER;

    PROCEDURE check_upload_job_queue IS
        CURSOR laptop_extracts_cur IS
        SELECT
            upload_id
        FROM
            laptop_extracts
        ORDER BY
            insert_date ASC;

        lv_status VARCHAR2(2000);
    BEGIN
        FOR rec IN laptop_extracts_cur LOOP
            BEGIN
                lt_process_staging.process_upload_job_queue(rec.upload_id, lv_status);
                dbms_output.put_line(rec.upload_id
                                     || '-'
                                     || lv_status);
            EXCEPTION
                WHEN OTHERS THEN
                    dbms_output.put_line(rec.upload_id
                                         || '-'
                                         || substr(sqlerrm, 1, 1000));
            END;
        END LOOP;
    END check_upload_job_queue;

    PROCEDURE update_job_status(upload_id_in IN VARCHAR2, status_in IN VARCHAR2) IS
        PRAGMA AUTONOMOUS_TRANSACTION;
    BEGIN
        UPDATE mobile_upload_control
          SET proc_status = status_in
         WHERE upload_id = upload_id_in;
         
        COMMIT;
    END update_job_status;

    PROCEDURE archive_job(upload_id_in IN VARCHAR2) IS
    BEGIN
        INSERT INTO mobile_upload_completed (
            laptop_id,
            chapter_id,
            submit_time,
            start_time, -- V05
            end_time,
            proc_status,
            upload_id,
            drive_id,
            extract_seq
        )
            SELECT
                laptop_id,
                chapter_id,
                submit_time,
                start_time, -- V05
                lifetrack_timezone_convert.get_local_time(chapter_id, SYSDATE),
                'C',
                upload_id,
                drive_id,
                extract_seq
            FROM
                mobile_upload_control
            WHERE
                upload_id = upload_id_in;    
        
        DELETE FROM mobile_upload_control
        WHERE
            upload_id = upload_id_in;
    END archive_job;
BEGIN
    check_upload_job_queue;
    
    SELECT
        COUNT(1)
    INTO ncnt
    FROM
        mobile_upload_control
    WHERE
        end_time IS NULL
        AND proc_status = 'Q'; -- In queue jobs only

    IF ncnt = 0 THEN
        RETURN;
    END IF;
    
    don_std.check_object_lock(  p_pkg_name => lc_pkg_name, 
                                p_fcn_name => lc_fcn_name, 
                                p_flag_yn  => l_flag_yn, 
                                p_lock_min => l_lock_min);

    IF l_flag_yn = 'Y' THEN
        IF l_lock_min > 60 THEN
            don_std.object_lock_unlock( p_pkg_name  => lc_pkg_name,
                                        p_fcn_name  => lc_fcn_name,
                                        p_user      => NULL,
                                        p_flag_ul   => 'U');
        ELSE
            dbms_output.put_line(lc_pkg_name
                                 || '.'
                                 || lc_fcn_name
                                 || 'is working on another upload job.');
            RETURN;
        END IF;
    END IF;
    

    don_std.object_lock_unlock( p_pkg_name  => lc_pkg_name, 
                                p_fcn_name  => lc_fcn_name, 
                                p_user      => lv_user, 
                                p_flag_ul   => 'L');
    
    
    FOR queued_jobs_rec IN queued_jobs_cur
    LOOP
        dbms_output.put_line('Processing ' || queued_jobs_rec.upload_id);
        BEGIN
            /*
            -- Added by Ashok for tracing
            EXECUTE IMMEDIATE 'alter session set tracefile_identifier=''MPC_'
                              || queued_jobs_rec.upload_id
                              || '''';
            dbms_session.set_sql_trace(true);
            ---
            */
            
            -- Check for previous extract sequence jobs if available.
            IF queued_jobs_rec.extract_seq > 1 THEN    
                -- Check if previous sequence is completed.
                SELECT
                    COUNT(1)
                INTO nCnt
                FROM
                    mobile_upload_completed
                WHERE
                    drive_id = queued_jobs_rec.drive_id
                    AND extract_seq = queued_jobs_rec.extract_seq - 1;
    
    
                IF nCnt = 0 THEN
                    CONTINUE; -- Skip processing by going to next record..
                END IF;            
            END IF; 
            
            update_job_status(queued_jobs_rec.upload_id, 'P'); -- in progress
            
            lt_donor_api.enable_debug;
            lt_donor_api.onsite_processor(  'LAP', 
                                            queued_jobs_rec.upload_id,
                                            queued_jobs_rec.drive_id);  
            
            /*    
            -- Added by Ashok for tracing        
            dbms_session.set_sql_trace(false);
            ---        
            */
            
            archive_job(queued_jobs_rec.upload_id); 
    
            COMMIT;
			
			EMAIL_UTIL.SEND_MAIN_UPLOAD_STATUS(queued_jobs_rec.upload_id); -- V08
            
        EXCEPTION
            WHEN OTHERS THEN
                dbms_output.put_line(dbms_utility.format_error_backtrace);
                update_job_status(queued_jobs_rec.upload_id, 'E');
                COMMIT;
                EXIT;
        END;

    END LOOP;

    don_std.object_lock_unlock( p_pkg_name  => lc_pkg_name,
                                p_fcn_name  => lc_fcn_name,
                                p_user      => NULL,
                                p_flag_ul   => 'U');

EXCEPTION
    WHEN OTHERS THEN
        dbms_output.put_line(substr(sqlerrm, 1, 1000));
        don_std.object_lock_unlock( p_pkg_name  => lc_pkg_name,
                                    p_fcn_name  => lc_fcn_name,
                                    p_user      => NULL,
                                    p_flag_ul   => 'U');
        
END;
/