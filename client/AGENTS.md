# Avexmar Hub - Client Guide

This guide covers frontend architecture and Redux patterns. Refer to ../AGENTS.md for project overview and global guidelines.

## Frontend Architecture (`/client`)

### Directory Structure

```
client/src/
├── components/
│   ├── admin/            # Admin panel components
│   ├── auth/             # Authentication forms
│   ├── booking/          # Booking process components
│   ├── search/           # Flight search interface
│   ├── profile/          # User profile management
│   └── utils/            # Utility components and helpers
├── redux/
│   ├── actions/          # Redux action creators
│   ├── reducers/         # Redux reducers
│   └── store.js          # Redux store configuration
├── routes/
│   ├── AdminRoutes.js    # Protected admin routes
│   ├── PublicRoutes.js   # Public routes
│   └── ProtectedRoute.js # Route protection logic
├── context/              # React Context providers
├── constants/            # UI labels and validation messages
├── theme/                # Material-UI theme configuration
├── App.js                # Main application component
└── api.js                # Axios API client configuration
```

### Component Organization Patterns

- **Admin Components**: CRUD operations with data tables and forms
- **Booking Flow**: Multi-step process (Search → Schedule → Passengers → Confirmation → Payment → Completion)
- **Authentication**: Modal-based login/register with context management
- **Utility Components**: Reusable form inputs, mappers, validators

### State Management (Redux)

**Store Structure:**

```
state: {
  auth: { user, isAuthenticated, isAdmin }
  airports: { airports, isLoading, errors }
  airlines: { airlines, isLoading, errors }
  flights: { flights, isLoading, errors }
  bookings: { bookings, currentBooking, isLoading, errors }
  // ... other entities
}
```

**Action Patterns:**

- Async actions use Redux Thunk middleware
- Standard pattern: `fetchEntity`, `createEntity`, `updateEntity`, `deleteEntity`
- Loading states and error handling built into each reducer
- Use serverApi only inside Redux actions and reducers; components should dispatch thunks instead of calling serverApi directly.

### Routing Structure

- **Public Routes**: Home, search, booking process, authentication
- **Admin Routes**: Management panels for all entities, protected by admin role
- **Protected Routes**: HOC pattern for route-based access control

### Frontend Patterns

**Component Structure:**

```javascript
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const ComponentName = () => {
    const dispatch = useDispatch();
    const { data, isLoading, errors } = useSelector(state => state.entityName);

    useEffect(() => {
        dispatch(fetchEntities());
    }, [dispatch]);

    return (
        // JSX
    );
};
```

**Redux Action Pattern:**

```javascript
export const fetchEntities = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const response = await api.get('/entities');
    dispatch(setEntities(response.data));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};
```

### Data Mapping Patterns

The application uses consistent mapping between API and UI formats:

```javascript
// client/src/components/utils/mappers.js
export const mappingConfigs = {
  entityName: [
    ['api_field_name', 'uiFieldName'],
    ['another_api_field', 'anotherUiField'],
  ],
};
```

## Admin Panel Architecture

The admin panel provides comprehensive management functionality:

- **Data Tables**: Sortable, filterable tables with CRUD operations
- **Form Generation**: Dynamic forms based on field configurations
- **Role Protection**: All admin routes require admin role
- **Bulk Operations**: Mass delete and update capabilities

**Admin Modules:**

- Airports, Airlines, Aircraft management
- Route and Flight scheduling
- Tariff and Discount configuration
- Booking and Passenger management
- User administration

## Frontend Redux Patterns (Client)

CRUD utilities (found in `client/src/redux/utils.js`) standardize action creators and reducer cases:

- Actions: use `createCrudActions('<endpoint>')` to generate thunks: fetchAll, fetchOne, create, update, remove, removeAll.
- Reducers: use `addCrudCases(builder, actions, '<pluralKey>', '<singleKey>')` inside `createSlice` to wire up pending/fulfilled/rejected states.
- Error handling: `getErrorData` normalizes Axios error shapes; `handlePending`/`handleRejected` standardize loading and errors fields.

Example usage (airports):

- Actions: `redux/actions/airport.js` → `createCrudActions('airports')`.
- Reducer: `redux/reducers/airport.js` → `addCrudCases(builder, actions, 'airports', 'airport')`.

Non-CRUD modules:

- `auth`, `search`, `price`, `bookingProcess`, `payment` implement domain-specific thunks and slices following the same loading/error conventions where possible.

### Frontend Consistency Audit (current codebase)

What’s consistent:

- CRUD slices/actions follow the shared utilities for most entities (airports, flights, tariffs, airlines, routes, etc.).
- Loading and error handling standardized via helpers.
- API layer (`client/src/api.js`) centralizes base URL, auth header injection, uploads and template downloads.

Minor inconsistencies and recommendations:

- `removeAll` thunk is generated but not handled in reducers via `addCrudCases`. Add a helper (e.g., `addRemoveAllCase`) or include it in `addCrudCases` when needed.
- Store configuration uses legacy `createStore` + `redux-thunk`. Consider migrating to RTK’s `configureStore` for simpler setup and better devtools integration.
- Enforce single quotes via `.prettierrc` (above) and ESLint `quotes` rules to avoid drift.

## Code Style

- JavaScript files within this directory must use tabs for indentation with a tab width of four spaces.

## Component Adaptiveness Rules

- Use Material-UI breakpoints (`xs`, `sm`, `md`, `lg`, `xl`) and add custom breakpoints for tablet vs. mobile when needed.
- Adapt only user-facing components; skip anything under `client/src/components/admin/` and `client/src/routes/AdminRoutes.js`.
- Prioritize updates in this order: common layout (`Base`, `Header`, `Footer`), then feature pages (`Search`, `Schedule`, `Home`, `About`), followed by booking and profile flows.

### Base layout
- Configure `Container` `maxWidth` responsively (`{ xs: '100%', sm: 'sm', md: 'md', lg: 'lg' }`).
- Apply responsive vertical spacing like `py: { xs: 1, md: 2 }` and ensure no horizontal scroll on screens under 600px.

### Header
- Wrap navigation in `AppBar` + `Toolbar` and switch to a hamburger `Drawer` or `Menu` below `md` using `useMediaQuery`.
- Include user menu and auth actions inside the drawer for mobile while keeping the desktop layout for `md` and up.

### Footer
- Stack links vertically on phones (`Stack` `direction={{ xs: 'column', sm: 'row' }}`) with responsive alignment and text settings.
- Ensure link tap targets are at least 48×48 px.

### Search page
- Use `Grid`/`Stack` layouts with breakpoint props for forms and results.
- Collapse filter and sort controls into a menu or accordion on `sm` and below.
- Display results cards full-width with vertical stacking on `xs`/`sm`; revert to side-by-side on `md`+.

### Schedule page
- Wrap tables in `TableContainer` with horizontal scroll on small screens or provide card layouts.
- Keep flight selection buttons accessible without overflow.

### Home page
- Wrap `<SearchForm>` in a responsive container (`maxWidth={{ xs: '100%', sm: 500 }}`).
- Stack form fields vertically on `xs`/`sm` and align horizontally on `md`+.

### About page
- Render info cards with `Grid` (`xs={12}`, `sm={6}`, `md={4}`) and convert tables to `Stack`/`List` on small screens.
- Allow legal links to wrap and add padding suitable for touch devices.

### Booking and profile flows
- Review components under `booking` and `profile` for responsive breakpoints.
- Replace fixed widths with responsive `sx` values or `Grid` layouts, ensuring touch-friendly navigation between steps.
