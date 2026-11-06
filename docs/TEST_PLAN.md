# Test plan — Restful Booker API

## 1. Scope

In scope: the booking resource (create, read, update, delete, search), the token endpoint, and the health check. Functional behaviour, authorisation, input boundaries, response shape, and a response-time ceiling on the calls a client makes most often.

Out of scope: load and stress testing, the HTML front end Restful Booker also serves, the XML and form-urlencoded representations, and anything behind the `/apidoc` page. Restful Booker is a demo API I do not own, so I run light functional traffic against the public instance and nothing else.

## 2. Target and environments

| Environment | Base URL                               | How it runs                                           | Used by                       |
| ----------- | -------------------------------------- | ----------------------------------------------------- | ----------------------------- |
| `local`     | `http://localhost:3001`                | `docker compose up -d --wait`, image pinned by digest | every local run and all of CI |
| `public`    | `https://restful-booker.herokuapp.com` | hosted by the maintainer                              | occasional manual runs only   |

CI never touches the public instance. It sleeps on Heroku, resets its data every ten minutes, and is shared with everyone else learning API testing — none of which should be able to turn a build red. The local container seeds ten bookings at startup and keeps its data in memory, so every CI job begins from the same state.

## 3. Risks and how the plan answers them

| Risk                                                 | Answer                                                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| The target API is unstable or unavailable            | A pinned local container is the default target; the public instance is opt-in                                                       |
| Tests interfere with each other when run in parallel | Every test creates its own booking with a name unique to its worker and deletes it afterwards                                       |
| A response quietly grows, loses or renames a field   | Every read is validated against a JSON Schema with `additionalProperties: false`                                                    |
| The Postman and code layers drift apart              | The schemas live in `schemas/`; a CI step fails the build when the collection's embedded copies differ                              |
| A defect in the API is mistaken for a test bug       | Known defects carry an annotation naming the expected behaviour, visible in the report                                              |
| A fixed defect goes unnoticed                        | The two cases where the code contradicts the published documentation are written against the documentation and marked `test.fail()` |

## 4. Approach: what goes where

I use Postman while I am still learning an endpoint — reading the docs, trying a payload, watching what comes back. Those requests are worth keeping, because they are the artefact a product owner or a support engineer can open and run without a toolchain.

I use code once the behaviour is settled and has to stay settled. Types catch a renamed field at compile time, fixtures make setup and teardown reliable, and the suite is what I am willing to block a merge on.

Both layers hit the same endpoints on purpose. That is not duplication for its own sake: the collection is documentation that executes, and the code suite is the gate. They share the JSON Schemas so that neither can drift from the other without the build saying so.

## 5. Entry and exit criteria

Entry: the target responds `201` to `GET /ping`, and `npm ci` has installed a lockfile-exact dependency tree.

Exit: lint, type check and the schema-drift check pass; all 35 code tests pass, including the two expected failures; all 145 Newman assertions pass across the five data rows; both reports are published.

## 6. Test data

Code tests build their payload with `newBooking()`, which stamps the worker's process id and a counter into the first and last name. Two tests running at the same time can therefore both search by name and each find exactly one booking.

The Newman run is driven by `postman/data/bookings.csv`. The five rows are chosen for coverage, not volume: a normal stay, a free stay with no extras, a same-day stay at the top of the price range, a month-long stay, and a short stay with no extras. An empty cell in the CSV means the field is left out of the payload entirely rather than sent as an empty string.

## 7. Traceability

Restful Booker has no issue tracker, so these are the stories I would expect to receive for this API. The point is the mapping from a criterion to the checks that cover it, which is what I would attach to a ticket before moving it to review.

