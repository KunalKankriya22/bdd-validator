LOAD DATA
INFILE '/home/donsys/conversion/data/table.500'
---APPEND
INTO TABLE mw_next_elig_date
( 
DONOR_ID        POSITION(1:10)       CHAR(10)  NULLIF (DONOR_ID = BLANKS),
NEXT_ELIG_DATE  POSITION(12:21)      DATE(10)   "MM-DD-YYYY"   
				     NULLIF (NEXT_ELIG_DATE = BLANKS)
)
