select distinct donor_id, inter_code from  donor_interdictions
    where 
       donor_id in (select donor_id from donations where 
                     donation_type='TH' and unit_id is not null)
        and (( inter_code in (select inter_code from valid_interdictions where
                        period_type like 'P%' and sysdate between
                       eff_date and nvl(term_date, sysdate + 10))
        and release_date is null)) 
