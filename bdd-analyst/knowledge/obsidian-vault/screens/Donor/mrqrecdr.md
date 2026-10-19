---
module: Donor
sub_module: "Reports & Menu Management"
title: "Checklist Notes."
mnemonic: mrqrecdr
tags:
  - screen
  - donor
  - reports-and-menu-management
---

# mrqrecdr — Checklist Notes.

**Module:** [[Donor]] > [[Reports & Menu Management]]

## Database Tables

- [[Select d.chapter_id]]
- [[d.recruiter_id]]
- [[d.drive_id]]
- [[&amp;#10;       d.drive_date]]
- [[d.drive_type]]
- [[d.status]]
- [[d.insert_date]]
- [[&amp;#10;       Initcap(substr( s.name]]
- [[30 )) spon_name]]
- [[&amp;#10;       Initcap(rtrim(e.last_name)]]
- [[rtrim(e.first_name) ) recruiter_name]]
- [[&amp;#10;       d.projected_show]]
- [[d.projected_draw]]
- [[d.event_id&amp;#10; from  drives d]]
- [[drive_sponsors ds]]
- [[sponsors s]]
- [[&amp;#10;       employees e&amp;#10; where d.drive_id = ds.drive_id&amp;#10;   and ds.sponsor_id = s.sponsor_id &amp;#10;   and e.staff_no = d.recruiter_id&amp;#10;   and d.chapter_id = ds.chapter_id&amp;#10;   and d.chapter_id = s.chapter_id&amp;#10;   and d.chapter_id = e.chapter_id&amp;#10;]]

## Dropdown/LOV Sources
Values in dropdowns on this screen come from:

- [[DRIVES]]
- [[EMPLOYEES]]
- [[SPONSORS]]
- [[SYSTEM_USERS]]
- [[VALID_MASTER_CODES]]
- [[VALID_USER_PRIVS]]

## Opens/Navigates To

- [[mcimobdr]]
- [[mcqdrive]]
- [[mruhktml]]
