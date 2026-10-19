create table unit_prod_error_log
(UNIT_ID           VARCHAR2(15),
PRODUCT_CODE       VARCHAR2(8),
DATA_CODE          VARCHAR2(15),
ERROR_LOG          VARCHAR2(240),
SOURCE_ID          VARCHAR2(50),
INSERT_DATE        DATE,
INSERT_USER        VARCHAR2(30));