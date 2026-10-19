
SET DEFINE OFF;

DELETE FROM valid_errors WHERE error_code IN ('9400', '9401', '9402', '9403', '9404');

Insert into VALID_ERRORS (ERROR_CODE,ERROR_TYPE,ERROR,AUDIT_FLAG) values ('9400','E','Q&C User ID is not configured in BloodCenters','N');
Insert into VALID_ERRORS (ERROR_CODE,ERROR_TYPE,ERROR,AUDIT_FLAG) values ('9401','E','Master code not defined for KTRAK Code Type','N');
Insert into VALID_ERRORS (ERROR_CODE,ERROR_TYPE,ERROR,AUDIT_FLAG) values ('9402','E','Q&C Application is not available','N');
Insert into VALID_ERRORS (ERROR_CODE,ERROR_TYPE,ERROR,AUDIT_FLAG) values ('9403','E','You do not have permission to access Quality and Compliance.','N');
Insert into VALID_ERRORS (ERROR_CODE,ERROR_TYPE,ERROR,AUDIT_FLAG) values ('9404','E','Quality and Compliance Error: ','N');

COMMIT;