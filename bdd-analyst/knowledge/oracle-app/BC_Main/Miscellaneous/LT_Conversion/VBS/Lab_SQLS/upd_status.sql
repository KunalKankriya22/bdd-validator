update convert_products set shipped_to='DISC',
expiry_date=nvl(expiry_date,coll_date+42) where
convert_flag='X' and shipped_to is null
/

