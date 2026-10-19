delete from from donor_interdictions a
where a.inter_code='P' and
exists (select 'x' from donor_interdictions where donor_id=a.donor_id and
         inter_code='PD')
/
update donor_interdictions set term_date=null where
inter_code like '%PD% and term_date is not null
/
 

