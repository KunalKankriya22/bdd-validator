-- Below Queries are for cleaning EMF Archive Tables data
delete from  LTAPI.LT_DONOR_API_LOG where nvl(insert_date,sysdate-365) < sysdate-1;
Commit;
exit;

