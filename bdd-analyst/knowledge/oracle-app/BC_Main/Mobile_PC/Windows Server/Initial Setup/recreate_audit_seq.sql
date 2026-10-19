spool C:\bcmpc\replication\log\recreate_audit_seq.log

ALTER SEQUENCE DBADMN.AUDIT_SEQ RESTART START WITH &ln_audit_seq;

UPDATE laptop_id_details SET download_error_flag ='N';             
commit;
exit;

