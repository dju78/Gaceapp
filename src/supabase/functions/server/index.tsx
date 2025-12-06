import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import adminRoutes from "./admin-routes.tsx";

const app = new Hono();

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Middleware to verify user authentication
async function verifyAuth(c: any, next: any) {
  const authHeader = c.req.header("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error("Auth verification error:", error);
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  c.set("userId", user.id);
  c.set("user", user);
  await next();
}

// Health check endpoint
app.get("/make-server-b5fd51b8/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug endpoint - Check environment variables (DO NOT USE IN PRODUCTION)
app.get("/make-server-b5fd51b8/debug/env", (c) => {
  return c.json({
    hasSupabaseUrl: !!Deno.env.get("SUPABASE_URL"),
    hasServiceRoleKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    hasAnonKey: !!Deno.env.get("SUPABASE_ANON_KEY"),
    hasDbUrl: !!Deno.env.get("SUPABASE_DB_URL"),
    supabaseUrlPreview: Deno.env.get("SUPABASE_URL")?.substring(0, 30) + "...",
    denoVersion: Deno.version.deno,
  });
});

// ==============================================
// AUTH / USER PROFILE ROUTES
// ==============================================

// Get user profile (does NOT require auth - uses service role)
app.post("/make-server-b5fd51b8/auth/get-profile", async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;
    
    if (!userId) {
      return c.json({ error: "Missing userId" }, 400);
    }
    
    // Use service role to bypass RLS
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return c.json({ error: "Failed to fetch profile", details: error.message }, 500);
    }
    
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }
    
    return c.json({ profile }, 200);
  } catch (error) {
    console.error("Unexpected error in POST /auth/get-profile:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create user profile (called after auth.signUp)
// This bypasses RLS by using service role key
app.post("/make-server-b5fd51b8/auth/create-profile", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, fullName, userType, companyName } = body;
    
    if (!userId || !email || !fullName || !userType) {
      return c.json({ 
        error: "Missing required fields: userId, email, fullName, userType" 
      }, 400);
    }
    
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    
    // If profile exists for this user ID, return it (idempotent)
    if (existingProfile) {
      console.log("Profile already exists for user ID, returning existing profile");
      return c.json({ profile: existingProfile }, 200);
    }
    
    // Check if email is already taken by a different user
    const { data: emailCheck, error: emailError } = await supabase
      .from("user_profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();
    
    if (emailCheck && emailCheck.id !== userId) {
      console.error("Email already registered to different user:", email);
      return c.json({ 
        error: "This email is already registered. Please sign in instead or use a different email." 
      }, 409);
    }
    
    // Use service role to bypass RLS
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        email: email,
        user_type: userType,
        full_name: fullName,
        company_name: companyName || null,
        has_completed_onboarding: false,
        admin_role: userType === "admin" ? "support" : null,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating user profile:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
      
      // Check if profile already exists (race condition)
      if (error.code === "23505") {
        // Try to fetch the existing profile
        const { data: existing } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        
        if (existing) {
          console.log("Profile was created by concurrent request, returning it");
          return c.json({ profile: existing }, 200);
        }
        
        return c.json({ 
          error: "This email is already registered. Please sign in instead." 
        }, 409);
      }
      
      // Return detailed error for debugging
      return c.json({ 
        error: "Failed to create profile",
        details: error.message,
        code: error.code,
        hint: error.hint
      }, 500);
    }
    
    return c.json({ profile }, 201);
  } catch (error) {
    console.error("Unexpected error in POST /auth/create-profile:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// NEW: Complete signup endpoint using admin API (auto-confirms email)
app.post("/make-server-b5fd51b8/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, fullName, userType, companyName } = body;
    
    if (!email || !password || !fullName || !userType) {
      return c.json({ 
        error: "Missing required fields: email, password, fullName, userType" 
      }, 400);
    }
    
    // Validate password length
    if (password.length < 6) {
      return c.json({ 
        error: "Password must be at least 6 characters long" 
      }, 400);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ 
        error: "Invalid email format" 
      }, 400);
    }
    
    console.log("[Signup] Creating user with admin API:", email, userType);
    
    // First check if user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (!listError) {
      const existingUser = users.find((u) => u.email === email);
      if (existingUser) {
        console.log("[Signup] User already exists:", email);
        return c.json({ 
          error: "This email is already registered. Please sign in instead or use a different email." 
        }, 409);
      }
    }
    
    // Use admin API to create user with email_confirm: true
    // This bypasses email confirmation requirement
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
        user_type: userType,
        company_name: companyName,
      },
      // Automatically confirm the user's email since email server isn't configured
      email_confirm: true,
    });
    
    if (authError) {
      console.error("[Signup] Auth error:", authError);
      
      // Check for duplicate user
      if (authError.message?.includes("already") || authError.message?.includes("exists")) {
        return c.json({ 
          error: "This email is already registered. Please sign in instead or use a different email." 
        }, 409);
      }
      
      return c.json({ error: authError.message }, 400);
    }
    
    if (!authData.user) {
      console.error("[Signup] No user returned from admin.createUser");
      return c.json({ error: "Failed to create user" }, 500);
    }
    
    console.log("[Signup] User created successfully:", authData.user.id);
    
    // Create profile in database
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        email: email,
        user_type: userType,
        full_name: fullName,
        company_name: companyName || null,
        has_completed_onboarding: false,
        admin_role: userType === "admin" ? "support" : null,
      })
      .select()
      .single();
    
    if (profileError) {
      console.error("[Signup] Profile creation error:", profileError);
      
      // If profile creation fails, clean up the auth user
      try {
        console.log("[Signup] Attempting to delete auth user due to profile creation failure...");
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log("[Signup] Successfully cleaned up auth user after profile creation failure");
      } catch (cleanupError) {
        console.error("[Signup] Failed to cleanup auth user:", cleanupError);
      }
      
      // Check if it's a duplicate email error
      if (profileError.code === "23505") {
        return c.json({ 
          error: "This email is already registered. Please sign in instead or use a different email." 
        }, 409);
      }
      
      return c.json({ 
        error: "Failed to create user profile. Please try again.",
        details: profileError.message 
      }, 500);
    }
    
    console.log("[Signup] Profile created successfully:", profile);
    
    return c.json({ 
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      profile 
    }, 201);
    
  } catch (error) {
    console.error("[Signup] Unexpected error:", error);
    return c.json({ error: "Internal server error. Please try again." }, 500);
  }
});

