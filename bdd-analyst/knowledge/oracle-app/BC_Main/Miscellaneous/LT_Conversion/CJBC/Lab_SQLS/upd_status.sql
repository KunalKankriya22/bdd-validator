update convert_products set shipped_to='DISC',
expiry_date=nvl(expiry_date,coll_date+42) where
convert_flag='X'
/
update convert_products set component_mask='L',
shipped_to=null where convert_flag in ('A','B')
/
delete from convert_products where convert_flag in ('H','Q','P')
/

