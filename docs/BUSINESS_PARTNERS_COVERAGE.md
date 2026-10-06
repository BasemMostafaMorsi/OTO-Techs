# Business Partners — coverage update (2026-10-01)

New tests: `tests/business-partners/contacts/notes-attachments-persistence.spec.ts`.

| Check | Latest result | Evidence |
|---|---|---|
| Note is submitted, saved and displayed after reloading contact details | Pass | `artifacts/business-partners/note-persistence.png` |
| Valid PNG upload completes, image and file link persist after saving/reloading | Pass | `artifacts/business-partners/attachment-persistence.png` |
| Each test deletes its own contact, with name and ID checked | Pass | Allure: Delete the test contact |
| Earlier exploratory contacts #56 and #60 removed | Pass | Playwright CLI cleanup verified exact fixture names before deletion |

Both new tests passed together. The initial attachment failure came from an
incorrectly scoped link locator and was fixed; it is not an application defect.
An earlier exploratory PNG was invalid and its upload failed. A valid fixture
created by the browser uploaded successfully; the current test waits for HTTP
success and an image preview before saving. Earlier manual observations of an
empty Notes section were not reproduced by the automated save/reload test.

Images are converted to WebP by the application, so verification compares the
uploaded image URL, decoded image availability and persisted link rather than
requiring the original filename or byte-for-byte PNG equality.

This adds persistence coverage only. It does not establish full customer/vendor,
project, branch, activity, accounting-mapping or sales/purchase-setting coverage.
Representative linking remains skipped under the previous user instruction.
Browser HTTP/console diagnostics remain separate from these passing assertions.
