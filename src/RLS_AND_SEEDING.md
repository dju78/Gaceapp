# Understanding RLS and Sample Data Seeding

## How RLS Policies Work with the Seeding Endpoint

### The Problem
Your database has Row Level Security (RLS) policies that prevent users from accessing data that doesn't belong to them:

```sql
-- Users can only SELECT their own data
create policy "tax_calculations_select_own"
  on public.tax_calculations for select
  using (auth.uid() = user_id);

-- Users can only INSERT their own data  
create policy "tax_calculations_insert_own"
  on public.tax_calculations for insert
  with check (auth.uid() = user_id);
```

These policies check that `auth.uid()` (the authenticated user) matches the `user_id` column in the data.

### The Solution
Our seeding endpoint uses the **Supabase Service Role Key** on the backend, which **bypasses RLS policies**.

```typescript
// In /supabase/functions/server/seed-data.tsx
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// This client has FULL access to the database, bypassing RLS
await supabase.from("assets").insert({ user_id: userId, ... });
```

### Why This Works

1. **Frontend calls backend with user's access token**
   ```javascript
   fetch('/seed/populate', {
     headers: { 'Authorization': `Bearer ${userAccessToken}` }
   })
   ```

2. **Backend verifies the user's identity**
   ```typescript
   // In verifyAuth middleware
   const { data: { user } } = await supabase.auth.getUser(token);
   const userId = user.id; // Verified user ID
   ```

3. **Backend uses Service Role Key to insert data**
   ```typescript
   // Service role bypasses RLS
   await supabase.from("assets").insert({
     user_id: userId, // We use the VERIFIED userId
     ...assetData
   });
   ```

4. **Data belongs to the correct user**
   - The `user_id` in the data matches the authenticated user
   - When the user queries their own data, RLS allows it
   - Other users cannot see this data due to RLS

### Security Considerations

✅ **This is SECURE because:**
- The backend verifies the user's identity using their access token
- The backend explicitly sets `user_id` to the verified user's ID
- The service role key is only used on the backend (never exposed to frontend)
- Each user can only seed data for themselves

❌ **This would be INSECURE if:**
- The frontend had direct access to the service role key
- The backend didn't verify the user's identity
- The backend allowed the user to specify any `user_id`

### Frontend vs Backend Access

| Operation | Access Level | Can Bypass RLS? | Use Case |
|-----------|--------------|-----------------|----------|
| Frontend queries with `publicAnonKey` | User-level | ❌ No | Normal app usage |
| Backend queries with `SERVICE_ROLE_KEY` | Admin-level | ✅ Yes | Seeding, admin operations |
| Direct SQL in Supabase Editor | Admin-level | ✅ Yes | Manual database management |

### Example Flow

```
User clicks "Populate Sample Data"
         ↓
Frontend sends POST /seed/populate with user's access token
         ↓
Backend verifyAuth middleware validates token → gets userId
         ↓
Backend seedSampleData(userId) function runs
         ↓
Backend uses SERVICE_ROLE_KEY to insert data with user_id = userId
         ↓
RLS policies are bypassed during INSERT
         ↓
Data is created with correct user_id
         ↓
User queries their data with their access token
         ↓
RLS policies ALLOW access (auth.uid() = user_id matches)
         ↓
User sees their sample data ✅
```

### When Frontend Queries Fail

If the frontend tries to INSERT directly:

```javascript
// ❌ This will FAIL with RLS enabled
const { data, error } = await supabase
  .from('tax_calculations')
  .insert({ user_id: userId, ... });

// Error: "new row violates row-level security policy"
```

Why? Because the frontend uses `publicAnonKey` which:
1. Has user-level permissions
2. Must pass RLS policy checks
3. The RLS policy checks `auth.uid() = user_id`
4. But there's no authenticated context when using service operations

### Best Practices

1. **Always use Service Role Key on the backend only**
   - ✅ Edge Functions (Deno Deploy)
   - ✅ Server-side API routes
   - ❌ Never in frontend code
   - ❌ Never in environment variables exposed to client

2. **Always verify user identity before using Service Role**
   ```typescript
   // Verify the user's token first
   const { data: { user } } = await supabase.auth.getUser(token);
   if (!user) return unauthorized();
   
   // Then use service role with verified userId
   await adminSupabase.from('table').insert({ user_id: user.id });
   ```

3. **Use RLS policies for frontend operations**
   ```typescript
   // Frontend queries automatically respect RLS
   const { data } = await supabase
     .from('tax_calculations')
     .select('*'); // Only returns current user's data
   ```

### Debugging RLS Issues

If you get "invalid claim: missing sub claim" or RLS errors:

1. **Check if RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Check if policies exist:**
   ```sql
   SELECT tablename, policyname, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **Verify the backend is using SERVICE_ROLE_KEY:**
   ```typescript
   console.log('Using key:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.substring(0, 20));
   ```

4. **Check the user's access token is valid:**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Token valid:', !!session?.access_token);
   ```

### Summary

✅ RLS policies protect user data in production  
✅ Service Role Key allows backend to seed data  
✅ Backend verifies user identity before seeding  
✅ Each user can only seed their own data  
✅ System is secure and compliant  

The seeding endpoint is designed to work seamlessly with your RLS setup while maintaining security!
