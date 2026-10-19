---
module: Donor
sub_module: "Blood Drives & Scheduling"
title: "dpwhldrn"
mnemonic: dpwhldrn
tags:
  - screen
  - donor
  - blood-drives-and-scheduling
---

# dpwhldrn — dpwhldrn

**Module:** [[Donor]] > [[Blood Drives & Scheduling]]

## Database Tables

- [[DONATIONS]]
- [[select drive_id]]
- [[don.chapter_id]]
- [[don.donor_id]]
- [[initcap(last_name) last_name]]
- [[initcap(first_name) first_name]]
- [[gender from donations don]]
- [[donors d where don.donor_id = d.donor_id and don.donor_id is not null]]
