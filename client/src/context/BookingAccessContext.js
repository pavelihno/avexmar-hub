import { createContext, useContext } from 'react';

export const BookingAccessContext = createContext({ accessiblePages: [] });

export const useBookingAccess = () => useContext(BookingAccessContext);
