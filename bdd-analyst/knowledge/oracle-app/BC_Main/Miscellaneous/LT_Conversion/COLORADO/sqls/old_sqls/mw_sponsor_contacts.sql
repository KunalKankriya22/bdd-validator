insert into sponsor_contacts 
( SELECT SPONSOR_ID, CHAPTER_ID, CONTACT_ID, CONTACT_TYPE,
         rownum+10000, LAST_NAME, FIRST_NAME, MIDDLE_NAME,
         SALUTATIONS, TITLE, null, nvl(EFFECTIVE_DATE, '01-jan-1990'),
         TERM_DATE, 'CONVRT', sysdate, 'CNVRT'
  FROM mw_sponsor_contacts)