// ==============================================
// ADMIN ROUTES
// ==============================================

// Delete user (for testing/cleanup purposes)
app.post("/make-server-b5fd51b8/admin/delete-user", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    console.log("[Admin] Deleting user with email:", email);
    
    // Find user by email in auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("[Admin] Error listing users:", listError);
      return c.json({ error: "Failed to find user" }, 500);
    }
    
    const user = users.find((u) => u.email === email);
    
    if (!user) {
      console.log("[Admin] User not found in auth:", email);
      
      // Still try to delete from profiles table in case it's orphaned
      const { error: profileDeleteError } = await supabase
        .from("user_profiles")
        .delete()
        .eq("email", email);
      
      if (profileDeleteError) {
        console.error("[Admin] Error deleting orphaned profile:", profileDeleteError);
      } else {
        console.log("[Admin] Deleted orphaned profile for:", email);
      }
      
      return c.json({ 
        message: "User not found in auth, but cleaned up any orphaned profile data" 
      }, 200);
    }
    
    console.log("[Admin] Found user:", user.id);
    
    // Delete from profiles table first
    const { error: profileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", user.id);
    
    if (profileError) {
      console.error("[Admin] Error deleting profile:", profileError);
      // Continue anyway to delete auth user
    } else {
      console.log("[Admin] Deleted profile for user:", user.id);
    }
    
    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (authError) {
      console.error("[Admin] Error deleting auth user:", authError);
      return c.json({ 
        error: "Failed to delete user from auth",
        details: authError.message 
      }, 500);
    }
    
    console.log("[Admin] Successfully deleted user:", email);
    
    return c.json({ 
      message: `Successfully deleted user: ${email}`,
      userId: user.id
    }, 200);
    
  } catch (error) {
    console.error("[Admin] Unexpected error in delete-user:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==============================================
// ASSET ROUTES
// ==============================================

// Get all assets for authenticated user
app.get("/make-server-b5fd51b8/assets", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    
    const { data: assets, error } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching assets:", error);
      return c.json({ error: "Failed to fetch assets" }, 500);
    }
    
    return c.json({ assets });
  } catch (error) {
    console.error("Unexpected error in GET /assets:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get single asset by ID
app.get("/make-server-b5fd51b8/assets/:id", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const assetId = c.req.param("id");
    
    const { data: asset, error } = await supabase
      .from("assets")
      .select("*")
      .eq("id", assetId)
      .eq("user_id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching asset:", error);
      return c.json({ error: "Asset not found" }, 404);
    }
    
    return c.json({ asset });
  } catch (error) {
    console.error("Unexpected error in GET /assets/:id:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create new asset
app.post("/make-server-b5fd51b8/assets", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    
    const { data: asset, error } = await supabase
      .from("assets")
      .insert({
        user_id: userId,
        asset_type: body.asset_type,
        country: body.country,
        description: body.description,
        value_gbp: body.value_gbp,
        value_local: body.value_local,
        local_currency: body.local_currency,
        acquisition_date: body.acquisition_date,
        ownership_percentage: body.ownership_percentage || 100,
        tax_paid_locally: body.tax_paid_locally || 0,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating asset:", error);
      return c.json({ error: "Failed to create asset" }, 500);
    }
    
    return c.json({ asset }, 201);
  } catch (error) {
    console.error("Unexpected error in POST /assets:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update asset
app.put("/make-server-b5fd51b8/assets/:id", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const assetId = c.req.param("id");
    const body = await c.req.json();
    
    const { data: asset, error } = await supabase
      .from("assets")
      .update({
        asset_type: body.asset_type,
        country: body.country,
        description: body.description,
        value_gbp: body.value_gbp,
        value_local: body.value_local,
        local_currency: body.local_currency,
        acquisition_date: body.acquisition_date,
        ownership_percentage: body.ownership_percentage,
        tax_paid_locally: body.tax_paid_locally,
      })
      .eq("id", assetId)
      .eq("user_id", userId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating asset:", error);
      return c.json({ error: "Failed to update asset" }, 500);
    }
    
    return c.json({ asset });
  } catch (error) {
    console.error("Unexpected error in PUT /assets/:id:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete asset
app.delete("/make-server-b5fd51b8/assets/:id", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const assetId = c.req.param("id");
    
    const { error } = await supabase
      .from("assets")
      .delete()
      .eq("id", assetId)
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error deleting asset:", error);
      return c.json({ error: "Failed to delete asset" }, 500);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in DELETE /assets/:id:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get asset analytics
app.get("/make-server-b5fd51b8/assets/analytics/summary", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    
    const { data: assets, error } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error fetching assets for analytics:", error);
      return c.json({ error: "Failed to fetch analytics" }, 500);
    }
    
    // Calculate analytics
    const totalValueGBP = assets.reduce((sum, a) => sum + Number(a.value_gbp || 0), 0);
    const assetCount = assets.length;
    
    const byCountry = assets.reduce((acc: any, asset) => {
      const country = asset.country || "Unknown";
      if (!acc[country]) {
        acc[country] = { count: 0, totalValue: 0 };
      }
      acc[country].count++;
      acc[country].totalValue += Number(asset.value_gbp || 0);
      return acc;
    }, {});
    
    const byType = assets.reduce((acc: any, asset) => {
      const type = asset.asset_type || "other";
      if (!acc[type]) {
        acc[type] = { count: 0, totalValue: 0 };
      }
      acc[type].count++;
      acc[type].totalValue += Number(asset.value_gbp || 0);
      return acc;
    }, {});
    
    return c.json({
      totalValueGBP,
      assetCount,
      byCountry,
      byType,
    });
  } catch (error) {
    console.error("Unexpected error in GET /assets/analytics/summary:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==============================================
// TAX CALCULATION ROUTES
// ==============================================

// Save tax calculation
app.post("/make-server-b5fd51b8/tax/calculate", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    
    const { data: calculation, error } = await supabase
      .from("tax_calculations")
      .insert({
        user_id: userId,
        tax_year: body.tax_year,
        total_foreign_income: body.total_foreign_income,
        total_uk_income: body.total_uk_income,
        total_foreign_tax_paid: body.total_foreign_tax_paid,
        uk_tax_liability: body.uk_tax_liability,
        dta_relief: body.dta_relief,
        net_tax_owed: body.net_tax_owed,
        calculation_data: body.calculation_data,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error saving tax calculation:", error);
      return c.json({ error: "Failed to save calculation" }, 500);
    }
    
    return c.json({ calculation }, 201);
  } catch (error) {
    console.error("Unexpected error in POST /tax/calculate:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get tax calculation history
app.get("/make-server-b5fd51b8/tax/history", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    
    const { data: calculations, error } = await supabase
      .from("tax_calculations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (error) {
      console.error("Error fetching tax history:", error);
      return c.json({ error: "Failed to fetch history" }, 500);
    }
    
    return c.json({ calculations });
  } catch (error) {
    console.error("Unexpected error in GET /tax/history:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==============================================
// DOCUMENT ROUTES
// ==============================================

// Upload a document with file storage
app.post("/make-server-b5fd51b8/documents/upload", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const formData = await c.req.formData();
    
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;
    const assetId = formData.get("assetId") as string | null;
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }
    
    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "text/csv"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "Invalid file type. Only PDF, JPG, PNG, and CSV are allowed." }, 400);
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return c.json({ error: "File too large. Maximum size is 10MB." }, 400);
    }
    
    // Create unique file path
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("make-b5fd51b8-documents")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });
    
    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return c.json({ error: "Failed to upload file" }, 500);
    }
    
    // Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        asset_id: assetId || null,
        document_type: documentType || "other",
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        upload_date: new Date().toISOString(),
        ocr_status: "pending",
      })
      .select()
      .single();
    
    if (dbError) {
      console.error("Error saving document metadata:", dbError);
      // Cleanup: delete uploaded file
      await supabase.storage.from("make-b5fd51b8-documents").remove([fileName]);
      return c.json({ error: "Failed to save document metadata" }, 500);
    }
    
    return c.json({ document, message: "Document uploaded successfully" });
  } catch (error) {
    console.error("Unexpected error in POST /documents/upload:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get signed URL for a document
app.get("/make-server-b5fd51b8/documents/:id/url", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const documentId = c.req.param("id");
    
    // Get document from database
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();
    
    if (fetchError || !document) {
      return c.json({ error: "Document not found" }, 404);
    }
    
    // Generate signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from("make-b5fd51b8-documents")
      .createSignedUrl(document.file_path, 3600);
    
    if (urlError) {
      console.error("Error generating signed URL:", urlError);
      return c.json({ error: "Failed to generate download URL" }, 500);
    }
    
    return c.json({ url: urlData.signedUrl });
  } catch (error) {
    console.error("Unexpected error in GET /documents/:id/url:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete a document
app.delete("/make-server-b5fd51b8/documents/:id", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const documentId = c.req.param("id");
    
    // Get document to find file path
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();
    
    if (fetchError || !document) {
      return c.json({ error: "Document not found" }, 404);
    }
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("make-b5fd51b8-documents")
      .remove([document.file_path]);
    
    if (storageError) {
      console.error("Error deleting file from storage:", storageError);
      // Continue anyway to delete database record
    }
    
    // Delete from database
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", userId);
    
    if (deleteError) {
      console.error("Error deleting document from database:", deleteError);
      return c.json({ error: "Failed to delete document" }, 500);
    }
    
    return c.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Unexpected error in DELETE /documents/:id:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all documents for user
app.get("/make-server-b5fd51b8/documents", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    
    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("upload_date", { ascending: false });
    
    if (error) {
      console.error("Error fetching documents:", error);
      return c.json({ error: "Failed to fetch documents" }, 500);
    }
    
    return c.json({ documents });
  } catch (error) {
    console.error("Unexpected error in GET /documents:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update document metadata (e.g., after OCR processing)
app.put("/make-server-b5fd51b8/documents/:id", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const documentId = c.req.param("id");
    const body = await c.req.json();
    
    const { data: document, error } = await supabase
      .from("documents")
      .update({
        ocr_status: body.ocr_status,
        extracted_data: body.extracted_data,
      })
      .eq("id", documentId)
      .eq("user_id", userId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating document:", error);
      return c.json({ error: "Failed to update document" }, 500);
    }
    
    return c.json({ document });
  } catch (error) {
    console.error("Unexpected error in PUT /documents/:id:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Process document with OCR (simulated for now)
app.post("/make-server-b5fd51b8/documents/:id/process", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const documentId = c.req.param("id");
    
    // Get document
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();
    
    if (fetchError || !document) {
      return c.json({ error: "Document not found" }, 404);
    }
    
    // Update status to processing
    await supabase
      .from("documents")
      .update({ ocr_status: "processing" })
      .eq("id", documentId);
    
    // Simulate OCR processing (in production, call Tesseract.js or Cloud Vision API)
    // For now, extract mock data based on document type
    let extractedData: any = {};
    
    if (document.document_type === "bank_statement") {
      extractedData = {
        documentType: "bank_statement",
        currency: "GBP",
        accountNumber: "****1234",
        transactions: [
          { date: "2025-01-15", description: "Salary", amount: 3500 },
          { date: "2025-01-20", description: "Transfer", amount: -500 },
        ],
        totalIncome: 3500,
        totalExpenses: 500,
      };
    } else if (document.document_type === "property_deed") {
      extractedData = {
        documentType: "property_deed",
        propertyAddress: "123 Example St, Lagos, Nigeria",
        purchasePrice: 50000000, // NGN
        currency: "NGN",
        purchaseDate: "2024-06-15",
      };
    }
    
    // Update document with extracted data
    const { data: updatedDoc, error: updateError } = await supabase
      .from("documents")
      .update({
        ocr_status: "completed",
        extracted_data: extractedData,
      })
      .eq("id", documentId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating document with OCR data:", updateError);
      return c.json({ error: "Failed to process document" }, 500);
    }
    
    return c.json({ document: updatedDoc });
  } catch (error) {
    console.error("Unexpected error in POST /documents/:id/process:", error);
    
    // Mark as failed
    await supabase
      .from("documents")
      .update({ ocr_status: "failed" })
      .eq("id", c.req.param("id"));
    
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==============================================
// COMPLIANCE ALERTS ROUTES
// ==============================================

// Get all alerts for user
app.get("/make-server-b5fd51b8/alerts", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    
    const { data: alerts, error } = await supabase
      .from("compliance_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching alerts:", error);
      return c.json({ error: "Failed to fetch alerts" }, 500);
    }
    
    return c.json({ alerts });
  } catch (error) {
    console.error("Unexpected error in GET /alerts:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Mark alert as read
app.put("/make-server-b5fd51b8/alerts/:id/read", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const alertId = c.req.param("id");
    
    const { data: alert, error } = await supabase
      .from("compliance_alerts")
      .update({ is_read: true })
      .eq("id", alertId)
      .eq("user_id", userId)
      .select()
      .single();
    
    if (error) {
      console.error("Error marking alert as read:", error);
      return c.json({ error: "Failed to update alert" }, 500);
    }
    
    return c.json({ alert });
  } catch (error) {
    console.error("Unexpected error in PUT /alerts/:id/read:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Mark alert as resolved
app.put("/make-server-b5fd51b8/alerts/:id/resolve", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const alertId = c.req.param("id");
    
    const { data: alert, error } = await supabase
      .from("compliance_alerts")
      .update({ is_resolved: true })
      .eq("id", alertId)
      .eq("user_id", userId)
      .select()
      .single();
    
    if (error) {
      console.error("Error marking alert as resolved:", error);
      return c.json({ error: "Failed to update alert" }, 500);
    }
    
    return c.json({ alert });
  } catch (error) {
    console.error("Unexpected error in PUT /alerts/:id/resolve:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);