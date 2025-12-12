import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import adminRoutes from "./admin-routes.tsx";
import { DEMO_USERS, generateDemoTaxCalculation, getDemoCredentialsSummary } from "./demo-data.tsx";
import { handlePdfGeneration } from "./pdf-generator.tsx";
import { seedSampleData, getSampleReportData } from "./seed-data.tsx";

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
    console.error("Auth verification failed: Missing or invalid authorization header");
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  console.log("Verifying token (first 30 chars):", token.substring(0, 30) + "...");
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error("Auth verification error:", error);
    console.error("Error details:", {
      message: error?.message,
      status: error?.status,
      name: error?.name
    });
    return c.json({ error: "Unauthorized", details: error?.message || "Invalid token" }, 401);
  }
  
  console.log("Auth verification successful for user:", user.id);
  c.set("userId", user.id);
  c.set("user", user);
  await next();
}

// Health check endpoint
app.get("/make-server-b5fd51b8/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test auth endpoint - checks if a token is valid without using middleware
app.post("/make-server-b5fd51b8/test-auth", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader) {
      return c.json({ 
        valid: false, 
        error: "No Authorization header provided",
        hint: "Include 'Authorization: Bearer <token>' header"
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return c.json({ 
        valid: false, 
        error: "Invalid Authorization format",
        hint: "Must start with 'Bearer '",
        received: authHeader.substring(0, 20)
      });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Testing token (first 30 chars):", token.substring(0, 30) + "...");
    console.log("Token length:", token.length);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return c.json({ 
        valid: false, 
        error: error.message,
        errorName: error.name,
        errorStatus: error.status,
        tokenPreview: token.substring(0, 30) + "..."
      });
    }
    
    if (!user) {
      return c.json({ 
        valid: false, 
        error: "No user found for token"
      });
    }
    
    return c.json({ 
      valid: true, 
      userId: user.id,
      email: user.email,
      message: "Token is valid!"
    });
    
  } catch (error) {
    console.error("Error in test-auth:", error);
    return c.json({ 
      valid: false, 
      error: "Internal server error",
      details: String(error)
    }, 500);
  }
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

// Generate Self Assessment PDF
app.post("/make-server-b5fd51b8/tax/generate-pdf", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const user = c.get("user");
    const body = await c.req.json();
    
    console.log(`[PDF] Generating PDF for user ${userId}, tax year ${body.taxYear}`);
    
    // Get tax calculation for the specified year
    const taxYearStr = `${body.taxYear || new Date().getFullYear()}/${(body.taxYear || new Date().getFullYear()) + 1}`;
    
    const { data: calculation, error: calcError } = await supabase
      .from("tax_calculations")
      .select("*")
      .eq("user_id", userId)
      .eq("tax_year", taxYearStr)
      .maybeSingle();
    
    if (calcError) {
      console.error("[PDF] Error fetching calculation:", calcError);
      return c.json({ error: "Failed to fetch tax calculation" }, 500);
    }
    
    if (!calculation) {
      console.log("[PDF] No calculation found for tax year:", taxYearStr);
      return c.json({ error: "No tax calculation found for this year" }, 404);
    }
    
    // Get latest snapshot
    const { data: snapshot, error: snapError } = await supabase
      .from("tax_calculation_snapshots")
      .select("*")
      .eq("calculation_id", calculation.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (snapError || !snapshot) {
      console.error("[PDF] Error fetching snapshot:", snapError);
      return c.json({ error: "No calculation snapshot found" }, 404);
    }
    
    console.log(`[PDF] Found snapshot version ${snapshot.version} for calculation ${calculation.id}`);
    
    // Use handlePdfGeneration to get HTML
    const result = await handlePdfGeneration(calculation.id, userId);
    
    if (!result.success || !result.html) {
      console.error("[PDF] Failed to generate HTML:", result.error);
      return c.json({ error: result.error || "Failed to generate PDF" }, 500);
    }
    
    console.log("[PDF] HTML generated successfully, returning to client");
    
    // Return HTML and snapshot for client-side processing
    return c.json({
      success: true,
      html: result.html,
      snapshot: result.snapshot,
      calculation: {
        id: calculation.id,
        tax_year: calculation.tax_year,
        status: calculation.status,
        total_tax_due: calculation.total_tax_due,
        amount_due_by_31jan: calculation.amount_due_by_31jan,
      },
    });
  } catch (error) {
    console.error("Unexpected error in POST /tax/generate-pdf:", error);
    return c.json({ error: "Internal server error", details: String(error) }, 500);
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

// ==============================================
// DEMO DATA SEEDING ROUTES
// ==============================================

// Get demo credentials (no auth required)
app.get("/make-server-b5fd51b8/demo/credentials", (c) => {
  return c.text(getDemoCredentialsSummary());
});

// Seed demo data (creates all demo users with assets)
app.post("/make-server-b5fd51b8/demo/seed", async (c) => {
  try {
    console.log("[Demo] Starting demo data seeding...");
    
    const results = [];
    const errors = [];
    
    for (const demoUser of DEMO_USERS) {
      try {
        console.log(`[Demo] Creating user: ${demoUser.email}`);
        
        // Check if user already exists
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find((u) => u.email === demoUser.email);
        
        let userId: string;
        
        if (existingUser) {
          console.log(`[Demo] User already exists: ${demoUser.email}, skipping auth creation`);
          userId = existingUser.id;
        } else {
          // Create auth user with admin API
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: demoUser.email,
            password: demoUser.password,
            user_metadata: {
              full_name: demoUser.fullName,
              user_type: demoUser.userType,
              company_name: demoUser.companyName,
            },
            email_confirm: true,
          });
          
          if (authError) {
            console.error(`[Demo] Auth error for ${demoUser.email}:`, authError);
            errors.push({ email: demoUser.email, error: authError.message });
            continue;
          }
          
          userId = authData.user!.id;
          console.log(`[Demo] Created auth user: ${userId}`);
        }
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        
        if (!existingProfile) {
          // Create profile
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert({
              id: userId,
              email: demoUser.email,
              user_type: demoUser.userType,
              full_name: demoUser.fullName,
              company_name: demoUser.companyName || null,
              has_completed_onboarding: true, // Mark demo users as onboarded
              admin_role: demoUser.userType === "admin" ? "support" : null,
            });
          
          if (profileError) {
            console.error(`[Demo] Profile error for ${demoUser.email}:`, profileError);
            errors.push({ email: demoUser.email, error: profileError.message });
            continue;
          }
          console.log(`[Demo] Created profile for: ${demoUser.email}`);
        } else {
          console.log(`[Demo] Profile already exists for: ${demoUser.email}`);
        }
        
        // Create assets
        if (demoUser.assets.length > 0) {
          // Check if assets already exist
          const { data: existingAssets } = await supabase
            .from("assets")
            .select("id")
            .eq("user_id", userId);
          
          if (!existingAssets || existingAssets.length === 0) {
            const assetsToInsert = demoUser.assets.map((asset) => ({
              user_id: userId,
              ...asset,
            }));
            
            const { error: assetsError } = await supabase
              .from("assets")
              .insert(assetsToInsert);
            
            if (assetsError) {
              console.error(`[Demo] Assets error for ${demoUser.email}:`, assetsError);
              errors.push({ email: demoUser.email, error: assetsError.message });
            } else {
              console.log(`[Demo] Created ${demoUser.assets.length} assets for: ${demoUser.email}`);
            }
          } else {
            console.log(`[Demo] Assets already exist for: ${demoUser.email}`);
          }
          
          // Create sample tax calculations for the last 2 years
          const currentYear = new Date().getFullYear();
          for (let year = currentYear - 1; year <= currentYear; year++) {
            const { data: existingCalc } = await supabase
              .from("tax_calculations")
              .select("id")
              .eq("user_id", userId)
              .eq("tax_year", year)
              .maybeSingle();
            
            if (!existingCalc) {
              const taxCalc = generateDemoTaxCalculation(userId, demoUser.assets, year);
              
              const { error: calcError } = await supabase
                .from("tax_calculations")
                .insert(taxCalc);
              
              if (calcError) {
                console.error(`[Demo] Tax calc error for ${demoUser.email} year ${year}:`, calcError);
              } else {
                console.log(`[Demo] Created tax calculation for ${demoUser.email} year ${year}`);
              }
            }
          }
          
          // Create sample compliance alerts
          const { data: existingAlerts } = await supabase
            .from("compliance_alerts")
            .select("id")
            .eq("user_id", userId);
          
          if (!existingAlerts || existingAlerts.length === 0) {
            const alerts = [
              {
                user_id: userId,
                alert_type: "deadline",
                severity: "high",
                title: "Self Assessment Deadline Approaching",
                message: "Your Self Assessment tax return for 2024/25 is due by 31 January 2026. Ensure all foreign income is declared.",
                is_read: false,
                is_resolved: false,
              },
              {
                user_id: userId,
                alert_type: "compliance",
                severity: "medium",
                title: "Foreign Assets Over £100,000",
                message: "Your overseas assets exceed £100,000. You may need to complete additional HMRC forms for offshore reporting.",
                is_read: false,
                is_resolved: false,
              },
            ];
            
            const { error: alertsError } = await supabase
              .from("compliance_alerts")
              .insert(alerts);
            
            if (alertsError) {
              console.error(`[Demo] Alerts error for ${demoUser.email}:`, alertsError);
            } else {
              console.log(`[Demo] Created ${alerts.length} alerts for: ${demoUser.email}`);
            }
          }
        }
        
        results.push({
          email: demoUser.email,
          userId,
          assetsCreated: demoUser.assets.length,
          scenario: demoUser.scenario,
        });
        
      } catch (userError) {
        console.error(`[Demo] Error processing user ${demoUser.email}:`, userError);
        errors.push({ email: demoUser.email, error: String(userError) });
      }
    }
    
    console.log(`[Demo] Seeding complete. Success: ${results.length}, Errors: ${errors.length}`);
    
    return c.json({
      success: true,
      message: `Demo data seeded successfully`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      credentials: getDemoCredentialsSummary(),
    });
    
  } catch (error) {
    console.error("[Demo] Unexpected error in demo seeding:", error);
    return c.json({ error: "Internal server error during demo seeding" }, 500);
  }
});

// Clear all demo data (for cleanup)
app.post("/make-server-b5fd51b8/demo/clear", async (c) => {
  try {
    console.log("[Demo] Clearing all demo data...");
    
    const results = [];
    
    for (const demoUser of DEMO_USERS) {
      try {
        // Find user
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const user = users.find((u) => u.email === demoUser.email);
        
        if (user) {
          // Delete related data first (cascading should handle some of this)
          await supabase.from("assets").delete().eq("user_id", user.id);
          await supabase.from("tax_calculations").delete().eq("user_id", user.id);
          await supabase.from("compliance_alerts").delete().eq("user_id", user.id);
          await supabase.from("documents").delete().eq("user_id", user.id);
          await supabase.from("user_profiles").delete().eq("id", user.id);
          
          // Delete auth user
          await supabase.auth.admin.deleteUser(user.id);
          
          console.log(`[Demo] Deleted user: ${demoUser.email}`);
          results.push({ email: demoUser.email, deleted: true });
        } else {
          results.push({ email: demoUser.email, deleted: false, reason: "not found" });
        }
      } catch (userError) {
        console.error(`[Demo] Error deleting user ${demoUser.email}:`, userError);
        results.push({ email: demoUser.email, deleted: false, error: String(userError) });
      }
    }
    
    return c.json({
      success: true,
      message: "Demo data cleared",
      results,
    });
    
  } catch (error) {
    console.error("[Demo] Unexpected error in demo clearing:", error);
    return c.json({ error: "Internal server error during demo clearing" }, 500);
  }
});

// Seed sample data (for testing purposes)
app.post("/make-server-b5fd51b8/sample/seed", async (c) => {
  try {
    console.log("[Sample] Starting sample data seeding...");
    
    const results = [];
    const errors = [];
    
    for (const sampleUser of DEMO_USERS) {
      try {
        console.log(`[Sample] Creating user: ${sampleUser.email}`);
        
        // Check if user already exists
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find((u) => u.email === sampleUser.email);
        
        let userId: string;
        
        if (existingUser) {
          console.log(`[Sample] User already exists: ${sampleUser.email}, skipping auth creation`);
          userId = existingUser.id;
        } else {
          // Create auth user with admin API
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: sampleUser.email,
            password: sampleUser.password,
            user_metadata: {
              full_name: sampleUser.fullName,
              user_type: sampleUser.userType,
              company_name: sampleUser.companyName,
            },
            email_confirm: true,
          });
          
          if (authError) {
            console.error(`[Sample] Auth error for ${sampleUser.email}:`, authError);
            errors.push({ email: sampleUser.email, error: authError.message });
            continue;
          }
          
          userId = authData.user!.id;
          console.log(`[Sample] Created auth user: ${userId}`);
        }
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        
        if (!existingProfile) {
          // Create profile
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert({
              id: userId,
              email: sampleUser.email,
              user_type: sampleUser.userType,
              full_name: sampleUser.fullName,
              company_name: sampleUser.companyName || null,
              has_completed_onboarding: true, // Mark demo users as onboarded
              admin_role: sampleUser.userType === "admin" ? "support" : null,
            });
          
          if (profileError) {
            console.error(`[Sample] Profile error for ${sampleUser.email}:`, profileError);
            errors.push({ email: sampleUser.email, error: profileError.message });
            continue;
          }
          console.log(`[Sample] Created profile for: ${sampleUser.email}`);
        } else {
          console.log(`[Sample] Profile already exists for: ${sampleUser.email}`);
        }
        
        // Create assets
        if (sampleUser.assets.length > 0) {
          // Check if assets already exist
          const { data: existingAssets } = await supabase
            .from("assets")
            .select("id")
            .eq("user_id", userId);
          
          if (!existingAssets || existingAssets.length === 0) {
            const assetsToInsert = sampleUser.assets.map((asset) => ({
              user_id: userId,
              ...asset,
            }));
            
            const { error: assetsError } = await supabase
              .from("assets")
              .insert(assetsToInsert);
            
            if (assetsError) {
              console.error(`[Sample] Assets error for ${sampleUser.email}:`, assetsError);
              errors.push({ email: sampleUser.email, error: assetsError.message });
            } else {
              console.log(`[Sample] Created ${sampleUser.assets.length} assets for: ${sampleUser.email}`);
            }
          } else {
            console.log(`[Sample] Assets already exist for: ${sampleUser.email}`);
          }
          
          // Create sample tax calculations for the last 2 years
          const currentYear = new Date().getFullYear();
          for (let year = currentYear - 1; year <= currentYear; year++) {
            const { data: existingCalc } = await supabase
              .from("tax_calculations")
              .select("id")
              .eq("user_id", userId)
              .eq("tax_year", year)
              .maybeSingle();
            
            if (!existingCalc) {
              const taxCalc = generateDemoTaxCalculation(userId, sampleUser.assets, year);
              
              const { error: calcError } = await supabase
                .from("tax_calculations")
                .insert(taxCalc);
              
              if (calcError) {
                console.error(`[Sample] Tax calc error for ${sampleUser.email} year ${year}:`, calcError);
              } else {
                console.log(`[Sample] Created tax calculation for ${sampleUser.email} year ${year}`);
              }
            }
          }
          
          // Create sample compliance alerts
          const { data: existingAlerts } = await supabase
            .from("compliance_alerts")
            .select("id")
            .eq("user_id", userId);
          
          if (!existingAlerts || existingAlerts.length === 0) {
            const alerts = [
              {
                user_id: userId,
                alert_type: "deadline",
                severity: "high",
                title: "Self Assessment Deadline Approaching",
                message: "Your Self Assessment tax return for 2024/25 is due by 31 January 2026. Ensure all foreign income is declared.",
                is_read: false,
                is_resolved: false,
              },
              {
                user_id: userId,
                alert_type: "compliance",
                severity: "medium",
                title: "Foreign Assets Over £100,000",
                message: "Your overseas assets exceed £100,000. You may need to complete additional HMRC forms for offshore reporting.",
                is_read: false,
                is_resolved: false,
              },
            ];
            
            const { error: alertsError } = await supabase
              .from("compliance_alerts")
              .insert(alerts);
            
            if (alertsError) {
              console.error(`[Sample] Alerts error for ${sampleUser.email}:`, alertsError);
            } else {
              console.log(`[Sample] Created ${alerts.length} alerts for: ${sampleUser.email}`);
            }
          }
        }
        
        results.push({
          email: sampleUser.email,
          userId,
          assetsCreated: sampleUser.assets.length,
          scenario: sampleUser.scenario,
        });
        
      } catch (userError) {
        console.error(`[Sample] Error processing user ${sampleUser.email}:`, userError);
        errors.push({ email: sampleUser.email, error: String(userError) });
      }
    }
    
    console.log(`[Sample] Seeding complete. Success: ${results.length}, Errors: ${errors.length}`);
    
    return c.json({
      success: true,
      message: `Sample data seeded successfully`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      credentials: getDemoCredentialsSummary(),
    });
    
  } catch (error) {
    console.error("[Sample] Unexpected error in sample seeding:", error);
    return c.json({ error: "Internal server error during sample seeding" }, 500);
  }
});

// Get sample report data (for testing purposes)
app.get("/make-server-b5fd51b8/sample/report-data", (c) => {
  return c.json(getSampleReportData());
});

// Seed sample data for authenticated user
app.post("/make-server-b5fd51b8/seed/populate", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    console.log(`[Seed] Populating sample data for user: ${userId}`);
    
    const result = await seedSampleData(userId);
    
    return c.json({
      success: true,
      message: "Sample data populated successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("[Seed] Error populating sample data:", error);
    return c.json({ 
      error: "Failed to populate sample data", 
      details: String(error) 
    }, 500);
  }
});

// Get comprehensive sample report data for authenticated user
app.get("/make-server-b5fd51b8/seed/report-data", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    console.log(`[Seed] Fetching report data for user: ${userId}`);
    
    const reportData = await getSampleReportData(userId);
    
    return c.json(reportData);
  } catch (error) {
    console.error("[Seed] Error fetching report data:", error);
    return c.json({ 
      error: "Failed to fetch report data", 
      details: String(error) 
    }, 500);
  }
});

Deno.serve(app.fetch);