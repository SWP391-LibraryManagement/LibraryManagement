# SPEC.md - FE05 Book Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Dung

# Last Updated: 2026-06-02

# Feature ID: FE05

# Feature folder: `.sdd/specs/feat-book-management/`

> Source of truth for FE05 Book Management. This spec is a draft and must be reviewed before implementation. It is intentionally detailed because FE05 is a core business feature that provides the library catalog used by borrowing, reservation, reporting, and inventory features.

---

## 1. Feature Overview

### 1.1 Feature Name

Book Management

### 1.2 Business Context

Book Management controls the library catalog and provides accurate book information for guests, members, librarians, and other library features.

This feature is important because incorrect book information can affect searching, inventory tracking, borrowing operations, reservations, reporting, and audit records.

### 1.3 Goal / Outcome

The system shall:

- Allow guests and members to search books.
- Allow guests and members to view book details.
- Allow librarians/admins to view book lists.
- Allow librarians/admins to add new books.
- Allow librarians/admins to update book information.
- Allow librarians/admins to deactivate books.
- Maintain accurate book metadata for inventory, borrowing, and reporting features.
- Keep book management actions traceable for audit purposes.

### 1.4 Scope Level

- [x] Full Spec - core business logic, high risk, must be correct from the beginning
- [ ] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
|---------|-------------|-----------------------------|
| Guest | Unauthenticated visitor | Search books and view book details. |
| Member | Registered library user | Search books and view book details. |
| Librarian | Library staff | View book list, add books, update books, deactivate books. |
| Admin | System administrator | Has librarian permissions and can manage all books. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE05-001: The book record exists before it can be viewed or updated.
- PRE-FE05-002: Protected actions are performed by an authenticated actor with the correct role.
- PRE-FE05-003: Required book information is provided before creating a book.
- PRE-FE05-004: ISBN uniqueness rules are configured and approved by the team.
- PRE-FE05-005: Categories, authors, and publishers exist before being assigned to books.

---

## 4. Main Flows

### MF-FE05-001: Search Books

1. Guest or member enters search criteria.
2. The system validates search parameters.
3. The system searches active books.
4. The system returns matching results.
5. The system supports pagination when applicable.

### MF-FE05-002: View Book Details

1. Guest or member selects a book.
2. The system retrieves book information.
3. The system displays detailed book information.
4. The system displays author, category, publisher, and availability information.

### MF-FE05-003: View Book List

1. Librarian opens book management.
2. The system retrieves book records.
3. The system displays paginated book list.
4. The librarian may filter and sort results.

### MF-FE05-004: Add Book

1. Librarian enters book information.
2. The system validates required fields.
3. The system validates ISBN uniqueness.
4. The system creates a new book record.
5. The system writes an audit log entry.

### MF-FE05-005: Update Book Information

1. Librarian selects an existing book.
2. Librarian modifies information.
3. The system validates updated data.
4. The system saves changes.
5. The system writes an audit log entry.

### MF-FE05-006: Deactivate Book

1. Librarian selects an active book.
2. Librarian confirms deactivation.
3. The system changes book status to `INACTIVE`.
4. The system prevents future borrowing of the book.
5. The system writes an audit log entry.

---

## 5. Alternative Flows

### AF-FE05-001: Duplicate ISBN

1. Librarian submits a new book.
2. The system detects an existing ISBN.
3. The system rejects creation.
4. The system returns a validation error.

### AF-FE05-002: Invalid Category

1. Librarian submits book information.
2. The selected category does not exist.
3. The system rejects the request.
4. The system returns an error message.

### AF-FE05-003: Book Not Found

1. User requests book details.
2. The book ID does not exist.
3. The system returns a not-found response.

### AF-FE05-004: Unauthorized Access

1. Guest or member attempts to add, update, or deactivate a book.
2. The system validates permissions.
3. The system denies access.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE05-001: Guests and members may only search books and view book details.
- BR-FE05-002: Only librarians and admins may add books.
- BR-FE05-003: Only librarians and admins may update books.
- BR-FE05-004: Only librarians and admins may deactivate books.
- BR-FE05-005: ISBN must be unique across all books.
- BR-FE05-006: Book title is required.
- BR-FE05-007: A book must belong to at least one category.
- BR-FE05-008: Deactivated books cannot be borrowed.
- BR-FE05-009: Deactivated books should not appear in public search results.
- BR-FE05-010: Every create, update, and deactivate action must be auditable.

---

## 7. Functional Requirements

- FR-FE05-001: The system shall allow guests to search books.
- FR-FE05-002: The system shall allow members to search books.
- FR-FE05-003: The system shall allow users to view book details.
- FR-FE05-004: The system shall allow librarians/admins to view book lists.
- FR-FE05-005: The system shall validate ISBN uniqueness before creating a book.
- FR-FE05-006: The system shall create a new book when provided valid data.
- FR-FE05-007: The system shall allow updating existing books.
- FR-FE05-008: The system shall deactivate books using status-based deactivation.
- FR-FE05-009: The system shall support pagination in book searches.
- FR-FE05-010: The system shall support filtering by category, author, and status.