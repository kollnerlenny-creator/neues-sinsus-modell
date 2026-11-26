# Security Spec: Live-Umfrage SINUS 2035

## Data Invariants
1. No PII (email, name, phone, IP, UID) is stored on `/surveys/{surveyCode}` or `/surveys/{surveyCode}/responses/{responseId}`.
2. Top-level `/surveys` cannot be enumerated (`allow list: if false;`); sessions are addressable only via their 6-character uppercase alphanumeric code (`^[A-Z0-9]{6}$`).
3. Every response in `/surveys/{surveyCode}/responses/{responseId}` requires an existing `active` parent `/surveys/{surveyCode}` document (Master Gate).
4. `code == surveyCode` on `SurveySession`, and `surveyCode == surveyCode && clientId == responseId` on `SurveyResponse`.
5. `uX`, `uY`, `uZ` are strictly bounded numbers `[0, 100]`, `milieuId` is restricted to the 6 valid 2035 milieu IDs, and `createdAt == request.time`.
6. Documents are append-only (`allow update, delete: if false;`) and reject shadow/ghost keys via `keys().hasAll(...) && keys().hasOnly(...)`.
7. `allow list` on `responses` never performs `get()`/`exists()` lookups and validates `resource.data.surveyCode == surveyCode`.