| Story                               | Acceptance criterion                                 | Postman request                              | Code test                                                                                                                                       |
| ----------------------------------- | ---------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| BOOK-1 Authenticate against the API | Valid credentials return a token                     | `Auth > Create token`                        | `valid credentials return a token`                                                                                                              |
|                                     | The token authorises a write                         | —                                            | `the token authorises a write`                                                                                                                  |
|                                     | Basic auth is accepted as an alternative             | —                                            | `basic auth is accepted instead of a token`                                                                                                     |
|                                     | Wrong or missing credentials return no token         | `Auth > Reject a wrong password`             | `a wrong password does not return a token`, `missing credentials do not return a token`                                                         |
| BOOK-2 Create a booking             | A valid payload returns an id and the stored booking | `Booking > Create booking`                   | `creates a booking and echoes it back`                                                                                                          |
|                                     | `additionalneeds` is optional                        | `Booking > Create booking` (rows 2 and 5)    | `omitting additionalneeds leaves it out of the response`                                                                                        |
|                                     | Boundary values are stored unchanged                 | `Booking > Create booking` (rows 2 and 3)    | `stores a free stay`, `stores a very expensive stay`, `stores a same-day stay`, `stores a 255-character first name`, `stores an unpaid deposit` |
|                                     | An incomplete payload is rejected                    | —                                            | `an incomplete booking payload is rejected`                                                                                                     |
| BOOK-3 Read a booking               | A known id returns the booking                       | `Booking > Get booking`                      | `reads a booking by id`                                                                                                                         |
|                                     | An unknown id returns 404                            | `Booking > Confirm the booking is gone`      | `reading an unknown booking returns 404`                                                                                                        |
| BOOK-4 Update a booking             | A full update replaces the booking                   | `Booking > Update booking`                   | `updates every field with PUT`, `PUT replaces the booking rather than merging into it`                                                          |
|                                     | A partial update changes only the fields sent        | `Booking > Partially update booking`         | `changes only the given fields with PATCH`                                                                                                      |
|                                     | The same update applied twice is idempotent          | —                                            | `applying the same PUT twice leaves the same booking`                                                                                           |
|                                     | An update without a valid token is refused           | `Booking > Reject an update without a token` | `a write without a token is forbidden`, `a write with an invalid token is forbidden`                                                            |
| BOOK-5 Delete a booking             | A delete removes the booking                         | `Booking > Delete booking`                   | `deletes a booking`                                                                                                                             |
|                                     | A delete without a token is refused                  | —                                            | `deleting without a token is forbidden`                                                                                                         |
|                                     | Deleting twice does not succeed twice                | —                                            | `deleting the same booking twice is rejected`                                                                                                   |
| BOOK-6 Search bookings              | All ids are listed                                   | —                                            | `a new booking appears in the list of ids`                                                                                                      |
|                                     | Results can be filtered by name                      | `Booking > Find booking by name`             | `filters by first and last name`, `returns an empty list when nobody matches`                                                                   |
|                                     | Results can be filtered by date                      | —                                            | `filters by checkin date`, `the checkin filter includes stays starting on the given date`                                                       |
|                                     | A malformed date is rejected                         | —                                            | `a malformed checkin filter is rejected`                                                                                                        |
| BOOK-7 Monitor service health       | The API reports that it is up                        | `Health > Health check`                      | `the API answers a health check`                                                                                                                |
|                                     | Common calls answer inside the budget                | every request asserts `responseBudgetMs`     | `the health check stays inside the budget`, `reading a booking stays inside the budget`, `creating a booking stays inside the budget`           |

## 8. Known defects

Everything below is behaviour I observed against both the public instance and the pinned container, cross-checked against the API's own source.

| What the API does                                                                              | What I would expect                              | Covered by                                                                              |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `POST /auth` answers `200` with `{"reason":"Bad credentials"}` for a wrong or missing password | `401 Unauthorized`, or `400` for a missing field | `a wrong password does not return a token`, `missing credentials do not return a token` |
| `POST /booking` answers `500` for a payload missing required fields                            | `400 Bad Request`                                | `an incomplete booking payload is rejected`                                             |
| `GET /booking?checkin=not-a-date` answers `500`                                                | `400 Bad Request`                                | `a malformed checkin filter is rejected`                                                |
| `DELETE /booking/:id` answers `201 Created`                                                    | `200 OK` or `204 No Content`                     | `deletes a booking`                                                                     |
| A second `DELETE` on the same id answers `405 Method Not Allowed`                              | `404 Not Found`                                  | `deleting the same booking twice is rejected`                                           |
| `totalprice` is run through `parseInt`, so `120.75` is stored as `120` with no error           | the value is rejected or kept intact             | `a fractional price is stored without its decimals`                                     |

Two further defects are documentation bugs rather than odd status codes: the behaviour contradicts what the API publishes about itself. Those are written against the documented behaviour and marked `test.fail()`, so the day the API is fixed the tests turn red and I notice.

| Documented behaviour                                           | Actual behaviour                                                                        | Covered by                                                     |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `UpdateBooking` is a full update                               | `Object.assign` merges the payload, so `additionalneeds` survives a `PUT` that omits it | `PUT replaces the booking rather than merging into it`         |
| `checkin` returns bookings "greater than or equal to" the date | the route builds a `$gt` query, so an exact match is excluded                           | `the checkin filter includes stays starting on the given date` |
