LOAD DATA
INFILE '/home/donsys/conversion/data/table.425'
--APPEND
INTO TABLE mw_donation_att_inter
(
 UNIT_ID          POSITION(01:15)    CHAR(15)  NULLIF (UNIT_ID = BLANKS),
 COLL_DATE        POSITION(16:23)    DATE(8)    "MMDDYYYY"
                                              NULLIF (COLL_DATE = BLANKS),
 CHAPTER_ID       POSITION(24:27)    CHAR(4)  NULLIF (CHAPTER_ID = BLANKS),
 CLASS            POSITION(28:28)    CHAR(1)  NULLIF (CLASS = BLANKS),
 TYPE             POSITION(29:33)    CHAR(5)  NULLIF (TYPE = BLANKS),
 CODE             POSITION(34:38)    CHAR(5)  NULLIF (CODE = BLANKS),
 EFF_DATE         POSITION(39:46)    DATE(8)    "MMDDYYYY"
                                              NULLIF (EFF_DATE = BLANKS),
 TERM_DATE        POSITION(47:54)    DATE(8)    "MMDDYYYY"
                                              NULLIF (TERM_DATE = BLANKS),
 USER_ID         POSITION(55:64) CHAR(10) NULLIF (USER_ID = BLANKS),
 RECORD_DATE     POSITION(65:72) DATE(8) "MMDDYYYY" 
                                         NULLIF (RECORD_DATE=BLANKS) 
)
