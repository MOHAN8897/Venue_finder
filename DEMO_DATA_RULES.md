# Demo Data Rules - Venue Finder

## 🚫 NO DEMO DATA POLICY

This document establishes the rules for data handling in the Venue Finder application. **Demo data is strictly prohibited** and all data must come from real user submissions stored in the Supabase database.

## 📋 Rules and Guidelines

### 1. **Data Sources**
- ✅ **ONLY** real data from Supabase database
- ✅ User-submitted venues through the application
- ✅ Authenticated user profiles and settings
- ✅ Real bookings and reviews
- ❌ **NO** hardcoded demo data
- ❌ **NO** placeholder data
- ❌ **NO** mock data arrays

### 2. **Venue Data Requirements**
- All venues must be submitted by authenticated users
- Venues must be approved by admin before appearing in listings
- Featured venues are automatically selected based on rating and activity
- No sample venues should be displayed if database is empty

### 3. **Display Logic**
- If no venues exist: Show "No venues available" message
- If no featured venues: Don't display featured section
- If no search results: Show "No venues found" message
- Always fetch data from database, never use static arrays

### 4. **Database Integration**
- All venue queries must use Supabase client
- Implement proper error handling for database failures
- Use loading states while fetching data
- Cache data appropriately for performance

### 5. **Component Requirements**
- Home page: Fetch featured venues from database
- Browse venues: Fetch all approved venues from database
- Venue details: Fetch single venue from database
- User dashboard: Fetch user's venues and bookings from database

## 🔧 Implementation Guidelines

### 1. **Data Fetching Pattern**
```typescript
// ✅ CORRECT - Fetch from database
const [venues, setVenues] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_approved', true)
        .eq('is_active', true);
      
      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchVenues();
}, []);
```

### 2. **Empty State Handling**
```typescript
// ✅ CORRECT - Handle empty data
if (loading) {
  return <LoadingSpinner />;
}

if (venues.length === 0) {
  return <NoVenuesMessage />;
}

return <VenuesList venues={venues} />;
```

### 3. **Error Handling**
```typescript
// ✅ CORRECT - Handle database errors
const [error, setError] = useState(null);

if (error) {
  return <ErrorMessage message="Failed to load venues" />;
}
```

## ❌ Forbidden Patterns

### 1. **Hardcoded Data Arrays**
```typescript
// ❌ FORBIDDEN - Hardcoded demo data
const venues = [
  { id: 1, name: 'Demo Venue 1', ... },
  { id: 2, name: 'Demo Venue 2', ... }
];
```

### 2. **Placeholder Data**
```typescript
// ❌ FORBIDDEN - Placeholder data
const venue = {
  name: 'Sample Venue',
  description: 'This is a sample venue...'
};
```

### 3. **Mock Data Objects**
```typescript
// ❌ FORBIDDEN - Mock data
const mockVenues = [
  { id: 'demo-1', name: 'Demo Venue' }
];
```

## ✅ Required Database Queries

### 1. **Featured Venues**
```sql
SELECT * FROM venues 
WHERE is_featured = TRUE 
  AND is_approved = TRUE 
  AND is_active = TRUE
ORDER BY rating DESC, created_at DESC
LIMIT 6;
```

### 2. **All Venues**
```sql
SELECT * FROM venues 
WHERE is_approved = TRUE 
  AND is_active = TRUE
ORDER BY created_at DESC;
```

### 3. **Filtered Venues**
```sql
SELECT * FROM venues 
WHERE is_approved = TRUE 
  AND is_active = TRUE
  AND (city ILIKE '%search%' OR name ILIKE '%search%')
  AND price_per_hour BETWEEN min_price AND max_price;
```

## 🎯 Quality Assurance

### 1. **Code Review Checklist**
- [ ] No hardcoded venue data arrays
- [ ] All data fetched from Supabase
- [ ] Proper loading states implemented
- [ ] Empty state handling included
- [ ] Error handling implemented
- [ ] Database queries optimized

### 2. **Testing Requirements**
- [ ] Test with empty database
- [ ] Test with single venue
- [ ] Test with multiple venues
- [ ] Test database connection failures
- [ ] Test loading states
- [ ] Test error states

### 3. **Performance Considerations**
- [ ] Implement data caching
- [ ] Use pagination for large datasets
- [ ] Optimize database queries
- [ ] Minimize unnecessary re-renders
- [ ] Use proper loading indicators

## 📝 Documentation Requirements

### 1. **Component Documentation**
- Document data source (Supabase table)
- Document loading states
- Document error handling
- Document empty states

### 2. **Database Schema**
- Keep SQL_README.md updated
- Document all table relationships
- Document query patterns
- Document performance optimizations

## 🚨 Enforcement

### 1. **Code Review Process**
- All pull requests must be reviewed for demo data
- Automated checks for hardcoded arrays
- Manual verification of data sources

### 2. **Testing Requirements**
- Unit tests must use real database queries
- Integration tests with actual Supabase
- No mock data in test suites

### 3. **Deployment Checks**
- Verify no demo data in production builds
- Database connection validation
- Real data verification in staging

## 📞 Support

For questions about this policy or implementation:
1. Check the SQL_README.md for database queries
2. Review existing components for patterns
3. Consult the development team
4. Refer to Supabase documentation

---

**Remember: Real data only. No exceptions.** 