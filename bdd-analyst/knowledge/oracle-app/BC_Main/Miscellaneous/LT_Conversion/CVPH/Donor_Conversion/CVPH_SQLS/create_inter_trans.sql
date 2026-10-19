DECLARE
   CURSOR get_data IS
      SELECT donor_id, chapter_id, inter_code, eff_date, inter_type,
             transaction_id, notification_status, note_id, release_user,
             release_date, unit_id, upm_disposition, last_modified_date,
             originated_from, reason_code, group_id, letter_seq_no,
             group_mode, term_date, term_reason, program_id, insert_date,
             insert_user
        FROM donor_interdictions
       WHERE program_id in
            ('427P','414L') and inter_code IN
          -- ('427C','414C','414CR','417CMV','427CMV','416C') and inter_code IN
             (SELECT valid_interdictions.inter_code
                FROM valid_interdictions
               WHERE sysdate BETWEEN valid_interdictions.eff_date
                         AND nvl(valid_interdictions.term_date, sysdate+1)
                 AND (upm_flag = 'Y' or allow_multiple = 'N')
                 AND inter_type not in ('DR','INFOR'));
BEGIN
   FOR a1 IN get_data LOOP
      INSERT INTO inter_transactions
        (SELECT a1.donor_id, a1.chapter_id, a1.inter_code, a1.eff_date,
                a1.inter_type, a1.transaction_id, a1.notification_status,
                a1.note_id, a1.release_user, a1.release_date, a1.unit_id,
                a1.upm_disposition, a1.last_modified_date, a1.originated_from,
                a1.reason_code, a1.group_id, a1.letter_seq_no, a1.group_mode,
                a1.term_date, a1.term_reason, a1.program_id,
                trunc(a1.insert_date), a1.insert_user
           FROM DUAL
          WHERE not exists
               (SELECT 'x' FROM inter_transactions it2
                 WHERE it2.donor_id = a1.donor_id
                   AND it2.chapter_id = a1.chapter_id
                   AND it2.inter_code = a1.inter_code
                   AND it2.eff_date = a1.eff_date));
      COMMIT;
   END LOOP;
   COMMIT;
END;
/
