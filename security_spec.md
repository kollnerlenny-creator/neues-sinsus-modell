# Security Spec: SINUS 2035 (Live-Umfrage & Admin-CMS)

## Data Invariants
1. No PII (email, name, phone, IP, UID) is stored on `/surveys/{surveyCode}`, `/surveys/{surveyCode}/responses/{responseId}`, or `/siteContent/{sectionId}`.
2. Top-level `/surveys`, `/siteContent`, and `/admins` cannot be listed (`allow list: if false;`).
3. Every response in `/surveys/{surveyCode}/responses/{responseId}` requires an existing `active` parent `/surveys/{surveyCode}` document (Master Gate).
4. `code == surveyCode` on `SurveySession`, `surveyCode == surveyCode && clientId == responseId` on `SurveyResponse`, and `sectionId == sectionId` on `SiteContent` documents.
5. `uX`, `uY`, `uZ` are strictly bounded numbers `[0, 100]`, `milieuId` is restricted to the 6 valid 2035 milieu IDs, and `createdAt == request.time`.
6. `/siteContent/{sectionId}` documents are strictly bounded to the 7 valid section IDs (`meta`, `milieus_2035`, `milieus_2026`, `axes_rifts`, `transformation`, `distribution`, `self_test`), publicly readable via `allow get`, and writable (`create`, `update`, `delete`) exclusively by a verified Admin (`request.auth.token.email_verified == true && request.auth.token.email in ['m91681001@gmail.com', 'lenny.koellner@gmail.com']` or an existing `/admins/{uid}` record).
7. Every `/siteContent/{sectionId}` write validates `updatedBy == request.auth.uid`, `updatedAt == request.time`, exact allowed keys (`hasAll` + `hasOnly`), string `.size()` limits, bounded array sizes with first-element type checks, and immutable `sectionId` on update.

## Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated `create` or `update` on `/siteContent/meta`.
2. Signed-in non-admin user (`other@example.com`, `email_verified: true`) attempting `update` on `/siteContent/milieus_2035`.
3. Spoofed email attack (`m91681001@gmail.com` with `email_verified: false`) attempting `update` on `/siteContent/meta`.
4. Shadow/ghost key injection (`isAdminOverride: true`) in `/siteContent/meta` or `/surveys/{code}`.
5. Path poisoning (`sectionId` = `"invalid_section"` or >128 chars) on `/siteContent/{sectionId}`.
6. `sectionId` mismatch (`doc path` = `meta`, `data.sectionId` = `self_test`).
7. Identity spoofing (`updatedBy` != `request.auth.uid`) on `/siteContent/meta`.
8. Client-forged timestamp (`updatedAt` != `request.time`) on `/siteContent/meta`.
9. Oversized string DoS (>10 KB title) on `/siteContent/meta` (`heroHeadline`).
10. Unbounded array attack (`milieus` array with 50 elements instead of 6) on `/siteContent/milieus_2035`.
11. Self-promotion attack: signed-in user attempting `create` on `/admins/{uid}`.
12. Cross-survey scraping: `list` on `/surveys` or `get` on another user's `/admins/{otherUid}`.
