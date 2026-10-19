update convert_products a set shipped_to='LMH' where
product_code='FFP' and shipped_to is null and
exists (
select 'x' from convert_products b where 
 a.unit_id=b.unit_id and product_code='TFF' and shipped_to='LMH')
/
update convert_products a set shipped_to='LMH' where
 product_code='CPP' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in ('TCP') and
 shipped_to is not null)
/
update convert_products a set shipped_to='LMH' where
 product_code='FF1' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in('TF1','TFF') and
 shipped_to='LMH')
/
update convert_products a set shipped_to='LMH' where
 product_code='LRC' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in ('LRC','SWR','LRI') and
 shipped_to is not null)
/
update convert_products a set shipped_to='LMH' where
 product_code='DIR' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in ('PRC') and
 shipped_to is not null)
/
update convert_products a set shipped_to='LMH' where
 product_code='PCN' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in ('PCI','PPL') and
 shipped_to is not null)
/
update convert_products a set shipped_to='LMH' where
 product_code='PHP' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in ('PHP') and
 shipped_to is not null);
/
update convert_products a set shipped_to='LMH' where
 product_code='LWP' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in ('LWP') and
 shipped_to is not null);
/
update convert_products a set shipped_to='LMH' where
 product_code='AWX' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in ('ARX') and
 shipped_to is not null)
/

update convert_products a set shipped_to='MOD' where
 product_code='PRC' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in ('LRC') and
 shipped_to is not null)
/
update convert_products a set shipped_to='MOD' where
 product_code='TFF' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in ('REV') and
 shipped_to is not null)
/
update convert_products a set shipped_to='MOD' where
 product_code='FFP' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in ('TFF','REV') and
 shipped_to is not null)
/
update convert_products a set shipped_to='MOD' where
 product_code='FFP' and shipped_to is null and
 exists
  (select 'x' from convert_products b where
 a.unit_id=b.unit_id and product_code in ('REV') and
 shipped_to is null)
/
update convert_products set shipped_to='MOD' where
shipped_to is null and product_code='TFF'
/
update convert_products set shipped_to='LMH' where shipped_to='HHH'
/

