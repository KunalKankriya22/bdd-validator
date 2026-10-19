-- Below Queries are for cleaning EMF Archive Tables data
delete from  UTIL.EMF_staging_data_arch where nvl(insert_date,sysdate-365) < sysdate-1;
Commit;
exit;

