update donations set credit_count=0 where procedure_code in ('WB','99');
update donations set credit_count=1 where procedure_code in ('AP','PP');
update donations set actual_rbc_loss=85 , actual_plasma_loss=350 where
donation_type='AL' and procedure_code='AP' and unit_id is not null;
