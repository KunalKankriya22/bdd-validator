LOAD DATA
INFILE '/home/donsys/conversion/zipcode/zip_code.data'
---APPEND
INTO TABLE city_state_zip
(
 CITY            POSITION(6:45)          CHAR  NULLIF (CITY = BLANKS),
 STATE           POSITION(46:47)         CHAR  NULLIF (STATE = BLANKS),
 ZIP             POSITION(48:52)         CHAR  NULLIF (ZIP   = BLANKS),
 county          POSITION(53:79)         CHAR  NULLIF (COUNTY = BLANKS)
)
