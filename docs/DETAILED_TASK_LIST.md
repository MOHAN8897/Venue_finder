# Detailed Task List for AI Implementation

## Overview
This document provides step-by-step instructions for implementing the frontend and backend integrations for the venue finder system. Each task includes detailed context, implementation steps, and expected outcomes.

## Task 1: API Layer Foundation Setup

### Context
Create a centralized API layer to communicate with Supabase backend functions. This will serve as the foundation for all frontend-backend interactions.

### Detailed Steps

#### Step 1.1: Create API Client Configuration
**File:** `src/lib/api-client.ts`

```typescript
// Create centralized Supabase client configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Add error handling and retry logic
export const apiClient = {
  // Generic function to call Supabase functions
  async callFunction<T>(functionName: string, params: any): Promise<T> {
    try {
      const { data, error } = await supabase.rpc(functionName, params)
      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error)
      throw error
    }
  }
}
```

#### Step 1.2: Create TypeScript Interfaces
**File:** `src/types/api.ts`

```typescript
// Define interfaces for all backend function parameters and responses
export interface VenueSearchParams {
  location?: string
  min_price?: number
  max_price?: number
  min_capacity?: number
  max_capacity?: number
  venue_type?: string
  amenities?: string[]
}

export interface VenueSearchResult {
  id: string
  name: string
  address: string
  venue_type: string
  price_per_hour: number
  capacity: number
  rating: number
  review_count: number
  images: string[]
}

export interface SlotAvailabilityParams {
  venue_id: string
  date: string
  start_time?: string
  end_time?: string
}

export interface BookingCreationParams {
  user_id: string
  venue_id: string
  event_date: string
  slot_times: string[]
  total_amount: number
  guest_count?: number
  special_requests?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
}

// Add more interfaces for all backend functions...
```

#### Step 1.3: Create API Service Functions
**File:** `src/services/api.ts`

```typescript
import { apiClient } from '@/lib/api-client'
import type { 
  VenueSearchParams, 
  VenueSearchResult,
  SlotAvailabilityParams,
  BookingCreationParams 
} from '@/types/api'

export const venueAPI = {
  // Search venues with filters
  async searchVenues(params: VenueSearchParams): Promise<VenueSearchResult[]> {
    return apiClient.callFunction<VenueSearchResult[]>('search_venues', params)
  },

  // Get venue details
  async getVenueDetails(venueId: string) {
    return apiClient.callFunction('get_venue_details', { p_venue_id: venueId })
  },

  // Get venue reviews
  async getVenueReviews(venueId: string) {
    return apiClient.callFunction('get_venue_reviews', { p_venue_id: venueId })
  },

  // Get nearby venues
  async getNearbyVenues(location: string, radius: number = 10) {
    return apiClient.callFunction('get_nearby_venues', { 
      p_location: location, 
      p_radius: radius 
    })
  }
}

export const bookingAPI = {
  // Get available slots
  async getAvailableSlots(params: SlotAvailabilityParams) {
    return apiClient.callFunction('get_available_slots', {
      p_venue_id: params.venue_id,
      p_date: params.date,
      p_start_time: params.start_time || '06:00:00',
      p_end_time: params.end_time || '22:00:00'
    })
  },

  // Check slot availability
  async checkSlotAvailability(venueId: string, date: string, startTime: string, endTime: string) {
    return apiClient.callFunction('check_slot_availability', {
      p_venue_id: venueId,
      p_date: date,
      p_start_time: startTime,
      p_end_time: endTime
    })
  },

  // Create booking
  async createBooking(params: BookingCreationParams) {
    return apiClient.callFunction('create_booking_with_slots', params)
  },

  // Get user bookings
  async getUserBookings(userId: string, status?: string, limit: number = 50, offset: number = 0) {
    return apiClient.callFunction('get_user_bookings', {
      p_user_id: userId,
      p_status: status,
      p_limit: limit,
      p_offset: offset
    })
  },

  // Cancel booking
  async cancelBooking(bookingId: string, userId: string, reason?: string) {
    return apiClient.callFunction('cancel_booking', {
      p_booking_id: bookingId,
      p_user_id: userId,
      p_reason: reason
    })
  }
}

export const paymentAPI = {
  // Create Razorpay order
  async createRazorpayOrder(bookingId: string, amount: number, currency: string = 'INR') {
    return apiClient.callFunction('create_razorpay_order', {
      p_booking_id: bookingId,
      p_amount: amount,
      p_currency: currency
    })
  },

  // Get payment details
  async getPaymentDetails(paymentId: string) {
    return apiClient.callFunction('get_payment_details', { p_payment_id: paymentId })
  },

  // Get user payments
  async getUserPayments(userId: string, status?: string, limit: number = 50, offset: number = 0) {
    return apiClient.callFunction('get_user_payments', {
      p_user_id: userId,
      p_status: status,
      p_limit: limit,
      p_offset: offset
    })
  }
}
```

