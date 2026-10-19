LOAD DATA
INFILE '/home/donsys/conversion/data/table.426'
APPEND
INTO TABLE mw_donation_comments
(
 UNIT_ID                POSITION(1:15)          CHAR  NULLIF (UNIT_ID = BLANKS),
 COLL_DATE              POSITION(16:23)         DATE(8) "MMDDYYYY"  NULLIF (COLL_DATE = BLANKS),
 CHAPTER_ID             POSITION(24:27)         CHAR  NULLIF (CHAPTER_ID = BLANKS),
 SEQ                      POSITION(28:31)         INTEGER EXTERNAL  NULLIF (SEQ = BLANKS) ,
 COMMENTS               POSITION(32:231)        CHAR  NULLIF (COMMENTS = BLANKS) 
)
