select donor_id, substr(last_name,1,15),substr(first_name,1,15),
 date_of_birth,ssn from donors where donor_id in
 (select donor_id from mw_dup_donors where
batch_id='&batch')
/