#### Step 1.4: Add Error Handling and Loading States
**File:** `src/hooks/useApi.ts`

```typescript
import { useState, useCallback } from 'react'

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useApi<T = any>(options: UseApiOptions<T> = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiCall()
      setData(result)
      options.onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [options])

  return { data, loading, error, execute }
}
```

### Expected Outcome
- Centralized API client with error handling
- TypeScript interfaces for all backend functions
- Reusable API service functions
- Custom hook for API calls with loading states

---

## Task 2: Venue Search Integration

### Context
Replace mock data with real backend search capabilities, implementing advanced filtering and real-time results.

### Detailed Steps

#### Step 2.1: Update Search Component
**File:** `src/components/search/VenueSearch.tsx`

```typescript
import { useState, useEffect } from 'react'
import { useApi } from '@/hooks/useApi'
import { venueAPI } from '@/services/api'
import type { VenueSearchParams, VenueSearchResult } from '@/types/api'

export default function VenueSearch() {
  const [searchParams, setSearchParams] = useState<VenueSearchParams>({})
  const [venues, setVenues] = useState<VenueSearchResult[]>([])
  
  const { loading, error, execute } = useApi<VenueSearchResult[]>({
    onSuccess: (data) => setVenues(data)
  })

  const handleSearch = async (params: VenueSearchParams) => {
    setSearchParams(params)
    await execute(() => venueAPI.searchVenues(params))
  }

  const handleFilterChange = (filter: Partial<VenueSearchParams>) => {
    const newParams = { ...searchParams, ...filter }
    handleSearch(newParams)
  }

  return (
    <div className="venue-search">
      {/* Search filters */}
      <SearchFilters onFilterChange={handleFilterChange} />
      
      {/* Loading state */}
      {loading && <LoadingSpinner />}
      
      {/* Error state */}
      {error && <ErrorMessage error={error} />}
      
      {/* Results */}
      {venues.length > 0 && (
        <VenueList venues={venues} />
      )}
      
      {/* No results */}
      {!loading && !error && venues.length === 0 && (
        <NoResultsMessage />
      )}
    </div>
  )
}
```

#### Step 2.2: Create Search Filters Component
**File:** `src/components/search/SearchFilters.tsx`

