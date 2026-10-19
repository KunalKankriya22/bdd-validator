-- Below Queries are for cleaning FasTrak old Tables
delete from  LTWEB.web_donor_responses where nvl(insert_date,sysdate-365) < sysdate-7;
delete from  LTWEB.web_donor_responses_hdr where nvl(insert_date,sysdate-365) < sysdate-7;
Commit;
exit;

