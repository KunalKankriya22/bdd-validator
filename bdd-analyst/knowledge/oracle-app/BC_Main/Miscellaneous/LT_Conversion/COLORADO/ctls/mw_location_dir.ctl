LOAD DATA
INFILE '/home/donsys/conversion/data/table.4316'
--APPEND
INTO TABLE mw_location_dir
(
 LOCATION_ID            POSITION(1:10)          CHAR(10)  NULLIF (LOCATION_ID = BLANKS),
 CHAPTER_ID             POSITION(11:14)         CHAR(4)  NULLIF (CHAPTER_ID = BLANKS),
 DIRECTIONS             POSITION(15:514)         CHAR(5)  NULLIF (DIRECTIONS = BLANKS)
)