```typescript
import { useState } from 'react'
import type { VenueSearchParams } from '@/types/api'

interface SearchFiltersProps {
  onFilterChange: (filters: Partial<VenueSearchParams>) => void
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [filters, setFilters] = useState<VenueSearchParams>({
    location: '',
    min_price: undefined,
    max_price: undefined,
    min_capacity: undefined,
    max_capacity: undefined,
    venue_type: '',
    amenities: []
  })

  const handleFilterChange = (key: keyof VenueSearchParams, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="search-filters">
      {/* Location filter */}
      <div className="filter-group">
        <label>Location</label>
        <input
          type="text"
          placeholder="Enter city or area"
          value={filters.location || ''}
          onChange={(e) => handleFilterChange('location', e.target.value)}
        />
      </div>

      {/* Price range filter */}
      <div className="filter-group">
        <label>Price Range (per hour)</label>
        <div className="price-range">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_price || ''}
            onChange={(e) => handleFilterChange('min_price', Number(e.target.value))}
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.max_price || ''}
            onChange={(e) => handleFilterChange('max_price', Number(e.target.value))}
          />
        </div>
      </div>

      {/* Capacity filter */}
      <div className="filter-group">
        <label>Capacity</label>
        <div className="capacity-range">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_capacity || ''}
            onChange={(e) => handleFilterChange('min_capacity', Number(e.target.value))}
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.max_capacity || ''}
            onChange={(e) => handleFilterChange('max_capacity', Number(e.target.value))}
          />
        </div>
      </div>

      {/* Venue type filter */}
      <div className="filter-group">
        <label>Venue Type</label>
        <select
          value={filters.venue_type || ''}
          onChange={(e) => handleFilterChange('venue_type', e.target.value)}
        >
          <option value="">All Types</option>
          <option value="conference">Conference</option>
          <option value="meeting">Meeting</option>
          <option value="event">Event</option>
          <option value="workshop">Workshop</option>
        </select>
      </div>

      {/* Amenities filter */}
      <div className="filter-group">
        <label>Amenities</label>
        <div className="amenities-checkboxes">
          {['wifi', 'parking', 'catering', 'projector', 'audio'].map(amenity => (
            <label key={amenity}>
              <input
                type="checkbox"
                checked={filters.amenities?.includes(amenity) || false}
                onChange={(e) => {
                  const currentAmenities = filters.amenities || []
                  const newAmenities = e.target.checked
                    ? [...currentAmenities, amenity]
                    : currentAmenities.filter(a => a !== amenity)
                  handleFilterChange('amenities', newAmenities)
                }}
              />
              {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### Step 2.3: Update Venue List Component
**File:** `src/components/venue/VenueList.tsx`

```typescript
import Link from 'next/link'
import type { VenueSearchResult } from '@/types/api'

interface VenueListProps {
  venues: VenueSearchResult[]
}

export default function VenueList({ venues }: VenueListProps) {
  return (
    <div className="venue-list">
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  )
}

function VenueCard({ venue }: { venue: VenueSearchResult }) {
  return (
    <Link href={`/venues/${venue.id}`} className="venue-card">
      <div className="venue-image">
        <img src={venue.images[0] || '/placeholder-venue.jpg'} alt={venue.name} />
      </div>
      
      <div className="venue-info">
        <h3>{venue.name}</h3>
        <p className="venue-address">{venue.address}</p>
        <p className="venue-type">{venue.venue_type}</p>
        
        <div className="venue-details">
          <span className="price">₹{venue.price_per_hour}/hour</span>
          <span className="capacity">{venue.capacity} people</span>
        </div>
        
        <div className="venue-rating">
          <span className="stars">{'★'.repeat(Math.round(venue.rating))}</span>
          <span className="rating-text">{venue.rating} ({venue.review_count} reviews)</span>
        </div>
      </div>
    </Link>
  )
}
```

### Expected Outcome
- Real-time venue search with backend data
- Advanced filtering capabilities
- Responsive search results display
- Error handling and loading states

---

## Task 3: Venue Detail Page Integration

### Context
Connect venue detail pages to comprehensive backend data including reviews, availability, and detailed information.

### Detailed Steps

#### Step 3.1: Update Venue Detail Page
**File:** `src/pages/venues/[id].tsx`

```typescript
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useApi } from '@/hooks/useApi'
import { venueAPI } from '@/services/api'

export default function VenueDetail() {
  const router = useRouter()
  const { id } = router.query
  
  const [venue, setVenue] = useState(null)
  const [reviews, setReviews] = useState([])
  const [availability, setAvailability] = useState([])
  
  const { loading: venueLoading, error: venueError, execute: loadVenue } = useApi({
    onSuccess: setVenue
  })
  
  const { loading: reviewsLoading, execute: loadReviews } = useApi({
    onSuccess: setReviews
  })
  
  const { loading: availabilityLoading, execute: loadAvailability } = useApi({
    onSuccess: setAvailability
  })

  useEffect(() => {
    if (id) {
      loadVenue(() => venueAPI.getVenueDetails(id as string))
      loadReviews(() => venueAPI.getVenueReviews(id as string))
      loadAvailability(() => venueAPI.getAvailableSlots({
        venue_id: id as string,
        date: new Date().toISOString().split('T')[0]
      }))
    }
  }, [id])

  if (venueLoading) return <LoadingSpinner />
  if (venueError) return <ErrorMessage error={venueError} />
  if (!venue) return <NotFound />

  return (
    <div className="venue-detail">
      <VenueHeader venue={venue} />
      <VenueGallery images={venue.images} />
      <VenueInfo venue={venue} />
      <VenueAvailability availability={availability} loading={availabilityLoading} />
      <VenueReviews reviews={reviews} loading={reviewsLoading} />
      <BookingSection venue={venue} availability={availability} />
    </div>
  )
}
```

#### Step 3.2: Create Venue Availability Component
**File:** `src/components/venue/VenueAvailability.tsx`

```typescript
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { bookingAPI } from '@/services/api'

interface VenueAvailabilityProps {
  venueId: string
  availability: any[]
  loading: boolean
}

export default function VenueAvailability({ venueId, availability, loading }: VenueAvailabilityProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  const { loading: slotsLoading, execute: loadSlots } = useApi({
    onSuccess: (data) => {
      // Update availability data
    }
  })

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    loadSlots(() => bookingAPI.getAvailableSlots({
      venue_id: venueId,
      date: date
    }))
  }

  return (
    <div className="venue-availability">
      <h3>Availability</h3>
      
      {/* Date selector */}
      <div className="date-selector">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
      
      {/* Availability display */}
      {loading || slotsLoading ? (
        <LoadingSpinner />
      ) : (
        <AvailabilityCalendar availability={availability} />
      )}
    </div>
  )
}

function AvailabilityCalendar({ availability }: { availability: any[] }) {
  return (
    <div className="availability-calendar">
      {availability.map((slot) => (
        <div
          key={slot.slot_id}
          className={`time-slot ${slot.available ? 'available' : 'unavailable'}`}
        >
          <span className="time">{slot.start_time} - {slot.end_time}</span>
          <span className="price">₹{slot.price}</span>
          {slot.available && (
            <span className="status">Available</span>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Expected Outcome
- Comprehensive venue detail pages with real data
- Real-time availability checking
- Review and rating system integration
- Seamless booking flow integration

---

## Task 4: Booking System Integration

### Context
Implement complete booking system integration with real-time slot availability, booking creation, and management.

### Detailed Steps

#### Step 4.1: Update Slot-Based Booking Component
**File:** `src/components/venue-detail/SlotBasedBookingCalendar.tsx`

```typescript
import { useState, useEffect } from 'react'
import { useApi } from '@/hooks/useApi'
import { bookingAPI } from '@/services/api'

interface SlotBasedBookingCalendarProps {
  venueId: string
  venuePrice: number
  onBookingCreated: (bookingId: string) => void
}

export default function SlotBasedBookingCalendar({ 
  venueId, 
  venuePrice, 
  onBookingCreated 
}: SlotBasedBookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [guestCount, setGuestCount] = useState(1)
  const [specialRequests, setSpecialRequests] = useState('')
  
  const { loading: availabilityLoading, execute: loadAvailability } = useApi()
  const { loading: bookingLoading, execute: createBooking } = useApi({
    onSuccess: (result) => {
      if (result.success) {
        onBookingCreated(result.booking_id)
      }
    }
  })

  useEffect(() => {
    loadAvailability(() => bookingAPI.getAvailableSlots({
      venue_id: venueId,
      date: selectedDate
    }))
  }, [venueId, selectedDate])

  const handleSlotToggle = (slotTime: string) => {
    setSelectedSlots(prev => 
      prev.includes(slotTime)
        ? prev.filter(time => time !== slotTime)
        : [...prev, slotTime]
    )
  }

  const handleBookingSubmit = async () => {
    if (selectedSlots.length === 0) {
      alert('Please select at least one time slot')
      return
    }

    const totalAmount = selectedSlots.length * venuePrice

    await createBooking(() => bookingAPI.createBooking({
      user_id: 'current-user-id', // Get from auth context
      venue_id: venueId,
      event_date: selectedDate,
      slot_times: selectedSlots,
      total_amount: totalAmount,
      guest_count: guestCount,
      special_requests: specialRequests
    }))
  }

  const totalAmount = selectedSlots.length * venuePrice

  return (
    <div className="slot-booking-calendar">
      <h3>Book This Venue</h3>
      
      {/* Date selection */}
      <div className="date-selection">
        <label>Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
      
      {/* Slot selection */}
      <div className="slot-selection">
        <label>Select Time Slots:</label>
        {availabilityLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="time-slots">
            {/* Render available slots */}
            {selectedSlots.map(slot => (
              <div key={slot} className="selected-slot">
                {slot} - ₹{venuePrice}
                <button onClick={() => handleSlotToggle(slot)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Guest count */}
      <div className="guest-count">
        <label>Number of Guests:</label>
        <input
          type="number"
          min="1"
          value={guestCount}
          onChange={(e) => setGuestCount(Number(e.target.value))}
        />
      </div>
      
      {/* Special requests */}
      <div className="special-requests">
        <label>Special Requests:</label>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Any special requirements..."
        />
      </div>
      
      {/* Total and booking button */}
      <div className="booking-summary">
        <div className="total">
          <strong>Total: ₹{totalAmount}</strong>
          <span>({selectedSlots.length} hours × ₹{venuePrice})</span>
        </div>
        
        <button
          onClick={handleBookingSubmit}
          disabled={bookingLoading || selectedSlots.length === 0}
          className="book-button"
        >
          {bookingLoading ? 'Creating Booking...' : 'Book Now'}
        </button>
      </div>
    </div>
  )
}
```

#### Step 4.2: Create Booking History Component
**File:** `src/components/booking/BookingHistory.tsx`

```typescript
import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { bookingAPI } from '@/services/api'

export default function BookingHistory() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('')
  
  const { loading, error, execute: loadBookings } = useApi({
    onSuccess: setBookings
  })

  const { loading: cancelLoading, execute: cancelBooking } = useApi({
    onSuccess: () => {
      // Refresh bookings after cancellation
      loadBookings(() => bookingAPI.getUserBookings('current-user-id', filter))
    }
  })

  useEffect(() => {
    loadBookings(() => bookingAPI.getUserBookings('current-user-id', filter))
  }, [filter])

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      await cancelBooking(() => bookingAPI.cancelBooking(bookingId, 'current-user-id'))
    }
  }

  return (
    <div className="booking-history">
      <h2>My Bookings</h2>
      
      {/* Filter */}
      <div className="booking-filter">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Bookings</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      
      {/* Bookings list */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.booking_id}
              booking={booking}
              onCancel={handleCancelBooking}
              cancelLoading={cancelLoading}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking, onCancel, cancelLoading }: any) {
  return (
    <div className="booking-card">
      <div className="booking-header">
        <h3>{booking.venue_name}</h3>
        <span className={`status ${booking.booking_status}`}>
          {booking.booking_status}
        </span>
      </div>
      
      <div className="booking-details">
        <p><strong>Date:</strong> {booking.event_date}</p>
        <p><strong>Time:</strong> {booking.event_duration}</p>
        <p><strong>Guests:</strong> {booking.guest_count}</p>
        <p><strong>Total:</strong> ₹{booking.total_amount}</p>
        <p><strong>Status:</strong> {booking.payment_status}</p>
      </div>
      
      {booking.booking_status === 'pending' && (
        <button
          onClick={() => onCancel(booking.booking_id)}
          disabled={cancelLoading}
          className="cancel-button"
        >
          Cancel Booking
        </button>
      )}
    </div>
  )
}
```

### Expected Outcome
- Real-time slot availability and booking
- Multi-slot selection and booking creation
- Booking history and management
- Cancellation functionality

---

## Task 5: Payment System Integration

### Context
Implement Razorpay payment integration with order creation, payment processing, and webhook handling.

### Detailed Steps

#### Step 5.1: Install Razorpay SDK
```bash
npm install razorpay
```

#### Step 5.2: Create Payment Service
**File:** `src/services/payment.ts`

```typescript
import { paymentAPI } from './api'

declare global {
  interface Window {
    Razorpay: any
  }
}

export class PaymentService {
  private static loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Razorpay'))
      document.head.appendChild(script)
    })
  }

  static async createPayment(bookingId: string, amount: number, currency: string = 'INR') {
    try {
      // Load Razorpay script
      await this.loadRazorpayScript()

      // Create order on backend
      const orderResult = await paymentAPI.createRazorpayOrder(bookingId, amount, currency)
      
      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create order')
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100, // Convert to paise
        currency: currency,
        name: 'Venue Finder',
        description: `Booking for venue`,
        order_id: orderResult.order_id,
        handler: async (response: any) => {
          // Handle successful payment
          await this.handlePaymentSuccess(orderResult.payment_id, response.razorpay_payment_id)
        },
        prefill: {
          name: 'User Name', // Get from user context
          email: 'user@example.com', // Get from user context
          contact: '9999999999' // Get from user context
        },
        theme: {
          color: '#3399cc'
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()

      return { success: true, order_id: orderResult.order_id }
    } catch (error) {
      console.error('Payment creation failed:', error)
      throw error
    }
  }

  static async handlePaymentSuccess(paymentId: string, razorpayPaymentId: string) {
    try {
      // Process payment success on backend
      const result = await paymentAPI.processPaymentSuccess(paymentId, razorpayPaymentId)
      
      if (result.success) {
        // Redirect to success page or show success message
        window.location.href = `/booking/success?booking_id=${result.booking_id}`
      } else {
        throw new Error(result.error || 'Payment processing failed')
      }
    } catch (error) {
      console.error('Payment success handling failed:', error)
      // Redirect to error page
      window.location.href = '/booking/error'
    }
  }

  static async handlePaymentFailure(paymentId: string, errorCode: string, errorMessage: string) {
    try {
      await paymentAPI.processPaymentFailure(paymentId, errorCode, errorMessage)
      // Redirect to error page
      window.location.href = '/booking/error'
    } catch (error) {
      console.error('Payment failure handling failed:', error)
    }
  }
}
```

#### Step 5.3: Update Booking Component with Payment
**File:** `src/components/venue-detail/SlotBasedBookingCalendar.tsx`

```typescript
// Add to existing component
import { PaymentService } from '@/services/payment'

// Update handleBookingSubmit function
const handleBookingSubmit = async () => {
  if (selectedSlots.length === 0) {
    alert('Please select at least one time slot')
    return
  }

  const totalAmount = selectedSlots.length * venuePrice

  try {
    // Create booking first
    const bookingResult = await createBooking(() => bookingAPI.createBooking({
      user_id: 'current-user-id',
      venue_id: venueId,
      event_date: selectedDate,
      slot_times: selectedSlots,
      total_amount: totalAmount,
      guest_count: guestCount,
      special_requests: specialRequests
    }))

    if (bookingResult.success) {
      // Initiate payment
      await PaymentService.createPayment(
        bookingResult.booking_id,
        totalAmount,
        'INR'
      )
    }
  } catch (error) {
    console.error('Booking or payment failed:', error)
    alert('Booking failed. Please try again.')
  }
}
```

#### Step 5.4: Create Payment Success/Error Pages
**File:** `src/pages/booking/success.tsx`

```typescript
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { paymentAPI } from '@/services/api'

export default function BookingSuccess() {
  const router = useRouter()
  const { booking_id } = router.query
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (booking_id) {
      // Load booking details
      // This would typically come from the booking context or API
      setLoading(false)
    }
  }, [booking_id])

  if (loading) return <LoadingSpinner />

  return (
    <div className="booking-success">
      <div className="success-icon">✅</div>
      <h1>Booking Confirmed!</h1>
      <p>Your venue booking has been successfully confirmed.</p>
      
      <div className="booking-details">
        <h3>Booking Details</h3>
        {/* Display booking details */}
      </div>
      
      <div className="actions">
        <button onClick={() => router.push('/bookings')}>
          View My Bookings
        </button>
        <button onClick={() => router.push('/')}>
          Browse More Venues
        </button>
      </div>
    </div>
  )
}
```

### Expected Outcome
- Complete Razorpay payment integration
- Secure payment processing
- Payment success/failure handling
- Booking confirmation flow

---

## Task 6: Error Handling and Loading States

### Context
Implement comprehensive error handling and loading states throughout the application for better user experience.

### Detailed Steps

#### Step 6.1: Create Error Boundary Component
**File:** `src/components/common/ErrorBoundary.tsx`

```typescript
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Log error to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### Step 6.2: Create Loading Components
**File:** `src/components/common/LoadingSpinner.tsx`

```typescript
export default function LoadingSpinner({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  )
}
```

#### Step 6.3: Create Error Message Component
**File:** `src/components/common/ErrorMessage.tsx`

```typescript
interface ErrorMessageProps {
  error: Error
  onRetry?: () => void
}

export default function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-message">
      <div className="error-icon">⚠️</div>
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-button">
          Try Again
        </button>
      )}
    </div>
  )
}
```

### Expected Outcome
- Comprehensive error handling throughout the app
- Consistent loading states
- Better user experience with clear feedback
- Error recovery mechanisms

---

## Task 7: Testing and Quality Assurance

### Context
Implement comprehensive testing to ensure system reliability and performance.

### Detailed Steps

#### Step 7.1: Create API Tests
**File:** `src/tests/api.test.ts`

```typescript
import { venueAPI, bookingAPI, paymentAPI } from '@/services/api'

describe('API Tests', () => {
  test('venue search returns results', async () => {
    const results = await venueAPI.searchVenues({
      location: 'Mumbai',
      min_price: 1000,
      max_price: 5000
    })
    
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)
  })

  test('booking creation works', async () => {
    const result = await bookingAPI.createBooking({
      user_id: 'test-user-id',
      venue_id: 'test-venue-id',
      event_date: '2024-12-25',
      slot_times: ['09:00', '10:00'],
      total_amount: 2000
    })
    
    expect(result.success).toBe(true)
    expect(result.booking_id).toBeDefined()
  })
})
```

#### Step 7.2: Create Component Tests
**File:** `src/tests/components/VenueSearch.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import VenueSearch from '@/components/search/VenueSearch'

describe('VenueSearch', () => {
  test('renders search filters', () => {
    render(<VenueSearch />)
    
    expect(screen.getByPlaceholderText('Enter city or area')).toBeInTheDocument()
    expect(screen.getByText('Price Range (per hour)')).toBeInTheDocument()
  })

  test('handles search submission', async () => {
    render(<VenueSearch />)
    
    const locationInput = screen.getByPlaceholderText('Enter city or area')
    fireEvent.change(locationInput, { target: { value: 'Mumbai' } })
    
    // Add more test logic
  })
})
```

### Expected Outcome
- Comprehensive test coverage
- Automated testing pipeline
- Quality assurance processes
- Performance monitoring

---

## Implementation Checklist

### Phase 1: Foundation ✅
- [ ] API client configuration
- [ ] TypeScript interfaces
- [ ] API service functions
- [ ] Error handling hooks

### Phase 2: Search Integration ✅
- [ ] Search component updates
- [ ] Filter components
- [ ] Results display
- [ ] Real-time search

### Phase 3: Venue Details ✅
- [ ] Detail page integration
- [ ] Availability component
- [ ] Review system
- [ ] Image gallery

### Phase 4: Booking System ✅
- [ ] Slot selection
- [ ] Booking creation
- [ ] Booking history
- [ ] Cancellation

### Phase 5: Payment Integration ✅
- [ ] Razorpay setup
- [ ] Payment flow
- [ ] Success/error handling
- [ ] Webhook processing

### Phase 6: Quality Assurance ✅
- [ ] Error handling
- [ ] Loading states
- [ ] Testing
- [ ] Performance optimization

## Next Steps After Implementation

1. **Deploy to staging environment**
2. **Conduct user acceptance testing**
3. **Performance optimization**
4. **Security audit**
5. **Production deployment**
6. **Monitoring and maintenance**

This detailed task list provides step-by-step instructions for implementing all the frontend and backend integrations. Each task includes specific code examples, file locations, and expected outcomes to guide the implementation process. 